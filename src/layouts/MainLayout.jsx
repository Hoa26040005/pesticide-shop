// src/layouts/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import { 
  FileTextOutlined, LockOutlined, DesktopOutlined,
  ShoppingCartOutlined, AppstoreOutlined, UserOutlined,
  BarChartOutlined, HomeOutlined, LogoutOutlined,
  ExclamationCircleFilled, WalletOutlined, SafetyCertificateOutlined,
  ScanOutlined, SettingOutlined // Icon cho phần Cài đặt
} from '@ant-design/icons';
import { Layout, Menu, theme, Modal, Form, Input, message, Tag } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getAuth, signOut, signInWithEmailAndPassword } from 'firebase/auth';

// Import các tính năng phụ trợ
import useAutoLogout from '../hooks/useAutoLogout';
import FaceRegister from '../features/Auth/FaceRegister'; 
import AdminProfile from '../layouts/AdminProfile'; 
import { useAuth } from '../context/AuthContext';

const { Header, Content, Footer, Sider } = Layout;

function getItem(label, key, icon, children, type) {
  return { key, icon, children, label, type };
}

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer } } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutForm] = Form.useForm();
  const { user, isAdmin } = useAuth();
  
  // State quản lý Modal
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false); 
  const [isProfileOpen, setIsProfileOpen] = useState(false); 

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { AutoLogoutModal } = useAutoLogout(); 

  // Menu động theo vai trò (Admin vs Staff)
  const menuItems = [
    getItem('Tổng quan', '/', <HomeOutlined />),
    getItem('Bán hàng (POS)', '/pos', <ShoppingCartOutlined />),
    getItem('Đơn hàng', '/orders', <FileTextOutlined />),
    getItem('Sản phẩm', '/products', <AppstoreOutlined />),
    getItem('Kho hàng', '/inventory', <DesktopOutlined />),
    getItem('Sổ Nợ', '/debt', <WalletOutlined />),
    getItem('Khách hàng', '/customers', <UserOutlined />),
    
    // Chỉ Admin mới thấy Báo cáo và Nhật ký
    ...(isAdmin ? [
      getItem('Báo cáo', '/reports', <BarChartOutlined />),
      getItem('Nhật ký', '/logs', <SafetyCertificateOutlined />),
    ] : []),
    
    { type: 'divider' },
    getItem('Cài đặt Face ID', 'face-register', <ScanOutlined />),
    getItem(isAdmin ? 'Quản lý & Cài đặt' : 'Tài khoản của tôi', 'admin-profile', <SettingOutlined />), 
    { label: 'Đăng xuất', key: 'logout', icon: <LogoutOutlined />, danger: true }, 
  ];

  // Theo dõi mạng
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); message.success("Đã kết nối lại mạng!"); };
    const handleOffline = () => { setIsOnline(false); message.warning("Mất kết nối mạng!"); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Xử lý click Menu
  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      setIsLogoutModalOpen(true);
      logoutForm.resetFields();
    } else if (key === 'face-register') {
      setIsFaceModalOpen(true);
    } else if (key === 'admin-profile') {
      setIsProfileOpen(true);
    } else {
      navigate(key);
    }
  };

  const handleLogout = async () => {
    try {
      const values = await logoutForm.validateFields();
      setLogoutLoading(true);
      const auth = getAuth();
      if (!auth.currentUser) throw new Error('User not found');
      await signInWithEmailAndPassword(auth, auth.currentUser.email, values.password);
      await signOut(auth);
      message.success('Đã đăng xuất!');
      setIsLogoutModalOpen(false);
    } catch (error) {
      console.error(error);
      message.error('Mật khẩu không đúng hoặc lỗi hệ thống!');
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <>
      <AutoLogoutModal />

      <Layout style={{ minHeight: '100vh' }}>
        <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
          <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', color: 'white', lineHeight: '32px', fontWeight: 'bold', borderRadius: 6 }}>
            {collapsed ? 'PS' : 'PESTICIDE'}
          </div>
          <Menu 
              theme="dark" 
              defaultSelectedKeys={['/']} 
              selectedKeys={[location.pathname]}
              mode="inline" 
              items={menuItems} 
              onClick={handleMenuClick} 
          />
        </Sider>
        <Layout>
          <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,.08)', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={{ margin: 0, fontWeight: 600 }}>QUẢN LÝ CỬA HÀNG THUỐC BVTV</h2>
                {isAdmin ? (
                  <Tag color="gold" style={{ borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>
                    👑 Chủ cửa hàng (Admin)
                  </Tag>
                ) : (
                  <Tag color="blue" style={{ borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>
                    👤 Nhân viên thu ngân (Staff)
                  </Tag>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: '#666' }}>{user?.email}</span>
                {isOnline ? <Tag color="success" style={{borderRadius: 4}}>🟢 Online</Tag> : <Tag color="error" style={{borderRadius: 4}}>🔴 Offline</Tag>}
              </div>
          </Header>
          <Content style={{ margin: '16px' }}>
            <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Outlet />
            </div>
          </Content>
          <Footer style={{ textAlign: 'center', color: '#888' }}>Pesticide Shop ©2025 - Quản lý thông minh</Footer>
        </Layout>

        {/* --- MODAL ĐĂNG KÝ FACE ID --- */}
        <Modal
          title="Đăng ký nhận diện khuôn mặt"
          open={isFaceModalOpen}
          onCancel={() => setIsFaceModalOpen(false)}
          footer={null} 
          destroyOnHidden={true}
        >
           <FaceRegister onCancel={() => setIsFaceModalOpen(false)} />
        </Modal>

        {/* --- MODAL CÀI ĐẶT TÀI KHOẢN (ADMIN PROFILE) --- */}
        <AdminProfile 
          open={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
        />

        {/* Modal Đăng xuất */}
        <Modal
          title={<span><LockOutlined style={{ color: '#faad14', marginRight: 8 }} />Xác thực đăng xuất</span>}
          open={isLogoutModalOpen}
          onOk={handleLogout}
          onCancel={() => setIsLogoutModalOpen(false)}
          confirmLoading={logoutLoading}
          okText="Đăng xuất"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          destroyOnHidden={true}
        >
          <p style={{marginBottom: 16}}>Vui lòng nhập mật khẩu để xác nhận bạn muốn đăng xuất khỏi hệ thống:</p>
          <Form form={logoutForm}>
            <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu!' }]}>
              <Input.Password placeholder="Nhập mật khẩu của bạn..." onPressEnter={handleLogout} size="large" />
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    </>
  );
};

export default MainLayout;