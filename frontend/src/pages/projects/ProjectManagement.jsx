import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Space,
  Popconfirm,
  message,
  Tooltip
} from 'antd';
import { PlusOutlined, ProjectOutlined, EditOutlined, DeleteOutlined, MailOutlined } from '@ant-design/icons';
import { projectsAPI } from '../../services/api';
import ProjectForm from './ProjectForm';

const { Title } = Typography;

const ProjectManagement = () => {
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editingProject, setEditingProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingNotificationProjectId, setTogglingNotificationProjectId] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  // Load projects from API
  useEffect(() => {
    fetchProjects(pagination.current, pagination.pageSize);
  }, [pagination.current, pagination.pageSize]);

  const fetchProjects = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAll({ page, limit });
      setProjects(response.data || []);
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
      console.error('Error fetching projects:', error);
      message.error('ไม่สามารถโหลดข้อมูลโครงการได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProject(null);
    setView('form');
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setView('form');
  };

  const handleDelete = async (projectId) => {
    try {
      await projectsAPI.delete(projectId);
      message.success('ลบโครงการสำเร็จ');
      fetchProjects(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error deleting project:', error);
      message.error('ไม่สามารถลบโครงการได้');
    }
  };

  const handleToggleNotification = async (project) => {
    try {
      setTogglingNotificationProjectId(project.id);
      const nextEnabled = !project.passEmailEnabled;
      await projectsAPI.update(project.id, {
        passEmailEnabled: nextEnabled,
        passEmailRecipients: project.passEmailRecipients
      });
      message.success(nextEnabled ? 'เปิดการแจ้งเตือนเมล์แล้ว' : 'ปิดการแจ้งเตือนเมล์แล้ว');
      fetchProjects(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error toggling project notification:', error);
      message.error(error?.response?.data?.message || 'ไม่สามารถเปลี่ยนสถานะการแจ้งเตือนได้');
    } finally {
      setTogglingNotificationProjectId(null);
    }
  };

  const renderEmailRecipients = (value) => {
    const emails = typeof value === 'string'
      ? value.split(',').map((email) => email.trim()).filter(Boolean)
      : [];

    if (emails.length === 0) {
      return '-';
    }

    return (
      <Tooltip title={emails.join(', ')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {emails.slice(0, 2).map((email) => (
            <Tag key={email} color="blue" style={{ marginRight: 0, width: 'fit-content' }}>
              {email}
            </Tag>
          ))}
          {emails.length > 2 && (
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>+{emails.length - 2} รายการ</span>
          )}
        </div>
      </Tooltip>
    );
  };

  const handleBack = () => {
    setView('list');
    setEditingProject(null);
  };

  const handleSaveProject = async (projectData) => {
    try {
      if (editingProject) {
        // Update existing project
        await projectsAPI.update(editingProject.id, projectData);
        message.success('แก้ไขโครงการสำเร็จ');
      } else {
        // Create new project
        await projectsAPI.create(projectData);
        message.success('เพิ่มโครงการสำเร็จ');
      }
      setView('list');
      setEditingProject(null);
      fetchProjects(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error saving project:', error);
      message.error(editingProject ? 'ไม่สามารถแก้ไขโครงการได้' : 'ไม่สามารถเพิ่มโครงการได้');
    }
  };

  const handleTableChange = (nextPagination) => {
    setPagination((prev) => ({
      ...prev,
      current: nextPagination.current,
      pageSize: nextPagination.pageSize,
    }));
  };

  if (view === 'form') {
    return <ProjectForm
      onBack={handleBack}
      onSave={handleSaveProject}
      editingProject={editingProject}
    />;
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      align: 'center',
      sorter: (a, b) => (a.id || 0) - (b.id || 0),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'รหัสโครงการ',
      dataIndex: 'projectCode',
      key: 'projectCode',
      width: 120,
    },
    {
      title: 'ชื่อโครงการ',
      dataIndex: 'projectName',
      key: 'projectName',
    },
    {
      title: 'ตำแหน่งที่ตั้ง',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'ราคา (บาท)',
      key: 'priceRange',
      width: 180,
      render: (_, record) => {
        if (record.priceRangeMin && record.priceRangeMax) {
          const min = new Intl.NumberFormat('th-TH').format(record.priceRangeMin);
          const max = new Intl.NumberFormat('th-TH').format(record.priceRangeMax);
          return (
            <div style={{ fontSize: '12px', lineHeight: '1.2' }}>
              <div>฿{min}</div>
              <div style={{ color: '#999', textAlign: 'center', fontSize: '10px' }}>-</div>
              <div>฿{max}</div>
            </div>
          );
        }
        return '-';
      }
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isActive ? 'green' : 'red'}>
          {record.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
        </Tag>
      )
    },
    {
      title: 'อัปเดตล่าสุด',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (value) => (value ? new Date(value).toLocaleString('th-TH') : '-')
    },
    {
      title: 'อีเมลโครงการ',
      dataIndex: 'passEmailRecipients',
      key: 'passEmailRecipients',
      width: 220,
      render: (value) => renderEmailRecipients(value)
    },
    {
      title: 'bud',
      dataIndex: 'bud',
      key: 'bud',
      width: 100,
      render: (value) => (value !== null && value !== undefined ? value : '-')
    },
    {
      title: 'แจ้งเตือน',
      key: 'notification',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <Tooltip title={record.passEmailEnabled ? 'คลิกเพื่อปิดแจ้งเตือนเมล์' : 'คลิกเพื่อเปิดแจ้งเตือนเมล์'}>
          <Button
            type="text"
            size="small"
            icon={
              <MailOutlined
                style={{
                  color: record.passEmailEnabled ? '#52c41a' : '#d9d9d9',
                  fontSize: 18
                }}
              />
            }
            loading={togglingNotificationProjectId === record.id}
            onClick={() => handleToggleNotification(record)}
            style={{ padding: 0, minWidth: 24 }}
          />
        </Tooltip>
      )
    },
    {
      title: 'การดำเนินการ',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="ยืนยันการลบ"
            description="คุณแน่ใจหรือไม่ที่จะลบโครงการนี้?"
            onConfirm={() => handleDelete(record.id)}
            okText="ใช่"
            cancelText="ไม่"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3} style={{ margin: 0 }}>
                <ProjectOutlined style={{ marginRight: '8px' }} />
                จัดการโครงการ
              </Title>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                เพิ่มโครงการใหม่
              </Button>
            </Col>
          </Row>
        </div>
        
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          footer={() => <div>รวม {pagination.total} โครงการ</div>}
        />
      </Card>
    </div>
  );
};

export default ProjectManagement;