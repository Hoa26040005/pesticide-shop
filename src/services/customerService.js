// src/services/customerService.js
import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  increment, // Quan trọng: Dùng để cộng trừ tiền an toàn
  orderBy,
  query
} from 'firebase/firestore';

const COLLECTION_NAME = 'customers';

// 1. Lấy danh sách khách hàng (Sắp xếp theo ngày tạo mới nhất)
export const getCustomers = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ key: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Lỗi lấy danh sách khách:", error);
    return [];
  }
};

// 2. Thêm khách hàng mới
export const addCustomer = async (customerData) => {
  try {
    return await addDoc(collection(db, COLLECTION_NAME), {
      ...customerData,
      current_debt: 0, // Mới tạo thì nợ bằng 0
      total_spent: 0,  // Tổng tiền đã mua bằng 0
      created_at: serverTimestamp()
    });
  } catch (error) {
    console.error("Lỗi thêm khách:", error);
    throw error;
  }
};

// 3. Xóa khách hàng
export const deleteCustomer = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Lỗi xóa khách:", error);
    throw error;
  }
};

// 4. Cập nhật thông tin khách (Sửa tên, sđt, địa chỉ)
export const updateCustomerInfo = async (id, newData) => {
  try {
    const customerRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(customerRef, newData);
  } catch (error) {
    console.error("Lỗi cập nhật thông tin:", error);
    throw error;
  }
};

export const updateCustomer = async (id, data) => {
  try {
    const customerRef = doc(db, 'customers', id);
    await updateDoc(customerRef, {
      name: data.name,
      phone: data.phone,
      address: data.address || '',
      updated_at: serverTimestamp()
    });
  } catch (error) {
    throw error;
  }
};
// 5. (QUAN TRỌNG) Hàm cập nhật nợ
// Dùng cho 2 trường hợp:
// - Bán nợ: amountChange là số dương (VD: 500000)
// - Khách trả nợ: amountChange là số âm (VD: -200000)
export const updateDebt = async (customerId, amountChange) => {
  try {
    const customerRef = doc(db, COLLECTION_NAME, customerId);
    
    // Sử dụng increment để cộng dồn an toàn, tránh lỗi khi nhiều người thao tác cùng lúc
    await updateDoc(customerRef, {
      current_debt: increment(amountChange)
    });
  } catch (error) {
    console.error("Lỗi cập nhật nợ:", error);
    throw error;
  }
};