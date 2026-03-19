import { useState, useEffect } from 'react';
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
  Spin,
  List,
  Modal
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  ProjectOutlined,
  BarChartOutlined,
  SettingOutlined,
  BellOutlined,
  ClockCircleOutlined,
  EditOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../store/authSlice';
import { dashboardAPI } from '../services/api';
import AgentManagementNew from './AgentManagementNew';
import CustomerManagement from './CustomerManagement';
import ProjectManagement from './ProjectManagement';
import ReportsPage from './ReportsPage';
import StatisticsBarChart from '../components/charts/StatisticsBarChart';
import CustomerStatusPieChart from '../components/charts/CustomerStatusPieChart';
import TrendLineChart from '../components/charts/TrendLineChart';
import PerformanceAreaChart from '../components/charts/PerformanceAreaChart';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState({
    totalAgents: 0,
    pendingAgents: 0,
    activeAgents: 0,
    totalCustomers: 0,
    newCustomers: 0,
    pendingCustomers: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await dashboardAPI.getStats();

      // API returns nested structure: data.agents.total, data.customers.total
      if (response.data) {
        setDashboardStats({
          totalAgents: response.data.agents.total,
          pendingAgents: response.data.agents.pending,
          activeAgents: response.data.agents.active,
          totalCustomers: response.data.customers.total,
          newCustomers: response.data.customers.new,
          pendingCustomers: 0 // Not in current API
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await dashboardAPI.getRecentActivities();

      if (response.data) {
        setRecentActivities(response.data);

        // Calculate unread count
        const lastReadTimestamp = localStorage.getItem('lastReadNotification');
        if (lastReadTimestamp) {
          const unread = response.data.filter(activity =>
            new Date(activity.timestamp).getTime() > parseInt(lastReadTimestamp)
          ).length;
          setUnreadCount(unread);
        } else {
          // ถ้ายังไม่เคยอ่าน แสดงทั้งหมด
          setUnreadCount(response.data.length);
        }
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleNotificationClick = () => {
    setNotificationModalVisible(true);
    // บันทึกเวลาที่อ่าน
    localStorage.setItem('lastReadNotification', Date.now().toString());
    // รีเซ็ต unread count
    setUnreadCount(0);
  };

  useEffect(() => {
    if (selectedMenu === 'dashboard') {
      fetchDashboardStats();
      fetchRecentActivities();
    }
  }, [selectedMenu]);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'โปรไฟล์',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'ตั้งค่า',
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
      key: 'agents',
      icon: <TeamOutlined />,
      label: 'จัดการเอเจนต์',
    },
    {
      key: 'customers',
      icon: <UsergroupAddOutlined />,
      label: 'จัดการลูกค้า',
    },
    {
      key: 'projects',
      icon: <ProjectOutlined />,
      label: 'จัดการโครงการ',
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'รายงาน',
    },
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return (
          <div>
            {/* Charts Section - ย้ายมาด้านบนสุด */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={24} lg={12}>
                <StatisticsBarChart data={dashboardStats} title="สถิติรวม" />
              </Col>
              <Col xs={24} lg={12}>
                <CustomerStatusPieChart data={dashboardStats} title="สัดส่วนสถานะลูกค้า" />
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={24} lg={12}>
                <div style={{ position: 'relative' }}>
                  <TrendLineChart data={dashboardStats} title="แนวโน้มรายเดือน" />
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'linear-gradient(135deg, #FFA726 0%, #F57C00 100%)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(255, 167, 38, 0.3)',
                    zIndex: 10
                  }}>
                    Mockup Data
                  </div>
                </div>
              </Col>
              <Col xs={24} lg={12}>
                <div style={{ position: 'relative' }}>
                  <PerformanceAreaChart data={dashboardStats} title="ผลงานรายสัปดาห์" />
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'linear-gradient(135deg, #FFA726 0%, #F57C00 100%)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(255, 167, 38, 0.3)',
                    zIndex: 10
                  }}>
                    Mockup Data
                  </div>
                </div>
              </Col>
            </Row>

            {/* Statistics Cards - SENA Brand Gradient Style */}
            <Spin spinning={statsLoading}>
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{
                      background: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0, 188, 212, 0.2)',
                      transition: 'all 0.3s ease'
                    }}
                    styles={{ body: { padding: '24px' } }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 188, 212, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 188, 212, 0.2)';
                    }}
                  >
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 500 }}>เอเจนต์ทั้งหมด</span>}
                      value={dashboardStats.totalAgents}
                      valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 600 }}
                      prefix={<TeamOutlined style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }} />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{
                      background: 'linear-gradient(135deg, #FFA726 0%, #F57C00 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(255, 167, 38, 0.2)',
                      transition: 'all 0.3s ease'
                    }}
                    styles={{ body: { padding: '24px' } }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 167, 38, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 167, 38, 0.2)';
                    }}
                  >
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 500 }}>เอเจนต์รออนุมัติ</span>}
                      value={dashboardStats.pendingAgents}
                      valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 600 }}
                      prefix={<ClockCircleOutlined style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }} />}
                    />
                    <div style={{ marginTop: '12px' }}>
                      <Button
                        type="text"
                        size="small"
                        onClick={() => setSelectedMenu('agents')}
                        style={{
                          color: '#fff',
                          padding: 0,
                          height: 'auto',
                          fontWeight: 500,
                          fontSize: '13px'
                        }}
                      >
                        ดูรายละเอียด →
                      </Button>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{
                      background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(82, 196, 26, 0.2)',
                      transition: 'all 0.3s ease'
                    }}
                    styles={{ body: { padding: '24px' } }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(82, 196, 26, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(82, 196, 26, 0.2)';
                    }}
                  >
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 500 }}>เอเจนต์ที่อนุมัติแล้ว</span>}
                      value={dashboardStats.activeAgents}
                      valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 600 }}
                      prefix={<UserOutlined style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }} />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    style={{
                      background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(114, 46, 209, 0.2)',
                      transition: 'all 0.3s ease'
                    }}
                    styles={{ body: { padding: '24px' } }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(114, 46, 209, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(114, 46, 209, 0.2)';
                    }}
                  >
                    <Statistic
                      title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 500 }}>ลูกค้าทั้งหมด</span>}
                      value={dashboardStats.totalCustomers}
                      valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 600 }}
                      prefix={<UsergroupAddOutlined style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)' }} />}
                    />
                    <div style={{ marginTop: '12px' }}>
                      <Button
                        type="text"
                        size="small"
                        onClick={() => setSelectedMenu('customers')}
                        style={{
                          color: '#fff',
                          padding: 0,
                          height: 'auto',
                          fontWeight: 500,
                          fontSize: '13px'
                        }}
                      >
                        ดูรายละเอียด →
                      </Button>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Spin>

            <Card
              title="กิจกรรมล่าสุด"
              style={{ marginBottom: '24px' }}
              extra={
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    fetchRecentActivities();
                  }}
                >
                  รีเฟรช
                </Button>
              }
            >
              <Spin spinning={activitiesLoading}>
                {recentActivities.length > 0 ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={recentActivities}
                    renderItem={(activity) => {
                      const getActivityIcon = (iconType) => {
                        switch (iconType) {
                          case 'user':
                            return activity.action === 'created' ? <PlusOutlined /> : <EditOutlined />;
                          case 'team':
                            return activity.action === 'created' ? <PlusOutlined /> : <EditOutlined />;
                          default:
                            return <ClockCircleOutlined />;
                        }
                      };

                      const getActivityColor = (action) => {
                        return action === 'created' ? '#52c41a' : '#1890ff';
                      };

                      return (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              <Avatar
                                icon={getActivityIcon(activity.icon)}
                                style={{
                                  backgroundColor: getActivityColor(activity.action),
                                  color: 'white'
                                }}
                                size="small"
                              />
                            }
                            title={
                              <Text strong style={{ fontSize: '14px' }}>
                                {activity.title}
                              </Text>
                            }
                            description={
                              <div>
                                <Text type="secondary" style={{ fontSize: '13px' }}>
                                  {activity.description}
                                </Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  <ClockCircleOutlined style={{ marginRight: '4px' }} />
                                  {new Date(activity.timestamp).toLocaleString('th-TH', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Text>
                              </div>
                            }
                          />
                        </List.Item>
                      );
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <ClockCircleOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                    <br />
                    <Text type="secondary">ยังไม่มีกิจกรรมล่าสุด</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      เมื่อคุณเพิ่มหรือแก้ไขข้อมูลจะแสดงที่นี่
                    </Text>
                  </div>
                )}
              </Spin>
            </Card>
          </div>
        );
      case 'agents':
        return <AgentManagementNew />;
      case 'customers':
        return <CustomerManagement />;
      case 'projects':
        return <ProjectManagement />;
      case 'reports':
        return <ReportsPage />;
      default:
        return null;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{
          height: '64px',
          padding: '16px',
          background: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : 10,
          boxShadow: '0 2px 8px rgba(0, 188, 212, 0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <img
            src="/sena-logo.png"
            alt="SENA"
            style={{
              width: collapsed ? 32 : 32,
              height: 32,
              objectFit: 'contain',
              transition: 'all 0.3s ease'
            }}
          />
          {!collapsed && (
            <Title level={4} style={{
              color: 'white',
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              SENA Agent
            </Title>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenu]}
          items={menuItems}
          onSelect={({ key }) => setSelectedMenu(key)}
          style={{
            background: 'transparent',
            border: 'none',
            marginTop: '8px'
          }}
          styles={{
            item: {
              color: 'rgba(255,255,255,0.85)',
              fontSize: '15px',
              fontWeight: 500,
              margin: '4px 8px',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
            }
          }}
          className="sena-sidebar-menu"
        />
      </Sider>
      
      <Layout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
                color: '#00BCD4',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 188, 212, 0.1)';
                e.currentTarget.style.color = '#0097A7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#00BCD4';
              }}
            />
          </Space>

          <Space size="large">
            <Badge
              count={unreadCount}
              style={{
                background: 'linear-gradient(135deg, #FFA726 0%, #F57C00 100%)',
                boxShadow: '0 2px 8px rgba(255, 167, 38, 0.3)'
              }}
            >
              <Button
                type="text"
                icon={<BellOutlined />}
                size="large"
                onClick={handleNotificationClick}
                style={{
                  fontSize: '20px',
                  color: '#666',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 188, 212, 0.1)';
                  e.currentTarget.style.color = '#00BCD4';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#666';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space
                style={{
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 188, 212, 0.05)';
                  e.currentTarget.style.borderColor = '#00BCD4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <Avatar
                  icon={<UserOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
                    boxShadow: '0 2px 8px rgba(0, 188, 212, 0.3)'
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong style={{ color: '#2c3e50', fontSize: '14px' }}>
                    {user?.email}
                  </Text>
                  <Text style={{ fontSize: '12px', color: '#7f8c8d' }}>
                    {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'เอเจนต์'}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{
          margin: (selectedMenu === 'agents' || selectedMenu === 'customers') ? '0' : '24px',
          padding: (selectedMenu === 'agents' || selectedMenu === 'customers') ? '0' : '24px',
          background: (selectedMenu === 'agents' || selectedMenu === 'customers') ? '#f0f2f5' : '#fff',
          borderRadius: (selectedMenu === 'agents' || selectedMenu === 'customers') ? '0' : '8px',
          minHeight: 'calc(100vh - 112px)'
        }}>
          {renderContent()}
        </Content>
      </Layout>

      {/* Notification Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BellOutlined style={{ color: '#00BCD4', fontSize: '20px' }} />
            <span>กิจกรรมล่าสุด</span>
          </div>
        }
        open={notificationModalVisible}
        onCancel={() => setNotificationModalVisible(false)}
        footer={null}
        width={600}
      >
        <Spin spinning={activitiesLoading}>
          <List
            itemLayout="horizontal"
            dataSource={recentActivities.slice(0, 5)}
            locale={{ emptyText: 'ไม่มีกิจกรรมล่าสุด' }}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: item.type === 'create'
                        ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
                        : item.type === 'update'
                        ? 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)'
                        : 'linear-gradient(135deg, #FFA726 0%, #F57C00 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '18px'
                    }}>
                      {item.type === 'create' ? <PlusOutlined /> :
                       item.type === 'update' ? <EditOutlined /> :
                       <ClockCircleOutlined />}
                    </div>
                  }
                  title={
                    <Text style={{ fontSize: '14px', fontWeight: 500 }}>
                      {item.title || item.description || item.message}
                    </Text>
                  }
                  description={
                    <div>
                      <Text style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                        {item.description || '-'}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(item.timestamp || item.createdAt).toLocaleString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Spin>
      </Modal>
    </Layout>
  );
};

export default Dashboard;
