import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, DollarSign, Package } from "lucide-react";

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

  const hoy = new Date().toISOString().split("T")[0];

  const proximas = actividades?.filter((a) => !a.fecha || a.fecha >= hoy) ?? [];
  const pasadas = actividades?.filter((a) => a.fecha && a.fecha < hoy) ?? [];

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-30 flex items-center gap-3">
        <Link
          href={`/dashboard/padre/hijo/${id}`}
          className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-bold">
            {alumno?.nombre} {alumno?.apellido}
          </p>
          <h1 className="text-lg font-black text-gray-900">Actividades</h1>
        </div>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto">
        {actividades && actividades.length > 0 ? (
          <>
            {proximas.length > 0 && (
              <>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                  Próximas
                </h2>
                <div className="flex flex-col gap-3 mb-7">
                  {proximas.map((a) => (
                    <ActividadCard key={a.id} actividad={a} />
                  ))}
                </div>
              </>
            )}

            {pasadas.length > 0 && (
              <>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                  Pasadas
                </h2>
                <div className="flex flex-col gap-3 opacity-60">
                  {pasadas.map((a) => (
                    <ActividadCard key={a.id} actividad={a} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-5">
              <span className="text-4xl">📅</span>
            </div>
            <h2 className="font-black text-gray-800 text-xl mb-2">
              Sin actividades aún
            </h2>
            <p className="text-gray-400 text-sm max-w-xs">
              Cuando la maestra cree una actividad aparecerá aquí
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActividadCard({ actividad }: { actividad: any }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-green-400 to-green-500" />
      <div className="p-5">
        <h3 className="font-black text-gray-900 text-base mb-2">
          {actividad.titulo}
        </h3>
        {actividad.descripcion && (
          <p className="text-gray-500 text-sm mb-3">{actividad.descripcion}</p>
        )}

        <div className="flex flex-col gap-2">
          {actividad.fecha && (
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-orange-400 shrink-0" />
              <p className="text-sm font-bold text-gray-700 capitalize">
                {new Date(actividad.fecha + "T12:00:00").toLocaleDateString(
                  "es-BO",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  },
                )}
                {actividad.hora && ` · ${actividad.hora.slice(0, 5)}`}
              </p>
            </div>
          )}
          {actividad.lugar && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400 shrink-0" />
              <p className="text-sm text-gray-500">{actividad.lugar}</p>
            </div>
          )}
          {actividad.material_requerido && (
            <div className="flex items-center gap-2">
              <Package size={14} className="text-purple-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-purple-500 uppercase tracking-wide">
                  Material requerido
                </p>
                <p className="text-sm text-gray-600">
                  {actividad.material_requerido}
                </p>
              </div>
            </div>
          )}
          {actividad.tiene_cuota && (
            <div className="mt-2 bg-orange-50 rounded-xl p-3 flex items-center gap-2">
              <DollarSign size={16} className="text-orange-500 shrink-0" />
              <div>
                <p className="font-black text-orange-600 text-lg">
                  Bs {actividad.monto_cuota}
                </p>
                {actividad.descripcion_cuota && (
                  <p className="text-orange-400 text-xs font-medium">
                    {actividad.descripcion_cuota}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
