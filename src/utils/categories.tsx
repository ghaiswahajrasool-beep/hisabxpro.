import React from 'react';
import {
  Briefcase,
  Building2,
  Coins,
  Fuel,
  HeartPulse,
  Laptop,
  Package,
  ShoppingBag,
  ShoppingCart,
  Utensils,
  Zap,
} from 'lucide-react';
import { ExpenseCategory, IncomeCategory } from '../types';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food & Dining',
  'Petrol & Fuel',
  'Electricity/Gas Bills',
  'Grocery & Rashan',
  'Rent',
  'Medical',
  'Shopping',
  'Other',
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Salary',
  'Business Profit',
  'Freelance',
  'Other Income',
];

export interface CategoryMeta {
  color: string;
  bgTint: string;
  textClass: string;
  renderIcon: (className?: string) => React.ReactNode;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  'Food & Dining': {
    color: '#F59E0B',
    bgTint: 'rgba(245, 158, 11, 0.14)',
    textClass: 'text-amber-400',
    renderIcon: (cls = 'w-4 h-4') => <Utensils className={cls} />,
  },
  'Petrol & Fuel': {
    color: '#F97316',
    bgTint: 'rgba(249, 115, 22, 0.14)',
    textClass: 'text-orange-400',
    renderIcon: (cls = 'w-4 h-4') => <Fuel className={cls} />,
  },
  'Electricity/Gas Bills': {
    color: '#EAB308',
    bgTint: 'rgba(234, 179, 8, 0.14)',
    textClass: 'text-yellow-400',
    renderIcon: (cls = 'w-4 h-4') => <Zap className={cls} />,
  },
  'Grocery & Rashan': {
    color: '#10B981',
    bgTint: 'rgba(16, 185, 129, 0.14)',
    textClass: 'text-emerald-400',
    renderIcon: (cls = 'w-4 h-4') => <ShoppingCart className={cls} />,
  },
  Rent: {
    color: '#6366F1',
    bgTint: 'rgba(99, 102, 241, 0.14)',
    textClass: 'text-indigo-400',
    renderIcon: (cls = 'w-4 h-4') => <Building2 className={cls} />,
  },
  Medical: {
    color: '#F43F5E',
    bgTint: 'rgba(244, 63, 94, 0.14)',
    textClass: 'text-rose-400',
    renderIcon: (cls = 'w-4 h-4') => <HeartPulse className={cls} />,
  },
  Shopping: {
    color: '#EC4899',
    bgTint: 'rgba(236, 72, 153, 0.14)',
    textClass: 'text-pink-400',
    renderIcon: (cls = 'w-4 h-4') => <ShoppingBag className={cls} />,
  },
  Other: {
    color: '#94A3B8',
    bgTint: 'rgba(148, 163, 184, 0.14)',
    textClass: 'text-slate-300',
    renderIcon: (cls = 'w-4 h-4') => <Package className={cls} />,
  },
  Salary: {
    color: '#10B981',
    bgTint: 'rgba(16, 185, 129, 0.16)',
    textClass: 'text-emerald-400',
    renderIcon: (cls = 'w-4 h-4') => <Briefcase className={cls} />,
  },
  'Business Profit': {
    color: '#D4AF37',
    bgTint: 'rgba(212, 175, 55, 0.16)',
    textClass: 'text-[#F3D474]',
    renderIcon: (cls = 'w-4 h-4') => <Coins className={cls} />,
  },
  Freelance: {
    color: '#38BDF8',
    bgTint: 'rgba(56, 189, 248, 0.16)',
    textClass: 'text-sky-400',
    renderIcon: (cls = 'w-4 h-4') => <Laptop className={cls} />,
  },
  'Other Income': {
    color: '#34D399',
    bgTint: 'rgba(52, 211, 153, 0.16)',
    textClass: 'text-emerald-300',
    renderIcon: (cls = 'w-4 h-4') => <Coins className={cls} />,
  },
};

export function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] || CATEGORY_META.Other;
}
