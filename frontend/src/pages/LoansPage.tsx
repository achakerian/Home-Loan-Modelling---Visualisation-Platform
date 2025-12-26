import React from 'react';
import { FeatureAccordion, FeatureAccordionItem } from '../components/FeatureAccordion';
import { PageContainer } from '../components/PageContainer';
import { LoanCalculatorCard } from '../features/LoanCalculatorCard';
import { BorrowingPowerSection } from '../features/BorrowingPowerSection';

const items: FeatureAccordionItem[] = [
  {
    badge: 'Mortgage',
    title: 'Loan Calculator',
    content: <LoanCalculatorCard />,
  },
  {
    badge: 'Capacity',
    title: 'Borrowing Power',
    content: <BorrowingPowerSection />,
  },
];

export const LoansPage: React.FC = () => {
  return (
    <PageContainer>
      <FeatureAccordion items={items} initialOpen={null} />
    </PageContainer>
  );
};
