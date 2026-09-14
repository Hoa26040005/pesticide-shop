// src/services/logService.js
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// 1. Hàm ghi lại hoạt động (Dùng ở bất cứ đâu trong App)
export const logActivity = async (action, target, description = "") => {
  try {
    const auth = getAuth();
    const userEmail = auth.currentUser ? auth.currentUser.email : 'Unknown/System';

    await addDoc(collection(db, 'system_logs'), {
      action: action,          // Ví dụ: "Xóa đơn hàng", "Sửa giá"
      target: target,          // Ví dụ: "Đơn #12345", "Thuốc A"
      description: description,// Chi tiết: "Sửa từ 50k -> 60k"
      user: userEmail,         // Ai làm?
      created_at: serverTimestamp() // Thời gian server
    });
    console.log("Log saved:", action);
  } catch (error) {
    console.error("Lỗi ghi log (không ảnh hưởng luồng chính):", error);
    // Không throw lỗi để tránh làm gián đoạn việc bán hàng
  }
};

// 2. Hàm lấy danh sách nhật ký (Dùng cho trang Xem Nhật Ký)
export const getSystemLogs = async (limitCount = 100) => {
  try {
    const q = query(
      collection(db, 'system_logs'), 
      orderBy('created_at', 'desc'), 
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      key: doc.id, 
      ...doc.data(),
      // Chuyển timestamp thành Date object để dễ hiển thị
      created_at: doc.data().created_at ? doc.data().created_at : new Date() 
    }));
  } catch (error) {
    console.error("Lỗi lấy danh sách log:", error);
    return [];
  }
};