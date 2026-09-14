// src/features/Report/ReportDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Statistic, Table, DatePicker, Select, 
  Button, Space, Tag, Progress, Modal, Timeline, 
  Descriptions, Divider, message, Spin, Tabs, Alert,
  Typography
} from 'antd';
import { 
  DollarOutlined, ShoppingOutlined, 
  HistoryOutlined, BarChartOutlined, ReloadOutlined,
  CalendarOutlined, MoneyCollectOutlined, 
  FileTextOutlined, TeamOutlined, PhoneOutlined,
  EnvironmentOutlined, IdcardOutlined, 
  FileExcelOutlined, FilePdfOutlined 
} from '@ant-design/icons';
import moment from 'moment';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { getCombinedReport, getCustomerDetails } from '../../services/reportService';
import { getDebtHistoryByCustomer } from '../../services/orderService';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

const ReportDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('day');
  const [customRange, setCustomRange] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetailModal, setCustomerDetailModal] = useState(false);
  const [customerDebtHistory, setCustomerDebtHistory] = useState([]);
  const [loadingCustomerDetail, setLoadingCustomerDetail] = useState(false);

  const periodOptions = [
    { value: 'day', label: 'Hôm nay' },
    { value: 'week', label: 'Tuần này' },
    { value: 'month', label: 'Tháng này' },
    { value: 'year', label: 'Năm nay' },
    { value: 'custom', label: 'Tùy chọn' }
  ];

  const fetchReport = async (selectedPeriod = period, dateRange = customRange) => {
    setLoading(true);
    try {
      let data;
      
      if (selectedPeriod === 'custom' && dateRange) {
        const [start, end] = dateRange;
        const startDate = start.startOf('day').toDate();
        const endDate = end.endOf('day').toDate();
        data = await getCombinedReport('custom', startDate, endDate);
      } else {
        data = await getCombinedReport(selectedPeriod);
      }
      
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report:", error);
      // Chỉ hiện thông báo lỗi nếu không phải lỗi mất mạng (để đỡ phiền khi offline)
      if (error.code !== 'unavailable') {
          message.error('Lỗi khi tải báo cáo: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handlePeriodChange = (value) => {
    setPeriod(value);
    if (value !== 'custom') {
      fetchReport(value);
    }
  };

  const handleDateRangeChange = (dates) => {
    setCustomRange(dates);
    if (dates) {
      fetchReport('custom', dates);
    }
  };

  // --- XUẤT EXCEL ---
  const handleExportExcel = () => {
    if (!reportData) return message.warning("Không có dữ liệu để xuất!");

    const wb = XLSX.utils.book_new();

    // Sheet 1: Tổng quan
    const summaryData = [
        ["BÁO CÁO TỔNG HỢP", `Kỳ: ${period}`],
        ["Ngày xuất:", moment().format("DD/MM/YYYY HH:mm")],
        [],
        ["CHỈ SỐ", "GIÁ TRỊ"],
        ["Tổng doanh thu", reportData.revenue?.summary?.totalRevenue || 0],
        ["Đã thu tiền", reportData.revenue?.summary?.totalPaid || 0],
        ["Nợ phát sinh", reportData.revenue?.summary?.totalDebt || 0],
        ["Tổng số đơn hàng", reportData.revenue?.summary?.totalOrders || 0],
        ["Khách đang nợ", reportData.currentDebt?.summary?.totalDebtCustomers || 0],
        ["Tổng nợ hiện tại", reportData.currentDebt?.summary?.totalCurrentDebt || 0]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "TongQuan");

    // Sheet 2: Chi tiết doanh thu
    const revenueData = reportData.revenue?.dailyBreakdown?.map(item => ({
        "Ngày": item.date,
        "Doanh thu": item.revenue,
        "Đã thu": item.paid,
        "Còn nợ": item.debt,
        "Số đơn": item.orders
    })) || [];
    const wsRevenue = XLSX.utils.json_to_sheet(revenueData);
    XLSX.utils.book_append_sheet(wb, wsRevenue, "DoanhThu");

    // Sheet 3: Danh sách khách nợ
    const debtData = reportData.currentDebt?.debtCustomers?.map((c, i) => ({
        "STT": i + 1,
        "Tên khách hàng": c.name,
        "Số điện thoại": c.phone,
        "Địa chỉ": c.address,
        "Số nợ hiện tại": c.current_debt,
        "Ngày nợ cuối": c.last_debt_date ? moment(c.last_debt_date).format("DD/MM/YYYY") : ""
    })) || [];
    const wsDebt = XLSX.utils.json_to_sheet(debtData);
    XLSX.utils.book_append_sheet(wb, wsDebt, "KhachNo");

    XLSX.writeFile(wb, `BaoCao_${moment().format("DDMMYYYY")}.xlsx`);
    message.success("Xuất Excel thành công!");
  };

  // --- XUẤT PDF ---
  const handleExportPDF = () => {
    if (!reportData) return message.warning("Không có dữ liệu để xuất!");

    const doc = new jsPDF();
    doc.setFont("times", "normal"); 
    
    // Header
    doc.setFontSize(18);
    doc.text("BAO CAO TONG HOP CUA HANG", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Ngay xuat: ${moment().format("DD/MM/YYYY HH:mm")}`, 105, 30, { align: "center" });

    // Tổng quan
    doc.setFontSize(14);
    doc.text("1. Tong quan tai chinh", 14, 45);
    
    const summaryBody = [
        ["Tong doanh thu", `${(reportData.revenue?.summary?.totalRevenue || 0).toLocaleString()} VND`],
        ["Da thu tien", `${(reportData.revenue?.summary?.totalPaid || 0).toLocaleString()} VND`],
        ["No phat sinh", `${(reportData.revenue?.summary?.totalDebt || 0).toLocaleString()} VND`],
        ["Tong so don", `${reportData.revenue?.summary?.totalOrders || 0}`]
    ];

    autoTable(doc, {
        startY: 50,
        head: [['Chi so', 'Gia tri']],
        body: summaryBody,
    });

    // Danh sách nợ
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 50;
    
    doc.text("2. Danh sach khach hang no (Top 10)", 14, finalY + 15);
    
    const debtBody = reportData.currentDebt?.debtCustomers?.slice(0, 10).map(c => [
        c.name || 'Khach le',
        c.phone || "-",
        `${c.current_debt?.toLocaleString()} VND`
    ]) || [];

    autoTable(doc, {
        startY: finalY + 20,
        head: [['Ten khach', 'SDT', 'So no']],
        body: debtBody,
    });

    doc.save(`BaoCao_${moment().format("DDMMYYYY")}.pdf`);
    message.success("Xuất PDF thành công!");
  };

  const handleViewCustomerDetail = async (customer) => {
    setSelectedCustomer(customer);
    setLoadingCustomerDetail(true);
    try {
      const customerDetails = await getCustomerDetails(customer.customer_id || customer.key);
      setSelectedCustomer(customerDetails);
      const history = await getDebtHistoryByCustomer(customer.customer_id || customer.key);
      setCustomerDebtHistory(history);
      setCustomerDetailModal(true);
    } catch (error) {
      if(error.code !== 'unavailable') {
          message.error('Không thể tải chi tiết khách hàng: ' + error.message);
      }
      setSelectedCustomer(customer);
      setCustomerDetailModal(true);
    } finally {
      setLoadingCustomerDetail(false);
    }
  };

  // Cột cho bảng doanh thu
  const revenueColumns = [
    { title: 'Ngày', dataIndex: 'date', key: 'date', width: 120 },
    { title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', align: 'right', render: (value) => <span style={{color: '#1890ff', fontWeight: 'bold'}}>{value?.toLocaleString() || 0} đ</span> },
    { title: 'Đã thu', dataIndex: 'paid', key: 'paid', align: 'right', render: (value) => <span style={{color: '#52c41a'}}>{value?.toLocaleString() || 0} đ</span> },
    { title: 'Còn nợ', dataIndex: 'debt', key: 'debt', align: 'right', render: (value) => value > 0 ? <span style={{color: '#f5222d', fontWeight: 'bold'}}>{value?.toLocaleString() || 0} đ</span> : <span>0 đ</span> },
    { title: 'Số đơn', dataIndex: 'orders', key: 'orders', align: 'center', render: (value) => <Tag color="blue">{value || 0}</Tag> }
  ];

  // Cột cho bảng khách nợ hiện tại
  const debtCustomerColumns = [
    { title: 'STT', key: 'index', width: 60, render: (_, __, index) => index + 1 },
    { title: 'Khách hàng', dataIndex: 'name', key: 'name', render: (text, record) => (<div><div style={{ fontWeight: 'bold' }}>{text || 'Không tên'}</div>{record.phone && (<div style={{ fontSize: '12px', color: '#666' }}><PhoneOutlined /> {record.phone}</div>)}</div>) },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address', render: (text) => text ? (<div style={{ maxWidth: 200 }}><EnvironmentOutlined /> <Text ellipsis>{text}</Text></div>) : 'Chưa có' },
    { title: 'Số nợ hiện tại', dataIndex: 'current_debt', key: 'current_debt', align: 'right', render: (value) => (<div><div style={{color: '#f5222d', fontWeight: 'bold', fontSize: '16px'}}>{value?.toLocaleString() || 0} đ</div>{value > 0 && (<div style={{ fontSize: '12px', color: '#fa8c16' }}>{moment(selectedCustomer?.last_debt_date).fromNow()}</div>)}</div>) },
    { title: 'Trạng thái', key: 'status', width: 100, render: (_, record) => { const debt = record.current_debt || 0; if (debt > 5000000) return <Tag color="red">Nợ rất lớn</Tag>; if (debt > 2000000) return <Tag color="orange">Nợ lớn</Tag>; return <Tag color="green">Nợ nhỏ</Tag>; } },
    { title: 'Hành động', key: 'action', width: 100, render: (_, record) => (<Button type="link" size="small" onClick={() => handleViewCustomerDetail(record)}>Xem chi tiết</Button>) }
  ];

  // Cột cho nợ mới
  const newDebtColumns = [
    { title: 'Khách hàng', dataIndex: 'customer_name', key: 'customer_name', render: (text, record) => (<div><div style={{ fontWeight: 'bold' }}>{text || 'Khách vãng lai'}</div>{record.phone && (<div style={{ fontSize: '12px', color: '#666' }}><PhoneOutlined /> {record.phone}</div>)}</div>) },
    { title: 'Tổng nợ mới', dataIndex: 'total_debt', key: 'total_debt', align: 'right', render: (value) => <span style={{color: '#f5222d', fontWeight: 'bold'}}>{value?.toLocaleString() || 0} đ</span> },
    { title: 'Số đơn nợ', key: 'order_count', align: 'center', render: (_, record) => <Tag color="blue">{record.orders?.length || 0}</Tag> },
    { title: 'Chi tiết', key: 'action', width: 100, render: (_, record) => record.customer_id ? (<Button type="link" size="small" onClick={() => handleViewCustomerDetail(record)}>Xem đơn</Button>) : null }
  ];

  const orderDebtColumns = [
    { title: 'Mã đơn', dataIndex: 'order_id', key: 'order_id', width: 100, render: (text) => text ? `#${text.substring(0, 8)}...` : '-' },
    { title: 'Ngày', dataIndex: 'date', key: 'date', render: (date) => date ? (date.toDate ? moment(date.toDate()).format('DD/MM/YYYY HH:mm') : moment(date).format('DD/MM/YYYY HH:mm')) : '' },
    { title: 'Tổng tiền', dataIndex: 'total_amount', key: 'total_amount', align: 'right', render: (value) => <span>{value?.toLocaleString() || 0} đ</span> },
    { title: 'Đã trả', dataIndex: 'amount_paid', key: 'amount_paid', align: 'right', render: (value) => <span style={{color: '#52c41a'}}>{value?.toLocaleString() || 0} đ</span> },
    { title: 'Còn nợ', dataIndex: 'amount_debt', key: 'amount_debt', align: 'right', render: (value) => <span style={{color: '#f5222d', fontWeight: 'bold'}}>{value?.toLocaleString() || 0} đ</span> },
    { title: 'Trạng thái', key: 'status', width: 100, render: (_, record) => { const debt = record.amount_debt || 0; if (debt <= 0) return <Tag color="success">Đã trả đủ</Tag>; if (record.payment_method === 'DEBT') return <Tag color="error">Nợ 100%</Tag>; return <Tag color="warning">Thiếu</Tag>; } }
  ];

  const debtHistoryColumns = [
    { title: 'Ngày', dataIndex: 'date', key: 'date', render: (date) => moment(date).format('DD/MM/YYYY HH:mm') },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: (type) => { const types = { 'new_debt': { color: 'red', text: 'Nợ mới' }, 'payment': { color: 'green', text: 'Thanh toán' }, 'debt_increase': { color: 'orange', text: 'Tăng nợ' }, 'debt_decrease': { color: 'blue', text: 'Giảm nợ' } }; const config = types[type] || { color: 'default', text: type }; return <Tag color={config.color}>{config.text}</Tag>; } },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    { title: 'Số tiền', key: 'amount', align: 'right', render: (_, record) => { if (record.type === 'payment') return <span style={{color: 'green', fontWeight: 'bold'}}>+{record.amount_paid?.toLocaleString()} đ</span>; if (record.amount_change) return (<span style={{color: record.amount_change > 0 ? 'red' : 'blue', fontWeight: 'bold'}}>{record.amount_change > 0 ? '+' : ''}{record.amount_change?.toLocaleString()} đ</span>); if (record.amount) return <span style={{color: 'red', fontWeight: 'bold'}}>+{record.amount?.toLocaleString()} đ</span>; return '0 đ'; } },
    { title: 'Đơn hàng', dataIndex: 'order_id', key: 'order_id', render: orderId => orderId ? `#${orderId.substring(0, 8)}...` : '-' }
  ];

  // --- CẤU HÌNH TABS (DÙNG ITEMS PROP CHUẨN ANTD V5) ---
  // Sửa lỗi: Tabs.TabPane -> items prop
  // Sửa lỗi: Statistic valueStyle -> styles.content
  // Sửa lỗi: Alert message -> message prop (nhưng Antd 5 vẫn dùng message, chỉ có Modal mới đổi)
  
  const tabItems = [
    {
      key: '1',
      label: <span><DollarOutlined /> Doanh thu</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}><h3><ShoppingOutlined /> Chi tiết doanh thu theo ngày</h3><Table dataSource={reportData?.revenue?.dailyBreakdown || []} columns={revenueColumns} rowKey="date" pagination={{ pageSize: 7 }} size="middle" /></Col>
          <Col span={8}>
            <Card title="Tóm tắt thanh toán" size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Đơn tiền mặt"><Tag color="green">{reportData?.revenue?.summary?.cashOrders || 0}</Tag></Descriptions.Item>
                <Descriptions.Item label="Đơn nợ 100%"><Tag color="red">{reportData?.revenue?.summary?.debtOrders || 0}</Tag></Descriptions.Item>
                <Descriptions.Item label="Đơn trả trước"><Tag color="orange">{reportData?.revenue?.summary?.partialOrders || 0}</Tag></Descriptions.Item>
                <Descriptions.Item label="Tổng số đơn"><b>{reportData?.revenue?.summary?.totalOrders || 0}</b></Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Phân loại thanh toán" size="small">
              <Progress type="dashboard" percent={reportData?.revenue?.summary?.totalRevenue > 0 ? Math.round((reportData.revenue.summary.totalPaid / reportData.revenue.summary.totalRevenue) * 100) : 0} format={percent => `${percent}% đã thu`} strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} />
              <div style={{ marginTop: 10, textAlign: 'center' }}><small>Tỷ lệ thu tiền</small></div>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Cảnh báo nợ" size="small">
              {reportData?.debt?.summary?.totalDebt > 1000000 ? (<Alert message="Nợ cao cần thu hồi" description={<div><p>Có {reportData.debt.summary.totalDebtOrders} đơn nợ</p><p>Tổng nợ: {reportData.debt.summary.totalDebt.toLocaleString()} đ</p></div>} type="warning" showIcon />) : (<Alert message="Tình hình ổn định" description="Không có đơn nợ lớn trong kỳ này" type="success" showIcon />)}
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: '2',
      label: <span><FileTextOutlined /> Nợ mới trong kỳ</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Alert message={`📊 Có ${reportData?.debt?.customerDebts?.length || 0} khách hàng nợ mới trong kỳ này`} description={`Tổng nợ mới: ${(reportData?.debt?.summary?.totalDebt || 0).toLocaleString()} đ`} type="info" showIcon style={{ marginBottom: 20 }} />
            {reportData?.debt?.customerDebts && reportData.debt.customerDebts.length > 0 ? (
              <Table dataSource={reportData.debt.customerDebts} columns={newDebtColumns} rowKey="customer_id" pagination={{ pageSize: 10 }} expandable={{ expandedRowRender: (record) => (<div style={{ margin: 0 }}><h4>Chi tiết đơn hàng nợ:</h4><Table dataSource={record.orders || []} columns={orderDebtColumns} rowKey="order_id" pagination={false} size="small" /></div>), rowExpandable: (record) => record.orders && record.orders.length > 0 }} />
            ) : (<Alert message="✅ Không có nợ mới trong kỳ này" description="Tất cả đơn hàng đều đã thanh toán đủ" type="success" showIcon style={{ marginTop: 20 }} />)}
          </Col>
        </Row>
      )
    },
    {
      key: '3',
      label: <span><TeamOutlined /> Nợ hiện tại</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Alert message={`📋 Có ${reportData?.currentDebt?.debtCustomers?.length || 0} khách hàng đang nợ`} description={`Tổng nợ hiện tại: ${(reportData?.currentDebt?.summary?.totalCurrentDebt || 0).toLocaleString()} đ`} type="warning" showIcon style={{ marginBottom: 20 }} />
            <Table dataSource={reportData?.currentDebt?.debtCustomers || []} columns={debtCustomerColumns} rowKey="key" pagination={{ pageSize: 10 }} />
          </Col>
        </Row>
      )
    },
    {
      key: '4',
      label: <span><HistoryOutlined /> Xu hướng & Thống kê</span>,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="Top 5 khách nợ nhiều nhất" size="small">
              {reportData?.currentDebt?.debtCustomers?.slice(0, 5).map((customer, index) => (
                <div key={customer.key || index} style={{ marginBottom: 15, padding: 10, background: index === 0 ? '#fff7e6' : '#fafafa', borderRadius: 6 }}>
                  <Row justify="space-between" align="middle">
                    <Col><div style={{ display: 'flex', alignItems: 'center' }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: index === 0 ? '#ff4d4f' : index === 1 ? '#ffa940' : index === 2 ? '#ffc53d' : '#d9d9d9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, fontWeight: 'bold' }}>{index + 1}</div><div><div style={{ fontWeight: 'bold' }}>{customer.name || 'Không tên'}</div>{customer.phone && (<div style={{ fontSize: '12px', color: '#666' }}>{customer.phone}</div>)}</div></div></Col>
                    <Col><span style={{ color: '#f5222d', fontWeight: 'bold', fontSize: '16px' }}>{(customer.current_debt || 0).toLocaleString()} đ</span></Col>
                  </Row>
                  <Progress percent={Math.min(((customer.current_debt || 0) / 10000000) * 100, 100)} size="small" status="active" strokeColor={index === 0 ? '#ff4d4f' : index === 1 ? '#ffa940' : index === 2 ? '#ffc53d' : '#1890ff'} style={{ marginTop: 8 }} />
                </div>
              ))}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Thống kê đơn hàng" size="small">
              <Timeline items={[
                  { color: "green", dot: <ShoppingOutlined />, children: <p><strong>Đơn tiền mặt:</strong> {reportData?.revenue?.summary?.cashOrders || 0}</p> },
                  { color: "orange", dot: <DollarOutlined />, children: <p><strong>Đơn trả trước:</strong> {reportData?.revenue?.summary?.partialOrders || 0}</p> },
                  { color: "red", dot: <FileTextOutlined />, children: <p><strong>Đơn nợ 100%:</strong> {reportData?.revenue?.summary?.debtOrders || 0}</p> },
                  { color: "blue", dot: <BarChartOutlined />, children: <p><strong>Tổng đơn hàng:</strong> {reportData?.revenue?.summary?.totalOrders || 0}</p> }
              ]} />
              <Divider />
              {/* SỬA LỖI STATISTIC: styles.content */}
              <div style={{ textAlign: 'center' }}>
                <Statistic 
                  title="Tỷ lệ thanh toán đủ" 
                  value={reportData?.revenue?.summary?.totalOrders > 0 ? Math.round(((reportData?.revenue?.summary?.cashOrders || 0) / reportData?.revenue?.summary?.totalOrders) * 100) : 0} 
                  suffix="%" 
                  styles={{ content: { color: '#52c41a' } }} 
                />
              </div>
            </Card>
          </Col>
        </Row>
      )
    }
  ];

  // SỬA LỖI SPIN: Bỏ props tip, tự wrap div
  if (loading && !reportData) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Đang tải báo cáo...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header với điều khiển */}
      <Card style={{ marginBottom: 20 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h2 style={{ margin: 0 }}><BarChartOutlined /> Báo cáo tổng hợp</h2>
            {reportData && (<div style={{ color: '#666', marginTop: 5 }}><CalendarOutlined /> Kỳ báo cáo: {period !== 'custom' ? periodOptions.find(p => p.value === period)?.label : customRange && customRange[0] && customRange[1] ? `${moment(customRange[0]).format('DD/MM/YYYY')} - ${moment(customRange[1]).format('DD/MM/YYYY')}` : 'Tùy chọn'}</div>)}
          </Col>
          <Col>
            <Space>
              <Select value={period} onChange={handlePeriodChange} style={{ width: 150 }}>{periodOptions.map(option => (<Option key={option.value} value={option.value}>{option.label}</Option>))}</Select>
              {period === 'custom' && (<RangePicker value={customRange} onChange={handleDateRangeChange} format="DD/MM/YYYY" style={{ width: 250 }} />)}
              <Button icon={<ReloadOutlined />} onClick={() => fetchReport()} type="primary" ghost>Tải lại</Button>
              <Button icon={<FileExcelOutlined />} onClick={handleExportExcel} style={{ backgroundColor: '#217346', color: '#fff', borderColor: '#217346' }}>Excel</Button>
              <Button icon={<FilePdfOutlined />} onClick={handleExportPDF} style={{ backgroundColor: '#ff4d4f', color: '#fff', borderColor: '#ff4d4f' }}>PDF</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {reportData ? (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            {/* SỬA LỖI STATISTIC: Dùng styles.content thay vì valueStyle */}
            <Col span={6}><Card hoverable><Statistic title="Tổng doanh thu" value={reportData.revenue?.summary?.totalRevenue || 0} prefix={<DollarOutlined />} suffix="đ" styles={{ content: { color: '#1890ff', fontSize: '24px' } }} /><div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>{reportData.revenue?.summary?.totalOrders || 0} đơn hàng</div></Card></Col>
            <Col span={6}><Card hoverable><Statistic title="Đã thu tiền" value={reportData.revenue?.summary?.totalPaid || 0} prefix={<MoneyCollectOutlined />} suffix="đ" styles={{ content: { color: '#52c41a', fontSize: '24px' } }} /><div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>Tỷ lệ: {reportData.revenue?.summary?.totalRevenue > 0 ? `${Math.round((reportData.revenue?.summary?.totalPaid / reportData.revenue?.summary?.totalRevenue) * 100)}%` : '0%'}</div></Card></Col>
            <Col span={6}><Card hoverable><Statistic title="Nợ phát sinh" value={reportData.debt?.summary?.totalDebt || 0} prefix={<FileTextOutlined />} suffix="đ" styles={{ content: { color: '#f5222d', fontSize: '24px' } }} /><div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>{reportData.debt?.summary?.totalDebtOrders || 0} đơn nợ</div></Card></Col>
            <Col span={6}><Card hoverable><Statistic title="Khách đang nợ" value={reportData.currentDebt?.summary?.totalCurrentDebt || 0} prefix={<TeamOutlined />} suffix="đ" styles={{ content: { color: '#fa8c16', fontSize: '24px' } }} /><div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>{reportData.currentDebt?.summary?.totalDebtCustomers || 0} khách hàng</div></Card></Col>
          </Row>

          <Card>
            <Tabs defaultActiveKey="1" items={tabItems} />
          </Card>

          <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
            <Col span={24}>
              <Card title="📋 Tóm tắt báo cáo" size="small">
                <Row gutter={16}>
                  <Col span={6}><p><strong>Doanh thu:</strong></p><p style={{ color: '#1890ff', fontSize: '18px', fontWeight: 'bold' }}>{(reportData.revenue?.summary?.totalRevenue || 0).toLocaleString()} đ</p></Col>
                  <Col span={6}><p><strong>Đã thu:</strong></p><p style={{ color: '#52c41a', fontSize: '18px', fontWeight: 'bold' }}>{(reportData.revenue?.summary?.totalPaid || 0).toLocaleString()} đ</p></Col>
                  <Col span={6}><p><strong>Còn nợ:</strong></p><p style={{ color: '#f5222d', fontSize: '18px', fontWeight: 'bold' }}>{(reportData.revenue?.summary?.totalDebt || 0).toLocaleString()} đ</p></Col>
                  <Col span={6}><p><strong>Khách nợ:</strong></p><p style={{ color: '#fa8c16', fontSize: '18px', fontWeight: 'bold' }}>{reportData.currentDebt?.debtCustomers?.length || 0} người</p></Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Card style={{ textAlign: 'center', padding: 50 }}><Alert message="Không có dữ liệu báo cáo" description="Vui lòng chọn khoảng thời gian khác hoặc kiểm tra kết nối" type="info" showIcon /></Card>
      )}

      {/* Modal chi tiết khách hàng */}
      <Modal 
        title={<div><IdcardOutlined /> Chi tiết khách hàng: <span style={{ color: '#1677ff', marginLeft: 8 }}>{selectedCustomer?.name || selectedCustomer?.customer_name || 'Không tên'}</span></div>} 
        open={customerDetailModal} 
        onCancel={() => setCustomerDetailModal(false)} 
        // SỬA LỖI MODAL DEPRECATED: destroyOnClose -> destroyOnHidden (Antd v5)
        destroyOnHidden={true}
        footer={[<Button key="close" onClick={() => setCustomerDetailModal(false)}>Đóng</Button>]} 
        width={1000}
      >
        {selectedCustomer && (
          <Spin spinning={loadingCustomerDetail}>
            <Row gutter={16}>
              <Col span={8}>
                <Card title="Thông tin khách hàng" size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Tên khách hàng"><div style={{ fontWeight: 'bold' }}>{selectedCustomer.name || selectedCustomer.customer_name || 'Không tên'}</div></Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">{selectedCustomer.phone ? (<div><PhoneOutlined /> {selectedCustomer.phone}</div>) : 'Chưa có'}</Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ">{selectedCustomer.address ? (<div><EnvironmentOutlined /> {selectedCustomer.address}</div>) : 'Chưa có'}</Descriptions.Item>
                    <Descriptions.Item label="Số nợ hiện tại"><div style={{ color: '#f5222d', fontWeight: 'bold', fontSize: '18px' }}>{(selectedCustomer.current_debt || 0).toLocaleString()} đ</div></Descriptions.Item>
                    <Descriptions.Item label="Ngày nợ cuối">{selectedCustomer.last_debt_date ? moment(selectedCustomer.last_debt_date).format('DD/MM/YYYY HH:mm') : 'Chưa có'}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={16}>
                <Tabs size="small" items={[
                    { key: 'history', label: 'Lịch sử nợ', children: customerDebtHistory.length > 0 ? (<Table dataSource={customerDebtHistory} columns={debtHistoryColumns} rowKey="key" pagination={{ pageSize: 5 }} size="small" />) : (<Alert message="Chưa có lịch sử nợ chi tiết" type="info" showIcon />) },
                    { key: 'overview', label: 'Tổng quan nợ', children: <Row gutter={16}><Col span={12}><Card size="small" title="Thống kê nợ"><Timeline items={[
                        { color: "red", children: <p>Tổng nợ phát sinh: {customerDebtHistory.filter(h => h.type === 'new_debt' || h.type === 'debt_increase').reduce((sum, h) => sum + (h.amount || h.amount_change || 0), 0).toLocaleString()} đ</p> },
                        { color: "green", children: <p>Tổng đã trả: {customerDebtHistory.filter(h => h.type === 'payment' || h.type === 'debt_decrease').reduce((sum, h) => sum + (h.amount_paid || Math.abs(h.amount_change) || 0), 0).toLocaleString()} đ</p> },
                        { color: "blue", children: <p>Số lần thanh toán: {customerDebtHistory.filter(h => h.type === 'payment').length}</p> }
                    ]} /></Card></Col></Row> }
                ]} />
              </Col>
            </Row>
          </Spin>
        )}
      </Modal>
    </div>
  );
};

export default ReportDashboard;