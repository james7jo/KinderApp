"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Crown, Check, X } from "lucide-react";

const ROLES_MESA = [
  { value: "presidente", label: "Presidente", icon: "👑" },
  { value: "vicepresidente", label: "Vicepresidente", icon: "🥈" },
  { value: "secretaria_actas", label: "Stria. Actas", icon: "📝" },
  { value: "secretaria_hacienda", label: "Stria. Hacienda", icon: "💰" },
  { value: "secretaria_deportes", label: "Stria. Deportes", icon: "⚽" },
  { value: "vocal", label: "Vocal", icon: "🎤" },
];

export default function MesaDirectivaPage() {
  const params = useParams();
  const cursoId = params.id as string;
  const supabase = createClient();

  const [cursoNombre, setCursoNombre] = useState("");
  const [tutores, setTutores] = useState<any[]>([]);
  const [mesa, setMesa] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [asignaciones, setAsignaciones] = useState<Record<string, string>>({});

  const cargarData = useCallback(async () => {
    const { data: curso } = await supabase
      .from("cursos")
      .select("nombre")
      .eq("id", cursoId)
      .single();
    setCursoNombre(curso?.nombre ?? "");

    // Cargar tutores del curso
    const { data: alumnos } = await supabase
      .from("alumnos")
      .select("tutores(id, full_name, relacion, user_id)")
      .eq("curso_id", cursoId);

    const todosLosTutores =
      alumnos
        ?.flatMap((a: any) => a.tutores ?? [])
        .filter((t: any) => t.user_id) ?? [];

    // Deduplicar por user_id
    const unicos = todosLosTutores.filter(
      (t: any, i: number, arr: any[]) =>
        arr.findIndex((x) => x.user_id === t.user_id) === i,
    );
    setTutores(unicos);

    // Cargar mesa actual
    const { data: mesaActual } = await supabase
      .from("mesa_directiva")
      .select("*, tutores(full_name)")
      .eq("curso_id", cursoId);
    setMesa(mesaActual ?? []);

    // Precargar asignaciones actuales
    const asig: Record<string, string> = {};
    mesaActual?.forEach((m: any) => {
      asig[m.rol] = m.tutor_id;
    });
    setAsignaciones(asig);
  }, [cursoId]);

  useEffect(() => {
    if (cursoId) cargarData();
  }, [cursoId, cargarData]);

  async function handleGuardar() {
    setLoading(true);

    // Eliminar mesa actual
    await supabase.from("mesa_directiva").delete().eq("curso_id", cursoId);

    // Insertar nuevas asignaciones
    const inserts = Object.entries(asignaciones)
      .filter(([_, tutorId]) => tutorId)
      .map(([rol, tutorId]) => ({
        curso_id: cursoId,
        tutor_id: tutorId,
        rol,
      }));

    if (inserts.length > 0) {
      await supabase.from("mesa_directiva").insert(inserts);
    }

    setSuccess("✅ Mesa directiva guardada");
    await cargarData();
    setLoading(false);
    setTimeout(() => setSuccess(""), 3000);
  }

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-30 flex items-center gap-4">
        <Link
          href={`/dashboard/maestra/curso/${cursoId}`}
          className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-bold">{cursoNombre}</p>
          <h1 className="text-lg font-black text-gray-900">Mesa Directiva</h1>
        </div>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto">
        {tutores.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-black text-gray-800 mb-2">
              Sin padres registrados
            </p>
            <p className="text-gray-400 text-sm">
              Los padres deben registrarse primero para formar la mesa directiva
            </p>
          </div>
        ) : (
          <>
            <div className="bg-orange-50 rounded-2xl p-4 mb-6 border border-orange-100">
              <p className="text-orange-600 text-sm font-bold">
                💡 Asigná un padre o madre a cada cargo de la mesa directiva
              </p>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              {ROLES_MESA.map((rol) => (
                <div
                  key={rol.value}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{rol.icon}</span>
                    <p className="font-black text-gray-900 text-sm">
                      {rol.label}
                    </p>
                  </div>
                  <select
                    value={asignaciones[rol.value] ?? ""}
                    onChange={(e) =>
                      setAsignaciones((prev) => ({
                        ...prev,
                        [rol.value]: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 font-medium"
                  >
                    <option value="">— Sin asignar —</option>
                    {tutores.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.relacion})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {success && (
              <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-4">
                <p className="text-green-600 text-sm font-bold">{success}</p>
              </div>
            )}

            <button
              onClick={handleGuardar}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-sm shadow-orange-200 flex items-center justify-center gap-2"
            >
              <Check size={20} />
              {loading ? "Guardando..." : "Guardar mesa directiva"}
            </button>

            {/* Mesa actual */}
            {mesa.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                  Mesa actual
                </h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="divide-y divide-gray-50">
                    {mesa.map((m) => {
                      const rol = ROLES_MESA.find((r) => r.value === m.rol);
                      return (
                        <div
                          key={m.id}
                          className="px-5 py-3 flex items-center gap-3"
                        >
                          <span className="text-xl">{rol?.icon}</span>
                          <div className="flex-1">
                            <p className="font-bold text-gray-800 text-sm">
                              {m.tutores?.full_name}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {rol?.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
