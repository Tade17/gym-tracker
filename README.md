# FitTrack — App de Entrenamiento y Nutrición

PWA offline-first para registrar entrenamientos, nutrición y progreso corporal. Diseñada para móvil, sin backend ni cuenta: todos los datos se guardan localmente en el dispositivo.

**Demo:** [gleaming-marzipan-455d12.netlify.app](https://gleaming-marzipan-455d12.netlify.app)

---

## Módulos

### Entrenamiento
- Registro diario de sesiones con navegación por fechas
- Series con tipos: Calentamiento · Top Set · Back-off · Back-off 2 · Normal · Pump
- Auto-cálculo de BO (80 % del TS) y BO2 (80 % del BO) reactivo
- Comparativa de pesos con la semana anterior (indicador de progresión)
- Temporizador de descanso con presets (60 s / 90 s / 2 min / 3 min)
- Sección de cardio por sesión (actividad, duración, distancia, notas)
- Historial con volumen semanal por grupo muscular
- Biblioteca de ejercicios con CRUD, filtro por músculo y ~55 ejercicios base restaurables
- Plantillas de rutina con pesos y reps de referencia por serie
- **Copiar rutina anterior**: en un día vacío, copia cualquier sesión pasada como base

### Nutrición
- Registro diario de comidas por categoría (Desayuno · Almuerzo · Cena · Snack)
- Cálculo de macros en tiempo real (kcal · proteína · carbos · grasas)
- Barra visual de macros con objetivos configurables
- Base de datos de alimentos (CRUD, macros por 100 g, ~40 alimentos base)
- Recetario guardado: crea recetas con ingredientes y úsalas por porción (50 % / 75 % / 100 %…)
- Prompt de tipo de día (Entreno/ Descanso) para ajustar objetivos calóricos

### Cuerpo
- Registro de peso corporal con gráfico SVG de evolución
- Registro de porcentaje de grasa corporal
- Notas por entrada

### Dashboard
- Resumen del día: macros, sesión activa, racha de entrenamientos
- Calorías restantes y progreso de proteína
- Acceso rápido a la sesión de hoy

### Configuración
- Perfil: nombre, peso objetivo, altura, sexo
- Objetivos nutricionales diarios (kcal, proteína, carbos, grasas)
- Exportar / Importar backup en JSON
- Descarga de datos como respaldo antes de actualizar la app

---

## Stack técnico

| Herramienta | Versión |
|---|---|
| React | 19 |
| TypeScript | 6 |
| Vite | 8 |
| Tailwind CSS | 4 (`@tailwindcss/vite`) |
| React Router | 7 |
| vite-plugin-pwa | 1.3 (Workbox, autoUpdate) |
| Lucide React | iconos |

Sin base de datos, sin autenticación, sin backend. Todo persiste en `localStorage`.

---

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo con hot-reload
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

Requiere **Node 18+**.

---

## Deploy en Netlify

1. Ejecutar `npm run build` → genera la carpeta `dist/`
2. Arrastrar la carpeta `dist/` a [app.netlify.com/drop](https://app.netlify.com/drop)
3. El archivo `public/_redirects` ya incluye la regla SPA:
   ```
   /* /index.html 200
   ```

Para actualizar la app instalada en el móvil: el service worker detecta el nuevo build y lo activa automáticamente al recargar.

---

## Estructura del proyecto

```
src/
├── components/
│   └── Layout.tsx              # Shell con bottom nav
├── lib/
│   ├── date.ts                 # Utilidades de fecha (ISO, formateo)
│   ├── id.ts                   # uid() = crypto.randomUUID()
│   └── storage.ts              # Claves de localStorage
├── modules/
│   ├── training/
│   │   ├── TrainingDataContext.tsx
│   │   ├── components/
│   │   │   ├── ExerciseBlock.tsx   # Bloque de ejercicio con sets
│   │   │   ├── CardioSection.tsx
│   │   │   ├── RestTimer.tsx
│   │   │   └── SetTypeBadge.tsx
│   │   └── pages/
│   │       ├── SessionEditor.tsx   # Registro diario
│   │       ├── History.tsx
│   │       ├── ExerciseLibrary.tsx
│   │       ├── Templates.tsx
│   │       └── Settings.tsx
│   ├── nutrition/
│   │   ├── NutritionDataContext.tsx
│   │   ├── utils/
│   │   │   ├── macros.ts           # Cálculo de macros y recetas
│   │   │   └── recipeSeeder.ts     # Resolución de recetas base
│   │   └── pages/
│   │       ├── NutritionDay.tsx
│   │       ├── FoodDatabase.tsx
│   │       └── RecipeLibrary.tsx
│   ├── body/
│   │   ├── BodyDataContext.tsx
│   │   └── pages/
│   │       └── BodyTracking.tsx
│   └── dashboard/
│       └── pages/
│           └── Dashboard.tsx
├── types.ts                    # Todos los tipos TypeScript
└── App.tsx                     # Rutas principales
```

---

## Datos y privacidad

Todos los datos se almacenan **únicamente en el dispositivo** mediante `localStorage`. No se envía ningún dato a ningún servidor. Para hacer respaldo o migrar a otro dispositivo, usa la función **Exportar backup** en Configuración → importa el JSON en el nuevo dispositivo.

---

## Instalación como PWA

1. Abrir la URL en Chrome/Safari móvil
2. Android: menú → *"Añadir a pantalla de inicio"*
3. iOS: compartir → *"Añadir a pantalla de inicio"*

La app funciona **sin conexión** una vez instalada.
