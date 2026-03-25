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
  Tooltip,
  Descriptions,
  App
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
  ReloadOutlined,
  TeamOutlined,
  EyeOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleFilled
} from '@ant-design/icons';
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  fetchAgentsList,
  setFilters,
  setPagination,
  clearError
} from '../store/customersSlice';
import { projectsAPI, customersAPI, productTypesAPI } from '../services/api';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Status config: value -> { color, adminLabel, agentLabel }
const STATUS_CONFIG = {
  approved: {
    color: 'green',
    adminLabel: 'ผ่าน',
    agentLabel: 'ผู้ถูกแนะนำของท่านผ่านเงื่อนไข'
  },
  pending: {
    color: 'orange',
    adminLabel: 'รออนุมัติ',
    agentLabel: 'รอดำเนินการตรวจสอบ'
  },
  duplicate: {
    color: 'red',
    adminLabel: 'ไม่ผ่าน',
    agentLabel: 'ขออภัย ผู้ที่ท่านแนะนำซ้ำกับรายชื่อของฐานข้อมูลโครงการ'
  }
};

const getStatusTag = (status, role) => {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <Tag>{status}</Tag>;
  const label = role === 'agent' ? cfg.agentLabel : cfg.adminLabel;
  return <Tag color={cfg.color}>{label}</Tag>;
};

const CustomerManagement = () => {
  const { modal } = App.useApp();
  const dispatch = useDispatch();
  const {
    customers,
    agentsList,
    loading,
    agentsLoading,
    error,
    pagination,
    filters
  } = useSelector((state) => state.customers);

  // Role from auth store: 'admin' or 'agent'
  const currentUser = useSelector((state) => state.auth?.user);
  const isAdmin = currentUser?.role === 'admin';
  const isAgent = currentUser?.role === 'agent';
  const canCreateCustomer = isAdmin || isAgent;


  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [form] = Form.useForm();

  // States for status management modal
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [statusingCustomer, setStatusingCustomer] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // States for auto-increment customer code
  const [nextCustomerCode, setNextCustomerCode] = useState('');
  const [loadingCustomerCode, setLoadingCustomerCode] = useState(false);

  // State for projects list
  const [projectsList, setProjectsList] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [productTypes, setProductTypes] = useState([]);
  const [productTypesLoading, setProductTypesLoading] = useState(false);

  const loadCustomers = (overrides = {}) => {
    dispatch(fetchCustomers({
      page: overrides.page ?? pagination.current,
      limit: overrides.limit ?? pagination.pageSize,
      status: overrides.status ?? filters.status,
      agentId: overrides.agentId ?? filters.agentId,
      search: overrides.search ?? filters.search
    }));
  };

  // Load customers, agents and projects on component mount
  useEffect(() => {
    loadCustomers();
    dispatch(fetchAgentsList());
    fetchProjects();
    fetchProductTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const response = await projectsAPI.getAll({ page: 1, limit: 10000 });
      setProjectsList(response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchProductTypes = async () => {
    try {
      setProductTypesLoading(true);
      const response = await productTypesAPI.getAll();
      setProductTypes(response.data || []);
    } catch (error) {
      console.error('Error fetching product types:', error);
    } finally {
      setProductTypesLoading(false);
    }
  };

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

  // Handle view customer
  const handleView = (customer) => {
    setViewingCustomer(customer);
    setIsViewModalVisible(true);
  };

  // Handle open status modal (admin only)
  const handleOpenStatusModal = (customer) => {
    setStatusingCustomer(customer);
    setSelectedStatus(customer.status);
    setStatusNote('');
    setIsStatusModalVisible(true);
  };

  // Handle confirm status change
  const executeChangeStatus = async () => {
    if (!selectedStatus || !statusingCustomer) return;
    setStatusLoading(true);
    try {
      await dispatch(updateCustomer({
        id: statusingCustomer.id,
        customerData: { status: selectedStatus, ...(statusNote && { notes: statusNote }) }
      })).unwrap();
      notification.success({
        message: 'สำเร็จ',
        description: `เปลี่ยนสถานะเป็น "${STATUS_CONFIG[selectedStatus].adminLabel}" สำเร็จ`,
      });
      setIsStatusModalVisible(false);
      loadCustomers();
    } catch (error) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error || 'ไม่สามารถเปลี่ยนสถานะได้',
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!selectedStatus || !statusingCustomer) return;

    const needsConfirmation = selectedStatus === 'approved' || selectedStatus === 'duplicate';
    if (!needsConfirmation) {
      await executeChangeStatus();
      return;
    }

    modal.confirm({
      title: 'ยืนยันการเปลี่ยนสถานะลูกค้า',
      content: (
        <div>
          {selectedStatus === 'duplicate'
            ? 'กรุณาตรวจสอบข้อมูลอย่างละเอียด ก่อนกดปุ่ม "ยืนยัน" เนื่องจากจะมีข้อความส่งให้นายหน้าทันที ว่าลูกค้าไม่ผ่านเงื่อนไขตามที่ตรวจสอบแล้ว'
            : 'กรุณาตรวจสอบข้อมูลอย่างละเอียด ก่อนกดปุ่ม "ยืนยัน" เนื่องจากจะมีข้อความส่งให้นายหน้าทันที ว่าลูกค้าได้ผ่านการตรวจสอบแล้ว'
          }
        </div>
      ),
      okText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      okButtonProps: {
        danger: selectedStatus === 'duplicate'
      },
      onOk: () => executeChangeStatus()
    });
  };

  // Table columns
  const columns = [
    // Hidden: รหัสลูกค้า column - not needed in customer management view
    // {
    //   title: 'รหัสลูกค้า',
    //   dataIndex: 'customerCode',
    //   key: 'customerCode',
    //   width: 120,
    //   render: (text, record) => (
    //     <a onClick={() => handleView(record)}>
    //       <Tag color="green" style={{ cursor: 'pointer' }}>{text}</Tag>
    //     </a>
    //   )
    // },
    {
      title: 'ชื่อ-นามสกุล',
      key: 'fullName',
      width: 160,
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <span>{`${record.firstName} ${record.lastName}`}</span>
        </Space>
      )
    },
    {
      title: 'ประเภท',
      dataIndex: 'referralType',
      key: 'referralType',
      width: 110,
      render: (type) => {
        if (!type) return '-';
        return type === 'self'
          ? <Tag color="blue">แนะนำตัวเอง</Tag>
          : <Tag color="purple">แนะนำเพื่อน</Tag>;
      }
    },
    {
      title: 'อีเมล',
      dataIndex: 'email',
      key: 'email',
      width: 160,
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
      width: 115,
      render: (text) => (text && text.trim() !== '') ? (
        <Space>
          <PhoneOutlined />
          <span>{text}</span>
        </Space>
      ) : '-'
    },
    {
      title: 'ชื่อโครงการ',
      key: 'projectName',
      width: 130,
      render: (_, record) => {
        // Check if project data exists and has projectName
        if (record.project && record.project.projectName) {
          return record.project.projectName;
        }
        // Check if projectId exists and find project name from projectsList
        if (record.projectId) {
          const project = projectsList.find(p => p.id === record.projectId);
          return project ? project.projectName : `Project ID: ${record.projectId}`;
        }
        // Fallback to direct projectName field
        if (record.projectName) {
          return record.projectName;
        }
        return '-';
      }
    },
    {
      title: 'งบประมาณ',
      key: 'budget',
      width: 130,
      render: (_, record) => {
        // Check for budgetMin and budgetMax first
        if (record.budgetMin && record.budgetMax) {
          const min = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(record.budgetMin);
          const max = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(record.budgetMax);
          return (
            <div style={{ fontSize: '12px', lineHeight: '1.1' }}>
              <div>฿{min}</div>
              <div style={{ color: '#999', textAlign: 'center', fontSize: '10px' }}>-</div>
              <div>฿{max}</div>
            </div>
          );
        }
        // Fallback to single budget field
        if (record.budget && record.budget > 0) {
          const formatted = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(record.budget);
          return <span style={{ fontSize: '12px' }}>฿{formatted}</span>;
        }
        return '-';
      }
    },
    {
      title: 'Product Type',
      dataIndex: 'productTypes',
      key: 'productTypes',
      width: 150,
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
      title: 'เอเจนต์',
      key: 'agent',
      width: 130,
      render: (_, record) => {

        if (record.agent && record.agent.agentCode && record.agent.firstName) {
          return (
            <Space>
              <TeamOutlined />
              <span>{`${record.agent.agentCode} - ${record.agent.firstName}`}</span>
            </Space>
          );
        }

        // If no agent object but has agentId, show agentId
        if (record.agentId) {
          return (
            <Space>
              <TeamOutlined />
              <span>Agent ID: {record.agentId}</span>
            </Space>
          );
        }

        return '-';
      }
    },

    {
      title: 'วันที่ลงทะเบียน',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (date, record) => {
        // Try different field names
        const dateValue = date || record.createdAt || record.created_at;
        if (!dateValue) return '-';
        try {
          return new Date(dateValue).toLocaleDateString('th-TH');
        } catch (error) {
          return '-';
        }
      }
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => {
        if (isAdmin) {
          return (
            <Tooltip title="คลิกเพื่อเปลี่ยนสถานะ">
              <span
                style={{ cursor: 'pointer' }}
                onClick={() => handleOpenStatusModal(record)}
              >
                {getStatusTag(status, 'admin')}
              </span>
            </Tooltip>
          );
        }
        return getStatusTag(status, currentUser?.role);
      }
    },
    {
      title: 'การจัดการ',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="ดูรายละเอียด">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          {isAdmin && (
            <Tooltip title="แก้ไข">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {isAdmin && (
            <Tooltip title="ลบ">
              <Popconfirm
                title="ยืนยันการลบ"
                description="คุณแน่ใจหรือไม่ที่จะลบลูกค้านี้?"
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
          )}
        </Space>
      )
    }
  ];

  // Handle search
  const handleSearch = (value) => {
    const nextSearch = value || '';
    dispatch(setFilters({ search: nextSearch }));
    dispatch(setPagination({ current: 1 }));
    loadCustomers({ page: 1, search: nextSearch });
  };

  // Handle status filter
  const handleStatusFilter = (value) => {
    const nextStatus = value || 'all';
    dispatch(setFilters({ status: nextStatus }));
    dispatch(setPagination({ current: 1 }));
    loadCustomers({ page: 1, status: nextStatus });
  };

  // Handle agent filter
  const handleAgentFilter = (value) => {
    const nextAgentId = value || 'all';
    dispatch(setFilters({ agentId: nextAgentId }));
    dispatch(setPagination({ current: 1 }));
    loadCustomers({ page: 1, agentId: nextAgentId });
  };

  // Handle table change (pagination)
  const handleTableChange = (tablePagination) => {
    dispatch(setPagination({
      current: tablePagination.current,
      pageSize: tablePagination.pageSize
    }));
    loadCustomers({
      page: tablePagination.current,
      limit: tablePagination.pageSize
    });
  };

  // Fetch next customer code
  const fetchNextCustomerCode = async () => {
    try {
      setLoadingCustomerCode(true);
      const response = await customersAPI.getNextCode();
      setNextCustomerCode(response.data.nextCustomerCode);
      form.setFieldValue('customerCode', response.data.nextCustomerCode);
    } catch (error) {
      console.error('Error fetching next customer code:', error);
      // Fallback to default if API fails
      setNextCustomerCode('CU001');
      form.setFieldValue('customerCode', 'CU001');
    } finally {
      setLoadingCustomerCode(false);
    }
  };

  // Handle create new customer
  const handleCreate = () => {
    setEditingCustomer(null);
    setIsModalVisible(true);
    form.resetFields();
    if (isAgent) {
      form.setFieldValue('status', 'pending');
    }
    // Fetch next customer code for new customer
    fetchNextCustomerCode();
  };

  // Handle edit customer
  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setIsModalVisible(true);

    let budgetRange = '';
    if (customer.budgetMin !== null && customer.budgetMax !== null) {
      budgetRange = `${parseInt(customer.budgetMin)}-${parseInt(customer.budgetMax)}`;
    } else if (customer.budgetMin !== null) {
      budgetRange = `${parseInt(customer.budgetMin)}-`;
    }

    form.setFieldsValue({
      customerCode: customer.customerCode,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      projectId: customer.projectId,
      budgetRange: budgetRange,
      idCard: customer.idCard,
      address: customer.address,
      agentId: customer.agentId,
      status: customer.status,
      referralType: customer.referralType,
      productTypeIds: (customer.productTypes || []).map((productType) => productType.id),
      registrationDate: customer.registrationDate ?
        new Date(customer.registrationDate).toISOString().split('T')[0] : ''
    });
  };

  // Handle delete customer
  const handleDelete = async (id) => {
    try {
      await dispatch(deleteCustomer(id)).unwrap();
      notification.success({
        message: 'สำเร็จ',
        description: 'ลบลูกค้าสำเร็จ',
      });
      loadCustomers();
    } catch (error) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error || 'ไม่สามารถลบลูกค้าได้',
      });
    }
  };

  // Handle form submit
  const handleSubmit = async (values) => {
    try {
      const { budgetRange, ...rest } = values;
      let budgetMin = null;
      let budgetMax = null;

      if (budgetRange) {
        [budgetMin, budgetMax] = budgetRange.split('-');
        budgetMin = parseInt(budgetMin, 10);
        budgetMax = budgetMax ? parseInt(budgetMax, 10) : null;
      }

      const customerData = { ...rest, budgetMin, budgetMax };

      if (isAgent) {
        customerData.status = 'pending';
      }

      if (editingCustomer) {
        // Update existing customer
        await dispatch(updateCustomer({
          id: editingCustomer.id,
          customerData,
        })).unwrap();
        notification.success({
          message: 'สำเร็จ',
          description: 'อัพเดทข้อมูลลูกค้าสำเร็จ',
        });
      } else {
        // Create new customer
        await dispatch(createCustomer(customerData)).unwrap();
        notification.success({
          message: 'สำเร็จ',
          description: 'เพิ่มลูกค้าสำเร็จ',
        });
      }
      setIsModalVisible(false);
      form.resetFields();
      loadCustomers();
    } catch (error) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error || 'ไม่สามารถบันทึกข้อมูลได้',
      });
    }
  };

  // Handle modal cancel
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingCustomer(null);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3} style={{ margin: 0 }}>
                <UserOutlined style={{ marginRight: '8px' }} />
                จัดการลูกค้า
              </Title>
            </Col>
            <Col>
              {canCreateCustomer && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  เพิ่มลูกค้าใหม่
                </Button>
              )}
            </Col>
          </Row>
        </div>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="ค้นหาด้วยชื่อ, รหัสลูกค้า, อีเมล, หรือเบอร์โทร"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => {
                if (e.target.value === '') {
                  handleSearch('');
                }
              }}
              defaultValue={filters.search}
            />
          </Col>
          {isAdmin && (
            <Col xs={24} sm={6} md={4}>
              <Select
                style={{ width: '100%' }}
                placeholder="กรองตามสถานะ"
                allowClear
                value={filters.status}
                onChange={handleStatusFilter}
              >
                <Option value="all">ทั้งหมด</Option>
                <Option value="approved">{STATUS_CONFIG.approved.adminLabel}</Option>
                <Option value="duplicate">{STATUS_CONFIG.duplicate.adminLabel}</Option>
                <Option value="pending">{STATUS_CONFIG.pending.adminLabel}</Option>
              </Select>
            </Col>
          )}
          <Col xs={24} sm={6} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="กรองตามเอเจนต์"
              allowClear
              value={filters.agentId}
              onChange={handleAgentFilter}
              loading={agentsLoading}
            >
              <Option value="all">เอเจนต์ทั้งหมด</Option>
              {agentsList.map(agent => (
                <Option key={agent.id} value={agent.id.toString()}>
                  {agent.fullName}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
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

      {/* Customer Form Modal */}
      <Modal
        title={editingCustomer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            {/* Hidden: รหัสลูกค้า field - ไม่แสดงใน admin form
            <Col xs={24} sm={12}>
              <Form.Item
                name="customerCode"
                label={
                  !editingCustomer ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      รหัสลูกค้า
                      <Button
                        type="text"
                        size="small"
                        icon={<ReloadOutlined />}
                        onClick={fetchNextCustomerCode}
                        loading={loadingCustomerCode}
                        title="สร้างรหัสใหม่"
                        style={{ padding: '0 4px', height: '20px', minWidth: '20px' }}
                      />
                    </div>
                  ) : 'รหัสลูกค้า'
                }
                rules={[
                  { required: true, message: 'กรุณาใส่รหัสลูกค้า' },
                  { pattern: /^[A-Z0-9]+$/, message: 'รหัสลูกค้าควรเป็นตัวอักษรพิมพ์ใหญ่และตัวเลขเท่านั้น' }
                ]}
              >
                <Input
                  placeholder={loadingCustomerCode ? "กำลังโหลด..." : nextCustomerCode || "เช่น CU001"}
                  disabled={!editingCustomer}
                  style={!editingCustomer ? {
                    backgroundColor: '#f0f8ff',
                    border: '1px solid #1890ff',
                    color: '#1890ff',
                    fontWeight: 'bold'
                  } : {}}
                />
                {!editingCustomer && (
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    💡 รหัสลูกค้าถูกสร้างโดยอัตโนมัติจากข้อมูลล่าสุดในระบบ
                  </div>
                )}
              </Form.Item>
            </Col>
            */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="referralType"
                label="ประเภทลูกค้า"
                rules={[{ required: true, message: 'กรุณาเลือกประเภทลูกค้า' }]}
              >
                <Select placeholder="เลือกประเภทลูกค้า">
                  <Option value="self">แนะนำตัวเอง</Option>
                  <Option value="friend">แนะนำเพื่อน</Option>
                </Select>
              </Form.Item>
            </Col>
            {isAdmin && (
              <Col xs={24} sm={12}>
                <Form.Item
                  name="status"
                  label="สถานะ"
                  rules={[{ required: true, message: 'กรุณาเลือกสถานะ' }]}
                >
                  <Select placeholder="เลือกสถานะ">
                    <Option value="approved">{STATUS_CONFIG.approved.adminLabel}</Option>
                    <Option value="duplicate">{STATUS_CONFIG.duplicate.adminLabel}</Option>
                    <Option value="pending">{STATUS_CONFIG.pending.adminLabel}</Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
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
              { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }
            ]}
          >
            <Input 
              placeholder="example@email.com" 
              disabled={!!editingCustomer}
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
              >
                <Input placeholder="081-234-5678" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="projectId"
                label="ชื่อโครงการ"
              >
                <Select
                  placeholder="เลือกโครงการ"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  allowClear
                  loading={projectsLoading}
                >
                  {projectsList
                    .filter(project => project.isActive === true)
                    .map(project => (
                      <Option key={project.id} value={project.id}>
                        {project.projectName}
                      </Option>
                    ))
                  }
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="budgetRange"
                label="งบประมาณ"
              >
                <Select placeholder="เลือกงบประมาณ">
                  <Option value="0-1000000">ต่ำกว่า 1 ล้านบาท</Option>
                  <Option value="1000000-2000000">1-2 ล้านบาท</Option>
                  <Option value="2000000-3000000">2-3 ล้านบาท</Option>
                  <Option value="4000000-5000000">4-5 ล้านบาท</Option>
                  <Option value="5000000-">มากกว่า 5 ล้านบาท</Option>
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
                    <Option key={productType.id} value={productType.id}>
                      {productType.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="idCard"
            label="เลขประจำตัวประชาชน"
            rules={[
              { required: true, message: 'กรุณาใส่เลขประจำตัวประชาชน' },
              { len: 13, message: 'เลขประจำตัวประชาชนต้องมี 13 หลัก' },
              { pattern: /^[0-9]+$/, message: 'เลขประจำตัวประชาชนควรเป็นตัวเลขเท่านั้น' }
            ]}
          >
            <Input 
              placeholder="1234567890123" 
              maxLength={13}
              disabled={!!editingCustomer}
            />
          </Form.Item>

          <Form.Item
            name="agentId"
            label="เอเจนต์ที่รับผิดชอบ"
            rules={[{ required: true, message: 'กรุณาเลือกเอเจนต์' }]}
          >
            <Select 
              placeholder="เลือกเอเจนต์"
              loading={agentsLoading}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {agentsList.map(agent => (
                <Option key={agent.id} value={agent.id}>
                  {agent.fullName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="address"
            label="ที่อยู่"
          >
            <TextArea 
              rows={3}
              placeholder="ที่อยู่สำหรับติดต่อ"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>
                ยกเลิก
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingCustomer ? 'อัพเดท' : 'เพิ่ม'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Status Management Modal */}
      <Modal
        title={
          <Space>
            <ClockCircleFilled style={{ color: '#1890ff' }} />
            <span>ประเมินสถานะลูกค้า</span>
          </Space>
        }
        open={isStatusModalVisible}
        onCancel={() => setIsStatusModalVisible(false)}
        footer={null}
        width={500}
        destroyOnHidden
      >
        {statusingCustomer && (
          <>
            {/* Customer Summary */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: 10,
              padding: '14px 16px',
              marginBottom: 20,
              border: '1px solid #e8e8e8'
            }}>
              <Space align="start">
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: '#1890ff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0
                }}>
                  <UserOutlined style={{ color: 'white', fontSize: 18 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {statusingCustomer.firstName} {statusingCustomer.lastName}
                  </div>
                  <Space size={12} style={{ marginTop: 4 }}>
                    {statusingCustomer.phone && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        <PhoneOutlined style={{ marginRight: 4 }} />{statusingCustomer.phone}
                      </Typography.Text>
                    )}
                    {statusingCustomer.agent?.agentCode && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        <TeamOutlined style={{ marginRight: 4 }} />{statusingCustomer.agent.agentCode} – {statusingCustomer.agent.firstName}
                      </Typography.Text>
                    )}
                  </Space>
                  <div style={{ marginTop: 6 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>สถานะปัจจุบัน:</Typography.Text>
                    {getStatusTag(statusingCustomer.status, 'admin')}
                  </div>
                </div>
              </Space>
            </div>

            {/* Status Cards */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 12, color: '#333' }}>เลือกสถานะใหม่</div>
              <Row gutter={12}>
                <Col span={8}>
                  <div
                    onClick={() => setSelectedStatus('approved')}
                    style={{
                      border: `2px solid ${selectedStatus === 'approved' ? '#52c41a' : '#e8e8e8'}`,
                      borderRadius: 10,
                      padding: '16px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: selectedStatus === 'approved' ? '#f6ffed' : 'white',
                      transition: 'all 0.2s',
                      boxShadow: selectedStatus === 'approved' ? '0 2px 8px rgba(82,196,26,0.2)' : 'none'
                    }}
                  >
                    <CheckCircleFilled style={{
                      fontSize: 30, color: selectedStatus === 'approved' ? '#52c41a' : '#d9d9d9',
                      marginBottom: 8, display: 'block', transition: 'all 0.2s'
                    }} />
                    <div style={{ fontWeight: 600, fontSize: 13, color: selectedStatus === 'approved' ? '#52c41a' : '#666' }}>ผ่าน</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>อนุมัติแล้ว</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div
                    onClick={() => setSelectedStatus('pending')}
                    style={{
                      border: `2px solid ${selectedStatus === 'pending' ? '#fa8c16' : '#e8e8e8'}`,
                      borderRadius: 10,
                      padding: '16px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: selectedStatus === 'pending' ? '#fff7e6' : 'white',
                      transition: 'all 0.2s',
                      boxShadow: selectedStatus === 'pending' ? '0 2px 8px rgba(250,140,22,0.2)' : 'none'
                    }}
                  >
                    <ClockCircleFilled style={{
                      fontSize: 30, color: selectedStatus === 'pending' ? '#fa8c16' : '#d9d9d9',
                      marginBottom: 8, display: 'block', transition: 'all 0.2s'
                    }} />
                    <div style={{ fontWeight: 600, fontSize: 13, color: selectedStatus === 'pending' ? '#fa8c16' : '#666' }}>รออนุมัติ</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>ยังไม่ตัดสิน</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div
                    onClick={() => setSelectedStatus('duplicate')}
                    style={{
                      border: `2px solid ${selectedStatus === 'duplicate' ? '#ff4d4f' : '#e8e8e8'}`,
                      borderRadius: 10,
                      padding: '16px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: selectedStatus === 'duplicate' ? '#fff2f0' : 'white',
                      transition: 'all 0.2s',
                      boxShadow: selectedStatus === 'duplicate' ? '0 2px 8px rgba(255,77,79,0.2)' : 'none'
                    }}
                  >
                    <CloseCircleFilled style={{
                      fontSize: 30, color: selectedStatus === 'duplicate' ? '#ff4d4f' : '#d9d9d9',
                      marginBottom: 8, display: 'block', transition: 'all 0.2s'
                    }} />
                    <div style={{ fontWeight: 600, fontSize: 13, color: selectedStatus === 'duplicate' ? '#ff4d4f' : '#666' }}>ไม่ผ่าน</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>ปฏิเสธแล้ว</div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              <Space>
                <Button onClick={() => setIsStatusModalVisible(false)}>ยกเลิก</Button>
                <Button
                  type="primary"
                  loading={statusLoading}
                  disabled={selectedStatus === statusingCustomer.status}
                  onClick={handleChangeStatus}
                  style={{
                    ...(selectedStatus === 'approved' && { background: '#52c41a', borderColor: '#52c41a' }),
                    ...(selectedStatus === 'duplicate' && { background: '#ff4d4f', borderColor: '#ff4d4f' }),
                    ...(selectedStatus === 'pending' && { background: '#fa8c16', borderColor: '#fa8c16' }),
                  }}
                >
                  ยืนยันการเปลี่ยนสถานะ
                </Button>
              </Space>
            </div>
          </>
        )}
      </Modal>

      {/* Customer View Modal */}
      <Modal
        title="รายละเอียดลูกค้า"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsViewModalVisible(false)}>
            ปิด
          </Button>,
        ]}
        width={700}
      >
        {viewingCustomer && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="รหัสลูกค้า">{viewingCustomer.customerCode}</Descriptions.Item>
            <Descriptions.Item label="สถานะ">
              {getStatusTag(viewingCustomer.status, currentUser?.role)}
            </Descriptions.Item>
            <Descriptions.Item label="ชื่อ">{viewingCustomer.firstName}</Descriptions.Item>
            <Descriptions.Item label="นามสกุล">{viewingCustomer.lastName}</Descriptions.Item>
            <Descriptions.Item label="อีเมล" span={2}>{viewingCustomer.email}</Descriptions.Item>
            <Descriptions.Item label="เบอร์โทร">{viewingCustomer.phone}</Descriptions.Item>
            <Descriptions.Item label="ชื่อโครงการ">
              {(() => {
                if (viewingCustomer.project && viewingCustomer.project.projectName) {
                  return viewingCustomer.project.projectName;
                }
                if (viewingCustomer.projectId) {
                  const project = projectsList.find(p => p.id === viewingCustomer.projectId);
                  return project ? project.projectName : `Project ID: ${viewingCustomer.projectId}`;
                }
                if (viewingCustomer.projectName) {
                  return viewingCustomer.projectName;
                }
                return '-';
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="งบประมาณ">{viewingCustomer.budget ? new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(viewingCustomer.budget) : '-'}</Descriptions.Item>
            <Descriptions.Item label="วันที่ลงทะเบียน">
              {(viewingCustomer.createdAt || viewingCustomer.created_at) ?
                new Date(viewingCustomer.createdAt || viewingCustomer.created_at).toLocaleDateString('th-TH') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="เลขประจำตัวประชาชน" span={2}>{viewingCustomer.idCard}</Descriptions.Item>
            <Descriptions.Item label="เอเจนต์ที่รับผิดชอบ" span={2}>
              {viewingCustomer.agent ? `${viewingCustomer.agent.agentCode} - ${viewingCustomer.agent.firstName}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="ที่อยู่" span={2}>{viewingCustomer.address}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default CustomerManagement;
