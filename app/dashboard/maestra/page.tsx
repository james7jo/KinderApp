import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/ui/LogoutButton";
import {
  BookOpen,
  Users,
  ClipboardList,
  Bell,
  ArrowRight,
  GraduationCap,
  LogOut,
} from "lucide-react";

export default async function MaestraPage() {
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
    .select("nombre")
    .eq("id", profile?.colegio_id)
    .single();

  const { data: misCursos } = await supabase
    .from("maestra_curso")
    .select(`cursos ( id, nombre, codigo, alumnos ( id ) )`)
    .eq("maestra_id", user.id);

  const cursos = misCursos?.map((mc: any) => mc.cursos).filter(Boolean) ?? [];
  const totalAlumnos = cursos.reduce(
    (acc: number, c: any) => acc + (c?.alumnos?.length ?? 0),
    0,
  );

  const today = new Date().toLocaleDateString("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-gray-50 flex font-nunito">
      {/* SIDEBAR DESKTOP */}
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
                Maestra
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            {
              href: "/dashboard/maestra",
              label: "Inicio",
              icon: LayoutDashboard,
            },
            {
              href: "/dashboard/maestra/curso",
              label: "Mis Cursos",
              icon: BookOpen,
            },
            {
              href: "/dashboard/maestra/bitacora",
              label: "Bitácora",
              icon: ClipboardList,
            },
            { href: "/dashboard/maestra/avisos", label: "Avisos", icon: Bell },
          ].map(({ href, label, icon: Icon }) => (
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

        <div className="p-4 border-t border-gray-100">
          <div className="p-4 border-t border-gray-100">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 lg:ml-64 pb-28 lg:pb-10">
        {/* TOP BAR */}
        <div className="bg-white border-b border-gray-100 px-5 lg:px-8 py-4 sticky top-0 z-30 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold capitalize">
              {today}
            </p>
            <h1 className="text-lg font-black text-gray-900">
              {profile?.full_name}
            </h1>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center lg:hidden">
            <GraduationCap size={20} className="text-white" />
          </div>
        </div>

        <div className="px-5 lg:px-8 pt-6">
          {/* STATS */}
          <div className="grid grid-cols-2 gap-3 mb-7">
            <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-5 text-white shadow-sm">
              <Users size={20} className="mb-3 opacity-80" />
              <p className="text-3xl font-black">{totalAlumnos}</p>
              <p className="text-white/80 text-xs font-bold mt-1">
                Total alumnos
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <BookOpen size={20} className="mb-3 text-orange-400" />
              <p className="text-3xl font-black text-gray-900">
                {cursos.length}
              </p>
              <p className="text-gray-400 text-xs font-bold mt-1">Mis cursos</p>
            </div>
          </div>

          {/* MIS CURSOS */}
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
            Mis cursos
          </h2>

          {cursos.length > 0 ? (
            <div className="flex flex-col gap-3 mb-7">
              {cursos.map((curso: any) => (
                <Link
                  key={curso.id}
                  href={`/dashboard/maestra/curso/${curso.id}`}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center">
                      <BookOpen size={20} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">{curso.nombre}</p>
                      <p className="text-gray-400 text-xs font-medium mt-0.5">
                        {curso.alumnos?.length ?? 0} alumnos
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-gray-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center mb-7">
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

          {/* ACCESOS RÁPIDOS */}
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
            Accesos rápidos
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                href: "/dashboard/maestra/bitacora",
                label: "Bitácora",
                desc: "Registro diario",
                icon: ClipboardList,
                color: "bg-violet-50 text-violet-500",
              },
              {
                href: "/dashboard/maestra/avisos",
                label: "Avisos",
                desc: "Comunicados",
                icon: Bell,
                color: "bg-sky-50 text-sky-500",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div
                    className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-3`}
                  >
                    <Icon size={18} />
                  </div>
                  <p className="font-black text-gray-900 text-sm">
                    {item.label}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function LayoutDashboard({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return <BookOpen size={size} className={className} />;
}
