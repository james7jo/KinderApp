import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CopyButton from "@/components/ui/CopyButton";
import {
  Users,
  Video,
  BookOpen,
  GraduationCap,
  MapPin,
  ArrowRight,
  LayoutDashboard,
  LogOut,
  Phone,
  TrendingUp,
  ClipboardList,
} from "lucide-react";

export default async function DirectorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, colegio_id")
    .eq("id", user.id)
    .single();
  const { data: colegio } = await supabase
    .from("colegios")
    .select("*")
    .eq("id", profile?.colegio_id)
    .single();
  const { data: cursos } = await supabase
    .from("cursos")
    .select("id, nombre")
    .eq("colegio_id", profile?.colegio_id);
  const { data: maestras } = await supabase
    .from("profiles")
    .select("id")
    .eq("colegio_id", profile?.colegio_id)
    .eq("role", "maestra");
  const { data: alumnos } = await supabase
    .from("alumnos")
    .select("id")
    .eq("colegio_id", profile?.colegio_id);

  const today = new Date().toLocaleDateString("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const navLinks = [
    { href: "/dashboard/director", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/director/cursos", label: "Cursos", icon: BookOpen },
    { href: "/dashboard/director/maestras", label: "Maestras", icon: Users },
    { href: "/dashboard/director/camaras", label: "Cámaras", icon: Video },
  ];

  const stats = [
    {
      label: "Estudiantes",
      value: alumnos?.length ?? 0,
      icon: Users,
      gradient: "from-orange-400 to-orange-500",
      light: "bg-orange-50 text-orange-500",
    },
    {
      label: "Maestras",
      value: maestras?.length ?? 0,
      icon: GraduationCap,
      gradient: "from-violet-400 to-violet-500",
      light: "bg-violet-50 text-violet-500",
    },
    {
      label: "Cursos",
      value: cursos?.length ?? 0,
      icon: BookOpen,
      gradient: "from-sky-400 to-sky-500",
      light: "bg-sky-50 text-sky-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-nunito">
      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white fixed h-full border-r border-gray-100 shadow-sm z-40">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 shrink-0">
              <GraduationCap
                size={24}
                className="text-white"
                strokeWidth={2.5}
              />
            </div>
            <div className="min-w-0">
              <p className="font-black text-gray-900 text-sm leading-tight truncate">
                {colegio?.nombre}
              </p>
              <span className="inline-block bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full mt-1">
                Director
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all text-sm font-bold group"
            >
              <Icon
                size={18}
                className="group-hover:scale-110 transition-transform"
              />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-1">
          {colegio?.direccion && (
            <div className="flex items-start gap-2 px-4 py-2">
              <MapPin size={13} className="text-gray-300 mt-0.5 shrink-0" />
              <p className="text-gray-400 text-xs leading-tight">
                {colegio.direccion}
              </p>
            </div>
          )}
          {colegio?.telefono && (
            <div className="flex items-center gap-2 px-4 py-2">
              <Phone size={13} className="text-gray-300 shrink-0" />
              <p className="text-gray-400 text-xs">{colegio.telefono}</p>
            </div>
          )}
          <button className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-sm font-bold w-full">
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 lg:ml-64 pb-28 lg:pb-10">
        {/* TOP BAR */}
        <div className="bg-white border-b border-gray-100 px-5 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <p className="text-xs text-gray-400 font-bold capitalize">
              {today}
            </p>
            <h1 className="text-lg font-black text-gray-900 leading-tight">
              {colegio?.nombre}
            </h1>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center lg:hidden">
            <GraduationCap size={20} className="text-white" />
          </div>
        </div>

        <div className="px-5 lg:px-8 pt-6">
          {/* STATS */}
          <div className="grid grid-cols-3 gap-3 lg:gap-5 mb-7">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`bg-gradient-to-br ${stat.gradient} rounded-2xl lg:rounded-3xl p-4 lg:p-6 text-white shadow-sm`}
                >
                  <div className="flex items-center justify-between mb-3 lg:mb-4">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Icon size={16} className="text-white lg:hidden" />
                      <Icon size={20} className="text-white hidden lg:block" />
                    </div>
                  </div>
                  <p className="text-2xl lg:text-4xl font-black">
                    {stat.value}
                  </p>
                  <p className="text-white/80 text-xs lg:text-sm font-bold mt-1">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* GRID DESKTOP */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7">
            {/* CÓDIGOS - ocupa 2 columnas en desktop */}
            <div className="lg:col-span-2 bg-white rounded-2xl lg:rounded-3xl border border-gray-100 shadow-sm p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-5">
                <ClipboardList size={18} className="text-orange-500" />
                <h2 className="font-black text-gray-900 text-sm">
                  Códigos de acceso
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">
                    Para maestras
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono font-black text-xl text-orange-600 tracking-widest">
                      {colegio?.codigo_maestra}
                    </p>
                    <CopyButton text={colegio?.codigo_maestra ?? ""} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Para padres
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono font-black text-xl text-gray-700 tracking-widest">
                      {colegio?.codigo_padre}
                    </p>
                    <CopyButton text={colegio?.codigo_padre ?? ""} />
                  </div>
                </div>
              </div>
            </div>

            {/* PREDICCIÓN */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl lg:rounded-3xl p-5 lg:p-6 text-white shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-orange-100" />
                <h2 className="font-black text-sm">Predicción</h2>
              </div>
              <p className="text-orange-100 text-xs mb-4">
                Asistencia estimada próxima semana
              </p>
              <p className="text-5xl font-black mb-1">--</p>
              <p className="text-orange-200 text-xs">
                Disponible cuando haya datos suficientes
              </p>
            </div>
          </div>

          {/* MÓDULOS */}
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
            Gestión
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
            {[
              {
                href: "/dashboard/director/cursos",
                label: "Cursos",
                desc: `${cursos?.length ?? 0} cursos activos`,
                icon: BookOpen,
                iconBg: "bg-orange-50",
                iconColor: "text-orange-500",
                border: "hover:border-orange-200",
              },
              {
                href: "/dashboard/director/maestras",
                label: "Maestras",
                desc: `${maestras?.length ?? 0} docentes registradas`,
                icon: Users,
                iconBg: "bg-violet-50",
                iconColor: "text-violet-500",
                border: "hover:border-violet-200",
              },
              {
                href: "/dashboard/director/camaras",
                label: "Cámaras",
                desc: "Monitoreo en vivo",
                icon: Video,
                iconBg: "bg-sky-50",
                iconColor: "text-sky-500",
                border: "hover:border-sky-200",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className={`bg-white rounded-2xl lg:rounded-3xl p-5 lg:p-6 flex items-center justify-between border border-gray-100 shadow-sm hover:shadow-md transition-all group ${card.border}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 ${card.iconBg} rounded-2xl flex items-center justify-center`}
                    >
                      <Icon size={22} className={card.iconColor} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{card.label}</p>
                      <p className="text-gray-400 text-xs font-medium mt-0.5">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-gray-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
