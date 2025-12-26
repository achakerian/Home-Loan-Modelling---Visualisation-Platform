import React from 'react';
import { FeatureAccordion, FeatureAccordionItem } from '../components/FeatureAccordion';
import { PageContainer } from '../components/PageContainer';
import { PayTaxSection } from '../features/PayTaxSection';
import { TaxChecklistSection } from '../features/TaxChecklistSection';

const items: FeatureAccordionItem[] = [
  {
    badge: 'Income Tax',
    title: 'Pay Summary',
    content: <PayTaxSection />,
  },
  {
    badge: 'Prep',
    title: 'Tax checklist & deductions',
    content: <TaxChecklistSection />,
  },
];

export const PayTaxPage: React.FC = () => {
  return (
    <PageContainer>
      <FeatureAccordion items={items} initialOpen={null} />
    </PageContainer>
  );
};
