// src/features/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin } from 'antd';
import { DollarOutlined, UserOutlined, WarningOutlined, ShoppingCartOutlined, RiseOutlined, CheckCircleOutlined, AppstoreOutlined } from '@ant-design/icons';
import { getCombinedReport } from '../../services/reportService';
import { getProducts } from '../../services/productService'; 
import { useAuth } from '../../context/AuthContext';

const { Title } = Typography;

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Lấy báo cáo hôm nay (Doanh thu, Lợi nhuận)
        const data = await getCombinedReport('day');
        setReportData(data);

        // 2. Lấy danh sách sản phẩm để tìm hàng sắp hết
        const products = await getProducts();
        setTotalProductsCount(products.length);
        const lowStock = products.filter(p => p.quantity <= (p.min_stock || 5));
        setLowStockProducts(lowStock);

      } catch (error) {
        console.error("Lỗi tải dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div style={{textAlign: 'center', padding: 50}}><Spin size="large"/></div>;

  return (
    <div>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Tổng quan hôm nay
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Chỉ số hoạt động bán hàng và vận hành kho dược phẩm nông nghiệp
          </p>
        </div>
        <Tag style={{ 
          background: '#ecfdf5', 
          border: '1px solid #a7f3d0', 
          color: '#065f46',
          padding: '4px 12px',
          borderRadius: 20,
          fontWeight: 600,
          fontSize: 12,
        }}>
          ● Dữ liệu thời gian thực
        </Tag>
      </div>
      
      {/* 4 THẺ THỐNG KÊ CHÍNH (BENTO METRIC CARDS) */}
      <Row gutter={[18, 18]}>
        {/* DOANH THU */}
        <Col xs={24} sm={12} lg={6}>
          <div className="bento-card" style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '20px 22px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Doanh thu
                </span>
                <div style={{ 
                  fontSize: 26, 
                  fontWeight: 800, 
                  color: '#0f172a', 
                  marginTop: 8,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {(reportData?.revenue?.summary?.totalRevenue || 0).toLocaleString('vi-VN')} <span style={{ fontSize: 16, fontWeight: 600, color: '#059669' }}>đ</span>
                </div>
              </div>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(5, 150, 105, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
                fontSize: 20,
              }}>
                <DollarOutlined />
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>●</span> Hôm nay
            </div>
          </div>
        </Col>

        {/* LỢI NHUẬN / MẶT HÀNG */}
        <Col xs={24} sm={12} lg={6}>
          <div className="bento-card" style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '20px 22px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isAdmin ? 'Lợi nhuận gộp' : 'Mặt hàng đang bán'}
                </span>
                <div style={{ 
                  fontSize: 26, 
                  fontWeight: 800, 
                  color: '#0f172a', 
                  marginTop: 8,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {isAdmin ? (
                    <>
                      {(reportData?.revenue?.summary?.totalProfit || 0).toLocaleString('vi-VN')} <span style={{ fontSize: 16, fontWeight: 600, color: '#10b981' }}>đ</span>
                    </>
                  ) : (
                    <>
                      {totalProductsCount} <span style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>loại</span>
                    </>
                  )}
                </div>
              </div>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                fontSize: 20,
              }}>
                {isAdmin ? <RiseOutlined /> : <AppstoreOutlined />}
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
              {isAdmin ? 'Ước tính (Giá bán - Giá vốn)' : 'Thuốc & Phân bón sẵn sàng'}
            </div>
          </div>
        </Col>

        {/* ĐƠN HÀNG */}
        <Col xs={24} sm={12} lg={6}>
          <div className="bento-card" style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '20px 22px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Đơn hàng
                </span>
                <div style={{ 
                  fontSize: 26, 
                  fontWeight: 800, 
                  color: '#0f172a', 
                  marginTop: 8,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {reportData?.revenue?.summary?.totalOrders || 0} <span style={{ fontSize: 16, fontWeight: 600, color: '#d97706' }}>đơn</span>
                </div>
              </div>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
                fontSize: 20,
              }}>
                <ShoppingCartOutlined />
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#d97706', fontWeight: 600 }}>
              Đã xuất trong ngày
            </div>
          </div>
        </Col>

        {/* SẮP HẾT HÀNG */}
        <Col xs={24} sm={12} lg={6}>
          <div className="bento-card" style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '20px 22px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Sắp hết hàng
                </span>
                <div style={{ 
                  fontSize: 26, 
                  fontWeight: 800, 
                  color: lowStockProducts.length > 0 ? '#ef4444' : '#10b981', 
                  marginTop: 8,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {lowStockProducts.length} <span style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>loại</span>
                </div>
              </div>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: lowStockProducts.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: lowStockProducts.length > 0 ? '#ef4444' : '#10b981',
                fontSize: 20,
              }}>
                {lowStockProducts.length > 0 ? <WarningOutlined /> : <CheckCircleOutlined />}
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: lowStockProducts.length > 0 ? '#dc2626' : '#059669', fontWeight: 600 }}>
              {lowStockProducts.length > 0 ? 'Cần nhập hàng bổ sung' : 'Kho an toàn'}
            </div>
          </div>
        </Col>
      </Row>

      {/* SECTION 2: CHI TIẾT VẬN HÀNH & KINH DOANH */}
      <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
        {/* BẢNG CẢNH BÁO TỒN KHO */}
        <Col xs={24} md={12}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b45309', fontWeight: 700, fontSize: 15 }}>
                <WarningOutlined style={{ color: '#f59e0b', fontSize: 18 }} />
                <span>Cần nhập hàng gấp</span>
                {lowStockProducts.length > 0 && (
                  <Tag style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 12, marginLeft: 4 }}>
                    {lowStockProducts.length}
                  </Tag>
                )}
              </div>
            }
            styles={{ body: { padding: '16px 20px' } }}
            style={{ borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
          >
            <Table 
              dataSource={lowStockProducts.slice(0, 5)} 
              pagination={false} 
              rowKey="key"
              size="middle"
              columns={[
                { 
                  title: 'Tên thuốc / Phân bón', 
                  dataIndex: 'name', 
                  render: t => <span style={{ fontWeight: 600, color: '#1e293b' }}>{t}</span> 
                },
                { 
                  title: 'Tồn kho', 
                  dataIndex: 'quantity', 
                  align: 'center', 
                  render: q => (
                    <span style={{ 
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: 20,
                      background: '#fee2e2',
                      color: '#b91c1c',
                      fontWeight: 700,
                      fontSize: 13,
                    }}>
                      {q}
                    </span>
                  ) 
                },
                { 
                  title: 'Định mức tối thiểu', 
                  dataIndex: 'min_stock', 
                  align: 'center', 
                  render: m => (
                    <span style={{ 
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: '#f1f5f9',
                      color: '#475569',
                      fontWeight: 600,
                      fontSize: 12,
                    }}>
                      {m || 5}
                    </span>
                  ) 
                }
              ]}
            />
            {lowStockProducts.length > 5 && (
              <div style={{ textAlign: 'center', marginTop: 14, color: '#64748b', fontSize: 13 }}>
                Và <b>{lowStockProducts.length - 5}</b> sản phẩm khác cần lưu ý...
              </div>
            )}
          </Card>
        </Col>

        {/* THỐNG KÊ DOANH THU THEO LOẠI */}
        <Col xs={24} md={12}>
          <Card 
            title={
              <span style={{ color: '#0f172a', fontWeight: 700, fontSize: 15 }}>
                Tình hình kinh doanh
              </span>
            }
            styles={{ body: { padding: '20px' } }}
            style={{ borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
          >
             <Row gutter={16} style={{ textAlign: 'center' }}>
                 <Col span={8}>
                    <div style={{ padding: '12px 8px', background: '#f8fafc', borderRadius: 10 }}>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Đã thu tiền</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#059669', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
                        {(reportData?.revenue?.summary?.totalPaid || 0).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                 </Col>
                 <Col span={8}>
                    <div style={{ padding: '12px 8px', background: '#f8fafc', borderRadius: 10 }}>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Công nợ mới</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#ef4444', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
                        {(reportData?.revenue?.summary?.totalDebt || 0).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                 </Col>
                 <Col span={8}>
                    <div style={{ padding: '12px 8px', background: '#f8fafc', borderRadius: 10 }}>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Khách đang nợ</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#334155', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
                        {reportData?.currentDebt?.summary?.totalDebtCustomers || 0} khách
                      </div>
                    </div>
                 </Col>
             </Row>

             <div style={{
               marginTop: 20, 
               padding: '14px 18px', 
               background: '#f0fdf4', 
               borderRadius: 10,
               border: '1px solid #bbf7d0',
               display: 'flex',
               gap: 12,
               alignItems: 'flex-start',
             }}>
                 <div style={{ fontSize: 20, lineHeight: 1 }}>💡</div>
                 <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                   <div style={{ fontWeight: 700, marginBottom: 4 }}>Khuyến nghị quản trị:</div>
                   <ul style={{ paddingLeft: 18, margin: 0 }}>
                     <li>Kiểm tra mục <b>Kho hàng</b> để ưu tiên xuất lô hàng sắp hết hạn (FEFO).</li>
                     <li>Xem chi tiết <b>Sổ nợ</b> để kịp thời nhắc thanh toán đối với các khách hàng gối đầu vụ.</li>
                   </ul>
                 </div>
             </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;