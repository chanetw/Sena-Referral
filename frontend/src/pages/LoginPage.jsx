import { Form, Input, Button, Card, Row, Col, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../store/authSlice';

const { Title, Text } = Typography;

const LoginPage = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    dispatch(clearError());
    dispatch(loginUser(values));
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url(/background.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Overlay เบาๆ เพื่อให้ Card โดดเด่น */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(2px)'
      }} />

      <Row justify="center" style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        <Col span={24}>
          {/* SENA Logo */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img
              src="/sena-logo.png"
              alt="SENA Logo"
              style={{
                height: '80px',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))'
              }}
            />
          </div>

          <Card
            style={{
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Title level={2} style={{
                color: '#2c3e50',
                marginBottom: '8px',
                fontWeight: 600
              }}>
                Agent Referral System
              </Title>
              <Text style={{ color: '#7f8c8d', fontSize: '15px' }}>
                เข้าสู่ระบบจัดการเอเจนต์
              </Text>
            </div>

            {error && (
              <Alert
                message="เกิดข้อผิดพลาด"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => dispatch(clearError())}
                style={{ marginBottom: '24px' }}
              />
            )}

            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              size="large"
              layout="vertical"
            >
              <Form.Item
                name="email"
                label="อีเมล"
                rules={[
                  { required: true, message: 'กรุณาป้อนอีเมล' },
                  { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="อีเมล"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="รหัสผ่าน"
                rules={[{ required: true, message: 'กรุณาป้อนรหัสผ่าน' }]}
                extra="เลขบัตรประจำตัวประชาชน"
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="รหัสผ่าน"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: 500,
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0, 188, 212, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 188, 212, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 188, 212, 0.3)';
                  }}
                >
                  เข้าสู่ระบบ
                </Button>
              </Form.Item>
            </Form>

            {/* Information Banner */}
            <div style={{
              marginTop: '24px',
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.08) 0%, rgba(0, 151, 167, 0.08) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 188, 212, 0.2)',
              boxShadow: '0 2px 8px rgba(0, 188, 212, 0.1)'
            }}>
              <Text strong style={{
                display: 'block',
                color: '#00838F',
                fontSize: '15px',
                marginBottom: '8px',
                fontWeight: 600
              }}>
                เรียนผู้ใช้งาน
              </Text>
              <div style={{ fontSize: '14px', color: '#546e7a', lineHeight: '1.6' }}>
                <Text style={{ display: 'block', marginBottom: '4px' }}>
                  • <strong>User</strong> สำหรับเข้าใช้งานระบบ คือ <strong>Email</strong>
                </Text>
                <Text style={{ display: 'block', marginBottom: '4px' }}>
                  • <strong>รหัสผ่าน</strong> คือ <strong>หมายเลขบัตรประจำตัวประชาชน</strong>
                </Text>
                <Text style={{ display: 'block' }}>
                  ที่ได้ลงทะเบียนไว้กับบริษัท
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LoginPage;