"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";

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
  // En Next.js 15, los params de rutas dinámicas se reciben como Promise y se desempaquetan con use()
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

      // 1. Traer el nombre del alumno actual para mostrarlo en el título
      const { data: alumno } = await supabase
        .from("alumnos")
        .select("nombre, apellido")
        .eq("id", alumnoId)
        .single();

      if (alumno) {
        setNombreAlumno(`${alumno.nombre} ${alumno.apellido}`);
      }

      // 2. Traer solo las licencias que corresponden a este alumno específico
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

      // Insertamos amarrando directo al alumnoId de la URL
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

  if (loading)
    return (
      <div className="p-6 text-center text-gray-500">
        Cargando historial del alumno...
      </div>
    );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Licencias de {nombreAlumno}
        </h1>
        <p className="text-gray-500 text-sm">
          Registra o revisa los permisos solicitados exclusivamente para este
          alumno.
        </p>
      </div>

      {/* Formulario */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Nueva Solicitud de Permiso
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Desde la fecha:
              </label>
              <input
                type="date"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Hasta la fecha:
              </label>
              <input
                type="date"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Motivo Justificado:
            </label>
            <select
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            >
              <option value="Enfermedad">Salud / Médico</option>
              <option value="Viaje">Viaje Familiar</option>
              <option value="Urgencia">Urgencia Mayor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Detalles para la Maestra:
            </label>
            <textarea
              rows={3}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
              placeholder="Explica brevemente la razón de la ausencia..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {enviando ? "Enviando..." : "Enviar Solicitud"}
          </button>
        </form>
      </div>

      {/* Historial Individual */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Historial de este alumno
        </h2>
        {licencias.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No hay licencias registradas para este niño.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {licencias.map((lic) => (
              <div
                key={lic.id}
                className="py-3 flex justify-between items-center"
              >
                <div>
                  <h4 className="font-medium text-sm text-gray-800">
                    {lic.motivo}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Del {lic.fecha_inicio} al {lic.fecha_fin}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    lic.estado === "pendiente"
                      ? "bg-amber-50 text-amber-600"
                      : lic.estado === "aprobado"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {lic.estado.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
