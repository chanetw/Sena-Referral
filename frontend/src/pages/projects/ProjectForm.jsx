import React from 'react';
import {
  Card,
  Button,
  Form,
  Input,
  Row,
  Col,
  Typography,
  Select,
  InputNumber,
  Switch,
  Divider
} from 'antd';
import { ArrowLeftOutlined, MailOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ProjectForm = ({ onBack, onSave, editingProject }) => {
  const [form] = Form.useForm();
  const passEmailEnabled = Form.useWatch('passEmailEnabled', form);

  const onFinish = (values) => {
    onSave(values);
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Button onClick={onBack} icon={<ArrowLeftOutlined />}>
          กลับไปที่รายการโครงการ
        </Button>
      </div>
      <Card>
        <Title level={4}>
          {editingProject ? 'แก้ไขโครงการ' : 'สร้างโครงการใหม่'}
        </Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={editingProject ? {
            ...editingProject,
            isActive: editingProject.isActive ? true : false,
            passEmailEnabled: editingProject.passEmailEnabled ? true : false,
            passEmailRecipients: editingProject.passEmailRecipients || '',
            priceRangeMin: editingProject.priceRangeMin ? Number(editingProject.priceRangeMin) : undefined,
            priceRangeMax: editingProject.priceRangeMax ? Number(editingProject.priceRangeMax) : undefined
          } : {
            isActive: true,
            passEmailEnabled: false,
            projectType: 'condo'
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="projectCode"
                label="รหัสโครงการ"
                rules={[{ required: true, message: 'กรุณาใส่รหัสโครงการ' }]}
              >
                <Input placeholder="เช่น, PROJ001" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="projectName"
                label="ชื่อโครงการ"
                rules={[{ required: true, message: 'กรุณาใส่ชื่อโครงการ' }]}
              >
                <Input placeholder="เช่น, Sena Village" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="projectType"
                label="ประเภทโครงการ"
                rules={[{ required: true, message: 'กรุณาเลือกประเภทโครงการ' }]}
              >
                <Select>
                  <Option value="condo">คอนโดมิเนียม</Option>
                  <Option value="house">บ้าน</Option>
                  <Option value="townhome">ทาวน์เฮ้าส์</Option>
                  <Option value="commercial">พาณิชย์</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="isActive"
                label="สถานะ"
                rules={[{ required: true, message: 'กรุณาเลือกสถานะ' }]}
              >
                <Select>
                  <Option value={true}>ใช้งาน</Option>
                  <Option value={false}>ไม่ใช้งาน</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="location"
            label="ตำแหน่งที่ตั้ง"
            rules={[{ required: true, message: 'กรุณาใส่ตำแหน่งที่ตั้ง' }]}
          >
            <TextArea rows={4} placeholder="รายละเอียดที่อยู่โครงการ..." />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="priceRangeMin"
                label="ราคาต่ำสุด (บาท)"
                rules={[
                  { required: true, message: 'กรุณาใส่ราคาต่ำสุด' },
                  { type: 'number', message: 'กรุณาใส่ตัวเลขเท่านั้น' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={1}
                  precision={0}
                  placeholder="เช่น 3500000"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="priceRangeMax"
                label="ราคาสูงสุด (บาท)"
                rules={[
                  { required: true, message: 'กรุณาใส่ราคาสูงสุด' },
                  { type: 'number', message: 'กรุณาใส่ตัวเลขเท่านั้น' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const minValue = getFieldValue('priceRangeMin');
                      if (!value || !minValue || value >= minValue) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('ราคาสูงสุดต้องมากกว่าหรือเท่ากับราคาต่ำสุด'));
                    },
                  }),
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={1}
                  precision={0}
                  placeholder="เช่น 8500000"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            <MailOutlined style={{ marginRight: 8 }} />
            การแจ้งเตือนเมล์เมื่อลูกค้าผ่านเงื่อนไข
          </Divider>

          <Form.Item
            name="passEmailEnabled"
            label="เปิดการแจ้งเตือนทางอีเมล"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="เปิด"
              unCheckedChildren="ปิด"
            />
          </Form.Item>

          {passEmailEnabled && (
            <Form.Item
              name="passEmailRecipients"
              label="อีเมลผู้รับแจ้งเตือน"
              extra="กรอกอีเมลเจ้าหน้าที่ที่ต้องการรับแจ้งเตือน คั่นด้วยเครื่องหมาย , หากมีหลายคน เช่น user1@sena.co.th, user2@sena.co.th"
              rules={[
                {
                  required: true,
                  message: 'กรุณากรอกอีเมลผู้รับแจ้งเตือนอย่างน้อย 1 คน'
                },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const emails = value.split(',').map(e => e.trim()).filter(Boolean);
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    const invalid = emails.filter(e => !emailRegex.test(e));
                    if (invalid.length > 0) {
                      return Promise.reject(new Error(`รูปแบบอีเมลไม่ถูกต้อง: ${invalid.join(', ')}`));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <TextArea
                rows={2}
                placeholder="เช่น staff1@sena.co.th, staff2@sena.co.th"
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingProject ? 'อัพเดตโครงการ' : 'บันทึกโครงการ'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProjectForm;