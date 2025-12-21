import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  CalculatorIcon,
  PiggyBankIcon,
  UserIcon,
} from './icons';

const navItems = [
  { to: '/loans', label: 'Loans', icon: HomeIcon },
  { to: '/pay-tax', label: 'Pay & Tax', icon: CalculatorIcon },
  { to: '/super', label: 'Super', icon: PiggyBankIcon },
  { to: '/login', label: 'Login', icon: UserIcon },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex h-full flex-1 flex-col items-center justify-center transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`
            }
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
