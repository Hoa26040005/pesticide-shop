import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { Button, message, Modal, Typography, Alert } from 'antd';
import { ScanOutlined } from '@ant-design/icons';
// Sử dụng signInWithCustomToken thay vì Email/Password
import { getAuth, signInWithCustomToken } from 'firebase/auth';

const { Text } = Typography;

const LoginWithFace = () => {
  const webcamRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [scanning, setScanning] = useState(false);

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  const handleScan = async () => {
    setScanning(true);
    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      message.error("Lỗi Camera!");
      setScanning(false);
      return;
    }

    try {
      const file = dataURLtoFile(imageSrc, "scan.jpg");
      const formData = new FormData();
      formData.append("file", file);

      // --- ĐÃ SỬA: Gọi lên Server AI trên Hugging Face ---
      const response = await fetch("https://hoa2604205-nhan-dien-khuon-mat.hf.space/verify", {
        method: "POST",
        body: formData
      });

      const result = await response.json();
      console.log("Kết quả:", result);

      if (result.success && result.token) {
        message.success(`AI Xác nhận: ${result.name} (${result.accuracy}%)`);
        
        // --- ĐĂNG NHẬP BẰNG TOKEN (KHÔNG CẦN MẬT KHẨU) ---
        const auth = getAuth();
        try {
          await signInWithCustomToken(auth, result.token);
          
          message.success("Đăng nhập thành công!");
          setIsOpen(false);
        } catch (error) {
          console.error("Lỗi Token:", error);
          message.error("Lỗi xác thực Token Firebase!");
        }

      } else {
        message.error("Không nhận diện được: " + (result.message || "Lỗi"));
      }

    } catch (error) {
      console.error(error);
      // --- ĐÃ SỬA: Đổi câu thông báo lỗi cho chuẩn ---
      message.error("Lỗi kết nối đến Server AI trên Hugging Face");
    } finally {
      setScanning(false);
    }
  };

  return (
    <>
      <Button 
        type="primary"
        icon={<ScanOutlined />} 
        style={{ width: '100%', marginTop: 10, height: 40 }}
        onClick={() => setIsOpen(true)}
      >
        🔐 Đăng nhập bằng Face ID
      </Button>

      <Modal 
        title="Quét khuôn mặt (Secure Mode)" 
        open={isOpen} 
        onCancel={() => setIsOpen(false)}
        footer={null}
        destroyOnHidden={true}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 20, border: '2px solid #52c41a', borderRadius: 8, overflow: 'hidden' }}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              videoConstraints={{ facingMode: "user" }}
            />
          </div>
          
          <Button 
            type="primary" 
            size="large" 
            onClick={handleScan} 
            loading={scanning}
            style={{ width: '100%', background: '#52c41a', borderColor: '#52c41a' }}
          >
            {scanning ? 'Đang xác thực bảo mật...' : 'XÁC THỰC NGAY'}
          </Button>

          <div style={{ marginTop: 20, textAlign: 'left' }}>
             {/* --- ĐÃ SỬA: Đổi 'message' thành 'title' để xóa cảnh báo vàng --- */}
             <Alert title="Bảo mật cao" description="Sử dụng Token mã hóa từ Server. Mật khẩu của bạn được ẩn hoàn toàn." type="success" showIcon />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LoginWithFace;