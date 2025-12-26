import React from 'react';

export const InformationPage: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-6xl">🚧</div>
        <h1 className="mb-2 text-2xl font-bold text-slate-800 dark:text-white">
          Page Under Construction
        </h1>
        <p className="text-slate-600 dark:text-dark-muted">
          This page is currently being built. Check back soon!
        </p>
      </div>
    </div>
  );
};
