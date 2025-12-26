import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  CalculatorIcon,
  PiggyBankIcon,
  InfoIcon,
} from './icons';

const navItems = [
  { to: '/loans', label: 'Loans', icon: HomeIcon, color: 'bg-orange-500/20' },
  { to: '/pay-tax', label: 'Pay & Tax', icon: CalculatorIcon, color: 'bg-violet-500/20' },
  { to: '/super', label: 'Super', icon: PiggyBankIcon, color: 'bg-green-500/20' },
  { to: '/information', label: 'Information', icon: InfoIcon, color: 'bg-blue-500/20' },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-50 border-t-2 border-slate-300 bg-white/95 backdrop-blur dark:border-dark-border dark:bg-dark-surfaceAlt/95">
      <div className="mx-auto max-w-md">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex h-full flex-1 flex-col items-center justify-center transition-colors ${
                  isActive
                    ? `text-brand-500 ${item.color}`
                    : 'text-slate-600 hover:text-slate-900 dark:text-dark-muted dark:hover:text-dark-text'
                }`
              }
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};
