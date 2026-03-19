import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Space,
  Badge,
  Table,
  Tag,
  Form,
  Input,
  Select,
  notification,
  Modal
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  UsergroupAddOutlined,
  ProfileOutlined,
  BellOutlined,
  TeamOutlined,
  EditOutlined,
  SaveOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, updateUser } from '../store/authSlice';
import { fetchCustomers } from '../store/customersSlice';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, customersAPI } from '../services/api';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const AgentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { customers, loading: customersLoading } = useSelector((state) => state.customers);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm] = Form.useForm();
  const [addCustomerForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Load agent's customers on component mount
  useEffect(() => {
    if (user?.agentId) {
      dispatch(fetchCustomers({
        agentId: user.agentId,
        status: 'all',
        page: 1,
        limit: 100
      }));
    }
  }, [dispatch, user?.agentId]);

  // Fetch active projects for dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setProjectsLoading(true);
        const response = await projectsAPI.getAll({ limit: 1000 });
        if (response.data) {
          // Filter only active projects
          const activeProjects = response.data.filter(project => project.isActive);
          setProjects(activeProjects);
        }
      } catch (error) {
        notification.error({
          message: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถโหลดข้อมูลโครงการได้'
        });
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    profileForm.setFieldsValue({
      phone: user?.phone || ''
    });
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    profileForm.resetFields();
  };

  const handleUpdateProfile = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('/api/agents/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (data.success) {
        notification.success({
          message: 'สำเร็จ',
          description: 'อัพเดทเบอร์โทรสำเร็จ'
        });
        setIsEditingProfile(false);
        // Update user data in Redux store
        dispatch(updateUser(data.data));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถอัพเดทเบอร์โทรได้'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (values) => {
    setLoading(true);
    try {
      // Parse budget range
      let budgetMin = null;
      let budgetMax = null;

      if (values.budget) {
        if (values.budget === '20000000+') {
          budgetMin = 20000000;
          budgetMax = null;
        } else {
          const [min, max] = values.budget.split('-').map(Number);
          budgetMin = min;
          budgetMax = max;
        }
      }

      const customerData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || null,
        phone: values.phone,
        idCard: values.idCard,
        projectId: values.projectId || null,
        budgetMin,
        budgetMax,
        referralType: values.referralType,
        agentId: user.agentId,
        status: 'pending'
      };

      const data = await customersAPI.create(customerData);

      if (data.success) {
        notification.success({
          message: 'สำเร็จ',
          description: 'เพิ่มข้อมูลลูกค้าสำเร็จ'
        });
        addCustomerForm.resetFields();
        // Refresh customer list
        dispatch(fetchCustomers({
          agentId: user.agentId,
          status: 'all',
          page: 1,
          limit: 100
        }));
        // Navigate back to customers list
        setSelectedMenu('customers');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถเพิ่มข้อมูลลูกค้าได้'
      });
    } finally {
      setLoading(false);
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'โปรไฟล์',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'ออกจากระบบ',
      danger: true,
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'แดชบอร์ด',
    },
    {
      key: 'customers',
      icon: <UsergroupAddOutlined />,
      label: 'ลูกค้าของฉัน',
    },
    {
      key: 'add-customer',
      icon: <UserAddOutlined />,
      label: 'เพิ่มข้อมูลลูกค้า',
    },
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: 'ข้อมูลส่วนตัว',
    },
  ];

  // Filter customers for current agent
  const myCustomers = customers.filter(customer =>
    customer.agentId === user?.agentId
  ).map(customer => ({
    key: customer.id,
    id: customer.id,
    customerCode: customer.customerCode,
    firstName: customer.firstName,
    lastName: customer.lastName,
    name: `${customer.firstName} ${customer.lastName}`,
    email: customer.email,
    phone: customer.phone,
    status: customer.status,
    registrationDate: customer.createdAt || customer.registrationDate || customer.created_at
  }));

  const customerColumns = [
    // Hidden: รหัสลูกค้า column
    // {
    //   title: 'รหัสลูกค้า',
    //   dataIndex: 'customerCode',
    //   key: 'customerCode',
    //   render: (text) => <Tag color="green">{text}</Tag>
    // },
    {
      title: 'ชื่อ-นามสกุล',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'อีเมล',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'เบอร์โทร',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          pending: {
            color: 'orange',
            text: 'รอดำเนินการตรวจสอบ'
          },
          duplicate: {
            color: 'red',
            text: 'ผู้ที่ท่านแนะนำ ซ้ำกับรายชื่อของฐานข้อมูลโครงการ'
          },
          approved: {
            color: 'green',
            text: 'ผู้ถูกแนะนำของท่านผ่านเงื่อนไข'
          }
        };

        const config = statusConfig[status] || { color: 'default', text: status };

        return (
          <Tag color={config.color} style={{ whiteSpace: 'normal', maxWidth: '300px' }}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: 'วันที่ลงทะเบียน',
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      render: (date) => {
        if (!date) return '-';
        try {
          const d = new Date(date);
          if (isNaN(d.getTime())) return '-';
          return d.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } catch (e) {
          return '-';
        }
      }
    }
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title="ลูกค้าทั้งหมด"
                    value={myCustomers.length}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title="ผู้ถูกแนะนำที่ผ่านเงื่อนไข"
                    value={myCustomers.filter(c => c.status === 'approved').length}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              {/* Disabled: ยอดขายเดือนนี้ - รอระบบขายเสร็จก่อน */}
              {/* <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title="ยอดขายเดือนนี้"
                    value={0}
                    suffix="บาท"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col> */}
            </Row>

            <Card title="ลูกค้าล่าสุด" style={{ marginBottom: '24px' }}>
              <Table
                dataSource={myCustomers}
                columns={customerColumns}
                pagination={false}
                size="small"
                loading={customersLoading}
                locale={{
                  emptyText: 'ยังไม่มีลูกค้า'
                }}
              />
            </Card>
          </div>
        );
      case 'customers':
        return (
          <Card title="ลูกค้าของฉัน">
            <Table
              dataSource={myCustomers}
              columns={customerColumns}
              loading={customersLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} จาก ${total} รายการ`,
              }}
              locale={{
                emptyText: 'ยังไม่มีลูกค้าที่รับผิดชอบ'
              }}
            />
          </Card>
        );
      case 'add-customer':
        return (
          <Card title="เพิ่มข้อมูลลูกค้า">
            <Form
              form={addCustomerForm}
              layout="vertical"
              onFinish={handleAddCustomer}
              style={{ maxWidth: '800px' }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="รหัสนายหน้า"
                  >
                    <Input
                      value={`${user?.agentCode} - ${user?.firstName} ${user?.lastName}`}
                      disabled
                      style={{ backgroundColor: '#f5f5f5', color: '#000' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="referralType"
                    label={<span>ประเภทลูกค้า <Text type="danger">*</Text></span>}
                    rules={[{ required: true, message: 'กรุณาเลือกประเภทลูกค้า' }]}
                  >
                    <Select placeholder="เลือกประเภทลูกค้า">
                      <Select.Option value="self">แนะนำตัวเอง</Select.Option>
                      <Select.Option value="friend">แนะนำเพื่อน</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="firstName"
                    label={<span>ชื่อ <Text type="danger">*</Text></span>}
                    rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}
                  >
                    <Input placeholder="ชื่อ" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="lastName"
                    label={<span>นามสกุล <Text type="danger">*</Text></span>}
                    rules={[{ required: true, message: 'กรุณากรอกนามสกุล' }]}
                  >
                    <Input placeholder="นามสกุล" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }
                    ]}
                  >
                    <Input placeholder="email@example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label={<span>เบอร์โทร <Text type="danger">*</Text></span>}
                    rules={[
                      { required: true, message: 'กรุณากรอกเบอร์โทร' },
                      { pattern: /^[0-9-]+$/, message: 'เบอร์โทรควรเป็นตัวเลขและขีดกลางเท่านั้น' }
                    ]}
                  >
                    <Input placeholder="081-234-5678" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="idCard"
                    label={<span>หมายเลขบัตรประชาชน <Text type="danger">*</Text></span>}
                    rules={[
                      { required: true, message: 'กรุณากรอกหมายเลขบัตรประชาชน' },
                      { len: 13, message: 'หมายเลขบัตรประชาชนต้องมี 13 หลัก' },
                      { pattern: /^[0-9]+$/, message: 'หมายเลขบัตรประชาชนควรเป็นตัวเลขเท่านั้น' }
                    ]}
                  >
                    <Input placeholder="1234567890123" maxLength={13} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="projectId"
                    label="ชื่อโครงการ"
                  >
                    <Select
                      placeholder="เลือกโครงการ"
                      loading={projectsLoading}
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {projects.map(project => (
                        <Select.Option key={project.id} value={project.id}>
                          {project.name || project.projectName}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="budget"
                    label={<span>งบประมาณ <Text type="danger">*</Text></span>}
                    rules={[{ required: true, message: 'กรุณาเลือกงบประมาณ' }]}
                  >
                    <Select placeholder="เลือกงบประมาณ">
                      <Select.Option value="1000000-3000000">1-3 ล้านบาท</Select.Option>
                      <Select.Option value="3000000-5000000">3-5 ล้านบาท</Select.Option>
                      <Select.Option value="5000000-10000000">5-10 ล้านบาท</Select.Option>
                      <Select.Option value="10000000-20000000">10-20 ล้านบาท</Select.Option>
                      <Select.Option value="20000000+">20 ล้านบาทขึ้นไป</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginTop: '24px' }}>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    style={{
                      background: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
                      border: 'none'
                    }}
                  >
                    บันทึกข้อมูล
                  </Button>
                  <Button onClick={() => addCustomerForm.resetFields()}>
                    ล้างข้อมูล
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        );
      case 'profile':
        return (
          <Card
            title="ข้อมูลส่วนตัว"
            extra={
              !isEditingProfile && (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={handleEditProfile}
                >
                  แก้ไขเบอร์โทร
                </Button>
              )
            }
          >
            {!isEditingProfile ? (
              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                      <Text strong>รหัสเอเจนต์:</Text>
                      <br />
                      <Text style={{ fontSize: '16px' }}>{user?.agentCode}</Text>
                    </div>
                    <div>
                      <Text strong>ชื่อ:</Text>
                      <br />
                      <Text style={{ fontSize: '16px' }}>{user?.firstName}</Text>
                    </div>
                    <div>
                      <Text strong>นามสกุล:</Text>
                      <br />
                      <Text style={{ fontSize: '16px' }}>{user?.lastName}</Text>
                    </div>
                    <div>
                      <Text strong>อีเมล:</Text>
                      <br />
                      <Text style={{ fontSize: '16px' }}>{user?.email}</Text>
                    </div>
                    <div>
                      <Text strong>เบอร์โทร:</Text>
                      <br />
                      <Text style={{ fontSize: '16px' }}>{user?.phone || '-'}</Text>
                    </div>
                    <div>
                      <Text strong>สถานะ:</Text>
                      <br />
                      <Tag color="green" style={{ fontSize: '14px' }}>
                        ใช้งาน
                      </Tag>
                    </div>
                  </Space>
                </Col>
              </Row>
            ) : (
              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleUpdateProfile}
                style={{ maxWidth: '600px' }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="รหัสเอเจนต์"
                    >
                      <Input value={user?.agentCode} disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="อีเมล"
                    >
                      <Input value={user?.email} disabled />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="ชื่อ"
                    >
                      <Input value={user?.firstName} disabled />
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        * ติดต่อผู้ดูแลระบบเพื่อแก้ไข
                      </div>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="นามสกุล"
                    >
                      <Input value={user?.lastName} disabled />
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        * ติดต่อผู้ดูแลระบบเพื่อแก้ไข
                      </div>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="phone"
                  label="เบอร์โทร (สามารถแก้ไขได้)"
                  rules={[
                    { pattern: /^[0-9-]+$/, message: 'เบอร์โทรควรเป็นตัวเลขและขีดกลางเท่านั้น' }
                  ]}
                >
                  <Input placeholder="081-234-5678" />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                  <Space>
                    <Button onClick={handleCancelEdit}>
                      ยกเลิก
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={loading}
                    >
                      บันทึกเบอร์โทร
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{
          height: '64px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : 10
        }}>
          <img
            src="/sena-logo.png"
            alt="SENA"
            style={{ width: collapsed ? 28 : 28, height: 28, objectFit: 'contain', borderRadius: 4 }}
          />
          {!collapsed && (
            <Title level={4} style={{ color: 'white', margin: 0 }}>SENA Agent</Title>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenu]}
          items={menuItems}
          onSelect={({ key }) => setSelectedMenu(key)}
        />
      </Sider>

      <Layout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
          </Space>

          <Space size="middle">
            <Badge count={0}>
              <Button type="text" icon={<BellOutlined />} size="large" />
            </Badge>

            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong>{user?.firstName} {user?.lastName}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {user?.agentCode} - เอเจนต์
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{
          margin: '24px',
          padding: '24px',
          background: '#fff',
          borderRadius: '8px',
          minHeight: 'calc(100vh - 112px)'
        }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AgentDashboard;
