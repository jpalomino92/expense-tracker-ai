'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CategorySpending } from '@/types/analytics';
import { CATEGORY_CONFIG } from '@/constants/categories';
import { formatCurrency } from '@/lib/currency';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryBreakdownProps {
  breakdown: CategorySpending[];
}

const COLORS = [
  '#ea580c', // Orange (Food)
  '#2563eb', // Blue (Transportation)
  '#9333ea', // Purple (Entertainment)
  '#ec4899', // Pink (Shopping)
  '#dc2626', // Red (Bills)
  '#6b7280', // Gray (Other)
];

export function CategoryBreakdown({ breakdown }: CategoryBreakdownProps) {
  const chartData = breakdown.map((item, index) => ({
    name: item.category,
    value: item.amount / 100, // Convert cents to dollars
    count: item.count,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{payload[0].name}</p>
          <p className="text-sm text-primary-600 dark:text-primary-400 font-semibold">
            {formatCurrency(payload[0].payload.value * 100)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {payload[0].payload.count} transactions • {payload[0].payload.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (breakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
            No spending data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category List */}
          <div className="space-y-3">
            {breakdown.map((item) => {
              const config = CATEGORY_CONFIG[item.category];
              return (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${config.bgColor}`}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.amount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
