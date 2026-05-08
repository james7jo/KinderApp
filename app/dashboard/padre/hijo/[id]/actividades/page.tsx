import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Package,
  Clock,
} from "lucide-react";
import { hoyBolivia } from "@/lib/fecha-bolivia";

export default async function ActividadesPadrePage({
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
    .select("nombre, apellido, curso_id")
    .eq("id", id)
    .single();

  const { data: actividades } = await supabase
    .from("actividades")
    .select("*")
    .eq("curso_id", alumno?.curso_id)
    .order("fecha", { ascending: true, nullsFirst: false });

  const hoy = hoyBolivia();
  const proximas = actividades?.filter((a) => !a.fecha || a.fecha >= hoy) ?? [];
  const pasadas = actividades?.filter((a) => a.fecha && a.fecha < hoy) ?? [];

  return (
    <main className="min-w-0 font-nunito">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center gap-3 sticky top-0 z-30">
        <Link
          href={`/dashboard/padre/hijo/${id}`}
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate">
            {alumno?.nombre} {alumno?.apellido}
          </p>
          <h1 className="text-lg font-black text-gray-900 leading-tight">
            Actividades
          </h1>
        </div>
        {actividades && actividades.length > 0 && (
          <span className="text-xs font-black text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full shrink-0">
            {proximas.length} próximas
          </span>
        )}
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8">
        {actividades && actividades.length > 0 ? (
          <div className="space-y-8">
            {/* PRÓXIMAS */}
            {proximas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Próximas ({proximas.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {proximas.map((a) => (
                    <ActividadCard key={a.id} actividad={a} hoy={hoy} />
                  ))}
                </div>
              </div>
            )}

            {/* PASADAS */}
            {pasadas.length > 0 && (
              <div>
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  Pasadas ({pasadas.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 opacity-60">
                  {pasadas.map((a) => (
                    <ActividadCard key={a.id} actividad={a} hoy={hoy} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center mb-6">
              <Calendar size={40} className="text-green-300" />
            </div>
            <h2 className="font-black text-gray-800 text-2xl mb-2">
              Sin actividades aún
            </h2>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
              Cuando la maestra cree una actividad aparecerá aquí
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function ActividadCard({ actividad, hoy }: { actividad: any; hoy: string }) {
  const diasRestantes = actividad.fecha
    ? Math.ceil(
        (new Date(actividad.fecha + "T12:00:00").getTime() -
          new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;
  const esHoy = diasRestantes === 0;
  const esManana = diasRestantes === 1;
  const esPronto =
    diasRestantes !== null && diasRestantes <= 3 && diasRestantes > 1;

  const urgencia = esHoy
    ? "border-orange-300 bg-orange-50/50"
    : esManana
      ? "border-amber-200 bg-amber-50/50"
      : esPronto
        ? "border-green-200 bg-green-50/50"
        : "border-gray-100 bg-white";

  const barColor = esHoy
    ? "bg-orange-500"
    : esManana
      ? "bg-amber-400"
      : esPronto
        ? "bg-green-400"
        : "bg-green-300";

  return (
    <div
      className={`rounded-2xl border overflow-hidden hover:shadow-md transition-all ${urgencia}`}
    >
      <div className={`h-1.5 ${barColor}`} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-black text-gray-900 text-base leading-tight flex-1">
            {actividad.titulo}
          </h3>
          {diasRestantes !== null && diasRestantes >= 0 && (
            <span
              className={`text-[10px] font-black px-2 py-1 rounded-full shrink-0 ${
                esHoy
                  ? "bg-orange-500 text-white"
                  : esManana
                    ? "bg-amber-400 text-white"
                    : "bg-green-100 text-green-700"
              }`}
            >
              {esHoy ? "Hoy" : esManana ? "Mañana" : `${diasRestantes}d`}
            </span>
          )}
        </div>

        {actividad.descripcion && (
          <p className="text-gray-500 text-sm mb-3 leading-relaxed">
            {actividad.descripcion}
          </p>
        )}

        {/* Detalles */}
        <div className="space-y-2">
          {actividad.fecha && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                <Calendar size={13} className="text-orange-500" />
              </div>
              <p className="text-sm font-bold text-gray-700 capitalize">
                {new Date(actividad.fecha + "T12:00:00").toLocaleDateString(
                  "es-BO",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  },
                )}
                {actividad.hora && (
                  <span className="text-gray-400 font-medium">
                    {" "}
                    · {actividad.hora.slice(0, 5)}
                  </span>
                )}
              </p>
            </div>
          )}

          {actividad.lugar && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                <MapPin size={13} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 font-medium">
                {actividad.lugar}
              </p>
            </div>
          )}

          {actividad.material_requerido && (
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Package size={13} className="text-violet-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-violet-500 uppercase tracking-wide">
                  Material requerido
                </p>
                <p className="text-sm text-gray-700 font-medium">
                  {actividad.material_requerido}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Cuota */}
        {actividad.tiene_cuota && (
          <div className="mt-3 bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
              <DollarSign size={16} className="text-white" />
            </div>
            <div>
              <p className="font-black text-orange-600 text-lg leading-none">
                Bs {actividad.monto_cuota}
              </p>
              {actividad.descripcion_cuota && (
                <p className="text-orange-400 text-xs font-medium mt-0.5">
                  {actividad.descripcion_cuota}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
