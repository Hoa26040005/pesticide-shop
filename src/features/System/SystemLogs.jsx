// src/features/System/SystemLogs.jsx
import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Space, message } from 'antd';
import { ReloadOutlined, SafetyCertificateOutlined, UserOutlined, FieldTimeOutlined } from '@ant-design/icons';
import moment from 'moment';
import { getSystemLogs } from '../../services/logService';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getSystemLogs(50); // Lấy 50 hành động gần nhất
      setLogs(data);
    } catch (error) {
      message.error("Lỗi tải nhật ký: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (t) => (
        <span style={{ color: '#666' }}>
          <FieldTimeOutlined /> {t && t.toDate ? moment(t.toDate()).format('DD/MM/YYYY HH:mm:ss') : 'Vừa xong'}
        </span>
      )
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'user',
      key: 'user',
      render: (t) => (
        <span>
          <UserOutlined /> <b>{t}</b>
        </span>
      )
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      render: (t) => {
        let color = 'blue';
        if (t?.includes('Xóa')) color = 'red';
        if (t?.includes('Sửa') || t?.includes('Cập nhật')) color = 'orange';
        if (t?.includes('Thêm') || t?.includes('Tạo')) color = 'green';
        if (t?.includes('Thanh toán')) color = 'cyan';
        return <Tag color={color}>{t}</Tag>;
      }
    },
    {
      title: 'Đối tượng',
      dataIndex: 'target',
      key: 'target',
      render: (t) => <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{t}</span>
    },
    {
      title: 'Chi tiết',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    }
  ];

  return (
    <div style={{ padding: 20 }}>
        <Card 
        title={<Space><SafetyCertificateOutlined style={{ color: '#1890ff' }} /> Nhật ký hoạt động hệ thống</Space>} 
        extra={<Button icon={<ReloadOutlined />} onClick={fetchLogs}>Làm mới</Button>}
        >
        <Table 
            dataSource={logs} 
            columns={columns} 
            rowKey="key" 
            loading={loading}
            pagination={{ pageSize: 10 }}
            size="middle"
        />
        </Card>
    </div>
  );
};

export default SystemLogs;