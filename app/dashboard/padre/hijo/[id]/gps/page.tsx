import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Navigation, ShieldCheck, Zap } from "lucide-react";
import MapaGPS from "@/components/gps/MapaGPS";

export default async function GPSPadrePage({
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

  const { data: alumno } = await supabase
    .from("alumnos")
    .select("nombre, apellido")
    .eq("id", id)
    .single();

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-nunito pb-10 lg:pb-0">
      {/* HEADER PREMIUM */}
      <div className="bg-white border-b border-slate-100 px-5 lg:px-8 py-4 sticky top-0 z-30 flex items-center justify-between backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/padre/hijo/${id}`}
            className="w-10 h-10 bg-slate-50 hover:bg-orange-50 text-slate-400 hover:text-orange-500 rounded-2xl flex items-center justify-center transition-all border border-slate-100"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-orange-500 text-white px-2 py-0.5 rounded-lg uppercase tracking-tighter">
                LIVE GPS
              </span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {alumno?.nombre} {alumno?.apellido}
              </p>
            </div>
            <h1 className="text-xl font-black text-slate-900 leading-tight mt-1">
              Ubicación en vivo
            </h1>
          </div>
        </div>

        {/* Indicador de conexión para PC */}
        <div className="hidden md:flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-emerald-700 text-xs font-black uppercase tracking-widest">
            Señal Activa
          </span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* COLUMNA IZQUIERDA: Info y Seguridad (PC) */}
          <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Navigation size={80} />
              </div>
              <div className="relative z-10">
                <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mb-4">
                  <MapPin size={20} strokeWidth={2.5} />
                </div>
                <h3 className="font-black text-slate-900 text-lg leading-tight">
                  Rastreo Seguro
                </h3>
                <p className="text-slate-400 text-xs font-bold mt-2 leading-relaxed">
                  La ubicación se actualiza automáticamente cada 10 segundos.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="text-emerald-400" size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Privacidad
                </span>
              </div>
              <p className="text-sm font-medium text-slate-300 leading-relaxed">
                Solo tú y el personal autorizado del kinder pueden ver esta
                ubicación.
              </p>
            </div>

            {/* Widget de batería o estado (Opcional decorativo) */}
            <div className="hidden lg:block bg-emerald-500 rounded-[2rem] p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest">
                    Estado Bus
                  </p>
                  <p className="text-2xl font-black mt-1">En Ruta</p>
                </div>
                <Zap size={30} className="text-emerald-200 opacity-50" />
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: El Mapa (Protagonista) */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 h-[60dvh] lg:h-[75dvh] overflow-hidden sticky top-28">
              <div className="w-full h-full rounded-[2rem] overflow-hidden border border-slate-50 relative">
                {/* Overlay de carga o señal (opcional) */}
                <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-100 shadow-lg hidden md:flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                    Streaming Datos
                  </span>
                </div>

                <MapaGPS
                  alumnoId={id}
                  alumnoNombre={`${alumno?.nombre} ${alumno?.apellido}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón flotante de ayuda para móvil */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button className="w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform">
          <ShieldCheck size={24} />
        </button>
      </div>
    </div>
  );
}
