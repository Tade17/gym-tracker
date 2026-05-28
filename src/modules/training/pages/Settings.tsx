import { useRef, useState } from 'react';
import {
  Download, Upload, Trash2, AlertTriangle,
  Shield, User, Target, Bell, Check,
} from 'lucide-react';
import type { UserProfile } from '../../../types';
import { useLocalStorage }  from '../../../hooks/useLocalStorage';
import { STORAGE_KEYS, exportAll, importAll, storageUsageKB } from '../../../lib/storage';
import { useNutritionData } from '../../nutrition/NutritionDataContext';

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  weightKg: 75, heightCm: 169, age: 21,
  proteinTargetG: 150, trainingDayKcal: 2350,
  restDayKcal: 2050, creatineReminder: true,
};

export default function Settings() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useLocalStorage<UserProfile>(STORAGE_KEYS.profile, DEFAULT_PROFILE);
  const { setGoals } = useNutritionData();
  const [saved, setSaved] = useState(false);

  // Form state espeja el perfil guardado
  const [form, setForm] = useState<UserProfile>(profile);

  function set<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function saveProfile() {
    setProfile(form);
    // Sincronizar objetivos de nutrición con lo que el usuario configuró.
    setGoals(prev => ({
      trainingDay: {
        ...prev.trainingDay,
        kcal:    form.trainingDayKcal,
        protein: form.proteinTargetG,
      },
      restDay: {
        ...prev.restDay,
        kcal:    form.restDayKcal,
        protein: form.proteinTargetG,
      },
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // ── Backup ──────────────────────────────────────────────────────────────
  function downloadBackup() {
    const json = exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `entrenamiento-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('Esto reemplazará todos tus datos locales. ¿Continuar?')) {
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importAll(reader.result as string);
        alert('Importado correctamente. La página se recargará.');
        window.location.reload();
      } catch (err) {
        alert('Archivo inválido: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  }

  function clearAll() {
    if (!confirm('Esto BORRARÁ todos los datos locales. ¿Estás seguro?')) return;
    if (!confirm('Última oportunidad. ¿Confirmas el borrado total?')) return;
    localStorage.clear();
    window.location.reload();
  }

  const usedKB = storageUsageKB();

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-2xl font-bold">Ajustes</h1>

      {/* ── Perfil ──────────────────────────────────────────────────────── */}
      <section className="bg-slate-800 border border-slate-700/40 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <User size={16} className="text-cyan-400" />
          <h2 className="font-semibold">Perfil</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <FieldLabel>Nombre</FieldLabel>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Tu nombre"
              className="field-input"
            />
          </div>
          <div>
            <FieldLabel>Peso (kg)</FieldLabel>
            <input type="number" inputMode="decimal"
              value={form.weightKg || ''}
              onChange={e => set('weightKg', parseFloat(e.target.value) || 0)}
              className="field-input"
            />
          </div>
          <div>
            <FieldLabel>Altura (cm)</FieldLabel>
            <input type="number" inputMode="numeric"
              value={form.heightCm || ''}
              onChange={e => set('heightCm', parseInt(e.target.value) || 0)}
              className="field-input"
            />
          </div>
          <div>
            <FieldLabel>Edad</FieldLabel>
            <input type="number" inputMode="numeric"
              value={form.age || ''}
              onChange={e => set('age', parseInt(e.target.value) || 0)}
              className="field-input"
            />
          </div>
        </div>
      </section>

      {/* ── Objetivos nutricionales ─────────────────────────────────────── */}
      <section className="bg-slate-800 border border-slate-700/40 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-cyan-400" />
          <h2 className="font-semibold">Objetivos nutricionales</h2>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Día de entrenamiento</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Calorías (kcal)</FieldLabel>
              <input type="number" inputMode="numeric"
                value={form.trainingDayKcal || ''}
                onChange={e => set('trainingDayKcal', parseInt(e.target.value) || 0)}
                className="field-input"
              />
            </div>
            <div>
              <FieldLabel>Proteína (g)</FieldLabel>
              <input type="number" inputMode="numeric"
                value={form.proteinTargetG || ''}
                onChange={e => set('proteinTargetG', parseInt(e.target.value) || 0)}
                className="field-input"
              />
            </div>
          </div>

          <p className="text-xs text-slate-400 uppercase tracking-wide pt-1">Día de descanso</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Calorías (kcal)</FieldLabel>
              <input type="number" inputMode="numeric"
                value={form.restDayKcal || ''}
                onChange={e => set('restDayKcal', parseInt(e.target.value) || 0)}
                className="field-input"
              />
            </div>
            <div>
              <FieldLabel>Proteína (g)</FieldLabel>
              <input type="number" inputMode="numeric"
                value={form.proteinTargetG || ''}
                readOnly
                className="field-input opacity-50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Recordatorios ───────────────────────────────────────────────── */}
      <section className="bg-slate-800 border border-slate-700/40 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-cyan-400" />
          <h2 className="font-semibold">Recordatorios</h2>
        </div>
        <button
          onClick={() => set('creatineReminder', !form.creatineReminder)}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-900 rounded-xl"
        >
          <span className="text-sm">Recordatorio de creatina (3–5 g)</span>
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            form.creatineReminder
              ? 'bg-cyan-500 border-cyan-500'
              : 'border-slate-600'
          }`}>
            {form.creatineReminder && <Check size={12} strokeWidth={3} className="text-slate-900" />}
          </div>
        </button>
      </section>

      {/* ── Botón guardar ───────────────────────────────────────────────── */}
      <button
        onClick={saveProfile}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold transition-all ${
          saved
            ? 'bg-green-500 text-slate-900'
            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900'
        }`}
      >
        {saved ? <><Check size={16} /> Guardado</> : 'Guardar cambios'}
      </button>

      {/* ── Backup ──────────────────────────────────────────────────────── */}
      <section className="bg-slate-800 border border-slate-700/40 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-cyan-400" />
            <h2 className="font-semibold">Copia de seguridad</h2>
          </div>
          <span className="text-xs text-slate-500">{usedKB} KB usado</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Todos los datos son locales. Exporta a JSON periódicamente.
        </p>
        <button
          onClick={downloadBackup}
          className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold py-2.5 rounded-xl transition-colors"
        >
          <Download size={16} /> Descargar backup JSON
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 rounded-xl transition-colors"
        >
          <Upload size={16} /> Importar desde JSON
        </button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
      </section>

      {/* ── Zona peligrosa ──────────────────────────────────────────────── */}
      <section className="bg-slate-800 border border-red-900/40 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400" />
          <h2 className="font-semibold text-red-400">Zona peligrosa</h2>
        </div>
        <button
          onClick={clearAll}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          <Trash2 size={16} /> Borrar todos los datos
        </button>
      </section>

      <p className="text-xs text-slate-600 text-center">
        Módulos activos: Entrenamiento · Nutrición · Cuerpo · Dashboard
      </p>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs text-slate-400 mb-1">{children}</label>;
}
