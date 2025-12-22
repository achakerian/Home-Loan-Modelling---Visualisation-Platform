import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { LoansPage } from './pages/LoansPage';
import { PayTaxPage } from './pages/PayTaxPage';
import { SuperPage } from './pages/SuperPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  const basename = import.meta.env.BASE_URL;

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/loans" replace />} />
          <Route path="loans" element={<LoansPage />} />
          <Route path="pay-tax" element={<PayTaxPage />} />
          <Route path="super" element={<SuperPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/loans" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
