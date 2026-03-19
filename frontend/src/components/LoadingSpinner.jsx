import React from 'react';
import { Spin } from 'antd';

const LoadingSpinner = ({ size = 'large', tip = 'กำลังโหลด...' }) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <Spin size={size}>
        <div style={{ padding: '50px' }}>
          <p>{tip}</p>
        </div>
      </Spin>
    </div>
  );
};

export default LoadingSpinner;