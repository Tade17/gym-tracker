import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Dumbbell, Apple, Scale, Flame, ChevronRight,
  Check, Pill, TrendingDown, TrendingUp, Minus,
  BarChart2, CalendarDays, Zap,
} from 'lucide-react';

import { useTrainingData }  from '../../training/TrainingDataContext';
import { useNutritionData } from '../../nutrition/NutritionDataContext';
import { useBodyData }      from '../../body/BodyDataContext';

import { toISODate, formatShortDate, fromISODate } from '../../../lib/date';
import { useLocalStorage }  from '../../../hooks/useLocalStorage';
import { STORAGE_KEYS }     from '../../../lib/storage';
import type { UserProfile } from '../../../types';

import { calcDay }          from '../../nutrition/utils/macros';
import { MEAL_CATEGORIES }  from '../../nutrition/constants';
import { calcStreak, lastNDays } from '../utils/streak';
import { getNextSessionHint }    from '../utils/nextSession';
import { SET_TYPE_META }    from '../../training/constants';

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  weightKg: 75, heightCm: 169, age: 21,
  proteinTargetG: 150, trainingDayKcal: 2350,
  restDayKcal: 2050, creatineReminder: true,
};

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Dashboard() {
  const { sessions, templates }      = useTrainingData();
  const { dayLogs, goals, foods }    = useNutritionData();
  const { weightEntries }            = useBodyData();

  const [profile]       = useLocalStorage<UserProfile>(STORAGE_KEYS.profile, DEFAULT_PROFILE);
  // Creatina: array de fechas en que se marcó como tomada.
  const [creatineDates, setCreatineDates] = useLocalStorage<string[]>('reminders:creatine', []);

  const today      = toISODate();
  const todayDate  = fromISODate(today);
  const dayName    = DAYS_ES[todayDate.getDay()];
  const greeting   = greetingByHour(todayDate.getHours());

  // ── Entrenamiento de hoy ────────────────────────────────────────────────
  const todaySession = useMemo(
    () => sessions.find(s => s.date === today),
    [sessions, today],
  );
  const effectiveSetsToday = useMemo(() => {
    if (!todaySession) return 0;
    return todaySession.exercises.reduce(
      (acc, e) => acc + e.sets.filter(s => s.done && SET_TYPE_META[s.type].countsAsEffective).length,
      0,
    );
  }, [todaySession]);

  // ── Nutrición de hoy ────────────────────────────────────────────────────
  const foodMap = useMemo(() => new Map(foods.map(f => [f.id, f])), [foods]);
  const todayLog = useMemo(() => dayLogs.find(l => l.date === today), [dayLogs, today]);
  const todayMacros = useMemo(
    () => todayLog ? calcDay(todayLog, foodMap) : { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    [todayLog, foodMap],
  );
  const activeGoal = (todayLog?.isTrainingDay ?? !!todaySession)
    ? goals.trainingDay : goals.restDay;

  // ── Peso corporal ───────────────────────────────────────────────────────
  const sortedWeights = useMemo(
    () => [...weightEntries].sort((a, b) => a.date.localeCompare(b.date)),
    [weightEntries],
  );
  const lastWeight  = sortedWeights.at(-1);
  const prevWeight  = sortedWeights.at(-2);
  const weightDelta = lastWeight && prevWeight
    ? +(lastWeight.weightKg - prevWeight.weightKg).toFixed(2)
    : null;

  // ── Racha ───────────────────────────────────────────────────────────────
  const streak   = useMemo(() => calcStreak(sessions, today), [sessions, today]);
  const last7    = useMemo(() => lastNDays(sessions, 7, today), [sessions, today]);

  // ── Próxima sesión ──────────────────────────────────────────────────────
  const nextHint = useMemo(
    () => getNextSessionHint(sessions, templates, today),
    [sessions, templates, today],
  );

  // ── Creatina ────────────────────────────────────────────────────────────
  const creatineTaken = creatineDates.includes(today);
  function toggleCreatine() {
    setCreatineDates(prev =>
      prev.includes(today) ? prev.filter(d => d !== today) : [...prev, today],
    );
  }

  return (
    <div className="space-y-4 pb-4">

      {/* ── Saludo ───────────────────────────────────────────────────────── */}
      <header className="pt-1">
        <p className="text-slate-400 text-sm">{greeting}</p>
        <h1 className="text-2xl font-bold">
          {profile.name ? profile.name : 'Mi Dashboard'} 👋
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {dayName} · {formatShortDate(today)}
        </p>
        {!profile.name && (
          <Link
            to="/ajustes"
            className="inline-flex items-center gap-1 text-xs text-cyan-400 mt-1 hover:text-cyan-300"
          >
            Configura tu nombre en Ajustes →
          </Link>
        )}
      </header>

      {/* ── Creatina ─────────────────────────────────────────────────────── */}
      {profile.creatineReminder && (
        <button
          onClick={toggleCreatine}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
            creatineTaken
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-slate-800 border-slate-700/40 text-slate-300'
          }`}
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            creatineTaken ? 'bg-green-500 border-green-500' : 'border-slate-500'
          }`}>
            {creatineTaken && <Check size={13} strokeWidth={3} className="text-slate-900" />}
          </div>
          <Pill size={16} className="shrink-0" />
          <div className="flex-1 text-left">
            <span className="font-medium text-sm">Creatina · 3–5 g</span>
            {creatineTaken && <span className="ml-2 text-xs text-green-400">✓ tomada hoy</span>}
          </div>
        </button>
      )}

      {/* ── Entrenamiento hoy ────────────────────────────────────────────── */}
      <section className="bg-slate-800 border border-slate-700/40 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            <Dumbbell size={16} className="text-cyan-400" />
            <span className="font-semibold text-sm">Entreno hoy</span>
          </div>
          <Link
            to={`/sesion/${today}`}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
          >
            {todaySession ? 'Ver sesión' : 'Comenzar'} <ChevronRight size={13} />
          </Link>
        </div>

        <div className="px-4 py-3">
          {todaySession && todaySession.exercises.length > 0 ? (
            <div className="space-y-1">
              <p className="font-medium">
                {todaySession.name ?? 'Sesión sin nombre'}
              </p>
              <p className="text-xs text-slate-400">
                {todaySession.exercises.length} ejercicios · {effectiveSetsToday} series efectivas
              </p>
              {/* Progreso de ejercicios completados */}
              <div className="flex gap-1 mt-2">
                {todaySession.exercises.map(e => {
                  const done = e.sets.every(s => s.done) && e.sets.length > 0;
                  const partial = !done && e.sets.some(s => s.done);
                  return (
                    <div
                      key={e.id}
                      title={e.sets.length + ' series'}
                      className={`h-1.5 flex-1 rounded-full ${
                        done ? 'bg-green-500' : partial ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400 flex items-center gap-2">
              <span>Sin sesión registrada</span>
              {nextHint.type !== 'none' && (
                <span className="text-xs bg-slate-700 rounded-lg px-2 py-0.5 text-slate-300 flex items-center gap-1">
                  <Zap size={10} />
                  {nextHint.type === 'template' ? `Plantilla: ${nextHint.label}` : `Sem pasada: ${nextHint.label}`}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Nutrición hoy ────────────────────────────────────────────────── */}
      <section className="bg-slate-800 border border-slate-700/40 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            <Apple size={16} className="text-cyan-400" />
            <span className="font-semibold text-sm">Nutrición hoy</span>
          </div>
          <Link
            to={`/nutricion/${today}`}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
          >
            {todayLog ? 'Ver detalle' : 'Registrar'} <ChevronRight size={13} />
          </Link>
        </div>

        <div className="px-4 py-3 space-y-2.5">
          {/* Barra de calorías prominente */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Calorías</span>
              <span>
                <span className={todayMacros.kcal > activeGoal.kcal ? 'text-red-400 font-semibold' : 'text-slate-200'}>
                  {Math.round(todayMacros.kcal)}
                </span>
                <span className="text-slate-500"> / {activeGoal.kcal} kcal</span>
              </span>
            </div>
            <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  todayMacros.kcal > activeGoal.kcal ? 'bg-red-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(100, (todayMacros.kcal / activeGoal.kcal) * 100)}%` }}
              />
            </div>
          </div>

          {/* Macros en fila */}
          <div className="grid grid-cols-3 gap-2">
            <MiniMacro
              label="Proteína" current={todayMacros.protein}
              target={activeGoal.protein} unit="g" color="bg-blue-400"
            />
            <MiniMacro
              label="Carbos"   current={todayMacros.carbs}
              target={activeGoal.carbs}   unit="g" color="bg-yellow-400"
            />
            <MiniMacro
              label="Grasas"   current={todayMacros.fat}
              target={activeGoal.fat}     unit="g" color="bg-pink-400"
            />
          </div>

          {/* Comidas del día en una línea */}
          {todayLog && (
            <div className="flex gap-1.5">
              {MEAL_CATEGORIES.map(cat => {
                const meal = todayLog.meals.find(m => m.category === cat);
                const hasFood = (meal?.entries.length ?? 0) > 0;
                return (
                  <div
                    key={cat}
                    title={cat}
                    className={`flex-1 h-1 rounded-full ${hasFood ? 'bg-cyan-500' : 'bg-slate-700'}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Stats: racha + peso + próxima ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">

        {/* Racha */}
        <div className="bg-slate-800 border border-slate-700/40 rounded-2xl px-4 py-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Flame size={15} className="text-orange-400" />
            <span className="text-xs text-slate-400 font-medium">Racha</span>
          </div>
          <p className="text-3xl font-bold">
            {streak}
            <span className="text-base font-normal text-slate-400 ml-1">días</span>
          </p>
          {/* Puntos últimos 7 días */}
          <div className="flex gap-1">
            {last7.map(({ date, trained }) => (
              <div
                key={date}
                title={formatShortDate(date)}
                className={`flex-1 h-2 rounded-full ${trained ? 'bg-orange-400' : 'bg-slate-700'}`}
              />
            ))}
          </div>
        </div>

        {/* Último peso */}
        <div className="bg-slate-800 border border-slate-700/40 rounded-2xl px-4 py-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Scale size={15} className="text-cyan-400" />
            <span className="text-xs text-slate-400 font-medium">Peso</span>
          </div>
          {lastWeight ? (
            <>
              <p className="text-3xl font-bold">
                {lastWeight.weightKg}
                <span className="text-base font-normal text-slate-400 ml-1">kg</span>
              </p>
              <div className="flex items-center gap-1 text-xs">
                {weightDelta === null || weightDelta === 0
                  ? <Minus size={11} className="text-slate-500" />
                  : weightDelta > 0
                    ? <TrendingUp size={11} className="text-red-400" />
                    : <TrendingDown size={11} className="text-green-400" />
                }
                <span className={
                  weightDelta === null || weightDelta === 0 ? 'text-slate-500'
                  : weightDelta > 0 ? 'text-red-400' : 'text-green-400'
                }>
                  {weightDelta === null ? 'sin comparativa'
                  : weightDelta === 0 ? 'sin cambio'
                  : `${weightDelta > 0 ? '+' : ''}${weightDelta} kg`}
                </span>
              </div>
            </>
          ) : (
            <Link to="/cuerpo" className="text-sm text-slate-500 hover:text-slate-300">
              Registra tu peso →
            </Link>
          )}
        </div>
      </div>

      {/* ── Próxima sesión ────────────────────────────────────────────────── */}
      {nextHint.type !== 'none' && !todaySession && (
        <Link
          to={`/sesion/${today}`}
          className="flex items-center justify-between bg-slate-800 border border-cyan-500/20 rounded-2xl px-4 py-3 hover:border-cyan-500/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <CalendarDays size={18} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Próxima sesión sugerida</p>
              <p className="font-semibold text-sm">{nextHint.label}</p>
              {nextHint.type === 'last-week' && nextHint.date && (
                <p className="text-[10px] text-slate-500">Semana pasada este mismo día</p>
              )}
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-500" />
        </Link>
      )}

      {/* ── Links rápidos ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <QuickLink to="/historial"     icon={<BarChart2 size={16} />}  label="Historial entreno" />
        <QuickLink to="/ejercicios"    icon={<Dumbbell  size={16} />}  label="Ejercicios"         />
        <QuickLink to="/alimentos"     icon={<Apple     size={16} />}  label="Alimentos"          />
        <QuickLink to="/plantillas"    icon={<CalendarDays size={16}/>} label="Plantillas"        />
      </div>

    </div>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function MiniMacro({ label, current, target, unit, color }: {
  label: string; current: number; target: number; unit: string; color: string;
}) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const over = current > target;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-slate-400">{label}</span>
        <span className={over ? 'text-red-400' : 'text-slate-300'}>
          {Math.round(current)}{unit}
        </span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label }: {
  to: string; icon: React.ReactNode; label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 bg-slate-800 border border-slate-700/40 hover:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors"
    >
      <span className="text-slate-500">{icon}</span>
      {label}
      <ChevronRight size={13} className="ml-auto text-slate-600" />
    </Link>
  );
}

function greetingByHour(h: number): string {
  if (h >= 5  && h < 12) return 'Buenos días';
  if (h >= 12 && h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
