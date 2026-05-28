// Tipos compartidos por toda la app. Pensar en esto primero es clave en TS:
// el modelo de datos manda, los componentes lo consumen.

export type MuscleGroup =
  | 'pecho'
  | 'espalda'
  | 'hombros'
  | 'cuadriceps'
  | 'isquios'
  | 'gluteos'
  | 'biceps'
  | 'triceps'
  | 'pantorrillas'
  | 'core'
  | 'antebrazo'
  | 'otro';

// Cada tipo de serie tiene reglas distintas (RIR objetivo, si cuenta en volumen, etc.).
// Esto es una "union literal" — la variable solo puede tener uno de estos valores exactos.
export type SetType = 'warmup' | 'topset' | 'backoff' | 'backoff2' | 'normal' | 'pump';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  notes?: string; // el `?` significa "opcional"
}

export interface SetEntry {
  id: string;
  type: SetType;
  weight: number; // kg
  reps: number;
  rir?: number;   // RIR auto-reportado (opcional)
  done: boolean;  // marcado como completado durante la sesión
}

export interface ExerciseEntry {
  id: string;
  exerciseId: string;     // referencia a Exercise.id (no embebemos el ejercicio entero)
  sets: SetEntry[];
  notes?: string;
}

// Cardio al final de la sesión (cinta, bici, elíptica, etc.)
export interface CardioEntry {
  id: string;
  type: string;        // "Cinta", "Bicicleta estática", "Elíptica", etc.
  durationMin: number;
  notes?: string;
}

export interface Session {
  id: string;
  date: string;           // formato ISO "YYYY-MM-DD" — fácil de ordenar y comparar
  name?: string;          // "Push", "Pull", "Pierna", etc.
  exercises: ExerciseEntry[];
  cardio?: CardioEntry[]; // cardio al final (opcional, puede haber varios)
  notes?: string;         // sensaciones, energía, dolor
  durationMin?: number;
}

// Plantillas de rutina — guardan la estructura sin pesos concretos.
export interface TemplateSet {
  type: SetType;
  targetReps?: number;
  referenceWeight?: number; // peso de referencia orientativo (kg)
}

export interface TemplateExercise {
  exerciseId: string;
  plannedSets: TemplateSet[];
}

export interface Template {
  id: string;
  name: string;
  exercises: TemplateExercise[];
}

// Perfil del usuario — datos iniciales y objetivos.
export interface UserProfile {
  name: string;
  weightKg: number;
  heightCm: number;
  age: number;
  proteinTargetG: number;
  trainingDayKcal: number;
  restDayKcal: number;
  creatineReminder: boolean;
}

// ─── MÓDULO 2: NUTRICIÓN ──────────────────────────────────────────────────────

// Alimento de la base de datos local. Macros expresados por 100g.
export interface Food {
  id: string;
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

// Las 5 categorías de comida del día.
export type MealCategory = 'desayuno' | 'almuerzo' | 'merienda' | 'preentreno' | 'cena';

// Un alimento consumido: referencia al Food + cantidad en gramos.
// Separamos la referencia de la cantidad para poder editar el alimento base sin
// perder el historial de consumo.
export interface FoodEntry {
  id: string;
  foodId: string;
  grams: number;
}

// Una comida del día: agrupa varias entradas de alimentos.
export interface Meal {
  category: MealCategory;
  entries: FoodEntry[];
}

// Ingrediente dentro de una receta: referencia a Food + cantidad.
export interface RecipeIngredient {
  foodId: string;
  grams: number;
}

// Receta guardada: nombre + lista de ingredientes con sus cantidades.
export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
}

// Uso de una receta en un día: a qué comida pertenece y qué porción se tomó.
// portionPct = 100 significa "receta completa", 80 = "80% de la receta".
export interface RecipeUse {
  id: string;
  recipeId: string;
  mealCategory: MealCategory;
  portionPct: number;
}

// Log de un día completo de nutrición.
export interface DayLog {
  id: string;
  date: string;           // YYYY-MM-DD
  meals: Meal[];
  recipeUses?: RecipeUse[]; // recetas añadidas al día (referencia, no expansión)
  isTrainingDay: boolean; // afecta los objetivos de kcal/carbs
}

// Objetivos de macros para un tipo de día.
export interface MacroGoal {
  kcal: number;
  protein: number; // gramos
  carbs: number;   // gramos
  fat: number;     // gramos
}

// Macros calculados (mismo shape que MacroGoal para hacer comparaciones directas).
export type MacroTotals = MacroGoal;

// ─── MÓDULO 3: SEGUIMIENTO CORPORAL ──────────────────────────────────────────

// Una entrada de peso. Registramos por fecha (no múltiples por día) para
// que la gráfica sea limpia y la comparación semanal sea directa.
export interface WeightEntry {
  id: string;
  date: string;      // YYYY-MM-DD
  weightKg: number;
  notes?: string;    // sensaciones, dolor, energía del día
}

// Foto de progreso almacenada como Data URL (base64).
// Ventaja: funciona 100% offline sin servidor.
// Limitación: localStorage tiene ~5-10 MB de límite; avisar al usuario.
export interface ProgressPhoto {
  id: string;
  date: string;      // YYYY-MM-DD
  dataUrl: string;   // "data:image/jpeg;base64,..."
  notes?: string;
}
