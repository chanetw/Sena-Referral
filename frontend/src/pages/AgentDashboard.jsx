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
  Modal,
  Tooltip
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
  UserAddOutlined,
  SearchOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, updateUser, getCurrentUser } from '../store/authSlice';
import { fetchCustomers, setFilters, setPagination } from '../store/customersSlice';
import { useNavigate } from 'react-router-dom';
import { agentsAPI, projectsAPI, customersAPI, productTypesAPI } from '../services/api';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const AgentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const {
    customers,
    loading: customersLoading,
    pagination,
    filters
  } = useSelector((state) => state.customers);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm] = Form.useForm();
  const [addCustomerForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [productTypes, setProductTypes] = useState([]);
  const [productTypesLoading, setProductTypesLoading] = useState(false);
  const [isAddCustomerModalVisible, setIsAddCustomerModalVisible] = useState(false);

  const loadAgentCustomers = ({ page = 1, limit = 10, search = '' } = {}) => {
    if (!user?.agentId) return;

    dispatch(fetchCustomers({
      agentId: user.agentId,
      status: 'all',
      search,
      page,
      limit
    }));
  };

  // Refresh user profile on mount to get latest name/info
  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  // Load agent's customers on component mount
  useEffect(() => {
    if (user?.agentId) {
      loadAgentCustomers({
        page: pagination.current || 1,
        limit: pagination.pageSize || 10,
        search: filters.search || ''
      });
    }
  }, [dispatch, user?.agentId]);

  const handleCustomerSearch = (value) => {
    const searchValue = (value || '').trim();
    const pageSize = pagination.pageSize || 10;

    dispatch(setFilters({ search: searchValue }));
    dispatch(setPagination({ current: 1 }));

    loadAgentCustomers({
      page: 1,
      limit: pageSize,
      search: searchValue
    });
  };

  const handleCustomerTableChange = (tablePagination) => {
    const nextPage = tablePagination.current || 1;
    const nextPageSize = tablePagination.pageSize || 10;

    dispatch(setPagination({
      current: nextPage,
      pageSize: nextPageSize
    }));

    loadAgentCustomers({
      page: nextPage,
      limit: nextPageSize,
      search: filters.search || ''
    });
  };

  useEffect(() => {
    if (isEditingProfile) {
      profileForm.setFieldsValue({
        phone: user?.phone || ''
      });
    }
  }, [isEditingProfile, profileForm, user?.phone]);

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

  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        setProductTypesLoading(true);
        const response = await productTypesAPI.getAll();
        setProductTypes(response.data || []);
      } catch (error) {
        notification.error({
          message: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถโหลดข้อมูลประเภทสินค้าได้'
        });
      } finally {
        setProductTypesLoading(false);
      }
    };

    fetchProductTypes();
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    profileForm.resetFields();
  };

  const handleUpdateProfile = async (values) => {
    setLoading(true);
    try {
      const data = await agentsAPI.updateProfile(values);

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
        productTypeIds: values.productTypeIds || [],
        agentId: user.agentId,
        address: values.address || null,
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
        dispatch(setPagination({ current: 1 }));
        dispatch(fetchCustomers({
          agentId: user.agentId,
          status: 'all',
          search: filters.search || '',
          page: 1,
          limit: pagination.pageSize || 10
        }));
        setIsAddCustomerModalVisible(false);
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
      key: 'profile',
      icon: <ProfileOutlined />,
      label: 'ข้อมูลส่วนตัว',
    },
  ];

  // Filter customers for current agent
  const myCustomers = customers.filter(customer =>
    customer.agentId === user?.agentId
  ).map(customer => {
    // Find project name from projectsList or use project.projectName
    let projectName = '-';
    if (customer.project && customer.project.projectName) {
      projectName = customer.project.projectName;
    } else if (customer.projectId) {
      const project = projects.find(p => p.id === customer.projectId);
      projectName = project ? project.projectName : `Project ID: ${customer.projectId}`;
    } else if (customer.projectName) {
      projectName = customer.projectName;
    }

    return {
      key: customer.id,
      id: customer.id,
      customerCode: customer.customerCode,
      firstName: customer.firstName,
      lastName: customer.lastName,
      name: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      phone: customer.phone,
      projectId: customer.projectId,
      projectName: projectName,
      budgetMin: customer.budgetMin,
      budgetMax: customer.budgetMax,
      productTypes: customer.productTypes || [],
      status: customer.status,
      registrationDate: customer.createdAt || customer.registrationDate || customer.created_at
    };
  });

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
      title: 'โครงการที่สนใจ',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (projectName) => projectName || '-'
    },
    {
      title: 'งบประมาณ',
      dataIndex: 'budgetMin',
      key: 'budget',
      width: 140,
      render: (budgetMin, record) => {
        if (record.budgetMin && record.budgetMax) {
          const min = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(record.budgetMin);
          const max = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(record.budgetMax);
          return (
            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <div>{min}</div>
              <div style={{ color: '#999' }}>-</div>
              <div>{max}</div>
            </div>
          );
        }
        return '-';
      }
    },
    {
      title: 'Product Type',
      dataIndex: 'productTypes',
      key: 'productTypes',
      width: 180,
      render: (productTypes) => {
        if (!productTypes || productTypes.length === 0) {
          return '-';
        }

        return (
          <Space size={[0, 4]} wrap>
            {productTypes.map((productType) => (
              <Tag color="cyan" key={productType.id}>{productType.name}</Tag>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 200,
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
          <Card
            title="ลูกค้าของฉัน"
            extra={
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setIsAddCustomerModalVisible(true)}
              >
                เพิ่มลูกค้าใหม่
              </Button>
            }
          >
            <Input.Search
              placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
              allowClear
              enterButton={<SearchOutlined />}
              defaultValue={filters.search}
              onSearch={handleCustomerSearch}
              onChange={(e) => {
                if (e.target.value === '') {
                  handleCustomerSearch('');
                }
              }}
              style={{ maxWidth: 420, marginBottom: 16 }}
            />
            <Table
              dataSource={myCustomers}
              columns={customerColumns}
              loading={customersLoading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} จาก ${total} รายการ`,
              }}
              onChange={handleCustomerTableChange}
              locale={{
                emptyText: 'ยังไม่มีลูกค้าที่รับผิดชอบ'
              }}
            />
          </Card>
        );
      case 'profile':
        return (
          <div>
            <Card
              style={{
                overflow: 'hidden',
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(0,21,41,.08)'
              }}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
                color: 'white',
                padding: '32px 24px'
              }}>
                <Row gutter={[24, 24]} align="middle">
                  <Col xs={24} md={16}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{
                        width: '84px',
                        height: '84px',
                        background: 'rgba(255, 255, 255, 0.22)',
                        border: '1px solid rgba(255, 255, 255, 0.28)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '30px',
                        fontWeight: 700,
                        backdropFilter: 'blur(6px)',
                        flexShrink: 0
                      }}>
                        {(user?.firstName?.charAt(0) || '') + (user?.lastName?.charAt(0) || '')}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', opacity: 0.85, marginBottom: '6px' }}>โปรไฟล์เอเจนต์</div>
                        <div style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.2, marginBottom: '8px' }}>
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div style={{ fontSize: '15px', opacity: 0.92, marginBottom: '12px' }}>
                          {user?.agentCode} - เอเจนต์
                        </div>
                        <Tag color="green" style={{ borderRadius: '999px', paddingInline: '10px' }}>
                          ใช้งาน
                        </Tag>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.14)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      borderRadius: '14px',
                      padding: '16px',
                      textAlign: 'left'
                    }}>
                      <div style={{ fontSize: '13px', opacity: 0.82, marginBottom: '6px' }}>ช่องทางติดต่อหลัก</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{user?.phone || '-'}</div>
                      <div style={{ fontSize: '13px', opacity: 0.82 }}>สามารถแก้ไขได้จากปุ่มด้านล่าง</div>
                    </div>
                  </Col>
                </Row>
              </div>

              <div style={{ padding: '24px' }}>
                <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                  <Col xs={24} lg={16}>
                    <Card
                      title="ข้อมูลส่วนตัว"
                      style={{ borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
                    >
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <Card size="small" style={{ borderRadius: '12px', background: '#fafafa' }} styles={{ body: { padding: '16px' } }}>
                            <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>รหัสเอเจนต์</div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>{user?.agentCode || '-'}</div>
                          </Card>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Card size="small" style={{ borderRadius: '12px', background: '#e6f4ff', border: '1px solid #91caff' }} styles={{ body: { padding: '16px' } }}>
                            <div style={{ fontSize: '12px', color: '#1677ff', marginBottom: '8px', fontWeight: 500 }}>รหัสแนะนำ (Referral Code)</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '22px', fontWeight: 700, color: '#0958d9', fontFamily: 'monospace', letterSpacing: '2px' }}>{user?.refCode || '-'}</span>
                              {user?.refCode && (
                                <Tooltip title="คัดลอกรหัสแนะนำ">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<CopyOutlined />}
                                    style={{ color: '#1677ff' }}
                                    onClick={() => {
                                      navigator.clipboard.writeText(user.refCode);
                                      notification.success({ message: 'คัดลอกรหัสแนะนำแล้ว', duration: 1.5 });
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: '#595959', marginTop: '6px' }}>แชร์รหัสนี้ให้ลูกบ้านใช้ลงทะเบียน</div>
                          </Card>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Card size="small" style={{ borderRadius: '12px', background: '#fafafa' }} styles={{ body: { padding: '16px' } }}>
                            <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>อีเมล</div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#262626', wordBreak: 'break-word' }}>{user?.email || '-'}</div>
                          </Card>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Card size="small" style={{ borderRadius: '12px', background: '#fafafa' }} styles={{ body: { padding: '16px' } }}>
                            <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>ชื่อ</div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>{user?.firstName || '-'}</div>
                          </Card>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Card size="small" style={{ borderRadius: '12px', background: '#fafafa' }} styles={{ body: { padding: '16px' } }}>
                            <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>นามสกุล</div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>{user?.lastName || '-'}</div>
                          </Card>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card
                      title="การติดต่อ"
                      style={{ borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', height: '100%' }}
                    >
                      <div style={{
                        background: '#f5faff',
                        border: '1px solid #d6e4ff',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>เบอร์โทรปัจจุบัน</div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#0050b3', lineHeight: 1.2 }}>{user?.phone || '-'}</div>
                      </div>
                      <div style={{ color: '#8c8c8c', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
                        หากต้องการเปลี่ยนเบอร์โทร สามารถกดปุ่มด้านล่างเพื่อเปิดหน้าต่างแก้ไขได้ทันที
                      </div>
                      <Button type="primary" block icon={<EditOutlined />} onClick={handleEditProfile}>
                        แก้ไขเบอร์โทร
                      </Button>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Card>
          </div>
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

          <Modal
            title="เพิ่มลูกค้าใหม่"
            open={isAddCustomerModalVisible}
            onCancel={() => {
              setIsAddCustomerModalVisible(false);
              addCustomerForm.resetFields();
            }}
            footer={null}
            width={700}
            destroyOnHidden
          >
            <Form
              form={addCustomerForm}
              layout="vertical"
              onFinish={handleAddCustomer}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
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
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="firstName"
                    label={<span>ชื่อ <Text type="danger">*</Text></span>}
                    rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}
                  >
                    <Input placeholder="ชื่อจริง" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="lastName"
                    label={<span>นามสกุล <Text type="danger">*</Text></span>}
                    rules={[{ required: true, message: 'กรุณากรอกนามสกุล' }]}
                  >
                    <Input placeholder="นามสกุล" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="email"
                label="อีเมล"
                rules={[{ type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }]}
              >
                <Input placeholder="example@email.com" />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
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
                <Col xs={24} sm={12}>
                  <Form.Item name="projectId" label="ชื่อโครงการ">
                    <Select
                      placeholder="เลือกโครงการ"
                      loading={projectsLoading}
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      allowClear
                    >
                      {projects.map(project => (
                        <Select.Option key={project.id} value={project.id}>
                          {project.name || project.projectName}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
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
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="productTypeIds"
                    label="Product Type"
                  >
                    <Select
                      mode="multiple"
                      placeholder="เลือกประเภทสินค้า"
                      allowClear
                      loading={productTypesLoading}
                      optionFilterProp="children"
                      showSearch
                    >
                      {productTypes.map((productType) => (
                        <Select.Option key={productType.id} value={productType.id}>
                          {productType.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="idCard"
                label={<span>เลขประจำตัวประชาชน <Text type="danger">*</Text></span>}
                rules={[
                  { required: true, message: 'กรุณากรอกหมายเลขบัตรประชาชน' },
                  { len: 13, message: 'หมายเลขบัตรประชาชนต้องมี 13 หลัก' },
                  { pattern: /^[0-9]+$/, message: 'หมายเลขบัตรประชาชนควรเป็นตัวเลขเท่านั้น' }
                ]}
              >
                <Input placeholder="1234567890123" maxLength={13} />
              </Form.Item>

              <Form.Item name="address" label="ที่อยู่">
                <Input.TextArea rows={3} placeholder="ที่อยู่สำหรับติดต่อ" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button
                    onClick={() => {
                      setIsAddCustomerModalVisible(false);
                      addCustomerForm.resetFields();
                    }}
                  >
                    ยกเลิก
                  </Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    เพิ่ม
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="แก้ไขเบอร์โทร"
            open={isEditingProfile}
            onCancel={handleCancelEdit}
            footer={null}
            width={560}
            destroyOnHidden
          >
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleUpdateProfile}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="รหัสเอเจนต์">
                    <Input value={user?.agentCode} disabled />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="อีเมล">
                    <Input value={user?.email} disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="ชื่อ">
                    <Input value={user?.firstName} disabled />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="นามสกุล">
                    <Input value={user?.lastName} disabled />
                  </Form.Item>
                </Col>
              </Row>

              <div
                style={{
                  background: '#fafafa',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  color: '#8c8c8c',
                  fontSize: '13px'
                }}
              >
                ชื่อ นามสกุล และอีเมลแก้ไขจากหน้านี้ไม่ได้ หากต้องการเปลี่ยนข้อมูลดังกล่าวให้ติดต่อผู้ดูแลระบบ
              </div>

              <Form.Item
                name="phone"
                label="เบอร์โทร"
                rules={[
                  { required: true, message: 'กรุณากรอกเบอร์โทร' },
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
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AgentDashboard;
