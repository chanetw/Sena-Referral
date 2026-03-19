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
  message
} from 'antd';
import { PlusOutlined, ProjectOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { projectsAPI } from '../services/api';
import ProjectForm from './ProjectForm';

const { Title } = Typography;

const ProjectManagement = () => {
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editingProject, setEditingProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load projects from API
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAll();
      setProjects(response.data || []);
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
      fetchProjects(); // Reload projects
    } catch (error) {
      console.error('Error deleting project:', error);
      message.error('ไม่สามารถลบโครงการได้');
    }
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
      fetchProjects(); // Reload projects
    } catch (error) {
      console.error('Error saving project:', error);
      message.error(editingProject ? 'ไม่สามารถแก้ไขโครงการได้' : 'ไม่สามารถเพิ่มโครงการได้');
    }
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
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default ProjectManagement;