import React from 'react';
import { PageHeader, SectionCard } from '../../components/admin/ui';
import WatchlistTable from '../../components/admin/DealHunter/WatchlistTable';
import DealAlertTable from '../../components/admin/DealHunter/DealAlertTable';

const DealHunter: React.FC = () => (
  <div className="space-y-8">
    <PageHeader
      title="Deal Hunter"
      subtitle="Monitor harga tiket secara otomatis dan temukan deal terbaik."
    />
    <SectionCard title="Watchlist">
      <WatchlistTable />
    </SectionCard>
    <SectionCard title="Deal Alerts">
      <DealAlertTable />
    </SectionCard>
  </div>
);

export default DealHunter;
