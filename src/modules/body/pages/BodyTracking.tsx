import { useMemo, useRef, useState } from 'react';
import {
  Scale, Camera, Trash2, TrendingUp, TrendingDown,
  Minus, Plus, ChevronDown, ChevronUp, ImageOff, X,
} from 'lucide-react';
import type { WeightEntry, ProgressPhoto } from '../../../types';
import { useBodyData } from '../BodyDataContext';
import { toISODate, formatShortDate } from '../../../lib/date';
import { uid } from '../../../lib/id';
import { storageUsageKB } from '../../../lib/storage';
import WeightChart from '../components/WeightChart';

// ─── Página principal de seguimiento corporal ─────────────────────────────────
export default function BodyTracking() {
  const { weightEntries, setWeightEntries, photos, setPhotos } = useBodyData();

  const sorted = useMemo(
    () => [...weightEntries].sort((a, b) => a.date.localeCompare(b.date)),
    [weightEntries],
  );

  const latest = sorted.at(-1);
  const previous = sorted.at(-2);

  const delta = latest && previous
    ? +(latest.weightKg - previous.weightKg).toFixed(2)
    : null;

  // ─── Formulario de nuevo pesaje ───────────────────────────────────────────
  const [date,   setDate]   = useState(toISODate());
  const [weight, setWeight] = useState('');
  const [notes,  setNotes]  = useState('');

  function saveWeight() {
    const kg = parseFloat(weight);
    if (!kg || kg < 20 || kg > 300) return;
    // Si ya existe una entrada para esa fecha, la actualizamos.
    const existing = weightEntries.find(e => e.date === date);
    if (existing) {
      setWeightEntries(prev =>
        prev.map(e => e.date === date ? { ...e, weightKg: kg, notes: notes || undefined } : e)
      );
    } else {
      const entry: WeightEntry = { id: uid(), date, weightKg: kg, notes: notes || undefined };
      setWeightEntries(prev => [...prev, entry]);
    }
    setWeight('');
    setNotes('');
  }

  function deleteWeight(id: string) {
    if (!confirm('¿Eliminar este pesaje?')) return;
    setWeightEntries(prev => prev.filter(e => e.id !== id));
  }

  // ─── Fotos ────────────────────────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoDate, setPhotoDate] = useState(toISODate());
  const [photoNotes, setPhotoNotes] = useState('');
  const [viewPhoto, setViewPhoto] = useState<ProgressPhoto | null>(null);
  const [photosExpanded, setPhotosExpanded] = useState(true);
  const usedKB = storageUsageKB();

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Advertir si ya estamos cerca del límite de localStorage (~5 MB).
    if (usedKB > 4000) {
      alert('Espacio casi lleno (~5 MB límite). Elimina fotos antiguas o exporta el backup.');
      e.target.value = '';
      return;
    }

    // FileReader lee el archivo y lo convierte a base64 de forma asíncrona.
    // Esto es lo que permite guardar la imagen en localStorage sin un servidor.
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;

      // Comprimir: si el archivo supera 800 KB, redimensionamos con canvas.
      if (file.size > 800_000) {
        compressImage(dataUrl, 0.75).then(compressed => {
          addPhoto(compressed);
        });
      } else {
        addPhoto(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function addPhoto(dataUrl: string) {
    const photo: ProgressPhoto = {
      id: uid(),
      date: photoDate,
      dataUrl,
      notes: photoNotes || undefined,
    };
    setPhotos(prev => [...prev, photo]);
    setPhotoNotes('');
  }

  function deletePhoto(id: string) {
    if (!confirm('¿Eliminar esta foto?')) return;
    setPhotos(prev => prev.filter(p => p.id !== id));
    if (viewPhoto?.id === id) setViewPhoto(null);
  }

  const photosSorted = useMemo(
    () => [...photos].sort((a, b) => b.date.localeCompare(a.date)),
    [photos],
  );

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Scale size={22} className="text-cyan-400" />
        <h1 className="text-2xl font-bold">Cuerpo</h1>
      </div>

      {/* Resumen rápido */}
      {latest && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Último peso" value={`${latest.weightKg} kg`} />
          <StatCard
            label="Cambio"
            value={
              delta === null ? '—'
              : delta === 0 ? '= 0 kg'
              : `${delta > 0 ? '+' : ''}${delta} kg`
            }
            icon={
              delta === null || delta === 0 ? <Minus size={14} className="text-slate-400" />
              : delta > 0 ? <TrendingUp size={14} className="text-red-400" />
              : <TrendingDown size={14} className="text-green-400" />
            }
            valueColor={
              delta === null || delta === 0 ? undefined
              : delta > 0 ? 'text-red-400'
              : 'text-green-400'
            }
          />
          <StatCard label="Registros" value={String(weightEntries.length)} />
        </div>
      )}

      {/* Formulario nuevo pesaje */}
      <section className="bg-slate-800 border border-slate-700/40 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-sm">Registrar peso</h2>

        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-500"
          />
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="75.0"
              className="w-24 bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-center outline-none focus:border-cyan-500"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">kg</span>
          </div>
        </div>

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notas: energía, sensaciones, horas de sueño..."
          rows={2}
          className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-sm placeholder:text-slate-600 resize-none outline-none focus:border-slate-500"
        />

        <button
          onClick={saveWeight}
          disabled={!weight || parseFloat(weight) < 20}
          className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-colors"
        >
          <Plus size={16} /> Guardar pesaje
        </button>
      </section>

      {/* Gráfica */}
      {sorted.length >= 2 && (
        <section className="bg-slate-800 border border-slate-700/40 rounded-2xl p-4">
          <h2 className="font-semibold text-sm mb-3">Evolución del peso</h2>
          <WeightChart entries={sorted} />
        </section>
      )}

      {/* Lista de pesajes */}
      {sorted.length > 0 && (
        <section className="bg-slate-800 border border-slate-700/40 rounded-2xl overflow-hidden">
          <h2 className="font-semibold text-sm px-4 py-3 border-b border-slate-700/40">
            Historial de pesajes
          </h2>
          <ul className="divide-y divide-slate-700/30">
            {[...sorted].reverse().map((entry, i, arr) => {
              const prev = arr[i + 1];
              const d = prev ? +(entry.weightKg - prev.weightKg).toFixed(2) : null;
              return (
                <li key={entry.id} className="flex items-center justify-between px-4 py-3 gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{entry.weightKg} kg</span>
                      {d !== null && d !== 0 && (
                        <span className={`text-xs flex items-center gap-0.5 ${d > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {d > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {d > 0 ? '+' : ''}{d}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{formatShortDate(entry.date)}</div>
                    {entry.notes && (
                      <div className="text-xs text-slate-500 mt-1 italic">{entry.notes}</div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteWeight(entry.id)}
                    className="p-2 text-slate-600 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Sección de fotos */}
      <section className="bg-slate-800 border border-slate-700/40 rounded-2xl overflow-hidden">
        {/* Header de fotos */}
        <button
          onClick={() => setPhotosExpanded(e => !e)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-700/40"
        >
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-slate-400" />
            <span className="font-semibold text-sm">Fotos de progreso</span>
            <span className="text-xs text-slate-500 bg-slate-700 rounded px-1.5 py-0.5">
              {photos.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600">{usedKB} KB / ~5 MB</span>
            {photosExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
          </div>
        </button>

        {photosExpanded && (
          <div className="p-4 space-y-3">
            {/* Upload */}
            <div className="flex gap-2">
              <input
                type="date"
                value={photoDate}
                onChange={e => setPhotoDate(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-xl text-sm transition-colors"
              >
                <Camera size={15} /> Subir foto
              </button>
            </div>
            <input
              type="file"
              ref={fileRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <input
              value={photoNotes}
              onChange={e => setPhotoNotes(e.target.value)}
              placeholder="Notas de la foto (opcional)"
              className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-sm outline-none"
            />

            {/* Galería en grid */}
            {photosSorted.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-slate-600">
                <ImageOff size={32} strokeWidth={1.5} />
                <span className="text-sm">Sin fotos todavía</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photosSorted.map(photo => (
                  <button
                    key={photo.id}
                    onClick={() => setViewPhoto(photo)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 group"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={`Progreso ${photo.date}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-4 pb-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-[10px] text-white">{formatShortDate(photo.date)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Visor de foto ampliada */}
      {viewPhoto && (
        <PhotoViewer
          photo={viewPhoto}
          onClose={() => setViewPhoto(null)}
          onDelete={() => deletePhoto(viewPhoto.id)}
        />
      )}
    </div>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function StatCard({ label, value, icon, valueColor }: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700/40 rounded-2xl px-3 py-3 text-center">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`font-bold text-sm flex items-center justify-center gap-1 ${valueColor ?? 'text-slate-200'}`}>
        {icon}
        {value}
      </div>
    </div>
  );
}

function PhotoViewer({ photo, onClose, onDelete }: {
  photo: ProgressPhoto;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/90 z-30 flex flex-col"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-black/40 shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <div className="font-medium text-sm">{formatShortDate(photo.date)}</div>
          {photo.notes && (
            <div className="text-xs text-slate-400 mt-0.5">{photo.notes}</div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onDelete}
            className="text-red-400 hover:text-red-300 transition-colors p-2"
          >
            <Trash2 size={18} />
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Imagen */}
      <div className="flex-1 flex items-center justify-center p-4">
        <img
          src={photo.dataUrl}
          alt={`Progreso ${photo.date}`}
          className="max-w-full max-h-full object-contain rounded-xl"
          onClick={e => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

// ─── Compresión de imagen con Canvas ─────────────────────────────────────────
// Decisión: comprimimos en cliente antes de guardar en localStorage.
// Canvas.toBlob / toDataURL con quality=0.75 reduce ~70-80% el tamaño
// de una foto de cámara sin pérdida visual apreciable.
function compressImage(dataUrl: string, quality: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1200; // px en el lado más largo
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}
