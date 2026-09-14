// src/features/Debt/DebtList.jsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Card, Tag, Statistic, Row, Col, Typography, Badge, Tabs, Timeline, Descriptions, message, Space, Avatar, Tooltip } from 'antd';
import { FileTextOutlined, EyeOutlined, WalletOutlined, DollarOutlined, HistoryOutlined, UserOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import moment from 'moment';
import { getCustomers } from '../../services/customerService';
import { getOrdersByCustomer } from '../../services/orderService';
import { getDebtHistoryByCustomer } from '../../services/orderService';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

const DebtList = () => {
  const [debtors, setDebtors] = useState([]); 
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDebtor, setCurrentDebtor] = useState(null);
  const [debtOrders, setDebtOrders] = useState([]); 
  const [debtHistory, setDebtHistory] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');

  // Tính tổng nợ phải thu từ tất cả khách hàng
  const totalReceivable = debtors.reduce((sum, item) => sum + (item.current_debt || 0), 0);

  const fetchData = async () => {
    setLoading(true);
    try {
        const data = await getCustomers();
        // Lọc ra khách đang có nợ > 0
        const onlyDebtors = data.filter(c => c.current_debt > 0);
        // Sắp xếp giảm dần theo số nợ
        onlyDebtors.sort((a, b) => b.current_debt - a.current_debt);
        setDebtors(onlyDebtors);
    } catch (error) {
        console.error("Lỗi tải danh sách nợ:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewDetails = async (customer) => {
    setCurrentDebtor(customer);
    setIsModalOpen(true);
    setLoadingDetails(true);
    setActiveTab('orders');
    
    try {
        const allOrders = await getOrdersByCustomer(customer.key);
        setDebtOrders(allOrders);
        const history = await getDebtHistoryByCustomer(customer.key);
        setDebtHistory(history);
    } catch (error) {
        console.error("Lỗi tải chi tiết nợ:", error);
        message.error('Lỗi tải dữ liệu: ' + error.message);
    } finally {
        setLoadingDetails(false);
    }
  };

  // Tính số tiền ĐÃ TRẢ
  const getPaidValue = (record) => {
      if (record.amount_paid !== undefined) return record.amount_paid;
      return record.payment_method === 'CASH' ? record.total_amount : 0;
  };

  // Tính số tiền CÒN NỢ
  const getDebtValue = (record) => {
      if (record.amount_debt !== undefined) return record.amount_debt;
      return record.payment_method === 'DEBT' ? record.total_amount : 0;
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
      title: 'Tên khách nợ', 
      dataIndex: 'name', 
      key: 'name', 
      render: (name) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1677ff', verticalAlign: 'middle' }}>
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <b style={{fontSize: 15, color: '#1f1f1f'}}>{name}</b>
        </Space>
      )
    },
    { 
      title: 'Thông tin liên hệ', 
      key: 'contact',
      render: (_, record) => (
        <div>
          <div style={{ color: '#595959', marginBottom: 4 }}><PhoneOutlined style={{marginRight: 6, color: '#1677ff'}}/> {record.phone || 'Chưa cập nhật'}</div>
          <div style={{ color: '#8c8c8c', fontSize: 13 }}><EnvironmentOutlined style={{marginRight: 6}}/> {record.address || 'Chưa cập nhật'}</div>
        </div>
      )
    },
    { 
      title: 'Tổng nợ hiện tại', 
      dataIndex: 'current_debt', 
      key: 'current_debt',
      align: 'right',
      render: (debt) => (
        <Tooltip title="Số tiền khách hàng chưa thanh toán">
          <Tag color="error" style={{fontSize: 16, padding: '6px 12px', borderRadius: 6, border: '1px solid #ffa39e'}}>
            {Number(debt).toLocaleString()} đ
          </Tag>
        </Tooltip>
      )
    },
    {
      title: 'Ngày nợ cuối',
      dataIndex: 'last_debt_date',
      key: 'last_debt_date',
      align: 'center',
      render: date => date ? (
        <Tag color="default" style={{borderRadius: 4}}>{moment(date).format('DD/MM/YYYY')}</Tag>
      ) : <Text type="secondary">Chưa có</Text>
    },
    {
        title: 'Thao tác',
        key: 'action',
        align: 'center',
        render: (_, record) => (
            <Button 
              type="primary" 
              shape="round" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDetails(record)}
              style={{ boxShadow: '0 2px 0 rgba(22, 119, 255, 0.1)' }}
            >
                Xem sổ nợ
            </Button>
        )
    }
  ];

  const orderColumns = [
      {
        title: 'STT',
        key: 'stt',
        align: 'center',
        width: 50,
        render: (_, __, index) => index + 1
      },
      {
          title: 'Ngày mua',
          dataIndex: 'created_at',
          key: 'created_at',
          width: 140,
          render: (time) => time ? <Tag color="blue">{moment(time.toDate()).format('DD/MM/YYYY HH:mm')}</Tag> : ''
      },
      {
          title: 'Hàng hóa',
          key: 'items',
          render: (_, record) => (
              <div style={{maxWidth: 220}}>
                  {record.items?.map((item, idx) => (
                      <div key={idx} style={{marginBottom: 4}}>
                          <Badge status="processing" /> 
                          <Text style={{fontSize: 13, marginLeft: 4}}>
                              {item.name} <b style={{color: '#1677ff'}}>x{item.quantity}</b>
                          </Text>
                      </div>
                  ))}
              </div>
          )
      },
      {
          title: 'Tổng đơn',
          dataIndex: 'total_amount',
          key: 'total_amount',
          align: 'right',
          render: t => <b style={{color: '#262626'}}>{Number(t).toLocaleString()} đ</b>
      },
      {
          title: 'Đã trả',
          key: 'amount_paid',
          align: 'right',
          render: (_, record) => {
              const paid = getPaidValue(record);
              return <span style={{color: '#52c41a', fontWeight: '500'}}>{paid.toLocaleString()} đ</span>;
          }
      },
      {
          title: 'Còn nợ',
          key: 'amount_debt',
          align: 'right',
          render: (_, record) => {
              const debt = getDebtValue(record);
              return debt > 0 
                ? <span style={{color: '#cf1322', fontWeight: 'bold', fontSize: 15}}>{debt.toLocaleString()} đ</span>
                : <span style={{color: '#d9d9d9'}}>0 đ</span>;
          }
      },
      {
          title: 'Trạng thái',
          key: 'status',
          align: 'center',
          render: (_, record) => {
              const debt = getDebtValue(record);
              if (debt <= 0) return <Tag color="success">Đã thanh toán đủ</Tag>;
              if (debt === record.total_amount) return <Tag color="error">Nợ 100%</Tag>;
              return <Tag color="warning">Thanh toán một phần</Tag>;
          }
      }
  ];

  const historyColumns = [
    {
      title: 'STT',
      key: 'stt',
      align: 'center',
      width: 50,
      render: (_, __, index) => index + 1
    },
    {
      title: 'Ngày ghi nhận',
      dataIndex: 'date',
      key: 'date',
      render: date => <span style={{fontWeight: 500}}>{moment(date).format('DD/MM/YYYY HH:mm')}</span>
    },
    {
      title: 'Phân loại',
      dataIndex: 'type',
      key: 'type',
      render: type => {
        const typeConfig = {
          'new_debt': { color: 'magenta', text: 'Nợ mới phát sinh' },
          'payment': { color: 'green', text: 'Khách thanh toán' },
          'debt_increase': { color: 'orange', text: 'Tăng nợ (Điều chỉnh)' },
          'debt_decrease': { color: 'cyan', text: 'Giảm nợ (Điều chỉnh)' }
        };
        const config = typeConfig[type] || { color: 'default', text: type };
        return <Tag color={config.color} style={{borderRadius: 4}}>{config.text}</Tag>;
      }
    },
    {
      title: 'Nội dung / Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: desc => <Text type="secondary">{desc}</Text>
    },
    {
      title: 'Biến động tiền',
      key: 'amount',
      align: 'right',
      render: (_, record) => {
        if (record.type === 'payment') {
          return <span style={{color: '#52c41a', fontWeight: 'bold', fontSize: 15}}>+{record.amount_paid?.toLocaleString()} đ</span>;
        } else if (record.amount_change) {
          return (
            <span style={{color: record.amount_change > 0 ? '#cf1322' : '#1677ff', fontWeight: 'bold', fontSize: 15}}>
              {record.amount_change > 0 ? 'Tăng: ' : 'Giảm: '}{Math.abs(record.amount_change).toLocaleString()} đ
            </span>
          );
        } else if (record.amount) {
          return <span style={{color: '#cf1322', fontWeight: 'bold', fontSize: 15}}>+ {record.amount?.toLocaleString()} đ</span>;
        }
        return '0 đ';
      }
    },
    {
      title: 'Mã đơn hàng',
      dataIndex: 'order_id',
      key: 'order_id',
      align: 'center',
      render: orderId => orderId ? <Tag>#{orderId.substring(0, 8).toUpperCase()}</Tag> : '-'
    }
  ];

  // --- CSS NÂNG CAO CHO DASHBOARD ---
  const customStyles = `
    .stat-card {
      border-radius: 16px;
      border: none;
      transition: all 0.3s ease;
    }
    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important;
    }
    .main-table .ant-table-container {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #f0f0f0;
    }
    .main-table .ant-table-thead > tr > th {
      background: #fafafa;
      font-weight: 600;
      color: #262626;
    }
  `;

  return (
    <div style={{ padding: '20px' }}>
        <style>{customStyles}</style>

        {/* --- THỐNG KÊ TỔNG QUAN --- */}
        <div style={{marginBottom: 24}}>
            <Row gutter={24}>
                <Col span={8}>
                    <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #fff1f0 0%, #ffe3e3 100%)', boxShadow: '0 4px 15px rgba(207, 19, 34, 0.1)' }}>
                        <Statistic 
                            title={<span style={{color: '#a8071a', fontWeight: 600, fontSize: 16}}>TỔNG NỢ PHẢI THU</span>}
                            value={totalReceivable} 
                            precision={0}
                            valueStyle={{ color: '#cf1322', fontWeight: '900', fontSize: 32 }}
                            prefix={<DollarOutlined />} 
                            suffix="VNĐ" 
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)', boxShadow: '0 4px 15px rgba(22, 119, 255, 0.1)' }}>
                        <Statistic 
                            title={<span style={{color: '#0958d9', fontWeight: 600, fontSize: 16}}>KHÁCH ĐANG NỢ</span>}
                            value={debtors.length} 
                            valueStyle={{ color: '#0958d9', fontWeight: '900', fontSize: 32 }}
                            prefix={<WalletOutlined />} 
                            suffix="Người" 
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #fff7e6 0%, #ffd8bf 100%)', boxShadow: '0 4px 15px rgba(250, 140, 22, 0.1)' }}>
                        <Statistic 
                            title={<span style={{color: '#ad4e00', fontWeight: 600, fontSize: 16}}>ĐƠN NỢ LỚN NHẤT</span>}
                            value={debtors.length > 0 ? Math.max(...debtors.map(d => d.current_debt)) : 0}
                            precision={0}
                            valueStyle={{ color: '#d46b08', fontWeight: '900', fontSize: 32 }}
                            prefix={<UserOutlined />} 
                            suffix="VNĐ" 
                        />
                    </Card>
                </Col>
            </Row>
        </div>

        {/* --- BẢNG DANH SÁCH KHÁCH NỢ --- */}
        <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 'none' }}>
            <Title level={3} style={{marginBottom: 20, color: '#262626'}}>
                <FileTextOutlined style={{color: '#1677ff', marginRight: 10}}/> 
                Sổ Quản Lý Công Nợ
            </Title>
            <Table 
                className="main-table"
                columns={columns} 
                dataSource={debtors} 
                rowKey="key" 
                loading={loading}
                locale={{emptyText: 'Tuyệt vời! Hiện tại không có khách hàng nào nợ tiền.'}}
                pagination={{ pageSize: 10, showSizeChanger: true }}
            />
        </Card>

        {/* --- MODAL CHI TIẾT SỔ NỢ CỦA 1 KHÁCH --- */}
        <Modal 
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 15, paddingBottom: 10, borderBottom: '1px solid #f0f0f0' }}>
                    <Avatar size={50} style={{ backgroundColor: '#1677ff', fontSize: 24 }}>
                        {currentDebtor?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                        <div style={{fontSize: 20, fontWeight: 700, color: '#1f1f1f'}}>
                            Sổ nợ: <span style={{color: '#1677ff'}}>{currentDebtor?.name}</span>
                        </div>
                        <Text type="secondary" style={{fontSize: 13}}>Quản lý lịch sử nợ và thanh toán</Text>
                    </div>
                </div>
            } 
            open={isModalOpen} 
            onCancel={() => setIsModalOpen(false)}
            footer={[
              <Button key="close" type="primary" shape="round" size="large" onClick={() => setIsModalOpen(false)}>
                Đóng sổ nợ
              </Button>
            ]}
            width={1100}
            style={{ top: 20 }}
        >
            {/* Tóm tắt nhanh trong Modal */}
            <div style={{ background: '#fafafa', padding: '16px 24px', borderRadius: 12, marginTop: 15, marginBottom: 20, border: '1px dashed #d9d9d9' }}>
                <Descriptions size="small" column={3}>
                    <Descriptions.Item label="Tổng nợ hiện tại">
                        <Tag color="error" style={{fontSize: 18, padding: '4px 10px', borderRadius: 6}}>
                            {Number(currentDebtor?.current_debt || 0).toLocaleString()} đ
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại"><b>{currentDebtor?.phone || 'Chưa có'}</b></Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ"><b>{currentDebtor?.address || 'Chưa có'}</b></Descriptions.Item>
                </Descriptions>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" size="large">
                <TabPane tab={<span><FileTextOutlined /> Danh sách đơn nợ</span>} key="orders">
                    <Table 
                        columns={orderColumns} 
                        dataSource={debtOrders} 
                        loading={loadingDetails}
                        rowKey="key"
                        pagination={{pageSize: 5}}
                        locale={{emptyText: 'Khách này chưa có đơn hàng mua nợ nào.'}}
                        summary={(pageData) => {
                            let totalDebtPage = 0;
                            pageData.forEach((item) => { 
                                totalDebtPage += getDebtValue(item); 
                            });
                            return (
                                <Table.Summary.Row style={{background: '#fff1f0'}}>
                                    <Table.Summary.Cell index={0} colSpan={5} style={{textAlign: 'right', fontWeight: 'bold', fontSize: 15}}>
                                        Tổng nợ trang này:
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} style={{textAlign: 'right', fontWeight: 'bold', color: '#cf1322', fontSize: 16}}>
                                        {totalDebtPage.toLocaleString()} đ
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={2} />
                                </Table.Summary.Row>
                            );
                        }}
                    />
                </TabPane>
                
                <TabPane tab={<span><HistoryOutlined /> Lịch sử thanh toán & biến động</span>} key="history">
                    {debtHistory.length > 0 ? (
                        <Table 
                            columns={historyColumns} 
                            dataSource={debtHistory} 
                            loading={loadingDetails}
                            rowKey="key"
                            pagination={{pageSize: 10}}
                        />
                    ) : (
                        <div style={{textAlign: 'center', padding: '60px 20px', background: '#fafafa', borderRadius: 12}}>
                            <HistoryOutlined style={{fontSize: 48, color: '#d9d9d9', marginBottom: 16}} />
                            <Title level={5} style={{color: '#8c8c8c', margin: 0}}>Chưa có lịch sử nợ chi tiết</Title>
                        </div>
                    )}
                </TabPane>
                
                <TabPane tab={<span><DollarOutlined /> Báo cáo tổng quan</span>} key="overview">
                    <Row gutter={24} style={{padding: '10px 0'}}>
                        <Col span={12}>
                            <Card title="Dòng chảy công nợ" bordered={true} style={{borderRadius: 12}}>
                                <Timeline>
                                    <Timeline.Item color="red">
                                        <Text type="secondary">Tổng nợ đã phát sinh</Text>
                                        <br/>
                                        <b style={{fontSize: 18, color: '#cf1322'}}>
                                            {debtHistory
                                                .filter(h => h.type === 'new_debt' || h.type === 'debt_increase')
                                                .reduce((sum, h) => sum + (h.amount || h.amount_change || 0), 0)
                                                .toLocaleString()} đ
                                        </b>
                                    </Timeline.Item>
                                    <Timeline.Item color="green">
                                        <Text type="secondary">Tổng tiền khách đã trả</Text>
                                        <br/>
                                        <b style={{fontSize: 18, color: '#389e0d'}}>
                                            {debtHistory
                                                .filter(h => h.type === 'payment' || h.type === 'debt_decrease')
                                                .reduce((sum, h) => sum + (h.amount_paid || Math.abs(h.amount_change) || 0), 0)
                                                .toLocaleString()} đ
                                        </b>
                                    </Timeline.Item>
                                    <Timeline.Item color="blue">
                                        <Text>Số lần thanh toán: <b>{debtHistory.filter(h => h.type === 'payment').length} lần</b></Text>
                                    </Timeline.Item>
                                    <Timeline.Item color="gray">
                                        <Text>Đơn hàng còn nợ: <b>{debtOrders.filter(o => getDebtValue(o) > 0).length} đơn</b></Text>
                                    </Timeline.Item>
                                </Timeline>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card title="Các đơn nợ lớn nhất" bordered={true} style={{borderRadius: 12}}>
                                {debtOrders.filter(o => getDebtValue(o) > 0).length > 0 ? (
                                    debtOrders
                                        .filter(o => getDebtValue(o) > 0)
                                        .sort((a, b) => getDebtValue(b) - getDebtValue(a))
                                        .slice(0, 3)
                                        .map((order, index) => (
                                            <div key={order.key} style={{
                                              marginBottom: 12, padding: '12px 16px', 
                                              background: index === 0 ? '#fff1f0' : '#fafafa', 
                                              border: index === 0 ? '1px solid #ffa39e' : '1px solid #f0f0f0',
                                              borderRadius: 8
                                            }}>
                                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4}}>
                                                    <Tag color={index === 0 ? 'red' : 'default'}>Mã đơn: #{order.key.substring(0, 8).toUpperCase()}</Tag>
                                                    <span style={{color: '#cf1322', fontWeight: 'bold', fontSize: 16}}>
                                                        {getDebtValue(order).toLocaleString()} đ
                                                    </span>
                                                </div>
                                                <div style={{fontSize: 12, color: '#8c8c8c'}}>
                                                    <HistoryOutlined style={{marginRight: 4}}/>
                                                    Ngày mua: {order.created_at ? moment(order.created_at.toDate()).format('DD/MM/YYYY HH:mm') : ''}
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div style={{textAlign: 'center', padding: '30px 0'}}>
                                      <Text type="secondary">Khách hàng không có đơn nợ nào</Text>
                                    </div>
                                )}
                            </Card>
                        </Col>
                    </Row>
                </TabPane>
            </Tabs>
        </Modal>
    </div>
  );
};

export default DebtList;