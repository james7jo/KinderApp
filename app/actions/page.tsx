"use client"; // Indica a Next.js que este componente se renderiza e interactúa en el navegador del usuario

import { useState, useEffect } from "react";
// Importamos la acción de servidor que hace la consulta a Supabase y calcula la matemática OLS
import { analizarMultiplesRegresiones } from "@/app/actions/regresiones";
// Componentes modulares de Recharts para construir gráficos de líneas vectoriales (SVG) responsivos
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
  // Estados locales para controlar el spinner de carga y almacenar los resultados procesados
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  // Función asíncrona encargada de solicitar los datos de los modelos predictivos al servidor
  const cargarAnalisis = async () => {
    setLoading(true); // Encendemos el estado de carga para mostrar el spinner visual
    const res = await analizarMultiplesRegresiones(); // Invocación del Server Action
    if (res.success) {
      // Si la base de datos respondió bien, proyectamos la ecuación matemática en arrays numéricos
      const modelosConGraficos = mapearDatosParaGraficos(res.modelos);
      // Guardamos en el estado el objeto final manteniendo el total de registros y los nuevos puntos de tendencia
      setData({ ...res, modelos: modelosConGraficos });
    }
    setLoading(false); // Apagamos el estado de carga
  };

  // useEffect con array de dependencias vacío: se ejecuta una única vez cuando la página monta en el navegador
  useEffect(() => {
    cargarAnalisis();
  }, []);

  // Función clave: Traduce las ecuaciones estáticas (y = mx + b) en puntos de coordenadas legibles por Recharts
  const mapearDatosParaGraficos = (modelos: any) => {
    // Eje X: Etiquetas para mapear variables temporales de lunes a viernes
    const diasLabels = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

    // MODELO 1: Evalúa el impacto del tiempo en el estado de ánimo (X = Día de la semana de 1 a 5)
    modelos.diaAnimo.datosGrafico = diasLabels.map((dia, idx) => ({
      name: dia, // Etiqueta del eje X
      // Aplicación matemática directa: y = m * x + b (idx + 1 mapea Lunes=1, Martes=2...)
      // El operador '+' inicial parsea el String del '.toFixed(2)' de nuevo a un Number decimal limpio
      "Estado Esperado": +(
        modelos.diaAnimo.m * (idx + 1) +
        modelos.diaAnimo.b
      ).toFixed(2),
    }));

    // MODELO 2: Evalúa el impacto de la alimentación en el ánimo (Variable categórica binaria)
    modelos.comioAnimo.datosGrafico = [
      {
        name: "Dejó la comida", // Escenario X = 0 (Falso)
        // Evaluamos la ecuación con x = 0, lo que anula la pendiente y nos da exactamente la intersección 'b'
        "Ánimo Promedio": +(
          modelos.comioAnimo.m * 0 +
          modelos.comioAnimo.b
        ).toFixed(2),
      },
      {
        name: "Comió todo", // Escenario X = 1 (Verdadero)
        // Evaluamos la ecuación con x = 1 para ver cuánto altera el ánimo el hecho de que termine sus alimentos
        "Ánimo Promedio": +(
          modelos.comioAnimo.m * 1 +
          modelos.comioAnimo.b
        ).toFixed(2),
      },
    ];

    // MODELO 3: Evalúa la tendencia del apetito según el día de la semana (X = 1 a 5)
    modelos.diaComio.datosGrafico = diasLabels.map((dia, idx) => ({
      name: dia, // Etiqueta del eje X
      // Evaluamos y = m * x + b. Al ser una tasa entre 0 y 1, multiplicamos por 100 para expresarlo como porcentaje
      // .toFixed(0) remueve los decimales redundantes para una lectura directa y limpia para la maestra
      "Apetito (%)": +(
        (modelos.diaComio.m * (idx + 1) + modelos.diaComio.b) *
        100
      ).toFixed(0),
    }));

    return modelos; // Retornamos las estructuras mutadas con sus respectivos arreglos de puntos listos
  };
  return (
    <div className="min-h-screen bg-orange-50/20">
      {/* ================= HEADER PRINCIPAL COMPLETADO ================= */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo / Título del Kinder */}
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
                Regresiones Lineales
              </span>
              <h1 className="text-xl font-black text-gray-800 tracking-tight">
                KínderApp
              </h1>
            </div>
          </div>

          {/* Acciones del Header */}
          <div className="flex items-center space-x-4">
            <span className="hidden md:inline-flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
              Profesorado / Panel de Tendencias
            </span>
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
      {/* =============================================================== */}

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner de bienvenida y subtexto */}
        <div className="mb-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-orange-500/10">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            ¡Hola, Maestra! 👋
          </h2>
          <p className="text-orange-50 mt-2 text-sm md:text-base max-w-2xl leading-relaxed">
            Aquí puedes visualizar de forma sencilla cómo influyen las rutinas
            diarias en el humor y el apetito de tus alumnos. Datos calculados
            sobre{" "}
            <span className="underline decoration-2 font-bold">
              {data?.total || 0} bitácoras
            </span>{" "}
            guardadas.
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
            <p className="text-sm text-gray-500 font-medium">
              Buscando patrones en el comportamiento...
            </p>
          </div>
        )}

        {/* Grid de Reportes con los Gráficos */}
        {data?.success && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.entries(data.modelos).map(([key, modelo]: any) => (
              <div
                key={key}
                className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
              >
                <div className="p-6 pb-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">
                    Tendencia Escolar
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2 leading-snug">
                    {modelo.titulo}
                  </h3>
                </div>

                {/* Gráfico */}
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

                {/* Caja Informativa para la Maestra */}
                <div className="p-6 bg-orange-50/30 border-t border-orange-100/50 mt-4 space-y-3">
                  <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-orange-500 block mb-1">
                      📢 Conclusión pedagógica:
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
