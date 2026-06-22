import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Zap } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { TableCard, THead, Th, Td, SkeletonRows, EmptyState } from '../ui';
import { DealAlert } from './types';

type Filter = '7d' | '30d' | 'all';

const formatIDR = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);

const FILTERS: { key: Filter; label: string }[] = [
  { key: '7d',  label: '7 Hari' },
  { key: '30d', label: '30 Hari' },
  { key: 'all', label: 'Semua' },
];

const DealAlertTable: React.FC = () => {
  const [alerts, setAlerts] = useState<DealAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('30d');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      let query = supabase
        .from('deal_alerts')
        .select('*, watchlist:watchlists(origin, destination, target_price_max)')
        .order('created_at', { ascending: false });

      if (filter === '7d') {
        query = query.gte('created_at', new Date(Date.now() - 7 * 86400 * 1000).toISOString());
      } else if (filter === '30d') {
        query = query.gte('created_at', new Date(Date.now() - 30 * 86400 * 1000).toISOString());
      }

      const { data, error } = await query;
      if (!error && data) setAlerts(data as DealAlert[]);
      setLoading(false);
    };
    fetchAlerts();
  }, [filter]);

  const toggleExpand = (id: string) => setExpanded(prev => (prev === id ? null : id));

  return (
    <>
      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === f.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <TableCard>
        <table className="w-full">
          <THead>
            <Th>Rute</Th>
            <Th>Keberangkatan</Th>
            <Th>Harga</Th>
            <Th>Maskapai</Th>
            <Th>Hemat</Th>
            <Th>Ditemukan</Th>
            <Th> </Th>
          </THead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <SkeletonRows rows={3} cols={7} />
            ) : alerts.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState
                  icon={<Zap className="w-8 h-8" />}
                  title="Belum ada deal"
                  description="Deal akan muncul di sini saat harga tiket turun di bawah target."
                />
              </td></tr>
            ) : alerts.map(alert => (
              <React.Fragment key={alert.id}>
                <tr
                  className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(alert.id)}
                >
                  <Td>
                    <span className="font-semibold text-gray-900">
                      {alert.watchlist?.origin} → {alert.watchlist?.destination}
                    </span>
                  </Td>
                  <Td>{alert.departure_date}</Td>
                  <Td><span className="font-semibold text-emerald-700">{formatIDR(alert.price)}</span></Td>
                  <Td>{alert.airline}</Td>
                  <Td>
                    {alert.watchlist && (
                      <span className="text-emerald-600 font-medium">
                        {formatIDR(alert.watchlist.target_price_max - alert.price)}
                      </span>
                    )}
                  </Td>
                  <Td className="text-gray-400 text-xs">
                    {new Date(alert.created_at).toLocaleString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Td>
                  <Td>
                    {expanded === alert.id
                      ? <ChevronDown className="w-4 h-4 text-gray-400" />
                      : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </Td>
                </tr>
                {expanded === alert.id && (
                  <tr className="bg-gray-50/40">
                    <td colSpan={7} className="px-6 py-4">
                      <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap max-h-64 font-mono bg-gray-100 rounded-lg p-3">
                        {JSON.stringify(alert.flight_details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </TableCard>
    </>
  );
};

export default DealAlertTable;
