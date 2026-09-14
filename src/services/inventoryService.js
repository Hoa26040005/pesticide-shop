// src/services/inventoryService.js
import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  runTransaction, 
  serverTimestamp, 
  query, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';

const BATCH_COLLECTION = 'inventory_batches'; 
const PRODUCT_COLLECTION = 'products';        

// 1. Hàm Nhập Kho (Đã sửa lỗi Transaction Read/Write Order)
export const importProduct = async (data) => {
  try {
    await runTransaction(db, async (transaction) => {
      // --- BƯỚC 1: THỰC HIỆN TẤT CẢ CÁC LỆNH ĐỌC (READ) TRƯỚC ---
      const productRef = doc(db, PRODUCT_COLLECTION, data.product_id);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new Error("Sản phẩm không tồn tại trong hệ thống!");
      }

      // --- BƯỚC 2: TÍNH TOÁN DỮ LIỆU ---
      // Tạo reference cho lô hàng mới (tạo ID trước nhưng chưa ghi)
      const newBatchRef = doc(collection(db, BATCH_COLLECTION));
      
      const currentData = productSnap.data();
      const currentQty = Number(currentData.quantity || 0);
      const newStock = currentQty + Number(data.quantity);

      // --- BƯỚC 3: THỰC HIỆN CÁC LỆNH GHI (WRITE) ---
      
      // A. Ghi lô hàng mới
      transaction.set(newBatchRef, {
        product_id: data.product_id,    
        product_name: data.product_name,
        sku: data.sku,                  
        batch_code: data.batch_code,    
        expiry_date: data.expiry_date,  
        quantity: Number(data.quantity),         
        initial_quantity: Number(data.quantity), 
        import_price: Number(data.import_price), 
        import_date: new Date().toISOString(),
        created_at: serverTimestamp()
      });

      // B. Cập nhật tồn kho tổng
      transaction.update(productRef, { 
          quantity: newStock,
          // Cập nhật giá nhập mới nhất
          import_price: Number(data.import_price || currentData.import_price),
          // Cập nhật hạn dùng hiển thị (lấy theo lô mới nhất vừa nhập)
          expiry_date: new Date(data.expiry_date),
          updated_at: serverTimestamp()
      });
    });
    
    return "Success";
  } catch (error) {
    console.error("Lỗi nhập kho:", error);
    throw error;
  }
};

// 2. Hàm lấy danh sách các lô hàng đang có trong kho
export const getBatches = async () => {
  try {
    const q = query(collection(db, BATCH_COLLECTION), orderBy('expiry_date', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ key: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Lỗi lấy danh sách lô hàng:", error);
    return [];
  }
};