// src/services/productService.js
import { db, storage } from '../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, updateDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const PRODUCT_COLLECTION = 'products';
const CATEGORY_COLLECTION = 'categories'; // Bảng mới chuyên lưu tên các loại

// --- PHẦN XỬ LÝ SẢN PHẨM (GIỮ NGUYÊN) ---

export const getProducts = async () => {
  const querySnapshot = await getDocs(collection(db, PRODUCT_COLLECTION));
  const data = [];
  querySnapshot.forEach((doc) => {
    data.push({ key: doc.id, ...doc.data() });
  });
  return data;
};

export const addProduct = async (productData) => {
  const docRef = await addDoc(collection(db, PRODUCT_COLLECTION), {
    ...productData,
    stock: productData.stock || 0,
    created_at: serverTimestamp()
  });
  return docRef.id;
};

export const deleteProduct = async (id) => {
  await deleteDoc(doc(db, PRODUCT_COLLECTION, id));
};

export const updateProduct = async (id, productData) => {
  const productRef = doc(db, PRODUCT_COLLECTION, id);
  await updateDoc(productRef, productData);
};

export const uploadImage = async (file) => {
  if (!file) return null;
  const fileName = `products/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, fileName);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

// --- PHẦN MỚI: XỬ LÝ DANH MỤC ĐỘNG ---

// 1. Lấy toàn bộ danh sách loại đang có
export const getCategories = async () => {
  const querySnapshot = await getDocs(collection(db, CATEGORY_COLLECTION));
  const data = [];
  querySnapshot.forEach((doc) => {
    data.push({ value: doc.data().name }); // Format đúng chuẩn cho AutoComplete Antd
  });
  
  // Nếu chưa có gì (lần đầu chạy), trả về danh sách mặc định
  if (data.length === 0) {
     return [
        { value: 'Thuốc trừ sâu' },
        { value: 'Thuốc diệt cỏ' },
        { value: 'Thuốc trừ nấm' },
        { value: 'Phân bón lá' },
        { value: 'Phân bón gốc' },
     ];
  }
  return data;
};

// 2. Kiểm tra và Lưu loại mới (Nếu chưa có thì thêm vào)
export const saveCategoryIfNotExist = async (categoryName) => {
    if (!categoryName) return;
    
    // Tìm xem tên này đã có trong bảng categories chưa
    const q = query(collection(db, CATEGORY_COLLECTION), where("name", "==", categoryName));
    const querySnapshot = await getDocs(q);

    // Nếu chưa có -> Thêm mới
    if (querySnapshot.empty) {
        await addDoc(collection(db, CATEGORY_COLLECTION), {
            name: categoryName
        });
    }
};