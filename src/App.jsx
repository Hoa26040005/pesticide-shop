// src/App.jsx
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './features/Auth/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './features/Dashboard/Dashboard';
import ProductList from './features/Product/ProductList';
import ProductDetail from './features/Product/ProductDetail';
import InventoryList from './features/Inventory/InventoryList';
import PosScreen from './features/POS/PosScreen';
import CustomerList from './features/Customer/CustomerList';
import DebtList from './features/Debt/DebtList';
import OrderList from './features/Order/OrderList';
import ReportDashboard from './features/Report/ReportDashboard';
import SystemLogs from './features/System/SystemLogs';

// Route bảo vệ: Chỉ dành cho Chủ cửa hàng (Admin)
const ProtectedAdminRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return (
      <div style={{ padding: 40 }}>
        <Result
          status="403"
          title="403 - Giới hạn quyền truy cập"
          subTitle="Khu vực này chứa dữ liệu tài chính & bảo mật nhạy cảm, chỉ dành riêng cho Chủ cửa hàng (Admin)."
          extra={<Button type="primary" href="#/pos">Về màn hình Bán hàng (POS)</Button>}
        />
      </div>
    );
  }
  return children;
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 20, color: '#1890ff', fontWeight: '500' }}>Đang đồng bộ dữ liệu & phân quyền...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          
          <Route path="products" element={<ProductList />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="inventory" element={<InventoryList />} />
          
          <Route path="pos" element={<PosScreen />} />
          <Route path="orders" element={<OrderList />} />
          
          <Route path="customers" element={<CustomerList />} />
          <Route path="debt" element={<DebtList />} />
          
          {/* Báo cáo và Nhật ký được bảo vệ chặt chẽ cho Admin */}
          <Route path="reports" element={
            <ProtectedAdminRoute>
              <ReportDashboard />
            </ProtectedAdminRoute>
          } />
          <Route path="logs" element={
            <ProtectedAdminRoute>
              <SystemLogs />
            </ProtectedAdminRoute>
          } />

          <Route path="*" element={<h2 style={{ padding: 20 }}>Không tìm thấy trang</h2>} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;