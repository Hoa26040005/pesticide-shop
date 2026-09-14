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
    <div style={{padding: 20}}>
      <Title level={3}>Tổng quan hôm nay</Title>
      
      {/* 4 THẺ THỐNG KÊ CHÍNH */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card bordered={false} style={{background: '#e6f7ff'}}>
            <Statistic 
              title="Doanh thu" 
              value={reportData?.revenue?.summary?.totalRevenue || 0} 
              prefix={<DollarOutlined />} 
              suffix="đ" 
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          {isAdmin ? (
            <Card bordered={false} style={{background: '#f6ffed'}}>
              <Statistic 
                title="Lợi nhuận gộp" 
                value={reportData?.revenue?.summary?.totalProfit || 0} 
                prefix={<RiseOutlined />} 
                suffix="đ" 
                valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
              />
              <div style={{fontSize: 11, color: '#666'}}>Ước tính lãi (Giá bán - Giá vốn)</div>
            </Card>
          ) : (
            <Card bordered={false} style={{background: '#f6ffed'}}>
              <Statistic 
                title="Mặt hàng đang bán" 
                value={totalProductsCount} 
                prefix={<AppstoreOutlined />} 
                valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
              />
              <div style={{fontSize: 11, color: '#666'}}>Thuốc & Phân bón có trong kho</div>
            </Card>
          )}
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} style={{background: '#fff7e6'}}>
            <Statistic 
              title="Đơn hàng" 
              value={reportData?.revenue?.summary?.totalOrders || 0} 
              prefix={<ShoppingCartOutlined />} 
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} style={{background: '#fff1f0'}}>
            <Statistic 
              title="Sắp hết hàng" 
              value={lowStockProducts.length} 
              prefix={<WarningOutlined />} 
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {/* BẢNG CẢNH BÁO TỒN KHO */}
        <Col xs={24} md={12}>
          <Card title={<span style={{color: '#faad14'}}><WarningOutlined /> Cần nhập hàng gấp</span>}>
            <Table 
              dataSource={lowStockProducts.slice(0, 5)} 
              pagination={false} 
              rowKey="key"
              size="small"
              columns={[
                { title: 'Tên thuốc', dataIndex: 'name', render: t => <b>{t}</b> },
                { title: 'Tồn kho', dataIndex: 'quantity', align: 'center', render: q => <Tag color="red">{q}</Tag> },
                { title: 'Định mức', dataIndex: 'min_stock', align: 'center', render: m => <Tag>{m || 5}</Tag> }
              ]}
            />
            {lowStockProducts.length > 5 && <div style={{textAlign: 'center', marginTop: 10, color: '#888'}}>Và {lowStockProducts.length - 5} sản phẩm khác...</div>}
          </Card>
        </Col>

        {/* THỐNG KÊ DOANH THU THEO LOẠI */}
        <Col xs={24} md={12}>
          <Card title="Tình hình kinh doanh">
             <Row gutter={16} style={{textAlign: 'center'}}>
                 <Col span={8}>
                    <Statistic title="Đã thu tiền" value={reportData?.revenue?.summary?.totalPaid} valueStyle={{color: '#52c41a'}} />
                 </Col>
                 <Col span={8}>
                    <Statistic title="Công nợ mới" value={reportData?.revenue?.summary?.totalDebt} valueStyle={{color: '#f5222d'}} />
                 </Col>
                 <Col span={8}>
                    <Statistic title="Tổng khách nợ" value={reportData?.currentDebt?.summary?.totalDebtCustomers} prefix={<UserOutlined />} />
                 </Col>
             </Row>
             <div style={{marginTop: 20, padding: 10, background: '#fafafa', borderRadius: 8}}>
                 <p><strong>💡 Gợi ý:</strong></p>
                 <ul style={{paddingLeft: 20, margin: 0, color: '#666'}}>
                     <li>Kiểm tra mục <b>Kho hàng</b> để xem hạn sử dụng.</li>
                     <li>Vào mục <b>Báo cáo</b> để xuất file Excel cuối ngày.</li>
                 </ul>
             </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;