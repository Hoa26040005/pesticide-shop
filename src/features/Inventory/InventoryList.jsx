// src/features/Inventory/InventoryList.jsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, Select, message, Tag, Card, Row, Col, Space, Statistic, Badge, Typography } from 'antd';
import { 
  PlusOutlined, HistoryOutlined, SearchOutlined, ReloadOutlined, 
  FilterOutlined, AppstoreOutlined, WarningOutlined, CloseCircleOutlined, BoxPlotOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { getProducts } from '../../services/productService'; 
import { importProduct, getBatches } from '../../services/inventoryService';

const { Option } = Select;
const { Title, Text } = Typography;

const InventoryList = () => {
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]); 
  const [products, setProducts] = useState([]);
  
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Tính toán thống kê
  const stats = {
    totalItems: batches.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    expiringSoon: batches.filter(b => {
        const days = moment(b.expiry_date).diff(moment(), 'days');
        return days > 0 && days <= 90;
    }).length,
    expired: batches.filter(b => moment(b.expiry_date).diff(moment(), 'days') <= 0).length,
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [batchData, productData] = await Promise.all([getBatches(), getProducts()]);
      // Sắp xếp theo ngày hết hạn tăng dần
      const sortedBatches = batchData.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
      setBatches(sortedBatches);
      setFilteredBatches(sortedBatches);
      setProducts(productData);
    } catch (error) {
      message.error("Lỗi tải dữ liệu kho: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    let result = batches;
    if (searchText) {
      const lowerText = searchText.toLowerCase();
      result = result.filter(item => 
        item.batch_code?.toLowerCase().includes(lowerText) ||
        item.product_name?.toLowerCase().includes(lowerText) ||
        item.sku?.toLowerCase().includes(lowerText)
      );
    }
    const today = moment();
    if (statusFilter === 'EXPIRING') {
      result = result.filter(item => {
        const days = moment(item.expiry_date).diff(today, 'days');
        return days > 0 && days <= 90;
      });
    } else if (statusFilter === 'EXPIRED') {
      result = result.filter(item => moment(item.expiry_date).diff(today, 'days') <= 0);
    } else if (statusFilter === 'GOOD') {
      result = result.filter(item => moment(item.expiry_date).diff(today, 'days') > 90);
    }
    setFilteredBatches(result);
  }, [searchText, statusFilter, batches]);

  const handleImport = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const selectedProduct = products.find(p => p.key === values.product_id);
      
      if (!selectedProduct) {
          message.error("Sản phẩm không hợp lệ!");
          setLoading(false);
          return;
      }

      const importData = {
        ...values,
        product_name: selectedProduct.name,
        sku: selectedProduct.sku,
        expiry_date: values.expiry_date.format('YYYY-MM-DD'),
      };
      
      await importProduct(importData);
      message.success('Nhập kho thành công!');
      setIsModalOpen(false);
      form.resetFields();
      fetchInitialData(); 
    } catch (error) {
      if (!error?.errorFields) {
          message.error('Lỗi nhập kho: ' + (error.message || error));
      }
    } finally {
      setLoading(false);
    }
  };

  // --- CẤU HÌNH CỘT BẢNG ---
  const columns = [
    {
      title: 'STT',
      key: 'stt',
      align: 'center',
      width: 60,
      render: (_, __, index) => <b style={{ color: '#8c8c8c' }}>{index + 1}</b>
    },
    { 
        title: 'Tình trạng', 
        key: 'status', 
        width: 120,
        align: 'center',
        render: (_, record) => {
            const daysLeft = moment(record.expiry_date).diff(moment(), 'days');
            if (daysLeft <= 0) return <Tag color="error" style={{borderRadius: 4}}><CloseCircleOutlined /> Hết hạn</Tag>;
            if (daysLeft <= 90) return <Tag color="warning" style={{borderRadius: 4}}><WarningOutlined /> Sắp hết</Tag>;
            return <Badge status="success" text="Tốt" />;
        }
    },
    { 
        title: 'Mã Lô', 
        dataIndex: 'batch_code', 
        key: 'batch_code', 
        width: 120,
        render: t => <Tag color="geekblue" style={{fontWeight: 600, padding: '2px 8px'}}>{t}</Tag> 
    },
    { 
        title: 'Sản phẩm', 
        dataIndex: 'product_name', 
        key: 'product_name',
        render: (text, record) => (
          <div>
            <div style={{fontWeight: 600, color: '#1f1f1f', fontSize: 14}}>{text}</div>
            <div style={{fontSize: 12, color: '#8c8c8c'}}>SKU: {record.sku}</div>
          </div>
        )
    },
    { 
      title: 'Hạn sử dụng', 
      dataIndex: 'expiry_date', 
      key: 'expiry_date',
      width: 160,
      render: (date) => {
        const daysLeft = moment(date).diff(moment(), 'days');
        if (daysLeft <= 0) return (
          <div>
            <div style={{textDecoration: 'line-through', color: '#bfbfbf'}}>{moment(date).format('DD/MM/YYYY')}</div>
            <Text type="danger" style={{fontSize: 12}}>Đã hết hạn</Text>
          </div>
        );
        let color = daysLeft < 30 ? 'red' : daysLeft <= 90 ? 'orange' : 'green';
        let text = daysLeft < 30 ? `Cấp bách: Còn ${daysLeft} ngày` : `Còn ${daysLeft} ngày`;
        return (
          <div>
            <div style={{fontWeight: 500}}>{moment(date).format('DD/MM/YYYY')}</div>
            <span style={{color: color, fontSize: 12, fontWeight: 500}}>{text}</span>
          </div>
        );
      }
    },
    { 
        title: 'Tồn kho lô này', 
        dataIndex: 'quantity', 
        key: 'quantity', 
        align: 'right',
        width: 130,
        render: q => <span style={{fontSize: 16, fontWeight: 'bold', color: '#1677ff'}}>{Number(q).toLocaleString()}</span> 
    },
    { 
        title: 'Ngày nhập lô', 
        dataIndex: 'import_date', 
        key: 'import_date', 
        width: 150,
        render: d => d ? <span style={{color: '#8c8c8c'}}>{moment(d).format('DD/MM/YYYY HH:mm')}</span> : '-' 
    },
  ];

  // --- CSS NÂNG CAO ---
  const customStyles = `
    .inventory-stat-card {
      border-radius: 16px;
      border: none;
      transition: all 0.3s ease;
    }
    .inventory-stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important;
    }
    .inventory-toolbar {
      background: #ffffff;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      margin-bottom: 24px;
    }
  `;

  return (
    <div style={{ padding: '0 12px 24px' }}>
      <style>{customStyles}</style>

      <Title level={3} style={{ marginBottom: 20, color: '#262626' }}>
        <BoxPlotOutlined style={{ color: '#1677ff', marginRight: 10 }}/>
        Quản lý Kho & Lô Hàng
      </Title>

      {/* --- DASHBOARD THỐNG KÊ --- */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card className="inventory-stat-card" style={{ background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)', boxShadow: '0 4px 12px rgba(22,119,255,0.1)' }}>
            <Statistic 
                title={<span style={{color: '#0958d9', fontWeight: 600}}>TỔNG SỐ LƯỢNG TỒN (Tất cả lô)</span>} 
                value={stats.totalItems} 
                valueStyle={{ color: '#0958d9', fontWeight: 800, fontSize: 32 }}
                prefix={<AppstoreOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="inventory-stat-card" style={{ background: 'linear-gradient(135deg, #fff7e6 0%, #ffd8bf 100%)', boxShadow: '0 4px 12px rgba(250,140,22,0.1)' }}>
            <Statistic 
                title={<span style={{color: '#ad4e00', fontWeight: 600}}>LÔ SẮP HẾT HẠN (Dưới 90 ngày)</span>} 
                value={stats.expiringSoon} 
                valueStyle={{ color: '#d46b08', fontWeight: 800, fontSize: 32 }} 
                prefix={<WarningOutlined />} 
                suffix="Lô"
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="inventory-stat-card" style={{ background: 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)', boxShadow: '0 4px 12px rgba(245,34,45,0.1)' }}>
            <Statistic 
                title={<span style={{color: '#a8071a', fontWeight: 600}}>LÔ ĐÃ QUÁ HẠN SỬ DỤNG</span>} 
                value={stats.expired} 
                valueStyle={{ color: '#cf1322', fontWeight: 800, fontSize: 32 }} 
                prefix={<CloseCircleOutlined />} 
                suffix="Lô"
            />
          </Card>
        </Col>
      </Row>

      {/* --- THANH CÔNG CỤ (TOOLBAR) --- */}
      <div className="inventory-toolbar">
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} lg={16}>
                <Space wrap size="middle">
                    <Input 
                        placeholder="Tìm theo Mã lô, Tên thuốc, SKU..." 
                        prefix={<SearchOutlined style={{color: '#bfbfbf'}}/>} 
                        style={{ width: 300, borderRadius: 8 }} 
                        onChange={e => setSearchText(e.target.value)} 
                        allowClear 
                        size="large"
                    />
                    <Select 
                        defaultValue="ALL" 
                        style={{ width: 200 }} 
                        size="large"
                        onChange={setStatusFilter} 
                        suffixIcon={<FilterOutlined />}
                    >
                        <Option value="ALL">Tất cả tình trạng</Option>
                        <Option value="EXPIRING">⚠️ Lô sắp hết hạn</Option>
                        <Option value="EXPIRED">⛔ Lô đã hết hạn</Option>
                        <Option value="GOOD">✅ Lô còn hạn dài</Option>
                    </Select>
                    <Button icon={<ReloadOutlined />} onClick={fetchInitialData} size="large" shape="round">Tải lại</Button>
                </Space>
            </Col>
            <Col xs={24} lg={8} style={{ textAlign: 'right' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} size="large" shape="round">
                    Nhập lô hàng mới
                </Button>
            </Col>
        </Row>
      </div>

      {/* --- BẢNG DỮ LIỆU --- */}
      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }} bodyStyle={{padding: 0}}>
        <Table 
            columns={columns} 
            dataSource={filteredBatches} 
            rowKey="key" 
            loading={loading} 
            locale={{ emptyText: 'Chưa có dữ liệu kho hàng' }} 
            pagination={{ pageSize: 10, showSizeChanger: true }} 
            scroll={{ x: 900 }} 
        />
      </Card>

      {/* --- MODAL NHẬP KHO --- */}
      <Modal 
        title={<span style={{fontSize: 18}}><PlusOutlined style={{color: '#1677ff', marginRight: 8}}/> Phiếu Nhập Kho Lô Mới</span>} 
        open={isModalOpen} 
        onOk={handleImport} 
        confirmLoading={loading} 
        onCancel={() => setIsModalOpen(false)} 
        width={600}
        destroyOnHidden={true} // ĐÃ FIX LỖI CONSOLE Ở ĐÂY
        centered
      >
        <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, marginBottom: 20, marginTop: 10 }}>
            <Text type="secondary"><WarningOutlined style={{color: '#faad14'}}/> Lưu ý: Bạn cần chọn sản phẩm đã có sẵn trong danh mục. Nếu là thuốc mới hoàn toàn, vui lòng sang trang <a href="/products">Sản phẩm</a> để tạo trước.</Text>
        </div>

        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="product_id" label="Chọn thuốc nhập kho" rules={[{ required: true, message: 'Vui lòng chọn thuốc' }]}>
            <Select 
                showSearch 
                size="large"
                placeholder="Gõ tên thuốc hoặc mã SKU để tìm kiếm..." 
                optionFilterProp="children"
                filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}
            >
              {products.map(p => (<Option key={p.key} value={p.key}><b style={{color: '#1677ff'}}>{p.sku}</b> - {p.name} ({p.unit})</Option>))}
            </Select>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
                <Form.Item name="batch_code" label="Mã lô sản xuất" rules={[{ required: true, message: 'Vui lòng nhập mã lô' }]}>
                    <Input size="large" placeholder="Ví dụ: LO-00123" />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item name="expiry_date" label="Hạn sử dụng của lô" rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}>
                    <DatePicker size="large" style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày hết hạn" />
                </Form.Item>
            </Col>
          </Row>

          <Form.Item name="quantity" label="Số lượng nhập vào" rules={[{ required: true, message: 'Nhập số lượng lớn hơn 0' }]}>
            <InputNumber 
                size="large"
                style={{ width: '100%' }} 
                min={1} 
                placeholder="Ví dụ: 100" 
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                parser={value => value.replace(/\$\s?|(,*)/g, '')} 
            />
          </Form.Item>
        </Form> 
      </Modal>
    </div>
  );
};

export default InventoryList;