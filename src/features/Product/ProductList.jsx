// src/features/Product/ProductList.jsx
import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Modal, Form, Input, InputNumber, Select, 
  message, Popconfirm, Image, AutoComplete, Upload, Tabs, Slider, 
  Row, Col, Card, DatePicker, Tooltip, Divider 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, 
  SearchOutlined, EyeOutlined, UploadOutlined, LinkOutlined, 
  FilterOutlined, DollarOutlined, WarningOutlined, ClockCircleOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment'; 
import { getProducts, addProduct, deleteProduct, updateProduct, getCategories, saveCategoryIfNotExist } from '../../services/productService'; 
import { useAuth } from '../../context/AuthContext';

const { Option } = Select;

const ProductList = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [products, setProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]); 
  
  // --- BỘ LỌC ---
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 10000000]); 
  const [maxPriceInDb, setMaxPriceInDb] = useState(1000000); 

  const [editingProduct, setEditingProduct] = useState(null);
  const [fileList, setFileList] = useState([]); 
  const [uploadMode, setUploadMode] = useState('file');
  const [form] = Form.useForm();

  const subCategoryOptions = [
    { value: 'Sâu cuốn lá' }, { value: 'Rầy nâu' }, { value: 'Nhện đỏ' }, 
    { value: 'Cỏ lúa' }, { value: 'Cỏ vườn' }, 
    { value: 'Đạo ôn' }, { value: 'Lem lép hạt' }, 
    { value: 'Ra rễ' }, { value: 'Đâm chồi' }, { value: 'Nuôi trái' }
  ];

  // Tải dữ liệu
  const fetchData = async () => {
    setLoading(true);
    try {
      const [productData, categoryData] = await Promise.all([
          getProducts(),
          getCategories() // <--- ĐÃ SỬA LỖI GÕ SAI Ở ĐÂY
      ]);
      
      setProducts(productData);
      setCategoryOptions(categoryData);

      if (productData.length > 0) {
        const maxP = Math.max(...productData.map(p => p.price || 0), 1000000);
        setMaxPriceInDb(maxP);
        setPriceRange([0, maxP]); 
      }

    } catch (error) {
      console.error(error); // In lỗi thật ra console để dễ kiểm tra
      message.error('Lỗi tải dữ liệu sản phẩm!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resizeImage = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });

  const handleEdit = (record) => {
    setEditingProduct(record);
    const formData = { ...record };
    if (formData.expiry_date) {
        formData.expiry_date = formData.expiry_date.toDate ? moment(formData.expiry_date.toDate()) : moment(formData.expiry_date);
    }
    form.setFieldsValue(formData);
    setFileList([]);
    setUploadMode('url'); 
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    form.resetFields();
    setFileList([]);
    setUploadMode('file'); 
    setIsModalOpen(true);
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      try {
        let finalImageUrl = values.image_url; 

        if (uploadMode === 'file' && fileList.length > 0) {
           const fileToUpload = fileList[0].originFileObj || fileList[0];
           if (fileToUpload) finalImageUrl = await resizeImage(fileToUpload);
        }
        
        if (!finalImageUrl) finalImageUrl = 'https://via.placeholder.com/150?text=No+Image';

        const productData = {
            sku: values.sku || '',
            name: values.name || '',
            supplier: values.supplier || '',
            category: values.category || 'Khác',
            sub_category: values.sub_category || '',
            unit: values.unit || 'Chai',
            price: Number(values.price || 0),
            image_url: finalImageUrl,
            import_price: Number(values.import_price || 0), 
            quantity: Number(values.quantity || 0),         
            min_stock: Number(values.min_stock || 5),       
            expiry_date: values.expiry_date ? values.expiry_date.toDate() : null 
        };

        if (values.category) {
            await saveCategoryIfNotExist(values.category);
        }

        if (editingProduct) {
          await updateProduct(editingProduct.key, productData);
          message.success('Cập nhật thành công!');
        } else {
          await addProduct(productData);
          message.success('Thêm mới thành công!');
        }

        setIsModalOpen(false);
        form.resetFields();
        setEditingProduct(null);
        setFileList([]);
        fetchData(); 

      } catch (error) {
        message.error('Lỗi: ' + error.message);
      } finally {
        setLoading(false);
      }
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      message.success('Đã xóa!');
      fetchData();
    } catch (error) {
      message.error('Xóa thất bại');
    }
  };

  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file) => {
      setFileList([file]); 
      return false; 
    },
    fileList,
  };

  const filteredProducts = products.filter((item) => {
    const text = searchText.toLowerCase();
    const matchesText = 
        item.name?.toLowerCase().includes(text) || 
        item.sku?.toLowerCase().includes(text) || 
        item.supplier?.toLowerCase().includes(text) ||
        item.sub_category?.toLowerCase().includes(text);
    const matchesCategory = filterCategory ? item.category === filterCategory : true;
    const itemPrice = item.price || 0;
    const matchesPrice = itemPrice >= priceRange[0] && itemPrice <= priceRange[1];
    return matchesText && matchesCategory && matchesPrice;
  });

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      align: 'center',
      width: 60,
      render: (_, __, index) => <b style={{ color: '#8c8c8c' }}>{index + 1}</b>
    },
    { 
        title: 'Ảnh', dataIndex: 'image_url', key: 'image_url', width: 70,
        render: (url) => <Image width={50} height={50} src={url} style={{objectFit: 'cover', borderRadius: 4}} fallback="https://via.placeholder.com/50?text=Err" />
    },
    { title: 'Mã', dataIndex: 'sku', key: 'sku', width: 100, render: text => <b>{text}</b> },
    { 
        title: 'Tên thuốc', dataIndex: 'name', key: 'name', width: 220,
        render: (text, record) => (
            <div style={{ cursor: 'pointer', color: '#1677ff' }} onClick={() => navigate(`/product/${record.key}`)}>
                <div style={{ fontWeight: 600 }}>{text}</div>
                <div style={{fontSize: '11px', color: '#888'}}>{record.supplier}</div>
            </div>
        )
    },
    ...(isAdmin ? [{ 
      title: 'Giá vốn', dataIndex: 'import_price', key: 'import_price', width: 100, align: 'right',
      render: (price) => <span style={{color: '#8c8c8c'}}>{price?.toLocaleString()}</span> 
    }] : []),
    { 
      title: 'Giá bán', dataIndex: 'price', key: 'price', width: 100, align: 'right',
      render: (price) => <b style={{color: '#1677ff'}}>{price?.toLocaleString()}</b> 
    },
    { 
      title: 'Tồn kho', dataIndex: 'quantity', key: 'quantity', width: 100, align: 'center',
      render: (qty, record) => {
          const min = record.min_stock || 5;
          if (qty <= 0) return <Tag color="red">Hết hàng</Tag>;
          if (qty <= min) return <Tooltip title={`Sắp hết hàng (Dưới ${min})`}><Tag color="orange"><WarningOutlined /> {qty} {record.unit}</Tag></Tooltip>;
          return <span style={{fontWeight: 'bold', color: 'green'}}>{qty} {record.unit}</span>;
      }
    },
    {
      title: 'Hạn dùng', dataIndex: 'expiry_date', key: 'expiry_date', width: 110, align: 'center',
      render: (date) => {
          if (!date) return <span style={{color: '#ccc'}}>-</span>;
          const exp = date.toDate ? moment(date.toDate()) : moment(date);
          const now = moment();
          const diffDays = exp.diff(now, 'days');

          if (diffDays < 0) return <Tag color="black">Hết hạn</Tag>;
          if (diffDays <= 90) return <Tooltip title={`Còn ${diffDays} ngày`}><Tag color="volcano"><ClockCircleOutlined /> {exp.format('DD/MM/YY')}</Tag></Tooltip>; 
          if (diffDays <= 180) return <Tag color="gold">{exp.format('DD/MM/YY')}</Tag>; 
          return <span style={{color: '#52c41a'}}>{exp.format('DD/MM/YY')}</span>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          {isAdmin && (
            <Popconfirm title="Xóa sản phẩm này?" onConfirm={() => handleDelete(record.key)}>
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{padding: 20}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Quản lý Sản phẩm</h2>
        <Space>
           <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Tải lại</Button>
           <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>Thêm mới</Button>
        </Space>
      </div>
      
      {/* --- KHUNG BỘ LỌC --- */}
      <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
        <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
                <Input 
                    placeholder="Tìm tên, mã, công ty..." 
                    prefix={<SearchOutlined />} 
                    onChange={e => setSearchText(e.target.value)}
                    allowClear
                />
            </Col>
            <Col xs={24} md={6}>
                 <Select 
                    placeholder="Lọc theo loại"
                    style={{ width: '100%' }}
                    allowClear
                    onChange={value => setFilterCategory(value)}
                    suffixIcon={<FilterOutlined />}
                  >
                      {categoryOptions.map(opt => (
                        <Option key={opt.value} value={opt.value}>{opt.value}</Option>
                      ))}
                  </Select>
            </Col>
            <Col xs={24} md={10}>
                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <DollarOutlined style={{color: '#888'}} />
                    <span style={{whiteSpace: 'nowrap'}}>Khoảng giá:</span>
                    <Slider 
                        range 
                        min={0} 
                        max={maxPriceInDb} 
                        defaultValue={[0, maxPriceInDb]} 
                        value={priceRange}
                        onChange={setPriceRange}
                        style={{flex: 1}}
                        tooltip={{ formatter: value => `${value.toLocaleString()} đ` }}
                    />
                </div>
            </Col>
        </Row>
      </Card>

      <Table 
        columns={columns} 
        dataSource={filteredProducts} 
        loading={loading} 
        rowKey="key" 
        pagination={{ pageSize: 8 }} 
        scroll={{ x: 1000 }}
      />

      <Modal 
        title={editingProduct ? "Cập nhật sản phẩm" : "Thêm thuốc mới"} 
        open={isModalOpen} 
        onOk={handleOk} 
        confirmLoading={loading} 
        onCancel={() => { setIsModalOpen(false); setEditingProduct(null); }}
        width={800}
        destroyOnHidden={true} 
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: '16px' }}>
             <Form.Item name="sku" label="Mã SKU" rules={[{ required: true, message: 'Nhập mã!' }]} style={{flex: 1}}>
                <Input placeholder="VD: THUOC01" />
             </Form.Item>
             <Form.Item name="supplier" label="Nhà cung cấp" rules={[{ required: true, message: 'Nhập NCC!' }]} style={{flex: 1}}>
                <Input placeholder="VD: Syngenta..." />
             </Form.Item>
          </div>
          
          <Form.Item name="name" label="Tên thuốc" rules={[{ required: true, message: 'Nhập tên thuốc!' }]}>
            <Input placeholder="Tên thuốc..." />
          </Form.Item>

          <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="category" label="Loại chính" rules={[{ required: true, message: 'Chọn loại!' }]} initialValue="Thuốc trừ sâu">
                  <AutoComplete 
                    options={categoryOptions} 
                    placeholder="Gõ loại mới..." 
                    filterOption={(inputValue, option) => option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1} 
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="sub_category" label="Đặc trị / Loại chi tiết" tooltip="Ví dụ: Sâu cuốn lá, Rầy nâu...">
                  <AutoComplete 
                    options={subCategoryOptions} 
                    placeholder="VD: Sâu cuốn lá..." 
                    filterOption={(inputValue, option) => option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1} 
                  />
                </Form.Item>
              </Col>
          </Row>

          <Divider orientation="left" style={{margin: '10px 0'}}>Giá & Kho hàng</Divider>

          <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="import_price" label="Giá nhập (Vốn)" rules={[{ required: true }]}>
                    <InputNumber 
                        style={{ width: '100%' }} 
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        addonAfter="₫"
                        min={0}
                    />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="price" label="Giá bán lẻ" rules={[{ required: true }]}>
                    <InputNumber 
                        style={{ width: '100%' }} 
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        addonAfter="₫"
                        min={0}
                    />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="unit" label="Đơn vị tính" initialValue="Chai">
                   <Select>
                    <Option value="Chai">Chai</Option>
                    <Option value="Gói">Gói</Option>
                    <Option value="Bao">Bao</Option>
                    <Option value="Hộp">Hộp</Option>
                    <Option value="Can">Can</Option>
                    <Option value="Viên">Viên</Option>
                  </Select>
                </Form.Item>
              </Col>
          </Row>

          <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="quantity" label="Tồn kho thực tế" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="min_stock" label="Cảnh báo tồn (Min)" initialValue={5} tooltip="Báo động khi tồn kho thấp hơn mức này">
                    <InputNumber style={{ width: '100%' }} min={0} status="warning" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="expiry_date" label="Hạn sử dụng (Lô mới)" tooltip="Để cảnh báo hàng cận date">
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày hết hạn" />
                </Form.Item>
              </Col>
          </Row>

          <Divider orientation="left" style={{margin: '10px 0'}}>Hình ảnh</Divider>

          <div style={{marginBottom: 16}}>
            <Tabs 
                activeKey={uploadMode} 
                onChange={setUploadMode}
                type="card"
                items={[
                    {
                        key: 'file',
                        label: <span><UploadOutlined /> Chọn ảnh từ máy</span>,
                        children: (
                            <div>
                                <Upload {...uploadProps} listType="picture" maxCount={1} accept="image/*">
                                    <Button icon={<UploadOutlined />}>Bấm để chọn ảnh</Button>
                                </Upload>
                                <div style={{color: 'green', fontSize: 12, marginTop: 5}}>* Ảnh tự động nén.</div>
                            </div>
                        )
                    },
                    {
                        key: 'url',
                        label: <span><LinkOutlined /> Dán link ảnh</span>,
                        children: (
                             <Form.Item name="image_url" noStyle>
                                <Input placeholder="https://..." />
                             </Form.Item>
                        )
                    }
                ]}
            />
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductList;