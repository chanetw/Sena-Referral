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
  CloseOutlined,
  CopyOutlined
} from '@ant-design/icons';
import {
  fetchAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  setFilters
} from '../../store/agentsSlice';
import { agentsAPI } from '../../services/api';

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

  const formatThaiDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAgentTypeDetailItems = (agent) => {
    const typeDetail = agent?.typeDetail || {};
    return [
      { label: 'รหัสอ้างอิง/รหัสแนะนำจากแหล่งที่มา', value: typeDetail.referralCode },
      { label: 'บ้านเลขที่', value: typeDetail.houseNumber },
      { label: 'โครงการที่พักอาศัย', value: typeDetail.residenceProject?.projectName },
      { label: 'หน่วยงาน', value: typeDetail.department },
      { label: 'ฝ่าย/แผนก', value: typeDetail.division },
      { label: 'ชื่อบริษัท', value: typeDetail.companyName },
      { label: 'อาชีพ', value: typeDetail.occupation },
      { label: 'รู้จัก SENA จาก', value: typeDetail.knowSenaFrom }
    ].filter((item) => item.value !== null && item.value !== undefined && String(item.value).trim() !== '');
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

  const copyToClipboard = async (value, successMessage) => {
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

  const renderAgentDetailContent = (agent) => {
    const agentName = [agent.firstName, agent.lastName].filter(Boolean).join(' ') || '-';
    const initials = `${agent.firstName?.charAt(0) || ''}${agent.lastName?.charAt(0) || ''}`.toUpperCase() || 'AG';
    const agentEmail = agent.User?.email || agent.email || '-';
    const typeDetailItems = getAgentTypeDetailItems(agent);

    const summaryCodeItems = [
      {
        label: 'รหัสเอเจนต์',
        value: agent.agentCode || `#${agent.id || 'N/A'}`,
        color: '#52c41a',
        background: '#f6ffed',
        border: '#b7eb8f',
        copyMessage: 'คัดลอกรหัสเอเจนต์แล้ว'
      },
      {
        label: 'รหัสแนะนำ',
        value: agent.refCode || '-',
        color: '#1677ff',
        background: '#e6f4ff',
        border: '#91caff',
        copyMessage: 'คัดลอกรหัสแนะนำแล้ว'
      }
    ];

    const primaryDetails = [
      { label: 'อีเมล', value: agentEmail, icon: <MailOutlined style={{ color: '#1677ff' }} /> },
      { label: 'เบอร์โทร', value: agent.phone || '-', icon: <PhoneOutlined style={{ color: '#13c2c2' }} /> },
      { label: 'เลขประจำตัวประชาชน', value: agent.idCard || agent.agentIdCard || '-', icon: <IdcardOutlined style={{ color: '#722ed1' }} /> },
      { label: 'วันที่ลงทะเบียน', value: formatThaiDate(agent.registrationDate), icon: <ClockCircleOutlined style={{ color: '#fa8c16' }} /> }
    ];

    return (
      <div>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '20px',
            padding: '20px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #f6ffed 0%, #f0f5ff 100%)',
            border: '1px solid #d9f7be'
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'rgba(22, 119, 255, 0.08)',
              top: '-60px',
              right: '-40px'
            }}
          />
          <Row gutter={[20, 20]} align="middle" style={{ position: 'relative' }}>
            <Col xs={24} md={13}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #52c41a 0%, #1677ff 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 700,
                    boxShadow: '0 10px 24px rgba(22, 119, 255, 0.18)'
                  }}
                >
                  {initials}
                </div>
                <div>
                  <Text style={{ color: '#8c8c8c', fontSize: '12px', letterSpacing: '0.08em' }}>
                    AGENT PROFILE
                  </Text>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#1f1f1f', lineHeight: 1.2, marginTop: '4px' }}>
                    {agentName}
                  </div>
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {agent.status ? getStatusTag(agent.status) : <Tag>ไม่ระบุ</Tag>}
                    {agent.agentType?.nameTh ? <Tag color="geekblue">{agent.agentType.nameTh}</Tag> : null}
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} md={11}>
              <div style={{ display: 'grid', gap: '10px' }}>
                {summaryCodeItems.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      background: item.background,
                      border: `1px solid ${item.border}`
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: item.color, letterSpacing: '0.04em' }}>
                        {item.value}
                      </div>
                    </div>
                    {item.value !== '-' ? (
                      <Tooltip title="คัดลอก">
                        <Button
                          type="text"
                          icon={<CopyOutlined />}
                          onClick={() => copyToClipboard(item.value, item.copyMessage)}
                          style={{ color: item.color }}
                        />
                      </Tooltip>
                    ) : null}
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card
              size="small"
              title={<Text strong style={{ fontSize: '15px' }}>ข้อมูลติดต่อและตัวตน</Text>}
              style={{ borderRadius: '16px', boxShadow: '0 6px 18px rgba(0,0,0,0.04)' }}
            >
              <div style={{ display: 'grid', gap: '12px' }}>
                {primaryDetails.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: '#fafafa'
                    }}
                  >
                    <div style={{ fontSize: '16px', lineHeight: 1.2, marginTop: '2px' }}>{item.icon}</div>
                    <div>
                      <Text style={{ display: 'block', color: '#8c8c8c', fontSize: '12px' }}>{item.label}</Text>
                      <Text strong style={{ fontSize: '15px', color: '#262626', wordBreak: 'break-word' }}>{item.value}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              size="small"
              title={<Text strong style={{ fontSize: '15px' }}>ประเภทเอเจนต์</Text>}
              style={{ borderRadius: '16px', boxShadow: '0 6px 18px rgba(0,0,0,0.04)', height: '100%' }}
            >
              {agent.agentType?.nameTh ? (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #f0f5ff 0%, #f9f0ff 100%)',
                    border: '1px solid #d6e4ff'
                  }}
                >
                  <Text style={{ display: 'block', color: '#8c8c8c', fontSize: '12px' }}>ประเภทที่เลือก</Text>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#1d39c4', marginTop: '4px' }}>
                    {agent.agentType.nameTh}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '14px 16px', borderRadius: '14px', background: '#fafafa' }}>
                  <Text type="secondary">-</Text>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24}>
            <Card
              size="small"
              title={<Text strong style={{ fontSize: '15px' }}>รายละเอียดตามประเภทเอเจนต์</Text>}
              style={{ borderRadius: '16px', boxShadow: '0 6px 18px rgba(0,0,0,0.04)' }}
            >
              {typeDetailItems.length > 0 ? (
                <Row gutter={[12, 12]}>
                  {typeDetailItems.map((item) => (
                    <Col xs={24} md={12} key={item.label}>
                      <div
                        style={{
                          height: '100%',
                          padding: '12px 14px',
                          borderRadius: '14px',
                          border: '1px solid #f0f0f0',
                          background: '#fff'
                        }}
                      >
                        <Text style={{ display: 'block', color: '#8c8c8c', fontSize: '12px', marginBottom: '6px' }}>
                          {item.label}
                        </Text>
                        <Text strong style={{ fontSize: '15px', color: '#262626', wordBreak: 'break-word' }}>
                          {item.value}
                        </Text>
                      </div>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    borderRadius: '14px',
                    background: '#fafafa',
                    color: '#8c8c8c'
                  }}
                >
                  ยังไม่มีรายละเอียดเพิ่มเติมสำหรับประเภทเอเจนต์นี้
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    );
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
      title: 'รหัสแนะนำ',
      dataIndex: 'refCode',
      key: 'refCode',
      width: 130,
      render: (text) => text ? (
        <Space size={4}>
          <span style={{
            fontFamily: 'monospace',
            fontWeight: 600,
            fontSize: '13px',
            color: '#1677ff',
            background: '#e6f4ff',
            border: '1px solid #91caff',
            borderRadius: '6px',
            padding: '3px 8px',
            letterSpacing: '1px'
          }}>{text}</span>
          <Tooltip title="คัดลอก">
            <CopyOutlined
              style={{ color: '#8c8c8c', cursor: 'pointer', fontSize: '12px' }}
              onClick={() => {
                navigator.clipboard.writeText(text);
                notification.success({ message: 'คัดลอกรหัสแนะนำแล้ว', duration: 1.5 });
              }}
            />
          </Tooltip>
        </Space>
      ) : <span style={{ color: '#bfbfbf' }}>-</span>
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
      title: 'เลขบัตรประชาชน',
      key: 'idCard',
      width: 170,
      render: (_, record) => {
        const idCard = record.agentIdCard || record.idCard;
        return idCard ? (
          <Space>
            <IdcardOutlined />
            <span>{idCard}</span>
          </Space>
        ) : '-';
      }
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
              placeholder="ค้นหาด้วยชื่อ, รหัสเอเจนต์, เบอร์โทร, หรือเลขบัตรประชาชน"
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
        width={760}
        styles={{ body: { padding: '20px' } }}
        destroyOnClose={true}
      >
        {selectedAgent ? (
          renderAgentDetailContent(selectedAgent)
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