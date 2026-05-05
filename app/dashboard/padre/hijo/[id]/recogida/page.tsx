"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, X, Trash2, MapPin } from "lucide-react";

type Tercero = {
  id: string;
  full_name: string;
  relacion: string;
};

type PlanRecogida = {
  id: string;
  responsable_nombre: string;
  responsable_relacion: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  notas: string | null;
};

export default function RecogidaPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [alumnoNombre, setAlumnoNombre] = useState("");
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [tutores, setTutores] = useState<any[]>([]);
  const [planes, setPlanes] = useState<PlanRecogida[]>([]);
  const [responsableNombre, setResponsableNombre] = useState("");
  const [responsableRelacion, setResponsableRelacion] = useState("");
  const [fechaInicio, setFechaInicio] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [fechaFin, setFechaFin] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const cargarData = useCallback(async () => {
    const { data: alumno } = await supabase
      .from("alumnos")
      .select("nombre, apellido")
      .eq("id", id)
      .single();
    setAlumnoNombre(`${alumno?.nombre} ${alumno?.apellido}`);

    const { data: t } = await supabase
      .from("terceros_autorizados")
      .select("id, full_name, relacion")
      .eq("alumno_id", id);
    setTerceros(t ?? []);

    const { data: tut } = await supabase
      .from("tutores")
      .select("id, full_name, relacion")
      .eq("alumno_id", id);
    setTutores(tut ?? []);

    const { data: p } = await supabase
      .from("plan_recogida")
      .select("*")
      .eq("alumno_id", id)
      .gte("fecha_inicio", new Date().toISOString().split("T")[0])
      .order("fecha_inicio", { ascending: true });
    setPlanes(p ?? []);
  }, [id]);

  useEffect(() => {
    if (id) cargarData();
  }, [id, cargarData]);

  function seleccionarPersona(nombre: string, relacion: string) {
    setResponsableNombre(nombre);
    setResponsableRelacion(relacion);
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("plan_recogida").insert({
      alumno_id: id,
      responsable_nombre: responsableNombre,
      responsable_relacion: responsableRelacion,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin || null,
      notas: notas || null,
      created_by: user.id,
    });

    setResponsableNombre("");
    setResponsableRelacion("");
    setFechaFin("");
    setNotas("");
    setSuccess("✅ Plan de recogida guardado");
    await cargarData();
    setLoading(false);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleEliminar(planId: string) {
    if (!confirm("¿Eliminar este plan?")) return;
    await supabase.from("plan_recogida").delete().eq("id", planId);
    await cargarData();
  }

  const todasLasPersonas = [
    ...tutores.map((t) => ({ ...t, tipo: "tutor" })),
    ...terceros.map((t) => ({ ...t, tipo: "tercero" })),
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-30 flex items-center gap-4">
        <Link
          href={`/dashboard/padre/hijo/${id}`}
          className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-bold">{alumnoNombre}</p>
          <h1 className="text-lg font-black text-gray-900">¿Quién recoge?</h1>
        </div>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto">
        {/* FORMULARIO */}
        <form onSubmit={handleGuardar} className="flex flex-col gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
              Seleccionar quién recoge
            </p>

            {/* Selección rápida */}
            {todasLasPersonas.length > 0 && (
              <div className="flex flex-col gap-2 mb-4">
                {todasLasPersonas.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => seleccionarPersona(p.full_name, p.relacion)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      responsableNombre === p.full_name
                        ? "border-orange-400 bg-orange-50"
                        : "border-gray-100 bg-gray-50 hover:border-orange-200"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        p.tipo === "tutor" ? "bg-blue-100" : "bg-green-100"
                      }`}
                    >
                      <span
                        className={`font-black text-sm ${
                          p.tipo === "tutor"
                            ? "text-blue-500"
                            : "text-green-500"
                        }`}
                      >
                        {p.full_name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">
                        {p.full_name}
                      </p>
                      <p className="text-gray-400 text-xs capitalize">
                        {p.relacion}
                      </p>
                    </div>
                    {responsableNombre === p.full_name && (
                      <Check size={16} className="text-orange-500 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Manual */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Nombre *
                </label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={responsableNombre}
                  onChange={(e) => setResponsableNombre(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Relación *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Tío..."
                  value={responsableRelacion}
                  onChange={(e) => setResponsableRelacion(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Desde *
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Hasta{" "}
                  <span className="font-normal text-gray-300">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  min={fechaInicio}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Notas
              </label>
              <input
                type="text"
                placeholder="Ej: Llegará a las 12:30..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <p className="text-green-600 text-sm font-bold">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-3.5 rounded-2xl transition-all active:scale-95 shadow-sm shadow-orange-200 flex items-center justify-center gap-2"
          >
            <Check size={18} />
            {loading ? "Guardando..." : "Guardar plan de recogida"}
          </button>
        </form>

        {/* PLANES ACTIVOS */}
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
          Planes activos ({planes.length})
        </h2>

        {planes.length > 0 ? (
          <div className="flex flex-col gap-3">
            {planes.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin size={20} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">
                        {plan.responsable_nombre}
                      </p>
                      <p className="text-gray-400 text-xs capitalize">
                        {plan.responsable_relacion}
                      </p>
                      <p className="text-orange-500 text-xs font-bold mt-1">
                        {plan.fecha_inicio}
                        {plan.fecha_fin && ` → ${plan.fecha_fin}`}
                      </p>
                      {plan.notas && (
                        <p className="text-gray-400 text-xs mt-0.5">
                          📝 {plan.notas}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEliminar(plan.id)}
                    className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-4xl mb-3">📍</p>
            <p className="text-gray-400 text-sm font-medium">
              No hay planes de recogida activos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
