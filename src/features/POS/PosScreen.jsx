// src/features/POS/PosScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
// ĐÃ SỬA: Loại bỏ List, thêm Table và các component cần thiết
import { Row, Col, Card, Input, Button, Typography, message, Tag, Divider, Select, Radio, Image, Space, Badge, InputNumber, Table } from 'antd';
import { SearchOutlined, DeleteOutlined, ShoppingCartOutlined, DollarOutlined, FilterOutlined, BarcodeOutlined, SaveOutlined } from '@ant-design/icons';
import { getProducts } from '../../services/productService';
import { getCustomers } from '../../services/customerService';
import { createOrder } from '../../services/orderService';

const { Meta } = Card;
const { Title, Text } = Typography;
const { Option } = Select;

const PosScreen = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]); 
  
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('GUEST'); 
  const [selectedCustomerName, setSelectedCustomerName] = useState('Khách lẻ');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [amountPaid, setAmountPaid] = useState(0);
  
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  
  const searchInputRef = useRef(null);

  // 1. Tải dữ liệu
  const loadData = async () => {
    try {
      const [pData, cData] = await Promise.all([getProducts(), getCustomers()]);
      setProducts(pData);
      setCustomers(cData);
      const uniqueCategories = ['Tất cả', ...new Set(pData.map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      message.error('Lỗi tải dữ liệu: ' + error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Logic lọc sản phẩm
  useEffect(() => {
    let tempProducts = products;
    if (searchText) {
        const text = searchText.toLowerCase();
        tempProducts = tempProducts.filter(p => p.name.toLowerCase().includes(text) || p.sku?.toLowerCase().includes(text));
    }
    if (selectedCategory !== 'Tất cả') {
        tempProducts = tempProducts.filter(p => p.category === selectedCategory);
    }
    setFilteredProducts(tempProducts);
  }, [searchText, selectedCategory, products]);

  // 3. Xử lý thêm vào giỏ hàng
  const addToCart = (product) => {
    if (product.quantity <= 0) {
        message.warning('Sản phẩm này đã hết hàng!');
        return;
    }

    setCart(prev => {
      const exist = prev.find(item => item.product_id === product.key);
      if (exist) {
        if (exist.quantity + 1 > product.quantity) {
            message.warning('Không đủ hàng tồn kho!');
            return prev;
        }
        return prev.map(item => item.product_id === product.key ? { ...item, quantity: item.quantity + 1 } : item);
      }
      
      return [...prev, { 
          product_id: product.key, 
          name: product.name, 
          price: product.price, 
          quantity: 1, 
          image_url: product.image_url,
          unit: product.unit,
          import_price: product.import_price || 0 
      }];
    });
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.product_id !== id));
  
  const updateQuantity = (id, val) => {
      if (val < 1) return;
      const product = products.find(p => p.key === id);
      if (product && val > product.quantity) {
          message.warning(`Kho chỉ còn ${product.quantity} ${product.unit}`);
          return;
      }
      setCart(cart.map(item => item.product_id === id ? { ...item, quantity: val } : item));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const debtAmount = Math.max(0, totalAmount - amountPaid);

  useEffect(() => {
      if (paymentMethod === 'CASH') setAmountPaid(totalAmount);
      if (paymentMethod === 'DEBT') setAmountPaid(0);
  }, [totalAmount, paymentMethod]);

  const handleCustomerChange = (value) => {
    setSelectedCustomer(value);
    if (value === 'GUEST') {
      setSelectedCustomerName('Khách lẻ');
    } else {
      const customer = customers.find(c => c.key === value);
      setSelectedCustomerName(customer ? customer.name : 'Khách hàng');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return message.warning('Giỏ hàng trống!');
    
    const isDebt = paymentMethod === 'DEBT' || (paymentMethod === 'PARTIAL' && amountPaid < totalAmount);
    if (isDebt && selectedCustomer === 'GUEST') {
      return message.error('Vui lòng chọn Khách hàng cụ thể để ghi nợ!');
    }

    setLoading(true);
    try {
      const finalCustomerId = selectedCustomer === 'GUEST' ? null : selectedCustomer;
      const customerInfo = customers.find(c => c.key === finalCustomerId);

      const orderData = {
        customer_id: finalCustomerId,
        customer_name: selectedCustomerName,
        customer_phone: customerInfo ? customerInfo.phone : null,
        items: cart.map(item => ({ 
            key: item.product_id, // Quan trọng: Truyền key để trừ kho
            product_id: item.product_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            import_price: item.import_price // Gửi giá vốn xuống backend
        })),
        total_amount: totalAmount,
        amount_paid: paymentMethod === 'DEBT' ? 0 : (paymentMethod === 'CASH' ? totalAmount : amountPaid),
        payment_method: paymentMethod, 
      };

      await createOrder(orderData);
      
      message.success('Bán hàng thành công!');
      
      setCart([]);
      setPaymentMethod('CASH');
      setSelectedCustomer('GUEST');
      setSelectedCustomerName('Khách lẻ');
      setAmountPaid(0);
      loadData();
      
      if(searchInputRef.current) searchInputRef.current.focus();

    } catch (error) {
      message.error('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý quét mã vạch (Enter)
  const handleScan = () => {
      if (filteredProducts.length === 1) {
          addToCart(filteredProducts[0]);
          setSearchText('');
      }
  };

  return (
    <div style={{ height: '85vh', display: 'flex', flexDirection: 'column', padding: 10 }}>
      {/* Search Bar */}
      <div style={{ marginBottom: 16, padding: '12px', background: '#fff', borderRadius: 8 }}>
        <Row gutter={16} align="middle">
            <Col span={12}>
                <Input 
                    ref={searchInputRef}
                    placeholder="Quét mã vạch hoặc tìm tên..." 
                    prefix={<BarcodeOutlined />} 
                    size="large" 
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)} 
                    onPressEnter={handleScan}
                    allowClear 
                    autoFocus
                />
            </Col>
            <Col span={12}>
                <Space><FilterOutlined /> <Text strong>Lọc:</Text>
                    <Radio.Group value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} buttonStyle="solid" size="middle">
                        {categories.slice(0, 4).map(cat => <Radio.Button key={cat} value={cat}>{cat}</Radio.Button>)}
                    </Radio.Group>
                </Space>
            </Col>
        </Row>
      </div>

      <Row gutter={16} style={{ flex: 1, overflow: 'hidden' }}>
        {/* Product List - ĐÃ SỬA: Thay List bằng Row/Col map */}
        <Col span={14} style={{ height: '100%', overflowY: 'auto', paddingRight: 8 }}>
          <Row gutter={[16, 16]}>
            {filteredProducts.map(item => (
              <Col span={8} key={item.key}>
                 <Badge count={item.quantity <= 0 ? "Hết" : 0} style={{ backgroundColor: '#f5222d' }}>
                    <Card 
                        hoverable 
                        size="small"
                        onClick={() => addToCart(item)}
                        style={{ 
                            cursor: item.quantity > 0 ? 'pointer' : 'not-allowed',
                            opacity: item.quantity > 0 ? 1 : 0.6,
                            borderColor: item.quantity <= (item.min_stock||5) ? '#faad14' : '#f0f0f0'
                        }}
                        cover={
                            <div style={{height: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5'}}>
                                <Image src={item.image_url} height="100%" preview={false} fallback="https://via.placeholder.com/150?text=No+Image" />
                            </div>
                        }
                    >
                        <Meta 
                            title={<div style={{fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{item.name}</div>}
                            description={
                                <div>
                                    <div style={{color: '#1890ff', fontWeight: 'bold'}}>{item.price.toLocaleString()}</div>
                                    <Tag color={item.quantity > 0 ? 'green' : 'red'}>Kho: {item.quantity} {item.unit}</Tag>
                                </div>
                            } 
                        />
                    </Card>
                 </Badge>
              </Col>
            ))}
          </Row>
        </Col>

        {/* Cart & Checkout */}
        <Col span={10} style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', padding: 16, borderRadius: 8 }}>
          <Title level={4}><ShoppingCartOutlined /> Giỏ hàng ({cart.length})</Title>
          
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 10 }}>
            <Table 
                dataSource={cart}
                rowKey="product_id"
                pagination={false}
                size="small"
                columns={[
                    { title: 'SP', dataIndex: 'name', render: t => <Text ellipsis style={{maxWidth: 100}}>{t}</Text> },
                    { 
                        title: 'SL', dataIndex: 'quantity', width: 70,
                        render: (v, r) => <InputNumber min={1} value={v} onChange={val => updateQuantity(r.product_id, val)} size="small" style={{width: 60}} />
                    },
                    { 
                        title: 'Thành tiền', align: 'right',
                        render: (_, r) => <span style={{fontWeight: 500}}>{(r.price * r.quantity).toLocaleString()}</span> 
                    },
                    {
                        width: 40,
                        render: (_, r) => <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeFromCart(r.product_id)} />
                    }
                ]}
            />
          </div>

          <div style={{ background: '#f9f9f9', padding: 12, borderRadius: 8 }}>
             <div style={{marginBottom: 10}}>
                 <Select 
                    showSearch
                    placeholder="Chọn khách hàng"
                    style={{ width: '100%' }}
                    optionFilterProp="children"
                    onChange={handleCustomerChange}
                    value={selectedCustomer}
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    options={[
                        { value: 'GUEST', label: 'Khách lẻ' },
                        ...customers.map(c => ({ value: c.key, label: `${c.name} - ${c.phone}` }))
                    ]}
                 />
             </div>

             <div style={{marginBottom: 10}}>
                 <Radio.Group 
                    options={[
                      { label: 'Tiền mặt', value: 'CASH' },
                      { label: 'Ghi nợ', value: 'DEBT' },
                      { label: 'Trả 1 phần', value: 'PARTIAL' }
                    ]} 
                    onChange={e => setPaymentMethod(e.target.value)} 
                    value={paymentMethod}
                    optionType="button" 
                    buttonStyle="solid" 
                    style={{ width: '100%' }}
                 />
             </div>

             {paymentMethod === 'PARTIAL' && (
                 <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <Text>Khách đưa:</Text>
                     <InputNumber 
                        style={{width: 150}} 
                        value={amountPaid} 
                        onChange={setAmountPaid}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        addonAfter="đ"
                     />
                 </div>
             )}

             <Divider style={{margin: '10px 0'}} />
             
             <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 5}}>
                 <Title level={4} style={{margin: 0}}>Tổng:</Title>
                 <Title level={3} style={{margin: 0, color: '#1890ff'}}>{totalAmount.toLocaleString()}</Title>
             </div>
             
             {debtAmount > 0 && (
                 <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: 'red'}}>
                     <Text type="danger">Còn nợ:</Text>
                     <Text type="danger" strong>{debtAmount.toLocaleString()} đ</Text>
                 </div>
             )}

             <Button 
                type="primary" 
                size="large" 
                block 
                icon={<SaveOutlined />} 
                onClick={handleCheckout} 
                loading={loading}
                disabled={cart.length === 0}
             >
                THANH TOÁN
             </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default PosScreen;