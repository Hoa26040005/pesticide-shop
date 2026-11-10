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

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "user"
  };

  const handleRegister = async () => {
    // --- BƯỚC BẢO MẬT: KIỂM TRA XEM ĐÃ ĐĂNG NHẬP CHƯA ---
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      message.error("Bảo mật: Bạn phải đăng nhập bằng mật khẩu trước khi đăng ký Face ID!");
      return;
    }

    setLoading(true);
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      message.error("Lỗi Camera!");
      setLoading(false);
      return;
    }

    try {
      const file = dataURLtoFile(imageSrc, "register.jpg");
      const formData = new FormData();
      formData.append("file", file);
      
      // Gắn Email của người đang đăng nhập
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
        title="🌸 Đăng ký nhận diện khuôn mặt Face ID" 
        description="Khuôn mặt được trích xuất vector 128 chiều và mã hóa lưu trên Cloud gắn với tài khoản của bạn." 
        type="info" 
        showIcon 
        style={{ 
          marginBottom: 18, 
          textAlign: 'left', 
          borderRadius: 12,
          background: 'rgba(251, 113, 133, 0.08)',
          border: '1px solid rgba(251, 113, 133, 0.25)',
        }} 
      />
      
      {/* KHUNG CAMERA VỚI KHUNG OVAL ĐỊNH VỊ SAKURA */}
      <div style={{ 
        position: 'relative', 
        marginBottom: 20, 
        borderRadius: 16, 
        overflow: 'hidden', 
        background: '#09040c',
        border: '2px solid #fb7185',
        boxShadow: '0 8px 30px rgba(251, 113, 133, 0.25)',
      }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          screenshotQuality={1}
          width="100%"
          videoConstraints={videoConstraints}
        />
        {/* Vòng Oval hướng dẫn đặt mặt vào giữa */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '180px',
          height: '230px',
          borderRadius: '50%',
          border: '2px dashed rgba(253, 164, 175, 0.9)',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ 
            position: 'absolute', 
            bottom: 12, 
            fontSize: 11, 
            color: '#fda4af', 
            fontWeight: 700,
            textShadow: '0 1px 4px rgba(0,0,0,0.9)' 
          }}>
            🌸 Đặt mặt thẳng vào khung
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Button onClick={onCancel} size="large" style={{ borderRadius: 12, minWidth: 100 }}>
          Hủy bỏ
        </Button>
        <Button 
          type="primary" 
          size="large" 
          icon={<CameraOutlined />} 
          onClick={handleRegister} 
          loading={loading}
          style={{ 
            borderRadius: 12,
            background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 50%, #fb7185 100%)', 
            border: 'none',
            fontWeight: 700,
            boxShadow: '0 6px 18px rgba(244, 63, 94, 0.4)',
          }}
        >
          {loading ? 'Đang trích xuất & lưu Cloud...' : '🌸 Chụp & Đăng ký Face ID'}
        </Button>
      </div>
    </div>
  );
};

export default FaceRegister;