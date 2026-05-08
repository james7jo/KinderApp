"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Trash2,
  MapPin,
  UserCheck,
  Plus,
  Calendar,
  FileText,
} from "lucide-react";

type Persona = {
  id: string;
  full_name: string;
  relacion: string;
  tipo: "tutor" | "tercero";
};
type Plan = {
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
  const supabase = createClient();

  const [alumnoNombre, setAlumnoNombre] = useState("");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [responsableNombre, setResponsableNombre] = useState("");
  const [responsableRelacion, setResponsableRelacion] = useState("");
  const [fechaInicio, setFechaInicio] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [fechaFin, setFechaFin] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const cargar = useCallback(async () => {
    const [
      { data: alumno },
      { data: terceros },
      { data: tutores },
      { data: planesData },
    ] = await Promise.all([
      supabase.from("alumnos").select("nombre, apellido").eq("id", id).single(),
      supabase
        .from("terceros_autorizados")
        .select("id, full_name, relacion")
        .eq("alumno_id", id),
      supabase
        .from("tutores")
        .select("id, full_name, relacion")
        .eq("alumno_id", id),
      supabase
        .from("plan_recogida")
        .select("*")
        .eq("alumno_id", id)
        .gte("fecha_inicio", new Date().toISOString().split("T")[0])
        .order("fecha_inicio", { ascending: true }),
    ]);
    setAlumnoNombre(`${alumno?.nombre} ${alumno?.apellido}`);
    setPersonas([
      ...(tutores ?? []).map((t) => ({ ...t, tipo: "tutor" as const })),
      ...(terceros ?? []).map((t) => ({ ...t, tipo: "tercero" as const })),
    ]);
    setPlanes(planesData ?? []);
  }, [id]);

  useEffect(() => {
    if (id) cargar();
  }, [id, cargar]);

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
    setSuccess(true);
    await cargar();
    setLoading(false);
    setTimeout(() => setSuccess(false), 3000);
  }

  async function handleEliminar(planId: string) {
    if (!confirm("¿Eliminar este plan?")) return;
    await supabase.from("plan_recogida").delete().eq("id", planId);
    await cargar();
  }

  const labelCls =
    "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block";
  const inputCls =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50/50 transition-all";

  return (
    <main className="min-w-0 font-nunito">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center gap-3 sticky top-0 z-30">
        <Link
          href={`/dashboard/padre/hijo/${id}`}
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate">
            {alumnoNombre}
          </p>
          <h1 className="text-lg font-black text-gray-900 leading-tight">
            Plan de recogida
          </h1>
        </div>
        {planes.length > 0 && (
          <span className="text-xs font-black text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full shrink-0">
            {planes.length} activo{planes.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8">
        <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-2 lg:gap-6 space-y-5 lg:space-y-0">
          {/* ── FORMULARIO ── */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Nuevo plan
            </p>
            <form onSubmit={handleGuardar} className="space-y-4">
              {/* Selección rápida */}
              {personas.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-50">
                    <UserCheck size={15} className="text-orange-500" />
                    <p className="font-black text-gray-900 text-sm">
                      Selección rápida
                    </p>
                  </div>
                  <div className="p-3 space-y-2">
                    {personas.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setResponsableNombre(p.full_name);
                          setResponsableRelacion(p.relacion);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          responsableNombre === p.full_name
                            ? "border-orange-400 bg-orange-50"
                            : "border-gray-100 hover:border-orange-200"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            p.tipo === "tutor" ? "bg-blue-50" : "bg-green-50"
                          }`}
                        >
                          <span
                            className={`font-black text-sm ${p.tipo === "tutor" ? "text-blue-500" : "text-green-500"}`}
                          >
                            {p.full_name[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm truncate">
                            {p.full_name}
                          </p>
                          <p className="text-gray-400 text-xs capitalize">
                            {p.relacion} ·{" "}
                            {p.tipo === "tutor" ? "Tutor" : "Autorizado"}
                          </p>
                        </div>
                        {responsableNombre === p.full_name && (
                          <Check
                            size={16}
                            className="text-orange-500 shrink-0"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingreso manual */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-50">
                  <Plus size={15} className="text-gray-400" />
                  <p className="font-black text-gray-900 text-sm">
                    O ingresá manualmente
                  </p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nombre *</label>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={responsableNombre}
                      onChange={(e) => setResponsableNombre(e.target.value)}
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Relación *</label>
                    <input
                      type="text"
                      placeholder="Tío, abuelo..."
                      value={responsableRelacion}
                      onChange={(e) => setResponsableRelacion(e.target.value)}
                      className={inputCls}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Fechas y notas */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-50">
                  <Calendar size={15} className="text-sky-500" />
                  <p className="font-black text-gray-900 text-sm">
                    Fechas y notas
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Desde *</label>
                      <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className={inputCls}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>
                        Hasta{" "}
                        <span className="font-normal text-gray-300 normal-case">
                          (opcional)
                        </span>
                      </label>
                      <input
                        type="date"
                        value={fechaFin}
                        min={fechaInicio}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Notas</label>
                    <input
                      type="text"
                      placeholder="Llegará a las 12:30, traerá mochila..."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Check size={15} className="text-green-500 shrink-0" />
                  <p className="text-green-600 text-sm font-bold">
                    Plan guardado correctamente
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-sm shadow-orange-200 flex items-center justify-center gap-2"
              >
                <Check size={18} />
                {loading ? "Guardando..." : "Guardar plan de recogida"}
              </button>
            </form>
          </div>

          {/* ── PLANES ACTIVOS ── */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Planes activos ({planes.length})
            </p>

            {planes.length > 0 ? (
              <div className="space-y-3">
                {planes.map((plan) => {
                  const fechaLabel = new Date(
                    plan.fecha_inicio + "T12:00:00",
                  ).toLocaleDateString("es-BO", {
                    day: "numeric",
                    month: "short",
                  });
                  const fechaFinLabel = plan.fecha_fin
                    ? new Date(plan.fecha_fin + "T12:00:00").toLocaleDateString(
                        "es-BO",
                        { day: "numeric", month: "short" },
                      )
                    : null;
                  const esSolo1Dia =
                    !plan.fecha_fin || plan.fecha_fin === plan.fecha_inicio;

                  return (
                    <div
                      key={plan.id}
                      className="bg-white rounded-2xl border border-green-200 bg-green-50/30 overflow-hidden"
                    >
                      <div className="h-1 bg-green-400" />
                      <div className="p-4 flex items-start gap-3">
                        <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-orange-200">
                          <MapPin size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 text-base">
                            {plan.responsable_nombre}
                          </p>
                          <p className="text-gray-500 text-xs capitalize mt-0.5">
                            {plan.responsable_relacion}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1.5 bg-orange-50 rounded-full px-2.5 py-1">
                              <Calendar size={11} className="text-orange-500" />
                              <span className="text-[11px] font-black text-orange-600">
                                {esSolo1Dia
                                  ? fechaLabel
                                  : `${fechaLabel} → ${fechaFinLabel}`}
                              </span>
                            </div>
                          </div>
                          {plan.notas && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <FileText
                                size={11}
                                className="text-gray-400 shrink-0"
                              />
                              <p className="text-xs text-gray-500 font-medium">
                                {plan.notas}
                              </p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleEliminar(plan.id)}
                          className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-center transition-all shrink-0"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center px-4">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin size={24} className="text-gray-300" />
                </div>
                <p className="font-black text-gray-700 text-base mb-1">
                  Sin planes activos
                </p>
                <p className="text-gray-400 text-sm">
                  Creá un plan para indicar quién recoge a tu hijo
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
