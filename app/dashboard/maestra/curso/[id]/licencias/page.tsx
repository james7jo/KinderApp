"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";

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
  // Desempaquetamos el curso_id desde la URL en Next.js 15
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

      // Traemos las licencias haciendo un filtro directo por el curso_id del alumno (inner join)
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

      // Actualizamos el estado en la tabla licencias
      const { error } = await supabase
        .from("licencias")
        .update({ estado: nuevoEstado })
        .eq("id", licenciaId);

      if (error) throw error;

      // Actualizamos el estado de manera local en el array para que sea instantáneo en la UI
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

  if (loading)
    return (
      <div className="p-6 text-center text-gray-500">
        Cargando solicitudes de licencias...
      </div>
    );

  // Separar las pendientes de las ya procesadas para orden visual de la maestra
  const pendientes = licencias.filter((l) => l.estado === "pendiente");
  const historial = licencias.filter((l) => l.estado !== "pendiente");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Control de Licencias y Permisos
        </h1>
        <p className="text-gray-500 text-sm">
          Revisa, aprueba o rechaza los justificantes médicos o familiares
          enviados por los tutores.
        </p>
      </div>

      {/* ⏳ SECCIÓN 1: SOLICITUDES PENDIENTES */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span>Solicitudes por Responder</span>
          {pendientes.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {pendientes.length}
            </span>
          )}
        </h2>

        {pendientes.length === 0 ? (
          <p className="text-gray-400 text-sm py-2">
            Al día. No tienes solicitudes pendientes de revisión en este curso.
          </p>
        ) : (
          <div className="space-y-4">
            {pendientes.map((lic) => (
              <div
                key={lic.id}
                className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-800 text-base">
                    {lic.alumnos?.nombre} {lic.alumnos?.apellido}
                  </h3>
                  <p className="text-sm text-gray-700 font-medium">
                    Motivo: <span className="text-blue-600">{lic.motivo}</span>{" "}
                    | Del {lic.fecha_inicio} al {lic.fecha_fin}
                  </p>
                  {lic.descripcion && (
                    <p className="text-xs bg-white/80 p-2 rounded border border-gray-100 text-gray-600 italic">
                      "{lic.descripcion}"
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    disabled={procesandoId !== null}
                    onClick={() => cambiarEstadoLicencia(lic.id, "rechazado")}
                    className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs font-semibold hover:bg-rose-50 transition disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    disabled={procesandoId !== null}
                    onClick={() => cambiarEstadoLicencia(lic.id, "aprobado")}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                  >
                    {procesandoId === lic.id
                      ? "Procesando..."
                      : "Aprobar Licencia"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ SECCIÓN 2: HISTORIAL PROCESADO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Historial del Curso
        </h2>

        {historial.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No hay un registro previo de licencias evaluadas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-3">Alumno</th>
                  <th className="py-3">Motivo</th>
                  <th className="py-3">Periodo</th>
                  <th className="py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {historial.map((lic) => (
                  <tr key={lic.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3 font-medium text-gray-800">
                      {lic.alumnos?.nombre} {lic.alumnos?.apellido}
                    </td>
                    <td className="py-3 text-gray-600">{lic.motivo}</td>
                    <td className="py-3 text-gray-500 text-xs">
                      {lic.fecha_inicio} al {lic.fecha_fin}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          lic.estado === "aprobado"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {lic.estado.toUpperCase()}
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
  );
}
