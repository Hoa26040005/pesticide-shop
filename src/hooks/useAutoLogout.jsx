// src/hooks/useAutoLogout.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { Modal, Button, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Thời gian chờ: 2 phút (120000 ms)
const IDLE_TIMEOUT = 2 * 60 * 1000; 
// Thời gian đếm ngược cảnh báo: 60 giây
const COUNTDOWN_TIMEOUT = 60; 

const useAutoLogout = () => {
  const [isIdle, setIsIdle] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_TIMEOUT);
  const timerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const auth = getAuth();

  // Hàm đăng xuất
  const performLogout = useCallback(async () => {
    try {
      await signOut(auth);
      window.location.href = '/'; // Chuyển về trang login
    } catch (error) {
      console.error("Lỗi đăng xuất tự động:", error);
    }
  }, [auth]);

  // Hàm reset bộ đếm
  const resetTimer = useCallback(() => {
    if (isIdle) return; // Nếu đang hiện popup cảnh báo thì không reset ngầm

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setIsIdle(true); // Kích hoạt trạng thái nhàn rỗi -> Hiện Modal
    }, IDLE_TIMEOUT);
  }, [isIdle]);

  // Lắng nghe sự kiện người dùng
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    // Gắn sự kiện
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    // Khởi động timer lần đầu
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  // Xử lý đếm ngược khi đang Idle
  useEffect(() => {
    if (isIdle) {
      setCountdown(COUNTDOWN_TIMEOUT);
      
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            performLogout(); // Hết giờ -> Đăng xuất
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isIdle, performLogout]);

  // Hàm xử lý khi người dùng bấm "Ở lại"
  const handleStayLoggedIn = () => {
    setIsIdle(false);
    setCountdown(COUNTDOWN_TIMEOUT);
    resetTimer();
  };

  // Component Modal cảnh báo (Trả về để MainLayout render)
  const AutoLogoutModal = () => (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', color: '#faad14' }}>
          <ExclamationCircleOutlined style={{ fontSize: '24px', marginRight: 10 }} />
          <span>Cảnh báo bảo mật</span>
        </div>
      }
      open={isIdle}
      footer={[
        <Button key="logout" danger onClick={performLogout}>
          Đăng xuất ngay
        </Button>,
        <Button key="stay" type="primary" onClick={handleStayLoggedIn}>
          Tiếp tục làm việc
        </Button>,
      ]}
      closable={false}
      maskClosable={false}
      centered
    >
      <p>Hệ thống không phát hiện hoạt động nào trong 2 phút qua.</p>
      <p>Để bảo vệ tài khoản, bạn sẽ tự động đăng xuất sau:</p>
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <Text style={{ fontSize: '48px', color: '#ff4d4f', fontWeight: 'bold' }}>
          {countdown}s
        </Text>
      </div>
    </Modal>
  );

  return { AutoLogoutModal };
};

export default useAutoLogout;