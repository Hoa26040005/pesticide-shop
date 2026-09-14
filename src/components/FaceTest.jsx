import React, { useState } from 'react';
import { Button, Card, Typography, Alert, Tag, Space } from 'antd';
import { 
  EyeOutlined, 
  DeleteOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined 
} from '@ant-design/icons';
import { 
  isFaceRegistered, 
  getFaceDescriptor, 
  clearFaceData 
} from '../utils/faceDetection';

const { Text, Title } = Typography;

const FaceTest = () => {
  const [faceData, setFaceData] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkFaceData = () => {
    setLoading(true);
    try {
      const exists = isFaceRegistered();
      if (exists) {
        const descriptor = getFaceDescriptor();
        const registerTime = localStorage.getItem('face_register_time');
        const confidence = localStorage.getItem('face_confidence');
        const samples = localStorage.getItem('face_samples') || 1;
        
        setFaceData({
          exists: true,
          length: descriptor?.length || 0,
          timestamp: registerTime,
          confidence: confidence,
          samples: samples,
          preview: descriptor?.slice(0, 5) // Hiển thị 5 số đầu
        });
      } else {
        setFaceData({ exists: false });
      }
    } catch (error) {
      console.error("Check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    clearFaceData();
    setFaceData({ exists: false });
    alert("Đã xóa dữ liệu khuôn mặt!");
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Không xác định';
    return new Date(isoString).toLocaleString('vi-VN');
  };

  return (
    <Card 
      title={
        <Space>
          <SafetyCertificateOutlined />
          <span>Kiểm tra Face ID</span>
        </Space>
      }
      style={{ maxWidth: 500, margin: '20px auto' }}
      actions={[
        <Button 
          key="check" 
          type="primary" 
          icon={<EyeOutlined />} 
          onClick={checkFaceData}
          loading={loading}
        >
          Kiểm tra
        </Button>,
        <Button 
          key="clear" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={handleClear}
          disabled={!faceData?.exists}
        >
          Xóa dữ liệu
        </Button>,
        <Button 
          key="refresh" 
          icon={<ReloadOutlined />} 
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      ]}
    >
      {faceData ? (
        faceData.exists ? (
          <div>
            <Alert 
              message="✅ Đã đăng ký Face ID" 
              type="success" 
              showIcon 
              style={{ marginBottom: 20 }}
            />
            
            <div style={{ lineHeight: 2 }}>
              <div>
                <Text strong>Số mẫu:</Text> 
                <Tag color="blue" style={{ marginLeft: 10 }}>
                  {faceData.samples} mẫu
                </Tag>
              </div>
              
              <div>
                <Text strong>Độ tin cậy:</Text> 
                <Tag color="green" style={{ marginLeft: 10 }}>
                  {faceData.confidence}%
                </Tag>
              </div>
              
              <div>
                <Text strong>Thời gian đăng ký:</Text> 
                <div style={{ marginLeft: 10, color: '#666' }}>
                  {formatDate(faceData.timestamp)}
                </div>
              </div>
              
              <div>
                <Text strong>Kích thước vector:</Text> 
                <Tag style={{ marginLeft: 10 }}>
                  {faceData.length} số
                </Tag>
              </div>
              
              <div style={{ marginTop: 15 }}>
                <Text strong>Preview (5 số đầu):</Text>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: 10, 
                  borderRadius: 6,
                  marginTop: 5,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  overflowX: 'auto'
                }}>
                  [{faceData.preview?.join(', ')}...]
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Alert 
            message="❌ Chưa đăng ký Face ID" 
            description="Bạn chưa đăng ký khuôn mặt. Vui lòng đăng ký để sử dụng tính năng đăng nhập bằng khuôn mặt."
            type="warning" 
            showIcon 
          />
        )
      ) : (
        <div style={{ textAlign: 'center', padding: 30 }}>
          <Title level={4} type="secondary">
            Nhấn "Kiểm tra" để xem trạng thái Face ID
          </Title>
          <Text type="secondary">
            Hệ thống sẽ kiểm tra dữ liệu khuôn mặt đã lưu trong trình duyệt
          </Text>
        </div>
      )}
    </Card>
  );
};

export default FaceTest;