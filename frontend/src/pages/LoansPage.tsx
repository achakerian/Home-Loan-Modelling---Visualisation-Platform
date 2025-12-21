import React from 'react';
import { FeatureAccordion, FeatureAccordionItem } from '../components/FeatureAccordion';

const items: FeatureAccordionItem[] = [
  {
    badge: 'Banner',
    title: 'Roadmap banner',
    content:
      'Peek at the calculations that will land next and how we plan to surface them.',
  },
  {
    badge: 'Mortgage',
    title: 'Repayment calculator',
    content: 'Mortgage stream refactors with linked repayment/offset charts.',
  },
  {
    badge: 'Capacity',
    title: 'Borrowing power',
    content: 'Refined inputs covering buffers, HEM and instant context notes.',
  },
  {
    badge: 'Guardrails',
    title: 'DTI guardrails',
    content: 'Custom DTI guardrails with context-aware messaging.',
  },
  {
    badge: 'Tax',
    title: 'Pay & tax module',
    content: 'Modules that switch between PAYG, contracting and bonus-heavy structures.',
  },
];

export const LoansPage: React.FC = () => {
  return (
    <div className="px-6 pb-32 pt-6">
      <FeatureAccordion items={items} />
    </div>
  );
};
