import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Input, Button, Typography, message, Divider, Tabs } from 'antd';
import { 
  UserOutlined, LockOutlined, MailOutlined,
  SmileOutlined, CheckCircleOutlined 
} from '@ant-design/icons';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import LoginWithFace from './LoginWithFace';
import SakuraCanvas from './SakuraCanvas';

const { Title, Text } = Typography;

const Login = () => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cardTilt, setCardTilt] = useState({ rx: 0, ry: 0, glareX: 50, glareY: 50 });
  const containerRef = useRef(null);

  // State bảo mật khóa tạm thời
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Forms
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  // Đếm ngược khóa
  useEffect(() => {
    let timer;
    if (isLocked && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (isLocked && countdown === 0) {
      setIsLocked(false);
      setFailedAttempts(0);
    }
    return () => clearInterval(timer);
  }, [isLocked, countdown]);

  // Mouse 3D perspective tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth) - 0.5;
      const y = (e.clientY / innerHeight) - 0.5;
      setMousePos({ x, y });

      // 3D Tilt calculation
      const rx = (-y * 14).toFixed(2);
      const ry = (x * 14).toFixed(2);
      const glareX = Math.round(50 + x * 50);
      const glareY = Math.round(50 + y * 50);
      setCardTilt({ rx, ry, glareX, glareY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Xử lý Đăng nhập
  const onLogin = async (values) => {
    if (isLocked) {
      message.warning(`Hệ thống tạm khóa bảo mật. Thử lại sau ${countdown}s!`);
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, values.email, values.password);
      message.success('🌸 Chào mừng bạn trở lại! Đăng nhập thành công.');
      setFailedAttempts(0);
    } catch (error) {
      console.error('Login error:', error.code);
      let errorMsg = 'Lỗi đăng nhập hệ thống!';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMsg = 'Email này chưa được đăng ký trong hệ thống!';
          break;
        case 'auth/wrong-password':
          errorMsg = 'Mật khẩu không chính xác!';
          break;
        case 'auth/invalid-credential':
          errorMsg = 'Email hoặc mật khẩu không chính xác!';
          break;
        case 'auth/too-many-requests':
          errorMsg = 'Tài khoản tạm khóa do nhập sai quá nhiều lần!';
          break;
        case 'auth/invalid-email':
          errorMsg = 'Định dạng email không hợp lệ!';
          break;
        default:
          errorMsg = `Lỗi: ${error.message}`;
      }

      message.error(errorMsg);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 3) {
        setIsLocked(true);
        setCountdown(30);
        message.error('Phát hiện 3 lần đăng nhập thất bại. Tạm khóa 30 giây!');
      }
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Đăng ký tài khoản
  const onRegister = async (values) => {
    setLoading(true);
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Cập nhật tên hiển thị
      if (values.displayName) {
        await updateProfile(user, { displayName: values.displayName });
      }

      // Lưu thông tin người dùng vào Firestore
      try {
        await setDoc(doc(db, 'users', user.uid), {
          displayName: values.displayName || values.email.split('@')[0],
          email: values.email,
          role: 'staff',
          createdAt: new Date(),
        });
      } catch (err) {
        console.warn('Could not write user profile to firestore:', err);
      }

      message.success('🌸 Đăng ký tài khoản thành công! Tự động đăng nhập.');
    } catch (error) {
      console.error('Register error:', error);
      let errorMsg = 'Lỗi đăng ký tài khoản!';
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'Email này đã được sử dụng bởi một tài khoản khác!';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'Mật khẩu quá ngắn. Vui lòng nhập tối thiểu 6 ký tự!';
      }
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const customStyles = `
    @keyframes sakuraFloat {
      0% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-8px) rotate(2deg); }
      100% { transform: translateY(0px) rotate(0deg); }
    }

    @keyframes branchSway {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(1.5deg) scale(1.02); }
      100% { transform: rotate(0deg) scale(1); }
    }

    .sakura-card-wrapper {
      perspective: 1200px;
      z-index: 10;
    }

    .sakura-3d-card {
      background: rgba(26, 12, 24, 0.78) !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
      border: 1px solid rgba(251, 113, 133, 0.3) !important;
      box-shadow: 0 30px 70px rgba(0, 0, 0, 0.65), 
                  0 0 40px rgba(244, 114, 182, 0.22), 
                  0 0 0 1px rgba(255, 255, 255, 0.08) inset !important;
      transition: transform 0.12s ease-out, box-shadow 0.2s ease;
      transform-style: preserve-3d;
      position: relative;
      overflow: hidden;
    }

    .sakura-glare {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      border-radius: inherit;
      mix-blend-mode: overlay;
      opacity: 0.65;
      transition: background 0.1s ease-out;
    }

    .sakura-input .ant-input-affix-wrapper,
    .sakura-input .ant-input {
      background: rgba(18, 7, 16, 0.65) !important;
      color: #ffffff !important;
      border: 1px solid rgba(251, 113, 133, 0.25) !important;
      backdrop-filter: blur(10px);
      transition: all 0.25s ease;
    }

    .sakura-input .ant-input::placeholder {
      color: #9f8a97 !important;
    }

    .sakura-input .ant-input-affix-wrapper:hover,
    .sakura-input .ant-input-affix-wrapper-focused {
      border-color: #fb7185 !important;
      box-shadow: 0 0 0 3px rgba(251, 113, 133, 0.25) !important;
    }

    .sakura-input .anticon { 
      color: #fb7185 !important; 
    }

    .sakura-tabs .ant-tabs-nav {
      margin-bottom: 20px !important;
    }

    .sakura-tabs .ant-tabs-tab {
      color: #d1b8c6 !important;
      font-weight: 600 !important;
      font-size: 15px !important;
    }

    .sakura-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
      color: #fda4af !important;
      text-shadow: 0 0 12px rgba(251, 113, 133, 0.6) !important;
    }

    .sakura-tabs .ant-tabs-ink-bar {
      background: linear-gradient(90deg, #f43f5e, #fb7185) !important;
      height: 3px !important;
      border-radius: 3px !important;
    }
  `;

  return (
    <>
      <style>{customStyles}</style>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at 50% 20%, #38122d 0%, #1c0a1b 45%, #09030c 100%)',
          overflow: 'hidden',
        }}
      >
        {/* 3D INTERACTIVE SAKURA CANVAS */}
        <SakuraCanvas />

        {/* ARTISTIC CHERRY BLOSSOM BRANCH SILHOUETTE IN BACKGROUND */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '580px',
          height: '580px',
          pointerEvents: 'none',
          opacity: 0.22,
          animation: 'branchSway 8s ease-in-out infinite',
          zIndex: 1,
        }}>
          <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            {/* Elegant Cherry Blossom Branch */}
            <path d="M500 0 C420 80, 380 140, 260 200 C180 240, 110 260, 0 280 C60 260, 150 220, 210 180 C320 110, 410 40, 500 0 Z" fill="#fda4af" />
            <path d="M380 140 C340 180, 310 240, 290 320" stroke="#fda4af" strokeWidth="4" strokeLinecap="round" />
            <path d="M260 200 C240 260, 190 310, 130 360" stroke="#fda4af" strokeWidth="3" strokeLinecap="round" />
            {/* Sakura Blossom Clusters */}
            <circle cx="290" cy="320" r="14" fill="#fb7185" />
            <circle cx="280" cy="310" r="12" fill="#fda4af" />
            <circle cx="305" cy="315" r="11" fill="#f43f5e" />
            <circle cx="130" cy="360" r="16" fill="#fb7185" />
            <circle cx="115" cy="350" r="13" fill="#fbcfe8" />
            <circle cx="145" cy="355" r="12" fill="#f43f5e" />
            <circle cx="340" cy="180" r="18" fill="#fda4af" />
            <circle cx="210" cy="180" r="17" fill="#fb7185" />
          </svg>
        </div>

        {/* 3D TILT CARD WRAPPER */}
        <div 
          className="sakura-card-wrapper"
          style={{
            transform: `perspective(1200px) rotateX(${cardTilt.rx}deg) rotateY(${cardTilt.ry}deg)`,
          }}
        >
          <Card 
            className="sakura-3d-card" 
            style={{ 
              width: 440, 
              borderRadius: 28, 
              padding: '10px 14px',
            }}
          >
            {/* DYNAMIC SPECULAR LIGHT SHEEN */}
            <div 
              className="sakura-glare"
              style={{
                background: `radial-gradient(circle at ${cardTilt.glareX}% ${cardTilt.glareY}%, rgba(255, 240, 245, 0.28) 0%, transparent 65%)`,
              }}
            />

            {/* BRAND HEADER: SPRING EDITION */}
            <div style={{ textAlign: 'center', marginBottom: 22, position: 'relative', zIndex: 3 }}>
              {/* Sakura Blossom Icon Badge */}
              <div style={{ 
                width: 66, 
                height: 66, 
                borderRadius: 22, 
                background: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #fda4af 100%)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 14px', 
                fontSize: 32,
                boxShadow: '0 10px 28px rgba(244, 63, 94, 0.45), inset 0 0 12px rgba(255, 255, 255, 0.4)',
                animation: 'sakuraFloat 4s ease-in-out infinite',
              }}>
                🌸
              </div>

              <div style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, background: 'rgba(251, 113, 133, 0.15)', border: '1px solid rgba(251, 113, 133, 0.35)', marginBottom: 8 }}>
                <span style={{ color: '#fda4af', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  🌱 Mùa vụ mới • Khởi sắc bội thu
                </span>
              </div>

              <Title level={2} style={{ margin: 0, color: '#ffffff', fontSize: 25, fontWeight: 800, letterSpacing: '-0.02em' }}>
                PESTICIDE <span style={{ color: '#fda4af' }}>SHOP</span>
              </Title>
              <Text style={{ color: '#d8b4c8', fontSize: 13, display: 'block', marginTop: 4 }}>
                Hệ thống Quản lý Bán lẻ & Kho Nông Dược BVTV
              </Text>
            </div>

            {/* TABS: ĐĂNG NHẬP / ĐĂNG KÝ */}
            <div style={{ position: 'relative', zIndex: 3 }}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                centered
                className="sakura-tabs"
                items={[
                  {
                    key: 'login',
                    label: 'ĐĂNG NHẬP',
                    children: (
                      <Form 
                        form={loginForm}
                        name="login_form" 
                        onFinish={onLogin} 
                        layout="vertical" 
                        size="large" 
                        className="sakura-input"
                      >
                        <Form.Item 
                          name="email" 
                          rules={[
                            { required: true, message: 'Vui lòng nhập Email!' }, 
                            { type: 'email', message: 'Email không đúng định dạng!' }
                          ]}
                          style={{ marginBottom: 16 }}
                        >
                          <Input 
                            prefix={<UserOutlined />} 
                            placeholder="admin@example.com" 
                            style={{ borderRadius: 14, height: 48, fontSize: 14 }} 
                          />
                        </Form.Item>

                        <Form.Item 
                          name="password" 
                          rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
                          style={{ marginBottom: 20 }}
                        >
                          <Input.Password 
                            prefix={<LockOutlined />} 
                            placeholder="••••••••" 
                            style={{ borderRadius: 14, height: 48, fontSize: 14 }} 
                          />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 14 }}>
                          <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                            disabled={isLocked}
                            style={{
                              height: 48,
                              borderRadius: 14,
                              background: isLocked ? '#52525b' : 'linear-gradient(135deg, #e11d48 0%, #f43f5e 50%, #fb7185 100%)',
                              border: 'none',
                              fontSize: 15,
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              boxShadow: isLocked ? 'none' : '0 8px 22px rgba(244, 63, 94, 0.42)',
                              cursor: isLocked ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {isLocked ? `THỬ LẠI SAU ${countdown}s` : loading ? 'ĐANG XÁC THỰC...' : '🌸 ĐĂNG NHẬP HỆ THỐNG'}
                          </Button>
                        </Form.Item>

                        <Divider style={{ borderColor: 'rgba(251, 113, 133, 0.2)', margin: '14px 0' }}>
                          <Text style={{ color: '#d8b4c8', fontSize: 12 }}>HOẶC TIỆN LỢI HƠN VỚI</Text>
                        </Divider>

                        <LoginWithFace />
                      </Form>
                    ),
                  },
                  {
                    key: 'register',
                    label: 'ĐĂNG KÝ MỚI',
                    children: (
                      <Form 
                        form={registerForm}
                        name="register_form" 
                        onFinish={onRegister} 
                        layout="vertical" 
                        size="large" 
                        className="sakura-input"
                      >
                        <Form.Item 
                          name="displayName" 
                          rules={[{ required: true, message: 'Vui lòng nhập họ tên của bạn!' }]}
                          style={{ marginBottom: 14 }}
                        >
                          <Input 
                            prefix={<SmileOutlined />} 
                            placeholder="Họ và tên nhân viên..." 
                            style={{ borderRadius: 14, height: 46, fontSize: 14 }} 
                          />
                        </Form.Item>

                        <Form.Item 
                          name="email" 
                          rules={[
                            { required: true, message: 'Vui lòng nhập Email!' }, 
                            { type: 'email', message: 'Email không hợp lệ!' }
                          ]}
                          style={{ marginBottom: 14 }}
                        >
                          <Input 
                            prefix={<MailOutlined />} 
                            placeholder="nhanvien@pesticide.com" 
                            style={{ borderRadius: 14, height: 46, fontSize: 14 }} 
                          />
                        </Form.Item>

                        <Form.Item 
                          name="password" 
                          rules={[
                            { required: true, message: 'Vui lòng tạo mật khẩu!' },
                            { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' }
                          ]}
                          style={{ marginBottom: 14 }}
                        >
                          <Input.Password 
                            prefix={<LockOutlined />} 
                            placeholder="Mật khẩu bảo mật..." 
                            style={{ borderRadius: 14, height: 46, fontSize: 14 }} 
                          />
                        </Form.Item>

                        <Form.Item 
                          name="confirmPassword" 
                          dependencies={['password']}
                          rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                  return Promise.resolve();
                                }
                                return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                              },
                            }),
                          ]}
                          style={{ marginBottom: 20 }}
                        >
                          <Input.Password 
                            prefix={<CheckCircleOutlined />} 
                            placeholder="Nhập lại mật khẩu..." 
                            style={{ borderRadius: 14, height: 46, fontSize: 14 }} 
                          />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 10 }}>
                          <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                            style={{
                              height: 48,
                              borderRadius: 14,
                              background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
                              border: 'none',
                              fontSize: 15,
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              boxShadow: '0 8px 22px rgba(16, 185, 129, 0.4)',
                            }}
                          >
                            {loading ? 'ĐANG TẠO TÀI KHOẢN...' : '🌱 TẠO TÀI KHOẢN NGAY'}
                          </Button>
                        </Form.Item>
                      </Form>
                    ),
                  },
                ]}
              />

              {/* FOOTER SPRING MOTIF */}
              <div style={{ marginTop: 18, textAlign: 'center' }}>
                <Text style={{ color: '#d8b4c8', fontSize: 11 }}>
                  🌸 Mùa xuân sinh sôi • Tương tác chuột 3D sống động • Chuẩn FEFO
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Login;