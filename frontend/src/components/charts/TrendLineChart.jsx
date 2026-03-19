import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card } from 'antd';

const TrendLineChart = ({ data, title = "แนวโน้มรายเดือน" }) => {
  // Generate sample monthly data based on current stats
  const generateMonthlyData = () => {
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    return months.map((month, index) => {
      const baseAgent = Math.max(0, (data.totalAgents || 0) - (11 - index) * 0.5);
      const baseCustomer = Math.max(0, (data.totalCustomers || 0) - (11 - index) * 2);

      return {
        month,
        เอเจนต์: Math.round(baseAgent + Math.random() * 2),
        ลูกค้า: Math.round(baseCustomer + Math.random() * 5),
        ปิดการขาย: Math.round((baseCustomer * 0.2) + Math.random() * 2)
      };
    });
  };

  const chartData = generateMonthlyData();

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
            {`${label} 2568`}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{
              margin: '4px 0',
              color: entry.color,
              fontSize: '14px'
            }}>
              {`${entry.dataKey}: ${entry.value} ${entry.dataKey === 'เอเจนต์' ? 'คน' : 'คน'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom dot for line points
  const CustomDot = ({ cx, cy, fill }) => {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={fill}
        stroke={fill}
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
      />
    );
  };

  return (
    <Card title={title} style={{ height: '280px' }}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
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
          <Line
            type="monotone"
            dataKey="เอเจนต์"
            stroke="#1890ff"
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={{ r: 6, stroke: '#1890ff', strokeWidth: 2, fill: '#fff' }}
          />
          <Line
            type="monotone"
            dataKey="ลูกค้า"
            stroke="#52c41a"
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={{ r: 6, stroke: '#52c41a', strokeWidth: 2, fill: '#fff' }}
          />
          <Line
            type="monotone"
            dataKey="ปิดการขาย"
            stroke="#fa8c16"
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={{ r: 6, stroke: '#fa8c16', strokeWidth: 2, fill: '#fff' }}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default TrendLineChart;