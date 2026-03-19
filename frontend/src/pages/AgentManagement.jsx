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
  Popconfirm,
  Tooltip,
  notification
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import {
  fetchAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  setFilters,
  setPagination,
  clearError
} from '../store/agentsSlice';

const { Title } = Typography;
const { Option } = Select;

const AgentManagement = () => {
  const dispatch = useDispatch();
  const { 
    agents, 
    loading, 
    error, 
    pagination, 
    filters 
  } = useSelector((state) => state.agents);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [form] = Form.useForm();
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingAgent, setViewingAgent] = useState(null);

  // Load agents on component mount
  useEffect(() => {
    dispatch(fetchAgents({
      page: pagination.current,
      limit: pagination.pageSize,
      ...filters
    }));
  }, [dispatch, pagination.current, pagination.pageSize, filters]);

  // Handle error notifications
  useEffect(() => {
    if (error) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error,
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Table columns
  const columns = [
    {
      title: 'รหัสเอเจนต์',
      dataIndex: 'agentCode',
      key: 'agentCode',
      width: 120,
      render: (text, record) => (
        <Typography.Link onClick={() => handleView(record)}>
          <Tag color="blue">{text}</Tag>
        </Typography.Link>
      )
    },
    {
      title: 'ชื่อ-นามสกุล',
      key: 'fullName',
      width: 200,
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <span>{`${record.firstName} ${record.lastName}`}</span>
        </Space>
      )
    },
    {
      title: 'อีเมล',
      dataIndex: ['User', 'email'],
      key: 'email',
      width: 200,
      render: (text) => text ? (
        <Space>
          <MailOutlined />
          <span>{text}</span>
        </Space>
      ) : '-'
    },
    {
      title: 'เบอร์โทร',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (text) => text ? (
        <Space>
          <PhoneOutlined />
          <span>{text}</span>
        </Space>
      ) : '-'
    },
    {
      title: 'เลขประจำตัว',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 150,
      render: (text) => (
        <Space>
          <IdcardOutlined />
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusConfig = {
          active: { color: 'green', text: 'ใช้งาน', icon: <CheckCircleOutlined /> },
          inactive: { color: 'red', text: 'ไม่ใช้งาน', icon: null },
          pending: { color: 'orange', text: 'รออนุมัติ', icon: <ClockCircleOutlined /> }
        };
        const config = statusConfig[status] || statusConfig.inactive;
        
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: 'วันที่ลงทะเบียน',
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      width: 130,
      render: (date) => new Date(date).toLocaleDateString('th-TH')
    },
    {
      title: 'การจัดการ',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <Tooltip title="อนุมัติ">
              <Popconfirm
                title="อนุมัติเอเจนต์"
                description="คุณแน่ใจหรือไม่ที่จะอนุมัติเอเจนต์นี้?"
                onConfirm={() => handleApprove(record.id)}
                okText="อนุมัติ"
                cancelText="ยกเลิก"
              >
                <Button
                  type="text"
                  style={{ color: '#52c41a' }}
                  icon={<CheckCircleOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          )}
          <Tooltip title="ดูข้อมูล">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="แก้ไข">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Popconfirm
              title="ยืนยันการลบ"
              description="คุณแน่ใจหรือไม่ที่จะลบเอเจนต์นี้?"
              onConfirm={() => handleDelete(record.id)}
              okText="ยืนยัน"
              cancelText="ยกเลิก"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  // Handle search
  const handleSearch = (value) => {
    dispatch(setFilters({ search: value }));
    dispatch(setPagination({ current: 1 }));
  };

  // Handle status filter
  const handleStatusFilter = (value) => {
    dispatch(setFilters({ status: value }));
    dispatch(setPagination({ current: 1 }));
  };

  // Handle table change (pagination)
  const handleTableChange = (pagination) => {
    dispatch(setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize
    }));
  };

  // Handle create new agent
  const handleCreate = () => {
    setEditingAgent(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  // Handle edit agent
  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setIsModalVisible(true);
    form.setFieldsValue({
      agentCode: agent.agentCode,
      firstName: agent.firstName,
      lastName: agent.lastName,
      email: agent.User?.email || agent.email, // Support both nested and direct email
      phone: agent.phone,
      idCard: agent.idCard,
      status: agent.status,
      registrationDate: agent.registrationDate
    });
  };

  // Handle view agent details
  const handleView = (agent) => {
    // Ensure we have the full agent object with User data from the agents array
    const fullAgent = agents.find(a => a.id === agent.id) || agent;
    setViewingAgent(fullAgent);
    setIsViewModalVisible(true);
  };

  // Handle approve agent
  const handleApprove = async (id) => {
    try {
      await dispatch(updateAgent({
        id: id,
        agentData: { status: 'active' }
      })).unwrap();
      notification.success({
        message: 'สำเร็จ',
        description: 'อนุมัติเอเจนต์สำเร็จ',
      });
    } catch (error) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error || 'ไม่สามารถอนุมัติเอเจนต์ได้',
      });
    }
  };

  // Handle delete agent
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

  // Handle form submit
  const handleSubmit = async (values) => {
    try {
      if (editingAgent) {
        // Update existing agent
        await dispatch(updateAgent({
          id: editingAgent.id,
          agentData: values
        })).unwrap();
        notification.success({
          message: 'สำเร็จ',
          description: 'อัพเดทข้อมูลเอเจนต์สำเร็จ',
        });
      } else {
        // Create new agent - use idCard as password
        const agentData = {
          ...values,
          password: values.idCard // ใช้หมายเลขบัตรประชาชนเป็นรหัสผ่าน
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
      // Check for specific duplicate validation errors
      const errorMessage = error || 'ไม่สามารถบันทึกข้อมูลได้';

      let alertMessage = 'เกิดข้อผิดพลาด';
      let alertDescription = errorMessage;

      // Customize alert based on error type
      if (errorMessage.includes('อีเมลนี้ถูกใช้แล้ว')) {
        alertMessage = '🚫 อีเมลซ้ำในระบบ';
        alertDescription = 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น';
      } else if (errorMessage.includes('เลขบัตรประชาชนนี้ถูกใช้แล้ว')) {
        alertMessage = '🚫 เลขบัตรประชาชนซ้ำในระบบ';
        alertDescription = 'เลขบัตรประชาชนนี้ถูกใช้งานแล้ว กรุณาตรวจสอบข้อมูล';
      } else if (errorMessage.includes('เบอร์โทรศัพท์นี้ถูกใช้แล้ว')) {
        alertMessage = '🚫 เบอร์โทรศัพท์ซ้ำในระบบ';
        alertDescription = 'เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว กรุณาใช้เบอร์อื่น';
      }

      notification.error({
        message: alertMessage,
        description: alertDescription,
        duration: 6, // แสดงนานขึ้น 6 วินาที
        placement: 'topRight'
      });
    }
  };

  // Handle modal cancel
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingAgent(null);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3} style={{ margin: 0 }}>
                <UserOutlined style={{ marginRight: '8px' }} />
                จัดการเอเจนต์
              </Title>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                เพิ่มเอเจนต์ใหม่
              </Button>
            </Col>
          </Row>
        </div>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="ค้นหาด้วยชื่อ, รหัสเอเจนต์, หรืออีเมล"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              defaultValue={filters.search}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="กรองตามสถานะ"
              value={filters.status}
              onChange={handleStatusFilter}
            >
              <Option value="all">ทั้งหมด</Option>
              <Option value="active">ใช้งาน</Option>
              <Option value="inactive">ไม่ใช้งาน</Option>
              <Option value="pending">รออนุมัติ</Option>
            </Select>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={agents}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} จาก ${total} รายการ`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Agent Form Modal */}
      <Modal
        title={editingAgent ? 'แก้ไขข้อมูลเอเจนต์' : 'เพิ่มเอเจนต์ใหม่'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="agentCode"
                label="รหัสเอเจนต์"
                rules={[
                  { required: true, message: 'กรุณาใส่รหัสเอเจนต์' },
                  { pattern: /^[A-Z0-9]+$/, message: 'รหัสเอเจนต์ควรเป็นตัวอักษรพิมพ์ใหญ่และตัวเลขเท่านั้น' }
                ]}
              >
                <Input 
                  placeholder="เช่น AG001" 
                  disabled={!!editingAgent}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label="สถานะ"
                rules={[{ required: true, message: 'กรุณาเลือกสถานะ' }]}
              >
                <Select placeholder="เลือกสถานะ">
                  <Option value="active">ใช้งาน</Option>
                  <Option value="inactive">ไม่ใช้งาน</Option>
                  <Option value="pending">รออนุมัติ</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="firstName"
                label="ชื่อ"
                rules={[{ required: true, message: 'กรุณาใส่ชื่อ' }]}
              >
                <Input placeholder="ชื่อจริง" />
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
            hasFeedback
          >
            <Input
              placeholder="example@email.com"
              disabled={!!editingAgent}
            />
          </Form.Item>


          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="เบอร์โทร"
                rules={[
                  { pattern: /^[0-9-]+$/, message: 'เบอร์โทรควรเป็นตัวเลขและขีดกลางเท่านั้น' }
                ]}
                hasFeedback
              >
                <Input placeholder="081-234-5678" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="registrationDate"
                label="วันที่ลงทะเบียน"
                rules={[{ required: true, message: 'กรุณาใส่วันที่ลงทะเบียน' }]}
              >
                <Input 
                  type="date" 
                  disabled={!!editingAgent}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="idCard"
            label="เลขประจำตัวประชาชน"
            extra={!editingAgent ? "หมายเลขนี้จะใช้เป็นรหัสผ่านสำหรับเข้าสู่ระบบ" : undefined}
            rules={[
              { required: true, message: 'กรุณาใส่เลขประจำตัวประชาชน' },
              { len: 13, message: 'เลขประจำตัวประชาชนต้องมี 13 หลัก' },
              { pattern: /^[0-9]+$/, message: 'เลขประจำตัวประชาชนควรเป็นตัวเลขเท่านั้น' }
            ]}
            hasFeedback
          >
            <Input
              placeholder="1234567890123"
              maxLength={13}
              disabled={!!editingAgent}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>
                ยกเลิก
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingAgent ? 'อัพเดท' : 'เพิ่ม'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Agent View Modal */}
      <Modal
        title="รายละเอียดเอเจนต์"
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setViewingAgent(null);
        }}
        footer={[
          <Button key="back" onClick={() => {
            setIsViewModalVisible(false);
            setViewingAgent(null);
          }}>
            ปิด
          </Button>,
        ]}
        width={600}
      >
        {viewingAgent && (
          <Form layout="vertical" initialValues={viewingAgent}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="รหัสเอเจนต์">
                  <Typography.Text strong>{viewingAgent.agentCode}</Typography.Text>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="สถานะ">
                  <Tag color={viewingAgent.status === 'active' ? 'green' : viewingAgent.status === 'pending' ? 'orange' : 'red'}>
                    {viewingAgent.status === 'active' ? 'ใช้งาน' : viewingAgent.status === 'pending' ? 'รออนุมัติ' : 'ไม่ใช้งาน'}
                  </Tag>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="ชื่อ">
                  <Typography.Text strong>{viewingAgent.firstName}</Typography.Text>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="นามสกุล">
                  <Typography.Text strong>{viewingAgent.lastName}</Typography.Text>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="อีเมล">
              <Typography.Text strong>{viewingAgent.User?.email || viewingAgent.email || '-'}</Typography.Text>
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="เบอร์โทร">
                  <Typography.Text strong>{viewingAgent.phone || '-'}</Typography.Text>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="วันที่ลงทะเบียน">
                  <Typography.Text strong>{new Date(viewingAgent.registrationDate).toLocaleDateString('th-TH')}</Typography.Text>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="เลขประจำตัวประชาชน">
              <Typography.Text strong>{viewingAgent.idCard}</Typography.Text>
            </Form.Item>

            <Form.Item label="ที่อยู่">
              <Typography.Text strong>{viewingAgent.address || '-'}</Typography.Text>
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="บัญชีธนาคาร">
                  <Typography.Text strong>{viewingAgent.bankAccount || '-'}</Typography.Text>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="ชื่อธนาคาร">
                  <Typography.Text strong>{viewingAgent.bankName || '-'}</Typography.Text>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="เลขประจำตัวผู้เสียภาษี">
              <Typography.Text strong>{viewingAgent.taxId || '-'}</Typography.Text>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default AgentManagement;