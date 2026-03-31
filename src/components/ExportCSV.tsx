'use client';

import { Download } from 'lucide-react';

interface Props {
  data: any[];
  filename: string;
  headers: { key: string; label: string }[];
}

export function ExportCSV({ data, filename, headers }: Props) {
  const exportToCSV = () => {
    const BOM = '\uFEFF'; // UTF-8 BOM for Arabic support in Excel
    const headerRow = headers.map(h => h.label).join(',');
    const rows = data.map(row =>
      headers.map(h => {
        let val = row[h.key];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    );
    
    const csv = BOM + headerRow + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-sm font-medium shadow-lg shadow-emerald-600/20">
      <Download className="h-4 w-4" />
      تصدير CSV
    </button>
  );
}
