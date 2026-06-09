export type ExercisePreset = {
  name: string;
  category: string;
  defaultSets?: number;
  defaultReps?: string;
  defaultRest?: number;
};

export const EXERCISE_PRESETS: ExercisePreset[] = [
  // Peito
  { name: "Supino reto com barra", category: "Peito", defaultSets: 4, defaultReps: "8-10", defaultRest: 90 },
  { name: "Supino inclinado com barra", category: "Peito", defaultSets: 4, defaultReps: "8-10", defaultRest: 90 },
  { name: "Supino declinado com barra", category: "Peito", defaultSets: 3, defaultReps: "10-12", defaultRest: 90 },
  { name: "Supino reto com halteres", category: "Peito", defaultSets: 4, defaultReps: "10-12", defaultRest: 90 },
  { name: "Supino inclinado com halteres", category: "Peito", defaultSets: 4, defaultReps: "10-12", defaultRest: 90 },
  { name: "Crucifixo reto", category: "Peito", defaultSets: 3, defaultReps: "12-15", defaultRest: 60 },
  { name: "Crucifixo inclinado", category: "Peito", defaultSets: 3, defaultReps: "12-15", defaultRest: 60 },
  { name: "Crossover no cabo", category: "Peito", defaultSets: 3, defaultReps: "12-15", defaultRest: 60 },
  { name: "Flexão de braços", category: "Peito", defaultSets: 3, defaultReps: "15-20", defaultRest: 60 },
  { name: "Peck deck", category: "Peito", defaultSets: 3, defaultReps: "12-15", defaultRest: 60 },
  { name: "Pullover com halter", category: "Peito", defaultSets: 3, defaultReps: "12", defaultRest: 60 },

  // Costas
  { name: "Barra fixa pronada", category: "Costas", defaultSets: 4, defaultReps: "6-10", defaultRest: 90 },
  { name: "Barra fixa supinada", category: "Costas", defaultSets: 4, defaultReps: "6-10", defaultRest: 90 },
  { name: "Puxada frontal aberta", category: "Costas", defaultSets: 4, defaultReps: "10-12", defaultRest: 90 },
  { name: "Puxada frontal fechada", category: "Costas", defaultSets: 4, defaultReps: "10-12", defaultRest: 90 },
  { name: "Remada curvada com barra", category: "Costas", defaultSets: 4, defaultReps: "8-10", defaultRest: 90 },
  { name: "Remada unilateral com halter", category: "Costas", defaultSets: 3, defaultReps: "10-12", defaultRest: 75 },
  { name: "Remada baixa no cabo", category: "Costas", defaultSets: 4, defaultReps: "10-12", defaultRest: 75 },
  { name: "Remada cavalinho", category: "Costas", defaultSets: 3, defaultReps: "10-12", defaultRest: 75 },
  { name: "Levantamento terra", category: "Costas", defaultSets: 4, defaultReps: "5-8", defaultRest: 120 },
  { name: "Pulldown no cabo", category: "Costas", defaultSets: 3, defaultReps: "12-15", defaultRest: 60 },
  { name: "Remada alta com barra", category: "Costas", defaultSets: 3, defaultReps: "12", defaultRest: 60 },

  // Ombros
  { name: "Desenvolvimento com barra", category: "Ombros", defaultSets: 4, defaultReps: "8-10", defaultRest: 90 },
  { name: "Desenvolvimento com halteres", category: "Ombros", defaultSets: 4, defaultReps: "10-12", defaultRest: 90 },
  { name: "Desenvolvimento Arnold", category: "Ombros", defaultSets: 3, defaultReps: "10-12", defaultRest: 75 },
  { name: "Elevação lateral", category: "Ombros", defaultSets: 3, defaultReps: "12-15", defaultRest: 60 },
  { name: "Elevação frontal", category: "Ombros", defaultSets: 3, defaultReps: "12-15", defaultRest: 60 },
  { name: "Elevação lateral no cabo", category: "Ombros", defaultSets: 3, defaultReps: "12-15", defaultRest: 60 },
  { name: "Crucifixo inverso", category: "Ombros", defaultSets: 3, defaultReps: "12-15", defaultRest: 60 },
  { name: "Encolhimento de ombros", category: "Ombros", defaultSets: 4, defaultReps: "12-15", defaultRest: 60 },

  // Bíceps
  { name: "Rosca direta com barra", category: "Bíceps", defaultSets: 3, defaultReps: "10-12", defaultRest: 60 },
  { name: "Rosca alternada com halteres", category: "Bíceps", defaultSets: 3, defaultReps: "10-12", defaultRest: 60 },
  { name: "Rosca martelo", category: "Bíceps", defaultSets: 3, defaultReps: "10-12", defaultRest: 60 },
  { name: "Rosca concentrada", category: "Bíceps", defaultSets: 3, defaultReps: "12", defaultRest: 60 },
  { name: "Rosca scott", category: "Bíceps", defaultSets: 3, defaultReps: "10-12", defaultRest: 60 },
  { name: "Rosca no cabo", category: "Bíceps", defaultSets: 3, defaultReps: "12-15", defaultRest: 60 },

  // Tríceps
  { name: "Tríceps testa com barra", category: "Tríceps", defaultSets: 3, defaultReps: "10-12", defaultRest: 60 },
  { name: "Tríceps corda no cabo", category: "Tríceps", defaultSets: 3, defaultReps: "12-15", defaultRest: 60 },
  { name: "Tríceps francês com halter", category: "Tríceps", defaultSets: 3, defaultReps: "10-12", defaultRest: 60 },
  { name: "Mergulho entre bancos", category: "Tríceps", defaultSets: 3, defaultReps: "12-15", defaultRest: 60 },
  { name: "Tríceps coice", category: "Tríceps", defaultSets: 3, defaultReps: "12-15", defaultRest: 60 },
  { name: "Supino fechado", category: "Tríceps", defaultSets: 3, defaultReps: "8-10", defaultRest: 75 },

  // Pernas — quadríceps
  { name: "Agachamento livre", category: "Quadríceps", defaultSets: 4, defaultReps: "8-10", defaultRest: 120 },
  { name: "Agachamento frontal", category: "Quadríceps", defaultSets: 4, defaultReps: "8-10", defaultRest: 120 },
  { name: "Leg press 45°", category: "Quadríceps", defaultSets: 4, defaultReps: "10-12", defaultRest: 90 },
  { name: "Hack squat", category: "Quadríceps", defaultSets: 4, defaultReps: "10-12", defaultRest: 90 },
  { name: "Cadeira extensora", category: "Quadríceps", defaultSets: 3, defaultReps: "12-15", defaultRest: 60 },
  { name: "Afundo com halteres", category: "Quadríceps", defaultSets: 3, defaultReps: "10-12", defaultRest: 75 },
  { name: "Passada caminhando", category: "Quadríceps", defaultSets: 3, defaultReps: "12", defaultRest: 75 },
  { name: "Agachamento búlgaro", category: "Quadríceps", defaultSets: 3, defaultReps: "10-12", defaultRest: 75 },

  // Posterior e glúteos
  { name: "Mesa flexora", category: "Posterior", defaultSets: 3, defaultReps: "10-12", defaultRest: 60 },
  { name: "Stiff com barra", category: "Posterior", defaultSets: 4, defaultReps: "8-10", defaultRest: 90 },
  { name: "Stiff com halteres", category: "Posterior", defaultSets: 3, defaultReps: "10-12", defaultRest: 75 },
  { name: "Levantamento terra romeno", category: "Posterior", defaultSets: 4, defaultReps: "8-10", defaultRest: 90 },
  { name: "Good morning", category: "Posterior", defaultSets: 3, defaultReps: "10-12", defaultRest: 75 },
  { name: "Glúteo no cabo", category: "Glúteos", defaultSets: 3, defaultReps: "12-15", defaultRest: 60 },
  { name: "Elevação pélvica", category: "Glúteos", defaultSets: 4, defaultReps: "12-15", defaultRest: 60 },
  { name: "Abdução de quadril", category: "Glúteos", defaultSets: 3, defaultReps: "15", defaultRest: 45 },
  { name: "Agachamento sumô", category: "Glúteos", defaultSets: 4, defaultReps: "10-12", defaultRest: 90 },

  // Panturrilha
  { name: "Panturrilha em pé", category: "Panturrilha", defaultSets: 4, defaultReps: "15-20", defaultRest: 45 },
  { name: "Panturrilha sentado", category: "Panturrilha", defaultSets: 4, defaultReps: "15-20", defaultRest: 45 },
  { name: "Panturrilha no leg press", category: "Panturrilha", defaultSets: 4, defaultReps: "15-20", defaultRest: 45 },

  // Abdômen / core
  { name: "Abdominal crunch", category: "Abdômen", defaultSets: 3, defaultReps: "15-20", defaultRest: 45 },
  { name: "Abdominal infra", category: "Abdômen", defaultSets: 3, defaultReps: "15-20", defaultRest: 45 },
  { name: "Prancha frontal", category: "Abdômen", defaultSets: 3, defaultReps: "30-60s", defaultRest: 45 },
  { name: "Prancha lateral", category: "Abdômen", defaultSets: 3, defaultReps: "30-45s", defaultRest: 45 },
  { name: "Abdominal na polia", category: "Abdômen", defaultSets: 3, defaultReps: "15-20", defaultRest: 45 },
  { name: "Russian twist", category: "Abdômen", defaultSets: 3, defaultReps: "20", defaultRest: 45 },
  { name: "Elevação de pernas", category: "Abdômen", defaultSets: 3, defaultReps: "12-15", defaultRest: 45 },

  // Cardio
  { name: "Esteira — caminhada inclinada", category: "Cardio", defaultSets: 1, defaultReps: "20-30 min", defaultRest: 0 },
  { name: "Esteira — corrida", category: "Cardio", defaultSets: 1, defaultReps: "15-25 min", defaultRest: 0 },
  { name: "Bicicleta ergométrica", category: "Cardio", defaultSets: 1, defaultReps: "20-30 min", defaultRest: 0 },
  { name: "Elíptico", category: "Cardio", defaultSets: 1, defaultReps: "20-30 min", defaultRest: 0 },
  { name: "Remo ergométrico", category: "Cardio", defaultSets: 1, defaultReps: "15-20 min", defaultRest: 0 },
  { name: "Burpee", category: "Cardio", defaultSets: 3, defaultReps: "10-15", defaultRest: 60 },
  { name: "Polichinelo", category: "Cardio", defaultSets: 3, defaultReps: "30-50", defaultRest: 45 },
  { name: "Cordas", category: "Cardio", defaultSets: 3, defaultReps: "1-2 min", defaultRest: 60 },

  // Funcional
  { name: "Kettlebell swing", category: "Funcional", defaultSets: 4, defaultReps: "12-15", defaultRest: 60 },
  { name: "Farmer walk", category: "Funcional", defaultSets: 3, defaultReps: "30-40m", defaultRest: 75 },
  { name: "Box jump", category: "Funcional", defaultSets: 3, defaultReps: "10-12", defaultRest: 75 },
  { name: "Wall ball", category: "Funcional", defaultSets: 3, defaultReps: "12-15", defaultRest: 75 },
  { name: "Battle rope", category: "Funcional", defaultSets: 3, defaultReps: "30-45s", defaultRest: 60 },

  // Alongamento
  { name: "Alongamento de peitoral", category: "Alongamento", defaultSets: 2, defaultReps: "30s", defaultRest: 15 },
  { name: "Alongamento de posterior de coxa", category: "Alongamento", defaultSets: 2, defaultReps: "30s", defaultRest: 15 },
  { name: "Alongamento de quadríceps", category: "Alongamento", defaultSets: 2, defaultReps: "30s", defaultRest: 15 },
  { name: "Alongamento de lombar", category: "Alongamento", defaultSets: 2, defaultReps: "30s", defaultRest: 15 },
];

export const EXERCISE_CATEGORIES = [
  ...new Set(EXERCISE_PRESETS.map((e) => e.category)),
];
