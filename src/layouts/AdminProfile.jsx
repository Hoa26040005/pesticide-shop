import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Tabs, message, Typography, Space, Divider, Table, Select } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined, MailOutlined, TeamOutlined, ReloadOutlined } from '@ant-design/icons';
import { getAuth, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, updateUserRole } from '../services/userService';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const AdminProfile = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const { isAdmin, refreshRole } = useAuth();
  
  // State quản lý danh sách phân quyền
  const [userList, setUserList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const auth = getAuth();
  const user = auth.currentUser;

  const loadUsers = async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    try {
      const list = await getAllUsers();
      setUserList(list);
    } catch (err) {
      console.error(err);
      message.error("Lỗi tải danh sách người dùng!");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async (targetUid, newRole) => {
    try {
      await updateUserRole(targetUid, newRole);
      message.success(`Đã cập nhật vai trò thành công: ${newRole}`);
      await loadUsers();
      if (targetUid === user?.uid) {
        await refreshRole();
      }
    } catch (err) {
      message.error("Lỗi cập nhật vai trò: " + err.message);
    }
  };

  // Điền sẵn thông tin hiện tại vào form khi mở Modal
  useEffect(() => {
    if (open && user) {
      profileForm.setFieldsValue({
        displayName: user.displayName || '',
        email: user.email || '',
      });
      passwordForm.resetFields();
      if (isAdmin) {
        loadUsers();
      }
    }
  }, [open, user, isAdmin, profileForm, passwordForm]);

  // --- HÀM 1: CẬP NHẬT THÔNG TIN TÊN ---
  const handleUpdateProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      setLoading(true);
      
      await updateProfile(user, {
        displayName: values.displayName
      });
      
      message.success('Cập nhật thông tin thành công!');
      onClose(); // Đóng modal
    } catch (error) {
      if (!error?.errorFields) {
        message.error('Lỗi cập nhật: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM 2: ĐỔI MẬT KHẨU ---
  const handleUpdatePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      setLoading(true);

      // 1. Xác thực lại bằng mật khẩu cũ (Bắt buộc của Firebase)
      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Đổi sang mật khẩu mới
      await updatePassword(user, values.newPassword);
      
      message.success('Đổi mật khẩu thành công! Lần đăng nhập sau hãy dùng mật khẩu mới.');
      passwordForm.resetFields();
      onClose();
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        message.error('Mật khẩu hiện tại không chính xác!');
      } else if (error.code === 'auth/weak-password') {
        message.error('Mật khẩu mới quá yếu (phải có ít nhất 6 ký tự).');
      } else if (!error?.errorFields) {
        message.error('Lỗi: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#1677ff', fontSize: 20 }} />
          <span style={{ fontSize: 18 }}>Thiết lập Tài khoản Admin</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null} // Ẩn footer mặc định để đưa nút Lưu vào từng Tab
      destroyOnHidden={true}
      width={500}
    >
      <div style={{ marginTop: 20 }}>
        <Tabs defaultActiveKey="1" type="card">
          
          {/* --- TAB 1: THÔNG TIN CÁ NHÂN --- */}
          <TabPane tab={<span><UserOutlined />Thông tin cá nhân</span>} key="1">
            <Form form={profileForm} layout="vertical" style={{ padding: '10px 0' }}>
              <Form.Item label="Email đăng nhập" name="email">
                <Input prefix={<MailOutlined />} disabled style={{ color: '#888' }} />
              </Form.Item>
              
              <Form.Item 
                label="Tên hiển thị" 
                name="displayName"
                rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị!' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Ví dụ: Admin Kiot" />
              </Form.Item>

              <Divider style={{ margin: '15px 0' }} />
              
              <Button type="primary" onClick={handleUpdateProfile} loading={loading} block size="large" shape="round">
                Lưu thông tin
              </Button>
            </Form>
          </TabPane>

          {/* --- TAB 2: ĐỔI MẬT KHẨU --- */}
          <TabPane tab={<span><LockOutlined />Đổi mật khẩu</span>} key="2">
            <Form form={passwordForm} layout="vertical" style={{ padding: '10px 0' }}>
              <div style={{ background: '#fffbe6', padding: 12, borderRadius: 8, marginBottom: 16, border: '1px solid #ffe58f' }}>
                <Text type="warning" style={{ fontSize: 13 }}>
                  * Để đổi mật khẩu, bạn cần xác nhận lại mật khẩu đang sử dụng hiện tại.
                </Text>
              </div>

              <Form.Item 
                label="Mật khẩu hiện tại" 
                name="currentPassword"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu cũ..." />
              </Form.Item>

              <Form.Item 
                label="Mật khẩu mới" 
                name="newPassword"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                ]}
              >
                <Input.Password prefix={<LockOutlined style={{ color: '#1677ff' }}/>} placeholder="Nhập mật khẩu mới..." />
              </Form.Item>

              <Form.Item 
                label="Xác nhận mật khẩu mới" 
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined style={{ color: '#52c41a' }}/>} placeholder="Nhập lại mật khẩu mới..." />
              </Form.Item>

              <Divider style={{ margin: '15px 0' }} />
              
              <Button type="primary" onClick={handleUpdatePassword} loading={loading} block size="large" shape="round" style={{ background: '#cf1322', borderColor: '#cf1322' }}>
                Cập nhật Mật khẩu
              </Button>
            </Form>
          </TabPane>

          {/* --- TAB 3: QUẢN LÝ PHÂN QUYỀN NHÂN VIÊN (CHỈ DÀNH CHO ADMIN) --- */}
          {isAdmin && (
            <TabPane tab={<span><TeamOutlined />Phân quyền nhân viên</span>} key="3">
              <div style={{ padding: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text strong>Danh sách tài khoản ({userList.length})</Text>
                  <Button size="small" icon={<ReloadOutlined />} onClick={loadUsers} loading={loadingUsers}>Tải lại</Button>
                </div>
                <Table
                  dataSource={userList}
                  size="small"
                  pagination={false}
                  loading={loadingUsers}
                  columns={[
                    {
                      title: 'Email',
                      dataIndex: 'email',
                      key: 'email',
                      render: (email) => <span style={{ fontSize: 13, fontWeight: 500 }}>{email}</span>
                    },
                    {
                      title: 'Vai trò',
                      dataIndex: 'role',
                      key: 'role',
                      render: (role, record) => (
                        <Select
                          size="small"
                          value={role || 'STAFF'}
                          style={{ width: 130 }}
                          onChange={(newRole) => handleRoleChange(record.key, newRole)}
                          disabled={record.key === user?.uid} // Không cho tự hạ quyền chính mình
                          options={[
                            { value: 'ADMIN', label: '👑 Admin' },
                            { value: 'STAFF', label: '👤 Nhân viên' }
                          ]}
                        />
                      )
                    }
                  ]}
                />
                <div style={{ marginTop: 12, fontSize: 12, color: '#888' }}>
                  * Lưu ý: Chủ cửa hàng (Admin) có quyền xem giá vốn, lãi gộp và toàn quyền hệ thống. Nhân viên (Staff) chỉ được mở POS bán hàng và không thấy giá vốn/lãi gộp.
                </div>
              </div>
            </TabPane>
          )}

        </Tabs>
      </div>
    </Modal>
  );
};

export default AdminProfile;