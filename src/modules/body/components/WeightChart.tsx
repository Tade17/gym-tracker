import type { WeightEntry } from '../../../types';
import { fromISODate } from '../../../lib/date';

interface Props {
  entries: WeightEntry[]; // ya ordenados de más antiguo a más reciente
}

// Gráfica SVG pura — sin recharts, sin D3, sin dependencias.
//
// Cómo funciona:
// 1. Definimos un "viewBox" de coordenadas virtuales (600×220).
//    El SVG se escala al contenedor con width="100%".
// 2. Calculamos min/max del peso para escalar los puntos al eje Y.
// 3. Distribuimos los puntos equiespaciados en el eje X.
// 4. Generamos un <path d="M x0,y0 L x1,y1 ..."> para la línea.
// 5. Un <path> de relleno con área bajo la curva (misma línea + cierre).

const W = 600;
const H = 220;
const PAD = { top: 16, right: 20, bottom: 40, left: 44 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

export default function WeightChart({ entries }: Props) {
  if (entries.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
        Registra al menos 2 pesajes para ver la gráfica
      </div>
    );
  }

  // Mostrar máximo los últimos 20 puntos para no saturar el eje X.
  const visible = entries.slice(-20);
  const n = visible.length;

  const weights = visible.map(e => e.weightKg);
  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);
  // Añadir margen arriba y abajo para que los puntos no toquen el borde.
  const margin = Math.max((rawMax - rawMin) * 0.3, 1);
  const yMin = rawMin - margin;
  const yMax = rawMax + margin;

  // Convierte (índice, peso) → coordenadas SVG
  function toX(i: number): number {
    return PAD.left + (i / (n - 1)) * CHART_W;
  }
  function toY(kg: number): number {
    // Y=0 está arriba en SVG, por eso invertimos la fórmula.
    return PAD.top + (1 - (kg - yMin) / (yMax - yMin)) * CHART_H;
  }

  // Construir el path de la línea: "M x0,y0 L x1,y1 ..."
  const linePath = visible.map((e, i) =>
    `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)},${toY(e.weightKg).toFixed(1)}`
  ).join(' ');

  // Path de relleno: línea + borde inferior + cierre
  const firstX = toX(0).toFixed(1);
  const lastX  = toX(n - 1).toFixed(1);
  const baseY  = (PAD.top + CHART_H).toFixed(1);
  const fillPath = `${linePath} L ${lastX},${baseY} L ${firstX},${baseY} Z`;

  // Etiquetas Y: 4 valores equidistantes entre yMin y yMax
  const yTicks = Array.from({ length: 4 }, (_, i) => {
    const kg = yMin + (i / 3) * (yMax - yMin);
    return { y: toY(kg), label: kg.toFixed(1) };
  });

  // Etiquetas X: mostrar máx 5 fechas distribuidas
  const xStep = Math.max(1, Math.floor(n / 5));
  const xTicks = visible
    .map((e, i) => ({ i, date: e.date }))
    .filter((_, i) => i % xStep === 0 || i === n - 1);

  function formatDate(iso: string): string {
    const d = fromISODate(iso);
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      aria-label="Gráfica de evolución del peso"
    >
      {/* Grid lines horizontales */}
      {yTicks.map(({ y }) => (
        <line
          key={y}
          x1={PAD.left} y1={y.toFixed(1)}
          x2={W - PAD.right} y2={y.toFixed(1)}
          stroke="#334155" strokeWidth="1"
        />
      ))}

      {/* Área de relleno bajo la curva */}
      <path
        d={fillPath}
        fill="url(#weightGradient)"
        opacity="0.35"
      />

      {/* Gradiente para el relleno */}
      <defs>
        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Línea principal */}
      <path
        d={linePath}
        fill="none"
        stroke="#22d3ee"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Puntos */}
      {visible.map((e, i) => (
        <circle
          key={e.id}
          cx={toX(i).toFixed(1)}
          cy={toY(e.weightKg).toFixed(1)}
          r="3.5"
          fill="#22d3ee"
          stroke="#0f172a"
          strokeWidth="1.5"
        />
      ))}

      {/* Etiquetas Y */}
      {yTicks.map(({ y, label }) => (
        <text
          key={label}
          x={PAD.left - 6}
          y={y.toFixed(1)}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize="11"
          fill="#64748b"
        >
          {label}
        </text>
      ))}

      {/* Etiquetas X */}
      {xTicks.map(({ i, date }) => (
        <text
          key={date}
          x={toX(i).toFixed(1)}
          y={H - PAD.bottom + 16}
          textAnchor="middle"
          fontSize="11"
          fill="#64748b"
        >
          {formatDate(date)}
        </text>
      ))}
    </svg>
  );
}
