import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card } from 'antd';

const StatisticsBarChart = ({ data, title = "สถิติรวม" }) => {
  // Transform data for chart
  const chartData = [
    {
      name: 'เอเจนต์',
      ทั้งหมด: data.totalAgents || 0,
      ใช้งาน: data.activeAgents || 0,
      รออนุมัติ: data.pendingAgents || 0
    },
    {
      name: 'ลูกค้า',
      ทั้งหมด: data.totalCustomers || 0,
      ใหม่: data.newCustomers || 0,
      รออนุมัติ: data.pendingCustomers || 0
    }
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          padding: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#1890ff' }}>
            {`${label}`}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{
              margin: '4px 0',
              color: entry.color,
              fontSize: '14px'
            }}>
              {`${entry.dataKey}: ${entry.value} คน`}
            </p>
          ))}
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
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barCategoryGap="20%"
        >
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00BCD4" stopOpacity={0.9}/>
              <stop offset="100%" stopColor="#0097A7" stopOpacity={0.9}/>
            </linearGradient>
            <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#52c41a" stopOpacity={0.9}/>
              <stop offset="100%" stopColor="#389e0d" stopOpacity={0.9}/>
            </linearGradient>
            <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFA726" stopOpacity={0.9}/>
              <stop offset="100%" stopColor="#F57C00" stopOpacity={0.9}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 14, fill: '#666', fontWeight: 500 }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px', fontSize: '13px', fontWeight: 500 }}
          />
          <Bar
            dataKey="ทั้งหมด"
            fill="url(#colorTotal)"
            radius={[6, 6, 0, 0]}
            name="ทั้งหมด"
          />
          <Bar
            dataKey="ใช้งาน"
            fill="url(#colorActive)"
            radius={[6, 6, 0, 0]}
            name="ใช้งาน/ใหม่"
          />
          <Bar
            dataKey="รออนุมัติ"
            fill="url(#colorPending)"
            radius={[6, 6, 0, 0]}
            name="รออนุมัติ"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default StatisticsBarChart;