import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ClipboardList,
  Bell,
  Calendar,
  BookOpen,
  Video,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Users2,
} from "lucide-react";

export default async function CursoMaestraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: curso } = await supabase
    .from("cursos")
    .select("id, nombre, codigo")
    .eq("id", id)
    .single();

  const { data: alumnos } = await supabase
    .from("alumnos")
    .select("id, nombre, apellido, foto_url, genero")
    .eq("curso_id", id)
    .order("nombre");

  const today = new Date().toISOString().split("T")[0];

  const { data: bitacorasHoy } = await supabase
    .from("bitacoras")
    .select("id, alumno_id, estado_animo, comio")
    .eq("maestra_id", user.id)
    .eq("fecha", today);

  // Próximos avisos
  const { data: avisosRecientes } = await supabase
    .from("avisos")
    .select("id, titulo, tipo, created_at")
    .eq("curso_id", id)
    .order("created_at", { ascending: false })
    .limit(2);

  // Próximas actividades
  const { data: actProximas } = await supabase
    .from("actividades")
    .select("id, titulo, fecha")
    .eq("curso_id", id)
    .gte("fecha", today)
    .order("fecha", { ascending: true })
    .limit(2);

  const asistenciaHoy = bitacorasHoy?.length ?? 0;
  const totalAlumnos = alumnos?.length ?? 0;
  const pendientes = totalAlumnos - asistenciaHoy;
  const pct =
    totalAlumnos > 0 ? Math.round((asistenciaHoy / totalAlumnos) * 100) : 0;

  const ESTADO_EMOJI: Record<string, string> = {
    feliz: "😊",
    normal: "😐",
    triste: "😢",
    travieso: "😈",
    cansado: "😴",
    enfermo: "🤒",
  };

  const modulos = [
    {
      href: `/dashboard/maestra/curso/${id}/alumnos`,
      label: "Lista de alumnos",
      desc: `${totalAlumnos} estudiantes`,
      icon: Users,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      hover: "hover:border-orange-200",
    },
    {
      href: `/dashboard/maestra/curso/${id}/bitacora`,
      label: "Bitácora diaria",
      desc:
        pendientes > 0
          ? `${pendientes} pendiente${pendientes !== 1 ? "s" : ""} hoy`
          : "Al día ✓",
      icon: ClipboardList,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-500",
      hover: "hover:border-violet-200",
      alert: pendientes > 0,
    },
    {
      href: `/dashboard/maestra/curso/${id}/avisos`,
      label: "Avisos",
      desc:
        avisosRecientes && avisosRecientes.length > 0
          ? avisosRecientes[0].titulo
          : "Sin avisos",
      icon: Bell,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-500",
      hover: "hover:border-sky-200",
    },
    {
      href: `/dashboard/maestra/curso/${id}/actividades`,
      label: "Actividades",
      desc:
        actProximas && actProximas.length > 0
          ? actProximas[0].titulo
          : "Sin actividades próximas",
      icon: Calendar,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
      hover: "hover:border-green-200",
    },
    {
      href: `/dashboard/maestra/curso/${id}/camara`,
      label: "Cámaras",
      desc: "Monitoreo en vivo",
      icon: Video,
      iconBg: "bg-red-50",
      iconColor: "text-red-400",
      hover: "hover:border-red-200",
    },
    {
      href: `/dashboard/maestra/curso/${id}/mesa-directiva`,
      label: "Mesa directiva",
      desc: "Organización de padres",
      icon: Users2,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      hover: "hover:border-amber-200",
    },
  ];

  return (
    <main className="min-w-0">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center gap-3 sticky top-0 z-30">
        <Link
          href="/dashboard/maestra/curso"
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            Curso
          </p>
          <h1 className="text-lg font-black text-gray-900 leading-tight truncate">
            {curso?.nombre}
          </h1>
        </div>
        <span className="text-[10px] font-black text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full shrink-0 font-mono">
          {curso?.codigo}
        </span>
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8 space-y-5">
        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-orange-500 rounded-2xl p-4 text-white relative overflow-hidden shadow-lg shadow-orange-200">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-orange-400 opacity-40 rounded-full" />
            <div className="relative z-10">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <Users size={14} className="text-white" />
              </div>
              <p className="text-2xl lg:text-3xl font-black leading-none">
                {totalAlumnos}
              </p>
              <p className="text-white/80 text-[11px] font-bold mt-1">
                Alumnos
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
            <p className="text-2xl lg:text-3xl font-black text-gray-900 leading-none">
              {asistenciaHoy}
            </p>
            <p className="text-gray-400 text-[11px] font-bold mt-1">
              Presentes hoy
            </p>
          </div>

          <div
            className={`rounded-2xl p-4 border text-center ${
              pct >= 80
                ? "bg-green-50 border-green-100"
                : pct >= 50
                  ? "bg-amber-50 border-amber-100"
                  : "bg-red-50 border-red-100"
            }`}
          >
            <p
              className={`text-2xl lg:text-3xl font-black leading-none ${
                pct >= 80
                  ? "text-green-600"
                  : pct >= 50
                    ? "text-amber-600"
                    : "text-red-500"
              }`}
            >
              {pct}%
            </p>
            <p
              className={`text-[11px] font-bold mt-1 ${
                pct >= 80
                  ? "text-green-400"
                  : pct >= 50
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            >
              Asistencia
            </p>
          </div>
        </div>

        {/* ── ALERTA BITÁCORAS ── */}
        {pendientes > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-amber-800 text-sm">
                {pendientes} bitácora{pendientes !== 1 ? "s" : ""} sin completar
                hoy
              </p>
              <p className="text-amber-600 text-xs font-medium">
                Completá antes de que termine el día
              </p>
            </div>
            <Link
              href={`/dashboard/maestra/curso/${id}/bitacora`}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black px-3 py-2 rounded-xl transition-all shrink-0"
            >
              Ir <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {/* ── ALUMNOS ── */}
        {alumnos && alumnos.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-orange-500" />
                <h2 className="font-black text-gray-900 text-sm">
                  Alumnos ({totalAlumnos})
                </h2>
              </div>
              <Link
                href={`/dashboard/maestra/curso/${id}/alumnos`}
                className="text-orange-500 text-xs font-bold hover:text-orange-600 transition-colors"
              >
                Ver todos →
              </Link>
            </div>

            {/* Desktop: tabla compacta */}
            <div className="hidden lg:block divide-y divide-gray-50">
              {alumnos.slice(0, 5).map((alumno) => {
                const bitacora = bitacorasHoy?.find(
                  (b) => b.alumno_id === alumno.id,
                );
                const presente = !!bitacora;
                return (
                  <div
                    key={alumno.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                      {alumno.foto_url ? (
                        <img
                          src={alumno.foto_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-black text-orange-500">
                          {alumno.nombre[0]}
                          {alumno.apellido[0]}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-gray-800 text-sm flex-1">
                      {alumno.nombre} {alumno.apellido}
                    </p>
                    {bitacora?.estado_animo && (
                      <span className="text-base">
                        {ESTADO_EMOJI[bitacora.estado_animo]}
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
                        presente
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {presente ? "✓ Presente" : "Ausente"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Móvil: lista compacta */}
            <div className="lg:hidden divide-y divide-gray-50">
              {alumnos.slice(0, 4).map((alumno) => {
                const presente = bitacorasHoy?.some(
                  (b) => b.alumno_id === alumno.id,
                );
                return (
                  <div
                    key={alumno.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-orange-500">
                        {alumno.nombre[0]}
                        {alumno.apellido[0]}
                      </span>
                    </div>
                    <p className="font-bold text-gray-800 text-sm flex-1 truncate">
                      {alumno.nombre} {alumno.apellido}
                    </p>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        presente
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {presente ? "✓" : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            {totalAlumnos > 5 && (
              <div className="px-5 py-3 border-t border-gray-50">
                <Link
                  href={`/dashboard/maestra/curso/${id}/alumnos`}
                  className="text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Ver {totalAlumnos - 5} más →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── MÓDULOS ── */}
        <div>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Gestión del curso
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {modulos.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className={`bg-white rounded-2xl p-4 border border-gray-100 ${mod.hover} hover:shadow-md transition-all group`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-10 h-10 ${mod.iconBg} rounded-xl flex items-center justify-center`}
                    >
                      <Icon size={18} className={mod.iconColor} />
                    </div>
                    {(mod as any).alert && (
                      <span className="w-2 h-2 bg-amber-400 rounded-full mt-1" />
                    )}
                  </div>
                  <p className="font-black text-gray-900 text-sm">
                    {mod.label}
                  </p>
                  <p
                    className={`text-xs mt-0.5 leading-tight font-medium ${
                      (mod as any).alert ? "text-amber-500" : "text-gray-400"
                    }`}
                  >
                    {mod.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
