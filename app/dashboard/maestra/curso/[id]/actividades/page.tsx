"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  Edit2,
  X,
  Check,
  Plus,
  Calendar,
  MapPin,
  DollarSign,
  Package,
} from "lucide-react";

type Actividad = {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
  tiene_cuota: boolean;
  monto_cuota: number | null;
  descripcion_cuota: string | null;
  material_requerido: string | null;
  created_at: string;
};

export default function ActividadesPage() {
  const params = useParams();
  const cursoId = params.id as string;
  const supabase = createClient();

  const [cursoNombre, setCursoNombre] = useState("");
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [lugar, setLugar] = useState("");
  const [tieneCuota, setTieneCuota] = useState(false);
  const [montoCuota, setMontoCuota] = useState("");
  const [descripcionCuota, setDescripcionCuota] = useState("");
  const [materialRequerido, setMaterialRequerido] = useState("");
  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const cargarData = useCallback(async () => {
    const { data: curso } = await supabase
      .from("cursos")
      .select("nombre")
      .eq("id", cursoId)
      .single();
    setCursoNombre(curso?.nombre ?? "");

    const { data } = await supabase
      .from("actividades")
      .select("*")
      .eq("curso_id", cursoId)
      .order("fecha", { ascending: true, nullsFirst: false });
    setActividades(data ?? []);
  }, [cursoId]);

  useEffect(() => {
    if (cursoId) cargarData();
  }, [cursoId, cargarData]);

  function resetForm() {
    setTitulo("");
    setDescripcion("");
    setFecha("");
    setHora("");
    setLugar("");
    setTieneCuota(false);
    setMontoCuota("");
    setDescripcionCuota("");
    setMaterialRequerido("");
    setEditandoId(null);
  }

  function cargarParaEditar(a: Actividad) {
    setEditandoId(a.id);
    setTitulo(a.titulo);
    setDescripcion(a.descripcion ?? "");
    setFecha(a.fecha ?? "");
    setHora(a.hora ?? "");
    setLugar(a.lugar ?? "");
    setTieneCuota(a.tiene_cuota);
    setMontoCuota(a.monto_cuota?.toString() ?? "");
    setDescripcionCuota(a.descripcion_cuota ?? "");
    setMaterialRequerido(a.material_requerido ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      curso_id: cursoId,
      creado_por: user.id,
      titulo,
      descripcion: descripcion || null,
      fecha: fecha || null,
      hora: hora || null,
      lugar: lugar || null,
      tiene_cuota: tieneCuota,
      monto_cuota: tieneCuota && montoCuota ? parseFloat(montoCuota) : null,
      descripcion_cuota: tieneCuota ? descripcionCuota || null : null,
      material_requerido: materialRequerido || null,
    };

    if (editandoId) {
      await supabase.from("actividades").update(payload).eq("id", editandoId);
      setSuccess("✅ Actividad actualizada");
    } else {
      await supabase.from("actividades").insert(payload);
      setSuccess("✅ Actividad creada");
    }

    resetForm();
    await cargarData();
    setLoading(false);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar esta actividad?")) return;
    await supabase.from("actividades").delete().eq("id", id);
    await cargarData();
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
          <h1 className="text-lg font-black text-gray-900">Actividades</h1>
        </div>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto">
        {/* FORMULARIO */}
        <form onSubmit={handleGuardar} className="flex flex-col gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
              {editandoId ? "✏️ Editando actividad" : "Nueva actividad"}
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Título *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Día del niño, Desfile..."
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Descripción
                </label>
                <textarea
                  placeholder="Detalle de la actividad..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>

              {/* Fecha y hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Lugar
                </label>
                <input
                  type="text"
                  placeholder="Ej: Patio del colegio..."
                  value={lugar}
                  onChange={(e) => setLugar(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Material requerido
                </label>
                <input
                  type="text"
                  placeholder="Ej: Papel, silicona, tijeras..."
                  value={materialRequerido}
                  onChange={(e) => setMaterialRequerido(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Cuota */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setTieneCuota(!tieneCuota)}
                    className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${tieneCuota ? "bg-orange-500" : "bg-gray-200"}`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${tieneCuota ? "left-6" : "left-0.5"}`}
                    />
                  </button>
                  <span className="text-sm font-bold text-gray-700">
                    ¿Requiere cuota?
                  </span>
                </div>

                {tieneCuota && (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                          Monto (Bs)
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
                          step="0.5"
                          value={montoCuota}
                          onChange={(e) => setMontoCuota(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                          Para qué
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Refrigerio..."
                          value={descripcionCuota}
                          onChange={(e) => setDescripcionCuota(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-red-500 text-sm font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <p className="text-green-600 text-sm font-bold">{success}</p>
            </div>
          )}

          <div className="flex gap-3">
            {editandoId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-100 text-gray-600 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2"
              >
                <X size={18} /> Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-3.5 rounded-2xl transition-all active:scale-95 shadow-sm shadow-orange-200 flex items-center justify-center gap-2"
            >
              <Check size={18} />
              {loading
                ? "Guardando..."
                : editandoId
                  ? "Actualizar"
                  : "Crear actividad"}
            </button>
          </div>
        </form>

        {/* ACTIVIDADES */}
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
          Actividades ({actividades.length})
        </h2>

        {actividades.length > 0 ? (
          <div className="flex flex-col gap-3">
            {actividades.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="h-1.5 bg-gradient-to-r from-green-400 to-green-500" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-black text-gray-900 text-base">
                      {a.titulo}
                    </h3>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => cargarParaEditar(a)}
                        className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-all"
                      >
                        <Edit2 size={14} className="text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleEliminar(a.id)}
                        className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>

                  {a.descripcion && (
                    <p className="text-gray-500 text-sm mb-3">
                      {a.descripcion}
                    </p>
                  )}

                  <div className="flex flex-col gap-2">
                    {a.fecha && (
                      <div className="flex items-center gap-2">
                        <Calendar
                          size={14}
                          className="text-orange-400 shrink-0"
                        />
                        <p className="text-sm font-bold text-gray-700 capitalize">
                          {new Date(a.fecha + "T12:00:00").toLocaleDateString(
                            "es-BO",
                            {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            },
                          )}
                          {a.hora && ` · ${a.hora.slice(0, 5)}`}
                        </p>
                      </div>
                    )}
                    {a.lugar && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400 shrink-0" />
                        <p className="text-sm text-gray-500">{a.lugar}</p>
                      </div>
                    )}
                    {a.material_requerido && (
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-gray-400 shrink-0" />
                        <p className="text-sm text-gray-500">
                          {a.material_requerido}
                        </p>
                      </div>
                    )}
                    {a.tiene_cuota && (
                      <div className="mt-2 bg-orange-50 rounded-xl p-3 flex items-center gap-2">
                        <DollarSign
                          size={16}
                          className="text-orange-500 shrink-0"
                        />
                        <div>
                          <p className="font-black text-orange-600">
                            Bs {a.monto_cuota}
                          </p>
                          {a.descripcion_cuota && (
                            <p className="text-orange-400 text-xs">
                              {a.descripcion_cuota}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-gray-400 text-sm font-medium">
              No hay actividades creadas aún
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
