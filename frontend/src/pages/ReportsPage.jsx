import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Statistic,
  Space,
  Typography,
  Spin,
  Tag,
  notification
} from 'antd';
import {
  DownloadOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  ProjectOutlined,
  ExpandAltOutlined,
  ShrinkOutlined
} from '@ant-design/icons';
import { agentsAPI, customersAPI, projectsAPI } from '../services/api';

const { Title, Text } = Typography;

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Fetch all data with large limit to get everything
      const [agentsRes, customersRes, projectsRes] = await Promise.all([
        agentsAPI.getAll({ limit: 10000 }),
        customersAPI.getAll({ limit: 10000 }),
        projectsAPI.getAll({ limit: 10000 })
      ]);

      if (agentsRes.data) setAgents(agentsRes.data);
      if (customersRes.data) setCustomers(customersRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถดึงข้อมูลรายงานได้'
      });
    } finally {
      setLoading(false);
    }
  };

  // Prepare agent data with customers and projects
  const agentData = agents.map(agent => {
    // Support both camelCase (agentId) and snake_case (agent_id) field names
    const agentCustomers = customers.filter(c =>
      c.agentId === agent.id || c.agent_id === agent.id
    );
    const customerProjects = [...new Set(agentCustomers.map(c =>
      c.projectId || c.project_id
    ).filter(Boolean))];

    const mappedProjects = customerProjects.map(projectId =>
      projects.find(p => p.id === projectId)
    ).filter(Boolean);

    return {
      key: agent.id,
      agentCode: agent.agentCode,
      name: `${agent.firstName} ${agent.lastName}`,
      customerCount: agentCustomers.length,
      projectCount: customerProjects.length,
      customers: agentCustomers,
      projects: mappedProjects
    };
  });

  // Export to CSV
  const exportToCSV = () => {
    try {
      // CSV Header
      const headers = ['รหัสเอเจนต์', 'ชื่อเอเจนต์', 'จำนวนลูกค้า', 'จำนวนโครงการ', 'รายชื่อลูกค้า', 'โครงการที่ดูแล'];

      // CSV Rows
      const rows = agentData.map(agent => {
        const customerNames = agent.customers.map(c => `${c.firstName} ${c.lastName}`).join('; ');
        const projectNames = agent.projects.map(p => p?.name || p?.projectName || 'ไม่ระบุชื่อ').join('; ');

        return [
          agent.agentCode,
          agent.name,
          agent.customerCount,
          agent.projectCount,
          customerNames || '-',
          projectNames || '-'
        ];
      });

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Add BOM for Thai characters
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

      // Download
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `รายงาน_SENA_Agent_${new Date().toLocaleDateString('th-TH')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notification.success({
        message: 'สำเร็จ',
        description: 'ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว'
      });
    } catch (error) {
      console.error('Export CSV error:', error);
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถ Export ไฟล์ CSV ได้'
      });
    }
  };

  // Table columns
  const columns = [
    {
      title: 'รหัสเอเจนต์',
      dataIndex: 'agentCode',
      key: 'agentCode',
      width: 120,
      render: (text) => <Text strong style={{ color: '#00BCD4' }}>{text}</Text>
    },
    {
      title: 'ชื่อเอเจนต์',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: 'จำนวนลูกค้า',
      dataIndex: 'customerCount',
      key: 'customerCount',
      width: 120,
      align: 'center',
      render: (count) => (
        <Tag color={count > 0 ? 'green' : 'default'} style={{ fontSize: '14px', padding: '4px 12px' }}>
          {count} คน
        </Tag>
      )
    },
    {
      title: 'จำนวนโครงการ',
      dataIndex: 'projectCount',
      key: 'projectCount',
      width: 120,
      align: 'center',
      render: (count) => (
        <Tag color={count > 0 ? 'blue' : 'default'} style={{ fontSize: '14px', padding: '4px 12px' }}>
          {count} โครงการ
        </Tag>
      )
    }
  ];

  // Expanded row render
  const expandedRowRender = (record) => {
    return (
      <div style={{ padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card
              title={<Text strong>รายชื่อลูกค้า ({record.customerCount} คน)</Text>}
              size="small"
              style={{ borderLeft: '3px solid #52c41a' }}
            >
              {record.customers.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {record.customers.map((customer, idx) => (
                    <li key={idx} style={{ marginBottom: '8px' }}>
                      <Text>{customer.firstName} {customer.lastName}</Text>
                      <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                        ({customer.phone})
                      </Text>
                    </li>
                  ))}
                </ul>
              ) : (
                <Text type="secondary">ยังไม่มีลูกค้า</Text>
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card
              title={<Text strong>โครงการที่ดูแล ({record.projectCount} โครงการ)</Text>}
              size="small"
              style={{ borderLeft: '3px solid #1890ff' }}
            >
              {record.projects.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {record.projects.map((project, idx) => (
                    <li key={idx} style={{ marginBottom: '8px' }}>
                      <Text>{project?.name || project?.projectName || 'ไม่ระบุชื่อ'}</Text>
                      {project?.type && (
                        <Tag color="blue" style={{ marginLeft: '8px', fontSize: '11px' }}>
                          {project.type}
                        </Tag>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <Text type="secondary">ยังไม่มีโครงการ</Text>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0, color: '#2c3e50' }}>
          📊 รายงานสรุป
        </Title>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={exportToCSV}
          size="large"
          style={{
            background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)'
          }}
        >
          ดาวน์โหลด CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8}>
            <Card
              style={{
                background: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 188, 212, 0.2)'
              }}
            >
              <Statistic
                title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>จำนวนเอเจนต์</Text>}
                value={agents.length}
                prefix={<TeamOutlined />}
                suffix="คน"
                valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              style={{
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(82, 196, 26, 0.2)'
              }}
            >
              <Statistic
                title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>จำนวนลูกค้า</Text>}
                value={customers.length}
                prefix={<UsergroupAddOutlined />}
                suffix="คน"
                valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              style={{
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.2)'
              }}
            >
              <Statistic
                title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>จำนวนโครงการ</Text>}
                value={projects.length}
                prefix={<ProjectOutlined />}
                suffix="โครงการ"
                valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: 600 }}
              />
            </Card>
          </Col>
        </Row>

        {/* Detail Table */}
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong style={{ fontSize: '18px', color: '#2c3e50' }}>
                รายละเอียดเอเจนต์และลูกค้า
              </Text>
              <Space>
                <Button
                  size="small"
                  icon={<ExpandAltOutlined />}
                  onClick={() => setExpandedRowKeys(agentData.map(a => a.key))}
                >
                  ขยายทั้งหมด
                </Button>
                <Button
                  size="small"
                  icon={<ShrinkOutlined />}
                  onClick={() => setExpandedRowKeys([])}
                >
                  ย่อทั้งหมด
                </Button>
              </Space>
            </div>
          }
          style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          <Table
            columns={columns}
            dataSource={agentData}
            expandable={{
              expandedRowRender,
              expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys)
            }}
            pagination={{
              defaultPageSize: 50,
              showTotal: (total) => `ทั้งหมด ${total} รายการ`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
            bordered
          />
        </Card>
      </Spin>
    </div>
  );
};

export default ReportsPage;
