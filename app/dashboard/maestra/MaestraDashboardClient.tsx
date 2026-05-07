"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  ClipboardList,
  Bell,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  Utensils,
  Smile,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

const ESTADO_EMOJI: Record<string, string> = {
  feliz: "😊",
  normal: "😐",
  triste: "😢",
  travieso: "😈",
  cansado: "😴",
  enfermo: "🤒",
};

type Props = {
  saludo: string;
  primerNombre: string;
  todayLabel: string;
  cursos: any[];
  totalAlumnos: number;
  bitacorasCompletadas: number;
  bitacorasPendientes: number;
  chartData: {
    day: string;
    fecha: string;
    presentes: number;
    ausentes: number;
    pct: number;
  }[];
  prediccion: number | null;
  tendencia: "sube" | "baja" | "estable" | null;
  promedioAsistencia: number;
  puntosRegresion: number;
  avisosProximos: any[];
  actividadesProximas: any[];
  emociones: Record<string, number>;
  comieronHoy: number;
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-xl px-4 py-3 text-xs font-bold">
      <p className="text-gray-500 mb-2 font-black">{label}</p>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-sm bg-orange-400 inline-block" />
        <span className="text-gray-700">
          Presentes:{" "}
          <span className="text-orange-500">{payload[0]?.value}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-sm bg-gray-200 inline-block" />
        <span className="text-gray-400">Ausentes: {payload[1]?.value}</span>
      </div>
    </div>
  );
}

export default function MaestraDashboardClient({
  saludo,
  primerNombre,
  todayLabel,
  cursos,
  totalAlumnos,
  bitacorasCompletadas,
  bitacorasPendientes,
  chartData,
  prediccion,
  tendencia,
  promedioAsistencia,
  puntosRegresion,
  avisosProximos,
  actividadesProximas,
  emociones,
  comieronHoy,
}: Props) {
  const [chartTab, setChartTab] = useState<"asistencia" | "prediccion">(
    "asistencia",
  );

  const pct =
    totalAlumnos > 0
      ? Math.round((bitacorasCompletadas / totalAlumnos) * 100)
      : 0;
  const maxBar = Math.max(...chartData.map((d) => d.presentes + d.ausentes), 1);

  const TendenciaIcon =
    tendencia === "sube"
      ? TrendingUp
      : tendencia === "baja"
        ? TrendingDown
        : Minus;
  const tendenciaColor =
    tendencia === "sube"
      ? "text-green-500"
      : tendencia === "baja"
        ? "text-red-500"
        : "text-gray-400";
  const tendenciaLabel =
    tendencia === "sube"
      ? "Tendencia positiva"
      : tendencia === "baja"
        ? "Tendencia a la baja"
        : "Estable";

  const totalAlertas =
    (bitacorasPendientes > 0 ? 1 : 0) +
    avisosProximos.length +
    actividadesProximas.length;

  return (
    <main className="min-w-0 font-nunito">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div>
          <p className="text-[11px] text-gray-400 font-bold capitalize">
            {todayLabel}
          </p>
          <h1 className="text-base lg:text-lg font-black text-gray-900 leading-tight">
            {saludo}, {primerNombre}
          </h1>
        </div>
        {totalAlertas > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            <AlertCircle size={13} className="text-amber-500" />
            <span className="text-amber-600 text-[11px] font-black">
              {totalAlertas} alerta{totalAlertas !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8 space-y-5">
        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Alumnos */}
          <div className="bg-orange-500 rounded-2xl lg:rounded-3xl p-4 lg:p-5 text-white relative overflow-hidden shadow-lg shadow-orange-200">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-orange-400 opacity-40 rounded-full" />
            <div className="absolute bottom-[-20px] right-4 w-14 h-14 bg-orange-400 opacity-25 rounded-full" />
            <div className="relative z-10">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <Users size={15} className="text-white" />
              </div>
              <p className="text-2xl lg:text-4xl font-black leading-none">
                {totalAlumnos}
              </p>
              <p className="text-white/80 text-[11px] lg:text-sm font-bold mt-1">
                Alumnos
              </p>
            </div>
          </div>

          {/* Cursos */}
          <div className="bg-white rounded-2xl lg:rounded-3xl border border-gray-100 p-4 lg:p-5">
            <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center mb-3">
              <BookOpen size={15} className="text-sky-500" />
            </div>
            <p className="text-2xl lg:text-4xl font-black text-gray-900 leading-none">
              {cursos.length}
            </p>
            <p className="text-gray-400 text-[11px] lg:text-sm font-bold mt-1">
              Cursos
            </p>
          </div>

          {/* Bitácoras hoy */}
          <div
            className={`rounded-2xl lg:rounded-3xl border p-4 lg:p-5 ${
              bitacorasPendientes > 0
                ? "bg-amber-50 border-amber-100"
                : "bg-green-50 border-green-100"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${
                bitacorasPendientes > 0 ? "bg-amber-100" : "bg-green-100"
              }`}
            >
              {bitacorasPendientes > 0 ? (
                <AlertCircle size={15} className="text-amber-500" />
              ) : (
                <CheckCircle2 size={15} className="text-green-500" />
              )}
            </div>
            <p
              className={`text-2xl lg:text-4xl font-black leading-none ${
                bitacorasPendientes > 0 ? "text-amber-600" : "text-green-600"
              }`}
            >
              {bitacorasCompletadas}
              <span className="text-base lg:text-xl opacity-50">
                /{totalAlumnos}
              </span>
            </p>
            <p
              className={`text-[11px] lg:text-sm font-bold mt-1 ${
                bitacorasPendientes > 0 ? "text-amber-400" : "text-green-400"
              }`}
            >
              Hoy
            </p>
          </div>
        </div>

        {/* ── ALERTA BITÁCORAS ── */}
        {bitacorasPendientes > 0 && cursos.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-amber-800 text-sm">
                {bitacorasPendientes} bitácora
                {bitacorasPendientes !== 1 ? "s" : ""} sin completar hoy
              </p>
              <p className="text-amber-600 text-xs font-medium">
                Completá antes de que termine el día
              </p>
            </div>
            <Link
              href={`/dashboard/maestra/curso/${cursos[0]?.id}/bitacora`}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black px-3 py-2 rounded-xl transition-all shrink-0 active:scale-95"
            >
              Ir <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {/* ── GRID PRINCIPAL ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* CHART — 2 cols */}
          <div className="lg:col-span-2 bg-white rounded-2xl lg:rounded-3xl border border-gray-100 p-4 lg:p-6">
            {/* Header chart */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 size={16} className="text-orange-500" />
                <h2 className="font-black text-gray-900 text-sm">
                  Asistencia del curso
                </h2>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-orange-400 inline-block" />
                  <span className="text-gray-400">Presentes</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gray-200 inline-block" />
                  <span className="text-gray-400">Ausentes</span>
                </span>
              </div>
            </div>

            {chartData.some((d) => d.presentes > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={22} barGap={2}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#F3F4F6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{
                      fontSize: 11,
                      fontWeight: 700,
                      fill: "#9CA3AF",
                      fontFamily: "Nunito",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide domain={[0, maxBar + 1]} />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "#F9FAFB", radius: 6 }}
                  />
                  <ReferenceLine
                    y={
                      promedioAsistencia > 0
                        ? (promedioAsistencia * totalAlumnos) / 100
                        : undefined
                    }
                    stroke="#F97316"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                  />
                  <Bar
                    dataKey="presentes"
                    stackId="a"
                    fill="#FB923C"
                    radius={[0, 0, 0, 0]}
                  >
                    {chartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          i === chartData.length - 1 ? "#F97316" : "#FED7AA"
                        }
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="ausentes"
                    stackId="a"
                    fill="#F3F4F6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center gap-2">
                <BarChart2 size={32} className="text-gray-200" />
                <p className="text-gray-300 text-sm font-bold">
                  Sin datos de asistencia aún
                </p>
                <p className="text-gray-300 text-xs">
                  Los datos aparecerán cuando completes bitácoras
                </p>
              </div>
            )}

            {/* Stats debajo del chart */}
            {promedioAsistencia > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-50">
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-900">
                    {promedioAsistencia}%
                  </p>
                  <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                    Promedio 2 semanas
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-900">
                    {chartData[chartData.length - 1]?.pct ?? 0}%
                  </p>
                  <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                    Asistencia hoy
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA */}
          <div className="flex flex-col gap-4">
            {/* PREDICCIÓN */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl lg:rounded-3xl p-4 lg:p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={15} className="text-orange-200" />
                <h2 className="font-black text-sm">Predicción</h2>
              </div>
              <p className="text-orange-100 text-xs mb-3">
                Asistencia estimada próxima semana
              </p>

              {prediccion !== null ? (
                <>
                  <div className="flex items-end gap-2 mb-3">
                    <p className="text-5xl font-black leading-none">
                      {prediccion}%
                    </p>
                    <div
                      className={`flex items-center gap-1 mb-1 ${tendenciaColor.replace("text-", "text-white/")}`}
                    >
                      <TendenciaIcon size={18} className="text-white/70" />
                    </div>
                  </div>
                  <div className="bg-white/15 rounded-xl px-3 py-2">
                    <p className="text-orange-100 text-[11px] font-bold">
                      {tendenciaLabel}
                    </p>
                    <p className="text-orange-200 text-[10px] mt-0.5">
                      Basado en {puntosRegresion} días de datos · Regresión
                      lineal
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-4xl font-black text-white/30 tracking-widest mb-1">
                    — —
                  </p>
                  <p className="text-orange-200 text-[10px]">
                    Necesitás al menos 5 días con datos ({puntosRegresion}{" "}
                    registrados)
                  </p>
                </>
              )}
            </div>

            {/* HUMOR DEL DÍA */}
            {Object.keys(emociones).length > 0 && (
              <div className="bg-white rounded-2xl lg:rounded-3xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Smile size={15} className="text-violet-500" />
                  <h2 className="font-black text-gray-900 text-sm">
                    Humor del grupo hoy
                  </h2>
                </div>
                <div className="space-y-2">
                  {Object.entries(emociones)
                    .sort(([, a], [, b]) => b - a)
                    .map(([estado, count]) => (
                      <div key={estado} className="flex items-center gap-2">
                        <span className="text-lg shrink-0">
                          {ESTADO_EMOJI[estado] ?? "😶"}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-bold text-gray-700 capitalize">
                              {estado}
                            </span>
                            <span className="text-xs font-black text-gray-500">
                              {count}
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-400 rounded-full transition-all"
                              style={{
                                width: `${(count / bitacorasCompletadas) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                {/* Comieron hoy */}
                {comieronHoy > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                    <Utensils size={13} className="text-green-500 shrink-0" />
                    <p className="text-xs font-bold text-gray-500">
                      <span className="text-green-600 font-black">
                        {comieronHoy}
                      </span>{" "}
                      de {bitacorasCompletadas} comieron hoy
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── MIS CURSOS ── */}
        <div>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Mis cursos
          </h2>
          {cursos.length > 0 ? (
            <div className="space-y-2">
              {cursos.map((curso: any) => {
                const alumnosCurso = curso.alumnos?.length ?? 0;
                return (
                  <Link
                    key={curso.id}
                    href={`/dashboard/maestra/curso/${curso.id}`}
                    className="bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group flex items-center gap-4 p-4"
                  >
                    <div className="w-11 h-11 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
                      <BookOpen size={20} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 text-sm">
                        {curso.nombre}
                      </p>
                      <p className="text-gray-400 text-xs font-medium mt-0.5">
                        {alumnosCurso} alumnos
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-gray-200 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all shrink-0"
                    />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen size={26} className="text-orange-300" />
              </div>
              <h3 className="font-black text-gray-800 mb-2">
                Sin cursos asignados
              </h3>
              <p className="text-gray-400 text-sm">
                El director debe asignarte a un curso
              </p>
            </div>
          )}
        </div>

        {/* ── PRÓXIMAMENTE ── */}
        {(avisosProximos.length > 0 || actividadesProximas.length > 0) && (
          <div>
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Próximamente
            </h2>
            <div className="space-y-2">
              {actividadesProximas.map((act: any) => {
                const curso = cursos.find((c: any) => c.id === act.curso_id);
                const fecha = act.fecha
                  ? new Date(act.fecha + "T12:00:00").toLocaleDateString(
                      "es-BO",
                      { day: "numeric", month: "short" },
                    )
                  : null;
                return (
                  <Link
                    key={act.id}
                    href={`/dashboard/maestra/curso/${act.curso_id}/actividades`}
                    className="bg-white rounded-2xl border border-gray-100 hover:border-green-200 p-3.5 flex items-center gap-3 transition-all group"
                  >
                    <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                      <Calendar size={15} className="text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 text-sm truncate">
                        {act.titulo}
                      </p>
                      {curso && (
                        <p className="text-xs text-gray-400 font-medium">
                          {curso.nombre}
                        </p>
                      )}
                    </div>
                    {fecha && (
                      <span className="text-xs font-black text-green-500 shrink-0">
                        {fecha}
                      </span>
                    )}
                  </Link>
                );
              })}
              {avisosProximos.map((aviso: any) => {
                const curso = cursos.find((c: any) => c.id === aviso.curso_id);
                const fecha = aviso.fecha
                  ? new Date(aviso.fecha + "T12:00:00").toLocaleDateString(
                      "es-BO",
                      { day: "numeric", month: "short" },
                    )
                  : null;
                return (
                  <Link
                    key={aviso.id}
                    href={`/dashboard/maestra/curso/${aviso.curso_id}/avisos`}
                    className="bg-white rounded-2xl border border-gray-100 hover:border-sky-200 p-3.5 flex items-center gap-3 transition-all group"
                  >
                    <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                      <Bell size={15} className="text-sky-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 text-sm truncate">
                        {aviso.titulo}
                      </p>
                      {curso && (
                        <p className="text-xs text-gray-400 font-medium">
                          {curso.nombre}
                        </p>
                      )}
                    </div>
                    {fecha && (
                      <span className="text-xs font-black text-sky-500 shrink-0">
                        {fecha}
                      </span>
                    )}
                    {!fecha && (
                      <Clock size={13} className="text-gray-300 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ACCESOS RÁPIDOS ── */}
        <div>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Acceso rápido
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {cursos.length > 0 ? (
              <>
                <Link
                  href={`/dashboard/maestra/curso/${cursos[0]?.id}/bitacora`}
                  className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center mb-3">
                    <ClipboardList size={18} className="text-violet-500" />
                  </div>
                  <p className="font-black text-gray-900 text-sm">Bitácora</p>
                  <p
                    className={`text-xs mt-0.5 font-bold ${bitacorasPendientes > 0 ? "text-amber-500" : "text-green-500"}`}
                  >
                    {bitacorasPendientes > 0
                      ? `${bitacorasPendientes} pendiente${bitacorasPendientes !== 1 ? "s" : ""}`
                      : "Al día ✓"}
                  </p>
                </Link>
                <Link
                  href={`/dashboard/maestra/curso/${cursos[0]?.id}/avisos`}
                  className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-sky-200 hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center mb-3">
                    <Bell size={18} className="text-sky-500" />
                  </div>
                  <p className="font-black text-gray-900 text-sm">Avisos</p>
                  <p className="text-gray-400 text-xs mt-0.5 font-medium">
                    {avisosProximos.length > 0
                      ? `${avisosProximos.length} próximo${avisosProximos.length !== 1 ? "s" : ""}`
                      : "Sin avisos"}
                  </p>
                </Link>
              </>
            ) : (
              <>
                {[
                  {
                    label: "Bitácora",
                    icon: ClipboardList,
                    color: "bg-violet-50 text-violet-300",
                  },
                  {
                    label: "Avisos",
                    icon: Bell,
                    color: "bg-sky-50 text-sky-300",
                  },
                ].map(({ label, icon: Icon, color }) => (
                  <div
                    key={label}
                    className="bg-white rounded-2xl p-4 border border-gray-100 opacity-50"
                  >
                    <div
                      className={`w-10 h-10 ${color.split(" ")[0]} rounded-xl flex items-center justify-center mb-3`}
                    >
                      <Icon size={18} className={color.split(" ")[1]} />
                    </div>
                    <p className="font-black text-gray-400 text-sm">{label}</p>
                    <p className="text-gray-300 text-xs mt-0.5">
                      Sin curso asignado
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
