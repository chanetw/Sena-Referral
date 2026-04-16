import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import { EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { leadSyncLogsAPI } from '../../services/api';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const STATUS_COLORS = {
  pending: 'gold',
  success: 'green',
  failed: 'red'
};

const formatJson = (value) => {
  if (!value) {
    return '-';
  }

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return JSON.stringify(parsed, null, 2);
  } catch (_) {
    return String(value);
  }
};

const LeadSyncLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [retryingLogId, setRetryingLogId] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [appliedSearchText, setAppliedSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchLogs(pagination.current, pagination.pageSize, appliedSearchText, statusFilter);
  }, [pagination.current, pagination.pageSize, appliedSearchText, statusFilter]);

  const fetchLogs = async (page = 1, limit = 20, search = '', status = 'all') => {
    try {
      setLoading(true);
      const response = await leadSyncLogsAPI.getAll({ page, limit, search, status });
      setLogs(response.data || []);
      if (response.pagination) {
        setPagination((prev) => ({
          ...prev,
          current: response.pagination.current,
          pageSize: response.pagination.pageSize,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
        }));
      }
    } catch (error) {
      message.error(error.message || 'ไม่สามารถโหลด lead sync logs ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    const nextValue = (value || '').trim();
    setSearchText(nextValue);
    setAppliedSearchText(nextValue);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value || 'all');
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleRetry = async (record) => {
    try {
      setRetryingLogId(record.id);
      const response = await leadSyncLogsAPI.retry(record.id);
      message.success(response.message || 'ส่ง lead ซ้ำสำเร็จ');
      fetchLogs(pagination.current, pagination.pageSize, appliedSearchText, statusFilter);
    } catch (error) {
      message.error(error.message || 'ไม่สามารถส่ง lead ซ้ำได้');
    } finally {
      setRetryingLogId(null);
    }
  };

  const columns = [
    {
      title: 'เวลา',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value) => (value ? new Date(value).toLocaleString('th-TH') : '-')
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value) => <Tag color={STATUS_COLORS[value] || 'default'}>{value || '-'}</Tag>
    },
    {
      title: 'ครั้งที่',
      dataIndex: 'attemptNo',
      key: 'attemptNo',
      width: 90,
      align: 'center'
    },
    {
      title: 'ลูกค้า',
      key: 'customer',
      width: 240,
      render: (_, record) => (
        <div>
          <div><Text strong>{record.customerCode || '-'}</Text></div>
          <div>{record.customerName || '-'}</div>
        </div>
      )
    },
    {
      title: 'เอเจนต์',
      key: 'agent',
      width: 180,
      render: (_, record) => (
        <div>
          <div><Text strong>{record.agentCode || '-'}</Text></div>
          <div>{record.agentName || '-'}</div>
        </div>
      )
    },
    {
      title: 'โครงการ',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 220,
      render: (value) => value || '-'
    },
    {
      title: 'HTTP',
      dataIndex: 'responseStatusCode',
      key: 'responseStatusCode',
      width: 90,
      align: 'center',
      render: (value) => value || '-'
    },
    {
      title: 'Error',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      render: (value) => value || '-'
    },
    {
      title: 'การจัดการ',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} onClick={() => {
            setSelectedLog(record);
            setDetailVisible(true);
          }}>
            ดู
          </Button>
          {record.status === 'failed' && (
            <Popconfirm
              title="ส่ง lead ซ้ำ"
              description="ต้องการส่ง lead รายการนี้ซ้ำอีกครั้งใช่หรือไม่?"
              okText="ยืนยัน"
              cancelText="ยกเลิก"
              onConfirm={() => handleRetry(record)}
            >
              <Button
                type="text"
                icon={<ReloadOutlined />}
                loading={retryingLogId === record.id}
              >
                Retry
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Lead Sync Logs</Title>
            <Text type="secondary">บันทึกการส่ง lead ไป ICON QAS/REM พร้อม request, response, error และการส่งซ้ำ</Text>
          </div>
          <Space wrap>
            <Search
              placeholder="ค้นหาลูกค้า เอเจนต์ โครงการ หรือ error"
              allowClear
              value={searchText}
              onChange={(event) => {
                const nextValue = event.target.value;
                setSearchText(nextValue);
                if (!nextValue) {
                  handleSearch('');
                }
              }}
              onSearch={handleSearch}
              style={{ width: 320 }}
              enterButton={<SearchOutlined />}
            />
            <Select value={statusFilter} onChange={handleStatusChange} style={{ width: 160 }}>
              <Option value="all">ทุกสถานะ</Option>
              <Option value="success">success</Option>
              <Option value="failed">failed</Option>
              <Option value="pending">pending</Option>
            </Select>
            <Button onClick={() => fetchLogs(pagination.current, pagination.pageSize, appliedSearchText, statusFilter)}>
              รีเฟรช
            </Button>
          </Space>
        </div>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}><Card size="small"><Text type="secondary">ทั้งหมด</Text><div style={{ fontSize: 24, fontWeight: 600 }}>{pagination.total}</div></Card></Col>
          <Col xs={24} sm={8}><Card size="small"><Text type="secondary">สำเร็จในหน้านี้</Text><div style={{ fontSize: 24, fontWeight: 600 }}>{logs.filter((item) => item.status === 'success').length}</div></Card></Col>
          <Col xs={24} sm={8}><Card size="small"><Text type="secondary">ไม่สำเร็จในหน้านี้</Text><div style={{ fontSize: 24, fontWeight: 600 }}>{logs.filter((item) => item.status === 'failed').length}</div></Card></Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={logs}
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`
          }}
          onChange={(nextPagination) => {
            setPagination((prev) => ({
              ...prev,
              current: nextPagination.current,
              pageSize: nextPagination.pageSize,
            }));
          }}
        />
      </Card>

      <Modal
        title={`Lead Sync Log #${selectedLog?.id || ''}`}
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setSelectedLog(null);
        }}
        footer={null}
        width={900}
      >
        {selectedLog && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small" title="ภาพรวม">
              <Row gutter={[16, 12]}>
                <Col span={12}><Text strong>สถานะ:</Text> <Tag color={STATUS_COLORS[selectedLog.status] || 'default'}>{selectedLog.status}</Tag></Col>
                <Col span={12}><Text strong>HTTP:</Text> {selectedLog.responseStatusCode || '-'}</Col>
                <Col span={12}><Text strong>ลูกค้า:</Text> {selectedLog.customerCode || '-'} / {selectedLog.customerName || '-'}</Col>
                <Col span={12}><Text strong>เอเจนต์:</Text> {selectedLog.agentCode || '-'} / {selectedLog.agentName || '-'}</Col>
                <Col span={12}><Text strong>โครงการ:</Text> {selectedLog.projectName || '-'}</Col>
                <Col span={12}><Text strong>ICON Lead ID:</Text> {selectedLog.iconLeadId || '-'}</Col>
              </Row>
            </Card>
            <Card size="small" title="Request Payload">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{formatJson(selectedLog.requestPayload)}</pre>
            </Card>
            <Card size="small" title="Response Body">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{formatJson(selectedLog.responseBody)}</pre>
            </Card>
            <Card size="small" title="Error Message">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{selectedLog.errorMessage || '-'}</pre>
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default LeadSyncLogs;