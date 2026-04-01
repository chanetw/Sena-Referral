import React, { useState, useEffect, useRef } from 'react';
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
  Tooltip,
  Spin,
  Result
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
  CopyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  MailOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, updateUser, getCurrentUser } from '../../store/authSlice';
import { fetchCustomers, setFilters, setPagination } from '../../store/customersSlice';
import { useNavigate } from 'react-router-dom';
import { agentsAPI, projectsAPI, customersAPI, productTypesAPI } from '../../services/api';

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
  const [checkingModal, setCheckingModal] = useState({ visible: false, phase: 'checking', data: null });
  const checkingTimerRef = useRef(null);

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

  const copyProfileValue = async (value, successMessage) => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      notification.success({
        message: successMessage,
        duration: 1.5
      });
    } catch (error) {
      notification.error({
        message: 'คัดลอกไม่สำเร็จ',
        duration: 1.5
      });
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

      // Close add form and show checking animation
      setIsAddCustomerModalVisible(false);
      setCheckingModal({ visible: true, phase: 'checking', data: null });

      const startTime = Date.now();
      const data = await customersAPI.create(customerData);
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(2500 - elapsed, 0);

      // Ensure checking animation shows for at least 2.5 seconds
      checkingTimerRef.current = setTimeout(() => {
        if (data.success && data.decision) {
          setCheckingModal({ visible: true, phase: 'result', data: data });
        } else if (data.success) {
          setCheckingModal({ visible: false, phase: 'checking', data: null });
          notification.success({
            message: 'สำเร็จ',
            description: 'เพิ่มข้อมูลลูกค้าสำเร็จ'
          });
        }

        addCustomerForm.resetFields();
        dispatch(setPagination({ current: 1 }));
        dispatch(fetchCustomers({
          agentId: user.agentId,
          status: 'all',
          search: filters.search || '',
          page: 1,
          limit: pagination.pageSize || 10
        }));
        setSelectedMenu('customers');
      }, remaining);

    } catch (error) {
      setCheckingModal({ visible: false, phase: 'checking', data: null });
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถเพิ่มข้อมูลลูกค้าได้'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (checkingTimerRef.current) clearTimeout(checkingTimerRef.current);
    };
  }, []);

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
        const profileCodeCards = [
          {
            title: 'รหัสเอเจนต์',
            value: user?.agentCode || '-',
            background: 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)',
            borderColor: '#b7eb8f',
            textColor: '#52c41a',
            message: 'คัดลอกรหัสเอเจนต์แล้ว'
          },
          {
            title: 'รหัสแนะนำ',
            value: user?.refCode || '-',
            background: 'linear-gradient(135deg, #e6f4ff 0%, #ffffff 100%)',
            borderColor: '#91caff',
            textColor: '#1677ff',
            message: 'คัดลอกรหัสแนะนำแล้ว'
          }
        ];

        const identityItems = [
          {
            label: 'ชื่อ-นามสกุล',
            value: `${user?.firstName || '-'} ${user?.lastName || ''}`.trim(),
            icon: <UserOutlined style={{ color: '#13c2c2' }} />
          },
          {
            label: 'อีเมล',
            value: user?.email || '-',
            icon: <MailOutlined style={{ color: '#1677ff' }} />
          },
          {
            label: 'เบอร์โทร',
            value: user?.phone || '-',
            icon: <PhoneOutlined style={{ color: '#fa8c16' }} />
          },
          {
            label: 'บทบาท',
            value: 'เอเจนต์',
            icon: <TeamOutlined style={{ color: '#722ed1' }} />
          }
        ];

        return (
          <div>
            <div style={{ display: 'grid', gap: '24px' }}>
              <Card
                style={{
                  overflow: 'hidden',
                  border: 'none',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0,21,41,.08)'
                }}
                styles={{ body: { padding: 0 } }}
              >
                <div
                  style={{
                    position: 'relative',
                    background: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
                    color: 'white',
                    padding: '28px 24px'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      width: '220px',
                      height: '220px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.10)',
                      top: '-90px',
                      right: '-40px'
                    }}
                  />
                  <Row gutter={[24, 24]} align="middle" style={{ position: 'relative' }}>
                    <Col xs={24} lg={14}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                        <div
                          style={{
                            width: '88px',
                            height: '88px',
                            background: 'rgba(255, 255, 255, 0.20)',
                            border: '1px solid rgba(255, 255, 255, 0.28)',
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '30px',
                            fontWeight: 700,
                            backdropFilter: 'blur(6px)',
                            flexShrink: 0
                          }}
                        >
                          {(user?.firstName?.charAt(0) || '') + (user?.lastName?.charAt(0) || '')}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.88, letterSpacing: '0.08em', marginBottom: '6px' }}>AGENT PROFILE</div>
                          <div style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1.15, marginBottom: '10px' }}>
                            {user?.firstName} {user?.lastName}
                          </div>
                          <Space size={8} wrap>
                            <Tag color="green" style={{ borderRadius: '999px', paddingInline: '10px', fontWeight: 600 }}>
                              ใช้งาน
                            </Tag>
                            <Tag color="blue" style={{ borderRadius: '999px', paddingInline: '10px' }}>
                              เอเจนต์
                            </Tag>
                          </Space>
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} lg={10}>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {profileCodeCards.map((item) => (
                          <div
                            key={item.title}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              padding: '14px 16px',
                              borderRadius: '16px',
                              background: item.background,
                              border: `1px solid ${item.borderColor}`,
                              boxShadow: '0 8px 18px rgba(255,255,255,0.12)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>{item.title}</div>
                              <div style={{ fontSize: '26px', fontWeight: 700, color: item.textColor, lineHeight: 1.1, letterSpacing: '0.04em' }}>
                                {item.value}
                              </div>
                            </div>
                            {item.value !== '-' ? (
                              <Tooltip title="คัดลอก">
                                <Button
                                  type="text"
                                  icon={<CopyOutlined />}
                                  onClick={() => copyProfileValue(item.value, item.message)}
                                  style={{ color: item.textColor }}
                                />
                              </Tooltip>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card>

              <Row gutter={[16, 16]}>
                <Col xs={24} lg={16}>
                  <Card
                    title="ข้อมูลบัญชี"
                    style={{ borderRadius: '16px', boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}
                  >
                    <Row gutter={[14, 14]}>
                      {identityItems.map((item) => (
                        <Col xs={24} md={12} key={item.label}>
                          <div
                            style={{
                              height: '100%',
                              display: 'flex',
                              gap: '12px',
                              alignItems: 'flex-start',
                              padding: '14px 16px',
                              borderRadius: '14px',
                              background: '#fafafa',
                              border: '1px solid #f0f0f0'
                            }}
                          >
                            <div style={{ fontSize: '18px', marginTop: '2px' }}>{item.icon}</div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '6px' }}>{item.label}</div>
                              <div style={{ fontSize: '16px', fontWeight: 600, color: '#262626', wordBreak: 'break-word' }}>{item.value}</div>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card
                    title="การจัดการโปรไฟล์"
                    style={{ borderRadius: '16px', boxShadow: '0 6px 18px rgba(0,0,0,0.05)', height: '100%' }}
                  >
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '14px',
                        border: '1px solid #d6e4ff',
                        background: 'linear-gradient(135deg, #f5faff 0%, #ffffff 100%)',
                        marginBottom: '16px'
                      }}
                    >
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '6px' }}>ช่องทางติดต่อหลัก</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#0050b3', lineHeight: 1.2, wordBreak: 'break-word' }}>
                        {user?.phone || '-'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '8px', lineHeight: 1.6 }}>
                        อัปเดตเบอร์โทรให้เป็นปัจจุบันเพื่อให้ทีมงานและลูกค้าติดต่อได้สะดวก
                      </div>
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
                      หากต้องการแก้ไขเบอร์โทร สามารถกดปุ่มด้านล่างเพื่อเปิดฟอร์มแก้ไขได้ทันที โดยข้อมูลอื่นของบัญชีจะยังคงเดิม
                    </div>
                    <Button type="primary" block icon={<EditOutlined />} onClick={handleEditProfile}>
                      แก้ไขเบอร์โทร
                    </Button>
                  </Card>
                </Col>
              </Row>
            </div>
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

          {/* Checking Animation + Result Modal */}
          <Modal
            open={checkingModal.visible}
            footer={checkingModal.phase === 'result' ? [
              <Button key="close" type="primary" onClick={() => setCheckingModal({ visible: false, phase: 'checking', data: null })}>
                ปิด
              </Button>
            ] : null}
            closable={checkingModal.phase === 'result'}
            onCancel={() => {
              if (checkingModal.phase === 'result') {
                setCheckingModal({ visible: false, phase: 'checking', data: null });
              }
            }}
            centered
            width={480}
            maskClosable={false}
          >
            {checkingModal.phase === 'checking' && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />} />
                <div style={{ marginTop: 24 }}>
                  <Title level={4} style={{ marginBottom: 8 }}>กำลังตรวจสอบข้อมูล...</Title>
                  <Text type="secondary">ระบบกำลังตรวจสอบเลขบัตรประชาชนกับฐานข้อมูล</Text>
                </div>
              </div>
            )}
            {checkingModal.phase === 'result' && checkingModal.data?.decision && (() => {
              const { passed, reasons } = checkingModal.data.decision;
              return (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  {passed ? (
                    <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
                  ) : (
                    <CloseCircleOutlined style={{ fontSize: 64, color: '#ff4d4f' }} />
                  )}
                  <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
                    {passed ? 'ผ่านเงื่อนไข' : 'ไม่ผ่านเงื่อนไข'}
                  </Title>
                  <Text type="secondary">{checkingModal.data.message}</Text>
                  {Array.isArray(reasons) && reasons.length > 0 && (
                    <div style={{ marginTop: 16, textAlign: 'left', background: '#fafafa', borderRadius: 8, padding: 16 }}>
                      {reasons.map((r, idx) => (
                        <div key={idx} style={{ marginBottom: idx < reasons.length - 1 ? 12 : 0 }}>
                          <Text strong style={{ color: '#ff4d4f' }}>{r.message}</Text>
                          {r.existingData && (
                            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                              {r.existingData.customerCode ? `รหัส: ${r.existingData.customerCode} ` : ''}
                              {r.existingData.firstName ? `${r.existingData.firstName} ${r.existingData.lastName}` : ''}
                              {r.existingData.idCard ? ` (บัตร: ${r.existingData.idCard})` : ''}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {passed && (
                    <div style={{ marginTop: 16 }}>
                      <Text type="secondary">ระบบได้แจ้งผลทางอีเมลเรียบร้อยแล้ว</Text>
                    </div>
                  )}
                </div>
              );
            })()}
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
