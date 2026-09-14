// src/services/orderService.js
import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  increment, 
  serverTimestamp, 
  runTransaction, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc,
  deleteDoc, 
  arrayUnion 
} from 'firebase/firestore';

// 1. Lấy danh sách đơn hàng
export const getAllOrders = async () => {
  try {
    const q = query(collection(db, 'orders'), orderBy('created_at', 'desc')); 
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ key: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return [];
  }
};

// 2. Tạo đơn hàng mới (ĐỒNG BỘ TỒN KHO THEO LÔ FEFO + SỔ NỢ)
export const createOrder = async (orderData) => {
  try {
    // --- BƯỚC 0: TRUY VẤN LÔ HÀNG KHẢ DỤNG CHO FEFO ---
    const candidateBatchesByProduct = {};
    for (const item of orderData.items) {
      const productId = item.key || item.product_id;
      if (!candidateBatchesByProduct[productId]) {
        try {
          const batchQuery = query(
            collection(db, 'inventory_batches'),
            where('product_id', '==', productId),
            where('quantity', '>', 0),
            orderBy('expiry_date', 'asc')
          );
          const batchSnap = await getDocs(batchQuery);
          candidateBatchesByProduct[productId] = batchSnap.docs.map(d => ({
            id: d.id,
            ref: d.ref,
            data: d.data()
          }));
        } catch (batchErr) {
          // Fallback nếu thiếu composite index
          console.warn("FEFO query fallback:", batchErr);
          const fallbackQuery = query(
            collection(db, 'inventory_batches'),
            where('product_id', '==', productId)
          );
          const fallbackSnap = await getDocs(fallbackQuery);
          const docs = fallbackSnap.docs
            .map(d => ({ id: d.id, ref: d.ref, data: d.data() }))
            .filter(b => (Number(b.data.quantity) || 0) > 0)
            .sort((a, b) => new Date(a.data.expiry_date || 0) - new Date(b.data.expiry_date || 0));
          candidateBatchesByProduct[productId] = docs;
        }
      }
    }

    await runTransaction(db, async (transaction) => {
      // --- BƯỚC 1: ĐỌC TẤT CẢ DỮ LIỆU CẦN THIẾT TRƯỚC (READS) ---
      
      // 1.1. Đọc thông tin tồn kho của tất cả sản phẩm trong đơn
      const productReads = [];
      for (const item of orderData.items) {
        const productId = item.key || item.product_id;
        const productRef = doc(db, 'products', productId);
        productReads.push({ ref: productRef, item: item });
      }
      
      const productSnaps = [];
      for (const p of productReads) {
        const snap = await transaction.get(p.ref);
        if (!snap.exists()) throw new Error(`Sản phẩm ${p.item.name} không tồn tại!`);
        productSnaps.push({ snap, ...p });
      }

      // 1.2. Đọc các document lô hàng khả dụng trong transaction để khóa tài nguyên
      const batchSnapsMap = {}; 
      for (const productId of Object.keys(candidateBatchesByProduct)) {
        for (const candidate of candidateBatchesByProduct[productId]) {
          const bSnap = await transaction.get(candidate.ref);
          if (bSnap.exists()) {
            batchSnapsMap[candidate.id] = { ref: candidate.ref, snap: bSnap, data: bSnap.data() };
          }
        }
      }

      // 1.3. Đọc thông tin khách hàng (nếu có bán nợ)
      let customerRef = null;
      if (orderData.customer_id) {
        customerRef = doc(db, 'customers', orderData.customer_id);
        await transaction.get(customerRef); 
      }

      // --- BƯỚC 2: TÍNH TOÁN LOGIC (KHÔNG GỌI DB) ---
      
      // 2.1. Kiểm tra tồn kho tổng
      for (const p of productSnaps) {
        const currentStock = Number(p.snap.data().quantity || 0);
        if (currentStock < p.item.quantity) {
          throw new Error(`Sản phẩm ${p.item.name} không đủ hàng (Còn: ${currentStock})`);
        }
      }

      // 2.2. Phân bổ trừ số lượng theo lô FEFO (First Expired First Out)
      const batchUpdates = []; 
      const itemsWithBatchAndProfit = [];
      let totalProfit = 0;

      for (const item of orderData.items) {
        const productId = item.key || item.product_id;
        const snapData = productSnaps.find(p => (p.item.key === item.key || p.item.product_id === item.product_id)).snap.data();
        const importPrice = Number(snapData.import_price || 0);
        const profit = (item.price - importPrice) * item.quantity;
        totalProfit += profit;

        let needed = Number(item.quantity);
        const batchDeductions = [];

        // Lấy danh sách lô của sản phẩm này và sắp xếp theo expiry_date
        const productBatches = (candidateBatchesByProduct[productId] || [])
          .map(cb => batchSnapsMap[cb.id])
          .filter(Boolean)
          .sort((a, b) => new Date(a.data.expiry_date || 0) - new Date(b.data.expiry_date || 0));

        for (const b of productBatches) {
          if (needed <= 0) break;
          const currentBatchQty = Number(b.data.quantity || 0);
          if (currentBatchQty <= 0) continue;

          const deduct = Math.min(needed, currentBatchQty);
          needed -= deduct;
          const remainingBatchQty = currentBatchQty - deduct;
          b.data.quantity = remainingBatchQty; 

          batchDeductions.push({
            batch_id: b.snap.id,
            batch_code: b.data.batch_code || 'N/A',
            quantity: deduct,
            expiry_date: b.data.expiry_date || ''
          });

          batchUpdates.push({
            ref: b.ref,
            quantity: remainingBatchQty
          });
        }

        itemsWithBatchAndProfit.push({
          ...item,
          original_import_price: importPrice,
          profit: profit,
          batch_deductions: batchDeductions
        });
      }

      // 2.3. Tính toán tài chính & Công nợ
      const total = orderData.total_amount;
      const paid = orderData.amount_paid || 0;
      const debt = total - paid;

      // --- BƯỚC 3: THỰC HIỆN GHI DỮ LIỆU (WRITES) ---

      // 3.1. Tạo đơn hàng mới
      const newOrderRef = doc(collection(db, 'orders'));
      transaction.set(newOrderRef, {
        ...orderData,
        items: itemsWithBatchAndProfit,     
        total_profit: totalProfit,  
        amount_debt: debt,
        amount_paid: paid,
        payment_method: debt > 0 ? (paid === 0 ? 'DEBT' : 'PARTIAL') : 'CASH',
        created_at: serverTimestamp()
      });

      // 3.2. Trừ tồn kho tổng ở products
      for (const p of productSnaps) {
        const newQty = (Number(p.snap.data().quantity) || 0) - p.item.quantity;
        transaction.update(p.ref, { quantity: newQty });
      }

      // 3.3. Cập nhật tồn kho từng lô trong inventory_batches theo FEFO
      for (const bu of batchUpdates) {
        transaction.update(bu.ref, { quantity: bu.quantity });
      }

      // 3.4. Cập nhật nợ khách hàng (nếu có nợ)
      if (customerRef && debt > 0) {
        transaction.update(customerRef, { 
          current_debt: increment(debt),
          last_debt_date: new Date().toISOString(),
          updated_at: serverTimestamp()
        });

        const debtHistoryRef = doc(collection(customerRef, 'debt_history'));
        transaction.set(debtHistoryRef, {
          order_id: newOrderRef.id,
          amount: debt,
          total_amount: total,
          paid_amount: paid,
          date: new Date().toISOString(),
          type: 'new_debt',
          description: `Mua đơn hàng #${newOrderRef.id.slice(-6)}`,
          created_at: serverTimestamp()
        });
      }
    });
    return true;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

// 3. Xóa đơn hàng (HOÀN KHO TỔNG + HOÀN LÔ FEFO + TRỪ NỢ)
export const deleteOrder = async (orderId) => {
  try {
    await runTransaction(db, async (transaction) => {
      // --- READS ---
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await transaction.get(orderRef);
      
      if (!orderSnap.exists()) throw new Error("Đơn hàng không tồn tại!");
      const orderData = orderSnap.data();

      // Đọc thông tin sản phẩm để lấy ref và lock
      const productReads = [];
      for (const item of (orderData.items || [])) {
        const productId = item.key || item.product_id;
        const productRef = doc(db, 'products', productId);
        await transaction.get(productRef); 
        productReads.push({ ref: productRef, qty: item.quantity });
      }

      // Đọc thông tin các lô hàng cần hoàn số lượng
      const batchRefunds = [];
      for (const item of (orderData.items || [])) {
        if (Array.isArray(item.batch_deductions)) {
          for (const deduction of item.batch_deductions) {
            if (deduction.batch_id) {
              const bRef = doc(db, 'inventory_batches', deduction.batch_id);
              const bSnap = await transaction.get(bRef);
              if (bSnap.exists()) {
                batchRefunds.push({ ref: bRef, qty: Number(deduction.quantity || 0) });
              }
            }
          }
        }
      }

      // Đọc thông tin khách hàng nếu cần trừ nợ
      let customerRef = null;
      if (orderData.customer_id && orderData.amount_debt > 0) {
        customerRef = doc(db, 'customers', orderData.customer_id);
        await transaction.get(customerRef);
      }

      // --- WRITES ---
      
      // 1. Hoàn kho tổng
      for (const p of productReads) {
        transaction.update(p.ref, { quantity: increment(p.qty) });
      }

      // 2. Hoàn lại từng lô hàng
      for (const br of batchRefunds) {
        transaction.update(br.ref, { quantity: increment(br.qty) });
      }

      // 3. Trừ nợ khách hàng
      if (customerRef) {
        transaction.update(customerRef, { 
          current_debt: increment(-orderData.amount_debt) 
        });

        const debtHistoryRef = doc(collection(customerRef, 'debt_history'));
        transaction.set(debtHistoryRef, {
          order_id: orderId,
          amount_change: -orderData.amount_debt,
          date: new Date().toISOString(),
          type: 'debt_decrease',
          description: `Hủy đơn hàng #${orderId.slice(-6)}`,
          created_at: serverTimestamp()
        });
      }

      // 4. Xóa đơn
      transaction.delete(orderRef);
    });
  } catch (error) {
    console.error("Lỗi xóa đơn:", error);
    throw error;
  }
};

// 4. Thanh toán thêm nợ (Giữ nguyên logic cũ nhưng đảm bảo thứ tự)
export const addPaymentToOrder = async (orderId, paymentAmount, userEmail) => {
  try {
    await runTransaction(db, async (transaction) => {
      // READS
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) throw "Order does not exist!";
      
      const orderData = orderSnap.data();
      
      let customerRef = null;
      if (orderData.customer_id) {
          customerRef = doc(db, 'customers', orderData.customer_id);
          await transaction.get(customerRef);
      }

      // CALCS
      const currentDebt = orderData.amount_debt || 0;
      if (paymentAmount > currentDebt) throw new Error("Số tiền trả vượt quá số nợ!");

      const newPaid = (orderData.amount_paid || 0) + paymentAmount;
      const newDebt = currentDebt - paymentAmount;

      // WRITES
      transaction.update(orderRef, {
        amount_paid: newPaid,
        amount_debt: newDebt,
        payment_method: newDebt <= 0 ? 'CASH' : 'PARTIAL', 
        history_logs: arrayUnion({
            date: new Date().toISOString(), 
            user: userEmail || 'Unknown',   
            paid_amount: paymentAmount,     
            remaining_debt: newDebt,  
            action: 'Thanh toán thêm'
        })
      });

      if (customerRef) {
        transaction.update(customerRef, {
          current_debt: increment(-paymentAmount),
          last_debt_date: new Date().toISOString(),
          updated_at: serverTimestamp()
        });

        const debtHistoryRef = doc(collection(customerRef, 'debt_history'));
        transaction.set(debtHistoryRef, {
          order_id: orderId,
          amount_paid: paymentAmount,
          remaining_debt: newDebt,
          total_amount: orderData.total_amount,
          date: new Date().toISOString(),
          type: 'payment',
          description: `Thanh toán nợ đơn #${orderId.slice(-6)}`,
          user: userEmail,
          created_at: serverTimestamp()
        });
      }
    });
  } catch (error) {
    console.error("Error adding payment:", error);
    throw error;
  }
};

// 5. Cập nhật số tiền đã trả
export const updateOrderPayment = async (orderId, newAmountPaid, userEmail) => {
  try {
    await runTransaction(db, async (transaction) => {
      // READS
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) throw new Error("Order does not exist!");
      
      const orderData = orderSnap.data();
      
      let customerRef = null;
      if (orderData.customer_id) {
          customerRef = doc(db, 'customers', orderData.customer_id);
          await transaction.get(customerRef);
      }

      // CALCS
      const oldDebt = orderData.amount_debt || 0;
      const newDebt = orderData.total_amount - newAmountPaid;
      const diff = newDebt - oldDebt;

      // WRITES
      transaction.update(orderRef, {
        amount_paid: newAmountPaid,
        amount_debt: newDebt,
        payment_method: newDebt > 0 ? (newAmountPaid === 0 ? 'DEBT' : 'PARTIAL') : 'CASH',
        history_logs: arrayUnion({
            date: new Date().toISOString(), 
            user: userEmail || 'Unknown',   
            old_paid: orderData.amount_paid,              
            new_paid: newAmountPaid,        
            action: 'Sửa số tiền đã trả'
        })
      });

      if (customerRef) {
        transaction.update(customerRef, {
          current_debt: increment(diff),
          last_debt_date: new Date().toISOString(),
          updated_at: serverTimestamp()
        });

        if (diff !== 0) {
          const debtHistoryRef = doc(collection(customerRef, 'debt_history'));
          transaction.set(debtHistoryRef, {
            order_id: orderId,
            amount_change: diff,
            new_amount: newDebt,
            old_amount: oldDebt,
            total_amount: orderData.total_amount,
            date: new Date().toISOString(),
            type: diff > 0 ? 'debt_increase' : 'debt_decrease',
            description: diff > 0 ? `Tăng nợ đơn #${orderId.slice(-6)}` : `Giảm nợ đơn #${orderId.slice(-6)}`,
            user: userEmail,
            created_at: serverTimestamp()
          });
        }
      }
    });
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

// 6. Lấy lịch sử nợ
export const getDebtHistoryByCustomer = async (customerId) => {
  try {
    if (!customerId) return [];
    const customerRef = doc(db, 'customers', customerId);
    const q = query(collection(customerRef, 'debt_history'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ key: doc.id, ...doc.data() }));
  } catch (error) { return []; }
};

// 7. Lấy lịch sử đơn hàng
export const getOrdersByCustomer = async (customerId) => {
  try {
    const q = query(
      collection(db, 'orders'), 
      where('customer_id', '==', customerId), 
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ key: doc.id, ...doc.data() }));
  } catch (error) { return []; }
};