"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateWorkoutFormAction, deleteWorkoutFormAction } from "@/lib/actions";
import { Plus, Trash2 } from "lucide-react";
import { ExercisePicker } from "./exercise-picker";
import type { ExercisePreset } from "@/lib/exercise-presets";

export type ExerciseItem = {
  id?: string;
  name: string;
  sets: number;
  reps: string;
  load?: string;
  restSeconds?: number;
  notes?: string;
};

type WorkoutEditorProps = {
  workoutId: string;
  title: string;
  notes: string | null;
  exercises: ExerciseItem[];
  studentName: string;
  canWrite: boolean;
  backHref?: string;
};

function emptyExercise(): ExerciseItem {
  return { name: "", sets: 3, reps: "10", load: "", restSeconds: 60, notes: "" };
}

function fromPreset(preset: ExercisePreset): ExerciseItem {
  return {
    name: preset.name,
    sets: preset.defaultSets || 3,
    reps: preset.defaultReps || "10",
    load: "",
    restSeconds: preset.defaultRest ?? 60,
    notes: "",
  };
}

export function WorkoutEditor({
  workoutId,
  title,
  notes,
  exercises: initialExercises,
  studentName,
  canWrite,
}: WorkoutEditorProps) {
  const [exercises, setExercises] = useState<ExerciseItem[]>(initialExercises);
  const [showPicker, setShowPicker] = useState(false);

  function updateExercise(index: number, field: keyof ExerciseItem, value: string | number) {
    setExercises((current) =>
      current.map((exercise, i) =>
        i === index ? { ...exercise, [field]: value } : exercise
      )
    );
  }

  function addFromPreset(preset: ExercisePreset) {
    setExercises((current) => [...current, fromPreset(preset)]);
    setShowPicker(false);
  }

  function addCustomExercise() {
    setExercises((current) => [...current, emptyExercise()]);
    setShowPicker(false);
  }

  function removeExercise(index: number) {
    setExercises((current) => current.filter((_, i) => i !== index));
  }

  if (!canWrite) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-400">Aluno: {studentName}</p>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {notes && <p className="text-sm text-slate-400">{notes}</p>}
        {exercises.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum exercício cadastrado.</p>
        ) : (
          exercises.map((exercise, index) => (
            <div key={index} className="rounded-xl bg-surface-elevated/50 p-4 text-sm">
              <p className="font-medium text-white">{exercise.name}</p>
              <p className="text-slate-400">
                {exercise.sets}×{exercise.reps}
                {exercise.load ? ` · ${exercise.load}` : ""}
              </p>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <form action={updateWorkoutFormAction} className="space-y-6">
      <input type="hidden" name="workoutId" value={workoutId} />
      <p className="text-sm text-slate-400">Aluno: {studentName}</p>

      <div className="space-y-3">
        <input
          name="title"
          required
          defaultValue={title}
          placeholder="Nome do treino"
          className="w-full text-lg font-semibold"
        />
        <textarea
          name="notes"
          rows={2}
          defaultValue={notes || ""}
          placeholder="Observações do treino (opcional)"
          className="w-full"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-white">Exercícios</h3>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setShowPicker(true)}
          >
            <Plus className="h-4 w-4" />
            Adicionar exercício
          </Button>
        </div>

        {showPicker && (
          <ExercisePicker
            onSelect={addFromPreset}
            onCustom={addCustomExercise}
            onClose={() => setShowPicker(false)}
          />
        )}

        {exercises.length === 0 && !showPicker && (
          <p className="rounded-xl border border-dashed border-surface-border px-4 py-8 text-center text-sm text-slate-400">
            Ficha vazia. Clique em &quot;Adicionar exercício&quot; para montar o treino.
          </p>
        )}

        {exercises.map((exercise, index) => (
          <div
            key={index}
            className="space-y-3 rounded-xl border border-surface-border bg-surface-elevated/40 p-4"
          >
            {exercise.id && (
              <input type="hidden" name={`exercise_${index}_id`} value={exercise.id} />
            )}
            <div className="flex items-start justify-between gap-2">
              <input
                name={`exercise_${index}_name`}
                required
                value={exercise.name}
                onChange={(e) => updateExercise(index, "name", e.target.value)}
                placeholder="Nome do exercício"
                className="w-full font-medium"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeExercise(index)}
                aria-label="Remover exercício"
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                name={`exercise_${index}_sets`}
                type="number"
                min={1}
                value={exercise.sets}
                onChange={(e) => updateExercise(index, "sets", Number(e.target.value))}
                placeholder="Séries"
              />
              <input
                name={`exercise_${index}_reps`}
                value={exercise.reps}
                onChange={(e) => updateExercise(index, "reps", e.target.value)}
                placeholder="Repetições"
              />
              <input
                name={`exercise_${index}_load`}
                value={exercise.load || ""}
                onChange={(e) => updateExercise(index, "load", e.target.value)}
                placeholder="Carga"
              />
              <input
                name={`exercise_${index}_rest`}
                type="number"
                min={0}
                step={15}
                value={exercise.restSeconds || ""}
                onChange={(e) =>
                  updateExercise(index, "restSeconds", Number(e.target.value) || 0)
                }
                placeholder="Descanso (s)"
              />
            </div>
            <input
              name={`exercise_${index}_notes`}
              value={exercise.notes || ""}
              onChange={(e) => updateExercise(index, "notes", e.target.value)}
              placeholder="Notas do exercício (opcional)"
              className="w-full"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit">Salvar treino</Button>
      </div>
    </form>
  );
}

export function DeleteWorkoutForm({
  workoutId,
  redirectTo,
}: {
  workoutId: string;
  redirectTo?: string;
}) {
  return (
    <form action={deleteWorkoutFormAction}>
      <input type="hidden" name="workoutId" value={workoutId} />
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <Button type="submit" variant="danger" size="sm">
        Excluir treino
      </Button>
    </form>
  );
}
