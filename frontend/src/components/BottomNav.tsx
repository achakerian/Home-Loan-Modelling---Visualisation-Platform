import type { FC } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon?: string;
}

interface BottomNavProps {
  items: NavItem[];
  activeId: string;
  onChange: (id: string) => void;
}

const BottomNav: FC<BottomNavProps> = ({ items, activeId, onChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-3 py-2 flex justify-around text-xs shadow-lg">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={
            'flex flex-col items-center gap-1 text-[11px]' +
            (activeId === item.id ? ' text-primary font-semibold' : ' text-slate-500')
          }
        >
          <span className="text-base" aria-hidden>
            {item.icon ?? '•'}
          </span>
          {item.label}
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
