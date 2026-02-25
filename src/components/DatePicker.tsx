/**
 * DatePicker com calendário no design system do site.
 * Abre ao clicar em qualquer parte do campo.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function formatYmdToDma(ymd: string): string {
  if (!ymd || ymd.length < 10) return '';
  const [y, m, d] = ymd.slice(0, 10).split('-');
  if (!d || !m || !y) return '';
  return `${d}/${m}/${y}`;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

function getLeadingBlanks(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

export interface DatePickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: React.ReactNode;
  'aria-label'?: string;
}

export function DatePicker({ id, value, onChange, placeholder = 'Selecione a data', label, 'aria-label': ariaLabel }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => (value ? new Date(value).getFullYear() : new Date().getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(value).getMonth() : new Date().getMonth()));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) return;
    const d = new Date(value);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const displayText = value ? formatYmdToDma(value) : '';
  const days = getDaysInMonth(viewYear, viewMonth);
  const leading = getLeadingBlanks(viewYear, viewMonth);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelect = (d: Date) => {
    onChange(toYmd(d));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      <button
        type="button"
        id={id}
        aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-left flex items-center justify-between gap-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
      >
        <span className={displayText ? 'text-slate-900 font-medium' : 'text-slate-400'}>
          {displayText || placeholder}
        </span>
        <Calendar className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 left-0 bg-white border border-slate-200 rounded-xl shadow-lg p-4 min-w-[280px]"
            role="dialog"
            aria-modal="true"
            aria-label="Calendário"
          >
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goPrevMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Mês anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <p className="text-sm font-bold text-slate-900">
                {MONTHS[viewMonth]} {viewYear}
              </p>
              <button
                type="button"
                onClick={goNextMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Próximo mês"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-2">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {w}
                </div>
              ))}
              {Array.from({ length: leading }, (_, i) => (
                <div key={`blank-${i}`} className="w-8 h-8" />
              ))}
              {days.map((d) => {
                const ymd = toYmd(d);
                const selected = value === ymd;
                const today = isToday(d);
                return (
                  <button
                    key={ymd}
                    type="button"
                    onClick={() => handleSelect(d)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors flex items-center justify-center
                      ${selected ? 'bg-orange-600 text-white hover:bg-orange-700' : ''}
                      ${!selected && today ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : ''}
                      ${!selected && !today ? 'text-slate-700 hover:bg-slate-100' : ''}`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
