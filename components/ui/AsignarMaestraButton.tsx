"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Props {
  maestraId: string;
  maestraNombre: string;
  cursos: any[];
  cursoActualId?: string;
}

export default function AsignarMaestraButton({
  maestraId,
  maestraNombre,
  cursos,
  cursoActualId,
}: Props) {
  const [cursoSeleccionado, setCursoSeleccionado] = useState(
    cursoActualId ?? "",
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleAsignar() {
    if (!cursoSeleccionado) return;
    setLoading(true);

    // Remover asignación anterior
    await supabase.from("maestra_curso").delete().eq("maestra_id", maestraId);

    // Asignar nuevo curso
    await supabase
      .from("maestra_curso")
      .insert({ maestra_id: maestraId, curso_id: cursoSeleccionado });

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex gap-3">
      <select
        value={cursoSeleccionado}
        onChange={(e) => setCursoSeleccionado(e.target.value)}
        className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50"
      >
        <option value="">Seleccionar curso...</option>
        {cursos.map((c: any) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
      <button
        onClick={handleAsignar}
        disabled={
          loading || !cursoSeleccionado || cursoSeleccionado === cursoActualId
        }
        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-sm font-black px-4 py-2.5 rounded-xl transition-all active:scale-95"
      >
        {loading ? "..." : "Asignar"}
      </button>
    </div>
  );
}
