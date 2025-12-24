import React from 'react';
import { CollapsibleContainer } from '../components/CollapsibleContainer';
import { PayCalculatorCard } from './PayCalculatorCard';
import { DetailedPayCalculatorCard } from './DetailedPayCalculatorCard';

export const PayTaxSection: React.FC = () => (
  <div className="space-y-5">
    <CollapsibleContainer title="Simple Calculator" collapsible defaultOpen={false}>
      <PayCalculatorCard />
    </CollapsibleContainer>
    <CollapsibleContainer title="Detailed Calculator" collapsible defaultOpen={false}>
      <DetailedPayCalculatorCard />
    </CollapsibleContainer>
  </div>
);
