"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CalendarDays,
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Licencia {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  estado: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LicenciasHijoPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const alumnoId = resolvedParams.id;

  const supabase = createClient();
  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [nombreAlumno, setNombreAlumno] = useState("");
  const [loading, setLoading] = useState(true);

  // Estados del formulario
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [motivo, setMotivo] = useState("Enfermedad");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [alumnoId]);

  async function cargarDatos() {
    try {
      setLoading(true);
      const { data: alumno } = await supabase
        .from("alumnos")
        .select("nombre, apellido")
        .eq("id", alumnoId)
        .single();

      if (alumno) {
        setNombreAlumno(`${alumno.nombre} ${alumno.apellido}`);
      }

      const { data: misLicencias, error: errLicencias } = await supabase
        .from("licencias")
        .select("id, fecha_inicio, fecha_fin, motivo, estado")
        .eq("alumno_id", alumnoId)
        .order("created_at", { ascending: false });

      if (!errLicencias && misLicencias) {
        setLicencias(misLicencias);
      }
    } catch (error) {
      console.error("Error cargando licencias del alumno:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fechaInicio || !fechaFin) {
      alert("Por favor selecciona las fechas.");
      return;
    }

    try {
      setEnviando(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("licencias").insert([
        {
          alumno_id: alumnoId,
          padre_id: user.id,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          motivo,
          descripcion,
          estado: "pendiente",
        },
      ]);

      if (error) throw error;

      setFechaInicio("");
      setFechaFin("");
      setDescripcion("");
      alert("¡Solicitud de licencia enviada con éxito!");
      cargarDatos();
    } catch (error) {
      console.error("Error al registrar licencia:", error);
      alert("No se pudo procesar tu solicitud.");
    } finally {
      setEnviando(false);
    }
  }

  // Helper para pintar badges con íconos de estado personalizados
  const renderBadgeEstado = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case "aprobado":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
            <CheckCircle2 size={13} /> Aprobado
          </span>
        );
      case "rechazado":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-red-50 text-red-700 border border-red-100 uppercase tracking-wider">
            <XCircle size={13} /> Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">
            <Clock size={13} /> Pendiente
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 font-sans">
        <Loader2 className="w-9 h-9 animate-spin text-orange-500" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Sincronizando Historial...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50/10 p-4 md:p-6 text-xs font-sans w-full">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* BANNER CORPORATIVO */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[9px] uppercase font-black tracking-widest text-orange-100 block mb-1">
              Módulo de Asistencia
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">
              Licencias de {nombreAlumno}
            </h1>
            <p className="text-orange-50 mt-1 font-medium max-w-xl">
              Registra ausencias justificadas o revisa los permisos enviados en
              tiempo real a la mesa docente de tu niño.
            </p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md self-start md:self-center shrink-0">
            <CalendarDays size={28} className="text-orange-50" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* TRABAJO 1: FORMULARIO NUEVA LICENCIA */}
          <div className="bg-white border border-orange-100/60 rounded-2xl shadow-sm p-5 space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
              <PlusCircle size={16} className="text-orange-500" />
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-tight">
                Nueva Solicitud de Permiso
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">
                    Desde la Fecha
                  </label>
                  <input
                    type="date"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs font-black outline-none focus:ring-1 focus:ring-orange-400 transition-all"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">
                    Hasta la Fecha
                  </label>
                  <input
                    type="date"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs font-black outline-none focus:ring-1 focus:ring-orange-400 transition-all"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">
                    Motivo Justificado
                  </label>
                  <select
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 outline-none focus:ring-1 focus:ring-orange-400 transition-all"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  >
                    <option value="Enfermedad">Salud / Licencia Médica</option>
                    <option value="Viaje">Viaje Familiar Programado</option>
                    <option value="Urgencia">Urgencia o Fuerza Mayor</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">
                    Detalles para la Maestra
                  </label>
                  <textarea
                    rows={3}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium outline-none focus:ring-1 focus:ring-orange-400 transition-all placeholder:text-gray-300"
                    placeholder="Escribe aquí los justificativos del retraso o falta de tu hijo..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-gray-200 text-white p-3 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"
              >
                {enviando ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Procesando...
                  </>
                ) : (
                  "Enviar Solicitud"
                )}
              </button>
            </form>
          </div>

          {/* TRABAJO 2: HISTORIAL DE LICENCIAS */}
          <div className="bg-white border border-orange-100/60 rounded-2xl shadow-sm p-5 space-y-4 lg:col-span-3">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
              <FileText size={16} className="text-amber-500" />
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-tight">
                Historial de Permisos del Alumno
              </h2>
            </div>

            {licencias.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                <AlertCircle size={20} className="text-orange-300 mb-2" />
                <p className="font-black uppercase text-[10px]">
                  Sin novedades registradas
                </p>
                <p className="text-[10px] text-gray-300 mt-0.5">
                  El alumno no cuenta con reportes de ausencia vigentes.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                {licencias.map((lic) => (
                  <div
                    key={lic.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <h4 className="font-black text-xs text-gray-800 uppercase tracking-tight">
                        📌 Motivo: {lic.motivo}
                      </h4>
                      <div className="flex items-center gap-1.5 text-gray-400 font-mono font-bold text-[10px]">
                        <CalendarDays size={12} className="text-gray-300" />
                        <span>
                          Vigencia: Del{" "}
                          <strong className="text-gray-600">
                            {lic.fecha_inicio}
                          </strong>{" "}
                          al{" "}
                          <strong className="text-gray-600">
                            {lic.fecha_fin}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <div className="self-start sm:self-center">
                      {renderBadgeEstado(lic.estado)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
