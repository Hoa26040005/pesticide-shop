// src/services/userService.js
import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';

/**
 * Lấy hoặc khởi tạo vai trò người dùng trong Firestore
 * Mặc định: Tài khoản đầu tiên hoặc chứa 'admin' sẽ là ADMIN, các tài khoản khác là STAFF
 */
export const getUserRole = async (uid, email) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data().role || 'STAFF';
    }

    // Nếu chưa có bản ghi, xác định vai trò mặc định
    const isFirstOrAdminEmail = email?.toLowerCase().includes('admin') || email === 'admin@gmail.com';
    const defaultRole = isFirstOrAdminEmail ? 'ADMIN' : 'STAFF';

    await setDoc(userRef, {
      uid,
      email: email || '',
      role: defaultRole,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    }, { merge: true });

    return defaultRole;
  } catch (error) {
    console.error("Lỗi lấy vai trò người dùng:", error);
    // Fallback an toàn nếu lỗi mạng: nếu email có admin thì cho admin, không thì staff
    return email?.toLowerCase().includes('admin') ? 'ADMIN' : 'STAFF';
  }
};

/**
 * Lấy danh sách toàn bộ người dùng trong hệ thống (dành cho Admin)
 */
export const getAllUsers = async () => {
  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      key: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.warn("Lấy danh sách người dùng fallback:", error);
    try {
      const snapshot = await getDocs(collection(db, USERS_COLLECTION));
      return snapshot.docs.map(doc => ({
        key: doc.id,
        ...doc.data()
      }));
    } catch (err2) {
      console.error("Lỗi lấy danh sách user:", err2);
      return [];
    }
  }
};

/**
 * Cập nhật vai trò người dùng (ADMIN hoặc STAFF)
 */
export const updateUserRole = async (uid, newRole) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      role: newRole,
      updated_at: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Lỗi cập nhật vai trò:", error);
    throw error;
  }
};
