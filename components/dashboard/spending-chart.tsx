'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartData } from '@/types/analytics';
import { formatCurrency } from '@/lib/currency';
import { format, parseISO } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface SpendingChartProps {
  chartData: ChartData;
}

type TimeRange = 'daily' | 'weekly' | 'monthly';

export function SpendingChart({ chartData }: SpendingChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const data = chartData[timeRange].map((point) => ({
    ...point,
    displayDate:
      timeRange === 'daily'
        ? format(parseISO(point.date), 'MMM d')
        : timeRange === 'weekly'
        ? format(parseISO(point.date), 'MMM d')
        : format(parseISO(point.date), 'MMM yyyy'),
    displayAmount: point.amount / 100, // Convert cents to dollars for display
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{payload[0].payload.displayDate}</p>
          <p className="text-sm text-primary-600 dark:text-primary-400 font-semibold">
            {formatCurrency(payload[0].payload.amount)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{payload[0].payload.count} transactions</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spending Over Time</CardTitle>
          <div className="flex gap-2">
            {/* Time Range Buttons */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 p-1">
              {(['daily', 'weekly', 'monthly'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded transition-colors',
                    timeRange === range
                      ? 'bg-primary-500 dark:bg-primary-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>

            {/* Chart Type Buttons */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 p-1">
              {(['line', 'bar'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded transition-colors',
                    chartType === type
                      ? 'bg-primary-500 dark:bg-primary-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
            No spending data available for this time range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="displayDate" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="displayAmount"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="displayDate" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="displayAmount" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
