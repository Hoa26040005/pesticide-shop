// src/features/Product/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Descriptions, Image, Skeleton, Tag, Row, Col, Typography, Space, Divider, Statistic } from 'antd';
import { 
  ArrowLeftOutlined, EditOutlined, ShopOutlined, 
  BarcodeOutlined, CalendarOutlined, DollarOutlined,
  MedicineBoxOutlined, WarningOutlined, CheckCircleOutlined 
} from '@ant-design/icons';
import moment from 'moment';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProduct({ key: docSnap.id, ...docSnap.data() });
        } else {
          console.log("Không tìm thấy sản phẩm!");
        }
      } catch (error) {
        console.error("Lỗi tải chi tiết:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // --- COMPONENT CHỜ TẢI DỮ LIỆU CHUẨN UX ---
  if (loading) return (
    <div style={{ padding: 24 }}>
      <Button icon={<ArrowLeftOutlined />} disabled style={{ marginBottom: 16 }}>Quay lại</Button>
      <Card style={{ borderRadius: 16 }}><Skeleton active avatar={{ shape: 'square', size: 200 }} paragraph={{ rows: 8 }} /></Card>
    </div>
  );

  if (!product) return (
    <div style={{textAlign: 'center', marginTop: 100}}>
      <WarningOutlined style={{ fontSize: 64, color: '#faad14', marginBottom: 16 }} />
      <Title level={3}>Sản phẩm không tồn tại hoặc đã bị xóa!</Title>
      <Button type="primary" onClick={() => navigate(-1)}>Quay lại danh sách</Button>
    </div>
  );

  // Xử lý các biến số liệu
  const qty = product.quantity || 0;
  const minStock = product.min_stock || 5;
  let stockStatus = { color: 'success', text: 'Còn hàng', icon: <CheckCircleOutlined /> };
  if (qty <= 0) stockStatus = { color: 'error', text: 'Hết hàng', icon: <WarningOutlined /> };
  else if (qty <= minStock) stockStatus = { color: 'warning', text: 'Sắp hết hàng', icon: <WarningOutlined /> };

  // --- CSS NÂNG CAO ---
  const customStyles = `
    .product-image-container {
      background: #fafafa;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      border: 1px dashed #d9d9d9;
      height: 100%;
      min-height: 350px;
    }
    .highlight-box {
      background: linear-gradient(145deg, #f6ffed 0%, #ffffff 100%);
      border: 1px solid #ffccc7;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .instruction-box {
      background: #f6ffed;
      border-left: 4px solid #52c41a;
      padding: 16px;
      border-radius: 4px 8px 8px 4px;
      margin-top: 24px;
    }
  `;

  return (
    <div style={{ padding: '0 12px 24px' }}>
      <style>{customStyles}</style>
      
      {/* Nút điều hướng */}
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/products')} 
          style={{ fontSize: 16, padding: 0 }}
        >
          Danh sách thuốc
        </Button>
        <Button type="primary" icon={<EditOutlined />} shape="round">
          Chỉnh sửa sản phẩm
        </Button>
      </Space>

      <Card style={{ borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: 'none' }} bodyStyle={{ padding: 32 }}>
        <Row gutter={[40, 24]}>
          
          {/* CỘT TRÁI: HÌNH ẢNH STUDIO */}
          <Col xs={24} md={10} lg={8}>
            <div className="product-image-container">
              <Image
                width="100%"
                style={{ objectFit: 'contain', maxHeight: 350, filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}
                src={product.image_url}
                fallback="https://via.placeholder.com/300?text=Chưa+có+ảnh"
              />
            </div>
          </Col>

          {/* CỘT PHẢI: THÔNG TIN CHI TIẾT */}
          <Col xs={24} md={14} lg={16}>
            <div style={{ marginBottom: 16 }}>
              <Space wrap style={{ marginBottom: 8 }}>
                <Tag color="cyan" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 20 }}>{product.category || 'Chưa phân loại'}</Tag>
                {product.sub_category && <Tag color="blue" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 20 }}>{product.sub_category}</Tag>}
              </Space>
              
              <Title level={2} style={{ margin: '0 0 8px 0', color: '#1f1f1f', fontWeight: 700 }}>
                {product.name}
              </Title>
              
              <Text type="secondary" style={{ fontSize: 15 }}>
                <BarcodeOutlined style={{marginRight: 6}} /> SKU: <b style={{color: '#595959'}}>{product.sku}</b>
              </Text>
            </div>
            
            {/* KHỐI NỔI BẬT: GIÁ VÀ TỒN KHO */}
            <div className="highlight-box">
              <Row gutter={24}>
                <Col span={12}>
                  <Statistic 
                    title={<span style={{fontSize: 14, color: '#8c8c8c'}}>Giá bán lẻ</span>} 
                    value={product.price || 0} 
                    suffix={`đ / ${product.unit || 'Sản phẩm'}`}
                    valueStyle={{ color: '#cf1322', fontWeight: 800, fontSize: 32 }}
                  />
                  {isAdmin && (
                    <div style={{marginTop: 4, fontSize: 13, color: '#8c8c8c'}}>
                      Giá nhập (Vốn): {Number(product.import_price || 0).toLocaleString()} đ
                    </div>
                  )}
                </Col>
                <Col span={12}>
                  <Statistic 
                    title={<span style={{fontSize: 14, color: '#8c8c8c'}}>Tồn kho hiện tại</span>} 
                    value={qty} 
                    suffix={product.unit}
                    valueStyle={{ color: stockStatus.color === 'error' ? '#cf1322' : '#237804', fontWeight: 700 }}
                  />
                  <Tag color={stockStatus.color} style={{ marginTop: 8, borderRadius: 4 }}>
                    {stockStatus.icon} {stockStatus.text}
                  </Tag>
                </Col>
              </Row>
            </div>

            {/* THÔNG TIN CHI TIẾT */}
            <Descriptions column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} labelStyle={{ color: '#8c8c8c' }} contentStyle={{ fontWeight: 500, color: '#262626' }}>
              <Descriptions.Item label={<span><ShopOutlined /> Nhà cung cấp</span>}>
                {product.supplier || 'Đang cập nhật'}
              </Descriptions.Item>
              
              <Descriptions.Item label={<span><CalendarOutlined /> Hạn sử dụng</span>}>
                {product.expiry_date 
                  ? <b style={{color: '#d46b08'}}>{moment(product.expiry_date.toDate ? product.expiry_date.toDate() : product.expiry_date).format('DD/MM/YYYY')}</b> 
                  : 'Không có thông tin'
                }
              </Descriptions.Item>

              <Descriptions.Item label={<span><CalendarOutlined /> Ngày nhập hệ thống</span>}>
                {product.created_at ? moment(product.created_at.toDate ? product.created_at.toDate() : product.created_at).format('DD/MM/YYYY') : 'N/A'}
              </Descriptions.Item>

              <Descriptions.Item label={<span><WarningOutlined /> Mức cảnh báo tồn</span>}>
                Dưới {minStock} {product.unit}
              </Descriptions.Item>
            </Descriptions>

            {/* KHỐI HƯỚNG DẪN SỬ DỤNG GẢI LẬP */}
            <div className="instruction-box">
              <Title level={5} style={{ color: '#237804', marginTop: 0 }}>
                <MedicineBoxOutlined style={{ marginRight: 8 }}/> 
                Thông tin nông nghiệp & Liều dùng (Tham khảo)
              </Title>
              <Row gutter={[16, 8]} style={{ marginTop: 10 }}>
                <Col span={24}>
                  <Text strong>Công dụng:</Text> Đặc trị {product.sub_category ? product.sub_category.toLowerCase() : 'các loại sâu bệnh'} trên cây trồng. Giúp bảo vệ mùa màng hiệu quả.
                </Col>
                <Col span={24}>
                  <Text strong>Liều lượng pha:</Text> Pha 20ml - 25ml cho bình 25 lít nước. Phun đều ướt lá.
                </Col>
                <Col span={24}>
                  <Text strong style={{color: '#cf1322'}}>Lưu ý:</Text> Thời gian cách ly 7-14 ngày trước khi thu hoạch. Lắc đều trước khi sử dụng.
                </Col>
              </Row>
            </div>

          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ProductDetail;