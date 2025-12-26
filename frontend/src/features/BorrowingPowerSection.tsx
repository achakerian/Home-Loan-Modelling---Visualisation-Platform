import React from 'react';
import { CollapsibleContainer } from '../components/CollapsibleContainer';
import { BorrowingPowerCard } from './BorrowingPowerCard';

export const BorrowingPowerSection: React.FC = () => (
  <div className="space-y-5">
    <CollapsibleContainer title="Simple Calculator" collapsible defaultOpen={false}>
      <BorrowingPowerCard />
    </CollapsibleContainer>
  </div>
);
