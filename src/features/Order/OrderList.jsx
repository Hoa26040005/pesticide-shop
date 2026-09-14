// src/features/Order/OrderList.jsx
import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Table, Button, Modal, Space, message, Input, Form, InputNumber, Timeline, Descriptions, Divider, Typography, Row, Col, Tooltip } from 'antd';
import { DeleteOutlined, DollarOutlined, HistoryOutlined, EditOutlined, PrinterOutlined, SearchOutlined, ReloadOutlined, ShopOutlined } from '@ant-design/icons';
import moment from 'moment';
import { getAllOrders, deleteOrder, addPaymentToOrder, updateOrderPayment } from '../../services/orderService';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useReactToPrint } from 'react-to-print';
import { QRCodeCanvas } from 'qrcode.react';
import { logActivity } from '../../services/logService';
import { useAuth } from '../../context/AuthContext';

const { Text, Title } = Typography;

// --- 1. COMPONENT HÓA ĐƠN ĐỂ IN (ĐÃ FIX KHUÔN A4) ---
const InvoiceTemplate = forwardRef(({ order }, ref) => {
  if (!order) {
    return <div ref={ref} style={{ padding: 20 }}>Đang tải dữ liệu...</div>;
  }

  // Helper functions tính toán
  const getPaidValue = (r) => {
    if (r.amount_paid !== undefined) return r.amount_paid;
    return r.payment_method === 'CASH' ? r.total_amount : 0;
  };

  const getDebtValue = (r) => {
    if (r.amount_debt !== undefined) return r.amount_debt;
    return r.payment_method === 'DEBT' ? r.total_amount : 0;
  };

  const debt = getDebtValue(order);
  const paid = getPaidValue(order);
  const createdDate = order.created_at ? moment(order.created_at.toDate()).format('DD/MM/YYYY HH:mm') : '';
  const printDate = moment().format('DD/MM/YYYY HH:mm:ss');

  return (
    <div ref={ref} style={{ padding: '20px', fontFamily: '"Times New Roman", Times, serif', color: '#000', backgroundColor: 'white', position: 'relative', width: '100%', boxSizing: 'border-box' }}>
      
      {/* ĐÂY LÀ ĐOẠN CSS THẦN THÁNH ÉP KHUÔN A4 KHI IN */}
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 15mm; }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          /* Giúp bảng không bị gãy làm đôi giữa 2 trang */
          table { page-break-inside: auto; }
          tr    { page-break-inside: avoid; page-break-after: auto; }
        `}
      </style>

      {/* Watermark (Thu nhỏ lại một chút để không đẩy viền trang) */}
      <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', fontSize: '65px', color: 'rgba(0,0,0,0.04)', fontWeight: 'bold', zIndex: 0, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
        PESTICIDE SHOP
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShopOutlined style={{ fontSize: '32px' }} />
            <div>
              <Title level={3} style={{ margin: 0, textTransform: 'uppercase' }}>Cửa Hàng Thuốc BVTV</Title>
              <Text>Địa chỉ: 123 Đường Nông Nghiệp, Quận X, TP.HCM</Text><br/>
              <Text>Hotline: 0909.123.456</Text>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Title level={2} style={{ margin: 0, color: '#1677ff' }}>HÓA ĐƠN BÁN HÀNG</Title>
            <Text strong>Mã đơn: #{order.key?.slice(-6).toUpperCase()}</Text><br/>
            <div style={{ marginTop: '5px' }}>
              <QRCodeCanvas value={`ORDER:${order.key}|TOTAL:${order.total_amount}`} size={55} />
            </div>
          </div>
        </div>

        {/* Thông tin khách hàng */}
        <Row gutter={[16, 16]} style={{ marginBottom: '15px' }}>
          <Col span={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Khách hàng"><b style={{fontSize: '16px'}}>{order.customer_name}</b></Descriptions.Item>
              <Descriptions.Item label="Điện thoại">..........................</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Descriptions column={1} size="small" style={{justifyContent: 'flex-end'}}>
              <Descriptions.Item label="Ngày tạo">{createdDate}</Descriptions.Item>
              <Descriptions.Item label="Ngày in"><i>{printDate}</i></Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>

        {/* Bảng sản phẩm */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #000', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '1px solid #000' }}>
              <th style={{ padding: '8px', borderRight: '1px solid #000', width: '50px', textAlign: 'center' }}>STT</th>
              <th style={{ padding: '8px', borderRight: '1px solid #000', textAlign: 'left' }}>Tên Sản Phẩm</th>
              <th style={{ padding: '8px', borderRight: '1px solid #000', width: '60px', textAlign: 'center' }}>SL</th>
              <th style={{ padding: '8px', borderRight: '1px solid #000', textAlign: 'right' }}>Đơn Giá</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Thành Tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px', borderRight: '1px solid #000', textAlign: 'center' }}>{index + 1}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #000' }}>{item.name}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #000', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '8px', borderRight: '1px solid #000', textAlign: 'right' }}>{Number(item.price).toLocaleString()}</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{Number(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tổng tiền */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '250px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tổng cộng:</span>
              <b style={{ fontSize: '16px' }}>{Number(order.total_amount).toLocaleString()} ₫</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green' }}>
              <span>Đã trả:</span>
              <span>{paid.toLocaleString()} ₫</span>
            </div>
            <Divider style={{ margin: '5px 0', borderColor: '#000' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
              <span>CÒN NỢ:</span>
              <b style={{ color: 'red' }}>{debt.toLocaleString()} ₫</b>
            </div>
          </div>
        </div>

        {/* Chữ ký */}
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
          <div><Text strong>Người mua hàng</Text><br/><Text type="secondary">(Ký, ghi rõ họ tên)</Text></div>
          <div><Text strong>Người bán hàng</Text><br/><Text type="secondary">(Ký, đóng dấu)</Text></div>
        </div>
      </div>
    </div>
  );
});
InvoiceTemplate.displayName = 'InvoiceTemplate';


// --- 2. MAIN COMPONENT ---
const OrderList = () => {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // State các Modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryLogs, setSelectedHistoryLogs] = useState([]);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [editPaymentOrder, setEditPaymentOrder] = useState(null);
  const [isAuthEditModalOpen, setIsAuthEditModalOpen] = useState(false);

  // State IN HÓA ĐƠN
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printOrderData, setPrintOrderData] = useState(null);
  
  // REF IN ẤN - Dùng useRef móc trực tiếp vào InvoiceTemplate đang hiển thị
  const componentRef = useRef(null);

  const [form] = Form.useForm();
  const [payForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [authEditForm] = Form.useForm();

  // --- CẤU HÌNH IN (ĐÃ SỬA LỖI PHIÊN BẢN MỚI) ---
  const handlePrint = useReactToPrint({
    contentRef: componentRef, // Dành cho react-to-print v3
    documentTitle: `Hoa_Don_${printOrderData?.key || 'Ban_Hang'}`,
    onAfterPrint: () => message.success('Đã in thành công!'),
    onPrintError: (err) => message.error("Lỗi in: " + err),
  });

  const onPrintClick = () => {
      if (!componentRef.current) {
          message.error("Lỗi: Không tìm thấy nội dung in! Vui lòng chờ load dữ liệu.");
          return;
      }
      handlePrint();
  }

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      message.warning('Đang tải dữ liệu (có thể do mạng chậm)...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- HELPER FUNCTIONS ---
  const getPaidValue = (record) => {
      if (!record) return 0;
      if (record.amount_paid !== undefined) return record.amount_paid;
      return record.payment_method === 'CASH' ? record.total_amount : 0;
  };
  const getDebtValue = (record) => {
      if (!record) return 0;
      if (record.amount_debt !== undefined) return record.amount_debt;
      return record.payment_method === 'DEBT' ? record.total_amount : 0;
  };

  // --- HANDLERS ---
  const onRequestDelete = (orderId) => {
      setPendingOrderId(orderId);
      setIsAuthModalOpen(true);
      form.resetFields();
  };
  
  const handleConfirmDelete = async () => {
      try {
          const values = await form.validateFields();
          setConfirmLoading(true);
          const auth = getAuth();
          await signInWithEmailAndPassword(auth, auth.currentUser.email, values.password);
          
          await deleteOrder(pendingOrderId);
          await logActivity('Xóa đơn hàng', `Đơn hàng ID: ${pendingOrderId}`, 'Xóa bởi Admin');

          message.success('Đã xóa đơn hàng thành công!');
          setIsAuthModalOpen(false);
          fetchOrders(); 
      } catch (error) { 
          message.error('Mật khẩu sai hoặc lỗi hệ thống!'); 
      } finally { 
          setConfirmLoading(false); 
      }
  };

  const onOpenPayModal = (record) => {
      if (getDebtValue(record) <= 0) return message.info("Đã trả đủ!");
      setSelectedOrder(record);
      payForm.resetFields();
      setIsPayModalOpen(true);
  };

  const handleAddPayment = async () => {
      try {
          const values = await payForm.validateFields();
          setLoading(true); 
          const auth = getAuth();
          const email = auth.currentUser ? auth.currentUser.email : 'Admin';
          
          await addPaymentToOrder(selectedOrder.key, values.payment_amount, email);
          await logActivity('Thanh toán nợ', `Khách: ${selectedOrder.customer_name}`, `Thu thêm: ${values.payment_amount.toLocaleString()} đ`);

          message.success('Thành công!');
          setIsPayModalOpen(false);
          fetchOrders(); 
      } catch (error) { 
          message.error('Lỗi: ' + error.message); 
      } finally { 
          setLoading(false); 
      }
  };

  const onOpenEditPaymentModal = (record) => {
      setEditPaymentOrder(record);
      editForm.resetFields();
      editForm.setFieldsValue({ new_total_paid: getPaidValue(record) });
      setIsEditPaymentModalOpen(true);
  };

  const handleConfirmEditPayment = async () => {
      try {
          const values = await authEditForm.validateFields();
          setConfirmLoading(true);
          const auth = getAuth();
          await signInWithEmailAndPassword(auth, auth.currentUser.email, values.password);
          const email = auth.currentUser ? auth.currentUser.email : 'Admin';
          
          await updateOrderPayment(editPaymentOrder.key, editForm.getFieldValue('new_total_paid'), email);
          await logActivity('Sửa thanh toán', `Đơn ID: ${editPaymentOrder.key}`, `Sửa thành: ${editForm.getFieldValue('new_total_paid')}`);

          message.success('Cập nhật xong!');
          setIsAuthEditModalOpen(false);
          setIsEditPaymentModalOpen(false);
          fetchOrders();
      } catch (error) { 
          message.error('Lỗi xác thực!'); 
      } finally { 
          setConfirmLoading(false); 
      }
  };

  const onViewHistory = (record) => {
      const logs = record.history_logs || [];
      logs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setSelectedHistoryLogs(logs);
      setIsHistoryModalOpen(true);
  };

  const onOpenPrintModal = (record) => {
    setPrintOrderData(record);
    setIsPrintModalOpen(true);
  };

  const filteredOrders = orders.filter(o => 
      o.customer_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      o.key?.toLowerCase().includes(searchText.toLowerCase())
  );

  // --- CỘT BẢNG ---
  const columns = [
    { 
      title: 'STT',
      key: 'stt', 
      align: 'center', 
      width: 60, 
      render: (_, __, index) => <b style={{color: '#8c8c8c'}}>{index + 1}</b> 
    },
    { title: 'Ngày bán', dataIndex: 'created_at', width: 140, render: t => t ? moment(t.toDate()).format('DD/MM/YYYY HH:mm') : '' },
    { title: 'Khách hàng', dataIndex: 'customer_name', render: t => <b>{t}</b> },
    { title: 'Tổng tiền', dataIndex: 'total_amount', align: 'right', render: t => <b style={{color: '#1677ff'}}>{Number(t).toLocaleString()}</b> },
    { title: 'Đã trả', key: 'amount_paid', align: 'right', render: (_, r) => <span style={{color: 'green'}}>{getPaidValue(r).toLocaleString()}</span> },
    { title: 'Còn nợ', key: 'amount_debt', align: 'right', render: (_, r) => { const d = getDebtValue(r); return d > 0 ? <span style={{color: 'red', fontWeight: 'bold'}}>{d.toLocaleString()}</span> : <span style={{color: '#ccc'}}>0</span> } },
    {
        title: 'Hành động', key: 'action', align: 'center', width: 200,
        render: (_, record) => (
            <Space size={4}>
                <Tooltip title="In hóa đơn">
                    <Button icon={<PrinterOutlined />} onClick={() => onOpenPrintModal(record)} size="small" style={{backgroundColor: '#faad14', color: '#fff', borderColor: '#faad14'}}/>
                </Tooltip>
                <Tooltip title="Xem lịch sử"><Button icon={<HistoryOutlined />} onClick={() => onViewHistory(record)} size="small"/></Tooltip>
                {isAdmin && (
                  <Tooltip title="Sửa tiền"><Button icon={<EditOutlined />} onClick={() => onOpenEditPaymentModal(record)} size="small"/></Tooltip>
                )}
                {getDebtValue(record) > 0 && (<Tooltip title="Trả nợ"><Button icon={<DollarOutlined />} onClick={() => onOpenPayModal(record)} type="primary" size="small"/></Tooltip>)}
                {isAdmin && (
                  <Tooltip title="Xóa"><Button danger icon={<DeleteOutlined />} onClick={() => onRequestDelete(record.key)} size="small"/></Tooltip>
                )}
            </Space>
        )
    }
  ];

  return (
    <div style={{ padding: '0 12px' }}>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 16, background: '#fff', padding: 12, borderRadius: 8}}>
          <h2 style={{margin: 0, fontSize: 18}}>Danh sách Hóa đơn bán hàng</h2>
          <Space>
              <Input placeholder="Tìm tên khách..." prefix={<SearchOutlined />} onChange={e => setSearchText(e.target.value)} allowClear />
              <Button icon={<ReloadOutlined />} onClick={fetchOrders}>Tải lại</Button>
          </Space>
      </div>

      <Table dataSource={filteredOrders} columns={columns} rowKey="key" loading={loading} pagination={{pageSize: 10}} scroll={{ x: 800 }} />

      {/* --- MODAL XEM TRƯỚC BẢN IN --- */}
      <Modal
        title={<Space><PrinterOutlined /> Xem trước bản in</Space>}
        open={isPrintModalOpen}
        onCancel={() => setIsPrintModalOpen(false)}
        width={800}
        destroyOnHidden={true} 
        footer={[
            <Button key="cancel" onClick={() => setIsPrintModalOpen(false)}>Đóng</Button>,
            <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={onPrintClick}>Xác nhận In</Button>
        ]}
      >
        <div style={{ border: '1px solid #ddd', backgroundColor: '#fff', overflow: 'auto', maxHeight: '65vh' }}>
            <InvoiceTemplate ref={componentRef} order={printOrderData} />
        </div>
      </Modal>

      {/* --- CÁC MODAL CHỨC NĂNG KHÁC --- */}
      <Modal title="Xác thực quyền xóa" open={isAuthModalOpen} onOk={handleConfirmDelete} confirmLoading={confirmLoading} onCancel={() => setIsAuthModalOpen(false)} okButtonProps={{ danger: true }}>
          <Form form={form}><Form.Item name="password" rules={[{ required: true }]}><Input.Password placeholder="Mật khẩu Admin..." /></Form.Item></Form>
      </Modal>

      <Modal title="Thanh toán nợ" open={isPayModalOpen} onOk={handleAddPayment} confirmLoading={loading} onCancel={() => setIsPayModalOpen(false)}>
          <Form form={payForm} layout="vertical">
              <Form.Item name="payment_amount" label="Số tiền thu thêm:" rules={[{ required: true }]}>
                  <InputNumber 
                    style={{width: '100%'}} 
                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' VND'} 
                    parser={v => v.replace(/\D/g, '')} 
                  />
              </Form.Item>
          </Form>
      </Modal>

      <Modal title="Sửa lại số tiền đã thanh toán" open={isEditPaymentModalOpen} onOk={() => setIsAuthEditModalOpen(true)} onCancel={() => setIsEditPaymentModalOpen(false)}>
           <Form form={editForm} layout="vertical">
                <Form.Item name="new_total_paid" label="Tổng số tiền khách đã trả (Cập nhật mới):" rules={[{ required: true }]}>
                    <InputNumber 
                        style={{width: '100%'}} 
                        formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' VND'} 
                        parser={v => v.replace(/\D/g, '')} 
                    />
                </Form.Item>
           </Form>
      </Modal>

      <Modal title="Xác thực quyền sửa" open={isAuthEditModalOpen} onOk={handleConfirmEditPayment} confirmLoading={confirmLoading} onCancel={() => setIsAuthEditModalOpen(false)}>
          <Form form={authEditForm}><Form.Item name="password" rules={[{ required: true }]}><Input.Password placeholder="Mật khẩu Admin..." /></Form.Item></Form>
      </Modal>

      <Modal title="Lịch sử biến động đơn hàng" open={isHistoryModalOpen} onCancel={() => setIsHistoryModalOpen(false)} footer={null}>
          <Timeline
            items={selectedHistoryLogs.map((log, i) => ({
                color: 'blue',
                children: (
                    <>
                        <Text strong>{moment(log.date).format('DD/MM/YYYY HH:mm')}</Text> - <Text type="secondary">{log.user}</Text>
                        <p style={{margin: '4px 0'}}>{log.action} {log.paid_amount ? <b style={{color:'green'}}>+{Number(log.paid_amount).toLocaleString()}đ</b> : ''}</p>
                    </>
                ),
                key: i
            }))}
          />
      </Modal>
    </div>
  );
};

export default OrderList;