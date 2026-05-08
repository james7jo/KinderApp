import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Baby,
  Plus,
  ArrowRight,
  Bell,
  ClipboardList,
  Calendar,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { hoyBolivia, fechaLabelBolivia } from "@/lib/fecha-bolivia";
import CalendarioFamilia from "@/components/CalendarioFamilia";

export default async function PadrePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: tutores } = await supabase
    .from("tutores")
    .select(
      `id, relacion, alumno_id, alumnos ( id, nombre, apellido, foto_url, cursos ( id, nombre ) )`,
    )
    .eq("user_id", user.id);

  const hijos =
    tutores
      ?.map((t: any) => ({ ...t.alumnos, relacion: t.relacion }))
      .filter(Boolean) ?? [];
  const hijosIds = hijos.map((h: any) => h.id);

  const today = hoyBolivia();
  const todayLabel = fechaLabelBolivia();

  const { data: bitacorasHoy } =
    hijosIds.length > 0
      ? await supabase
          .from("bitacoras")
          .select("alumno_id, estado_animo, comio, observaciones")
          .in("alumno_id", hijosIds)
          .eq("fecha", today)
      : { data: [] };

  const cursosIds = hijos.map((h: any) => h.cursos?.id).filter(Boolean);
  const { data: avisosRecientes } =
    cursosIds.length > 0
      ? await supabase
          .from("avisos")
          .select("id, titulo, tipo, fecha, hora, created_at, curso_id")
          .in("curso_id", cursosIds)
          .order("created_at", { ascending: false })
          .limit(4)
      : { data: [] };

  const { data: actividadesProximas } =
    cursosIds.length > 0
      ? await supabase
          .from("actividades")
          .select("id, titulo, fecha, descripcion, curso_id")
          .in("curso_id", cursosIds)
          .gte("fecha", today)
          .order("fecha", { ascending: true })
          .limit(4)
      : { data: [] };

  const primerNombre = profile?.full_name?.split(" ")[0] ?? "Papá";
  const hora = new Date().getHours();
  const saludo =
    hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  const ESTADO_EMOJI: Record<string, string> = {
    feliz: "😊",
    normal: "😐",
    triste: "😢",
    travieso: "😈",
    cansado: "😴",
    enfermo: "🤒",
  };

  const eventosCalendario = [
    ...(actividadesProximas ?? [])
      .map((a: any) => ({
        fecha: a.fecha,
        titulo: a.titulo,
        tipo: "actividad" as const,
        hijoNombre: hijos.find((h: any) => h.cursos?.id === a.curso_id)?.nombre,
      }))
      .filter((e) => e.fecha),
    ...(avisosRecientes ?? [])
      .map((a: any) => ({
        fecha: a.fecha,
        titulo: a.titulo,
        tipo: "aviso" as const,
        hijoNombre: hijos.find((h: any) => h.cursos?.id === a.curso_id)?.nombre,
      }))
      .filter((e) => e.fecha),
  ];

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
        <Link
          href="/dashboard/padre/agregar-hijo"
          className="w-9 h-9 bg-orange-500 hover:bg-orange-600 rounded-xl flex items-center justify-center transition-all shadow-md shadow-orange-200 active:scale-95"
        >
          <Plus size={20} className="text-white" />
        </Link>
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8">
        {hijos.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── COLUMNA IZQUIERDA: HIJOS Y ACCESOS ── */}
            <div className="lg:col-span-2 space-y-8">
              {/* MIS HIJOS */}
              <div>
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                  Mis hijos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hijos.map((hijo: any, idx: number) => {
                    const bitacora = (bitacorasHoy ?? []).find(
                      (b: any) => b.alumno_id === hijo.id,
                    );
                    const GRADIENTS = [
                      "from-orange-400 to-orange-600",
                      "from-violet-400 to-violet-600",
                      "from-sky-400 to-sky-600",
                      "from-emerald-400 to-emerald-600",
                    ];
                    const grad = GRADIENTS[idx % GRADIENTS.length];

                    return (
                      <Link
                        key={hijo.id}
                        href={`/dashboard/padre/hijo/${hijo.id}`}
                        className="bg-white rounded-[2rem] border border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all group overflow-hidden"
                      >
                        <div className={`bg-gradient-to-r ${grad} p-5`}>
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white/30">
                              {hijo.foto_url ? (
                                <img
                                  src={hijo.foto_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-black text-2xl">
                                  {hijo.nombre[0]}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 text-white">
                              <p className="font-black text-lg truncate leading-tight">
                                {hijo.nombre} {hijo.apellido}
                              </p>
                              <p className="text-white/70 text-xs font-bold uppercase tracking-tighter">
                                {hijo.cursos?.nombre ?? "Sin curso"}
                              </p>
                            </div>
                            <ArrowRight
                              size={20}
                              className="text-white/60 group-hover:text-white transition-colors"
                            />
                          </div>
                        </div>
                        <div className="px-5 py-4 bg-white">
                          {bitacora ? (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
                                <ClipboardList size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-black text-gray-900">
                                  Bitácora registrada
                                </p>
                                <p className="text-xs text-gray-400 font-bold">
                                  {bitacora.estado_animo
                                    ? ESTADO_EMOJI[bitacora.estado_animo]
                                    : ""}{" "}
                                  {bitacora.comio ? "Comió bien ✓" : ""}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 opacity-60">
                              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                <ClipboardList size={18} />
                              </div>
                              <p className="text-sm font-bold text-slate-400 tracking-tight">
                                Sin reporte hoy todavía
                              </p>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* ACCESOS RÁPIDOS — AHORA MÁS GRANDES */}
              <div>
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                  Accesos rápidos
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      href: `/dashboard/padre/hijo/${hijos[0]?.id}/bitacora`,
                      label: "Bitácora",
                      icon: ClipboardList,
                      color: "bg-violet-500",
                      shadow: "shadow-violet-100",
                      text: "text-violet-600",
                    },
                    {
                      href: "/dashboard/padre/avisos",
                      label: "Avisos",
                      icon: Bell,
                      color: "bg-sky-500",
                      shadow: "shadow-sky-100",
                      text: "text-sky-600",
                    },
                    {
                      href: `/dashboard/padre/hijo/${hijos[0]?.id}/actividades`,
                      label: "Actividades",
                      icon: Calendar,
                      color: "bg-emerald-500",
                      shadow: "shadow-emerald-100",
                      text: "text-emerald-600",
                    },
                    {
                      href: `/dashboard/padre/hijo/${hijos[0]?.id}/gps`,
                      label: "GPS Vivo",
                      icon: MapPin,
                      color: "bg-orange-500",
                      shadow: "shadow-orange-100",
                      text: "text-orange-600",
                    },
                  ].map(({ href, label, icon: Icon, color, shadow, text }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-xl transition-all group text-center`}
                    >
                      <div
                        className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg ${shadow} group-hover:scale-110 transition-transform`}
                      >
                        <Icon size={24} strokeWidth={2.5} />
                      </div>
                      <p
                        className={`font-black ${text} text-sm uppercase tracking-tighter`}
                      >
                        {label}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* ── COLUMNA DERECHA: CALENDARIO Y ALERTAS ── */}
            <div className="lg:col-span-1 space-y-6">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* CALENDARIO */}
                <div className="bg-white rounded-[2.5rem] p-2 border border-gray-100 shadow-sm">
                  <CalendarioFamilia eventos={eventosCalendario} />
                </div>

                {/* ALERTAS DEBAJO DEL CALENDARIO */}
                {((actividadesProximas && actividadesProximas.length > 0) ||
                  (avisosRecientes && avisosRecientes.length > 0)) && (
                  <div className="space-y-3">
                    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">
                      Alertas próximas
                    </h2>
                    <div className="flex flex-col gap-2">
                      {actividadesProximas?.map((act: any) => (
                        <div
                          key={act.id}
                          className="bg-white rounded-2xl border border-slate-50 p-4 flex items-center gap-3 shadow-sm"
                        >
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                            <Calendar size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-900 text-sm truncate">
                              {act.titulo}
                            </p>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase">
                              {new Date(
                                act.fecha + "T12:00:00",
                              ).toLocaleDateString("es-BO", {
                                day: "numeric",
                                month: "long",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {avisosRecientes?.map((aviso: any) => (
                        <div
                          key={aviso.id}
                          className="bg-white rounded-2xl border border-slate-50 p-4 flex items-center gap-3 shadow-sm"
                        >
                          <div className="w-10 h-10 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center shrink-0">
                            <Bell size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-900 text-sm truncate">
                              {aviso.titulo}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              Nuevo Comunicado
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center mb-6">
              <Baby size={40} className="text-orange-300" />
            </div>
            <h2 className="font-black text-gray-800 text-2xl mb-2">
              ¡Agregá a tu hijo!
            </h2>
            <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
              Usá el código del aula para registrar a tu hijo y ver su progreso
              diario.
            </p>
            <Link
              href="/dashboard/padre/agregar-hijo"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-lg shadow-orange-200"
            >
              <Plus size={20} strokeWidth={3} /> Agregar hijo
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
