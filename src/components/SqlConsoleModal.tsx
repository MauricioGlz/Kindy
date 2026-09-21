import { useState } from 'react';
import { Database, Play, X, Terminal, Table, CheckCircle2, AlertCircle } from 'lucide-react';
import { sqlRawQuery } from '../db/sqlEngine.ts';

interface SqlConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshAppState: () => void;
}

export default function SqlConsoleModal({
  isOpen,
  onClose,
  onRefreshAppState,
}: SqlConsoleModalProps) {
  const [query, setQuery] = useState<string>('SELECT id, name, classroom, delivered, security_pin FROM students LIMIT 10;');
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    values: any[][];
    executionTimeMs?: number;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleRunQuery = async (sqlToRun?: string) => {
    const activeSql = sqlToRun || query;
    const start = performance.now();
    try {
      const res = await sqlRawQuery(activeSql);
      const end = performance.now();
      if (res.length > 0) {
        setQueryResult({
          columns: res[0].columns,
          values: res[0].values,
          executionTimeMs: Math.round((end - start) * 100) / 100,
        });
      } else {
        setQueryResult({
          columns: [],
          values: [],
          executionTimeMs: Math.round((end - start) * 100) / 100,
        });
      }
      onRefreshAppState();
    } catch (err: any) {
      setQueryResult({
        columns: [],
        values: [],
        error: err?.message || 'Error al ejecutar consulta SQL.',
      });
    }
  };

  const presets = [
    { label: 'Alumnos y PINs', sql: 'SELECT id, name, classroom, delivered, security_pin, tuition_status FROM students;' },
    { label: 'Bitácora Asistencias', sql: 'SELECT * FROM attendance_logs ORDER BY id DESC LIMIT 15;' },
    { label: 'Aulas y Capacidad', sql: 'SELECT * FROM classrooms;' },
    { label: 'Documentos', sql: 'SELECT * FROM documents;' },
    { label: 'Empleados / Logins', sql: 'SELECT id, name, role, pin FROM employees;' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                Inspector y Consola SQLite en Vivo
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  WASM Activo
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Ejecuta sentencias SQL reales directamente sobre la base de datos relacional
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="py-2.5 flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Table className="w-3 h-3" /> Tablas:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(p.sql);
                handleRunQuery(p.sql);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono transition cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* SQL Query Box */}
        <div className="relative mb-3">
          <textarea
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400 border border-slate-800 resize-none shadow-inner"
            placeholder="Escribe tu consulta SQL aquí..."
          />
          <button
            onClick={() => handleRunQuery()}
            className="absolute right-3 bottom-4 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" /> Ejecutar SQL
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-auto bg-[#FAF7F5] rounded-2xl border border-slate-200 p-3 min-h-[160px]">
          {queryResult?.error ? (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-mono">{queryResult.error}</span>
            </div>
          ) : queryResult ? (
            <div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 pb-2 border-b border-slate-200 font-mono">
                <span>
                  Filas retornadas: <strong>{queryResult.values.length}</strong>
                </span>
                <span>Tiempo de ejecución: {queryResult.executionTimeMs} ms</span>
              </div>
              {queryResult.values.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6 font-mono">
                  Consulta ejecutada con éxito (0 filas retornadas).
                </p>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-600">
                        {queryResult.columns.map((col, cIdx) => (
                          <th key={cIdx} className="pb-1.5 px-2 font-bold bg-slate-100 rounded-xs">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {queryResult.values.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-white transition">
                          {row.map((cell, valIdx) => (
                            <td key={valIdx} className="py-1.5 px-2 truncate max-w-[200px]">
                              {cell === null ? (
                                <span className="text-slate-400 italic">NULL</span>
                              ) : (
                                String(cell)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-8">
              <Terminal className="w-8 h-8 text-slate-300 mb-1" />
              <span>Presiona "Ejecutar SQL" o selecciona una tabla predeterminada</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cerrar Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
