"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Video,
  BookOpen,
  GraduationCap,
  ArrowRight,
  TrendingUp,
  ClipboardList,
  Bell,
  BarChart2,
  ChevronRight,
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
} from "recharts";

type Profile = { full_name: string; colegio_id: string };
type Colegio = {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  codigo_maestra?: string;
  codigo_padre?: string;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:border-orange-300 hover:text-orange-600 transition-all whitespace-nowrap"
    >
      {copied ? "✓ Copiado" : "Copiar"}
    </button>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs font-bold">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="text-orange-500">Presentes: {payload[0]?.value ?? 0}</p>
      <p className="text-gray-300">Ausentes: {payload[1]?.value ?? 0}</p>
    </div>
  );
}

export default function DirectorPage() {
  const supabase = createClient();
  const router = useRouter();

  const [colegio, setColegio] = useState<Colegio | null>(null);
  const [cursosCount, setCursosCount] = useState(0);
  const [maestrasCount, setMaestrasCount] = useState(0);
  const [alumnosCount, setAlumnosCount] = useState(0);
  const [weekData, setWeekData] = useState<
    { day: string; presentes: number; ausentes: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, colegio_id")
        .eq("id", user.id)
        .single();

      const { data: col } = await supabase
        .from("colegios")
        .select("*")
        .eq("id", prof?.colegio_id)
        .single();
      setColegio(col);

      const [{ data: cursos }, { data: maestras }, { data: alumnos }] =
        await Promise.all([
          supabase
            .from("cursos")
            .select("id")
            .eq("colegio_id", prof?.colegio_id),
          supabase
            .from("profiles")
            .select("id")
            .eq("colegio_id", prof?.colegio_id)
            .eq("role", "maestra"),
          supabase
            .from("alumnos")
            .select("id")
            .eq("colegio_id", prof?.colegio_id),
        ]);

      setCursosCount(cursos?.length ?? 0);
      setMaestrasCount(maestras?.length ?? 0);
      setAlumnosCount(alumnos?.length ?? 0);

      // Últimos 5 días hábiles
      const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const fechas: string[] = [];
      const d = new Date();
      while (fechas.length < 5) {
        if (d.getDay() !== 0 && d.getDay() !== 6)
          fechas.unshift(d.toISOString().split("T")[0]);
        d.setDate(d.getDate() - 1);
      }

      const alumnosIds = (alumnos ?? []).map((a: any) => a.id);
      if (alumnosIds.length > 0) {
        // Existencia de bitácora = alumno presente ese día
        const { data: bitacoras } = await supabase
          .from("bitacoras")
          .select("fecha, alumno_id")
          .in("alumno_id", alumnosIds)
          .in("fecha", fechas);

        setWeekData(
          fechas.map((fecha) => {
            const presentes = (bitacoras ?? []).filter(
              (b: any) => b.fecha === fecha,
            ).length;
            const ausentes = Math.max(alumnosIds.length - presentes, 0);
            return {
              day: dias[new Date(fecha + "T12:00:00").getDay()],
              presentes,
              ausentes,
            };
          }),
        );
      } else {
        setWeekData(
          fechas.map((fecha) => ({
            day: dias[new Date(fecha + "T12:00:00").getDay()],
            presentes: 0,
            ausentes: 0,
          })),
        );
      }

      setLoading(false);
    }
    load();
  }, []);

  const stats = [
    {
      label: "Estudiantes",
      value: alumnosCount,
      icon: Users,
      bg: "bg-orange-500",
      shadow: "shadow-orange-200",
      circle: "bg-orange-400",
    },
    {
      label: "Maestras",
      value: maestrasCount,
      icon: GraduationCap,
      bg: "bg-violet-500",
      shadow: "shadow-violet-200",
      circle: "bg-violet-400",
    },
    {
      label: "Cursos",
      value: cursosCount,
      icon: BookOpen,
      bg: "bg-sky-500",
      shadow: "shadow-sky-200",
      circle: "bg-sky-400",
    },
  ];

  const modCards = [
    {
      href: "/dashboard/director/cursos",
      label: "Cursos",
      desc: `${cursosCount} cursos activos`,
      icon: BookOpen,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
    },
    {
      href: "/dashboard/director/maestras",
      label: "Maestras",
      desc: `${maestrasCount} docentes registradas`,
      icon: Users,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-500",
    },
    {
      href: "/dashboard/director/camaras",
      label: "Cámaras",
      desc: "Monitoreo en vivo",
      icon: Video,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-500",
    },
  ];

  const maxBar = Math.max(...weekData.map((d) => d.presentes + d.ausentes), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-nunito">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center animate-pulse">
            <GraduationCap size={24} className="text-white" />
          </div>
          <p className="text-sm font-bold text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-w-0">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div>
          <p className="text-[11px] text-gray-400 font-bold capitalize">
            {today}
          </p>
          <h1 className="text-base lg:text-lg font-black text-gray-900 leading-tight">
            {colegio?.nombre}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative w-9 h-9 rounded-xl border border-gray-100 bg-white flex items-center justify-center hover:border-orange-200 transition-all">
            <Bell size={16} className="text-gray-400" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full" />
          </button>
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-7 pt-5">
        {/* STATS */}
        <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-5">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`${s.bg} rounded-2xl lg:rounded-3xl p-4 lg:p-5 text-white shadow-lg ${s.shadow} relative overflow-hidden`}
              >
                <div
                  className={`absolute -top-4 -right-4 w-20 h-20 ${s.circle} opacity-40 rounded-full`}
                />
                <div
                  className={`absolute bottom-[-20px] right-4 w-14 h-14 ${s.circle} opacity-25 rounded-full`}
                />
                <div className="relative z-10">
                  <div className="w-8 h-8 lg:w-9 lg:h-9 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                    <Icon size={15} className="text-white lg:hidden" />
                    <Icon size={18} className="text-white hidden lg:block" />
                  </div>
                  <p className="text-2xl lg:text-4xl font-black leading-none">
                    {s.value}
                  </p>
                  <p className="text-white/80 text-[11px] lg:text-sm font-bold mt-1">
                    {s.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          {/* CHART — 2 cols */}
          <div className="lg:col-span-2 bg-white rounded-2xl lg:rounded-3xl border border-gray-100 p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 size={16} className="text-orange-500" />
                <h2 className="font-black text-gray-900 text-sm">
                  Asistencia semanal
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
            {weekData.length > 0 ? (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={weekData} barSize={28} barGap={4}>
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
                  <YAxis hide domain={[0, maxBar + 2]} />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "#F9FAFB", radius: 8 }}
                  />
                  <Bar
                    dataKey="presentes"
                    stackId="a"
                    fill="#FB923C"
                    radius={[0, 0, 0, 0]}
                  >
                    {weekData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === weekData.length - 1 ? "#F97316" : "#FED7AA"}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="ausentes"
                    stackId="a"
                    fill="#F3F4F6"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[190px] flex items-center justify-center">
                <p className="text-gray-300 text-sm font-bold">
                  Sin datos de asistencia aún
                </p>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA */}
          <div className="flex flex-col gap-4">
            {/* CÓDIGOS */}
            <div className="bg-white rounded-2xl lg:rounded-3xl border border-gray-100 p-4 lg:p-5">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList size={15} className="text-orange-500" />
                <h2 className="font-black text-gray-900 text-sm">
                  Códigos de acceso
                </h2>
              </div>
              <div className="space-y-3">
                <div className="bg-orange-50 rounded-2xl p-3.5 border border-orange-100">
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">
                    Para maestras
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono font-black text-lg text-orange-600 tracking-widest">
                      {colegio?.codigo_maestra ?? "—"}
                    </p>
                    <CopyButton text={colegio?.codigo_maestra ?? ""} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Para padres
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono font-black text-lg text-gray-700 tracking-widest">
                      {colegio?.codigo_padre ?? "—"}
                    </p>
                    <CopyButton text={colegio?.codigo_padre ?? ""} />
                  </div>
                </div>
              </div>
            </div>

            {/* PREDICCIÓN */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl lg:rounded-3xl p-4 lg:p-5 text-white flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={15} className="text-orange-200" />
                <h2 className="font-black text-sm">Predicción</h2>
              </div>
              <p className="text-orange-100 text-xs mb-4">
                Asistencia estimada próxima semana
              </p>
              <p className="text-4xl font-black text-white/40 tracking-widest mb-1">
                — —
              </p>
              <p className="text-orange-200 text-[10px] leading-snug">
                Disponible cuando haya datos suficientes
              </p>
            </div>
          </div>
        </div>

        {/* MÓDULOS */}
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
          Gestión
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 pb-6">
          {modCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-5 flex items-center gap-4 border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group"
              >
                <div
                  className={`w-11 h-11 ${card.iconBg} rounded-2xl flex items-center justify-center shrink-0`}
                >
                  <Icon size={20} className={card.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-sm">
                    {card.label}
                  </p>
                  <p className="text-gray-400 text-xs font-medium mt-0.5">
                    {card.desc}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-gray-200 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
