import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Card } from 'antd';

const CustomerStatusPieChart = ({ data, title = "สัดส่วนสถานะลูกค้า" }) => {
  // Transform data for pie chart - SENA Brand Colors
  const pieData = [
    { name: 'ลูกค้าใหม่', value: data.newCustomers || 0, color: '#00BCD4' }, // SENA Turquoise
    { name: 'ติดต่อแล้ว', value: Math.floor((data.totalCustomers || 0) * 0.3), color: '#52c41a' }, // Green
    { name: 'สนใจ', value: Math.floor((data.totalCustomers || 0) * 0.2), color: '#FFA726' }, // SENA Orange
    { name: 'นัดชมโครงการ', value: Math.floor((data.totalCustomers || 0) * 0.15), color: '#722ed1' }, // Purple
    { name: 'เจรจาราคา', value: Math.floor((data.totalCustomers || 0) * 0.1), color: '#eb2f96' }, // Pink
    { name: 'ปิดการขาย', value: Math.floor((data.totalCustomers || 0) * 0.25), color: '#13c2c2' } // Cyan
  ].filter(item => item.value > 0); // Remove items with 0 value

  // Custom label function
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show label for very small slices

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          padding: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: data.payload.color }}>
            {`${data.name}`}
          </p>
          <p style={{ margin: '4px 0', fontSize: '14px' }}>
            {`จำนวน: ${data.value} คน`}
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
            {`สัดส่วน: ${((data.value / pieData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title={<span style={{ fontSize: '16px', fontWeight: 600, color: '#2c3e50' }}>{title}</span>}
      style={{
        height: '280px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}
    >
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{
              paddingTop: '10px',
              fontSize: '13px',
              fontWeight: 500
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default CustomerStatusPieChart;