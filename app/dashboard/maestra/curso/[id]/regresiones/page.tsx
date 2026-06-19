"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation"; // <-- Importamos useParams para leer la carpeta [id]
import { analizarMultiplesRegresiones } from "./regresiones"; // Tu archivo con las fórmulas vecino
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardMaestras() {
  const params = useParams(); // <-- Captura el ID de la URL automáticamente
  const cursoId = params?.id as string; // Saca el ID del curso activo

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cargarAnalisis = async () => {
    if (!cursoId) return;
    setLoading(true);
    setErrorMsg(null);

    // Le pasamos el ID del curso que leímos desde la barra de direcciones de la maestra
    const res = await analizarMultiplesRegresiones(cursoId);

    if (res.success) {
      const modelosConGraficos = mapearDatosParaGraficos(res.modelos);
      setData({ ...res, modelos: modelosConGraficos });
    } else {
      setErrorMsg(res.error || "Ocurrió un error al procesar las regresiones");
    }
    setLoading(false);
  };

  // Hacemos que se cargue cada vez que el cursoID esté disponible en la URL
  useEffect(() => {
    if (cursoId) {
      cargarAnalisis();
    }
  }, [cursoId]);

  const mapearDatosParaGraficos = (modelos: any) => {
    const diasLabels = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

    modelos.diaAnimo.datosGrafico = diasLabels.map((dia, idx) => ({
      name: dia,
      "Estado Esperado": +(
        modelos.diaAnimo.m * (idx + 1) +
        modelos.diaAnimo.b
      ).toFixed(2),
    }));

    modelos.comioAnimo.datosGrafico = [
      {
        name: "Dejó la comida",
        "Ánimo Promedio": +(
          modelos.comioAnimo.m * 0 +
          modelos.comioAnimo.b
        ).toFixed(2),
      },
      {
        name: "Comió todo",
        "Ánimo Promedio": +(
          modelos.comioAnimo.m * 1 +
          modelos.comioAnimo.b
        ).toFixed(2),
      },
    ];

    modelos.diaComio.datosGrafico = diasLabels.map((dia, idx) => ({
      name: dia,
      "Apetito (%)": +(
        (modelos.diaComio.m * (idx + 1) + modelos.diaComio.b) *
        100
      ).toFixed(0),
    }));

    return modelos;
  };

  return (
    <div className="min-h-screen bg-orange-50/20">
      <header className="bg-white border-b border-orange-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-500 text-white p-2.5 rounded-xl shadow-md shadow-orange-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.26 10.174c-.053-.462.283-.894.745-.973L17.5.826a.928.928 0 0 1 1.08 .711l1.163 6.758c.053.462-.283.894-.745.973L5.342 10.885a.928.928 0 0 1-1.08-.711Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.94 13.921-2.73 6.13a.924.924 0 0 1-1.62-.04l-2.28-4.793a.924.924 0 0 0-.64-.485l-5.116-.928a.924.924 0 0 1-.533-1.472l3.77-4.103a.924.924 0 0 0 .205-.662l-.427-5.402a.924.924 0 0 1 1.258-1.026l4.823 2.193a.924.924 0 0 0 .75.01l4.873-2.079a.924.924 0 0 1 1.22 1.07l-.612 5.385a.924.924 0 0 0 .167.673l3.524 4.316a.924.924 0 0 1-.607 1.444l-5.071 1.107a.924.924 0 0 0-.647.476Z"
                />
              </svg>
            </div>
            <div>
              <span className="text-xs uppercase font-black tracking-wider text-orange-400 block">
                Regresiones de Mi Aula
              </span>
              <h1 className="text-xl font-black text-gray-800 tracking-tight">
                KínderApp
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={cargarAnalisis}
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-sm transition disabled:bg-orange-300"
            >
              {loading ? "Analizando..." : "Actualizar Datos"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-orange-500/10">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            ¡Hola, Maestra! 👋
          </h2>
          <p className="text-orange-50 mt-2 text-sm md:text-base max-w-2xl leading-relaxed">
            Aquí tienes las tendencias exclusivas calculadas sobre las{" "}
            <span className="underline decoration-2 font-bold">
              {data?.total || 0} bitácoras
            </span>{" "}
            registradas para tu grupo asignado.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium shadow-sm">
            ⚠️ {errorMsg}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
            <p className="text-sm text-gray-500 font-medium">
              Extrayendo y analizando las tendencias de tu clase...
            </p>
          </div>
        )}

        {data?.success && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.entries(data.modelos).map(([key, modelo]: any) => (
              <div
                key={key}
                className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
              >
                <div className="p-6 pb-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">
                    Tendencia de Mi Aula
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2 leading-snug">
                    {modelo.titulo}
                  </h3>
                </div>

                <div className="h-48 w-full px-4 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={modelo.datosGrafico}
                      margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#fcf8f5" />
                      <XAxis
                        dataKey="name"
                        stroke="#9ca3af"
                        style={{ fontSize: "11px", fontWeight: "500" }}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        domain={key === "diaComio" ? [0, 100] : [1, 3]}
                        style={{ fontSize: "11px" }}
                      />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey={
                          key === "diaComio"
                            ? "Apetito (%)"
                            : key === "comioAnimo"
                              ? "Ánimo Promedio"
                              : "Estado Esperado"
                        }
                        stroke="#f97316"
                        strokeWidth={3.5}
                        dot={{
                          r: 4,
                          stroke: "#f97316",
                          strokeWidth: 2,
                          fill: "#fff",
                        }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-6 bg-orange-50/30 border-t border-orange-100/50 mt-4 space-y-3">
                  <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-orange-500 block mb-1">
                      📢 Conclusión de tu aula:
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed font-semibold">
                      {modelo.interpretacion}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
