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

      <Layout style={{ minHeight: '100vh', background: '#f6f8f7' }}>
        <Sider 
          collapsible 
          collapsed={collapsed} 
          onCollapse={(value) => setCollapsed(value)}
          width={240}
          collapsedWidth={80}
          className="agri-sider"
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'sticky',
            top: 0,
            left: 0,
          }}
        >
          {/* LOGO BRANDING */}
          <div style={{
            padding: collapsed ? '18px 8px' : '20px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: 8,
          }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)',
              flexShrink: 0,
            }}>
              🌱
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: '0.04em',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}>
                  PESTICIDE <span style={{ color: '#34d399' }}>SHOP</span>
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}>
                  AgriTech POS
                </div>
              </div>
            )}
          </div>

          <Menu 
              theme="dark" 
              defaultSelectedKeys={['/']} 
              selectedKeys={[location.pathname]}
              mode="inline" 
              items={menuItems} 
              onClick={handleMenuClick} 
              style={{ background: 'transparent', borderRight: 0 }}
          />
        </Sider>

        <Layout style={{ background: '#f6f8f7' }}>
          <Header 
            className="agri-header"
            style={{ 
              padding: '0 24px', 
              background: '#ffffff', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              height: 64,
              borderBottom: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              position: 'sticky',
              top: 0,
              zIndex: 100,
            }}
          >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: 17, 
                  fontWeight: 700, 
                  color: '#0f172a',
                  letterSpacing: '-0.01em',
                }}>
                  HỆ THỐNG QUẢN LÝ VẬT TƯ BVTV
                </h1>
                {isAdmin ? (
                  <Tag 
                    style={{ 
                      borderRadius: 20, 
                      padding: '2px 10px', 
                      fontWeight: 600,
                      background: 'rgba(245, 158, 11, 0.1)',
                      borderColor: 'rgba(245, 158, 11, 0.3)',
                      color: '#b45309',
                      fontSize: 12,
                    }}
                  >
                    👑 Chủ cửa hàng (Admin)
                  </Tag>
                ) : (
                  <Tag 
                    style={{ 
                      borderRadius: 20, 
                      padding: '2px 10px', 
                      fontWeight: 600,
                      background: 'rgba(5, 150, 105, 0.1)',
                      borderColor: 'rgba(5, 150, 105, 0.3)',
                      color: '#047857',
                      fontSize: 12,
                    }}
                  >
                    👤 Nhân viên thu ngân (Staff)
                  </Tag>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}>
                  <span style={{ 
                    width: 7, 
                    height: 7, 
                    borderRadius: '50%', 
                    background: isOnline ? '#10b981' : '#ef4444',
                    boxShadow: isOnline ? '0 0 6px rgba(16, 185, 129, 0.6)' : '0 0 6px rgba(239, 68, 68, 0.6)',
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>
                    {user?.email || 'Nguoidung'}
                  </span>
                </div>
              </div>
          </Header>

          <Content style={{ margin: '20px 24px 0 24px', flex: '1 0 auto' }}>
            <div style={{ 
              padding: 24, 
              minHeight: 400, 
              background: '#ffffff', 
              borderRadius: 14, 
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            }}>
              <Outlet />
            </div>
          </Content>

          <Footer style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '20px 0' }}>
            Pesticide Shop ©2025 • Hệ thống Quản lý Bán lẻ & Tồn kho BVTV Chuẩn Thông Minh
          </Footer>
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