# 🌱 Pesticide Shop - Hệ Thống Quản Lý Cửa Hàng Thuốc BVTV & Nông Dược

<p align="center">
  <img src="public/icon.ico" alt="Pesticide Shop Logo" width="100" height="100" />
</p>

<p align="center">
  <strong>Giải pháp chuyển đổi số toàn diện cho các đại lý, cửa hàng kinh doanh Thuốc Bảo Vệ Thực Vật, Phân bón và Vật tư Nông nghiệp.</strong>
</p>

<p align="center">
  <a href="https://pesticide-shop.web.app/"><img src="https://img.shields.io/badge/Live_Demo-pesticide--shop.web.app-00B14F?style=for-the-badge&logo=firebase&logoColor=white" alt="Live Demo" /></a>
  <a href="#-tính-năng-cốt-lõi"><img src="https://img.shields.io/badge/Status-Production--Ready-success?style=for-the-badge" alt="Status" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-Rolldown-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://ant.design/"><img src="https://img.shields.io/badge/Ant_Design-6.1-0170FE?style=for-the-badge&logo=antdesign&logoColor=white" alt="Ant Design" /></a>
  <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" /></a>
  <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Electron-Desktop_App-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron" /></a>
  <a href="https://huggingface.co/"><img src="https://img.shields.io/badge/AI-Face_ID_Login-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black" alt="Face Recognition" /></a>
</p>

> 🌐 **Website Ứng Dụng Thực Tế (Live Production):** [https://pesticide-shop.web.app/](https://pesticide-shop.web.app/)  
> 💻 **Bản Cài Đặt Desktop Windows (.exe):** Sẵn sàng trong thư mục release / build qua Electron.

---

## 📖 Mục Lục

1. [Giới Thiệu Dự Án](#-giới-thiệu-dự-án)
2. [Tính Năng Cốt Lõi](#-tính-năng-cốt-lõi)
3. [Điểm Sáng Công Nghệ & Nghiệp Vụ](#-điểm-sáng-công-nghệ--nghiệp-vụ)
4. [Kiến Trúc Kỹ Thuật (Tech Stack)](#-kiến-trúc-kỹ-thuật-tech-stack)
5. [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục-project-structure)
6. [Hướng Dẫn Cài Đặt & Chạy Thử](#-hướng-dẫn-cài-đặt--chạy-thử)
7. [Cấu Hình Môi Trường (.env)](#-cấu-hình-môi-trường-env)
8. [Đóng Gói Ứng Dụng Desktop (.EXE)](#-đóng-gói-ứng-dụng-desktop-exe)
9. [Bảo Mật & Phân Quyền (RBAC & Rules)](#-bảo-mật--phân-quyền-rbac--rules)
10. [Lộ Trình Phát Triển (Roadmap)](#-lộ-trình-phát-triển-roadmap)

---

## 📌 Giới Thiệu Dự Án

**Pesticide Shop** được thiết kế chuyên biệt để giải quyết những bài toán hóc búa nhất trong ngành bán lẻ Nông dược & Vật tư nông nghiệp:
- **Hạn sử dụng & Lô sản xuất (Batch / Expiry):** Thuốc BVTV có hạn dùng nghiêm ngặt, việc bán thuốc hết date dẫn đến vi phạm pháp luật và thiệt hại mùa màng của nông dân.
- **Bán chịu theo mùa vụ (Debt Management):** Nông dân lấy thuốc/phân bón đầu mùa và thanh toán sau thu hoạch, đòi hỏi theo dõi hạn mức tín dụng và lịch sử biến động nợ chi tiết từng kỳ.
- **Tốc độ bán lẻ tại quầy (POS):** Hỗ trợ barcode scanner, tìm kiếm nhanh theo tên hoạt chất/thương phẩm, xuất hóa đơn nhiệt và thanh toán chuyển khoản mã QR VietQR động.
- **Bảo mật sinh trắc học AI:** Đăng nhập một chạm bằng Face ID qua AI Model kết hợp tự động khóa màn hình chống nhân viên thao tác trái phép.

---

## ✨ Tính Năng Cốt Lõi

### 1. 📦 Quản Lý Kho & Thuật Toán FEFO (First Expired, First Out)
- **Quản lý theo Lô & Hạn sử dụng:** Mỗi lần nhập hàng được lưu thành một lô độc lập (`inventory_batches`) với mã lô, giá nhập, hạn sử dụng.
- **Tự động xuất kho thông minh (FEFO):** Khi xuất bán tại POS, hệ thống tự động ưu tiên trừ số lượng ở lô có hạn sử dụng gần nhất.
- **Cảnh báo hạn dùng:** Tự động gắn nhãn cảnh báo các lô hàng sắp hết hạn trong 30, 60, 90 ngày.

### 2. ⚡ Màn Hình Bán Hàng Tại Quầy (POS Screen)
- Tìm kiếm tức thời theo tên thương phẩm, SKU, hoạt chất hoặc quét mã vạch (Barcode Scanner).
- Giỏ hàng trực quan, hỗ trợ điều chỉnh số lượng và đơn giá nhanh.
- Thanh toán linh hoạt: Tiền mặt, Chuyển khoản QR (VietQR tự động generate số tiền) hoặc Ghi nợ vào sổ nông dân.
- Hỗ trợ in hóa đơn tức thì (Bill in nhiệt K80/K58 hoặc khổ A4/A5 qua `react-to-print`).

### 3. 📒 Quản Lý Sổ Nợ Khách Hàng (Mùa Vụ Nông Dân)
- Quản lý danh bạ khách hàng, hạn mức tín dụng nợ tối đa cho phép.
- Nhật ký ghi nợ / trả nợ tự động theo từng hóa đơn bán hàng.
- Lịch sử biến động nợ minh bạch (`debt_history`), lưu vết chính xác số dư nợ trước và sau mỗi giao dịch.
- Cảnh báo vượt hạn mức nợ ngay khi nhân viên lên đơn bán hàng.

### 4. 👤 Xác Thực Sinh Trắc Học Face ID & An Toàn Đăng Nhập
- **Face ID Microservice:** Tích hợp nhận diện khuôn mặt thời gian thực sử dụng Camera/Webcam thông qua Server AI chuyên dụng trên Hugging Face.
- **Offline Model Fallback:** Tích hợp mô hình SSD MobileNet V1 & Face Landmark 68 chạy trên trình duyệt bằng `@vladmandic/face-api`.
- **Tự động bảo vệ (Auto Logout):** Hook `useAutoLogout` giám sát thao tác bàn phím/chuột; tự động khóa phiên làm việc khi không hoạt động để tránh rò rỉ dữ liệu tài chính.

### 5. 📊 Báo Cáo Doanh Thu & Lợi Nhuận Thực Tế (P&L)
- Thống kê doanh thu, giá vốn, lợi nhuận gộp theo ngày/tuần/tháng hoặc khoảng thời gian tùy chọn.
- Phân tích tỷ trọng doanh thu theo từng danh mục thuốc (Diệt rầy, trừ bệnh, kích rễ, dưỡng lá...).
- Xuất báo cáo chuyên nghiệp ra định dạng **Excel (.xlsx)** và **PDF** chuẩn mực.

### 6. 🛡️ Nhật Ký Hoạt Động Hệ Thống (Audit Trail)
- Lưu vết mọi tác vụ quan trọng: Nhập kho, tạo đơn hàng, sửa giá, thu nợ, xóa dữ liệu.
- Quy tắc bảo mật Firestore Rules ngăn chặn hoàn toàn việc sửa/xóa nhật ký đã ghi (`allow update, delete: if false`).

---

## 💡 Điểm Sáng Công Nghệ & Nghiệp Vụ

```
                    ┌────────────────────────┐
                    │    CLIENT APPLICATION  │
                    │ React 19 + Ant Design  │
                    │  (Vite / Electron App) │
                    └───────────┬────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌──────────────┐      ┌──────────────────┐      ┌──────────────┐
│  Firebase    │      │  Hugging Face AI │      │ Local Models │
│  Auth & Role │      │  Face Recognition│      │  (face-api)  │
│    (RBAC)    │      │   Microservice   │      │ Client-side  │
└───────┬──────┘      └──────────────────┘      └──────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────┐
│               CLOUD FIRESTORE DATABASE                 │
│  - products            - inventory_batches (FEFO)      │
│  - orders              - customers & debt_history      │
│  - system_logs (Audit) - admin_profiles                │
└────────────────────────────────────────────────────────┘
```

- **Firestore Atomic Transactions:** Đảm bảo toàn vẹn dữ liệu kép: khi một đơn hàng hoàn tất, việc trừ kho từng lô (FEFO), cập nhật công nợ khách hàng và ghi nhật ký hệ thống đều diễn ra trong 1 transaction duy nhất (Read-before-Write).
- **Vite Rolldown Bundle Optimization:** Cấu hình manualChunks tách biệt các module nặng (`vendor-antd`, `vendor-firebase`, `vendor-reports`, `vendor-react`), tối ưu thời gian tải trang ban đầu xuống dưới 1.5 giây.
- **Cross-Platform Readiness:** Có thể triển khai trên nền tảng Web hoặc build thành ứng dụng cài đặt Windows (.exe) thông qua Electron Builder.

---

## 🛠️ Kiến Trúc Kỹ Thuật (Tech Stack)

| Hạng Mục | Công Nghệ / Thư Viện | Mục Đích Sử Dụng |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + React Router v7 | Nền tảng SPA hiệu năng cao, tối ưu render |
| **UI Component System** | Ant Design 6 (v6.1.0) | Bộ giao diện doanh nghiệp chuẩn mực, thanh lịch |
| **Build Tool** | Vite (Rolldown engine) | Tốc độ biên dịch siêu tốc, hỗ trợ HMR |
| **Desktop Wrapper** | Electron 39 + Electron Builder | Đóng gói ứng dụng Desktop chạy offline/online trên Windows |
| **Backend & Database** | Firebase Authentication + Cloud Firestore | Cơ sở dữ liệu NoSQL thời gian thực, bảo mật phân quyền |
| **AI Biometric Engine** | Hugging Face Space + `@vladmandic/face-api` | Nhận diện khuôn mặt Face ID đăng nhập một chạm |
| **Xuất Báo Cáo** | `xlsx`, `jspdf`, `jspdf-autotable` | Xuất dữ liệu kế toán ra Excel và tài liệu hóa đơn PDF |
| **Thiết Bị & Ngoại Vi** | `react-to-print`, `qrcode.react`, `react-webcam` | Kết nối máy in nhiệt, camera quét mặt, tạo mã QR VietQR |

---

## 📁 Cấu Trúc Thư Mục (Project Structure)

```text
pesticide-shop/
├── public/                 # Assets tĩnh, icon, favicon và models AI
│   └── models/             # Weights mô hình face-api offline
├── scripts/
│   ├── download-models.js  # Script tự động tải Face Recognition Models
│   └── install-skills.mjs  # Automation script
├── src/
│   ├── assets/             # Hình ảnh, SVG assets
│   ├── components/         # Component dùng chung (FaceTest, UI elements)
│   ├── config/             # Cấu hình Firebase & Face API
│   ├── context/            # AuthContext (Xác thực & phân quyền Admin/Staff)
│   ├── features/           # Các module nghiệp vụ chính
│   │   ├── Auth/           # Đăng nhập Email/Password, Face ID, đăng ký mặt
│   │   ├── Customer/       # Quản lý danh bạ khách hàng & hạn mức nợ
│   │   ├── Dashboard/      # Bảng điều khiển tổng quan số liệu kinh doanh
│   │   ├── Debt/           # Sổ nợ, lịch sử đối soát và thanh toán nợ
│   │   ├── Inventory/      # Quản lý nhập kho & theo dõi lô hàng FEFO
│   │   ├── Order/          # Quản lý danh sách đơn hàng & in phiếu
│   │   ├── POS/            # Quầy bán lẻ, quét mã vạch, thanh toán nhanh
│   │   ├── Product/        # Danh mục thuốc BVTV, hoạt chất, quy cách
│   │   ├── Report/         # Báo cáo doanh thu, lãi lỗ, xuất Excel/PDF
│   │   └── System/         # Nhật ký hệ thống & Audit trail
│   ├── hooks/              # Custom hooks (useAutoLogout...)
│   ├── layouts/            # Layout chính (Sidebar, Header, Profile Modal)
│   ├── services/           # Tầng kết nối Firestore (Order, Product, Inventory...)
│   └── utils/              # Các hàm tiện ích (faceDetection, format tiền tệ...)
├── electron.cjs            # Main process của ứng dụng Electron Desktop
├── firestore.rules         # Bộ quy tắc bảo mật database Firestore
├── vite.config.js          # Cấu hình build & tối ưu hóa bundle chunks
└── package.json            # Quản lý dependencies & scripts thực thi
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử

### 1. Yêu Cầu Môi Trường
- **Node.js**: Phiên bản 18.x hoặc 20.x trở lên.
- **NPM** hoặc **Yarn** / **PNPM**.

### 2. Tải Mã Nguồn & Cài Đặt Thư Viện
```bash
# Clone repository
git clone https://github.com/Hoa26040005/pesticide-shop.git
cd pesticide-shop

# Cài đặt toàn bộ dependencies
npm install
```

### 3. Tải Models Trí Tuệ Nhân Tạo (Tùy chọn cho chế độ Offline Face-API)
```bash
node scripts/download-models.js
```

### 4. Khởi Chạy Ứng Dụng Web (Chế độ Development)
```bash
npm run dev
```
Truy cập trình duyệt tại địa chỉ: `http://localhost:5173`

---

## 🔑 Cấu Hình Môi Trường (.env)

Tạo file `.env` tại thư mục gốc của dự án và điền thông tin cấu hình từ Firebase Console của bạn:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

## 💻 Đóng Gói Ứng Dụng Desktop (.EXE)

Dự án tích hợp sẵn **Electron Builder** để đóng gói thành file cài đặt dành cho Windows (`.exe` NSIS):

```bash
# Chạy đồng thời Vite Dev Server và cửa sổ Desktop Electron
npm run start:exe

# Đóng gói tạo file cài đặt .exe độc lập trong thư mục release/
npm run dist
```
Sau khi hoàn tất, file cài đặt sẽ xuất hiện tại thư mục `release/Quan Ly Thuoc BVTV Setup x.x.x.exe`.

---

## 🔒 Bảo Mật & Phân Quyền (RBAC & Rules)

### Phân Quyền 2 Cấp Độ (Role-Based Access Control)
- **Chủ Cửa Hàng (ADMIN):**
  - Xem toàn bộ Báo cáo tài chính, Bảng kê doanh thu, Lợi nhuận P&L.
  - Quản trị danh mục hàng hóa, nhập kho, định giá và cấu hình hệ thống.
  - Xem và giám sát toàn bộ Nhật ký hoạt động (System Logs).
- **Nhân Viên Bán Hàng (STAFF):**
  - Thao tác trên màn hình Bán hàng (POS) và Tra cứu tồn kho.
  - Tạo đơn hàng và thu nợ khách hàng.
  - Bị giới hạn truy cập tự động vào các màn hình Báo cáo và Nhật ký hệ thống (màn hình 403 Forbidden).

### Firestore Security Rules
Hệ thống triển khai chính sách phân quyền từ gốc:
- Toàn bộ thao tác đọc/ghi bắt buộc phải được xác thực danh tính qua Firebase Auth.
- Dữ liệu `system_logs` chỉ cho phép thêm mới (append-only), **tuyệt đối cấm sửa/xóa** để đảm bảo tính bất biến của nhật ký kiểm toán.

---

## 🗺️ Lộ Trình Phát Triển (Roadmap)

- [x] Quản lý kho theo phương pháp FEFO (Hạn dùng lô thuốc BVTV).
- [x] Điểm bán hàng POS với QR Code VietQR và in hóa đơn nhiệt.
- [x] Quản lý nợ mùa vụ nông dân và lịch sử dòng tiền.
- [x] Xác thực khuôn mặt AI (Face ID) & Đóng gói Desktop (.exe).
- [ ] Chế độ Offline-First (Lưu tạm đơn hàng vào IndexedDB khi mất kết nối Internet và tự đồng bộ khi có mạng lại).
- [ ] Tích hợp gửi tin nhắn Zalo ZNS / SMS nhắc nợ tự động đến bà con nông dân.
- [ ] Ứng dụng di động (React Native / PWA) dành riêng cho chủ cửa hàng giám sát từ xa.

---

## 👨‍💻 Tác Giả & Đóng Góp

- **Nhà Phát Triển:** [Hoa26040005](https://github.com/Hoa26040005)
- **Repository:** [https://github.com/Hoa26040005/pesticide-shop](https://github.com/Hoa26040005/pesticide-shop)

Mọi đóng góp (Pull Requests / Issues) nhằm hoàn thiện hệ thống đều được hoan nghênh nồng nhiệt! 🎉
