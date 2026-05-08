import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Users,
  CalendarDays,
  Zap,
} from "lucide-react";
import BitacoraForm from "@/components/bitacora/BitacoraForm";

export default async function BitacoraPage({
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
    .select("nombre")
    .eq("id", id)
    .single();
  const { data: alumnos } = await supabase
    .from("alumnos")
    .select("id, nombre, apellido, foto_url")
    .eq("curso_id", id)
    .order("nombre");

  // ── FIX HORARIO BOLIVIA ──
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const { data: bitacorasHoy } = await supabase
    .from("bitacoras")
    .select("*")
    .eq("maestra_id", user.id)
    .eq("fecha", today);

  const bitacoraMap = new Map(bitacorasHoy?.map((b) => [b.alumno_id, b]) ?? []);
  const completados = bitacorasHoy?.length ?? 0;
  const total = alumnos?.length ?? 0;
  const porcentaje = total ? Math.round((completados / total) * 100) : 0;

  const fechaFormateada = new Date().toLocaleDateString("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-nunito pb-20">
      {/* HEADER DINÁMICO */}
      <div className="bg-white border-b border-slate-100 px-6 py-5 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/maestra/curso/${id}`}
              className="w-10 h-10 bg-slate-50 hover:bg-orange-50 text-slate-400 hover:text-orange-500 rounded-2xl flex items-center justify-center transition-all border border-slate-100"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-lg uppercase tracking-tighter">
                  {curso?.nombre}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Control Diario
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-none mt-1">
                Bitácora Escolar
              </h1>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-700 text-xs font-black uppercase tracking-widest">
              Sincronizado
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 pt-8">
        {/* DASHBOARD DE PROGRESO (DISEÑO TESIS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {/* Card Fecha */}
          <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                <CalendarDays size={18} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Hoy es
              </span>
            </div>
            <p className="text-lg font-black text-slate-900 capitalize">
              {fechaFormateada}
            </p>
          </div>

          {/* Card Progreso Principal */}
          <div className="md:col-span-2 bg-orange-500 rounded-[2.5rem] p-6 text-white shadow-xl shadow-orange-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20 transform rotate-12">
              <Zap size={120} strokeWidth={3} />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs font-black uppercase tracking-[0.2em] mb-1">
                  Estado de Avance
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">{completados}</span>
                  <span className="text-orange-200 text-xl font-bold">
                    / {total}
                  </span>
                </div>
                <p className="text-orange-100 text-sm font-bold mt-2 italic">
                  "
                  {completados === total
                    ? "¡Excelente trabajo hoy!"
                    : "Faltan bitácoras por llenar"}
                  "
                </p>
              </div>
              <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center border border-white/30">
                <span className="text-3xl font-black">{porcentaje}%</span>
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-80">
                  Listo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LISTADO DE ALUMNOS */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white">
            <Users size={16} />
          </div>
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
            Estudiantes del Curso
          </h2>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alumnos?.map((alumno) => {
            const bitacora = bitacoraMap.get(alumno.id);
            const estaListo = !!bitacora;

            return (
              <div
                key={alumno.id}
                className={`bg-white rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden group ${
                  estaListo
                    ? "border-emerald-100 shadow-emerald-50"
                    : "border-slate-50 hover:border-orange-200"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar Pro */}
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-4 border-white shadow-md transition-transform group-hover:scale-110 ${
                          estaListo
                            ? "bg-emerald-50 text-emerald-500"
                            : "bg-orange-50 text-orange-500"
                        }`}
                      >
                        {alumno.foto_url ? (
                          <img
                            src={alumno.foto_url}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <span className="text-lg font-black uppercase">
                            {alumno.nombre[0]}
                            {alumno.apellido[0]}
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="font-black text-slate-900 text-lg leading-tight">
                          {alumno.nombre}
                        </p>
                        <p className="text-slate-400 text-sm font-bold">
                          {alumno.apellido}
                        </p>
                      </div>
                    </div>

                    {estaListo ? (
                      <div className="bg-emerald-500 text-white p-2 rounded-2xl shadow-lg shadow-emerald-100 animate-in zoom-in duration-300">
                        <CheckCircle2 size={24} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="bg-slate-50 text-slate-300 p-2 rounded-2xl">
                        <Clock size={24} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* El Formulario dinámico */}
                  <div
                    className={`rounded-3xl transition-all ${estaListo ? "bg-slate-50/50" : "bg-white"}`}
                  >
                    <BitacoraForm
                      alumnoId={alumno.id}
                      maestraId={user.id}
                      fecha={today}
                      bitacoraExistente={bitacora ?? null}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
