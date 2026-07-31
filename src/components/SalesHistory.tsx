import React, { useState } from 'react';
import { DollarSign, Search, Download, CheckCircle, Smartphone, CreditCard } from 'lucide-react';
import { SaleTransaction } from '../types';

interface SalesHistoryProps {
  sales: SaleTransaction[];
  totalRevenue: number;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ sales, totalRevenue }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = sales.filter(
    (s) =>
      s.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.voucher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.plan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ['ID', 'Reference', 'Montant FCFA', 'Forfait', 'Code Voucher', 'Mode Paiement', 'Date'];
    const rows = filteredSales.map((s) => [
      s.id,
      s.reference,
      s.amount,
      s.plan,
      s.voucher,
      s.mode,
      new Date(s.date).toLocaleString('fr-FR')
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ventes_fedapay_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Metric & CSV Export */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 md:col-span-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Total Encaissé FedaPay Mobile Money</p>
              <h3 className="text-3xl font-black text-white mt-1">
                {totalRevenue.toLocaleString('fr-FR')} <span className="text-base font-medium text-emerald-400">FCFA</span>
              </h3>
            </div>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors border border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Exporter CSV</span>
          </button>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Nombre de Transactions</p>
            <h3 className="text-2xl font-black text-white mt-1">{sales.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Sales Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par référence FedaPay ou code voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {filteredSales.length} transaction(s) affichée(s)
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Référence FedaPay</th>
                <th className="p-4">Montant</th>
                <th className="p-4">Forfait / Profil</th>
                <th className="p-4">Code Voucher Généré</th>
                <th className="p-4">Mode / Téléphone</th>
                <th className="p-4">Date & Heure</th>
                <th className="p-4 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Aucune transaction FedaPay trouvée.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-200">
                      {s.reference}
                    </td>
                    <td className="p-4 font-bold text-emerald-400">
                      {s.amount.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20 text-[11px]">
                        {s.plan} ({s.profile})
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-indigo-400">
                      {s.voucher}
                    </td>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                        <span>{s.mode}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(s.date).toLocaleString('fr-FR')}
                    </td>
                    <td className="p-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 text-[10px]">
                        <CheckCircle className="w-3 h-3" />
                        <span>PAYÉ</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
