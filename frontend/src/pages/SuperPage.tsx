import React from 'react';
import { FeatureAccordion, FeatureAccordionItem } from '../components/FeatureAccordion';

const items: FeatureAccordionItem[] = [
  {
    badge: 'Contributions',
    title: 'Super contributions tracker',
    content: 'Plan voluntary and employer contributions with concessional cap guardrails.',
  },
  {
    badge: 'Growth',
    title: 'Investment mix',
    content: 'Visualise how allocation choices impact long-term outcomes.',
  },
  {
    badge: 'Retirement',
    title: 'Drawdown simulator',
    content: 'Model pension phase withdrawals with tax-free thresholds.',
  },
  {
    badge: 'Roadmap',
    title: 'Upcoming releases',
    content: 'Peek at super calculators arriving next and how we will surface them.',
  },
];

export const SuperPage: React.FC = () => {
  return (
    <div className="px-6 pb-32 pt-6">
      <FeatureAccordion items={items} />
    </div>
  );
};
