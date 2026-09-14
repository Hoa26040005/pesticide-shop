// src/services/reportService.js
import { db } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp,
  getDoc,
  doc
} from 'firebase/firestore';
import moment from 'moment';

// 1. Lấy doanh thu theo khoảng thời gian (CẬP NHẬT TÍNH LỢI NHUẬN)
export const getRevenueReport = async (startDate, endDate) => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('created_at', '>=', Timestamp.fromDate(startDate)),
      where('created_at', '<=', Timestamp.fromDate(endDate)),
      orderBy('created_at', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({ 
      key: doc.id, 
      ...doc.data() 
    }));

    // Tính toán các chỉ số
    let totalRevenue = 0;
    let totalPaid = 0;
    let totalDebt = 0;
    let totalProfit = 0; // Thêm biến lợi nhuận
    let cashOrders = 0;
    let debtOrders = 0;
    let partialOrders = 0;

    orders.forEach(order => {
      const amountPaid = order.amount_paid || (order.payment_method === 'CASH' ? order.total_amount : 0);
      const amountDebt = order.amount_debt || (order.payment_method === 'DEBT' ? order.total_amount : 0);
      
      totalRevenue += (order.total_amount || 0);
      totalPaid += (amountPaid || 0);
      totalDebt += (amountDebt || 0);
      totalProfit += (order.total_profit || 0); // Cộng dồn lợi nhuận

      if (order.payment_method === 'CASH') cashOrders++;
      else if (order.payment_method === 'DEBT') debtOrders++;
      else partialOrders++;
    });

    return {
      orders,
      summary: {
        totalRevenue,
        totalPaid,
        totalDebt,
        totalProfit, // Trả về tổng lợi nhuận
        cashOrders,
        debtOrders,
        partialOrders,
        totalOrders: orders.length
      },
      dailyBreakdown: getDailyBreakdown(orders)
    };
  } catch (error) {
    console.error("Error getting revenue report:", error);
    return { orders: [], summary: {}, dailyBreakdown: [] };
  }
};

// Bộ nhớ đệm báo cáo trong phiên (In-Memory Session Cache)
const reportCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // Lưu đệm 60 giây để tránh quét DB liên tục khi chuyển tab

export const clearReportCache = () => {
  reportCache.clear();
};

// 2. Lấy danh sách nợ theo khoảng thời gian (TỐI ƯU HÓA TRUY VẤN & PARALLEL FETCH)
export const getDebtReport = async (startDate, endDate) => {
  try {
    let debtOrders = [];
    
    // Thử truy vấn trực tiếp các đơn có công nợ > 0 để tránh tải toàn bộ đơn tiền mặt
    try {
      const qDebt = query(
        collection(db, 'orders'),
        where('created_at', '>=', Timestamp.fromDate(startDate)),
        where('created_at', '<=', Timestamp.fromDate(endDate)),
        where('amount_debt', '>', 0),
        orderBy('amount_debt', 'desc')
      );
      const snapshot = await getDocs(qDebt);
      debtOrders = snapshot.docs.map(d => ({ key: d.id, ...d.data() }));
    } catch (queryErr) {
      // Fallback khi Firestore chưa có composite index: quét theo ngày rồi lọc client
      console.warn("Index chưa sẵn sàng, dùng fallback query cho debt report:", queryErr);
      const qFallback = query(
        collection(db, 'orders'),
        where('created_at', '>=', Timestamp.fromDate(startDate)),
        where('created_at', '<=', Timestamp.fromDate(endDate)),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(qFallback);
      debtOrders = snapshot.docs
        .map(d => ({ key: d.id, ...d.data() }))
        .filter(order => {
          return (Number(order.amount_debt) || 0) > 0 || 
                 order.payment_method === 'DEBT' || 
                 (order.payment_method === 'PARTIAL' && (Number(order.amount_paid) || 0) < Number(order.total_amount));
        });
    }

    // TỐI ƯU HÓA: Đọc thông tin khách hàng song song (Parallel) & Deduplicate (chỉ đọc 1 lần mỗi khách)
    const uniqueCustomerIds = [...new Set(debtOrders.map(o => o.customer_id).filter(Boolean))];
    const customerInfoMap = {};

    await Promise.all(uniqueCustomerIds.map(async (cid) => {
      try {
        const cSnap = await getDoc(doc(db, 'customers', cid));
        if (cSnap.exists()) {
          customerInfoMap[cid] = cSnap.data();
        }
      } catch (err) {
        console.warn(`Không thể lấy thông tin khách ${cid}:`, err);
      }
    }));

    const customers = {};
    let totalDebt = 0;

    for (const order of debtOrders) {
      const customerId = order.customer_id;
      if (!customerId) continue; 
      
      if (!customers[customerId]) {
        const customerData = customerInfoMap[customerId] || {};
        const customerName = customerData.name || order.customer_name || 'Không tên';
        const customerPhone = customerData.phone || '';
        const customerAddress = customerData.address || '';
        
        customers[customerId] = {
          customer_id: customerId,
          customer_name: customerName,
          phone: customerPhone,
          address: customerAddress,
          total_debt: 0,
          orders: []
        };
      }
      
      const debtAmount = Number(order.amount_debt) || 
                        (order.payment_method === 'DEBT' ? Number(order.total_amount) : 
                        (order.payment_method === 'PARTIAL' ? (Number(order.total_amount) - (Number(order.amount_paid) || 0)) : 0));
      
      customers[customerId].total_debt += debtAmount;
      customers[customerId].orders.push({
        order_id: order.key,
        date: order.created_at,
        total_amount: order.total_amount,
        amount_paid: order.amount_paid || 0,
        amount_debt: debtAmount,
        payment_method: order.payment_method
      });
      
      totalDebt += debtAmount;
    }

    return {
      debtOrders,
      customerDebts: Object.values(customers).sort((a, b) => b.total_debt - a.total_debt),
      summary: {
        totalDebt,
        totalDebtOrders: debtOrders.length,
        totalDebtCustomers: Object.keys(customers).length
      }
    };
  } catch (error) {
    console.error("Error getting debt report:", error);
    return { debtOrders: [], customerDebts: [], summary: {} };
  }
};

// 3. Lấy danh sách khách hàng nợ hiện tại (TỐI ƯU HÓA QUERY TRỰC TIẾP)
export const getCurrentDebtCustomers = async () => {
  try {
    let customers = [];
    try {
      // Truy vấn trực tiếp khách hàng có nợ > 0
      const q = query(collection(db, 'customers'), where('current_debt', '>', 0));
      const customersSnapshot = await getDocs(q);
      customers = customersSnapshot.docs.map(d => ({ key: d.id, ...d.data() }));
    } catch (queryErr) {
      // Fallback quét toàn bộ nếu thiếu index
      const customersSnapshot = await getDocs(collection(db, 'customers'));
      customers = customersSnapshot.docs
        .map(d => ({ key: d.id, ...d.data() }))
        .filter(c => (Number(c.current_debt) || 0) > 0);
    }

    const debtCustomers = customers.filter(c => (Number(c.current_debt) || 0) > 0);
    debtCustomers.sort((a, b) => (Number(b.current_debt) || 0) - (Number(a.current_debt) || 0));

    const totalCurrentDebt = debtCustomers.reduce((sum, customer) => sum + (Number(customer.current_debt) || 0), 0);

    return {
      debtCustomers,
      summary: {
        totalCurrentDebt,
        totalDebtCustomers: debtCustomers.length
      }
    };
  } catch (error) {
    console.error("Error getting current debt customers:", error);
    return { debtCustomers: [], summary: {} };
  }
};

// 4. Lấy báo cáo tổng hợp (TÍCH HỢP CACHE THỜI GIAN THỰC)
export const getCombinedReport = async (period = 'day', customStartDate = null, customEndDate = null, forceRefresh = false) => {
  let startDate, endDate;
  const now = moment();

  switch (period) {
    case 'day':
      startDate = now.clone().startOf('day').toDate();
      endDate = now.clone().endOf('day').toDate();
      break;
    case 'week':
      startDate = now.clone().startOf('week').toDate();
      endDate = now.clone().endOf('week').toDate();
      break;
    case 'month':
      startDate = now.clone().startOf('month').toDate();
      endDate = now.clone().endOf('month').toDate();
      break;
    case 'year':
      startDate = now.clone().startOf('year').toDate();
      endDate = now.clone().endOf('year').toDate();
      break;
    case 'custom':
      if (customStartDate && customEndDate) {
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        startDate = now.clone().startOf('day').toDate();
        endDate = now.clone().endOf('day').toDate();
      }
      break;
    default:
      startDate = now.clone().startOf('day').toDate();
      endDate = now.clone().endOf('day').toDate();
  }

  const cacheKey = `${period}_${startDate.getTime()}_${endDate.getTime()}`;
  if (!forceRefresh && reportCache.has(cacheKey)) {
    const cached = reportCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  try {
    const [revenueReport, debtReport, currentDebt] = await Promise.all([
      getRevenueReport(startDate, endDate),
      getDebtReport(startDate, endDate),
      getCurrentDebtCustomers()
    ]);

    const result = {
      period,
      startDate,
      endDate,
      revenue: revenueReport,
      debt: debtReport,
      currentDebt
    };

    reportCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (error) {
    console.error("Error getting combined report:", error);
    throw error;
  }
};

// 5. Lấy chi tiết khách hàng (GIỮ NGUYÊN)
export const getCustomerDetails = async (customerId) => {
  try {
    const customerDoc = await getDoc(doc(db, 'customers', customerId));
    if (!customerDoc.exists()) {
      throw new Error('Khách hàng không tồn tại');
    }
    
    return { key: customerDoc.id, ...customerDoc.data() };
  } catch (error) {
    console.error("Error getting customer details:", error);
    throw error;
  }
};

// Hàm phụ trợ: Phân tích doanh thu theo ngày (CẬP NHẬT TÍNH LỢI NHUẬN NGÀY)
const getDailyBreakdown = (orders) => {
  const dailyData = {};
  
  orders.forEach(order => {
    if (!order.created_at) return;
    
    const date = moment(order.created_at.toDate()).format('DD/MM/YYYY');
    if (!dailyData[date]) {
      dailyData[date] = {
        date,
        revenue: 0,
        paid: 0,
        debt: 0,
        profit: 0, // Thêm trường lợi nhuận ngày
        orders: 0
      };
    }
    
    const amountPaid = order.amount_paid || (order.payment_method === 'CASH' ? order.total_amount : 0);
    const amountDebt = order.amount_debt || (order.payment_method === 'DEBT' ? order.total_amount : 0);
    
    dailyData[date].revenue += (order.total_amount || 0);
    dailyData[date].paid += (amountPaid || 0);
    dailyData[date].debt += (amountDebt || 0);
    dailyData[date].profit += (order.total_profit || 0); // Cộng dồn lợi nhuận
    dailyData[date].orders++;
  });

  return Object.values(dailyData).sort((a, b) => {
    const dateA = moment(a.date, 'DD/MM/YYYY');
    const dateB = moment(b.date, 'DD/MM/YYYY');
    return dateA - dateB;
  });
};