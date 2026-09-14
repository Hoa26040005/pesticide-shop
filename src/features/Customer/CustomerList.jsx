// src/features/Customer/CustomerList.jsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Tag, Space, Tooltip, Descriptions, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, UserAddOutlined, PhoneOutlined, HistoryOutlined, EyeOutlined, FileTextOutlined, EditOutlined } from '@ant-design/icons';
import moment from 'moment';
// BỔ SUNG: Import thêm hàm updateCustomer (hãy chắc chắn bạn đã viết hàm này trong file service)
import { getCustomers, addCustomer, deleteCustomer, updateCustomer } from '../../services/customerService';
import { getOrdersByCustomer } from '../../services/orderService';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // --- STATE CHO TÍNH NĂNG SỬA THÔNG TIN ---
  const [editingCustomer, setEditingCustomer] = useState(null);

  // --- STATE CHO LỊCH SỬ MUA HÀNG ---
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [currentCustomerName, setCurrentCustomerName] = useState('');

  // --- STATE CHO CHI TIẾT ĐƠN HÀNG (MODAL CẤP 2) ---
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
        const data = await getCustomers();
        setCustomers(data);
    } catch (error) {
        message.error("Lỗi tải khách hàng: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HÀM MỞ BẢNG THÊM MỚI ---
  const handleOpenAddModal = () => {
    setEditingCustomer(null); // Reset trạng thái sửa
    form.resetFields(); // Làm trống form
    setIsModalOpen(true);
  };

  // --- HÀM MỞ BẢNG SỬA THÔNG TIN ---
  const handleOpenEditModal = (record) => {
    setEditingCustomer(record); // Lưu lại khách hàng đang sửa
    form.setFieldsValue({ // Đổ dữ liệu cũ vào form
      name: record.name,
      phone: record.phone,
      address: record.address,
    });
    setIsModalOpen(true);
  };

  // --- HÀM LƯU (Dùng chung cho cả Thêm và Sửa) ---
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (editingCustomer) {
        // NẾU ĐANG SỬA
        await updateCustomer(editingCustomer.key, values);
        message.success('Cập nhật thông tin thành công!');
      } else {
        // NẾU ĐANG THÊM MỚI
        await addCustomer(values);
        message.success('Thêm khách hàng thành công!');
      }
      
      setIsModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      if (!error?.errorFields) {
          message.error('Lỗi: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
        await deleteCustomer(id);
        message.success('Đã xóa khách hàng');
        fetchData();
    } catch (error) {
        message.error("Xóa thất bại: " + error.message);
    }
  };

  const handleViewHistory = async (record) => {
    setCurrentCustomerName(record.name);
    setIsHistoryOpen(true); 
    setHistoryLoading(true);
    try {
        const orders = await getOrdersByCustomer(record.key);
        setCustomerOrders(orders);
    } catch (error) {
        message.error("Lỗi tải lịch sử. Kiểm tra Index Firebase!");
    } finally {
        setHistoryLoading(false);
    }
  };

  const handleViewOrderDetail = (order) => {
      setSelectedOrder(order);
      setIsDetailOpen(true);
  };

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      align: 'center',
      width: 60,
      render: (_, __, index) => <b style={{ color: '#8c8c8c' }}>{index + 1}</b>
    },
    { title: 'Tên khách hàng', dataIndex: 'name', key: 'name', render: t => <b style={{fontSize: 15}}>{t}</b> },
    { title: 'Số điện thoại', dataIndex: 'phone', key: 'phone', render: t => <><PhoneOutlined style={{color: '#1677ff', marginRight: 5}}/> {t}</> },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address' },
    { 
      title: 'Đang nợ', 
      dataIndex: 'current_debt', 
      key: 'current_debt',
      align: 'right',
      render: (debt) => debt > 0 ? <Tag color="error" style={{fontSize: 14}}>{Number(debt).toLocaleString()} đ</Tag> : <Tag color="success">Không nợ</Tag>
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
           <Tooltip title="Xem lịch sử mua">
              <Button shape="circle" icon={<HistoryOutlined />} onClick={() => handleViewHistory(record)} type="primary" ghost />
           </Tooltip>
           {/* THÊM NÚT SỬA Ở ĐÂY */}
           <Tooltip title="Sửa thông tin">
              <Button shape="circle" icon={<EditOutlined />} onClick={() => handleOpenEditModal(record)} style={{color: '#fa8c16', borderColor: '#ffd591'}} />
           </Tooltip>
           <Popconfirm title="Xóa khách này?" onConfirm={() => handleDelete(record.key)}>
             <Button shape="circle" icon={<DeleteOutlined />} danger />
           </Popconfirm>
        </Space>
      ),
    },
  ];

  const historyColumns = [
      { title: 'STT', key: 'stt', align: 'center', width: 50, render: (_, __, index) => index + 1 },
      { title: 'Ngày mua', dataIndex: 'created_at', key: 'created_at', width: 140, render: (time) => time ? moment(time.toDate()).format('DD/MM/YYYY HH:mm') : 'N/A' },
      { title: 'Tổng tiền', dataIndex: 'total_amount', key: 'total_amount', align: 'right', render: (amount) => <b style={{color: '#1677ff'}}>{Number(amount).toLocaleString()} đ</b> },
      {
          title: 'Thanh toán',
          dataIndex: 'payment_method',
          key: 'payment_method',
          align: 'center',
          render: (method, record) => {
              if (method === 'DEBT') return <Tag color="red">Nợ hết</Tag>;
              if (method === 'PARTIAL') {
                  const debt = record.amount_debt || 0;
                  return (
                    <Tooltip title={`Đã trả: ${(record.amount_paid || 0).toLocaleString()} đ`}>
                        <div style={{textAlign: 'center'}}>
                            <Tag color="orange">Trả 1 phần</Tag>
                            {debt > 0 && <div style={{fontSize: 11, color: 'red', marginTop: 2}}>Nợ: {Number(debt).toLocaleString()}</div>}
                        </div>
                    </Tooltip>
                  );
              }
              return <Tag color="green">Tiền mặt</Tag>;
          }
      },
      { title: 'Chi tiết', key: 'action', align: 'center', width: 80, render: (_, record) => <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewOrderDetail(record)}>Xem</Button> }
  ];

  const orderDetailColumns = [
      { title: 'STT', key: 'stt', align: 'center', width: 50, render: (_, __, index) => index + 1 },
      { title: 'Tên thuốc', dataIndex: 'name', key: 'name' },
      { title: 'Đơn giá', dataIndex: 'price', key: 'price', align: 'right', render: p => `${Number(p).toLocaleString()} đ` },
      { title: 'SL', dataIndex: 'quantity', key: 'quantity', align: 'center', width: 60 },
      { title: 'Thành tiền', key: 'subtotal', align: 'right', render: (_, record) => <b>{(record.price * record.quantity).toLocaleString()} đ</b> }
  ];

  return (
    <div style={{ padding: '0 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center', background: '#fff', padding: 12, borderRadius: 8 }}>
        <h2 style={{margin: 0, fontSize: 18}}>Danh sách Nông dân / Khách hàng</h2>
        <Button type="primary" icon={<UserAddOutlined />} onClick={handleOpenAddModal}>
          Thêm khách mới
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={customers} 
        loading={loading} 
        rowKey="key" 
        pagination={{ pageSize: 10, showSizeChanger: true }} 
        scroll={{ x: 800 }}
      />

      {/* Modal dùng chung cho cả Thêm và Sửa */}
      <Modal 
        title={editingCustomer ? "Cập nhật thông tin khách hàng" : "Thêm khách hàng mới"} 
        open={isModalOpen} 
        onOk={handleOk} 
        confirmLoading={loading}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label="Tên khách hàng" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
            <Input placeholder="Ví dụ: Chú Bảy (Ruộng lúa)" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Nhập số điện thoại!' }]}>
             <Input placeholder="0909..." />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ / Khu vực">
             <Input placeholder="Ấp 1, Xã..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={<span><HistoryOutlined /> Lịch sử mua hàng: <span style={{color: '#1677ff'}}>{currentCustomerName}</span></span>} open={isHistoryOpen} onCancel={() => setIsHistoryOpen(false)} footer={[<Button key="close" onClick={() => setIsHistoryOpen(false)}>Đóng</Button>]} width={750} destroyOnClose>
          <Table columns={historyColumns} dataSource={customerOrders} loading={historyLoading} rowKey="key" pagination={{ pageSize: 5 }} locale={{ emptyText: 'Khách này chưa mua đơn hàng nào' }} scroll={{ x: 600 }} />
      </Modal>

      <Modal title={<span><FileTextOutlined /> Chi tiết hóa đơn</span>} open={isDetailOpen} onCancel={() => setIsDetailOpen(false)} footer={[<Button key="ok" type="primary" onClick={() => setIsDetailOpen(false)}>Đóng</Button>]} width={600} centered destroyOnClose>
        {selectedOrder && (
            <div>
                <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="Mã đơn" span={2}><span style={{fontSize: 12, color: '#888'}}>{selectedOrder.key}</span></Descriptions.Item>
                    <Descriptions.Item label="Ngày mua">{selectedOrder.created_at ? moment(selectedOrder.created_at.toDate()).format('DD/MM/YYYY HH:mm') : ''}</Descriptions.Item>
                    <Descriptions.Item label="Hình thức">{selectedOrder.payment_method === 'PARTIAL' ? <Tag color="orange">Trả 1 phần</Tag> : (selectedOrder.payment_method === 'DEBT' ? <Tag color="red">Ghi nợ</Tag> : <Tag color="green">Tiền mặt</Tag>)}</Descriptions.Item>
                </Descriptions>
                <Divider style={{margin: '12px 0'}}>Danh sách thuốc</Divider>
                <Table columns={orderDetailColumns} dataSource={selectedOrder.items} pagination={false} rowKey="product_id" size="small" summary={() => (<Table.Summary.Row style={{background: '#fafafa'}}><Table.Summary.Cell index={0} colSpan={4} style={{textAlign: 'right', fontWeight: 'bold'}}>TỔNG CỘNG:</Table.Summary.Cell><Table.Summary.Cell index={1} style={{textAlign: 'right', fontWeight: 'bold', color: '#1677ff', fontSize: 16}}>{Number(selectedOrder.total_amount).toLocaleString()} đ</Table.Summary.Cell></Table.Summary.Row>)} />
                <Divider style={{margin: '12px 0'}} />
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: 15, gap: 4}}>
                    <div>Tổng tiền: <b>{Number(selectedOrder.total_amount).toLocaleString()} đ</b></div>
                    <div style={{color: 'green'}}>Đã trả: <b>{Number(selectedOrder.amount_paid || 0).toLocaleString()} đ</b></div>
                    <div style={{color: 'red', fontWeight: 'bold', fontSize: 17, borderTop: '1px solid #eee', paddingTop: 4, marginTop: 4}}>Còn nợ: {Number(selectedOrder.amount_debt || 0).toLocaleString()} đ</div>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerList;