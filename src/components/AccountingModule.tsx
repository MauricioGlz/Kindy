import React, { useState } from 'react';
import { Calculator, TrendingUp, TrendingDown, DollarSign, Plus, CheckCircle2 } from 'lucide-react';
import { Student } from '../types.ts';

interface AccountingModuleProps {
  students: Student[];
  onToggleTuitionStatus?: (studentId: number) => Promise<void> | void;
}

export default function AccountingModule({ students }: AccountingModuleProps) {
  const [expenses, setExpenses] = useState<
    { id: number; concept: string; category: string; amount: number; date: string }[]
  >([
    { id: 1, concept: 'Material didáctico y pintura Montessori', category: 'Materiales', amount: 3500, date: '2026-09-02' },
    { id: 2, concept: 'Servicio de comedor y frutas orgánicas', category: 'Alimentos', amount: 8200, date: '2026-09-05' },
    { id: 3, concept: 'Mantenimiento de áreas de juegos y desinfección', category: 'Mantenimiento', amount: 4100, date: '2026-09-10' },
  ]);

  const [newConcept, setNewConcept] = useState('');
  const [newCategory, setNewCategory] = useState('Materiales');
  const [newAmount, setNewAmount] = useState(1500);

  const totalTuitionIncome = students
    .filter((s) => s.tuitionStatus === 'Pagado')
    .reduce((sum, s) => sum + s.tuitionAmount, 0);

  const totalExpectedIncome = students.reduce((sum, s) => sum + s.tuitionAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalTuitionIncome - totalExpenses;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConcept.trim()) return;
    const item = {
      id: Date.now(),
      concept: newConcept.trim(),
      category: newCategory,
      amount: newAmount,
      date: new Date().toISOString().split('T')[0],
    };
    setExpenses([item, ...expenses]);
    setNewConcept('');
  };

  return (
    <div id="view-module-accounting" className="w-full max-w-5xl space-y-5">
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
            <Calculator className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wide">
            Finanzas y Caja Escolar
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Balance Contable y Flujo de Caja</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Resumen de ingresos recaudados por colegiaturas y egresos operativos del mes.
        </p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ingresos Cobrados</span>
            <span className="text-xl font-bold text-emerald-600 font-mono">
              ${totalTuitionIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block">De ${totalExpectedIncome.toLocaleString('es-MX')} presupuestado</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Egresos Operativos</span>
            <span className="text-xl font-bold text-rose-600 font-mono">
              ${totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block">{expenses.length} conceptos registrados</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Flujo Neto / Saldo</span>
            <span className={`text-xl font-bold font-mono ${netBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              ${netBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block">Superávit activo</span>
          </div>
        </div>
      </div>

      {/* Register expense form */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-800 text-sm">Registrar Egreso o Gasto Operativo</h3>
        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div className="sm:col-span-2">
            <input
              type="text"
              required
              placeholder="Concepto del gasto (ej. Materiales de arte)"
              value={newConcept}
              onChange={(e) => setNewConcept(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>
          <div>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
            >
              <option value="Materiales">Materiales Didácticos</option>
              <option value="Alimentos">Comedor y Alimentos</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Servicios">Servicios (Luz/Agua)</option>
              <option value="Nómina">Nómina y Asistencias</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              required
              min={1}
              value={newAmount}
              onChange={(e) => setNewAmount(Number(e.target.value))}
              className="w-28 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-right"
            />
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Agregar
            </button>
          </div>
        </form>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-800 text-sm">Historial de Egresos</h3>
        <div className="space-y-2">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-slate-800 block">{exp.concept}</span>
                <span className="text-[10px] text-slate-400">
                  {exp.category} • {exp.date}
                </span>
              </div>
              <span className="font-mono font-bold text-rose-600">
                -${exp.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
