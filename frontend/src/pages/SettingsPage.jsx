import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  notification
} from 'antd';
import { DeleteOutlined, EditOutlined, MailOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { notificationRulesAPI, productTypesAPI } from '../services/api';

const { Title, Text } = Typography;
const NOTIFICATION_ACTION_OPTIONS = [
  { value: 'customer_created', label: 'เพิ่มลูกค้าใหม่' },
  { value: 'agent_registered', label: 'เอเจนต์ลงทะเบียนใหม่' }
];

const ACTION_LABEL_MAP = {
  customer_created: 'เพิ่มลูกค้าใหม่',
  agent_registered: 'เอเจนต์ลงทะเบียนใหม่'
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normalizeEmailList = (emails = []) => {
  if (!Array.isArray(emails)) {
    return [];
  }

  return [...new Set(
    emails
      .map((email) => (typeof email === 'string' ? email.trim().toLowerCase() : ''))
      .filter((email) => email && isValidEmail(email))
  )];
};

const SettingsPage = () => {
  const [productTypes, setProductTypes] = useState([]);
  const [productTypeLoading, setProductTypeLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProductType, setEditingProductType] = useState(null);

  const [notificationRules, setNotificationRules] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [editingNotificationRule, setEditingNotificationRule] = useState(null);
  const [testingNotificationRuleId, setTestingNotificationRuleId] = useState(null);

  const [form] = Form.useForm();
  const [notificationForm] = Form.useForm();

  const fetchProductTypes = async () => {
    try {
      setProductTypeLoading(true);
      const response = await productTypesAPI.getAll({ includeInactive: true });
      setProductTypes(response.data || []);
    } catch (error) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถโหลดข้อมูลประเภทสินค้าได้'
      });
    } finally {
      setProductTypeLoading(false);
    }
  };

  const fetchNotificationRules = async () => {
    try {
      setNotificationLoading(true);
      const response = await notificationRulesAPI.getAll();
      setNotificationRules(response.data || []);
    } catch (error) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถโหลดข้อมูล notification rules ได้'
      });
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    fetchProductTypes();
    fetchNotificationRules();
  }, []);

  const handleCreate = () => {
    setEditingProductType(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, sortOrder: 0 });
    setModalVisible(true);
  };

  const handleNotificationCreate = () => {
    setEditingNotificationRule(null);
    notificationForm.resetFields();
    notificationForm.setFieldsValue({ isActive: true, recipientEmails: [] });
    setNotificationModalVisible(true);
  };

  const handleNotificationEdit = (record) => {
    setEditingNotificationRule(record);
    notificationForm.setFieldsValue({
      actionType: record.actionType,
      recipientEmails: record.recipientEmails || [],
      isActive: record.isActive
    });
    setNotificationModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingProductType(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      sortOrder: record.sortOrder,
      isActive: record.isActive
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await productTypesAPI.delete(id);
      notification.success({
        message: 'สำเร็จ',
        description: 'ปิดใช้งานประเภทสินค้าสำเร็จ'
      });
      fetchProductTypes();
    } catch (error) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถปิดใช้งานประเภทสินค้าได้'
      });
    }
  };

  const handleNotificationDelete = async (id) => {
    try {
      await notificationRulesAPI.delete(id);
      notification.success({
        message: 'สำเร็จ',
        description: 'ลบ notification rule สำเร็จ'
      });
      fetchNotificationRules();
    } catch (error) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถลบ notification rule ได้'
      });
    }
  };

  const handleNotificationTestSend = async (record) => {
    try {
      setTestingNotificationRuleId(record.id);
      const response = await notificationRulesAPI.testSend(record.id);
      notification.success({
        message: 'ทดสอบส่งสำเร็จ',
        description: response.message || 'ส่งอีเมลทดสอบเรียบร้อยแล้ว'
      });
    } catch (error) {
      notification.error({
        message: 'ทดสอบส่งไม่สำเร็จ',
        description: error.message || 'ไม่สามารถส่งอีเมลทดสอบได้'
      });
    } finally {
      setTestingNotificationRuleId(null);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingProductType) {
        await productTypesAPI.update(editingProductType.id, values);
        notification.success({
          message: 'สำเร็จ',
          description: 'อัพเดทประเภทสินค้าสำเร็จ'
        });
      } else {
        await productTypesAPI.create(values);
        notification.success({
          message: 'สำเร็จ',
          description: 'เพิ่มประเภทสินค้าสำเร็จ'
        });
      }

      setModalVisible(false);
      setEditingProductType(null);
      form.resetFields();
      fetchProductTypes();
    } catch (error) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถบันทึกประเภทสินค้าได้'
      });
    }
  };

  const handleNotificationSubmit = async (values) => {
    try {
      const payload = {
        actionType: values.actionType,
        recipientEmails: normalizeEmailList(values.recipientEmails),
        isActive: Boolean(values.isActive)
      };

      if (payload.recipientEmails.length === 0) {
        notification.error({
          message: 'ข้อมูลไม่ถูกต้อง',
          description: 'กรุณาระบุอีเมลผู้รับอย่างน้อย 1 รายการ'
        });
        return;
      }

      if (editingNotificationRule) {
        await notificationRulesAPI.update(editingNotificationRule.id, payload);
        notification.success({
          message: 'สำเร็จ',
          description: 'อัปเดต notification rule สำเร็จ'
        });
      } else {
        await notificationRulesAPI.create(payload);
        notification.success({
          message: 'สำเร็จ',
          description: 'เพิ่ม notification rule สำเร็จ'
        });
      }

      setNotificationModalVisible(false);
      setEditingNotificationRule(null);
      notificationForm.resetFields();
      fetchNotificationRules();
    } catch (error) {
      notification.error({
        message: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถบันทึก notification rule ได้'
      });
    }
  };

  const productTypeColumns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 160,
      render: (value) => <Tag color="geekblue">{value}</Tag>
    },
    {
      title: 'ชื่อประเภทสินค้า',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'ลำดับ',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 100
    },
    {
      title: 'สถานะ',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
        </Tag>
      )
    },
    {
      title: 'การจัดการ',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="ปิดใช้งานประเภทสินค้า"
            description="ต้องการปิดใช้งานรายการนี้ใช่หรือไม่?"
            okText="ยืนยัน"
            cancelText="ยกเลิก"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: 'product-types',
      label: 'ประเภทสินค้า',
      children: (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <Title level={4} style={{ marginBottom: 4 }}>จัดการ Product Types</Title>
              <Text type="secondary">รายการในหน้านี้จะถูกนำไปใช้ในฟอร์มเพิ่ม/แก้ไขลูกค้าแบบเลือกได้หลายรายการ</Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              เพิ่มประเภทสินค้า
            </Button>
          </div>

          <Table
            rowKey="id"
            columns={productTypeColumns}
            dataSource={productTypes}
            loading={productTypeLoading}
            pagination={false}
            scroll={{ x: 700 }}
          />
        </Card>
      )
    },
    {
      key: 'email-notifications',
      label: 'แจ้งเตือนอีเมล',
      children: (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <Title level={4} style={{ marginBottom: 4 }}>จัดการ Notification Rules</Title>
              <Text type="secondary">ตั้งค่าอีเมลผู้รับสำหรับการแจ้งเตือนเมื่อเพิ่มลูกค้าใหม่ และเอเจนต์ลงทะเบียนใหม่</Text>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleNotificationCreate}>
              เพิ่ม Notification Rule
            </Button>
          </div>

          <Table
            rowKey="id"
            dataSource={notificationRules}
            loading={notificationLoading}
            pagination={false}
            scroll={{ x: 880 }}
            columns={[
              {
                title: 'เหตุการณ์',
                dataIndex: 'actionType',
                key: 'actionType',
                width: 220,
                render: (value) => <Tag color="blue">{ACTION_LABEL_MAP[value] || value}</Tag>
              },
              {
                title: 'ผู้รับอีเมล',
                dataIndex: 'recipientEmails',
                key: 'recipientEmails',
                render: (emails = []) => (
                  <Space size={[4, 4]} wrap>
                    {emails.map((email) => (
                      <Tag key={email} color="geekblue">{email}</Tag>
                    ))}
                  </Space>
                )
              },
              {
                title: 'สถานะ',
                dataIndex: 'isActive',
                key: 'isActive',
                width: 120,
                render: (isActive) => (
                  <Tag color={isActive ? 'green' : 'default'}>
                    {isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                  </Tag>
                )
              },
              {
                title: 'การจัดการ',
                key: 'actions',
                width: 220,
                render: (_, record) => (
                  <Space>
                    <Button
                      type="text"
                      icon={<MailOutlined />}
                      loading={testingNotificationRuleId === record.id}
                      onClick={() => handleNotificationTestSend(record)}
                    >
                      ทดสอบส่ง
                    </Button>
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleNotificationEdit(record)} />
                    <Popconfirm
                      title="ลบ notification rule"
                      description="ต้องการลบรายการนี้ใช่หรือไม่?"
                      okText="ยืนยัน"
                      cancelText="ยกเลิก"
                      onConfirm={() => handleNotificationDelete(record.id)}
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                )
              }
            ]}
          />
        </Card>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          <SettingOutlined style={{ marginRight: 8 }} />
          ตั้งค่า
        </Title>
      </div>

      <Tabs items={tabItems} />

      <Modal
        title={editingProductType ? 'แก้ไขประเภทสินค้า' : 'เพิ่มประเภทสินค้า'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingProductType(null);
          form.resetFields();
        }}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, message: 'กรุณากรอก code' }]}
          >
            <Input placeholder="เช่น livnex" />
          </Form.Item>

          <Form.Item
            name="name"
            label="ชื่อประเภทสินค้า"
            rules={[{ required: true, message: 'กรุณากรอกชื่อประเภทสินค้า' }]}
          >
            <Input placeholder="เช่น Livnex" />
          </Form.Item>

          <Form.Item
            name="sortOrder"
            label="ลำดับการแสดงผล"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="isActive" label="เปิดใช้งาน" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingProductType(null);
                form.resetFields();
              }}>
                ยกเลิก
              </Button>
              <Button type="primary" htmlType="submit">
                {editingProductType ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingNotificationRule ? 'แก้ไข Notification Rule' : 'เพิ่ม Notification Rule'}
        open={notificationModalVisible}
        onCancel={() => {
          setNotificationModalVisible(false);
          setEditingNotificationRule(null);
          notificationForm.resetFields();
        }}
        footer={null}
        destroyOnHidden
      >
        <Form form={notificationForm} layout="vertical" onFinish={handleNotificationSubmit}>
          <Form.Item
            name="actionType"
            label="เหตุการณ์"
            rules={[{ required: true, message: 'กรุณาเลือกเหตุการณ์' }]}
          >
            <Select
              placeholder="เลือกเหตุการณ์ที่ต้องการแจ้งเตือน"
              options={NOTIFICATION_ACTION_OPTIONS}
            />
          </Form.Item>

          <Form.Item
            name="recipientEmails"
            label="อีเมลผู้รับ"
            tooltip="กด Enter เพื่อเพิ่มอีเมลหลายรายการ"
            rules={[
              { required: true, message: 'กรุณาระบุอีเมลผู้รับอย่างน้อย 1 รายการ' },
              {
                validator: (_, value) => {
                  const emails = Array.isArray(value) ? value : [];
                  if (emails.length === 0) {
                    return Promise.reject(new Error('กรุณาระบุอีเมลผู้รับอย่างน้อย 1 รายการ'));
                  }
                  const invalidEmail = emails.find((email) => !isValidEmail(String(email).trim()));
                  if (invalidEmail) {
                    return Promise.reject(new Error(`อีเมลไม่ถูกต้อง: ${invalidEmail}`));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Select
              mode="tags"
              tokenSeparators={[',', ' ']}
              placeholder="เช่น admin1@sena.co.th"
            />
          </Form.Item>

          <Form.Item name="isActive" label="เปิดใช้งาน" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setNotificationModalVisible(false);
                setEditingNotificationRule(null);
                notificationForm.resetFields();
              }}>
                ยกเลิก
              </Button>
              <Button type="primary" htmlType="submit">
                {editingNotificationRule ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
