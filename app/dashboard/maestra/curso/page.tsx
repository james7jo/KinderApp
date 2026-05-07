import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Users,
  ClipboardList,
  Bell,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default async function MisCursosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: misCursos } = await supabase
    .from("maestra_curso")
    .select(`cursos ( id, nombre, codigo, alumnos ( id ) )`)
    .eq("maestra_id", user.id);

  const cursos = misCursos?.map((mc: any) => mc.cursos).filter(Boolean) ?? [];
  const cursosIds = cursos.map((c: any) => c.id);
  const alumnosIds: string[] = cursos.flatMap(
    (c: any) => c.alumnos?.map((a: any) => a.id) ?? [],
  );
  const today = new Date().toISOString().split("T")[0];

  const { data: bitacorasHoy } =
    alumnosIds.length > 0
      ? await supabase
          .from("bitacoras")
          .select("alumno_id")
          .in("alumno_id", alumnosIds)
          .eq("fecha", today)
      : { data: [] };

  const { data: actividadesProximas } =
    cursosIds.length > 0
      ? await supabase
          .from("actividades")
          .select("id, titulo, fecha, curso_id")
          .in("curso_id", cursosIds)
          .gte("fecha", today)
          .order("fecha", { ascending: true })
          .limit(10)
      : { data: [] };

  const { data: avisosRecientes } =
    cursosIds.length > 0
      ? await supabase
          .from("avisos")
          .select("id, titulo, curso_id, created_at")
          .in("curso_id", cursosIds)
          .order("created_at", { ascending: false })
          .limit(10)
      : { data: [] };

  const PALETAS = [
    {
      bar: "bg-orange-500",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      barAlumno: "bg-amber-400",
      barOk: "bg-orange-400",
      border: "hover:border-orange-300",
    },
    {
      bar: "bg-violet-500",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-500",
      barAlumno: "bg-violet-300",
      barOk: "bg-violet-500",
      border: "hover:border-violet-300",
    },
    {
      bar: "bg-sky-500",
      iconBg: "bg-sky-50",
      iconColor: "text-sky-500",
      barAlumno: "bg-sky-300",
      barOk: "bg-sky-500",
      border: "hover:border-sky-300",
    },
    {
      bar: "bg-emerald-500",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      barAlumno: "bg-emerald-300",
      barOk: "bg-emerald-500",
      border: "hover:border-emerald-300",
    },
  ];

  return (
    <main className="min-w-0">
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 sticky top-0 z-30">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
          Maestra
        </p>
        <h1 className="text-lg font-black text-gray-900 leading-tight">
          Mis Cursos
        </h1>
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8">
        {cursos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cursos.map((curso: any, idx: number) => {
              const pal = PALETAS[idx % PALETAS.length];
              const totalAlumnos = curso.alumnos?.length ?? 0;
              const alumnosCurso = curso.alumnos?.map((a: any) => a.id) ?? [];
              const completadas = (bitacorasHoy ?? []).filter((b: any) =>
                alumnosCurso.includes(b.alumno_id),
              ).length;
              const pendientes = totalAlumnos - completadas;
              const pct =
                totalAlumnos > 0
                  ? Math.round((completadas / totalAlumnos) * 100)
                  : 0;
              const proximaAct = (actividadesProximas ?? []).find(
                (a: any) => a.curso_id === curso.id,
              );
              const ultimoAviso = (avisosRecientes ?? []).find(
                (a: any) => a.curso_id === curso.id,
              );

              return (
                <div
                  key={curso.id}
                  className={`bg-white rounded-2xl border border-gray-100 ${pal.border} hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col`}
                >
                  {/* Barra color + header clickeable */}
                  <Link
                    href={`/dashboard/maestra/curso/${curso.id}`}
                    className="block group"
                  >
                    <div className={`h-1.5 ${pal.bar}`} />
                    <div className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div
                          className={`w-12 h-12 ${pal.iconBg} rounded-2xl flex items-center justify-center shrink-0`}
                        >
                          <BookOpen size={22} className={pal.iconColor} />
                        </div>
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full ${pal.iconBg} ${pal.iconColor}`}
                        >
                          {totalAlumnos} alumnos
                        </span>
                      </div>
                      <h3 className="font-black text-gray-900 text-xl leading-tight group-hover:text-orange-600 transition-colors">
                        {curso.nombre}
                      </h3>
                      <p className="text-gray-400 text-xs font-medium mt-0.5">
                        Código: {curso.codigo}
                      </p>
                    </div>
                  </Link>

                  {/* Bitácora hoy */}
                  <div className="px-5 pb-4">
                    <div
                      className={`rounded-xl p-3 ${pendientes > 0 ? "bg-amber-50 border border-amber-100" : "bg-green-50 border border-green-100"}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {pendientes > 0 ? (
                            <AlertCircle size={12} className="text-amber-500" />
                          ) : (
                            <CheckCircle2
                              size={12}
                              className="text-green-500"
                            />
                          )}
                          <span
                            className={`text-[10px] font-black uppercase tracking-wide ${pendientes > 0 ? "text-amber-600" : "text-green-600"}`}
                          >
                            Bitácora hoy
                          </span>
                        </div>
                        <span
                          className={`text-xs font-black ${pendientes > 0 ? "text-amber-600" : "text-green-600"}`}
                        >
                          {completadas}/{totalAlumnos}
                        </span>
                      </div>
                      {totalAlumnos > 0 && (
                        <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pendientes > 0 ? "bg-amber-400" : "bg-green-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Info adicional */}
                    {(proximaAct || ultimoAviso) && (
                      <div className="mt-3 space-y-1.5">
                        {proximaAct && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar
                              size={11}
                              className="text-green-400 shrink-0"
                            />
                            <span className="font-medium truncate flex-1">
                              {proximaAct.titulo}
                            </span>
                            {proximaAct.fecha && (
                              <span className="text-green-500 font-black shrink-0">
                                {new Date(
                                  proximaAct.fecha + "T12:00:00",
                                ).toLocaleDateString("es-BO", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            )}
                          </div>
                        )}
                        {ultimoAviso && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Bell size={11} className="text-sky-400 shrink-0" />
                            <span className="font-medium truncate">
                              {ultimoAviso.titulo}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Módulos rápidos — links independientes, NO anidados en la card-link */}
                  <div
                    className={`mt-auto border-t border-gray-50 grid grid-cols-4`}
                  >
                    {[
                      {
                        icon: Users,
                        label: "Alumnos",
                        href: `/dashboard/maestra/curso/${curso.id}/alumnos`,
                      },
                      {
                        icon: ClipboardList,
                        label: "Bitácora",
                        href: `/dashboard/maestra/curso/${curso.id}/bitacora`,
                      },
                      {
                        icon: Bell,
                        label: "Avisos",
                        href: `/dashboard/maestra/curso/${curso.id}/avisos`,
                      },
                      {
                        icon: Calendar,
                        label: "Activ.",
                        href: `/dashboard/maestra/curso/${curso.id}/actividades`,
                      },
                    ].map(({ icon: Icon, label, href }) => (
                      <Link
                        key={href}
                        href={href}
                        className={`flex flex-col items-center gap-1.5 py-3 ${pal.iconBg} hover:opacity-70 transition-all border-r border-white/60 last:border-0`}
                      >
                        <Icon size={15} className={pal.iconColor} />
                        <span
                          className={`text-[9px] font-black ${pal.iconColor}`}
                        >
                          {label}
                        </span>
                      </Link>
                    ))}
                  </div>

                  {/* Ver curso */}
                  <Link
                    href={`/dashboard/maestra/curso/${curso.id}`}
                    className="flex items-center justify-between px-5 py-3 bg-gray-50/50 hover:bg-gray-50 transition-colors border-t border-gray-50"
                  >
                    <span className="text-[11px] font-bold text-gray-400">
                      Ver curso completo
                    </span>
                    <ChevronRight size={14} className="text-gray-300" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center mb-6">
              <BookOpen size={40} className="text-orange-300" />
            </div>
            <h2 className="font-black text-gray-800 text-2xl mb-2">
              Sin cursos asignados
            </h2>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
              El director debe asignarte a un curso para que aparezca aquí
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
