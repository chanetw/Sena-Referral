import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Typography,
  Tag,
  notification,
  Popconfirm,
  Tooltip
} from 'antd';

const { Text } = Typography;
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  IdcardOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import {
  fetchAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  setFilters
} from '../store/agentsSlice';
import { agentsAPI } from '../services/api';

const { Title } = Typography;

const AgentManagementNew = () => {
  const dispatch = useDispatch();
  const { agents, loading, pagination, filters } = useSelector((state) => state.agents);

  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [form] = Form.useForm();

  // States for agent detail modal
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // States for auto-increment agent code
  const [nextAgentCode, setNextAgentCode] = useState('');
  const [loadingAgentCode, setLoadingAgentCode] = useState(false);


  useEffect(() => {
    dispatch(fetchAgents({
      page: pagination.current,
      limit: pagination.pageSize,
      ...filters
    }));
  }, [dispatch, pagination.current, pagination.pageSize, filters]);

  const handleTableChange = (newPagination) => {
    dispatch(fetchAgents({
      page: newPagination.current,
      limit: newPagination.pageSize,
      ...filters
    }));
  };

  const handleSearch = (value) => {
    dispatch(setFilters({ search: value }));
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    dispatch(setFilters({ status }));
  };

  const fetchNextAgentCode = async () => {
    try {
      setLoadingAgentCode(true);
      const response = await agentsAPI.getNextCode();
      setNextAgentCode(response.data.nextAgentCode);
      form.setFieldValue('agentCode', response.data.nextAgentCode);
    } catch (error) {
      console.error('Error fetching next agent code:', error);
      // Fallback to default if API fails
      setNextAgentCode('AG001');
      form.setFieldValue('agentCode', 'AG001');
    } finally {
      setLoadingAgentCode(false);
    }
  };

  const handleAdd = () => {
    setEditingAgent(null);
    setIsModalVisible(true);
    form.resetFields();
    // Fetch next agent code for new agent
    fetchNextAgentCode();
  };

  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setIsModalVisible(true);
    form.setFieldsValue({
      agentCode: agent.agentCode,
      firstName: agent.firstName,
      lastName: agent.lastName,
      email: agent.User?.email || agent.email,
      phone: agent.phone,
      idCard: agent.idCard,
      status: agent.status,
    });
  };

  const handleSubmit = async (values) => {
    try {
      if (editingAgent) {
        await dispatch(updateAgent({
          id: editingAgent.id,
          agentData: values
        })).unwrap();
        notification.success({
          message: 'สำเร็จ',
          description: 'อัพเดทข้อมูลเอเจนต์สำเร็จ',
        });
      } else {
        const agentData = {
          ...values,
          password: values.idCard
        };
        await dispatch(createAgent(agentData)).unwrap();
        notification.success({
          message: 'สำเร็จ',
          description: 'เพิ่มเอเจนต์สำเร็จ',
        });
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      const errorMessage = error || 'ไม่สามารถบันทึกข้อมูลได้';

      let alertMessage = 'เกิดข้อผิดพลาด';
      let alertDescription = errorMessage;

      if (errorMessage.includes('อีเมลนี้ถูกใช้แล้ว')) {
        alertMessage = '🚫 อีเมลซ้ำในระบบ';
        alertDescription = 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น';
      } else if (errorMessage.includes('เลขบัตรประชาชนนี้ถูกใช้แล้ว')) {
        alertMessage = '🚫 เลขบัตรประชาชนซ้ำในระบบ';
        alertDescription = 'เลขบัตรประชาชนนี้ถูกใช้งานแล้ว กรุณาตรวจสอบข้อมูล';
      } else if (errorMessage.includes('เบอร์โทรศัพท์นี้ถูกใช้แล้ว')) {
        alertMessage = '🚫 เบอร์โทรศัพท์ซ้ำในระบบ';
        alertDescription = 'เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว กรุณาใช้เบอร์อื่น';
      } else if (errorMessage.includes('รหัสเอเจนต์นี้มีอยู่ในระบบแล้ว')) {
        alertMessage = '🚫 รหัสเอเจนต์ซ้ำในระบบ';
        alertDescription = 'รหัสเอเจนต์นี้ถูกใช้งานแล้ว กรุณาใช้รหัสอื่น';
      }

      notification.error({
        message: alertMessage,
        description: alertDescription,
        duration: 6,
        placement: 'topRight'
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteAgent(id)).unwrap();
      notification.success({
        message: 'สำเร็จ',
        description: 'ลบเอเจนต์สำเร็จ',
      });
    } catch (error) {
      notification.error({
        message: 'ไม่สามารถลบเอเจนต์ได้',
        description: error || 'เกิดข้อผิดพลาดในการลบเอเจนต์',
      });
    }
  };

  const handleApproveAgent = async (agent, newStatus) => {
    try {
      await dispatch(updateAgent({
        id: agent.id,
        agentData: { ...agent, status: newStatus }
      })).unwrap();

      const statusText = newStatus === 'active' ? 'อนุมัติ' : 'ปฏิเสธ';
      notification.success({
        message: 'สำเร็จ',
        description: `${statusText}เอเจนต์ ${agent.firstName} ${agent.lastName} แล้ว`,
      });
    } catch (error) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error || 'ไม่สามารถอัพเดทสถานะได้',
      });
    }
  };

  // Handle agent detail modal
  const handleShowDetail = (agent, event) => {
    console.log('handleShowDetail called with agent:', agent);
    console.log('Event:', event);

    try {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      // Ensure we have valid agent data
      if (!agent) {
        return;
      }

      setSelectedAgent(agent);
      setIsDetailModalVisible(true);
    } catch (error) {
      console.error('Error in handleShowDetail:', error);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailModalVisible(false);
    setSelectedAgent(null);
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'active':
        return <Tag icon={<CheckCircleOutlined />} color="green">ใช้งาน</Tag>;
      case 'inactive':
        return <Tag icon={<ClockCircleOutlined />} color="orange">รออนุมัติ</Tag>;
      case 'suspended':
        return <Tag icon={<CloseOutlined />} color="red">ปฏิเสธ</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'รหัสเอเจนต์',
      dataIndex: 'agentCode',
      key: 'agentCode',
      width: 120,
      render: (text, record) => (
        <span
          style={{
            cursor: 'pointer',
            fontWeight: 'bold',
            color: '#389e0d',
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: '6px',
            padding: '4px 8px',
            display: 'inline-block',
            fontSize: '13px'
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setTimeout(() => {
              handleShowDetail(record, e);
            }, 0);
          }}
        >
          {text || `#${record.id}`}
        </span>
      )
    },
    {
      title: 'ชื่อ-นามสกุล',
      key: 'name',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined />
          <span>{record.firstName} {record.lastName}</span>
        </div>
      )
    },
    {
      title: 'อีเมล',
      key: 'email',
      width: 200,
      render: (_, record) => {
        const email = record.User?.email || record.email;
        return email ? (
          <Space>
            <MailOutlined />
            <span>{email}</span>
          </Space>
        ) : '-';
      }
    },
    {
      title: 'เบอร์โทร',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (text) => text ? (
        <Space>
          <PhoneOutlined />
          <span>{text}</span>
        </Space>
      ) : '-'
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'จัดการ',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Approval Section - แสดงเฉพาะ Agent ที่สถานะ inactive */}
          <div style={{ display: 'flex', gap: '4px', minWidth: '70px' }}>
            {record.status === 'inactive' && (
              <>
                <Popconfirm
                  title="อนุมัติเอเจนต์"
                  description={`คุณต้องการอนุมัติ ${record.firstName} ${record.lastName} หรือไม่?`}
                  onConfirm={() => handleApproveAgent(record, 'active')}
                  okText="อนุมัติ"
                  cancelText="ยกเลิก"
                  okButtonProps={{ type: 'primary' }}
                >
                  <Tooltip title="อนุมัติ">
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      size="small"
                      style={{
                        backgroundColor: '#52c41a',
                        borderColor: '#52c41a',
                        color: 'white',
                        width: '32px',
                        height: '24px'
                      }}
                    />
                  </Tooltip>
                </Popconfirm>

                <Popconfirm
                  title="ปฏิเสธเอเจนต์"
                  description={`คุณต้องการปฏิเสธ ${record.firstName} ${record.lastName} หรือไม่?`}
                  onConfirm={() => handleApproveAgent(record, 'suspended')}
                  okText="ปฏิเสธ"
                  cancelText="ยกเลิก"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="ปฏิเสธ">
                    <Button
                      danger
                      icon={<CloseOutlined />}
                      size="small"
                      style={{
                        width: '32px',
                        height: '24px'
                      }}
                    />
                  </Tooltip>
                </Popconfirm>
              </>
            )}
          </div>

          {/* Standard Actions Section - อยู่ตำแหน่งคงที่ */}
          <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>

            <Popconfirm
              title="ลบเอเจนต์"
              description="คุณแน่ใจหรือไม่ที่จะลบเอเจนต์นี้?"
              onConfirm={() => handleDelete(record.id)}
              okText="ใช่"
              cancelText="ไม่"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3} style={{ margin: 0 }}>
                จัดการเอเจนต์
              </Title>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                เพิ่มเอเจนต์ใหม่
              </Button>
            </Col>
          </Row>
        </div>

        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="ค้นหาเอเจนต์ด้วยชื่อหรือรหัส..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={16}>
            <Space wrap>
              <Button
                type={statusFilter === 'all' ? 'primary' : 'default'}
                onClick={() => handleStatusFilter('all')}
              >
                ทั้งหมด
              </Button>
              <Button
                type={statusFilter === 'active' ? 'primary' : 'default'}
                onClick={() => handleStatusFilter('active')}
              >
                ใช้งาน
              </Button>
              <Button
                type={statusFilter === 'inactive' ? 'primary' : 'default'}
                onClick={() => handleStatusFilter('inactive')}
              >
                รออนุมัติ
              </Button>
              <Button
                type={statusFilter === 'suspended' ? 'primary' : 'default'}
                onClick={() => handleStatusFilter('suspended')}
              >
                ปฏิเสธ
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={agents}
          rowKey="id"
          loading={loading}
          onChange={handleTableChange}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} จาก ${total} รายการ`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Modal */}
      <Modal
        title={editingAgent ? 'แก้ไขข้อมูลเอเจนต์' : 'เพิ่มเอเจนต์ใหม่'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="agentCode"
            label={
              !editingAgent ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  รหัสเอเจนต์
                  <Button
                    type="text"
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={fetchNextAgentCode}
                    loading={loadingAgentCode}
                    title="สร้างรหัสใหม่"
                    style={{ padding: '0 4px', height: '20px', minWidth: '20px' }}
                  />
                </div>
              ) : 'รหัสเอเจนต์'
            }
            rules={[
              { required: true, message: 'รหัสเอเจนต์จำเป็น' },
              { pattern: /^AG\d{3}$/, message: 'รหัสเอเจนต์ต้องเป็นรูปแบบ AG001' }
            ]}
          >
            <Input
              placeholder={loadingAgentCode ? "กำลังโหลด..." : nextAgentCode}
              disabled={!editingAgent}
              style={!editingAgent ? {
                backgroundColor: '#f0f8ff',
                border: '1px solid #1890ff',
                color: '#1890ff',
                fontWeight: 'bold'
              } : {}}
            />
            {!editingAgent && (
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                💡 รหัสเอเจนต์ถูกสร้างโดยอัตโนมัติจากข้อมูลล่าสุดในระบบ
              </div>
            )}
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="firstName"
                label="ชื่อ"
                rules={[{ required: true, message: 'กรุณาใส่ชื่อ' }]}
              >
                <Input placeholder="ชื่อ" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="lastName"
                label="นามสกุล"
                rules={[{ required: true, message: 'กรุณาใส่นามสกุล' }]}
              >
                <Input placeholder="นามสกุล" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            label="อีเมล"
            rules={[
              { required: !editingAgent, message: 'กรุณาใส่อีเมล' },
              { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }
            ]}
          >
            <Input
              placeholder="example@email.com"
              disabled={!!editingAgent}
              prefix={<MailOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="เบอร์โทรศัพท์"
            rules={[
              { pattern: /^[0-9-]+$/, message: 'เบอร์โทรควรเป็นตัวเลขและขีดกลางเท่านั้น' }
            ]}
          >
            <Input placeholder="081-234-5678" prefix={<PhoneOutlined />} />
          </Form.Item>

          <Form.Item
            name="idCard"
            label="เลขประจำตัวประชาชน"
            extra={!editingAgent ? "หมายเลขนี้จะใช้เป็นรหัสผ่านสำหรับเข้าสู่ระบบ" : undefined}
            rules={[
              { required: true, message: 'กรุณาใส่เลขประจำตัวประชาชน' },
              { len: 13, message: 'เลขประจำตัวประชาชนต้องมี 13 หลัก' },
              { pattern: /^[0-9]+$/, message: 'เลขประจำตัวประชาชนควรเป็นตัวเลขเท่านั้น' }
            ]}
          >
            <Input
              placeholder="1234567890123"
              maxLength={13}
              disabled={!!editingAgent}
              prefix={<IdcardOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="สถานะ"
            rules={[{ required: true, message: 'กรุณาเลือกสถานะ' }]}
          >
            <Select placeholder="เลือกสถานะ">
              <Select.Option value="active">ใช้งาน</Select.Option>
              <Select.Option value="inactive">รออนุมัติ</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                ยกเลิก
              </Button>
              <Button type="primary" htmlType="submit">
                {editingAgent ? 'อัปเดต' : 'เพิ่ม'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Agent Detail Modal */}
      <Modal
        title="รายละเอียดเอเจนต์"
        open={isDetailModalVisible}
        onCancel={handleCloseDetail}
        footer={[
          <Button key="close" onClick={handleCloseDetail}>
            ปิด
          </Button>
        ]}
        width={600}
        styles={{ body: { padding: '24px' } }}
        destroyOnClose={true}
      >
        {selectedAgent ? (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>รหัสเอเจนต์:</Text>
                  <br />
                  <Text style={{ fontSize: '16px' }}>
                    {selectedAgent.agentCode || `#${selectedAgent.id || 'N/A'}`}
                  </Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>สถานะ:</Text>
                  <br />
                  {selectedAgent.status ? getStatusTag(selectedAgent.status) : <Text>ไม่ระบุ</Text>}
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>ชื่อ:</Text>
                  <br />
                  <Text style={{ fontSize: '16px' }}>{selectedAgent.firstName}</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>นามสกุล:</Text>
                  <br />
                  <Text style={{ fontSize: '16px' }}>{selectedAgent.lastName}</Text>
                </div>
              </Col>
            </Row>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>อีเมล:</Text>
              <br />
              <Text style={{ fontSize: '16px' }}>{selectedAgent.email}</Text>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>เบอร์โทร:</Text>
              <br />
              <Text style={{ fontSize: '16px' }}>{selectedAgent.phone || '-'}</Text>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>วันที่ลงทะเบียน:</Text>
              <br />
              <Text style={{ fontSize: '16px' }}>
                {selectedAgent.registrationDate ?
                  new Date(selectedAgent.registrationDate).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Invalid Date'
                }
              </Text>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>เลขประจำตัวประชาชน:</Text>
              <br />
              <Text style={{ fontSize: '16px' }}>{selectedAgent.idCard || '-'}</Text>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>ข้อมูลโครงการ:</Text>
              <br />
              <Text style={{ fontSize: '16px' }}>-</Text>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>ข้อมูล:</Text>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text type="secondary">กำลังโหลดข้อมูล...</Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AgentManagementNew;