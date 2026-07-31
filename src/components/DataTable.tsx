import React, { useState } from 'react';
import { OHLCV } from '../types';
import { Table, Search, Download, ArrowUpDown, Calendar } from 'lucide-react';

interface DataTableProps {
  data: OHLCV[];
  ticker: string;
}

export const DataTable: React.FC<DataTableProps> = ({ data, ticker }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof OHLCV>('date');
  const [sortAsc, setSortAsc] = useState(false);

  if (!data || data.length === 0) return null;

  const filteredData = data.filter((row) =>
    row.date.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof OHLCV) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleDownloadCSV = () => {
    const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume'];
    const rows = sortedData.map((row) => [
      row.date,
      row.open,
      row.high,
      row.low,
      row.close,
      row.volume,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${ticker}_xts_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-purple-700" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            {ticker} xts Time-Series Data Table (`DT::datatable`)
          </h3>
          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
            {sortedData.length} Records
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
            />
          </div>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 text-xs bg-purple-700 hover:bg-purple-800 text-white font-medium px-3 py-1.5 rounded-lg transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto max-h-[420px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th
                onClick={() => handleSort('date')}
                className="py-2.5 px-4 cursor-pointer hover:bg-slate-200/60"
              >
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Index (Date)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('open')}
                className="py-2.5 px-4 text-right cursor-pointer hover:bg-slate-200/60"
              >
                Open ($)
              </th>
              <th
                onClick={() => handleSort('high')}
                className="py-2.5 px-4 text-right cursor-pointer hover:bg-slate-200/60"
              >
                High ($)
              </th>
              <th
                onClick={() => handleSort('low')}
                className="py-2.5 px-4 text-right cursor-pointer hover:bg-slate-200/60"
              >
                Low ($)
              </th>
              <th
                onClick={() => handleSort('close')}
                className="py-2.5 px-4 text-right cursor-pointer hover:bg-slate-200/60"
              >
                Close ($)
              </th>
              <th
                onClick={() => handleSort('volume')}
                className="py-2.5 px-4 text-right cursor-pointer hover:bg-slate-200/60"
              >
                Volume
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
            {sortedData.map((row, idx) => {
              const isUp = row.close >= row.open;
              return (
                <tr key={idx} className="hover:bg-purple-50/40 transition-colors">
                  <td className="py-2 px-4 font-semibold text-slate-800">{row.date}</td>
                  <td className="py-2 px-4 text-right">${row.open.toFixed(2)}</td>
                  <td className="py-2 px-4 text-right text-emerald-700 font-medium">
                    ${row.high.toFixed(2)}
                  </td>
                  <td className="py-2 px-4 text-right text-rose-700 font-medium">
                    ${row.low.toFixed(2)}
                  </td>
                  <td
                    className={`py-2 px-4 text-right font-bold ${
                      isUp ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    ${row.close.toFixed(2)}
                  </td>
                  <td className="py-2 px-4 text-right text-slate-500">
                    {row.volume.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
