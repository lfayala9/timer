'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Calendar,
  Building2,
  Home,
  Play,
  Square,
  RotateCcw,
  Trash2,
  Download,
  CheckCircle2,
  History,
  Briefcase,
  TrendingUp,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { WorkLocation, TimeEntry, ActiveShift } from '@/types';
import {
  formatDuration,
  formatDurationHuman,
  formatTimeOfDay,
  formatDatePretty,
  getTodayDateString,
} from '@/lib/utils';

export default function HomeTracker() {
  // Client-side hydration check
  const [isMounted, setIsMounted] = useState(false);

  // Form selections
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation>('oficina');
  const [notes, setNotes] = useState<string>('');

  // Shift & Timer states
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  // Confirmation/feedback states
  const [recentSaved, setRecentSaved] = useState<string | null>(null);

  // Interval reference
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial load from LocalStorage
  useEffect(() => {
    setIsMounted(true);
    setSelectedDate(getTodayDateString());

    try {
      const savedEntries = localStorage.getItem('work_timer_entries');
      if (savedEntries) {
        setEntries(JSON.parse(savedEntries));
      }

      const savedShift = localStorage.getItem('work_timer_active_shift');
      if (savedShift) {
        const parsedShift: ActiveShift = JSON.parse(savedShift);
        setActiveShift(parsedShift);
        setSelectedDate(parsedShift.date);
        setSelectedLocation(parsedShift.location);
        const elapsed = Math.max(0, Math.floor((Date.now() - parsedShift.startTime) / 1000));
        setElapsedSeconds(elapsed);
      }
    } catch (err) {
      console.error('Error loading data from localStorage', err);
    }
  }, []);

  // 2. Timer tick effect
  useEffect(() => {
    if (activeShift) {
      // Calculate immediately
      const updateElapsed = () => {
        const elapsed = Math.max(0, Math.floor((Date.now() - activeShift.startTime) / 1000));
        setElapsedSeconds(elapsed);
      };

      updateElapsed();
      intervalRef.current = setInterval(updateElapsed, 1000);
    } else {
      setElapsedSeconds(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeShift]);

  // 3. Save entries to LocalStorage when changed
  const saveEntries = (newEntries: TimeEntry[]) => {
    setEntries(newEntries);
    try {
      localStorage.setItem('work_timer_entries', JSON.stringify(newEntries));
    } catch (err) {
      console.error('Error saving entries to localStorage', err);
    }
  };

  // Start shift
  const handleStart = () => {
    const newShift: ActiveShift = {
      startTime: Date.now(),
      date: selectedDate || getTodayDateString(),
      location: selectedLocation,
    };

    setActiveShift(newShift);
    setElapsedSeconds(0);
    try {
      localStorage.setItem('work_timer_active_shift', JSON.stringify(newShift));
    } catch (err) {
      console.error('Error saving active shift', err);
    }
  };

  // Stop and record shift
  const handleStop = () => {
    if (!activeShift) return;

    const endTime = Date.now();
    const durationSeconds = Math.max(1, Math.floor((endTime - activeShift.startTime) / 1000));

    const newEntry: TimeEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      date: activeShift.date,
      location: activeShift.location,
      startTime: activeShift.startTime,
      endTime,
      durationSeconds,
      notes: notes.trim() || undefined,
    };

    const updatedEntries = [newEntry, ...entries];
    saveEntries(updatedEntries);

    // Clear active shift
    setActiveShift(null);
    setElapsedSeconds(0);
    setNotes('');
    try {
      localStorage.removeItem('work_timer_active_shift');
    } catch (err) {
      console.error('Error removing active shift', err);
    }

    setRecentSaved(`¡Jornada de ${formatDurationHuman(durationSeconds)} guardada con éxito!`);
    setTimeout(() => {
      setRecentSaved(null);
    }, 4000);
  };

  // Cancel running shift without saving
  const handleCancelShift = () => {
    if (!confirm('¿Estás seguro de cancelar este fichaje en curso sin guardar?')) {
      return;
    }
    setActiveShift(null);
    setElapsedSeconds(0);
    try {
      localStorage.removeItem('work_timer_active_shift');
    } catch (err) {
      console.error('Error removing active shift', err);
    }
  };

  // Delete an entry from history
  const handleDeleteEntry = (id: string) => {
    if (confirm('¿Eliminar este registro de horas?')) {
      const updated = entries.filter((entry) => entry.id !== id);
      saveEntries(updated);
    }
  };

  // Clear all entries
  const handleClearAll = () => {
    if (entries.length === 0) return;
    if (confirm('¿Estás seguro de que quieres borrar todo el historial de fichajes?')) {
      saveEntries([]);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (entries.length === 0) return;

    const headers = ['Fecha', 'Lugar', 'Hora Inicio', 'Hora Fin', 'Duración (segundos)', 'Duración Formato', 'Notas'];
    const rows = entries.map((e) => [
      e.date,
      e.location === 'oficina' ? 'Oficina' : 'Casa',
      formatTimeOfDay(e.startTime),
      formatTimeOfDay(e.endTime),
      e.durationSeconds.toString(),
      formatDuration(e.durationSeconds),
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fichajes_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Statistics
  const todayStr = getTodayDateString();
  const todaySeconds = entries
    .filter((e) => e.date === todayStr)
    .reduce((acc, curr) => acc + curr.durationSeconds, 0) + (activeShift && activeShift.date === todayStr ? elapsedSeconds : 0);

  const totalOfficeSeconds = entries
    .filter((e) => e.location === 'oficina')
    .reduce((acc, curr) => acc + curr.durationSeconds, 0);

  const totalHomeSeconds = entries
    .filter((e) => e.location === 'casa')
    .reduce((acc, curr) => acc + curr.durationSeconds, 0);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isRunning = activeShift !== null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="p-3 bg-indigo-600 dark:bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/25">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Horas Angela
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping mr-1" />
            <span className="text-slate-600 dark:text-slate-300">Hoy: {formatDatePretty(todayStr)}</span>
          </div>
        </header>

        {/* Feedback Alert */}
        {recentSaved && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 animate-fade-in shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base">{recentSaved}</span>
          </div>
        )}

        {/* Main Clock-in Card */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* 1. Date Selector */}
            <div className="space-y-2">
              <label htmlFor="work-date" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Fecha de la Jornada
              </label>
              <div className="relative">
                <input
                  id="work-date"
                  type="date"
                  value={selectedDate}
                  disabled={isRunning}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-medium text-base"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRunning ? 'La fecha no puede modificarse con el fichaje activo.' : 'Elige el día que estás fichando.'}
              </p>
            </div>

            {/* 2. Workplace Location Dropdown */}
            <div className="space-y-2">
              <label htmlFor="work-location" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Lugar de Trabajo
              </label>
              <div className="relative">
                <select
                  id="work-location"
                  value={selectedLocation}
                  disabled={isRunning}
                  onChange={(e) => setSelectedLocation(e.target.value as WorkLocation)}
                  className="w-full appearance-none px-4 py-3 pr-10 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-medium text-base cursor-pointer"
                >
                  <option value="oficina">🏢 Oficina (Presencial)</option>
                  <option value="casa">🏠 Casa (Teletrabajo / Remoto)</option>
                </select>
                <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Indica si estás trabajando en la oficina física o en remoto.
              </p>
            </div>
          </div>

          {/* Optional notes input */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Nota opcional (ej. Proyecto Alfa, Reunión con cliente, Tareas de soporte...)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-center mb-6">
            {isRunning ? (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-sm font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <span>Jornada en curso desde las {formatTimeOfDay(activeShift.startTime)}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Listo para iniciar</span>
              </div>
            )}
          </div>

          {/* THE MAIN ACTION BUTTON WITH LIVE COUNTER */}
          <div className="flex flex-col items-center justify-center gap-4">
            {!isRunning ? (
              <button
                type="button"
                onClick={handleStart}
                className="group relative w-full sm:w-auto min-w-[320px] px-8 py-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/45 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-4 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                </div>
                <div className="text-left">
                  <span className="block text-2xl tracking-wide uppercase font-black">START</span>
                  <span className="block text-xs font-medium text-indigo-100">Iniciar registro de horas</span>
                </div>
              </button>
            ) : (
              <div className="w-full sm:w-auto flex flex-col items-center gap-3">
                {/* Active Button with Timer Display inside */}
                <button
                  type="button"
                  onClick={handleStop}
                  className="group relative w-full sm:w-auto min-w-[340px] px-8 py-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white shadow-xl shadow-red-600/30 hover:shadow-red-600/45 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-between gap-6 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Square className="w-6 h-6 fill-white" />
                    </div>
                    <div className="text-left">
                      <span className="block text-xs font-semibold uppercase tracking-wider text-rose-200">
                        Trabajando ({activeShift.location === 'oficina' ? 'Oficina' : 'Casa'})
                      </span>
                      {/* Counter displayed on button */}
                      <span className="block font-mono text-3xl font-black tracking-wider text-white">
                        {formatDuration(elapsedSeconds)}
                      </span>
                    </div>
                  </div>

                  <div className="border-l border-white/20 pl-4 text-right">
                    <span className="block text-sm font-bold uppercase tracking-wide">DETENER</span>
                    <span className="block text-[11px] text-rose-200 font-medium">Guardar</span>
                  </div>
                </button>

                {/* Cancel without saving */}
                <button
                  type="button"
                  onClick={handleCancelShift}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors py-1 px-3"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Cancelar jornada sin guardar
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Quick Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Hoy</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                {formatDuration(todaySeconds)}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Horas en Oficina</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                {formatDuration(totalOfficeSeconds)}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Horas en Casa</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                {formatDuration(totalHomeSeconds)}
              </p>
            </div>
          </div>
        </section>

        {/* History Section */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Historial de Fichajes
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {entries.length} {entries.length === 1 ? 'registro guardado' : 'registros guardados'}
                </p>
              </div>
            </div>

            {entries.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar CSV
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Vaciar
                </button>
              </div>
            )}
          </div>

          {/* List or Table */}
          {entries.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                <Briefcase className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                No hay fichajes registrados todavía.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Selecciona la fecha, el lugar y presiona START para comenzar tu primer turno.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`p-2 rounded-xl flex-shrink-0 ${
                        entry.location === 'oficina'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      }`}
                    >
                      {entry.location === 'oficina' ? (
                        <Building2 className="w-5 h-5" />
                      ) : (
                        <Home className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {formatDatePretty(entry.date)}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            entry.location === 'oficina'
                              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {entry.location === 'oficina' ? 'Oficina' : 'Casa'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>
                          {formatTimeOfDay(entry.startTime)} – {formatTimeOfDay(entry.endTime)}
                        </span>
                        {entry.notes && (
                          <span className="italic text-slate-400 dark:text-slate-500">
                            • &quot;{entry.notes}&quot;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right font-mono font-bold text-base text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                      {formatDuration(entry.durationSeconds)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry.id)}
                      title="Eliminar registro"
                      className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

