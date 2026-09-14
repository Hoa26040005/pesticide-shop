import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Button, message, Alert } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
// --- BẮT BUỘC THÊM: Thư viện Auth của Firebase để lấy thông tin tài khoản ---
import { getAuth } from 'firebase/auth';

const FaceRegister = ({ onCancel, onSuccess }) => {
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  const handleRegister = async () => {
    // --- BƯỚC BẢO MẬT: KIỂM TRA XEM ĐÃ ĐĂNG NHẬP CHƯA ---
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      message.error("Bảo mật: Bạn phải đăng nhập bằng mật khẩu trước khi đăng ký Face ID!");
      return; // Chặn đứng ngay lập tức, không cho làm bước tiếp theo
    }

    setLoading(true);
    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      message.error("Lỗi Camera!");
      setLoading(false);
      return;
    }

    try {
      const file = dataURLtoFile(imageSrc, "register.jpg");
      const formData = new FormData();
      formData.append("file", file);
      
      // --- ĐÃ SỬA: Lấy chính xác Email của người đang đăng nhập ---
      formData.append("email", currentUser.email); 

      const response = await fetch("https://hoa2604205-nhan-dien-khuon-mat.hf.space/register", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        if (typeof onSuccess === 'function') {
          onSuccess(); 
        } else {
          message.success(`✅ Đã gắn Face ID vào tài khoản ${currentUser.email} thành công!`);
          if (typeof onCancel === 'function') onCancel();
        }
      } else {
        message.error("Lỗi: " + result.message);
      }
    } catch (error) {
      console.error(error);
      message.error("Lỗi kết nối đến Server AI trên Hugging Face!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <Alert 
        title="Bảo mật Đám mây" 
        description="Khuôn mặt sẽ được mã hóa và gắn chặt với Email bạn đang đăng nhập." 
        type="info" 
        showIcon 
        style={{ marginBottom: 20, textAlign: 'left' }} 
      />
      <div style={{ marginBottom: 20, border: '2px solid #52c41a', borderRadius: 8, overflow: 'hidden' }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width="100%"
          videoConstraints={{ facingMode: "user" }}
        />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Button onClick={onCancel} size="large">Hủy bỏ</Button>
        <Button 
          type="primary" 
          size="large" 
          icon={<CameraOutlined />} 
          onClick={handleRegister} 
          loading={loading}
          style={{ background: '#52c41a', borderColor: '#52c41a' }}
        >
          {loading ? 'Đang tải lên mây...' : 'Chụp & Đăng ký Face ID'}
        </Button>
      </div>
    </div>
  );
};

export default FaceRegister;