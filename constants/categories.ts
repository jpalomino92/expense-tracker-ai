import { CategoryConfig, ExpenseCategory } from '@/types/expense';

export const CATEGORY_CONFIG: Record<ExpenseCategory, CategoryConfig> = {
  [ExpenseCategory.FOOD]: {
    label: 'Food',
    value: ExpenseCategory.FOOD,
    icon: 'UtensilsCrossed',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  [ExpenseCategory.TRANSPORTATION]: {
    label: 'Transportation',
    value: ExpenseCategory.TRANSPORTATION,
    icon: 'Car',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  [ExpenseCategory.ENTERTAINMENT]: {
    label: 'Entertainment',
    value: ExpenseCategory.ENTERTAINMENT,
    icon: 'Ticket',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  [ExpenseCategory.SHOPPING]: {
    label: 'Shopping',
    value: ExpenseCategory.SHOPPING,
    icon: 'ShoppingBag',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
  [ExpenseCategory.BILLS]: {
    label: 'Bills',
    value: ExpenseCategory.BILLS,
    icon: 'Receipt',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  [ExpenseCategory.OTHER]: {
    label: 'Other',
    value: ExpenseCategory.OTHER,
    icon: 'MoreHorizontal',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};

export const CATEGORIES = Object.values(ExpenseCategory);
