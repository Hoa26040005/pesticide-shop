import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Input, Button, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import LoginWithFace from './LoginWithFace';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // --- CÁC STATE BẢO MẬT MỚI THÊM ---
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Hiệu ứng đếm ngược khi bị khóa
  useEffect(() => {
    let timer;
    if (isLocked && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isLocked && countdown === 0) {
      setIsLocked(false);
      setFailedAttempts(0); // Reset số lần sai khi hết thời gian phạt
    }
    return () => clearInterval(timer);
  }, [isLocked, countdown]);

  const onFinish = async (values) => {
    // Chặn ngay nếu đang bị khóa
    if (isLocked) {
      message.warning(`Hệ thống đang khóa tạm thời. Vui lòng thử lại sau ${countdown}s.`);
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, values.email, values.password);
      
      message.success('Đăng nhập thành công!');
      setFailedAttempts(0); // Đăng nhập đúng thì reset số lần sai
      
    } catch (error) {
      console.error('Login error:', error.code);
      let errorMsg = 'Lỗi hệ thống. Vui lòng thử lại sau!';

      // --- BẮT CHÍNH XÁC TỪNG LỖI CỦA FIREBASE ---
      switch (error.code) {
        case 'auth/user-not-found':
          errorMsg = 'Email này chưa được đăng ký trong hệ thống!';
          break;
        case 'auth/wrong-password':
          errorMsg = 'Mật khẩu không chính xác!';
          break;
        case 'auth/invalid-credential':
          errorMsg = 'Thông tin đăng nhập không chính xác (Sai Email hoặc Mật khẩu)!';
          break;
        case 'auth/too-many-requests':
          errorMsg = 'Tài khoản tạm khóa do nhập sai quá nhiều lần từ hệ thống gốc!';
          break;
        case 'auth/invalid-email':
          errorMsg = 'Định dạng email không hợp lệ!';
          break;
        default:
          errorMsg = `Lỗi đăng nhập: ${error.message}`;
      }

      message.error(errorMsg);

      // --- TĂNG BẢO MẬT: XỬ LÝ KHÓA TẠM THỜI ---
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 3) {
        setIsLocked(true);
        setCountdown(30); // Khóa 30 giây
        message.error('Phát hiện đăng nhập bất thường! Tạm khóa chức năng 30 giây để bảo mật.');
      }

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;
        setMousePos({ x, y });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const customStyles = `
    @keyframes galaxyDrift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes fishSwim { 0% { transform: translateY(0px); } 50% { transform: translateY(5px); } 100% { transform: translateY(0px); } }
    @keyframes tailWag { 0% { transform: rotate(-5deg); } 100% { transform: rotate(5deg); } }
    @keyframes finWave { 0% { transform: scaleX(1); } 100% { transform: scaleX(0.8); } }
    
    .glass-card {
      background: rgba(10, 20, 30, 0.5) !important;
      backdrop-filter: blur(12px) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 242, 254, 0.2) inset, 0 0 30px rgba(123, 47, 247, 0.2) !important;
    }
    .glass-input .ant-input-affix-wrapper,
    .glass-input .ant-input {
      background: rgba(0, 0, 0, 0.3) !important;
      color: white !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      backdrop-filter: blur(5px);
      transition: all 0.3s ease;
    }
    .glass-input .ant-input-affix-wrapper:hover,
    .glass-input .ant-input-affix-wrapper-focused {
      border-color: #00f2fe !important;
      box-shadow: 0 0 12px rgba(0, 242, 254, 0.4) !important;
    }
    .glass-input .anticon { color: #00f2fe !important; }
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
          background: 'radial-gradient(ellipse at 30% 40%, #0d0b1a, #020210)',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', width: '100%', height: '100%', transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)`, transition: 'transform 0.2s ease-out', pointerEvents: 'none', zIndex: 1 }}>
          {[...Array(50)].map((_, i) => (
            <div key={i} style={{ position: 'absolute', width: Math.random() * 2 + 1 + 'px', height: Math.random() * 2 + 1 + 'px', background: 'white', borderRadius: '50%', left: Math.random() * 100 + '%', top: Math.random() * 100 + '%', opacity: Math.random() * 0.5 + 0.3, boxShadow: '0 0 6px rgba(255,255,255,0.8)' }} />
          ))}
        </div>

        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', borderRadius: '50%', border: '2px solid rgba(0, 242, 254, 0.3)', boxShadow: '0 0 40px rgba(0, 242, 254, 0.2), inset 0 0 20px rgba(123, 47, 247, 0.3)', animation: 'spin 40s linear infinite', zIndex: 2 }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', borderRadius: '50%', border: '2px solid rgba(123, 47, 247, 0.3)', boxShadow: '0 0 40px rgba(123, 47, 247, 0.2), inset 0 0 20px rgba(0, 242, 254, 0.3)', animation: 'spin 30s linear infinite reverse', zIndex: 2 }} />

        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', animation: 'spin 20s linear infinite', zIndex: 3 }}>
          <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)' }}><Fish color="white" /></div>
        </div>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', animation: 'spin 25s linear infinite reverse', zIndex: 3 }}>
          <div style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)' }}><Fish color="black" /></div>
        </div>

        <Card className="glass-card" style={{ width: 400, borderRadius: 32, zIndex: 10 }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(145deg, #00f2fe, #7b2ff7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 20px rgba(0,242,254,0.3)' }}>
              <SafetyCertificateOutlined style={{ fontSize: 36, color: 'white' }} />
            </div>
            <Title level={2} style={{ margin: 0, color: 'white', textShadow: '0 2px 10px rgba(0,242,254,0.5)' }}>PESTICIDE PRO</Title>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, letterSpacing: '2px' }}>Hệ thống quản lý thông minh</Text>
          </div>

          <Form name="login_form" onFinish={onFinish} layout="vertical" size="large" className="glass-input">
            
            {/* ĐÃ SỬA: Bỏ Tooltip ra khỏi Input để Form bắt được dữ liệu */}
            <Form.Item name="email" rules={[{ required: true, message: 'Email không được để trống' }, { type: 'email', message: 'Email không hợp lệ' }]}>
              <Input prefix={<UserOutlined />} placeholder="admin@example.com" style={{ borderRadius: 40, height: 50, paddingLeft: 20 }} />
            </Form.Item>

            {/* ĐÃ SỬA: Bỏ Tooltip ra khỏi Input.Password để Form bắt được dữ liệu */}
            <Form.Item name="password" rules={[{ required: true, message: 'Mật khẩu không được để trống' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" style={{ borderRadius: 40, height: 50, paddingLeft: 20 }} />
            </Form.Item>

            <Form.Item style={{ marginTop: 30 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                disabled={isLocked}
                style={{
                  height: 50,
                  borderRadius: 40,
                  background: isLocked ? '#555' : 'linear-gradient(90deg, #00f2fe, #7b2ff7)',
                  border: 'none',
                  fontSize: 16,
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  boxShadow: isLocked ? 'none' : '0 8px 16px rgba(123,47,247,0.4)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                }}
              >
                {isLocked ? `THỬ LẠI SAU ${countdown}s` : loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP NGAY'}
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>HOẶC</Text>
          </Divider>

          <LoginWithFace />

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>Bảo mật & Kết nối lượng tử • AI Enhanced</Text>
          </div>
        </Card>
      </div>
    </>
  );
};

const Fish = ({ color }) => (
  <svg width="60" height="40" viewBox="0 0 60 40" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }}>
    <defs><linearGradient id={`fishGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={color === 'white' ? '#fff' : '#222'} /><stop offset="100%" stopColor={color === 'white' ? '#ddd' : '#000'} /></linearGradient></defs>
    <g style={{ animation: 'fishSwim 3s infinite ease-in-out', transformOrigin: '30px 20px' }}>
      <ellipse cx="30" cy="20" rx="22" ry="12" fill={`url(#fishGrad-${color})`} stroke={color === 'white' ? '#000' : '#7b2ff7'} strokeWidth="1.5" />
      <circle cx="42" cy="15" r="3" fill="white" stroke="#000" strokeWidth="1" />
      <circle cx="44" cy="13" r="1.5" fill="black" />
      <g style={{ animation: 'tailWag 0.4s infinite alternate', transformOrigin: '48px 20px' }}><path d="M48 12 L58 8 L58 32 L48 28 Z" fill={`url(#fishGrad-${color})`} stroke={color === 'white' ? '#000' : '#7b2ff7'} strokeWidth="1" /></g>
      <path d="M25 5 L30 0 L35 5" stroke={color === 'white' ? '#000' : '#7b2ff7'} strokeWidth="1.5" fill="none" style={{ animation: 'finWave 0.6s infinite alternate', transformOrigin: '30px 2px' }} />
      <path d="M25 35 L30 40 L35 35" stroke={color === 'white' ? '#000' : '#7b2ff7'} strokeWidth="1.5" fill="none" style={{ animation: 'finWave 0.6s infinite alternate', transformOrigin: '30px 38px' }} />
    </g>
  </svg>
);

export default Login;