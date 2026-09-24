import React, { useState } from 'react';
import { Database, Play, X, Terminal, RefreshCw, AlertCircle } from 'lucide-react';
import { sqlExecuteArbitrary } from '../db/sqlEngine.ts';

interface SqlConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshParent: () => void;
}

export default function SqlConsoleModal({
  isOpen,
  onClose,
  onRefreshParent,
}: SqlConsoleModalProps) {
  const [query, setQuery] = useState(
    'SELECT id, name, classroom, tuition_status, tuition_amount, parent_qr_key FROM students LIMIT 10;'
  );
  const [results, setResults] = useState<{ columns: string[]; values: any[][] }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunQuery = () => {
    setError(null);
    try {
      const res = sqlExecuteArbitrary(query);
      setResults(res);
      onRefreshParent();
    } catch (err: any) {
      setError(err.message || 'Error al ejecutar consulta SQL');
      setResults(null);
    }
  };

  const sampleQueries = [
    { label: 'Colegiaturas Alumnos', sql: 'SELECT id, name, classroom, payment_date, tuition_status, tuition_amount FROM students;' },
    { label: 'Llaves QR Registradas', sql: 'SELECT id, name, parent_qr_key, trusted_family_list FROM students;' },
    { label: 'Bitácora Entregas', sql: 'SELECT * FROM attendance_logs ORDER BY id DESC LIMIT 15;' },
    { label: 'Datos Bancarios', sql: 'SELECT bank_name, account_holder, clabe, account_number FROM settings;' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-700 my-auto animate-scaleIn space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Consola Interactiva SQLite</h3>
              <p className="text-xs text-slate-400">Motor relacional WASM ejecutándose localmente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick query presets */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {sampleQueries.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(s.sql)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono whitespace-nowrap transition cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Query Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Sentencia SQL:
            </span>
            <button
              onClick={handleRunQuery}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Ejecutar Consulta
            </button>
          </div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 font-mono text-xs text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Query Results */}
        <div className="flex-1 overflow-auto bg-slate-950 rounded-2xl border border-slate-800 p-3 min-h-[160px]">
          {!results || results.length === 0 ? (
            <div className="text-center text-slate-500 text-xs py-8 font-mono">
              Sin resultados para mostrar. Presiona "Ejecutar Consulta".
            </div>
          ) : (
            results.map((table, tIdx) => (
              <div key={tIdx} className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      {table.columns.map((col, cIdx) => (
                        <th key={cIdx} className="p-2 font-semibold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.values.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-slate-900 hover:bg-slate-900/50">
                        {row.map((val, vIdx) => (
                          <td key={vIdx} className="p-2 text-slate-300 truncate max-w-[200px]">
                            {val === null ? (
                              <span className="text-slate-600 italic">null</span>
                            ) : typeof val === 'object' ? (
                              JSON.stringify(val)
                            ) : (
                              String(val)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
