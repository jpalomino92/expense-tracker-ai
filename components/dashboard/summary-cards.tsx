'use client';

import { ExpenseSummary } from '@/types/analytics';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { DollarSign, TrendingUp, Tag, Receipt } from 'lucide-react';

interface SummaryCardsProps {
  summary: ExpenseSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total Spending',
      value: formatCurrency(summary.totalSpending),
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'This Month',
      value: formatCurrency(summary.monthlySpending),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Top Category',
      value: summary.topCategory?.category || 'N/A',
      subtitle: summary.topCategory
        ? formatCurrency(summary.topCategory.amount)
        : undefined,
      icon: Tag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Transactions',
      value: summary.transactionCount.toString(),
      subtitle:
        summary.transactionCount > 0
          ? `Avg: ${formatCurrency(summary.averageTransaction)}`
          : undefined,
      icon: Receipt,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{card.subtitle}</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor} dark:bg-opacity-20`}>
                <Icon className={`h-6 w-6 ${card.color} dark:opacity-80`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
