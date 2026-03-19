import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card } from 'antd';

const PerformanceAreaChart = ({ data, title = "เปรียบเทียบผลงาน" }) => {
  // Generate weekly performance data
  const generateWeeklyData = () => {
    const weeks = ['สัปดาห์ 1', 'สัปดาห์ 2', 'สัปดาห์ 3', 'สัปดาห์ 4'];

    return weeks.map((week, index) => ({
      week,
      ลูกค้าใหม่: Math.round(2 + Math.random() * 3 + index * 0.5),
      ติดต่อลูกค้า: Math.round(5 + Math.random() * 4 + index * 0.8),
      นัดชมโครงการ: Math.round(3 + Math.random() * 2 + index * 0.3),
      ปิดการขาย: Math.round(1 + Math.random() * 2 + index * 0.2)
    }));
  };

  const chartData = generateWeeklyData();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0);

      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          padding: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#1890ff' }}>
            {`${label} (รวม: ${total} กิจกรรม)`}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{
              margin: '4px 0',
              color: entry.color,
              fontSize: '14px'
            }}>
              {`${entry.dataKey}: ${entry.value} ครั้ง`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card title={title} style={{ height: '280px' }}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#d9d9d9' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#d9d9d9' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
          />
          <Area
            type="monotone"
            dataKey="ลูกค้าใหม่"
            stackId="1"
            stroke="#1890ff"
            fill="#1890ff"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="ติดต่อลูกค้า"
            stackId="1"
            stroke="#52c41a"
            fill="#52c41a"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="นัดชมโครงการ"
            stackId="1"
            stroke="#fa8c16"
            fill="#fa8c16"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="ปิดการขาย"
            stackId="1"
            stroke="#f5222d"
            fill="#f5222d"
            fillOpacity={0.8}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default PerformanceAreaChart;