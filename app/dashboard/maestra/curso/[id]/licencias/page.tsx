"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldAlert,
  History,
  CalendarDays,
  Check,
  X,
  Loader2,
  User,
  AlertCircle,
  Clock,
} from "lucide-react";

interface Licencia {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  descripcion: string;
  estado: string;
  alumnos: {
    nombre: string;
    apellido: string;
  } | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LicenciasCursoMaestraPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const cursoId = resolvedParams.id;

  const supabase = createClient();
  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  useEffect(() => {
    cargarLicenciasDelCurso();
  }, [cursoId]);

  async function cargarLicenciasDelCurso() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("licencias")
        .select(
          `
          id,
          fecha_inicio,
          fecha_fin,
          motivo,
          descripcion,
          estado,
          alumnos!inner (
            nombre,
            apellido,
            curso_id
          )
        `,
        )
        .eq("alumnos.curso_id", cursoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLicencias((data as any) || []);
    } catch (error) {
      console.error("Error al cargar las licencias del curso:", error);
    } finally {
      setLoading(false);
    }
  }

  async function cambiarEstadoLicencia(
    licenciaId: string,
    nuevoEstado: "aprobado" | "rechazado",
  ) {
    try {
      setProcesandoId(licenciaId);
      const { error } = await supabase
        .from("licencias")
        .update({ estado: nuevoEstado })
        .eq("id", licenciaId);

      if (error) throw error;

      setLicencias((prev) =>
        prev.map((lic) =>
          lic.id === licenciaId ? { ...lic, estado: nuevoEstado } : lic,
        ),
      );
    } catch (error) {
      console.error("Error al actualizar el estado de la licencia:", error);
      alert("No se pudo cambiar el estado de la solicitud.");
    } finally {
      setProcesandoId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 font-sans">
        <Loader2 className="w-9 h-9 animate-spin text-orange-500" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Cargando Solicitudes...
        </p>
      </div>
    );
  }

  const pendientes = licencias.filter((l) => l.estado === "pendiente");
  const historial = licencias.filter((l) => l.estado !== "pendiente");

  return (
    <div className="min-h-screen bg-orange-50/10 p-4 md:p-6 text-xs font-sans w-full">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER DE LA MAESTRA */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[9px] uppercase font-black tracking-widest text-orange-100 block mb-1">
              Panel de Control Docente
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">
              Control de Licencias y Permisos
            </h1>
            <p className="text-orange-50 mt-1 font-medium max-w-xl">
              Revisa, aprueba o rechaza los justificantes de ausencia médica o
              familiar enviados por los tutores del aula.
            </p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md self-start md:self-center shrink-0">
            <ShieldAlert size={28} className="text-orange-50" />
          </div>
        </div>

        {/* ⏳ SECCIÓN 1: SOLICITUDES PENDIENTES */}
        <div className="bg-white border border-orange-100/60 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="text-orange-500 w-4 h-4" />
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-tight">
                Solicitudes por Responder
              </h2>
            </div>
            {pendientes.length > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                {pendientes.length} PENDIENTES
              </span>
            )}
          </div>

          {pendientes.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
              <AlertCircle size={18} className="text-emerald-400 mb-1" />
              <p className="font-bold text-gray-500 uppercase text-[10px]">
                ¡Al día!
              </p>
              <p className="text-[10px] text-gray-300 mt-0.5">
                No tienes solicitudes pendientes de revisión en este curso.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendientes.map((lic) => (
                <div
                  key={lic.id}
                  className="p-4 bg-orange-50/20 border border-orange-100/70 rounded-2xl flex flex-col justify-between gap-4 hover:shadow-xs transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[11px]">
                        {lic.alumnos?.nombre?.[0] || "U"}
                      </div>
                      <h3 className="font-black text-gray-900 text-xs uppercase truncate">
                        {lic.alumnos?.nombre} {lic.alumnos?.apellido}
                      </h3>
                    </div>

                    <div className="space-y-1 bg-white p-3 rounded-xl border border-orange-100/40 shadow-xs">
                      <p className="text-[10px] text-gray-700 font-bold">
                        Motivo:{" "}
                        <span className="text-orange-600 font-black uppercase">
                          {lic.motivo}
                        </span>
                      </p>
                      <div className="flex items-center gap-1.5 text-gray-400 font-mono font-bold text-[9px] mt-0.5">
                        <CalendarDays size={11} className="text-gray-300" />
                        <span>
                          Del {lic.fecha_inicio} al {lic.fecha_fin}
                        </span>
                      </div>
                      {lic.descripcion && (
                        <p className="text-[10px] text-gray-500 font-medium italic border-t border-gray-50 pt-2 mt-2 leading-relaxed">
                          "{lic.descripcion}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      disabled={procesandoId !== null}
                      onClick={() => cambiarEstadoLicencia(lic.id, "rechazado")}
                      className="flex-1 px-3 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl font-bold transition flex items-center justify-center gap-1 disabled:opacity-50 text-[10px] uppercase"
                    >
                      <X size={12} /> Rechazar
                    </button>
                    <button
                      disabled={procesandoId !== null}
                      onClick={() => cambiarEstadoLicencia(lic.id, "aprobado")}
                      className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black transition shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 text-[10px] uppercase tracking-wider"
                    >
                      {procesandoId === lic.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <>
                          <Check size={12} /> Aprobar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✅ SECCIÓN 2: HISTORIAL PROCESADO */}
        <div className="bg-white border border-orange-100/60 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
            <History className="text-amber-500 w-4 h-4" />
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-tight">
              Historial de Decisiones del Curso
            </h2>
          </div>

          {historial.length === 0 ? (
            <p className="text-gray-400 text-sm py-2">
              No hay un registro previo de licencias evaluadas en este grupo.
            </p>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[9px] text-gray-400 font-black uppercase tracking-wider font-mono">
                    <th className="pb-3 px-2">Alumno</th>
                    <th className="pb-3 px-2">Motivo</th>
                    <th className="pb-3 px-2">Periodo de Ausencia</th>
                    <th className="pb-3 text-right px-2">Estado Resolutivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                  {historial.map((lic) => (
                    <tr
                      key={lic.id}
                      className="hover:bg-orange-50/10 transition-colors"
                    >
                      <td className="py-3 px-2 font-black text-gray-900">
                        {lic.alumnos?.nombre} {lic.alumnos?.apellido}
                      </td>
                      <td className="py-3 px-2 text-gray-600 uppercase text-[10px]">
                        {lic.motivo}
                      </td>
                      <td className="py-3 px-2 text-gray-400 font-mono text-[10px]">
                        {lic.fecha_inicio} al {lic.fecha_fin}
                      </td>
                      <td className="py-3 text-right px-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black tracking-wide border uppercase ${
                            lic.estado === "aprobado"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-red-50 text-red-700 border-red-100"
                          }`}
                        >
                          {lic.estado === "aprobado" ? (
                            <Check size={10} />
                          ) : (
                            <X size={10} />
                          )}
                          {lic.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
