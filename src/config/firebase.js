// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  CACHE_SIZE_UNLIMITED, 
  enableIndexedDbPersistence 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Cấu hình chuẩn lấy từ biến môi trường (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBIJVSzkZtw7w0T7E7ZwLi54HyEf_gbP-0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pesticide-shop.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pesticide-shop",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pesticide-shop.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "489153825680",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:489153825680:web:d6b3ae3e522b7b591c8115",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NGZ0FEPNGH"
};

// 1. Khởi tạo Firebase App
const app = initializeApp(firebaseConfig);

// 2. Khởi tạo Auth và Storage
const auth = getAuth(app);
const storage = getStorage(app);

// 3. Khởi tạo Firestore với cấu hình Cache đặc biệt (Quan trọng cho Offline)
// Lưu ý: Dùng initializeFirestore thay vì getFirestore để set cache size
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// 4. --- KÍCH HOẠT CHẾ ĐỘ OFFLINE (PERSISTENCE) ---
// Dữ liệu sẽ được lưu vào IndexedDB của trình duyệt
enableIndexedDbPersistence(db)
  .catch((err) => {
      if (err.code === 'failed-precondition') {
          // Lỗi này xảy ra khi bạn mở nhiều tab cùng lúc
          console.warn('Persistence failed: Multiple tabs open.');
      } else if (err.code === 'unimplemented') {
          // Trình duyệt không hỗ trợ (ví dụ trình duyệt quá cũ)
          console.warn('Persistence is not available in this browser.');
      }
  });

// 5. Xuất các biến để dùng trong App
export { db, auth, storage, app };