import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Bell, Lock, MapPin, Clock, Calendar } from "lucide-react";
import { hoyBolivia } from "@/lib/fecha-bolivia";

export default async function AvisosPadreGeneralPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: tutores } = await supabase
    .from("tutores")
    .select(`alumno_id, alumnos(nombre, apellido, curso_id, cursos(nombre))`)
    .eq("user_id", user.id);

  const cursoIds =
    tutores?.map((t: any) => t.alumnos?.curso_id).filter(Boolean) ?? [];

  const [{ data: avisosGlobales }, { data: avisosPrivados }] =
    await Promise.all([
      supabase
        .from("avisos")
        .select("*")
        .in("curso_id", cursoIds.length > 0 ? cursoIds : ["none"])
        .eq("tipo", "global")
        .order("created_at", { ascending: false }),
      supabase
        .from("avisos")
        .select("*")
        .in("curso_id", cursoIds.length > 0 ? cursoIds : ["none"])
        .eq("tipo", "privado")
        .eq("destinatario_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  const avisos = [...(avisosPrivados ?? []), ...(avisosGlobales ?? [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const hoy = hoyBolivia();

  // Mapear curso → hijo
  const cursoHijoMap: Record<string, string> = {};
  tutores?.forEach((t: any) => {
    if (t.alumnos?.curso_id) {
      cursoHijoMap[t.alumnos.curso_id] =
        `${t.alumnos.nombre} · ${t.alumnos.cursos?.nombre ?? ""}`;
    }
  });

  const privados = avisos.filter((a) => a.tipo === "privado");
  const generales = avisos.filter((a) => a.tipo !== "privado");

  return (
    <main className="min-w-0 font-nunito">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            Padre / Madre
          </p>
          <h1 className="text-lg font-black text-gray-900 leading-tight">
            Avisos
          </h1>
        </div>
        {avisos.length > 0 && (
          <span className="text-xs font-black text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
            {avisos.length} total
          </span>
        )}
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8">
        {avisos.length > 0 ? (
          <div className="space-y-8">
            {/* PRIVADOS */}
            {privados.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={12} className="text-blue-500" />
                  <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                    Solo para ti ({privados.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {privados.map((aviso) => (
                    <AvisoCard
                      key={aviso.id}
                      aviso={aviso}
                      hoy={hoy}
                      hijoLabel={cursoHijoMap[aviso.curso_id]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* GENERALES */}
            {generales.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Bell size={12} className="text-orange-500" />
                  <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Generales ({generales.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {generales.map((aviso) => (
                    <AvisoCard
                      key={aviso.id}
                      aviso={aviso}
                      hoy={hoy}
                      hijoLabel={cursoHijoMap[aviso.curso_id]}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-24 h-24 bg-sky-50 rounded-3xl flex items-center justify-center mb-6">
              <Bell size={40} className="text-sky-300" />
            </div>
            <h2 className="font-black text-gray-800 text-2xl mb-2">
              Sin avisos aún
            </h2>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
              Cuando la maestra publique un aviso aparecerá aquí
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function AvisoCard({
  aviso,
  hoy,
  hijoLabel,
}: {
  aviso: any;
  hoy: string;
  hijoLabel?: string;
}) {
  const esPrivado = aviso.tipo === "privado";
  const fecha = new Date(aviso.created_at).toLocaleDateString("es-BO", {
    day: "numeric",
    month: "short",
  });
  const tieneEvento = !!aviso.fecha;
  const esFuturo = tieneEvento && aviso.fecha >= hoy;

  const diasRestantes = tieneEvento
    ? Math.ceil(
        (new Date(aviso.fecha + "T12:00:00").getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all ${
        esPrivado ? "border-blue-200" : "border-gray-100"
      }`}
    >
      {/* Barra color */}
      <div className={`h-1.5 ${esPrivado ? "bg-blue-400" : "bg-orange-400"}`} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                esPrivado ? "bg-blue-50" : "bg-orange-50"
              }`}
            >
              {esPrivado ? (
                <Lock size={13} className="text-blue-500" />
              ) : (
                <Bell size={13} className="text-orange-500" />
              )}
            </div>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                esPrivado
                  ? "bg-blue-50 text-blue-600"
                  : "bg-orange-50 text-orange-600"
              }`}
            >
              {esPrivado ? "Solo para ti" : "General"}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">{fecha}</p>
        </div>

        {/* Hijo/curso */}
        {hijoLabel && (
          <p className="text-[10px] font-bold text-gray-400 mb-2 truncate">
            {hijoLabel}
          </p>
        )}

        {/* Contenido */}
        <h3 className="font-black text-gray-900 text-base mb-2 leading-tight">
          {aviso.titulo}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          {aviso.contenido}
        </p>

        {/* Evento */}
        {tieneEvento && (
          <div
            className={`mt-3 rounded-xl p-3 flex items-center gap-3 ${
              esFuturo ? "bg-orange-50 border border-orange-100" : "bg-gray-50"
            }`}
          >
            {/* Mini calendario */}
            <div
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                esFuturo ? "bg-orange-500" : "bg-gray-300"
              }`}
            >
              <p className="text-white font-black text-base leading-none">
                {new Date(aviso.fecha + "T12:00:00").getDate()}
              </p>
              <p className="text-white/80 text-[9px] font-bold uppercase">
                {new Date(aviso.fecha + "T12:00:00").toLocaleDateString(
                  "es-BO",
                  { month: "short" },
                )}
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`font-bold text-sm capitalize truncate ${esFuturo ? "text-gray-800" : "text-gray-500"}`}
              >
                {new Date(aviso.fecha + "T12:00:00").toLocaleDateString(
                  "es-BO",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  },
                )}
              </p>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {aviso.hora && (
                  <div className="flex items-center gap-1">
                    <Clock size={11} className="text-orange-400" />
                    <span className="text-xs font-bold text-orange-500">
                      {aviso.hora.slice(0, 5)}
                    </span>
                  </div>
                )}
                {aviso.lugar && (
                  <div className="flex items-center gap-1">
                    <MapPin size={11} className="text-gray-400" />
                    <span className="text-xs text-gray-500 truncate">
                      {aviso.lugar}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {diasRestantes !== null && diasRestantes >= 0 && (
              <span
                className={`text-[10px] font-black px-2 py-1 rounded-full shrink-0 ${
                  diasRestantes === 0
                    ? "bg-orange-500 text-white"
                    : diasRestantes === 1
                      ? "bg-amber-400 text-white"
                      : "bg-green-100 text-green-700"
                }`}
              >
                {diasRestantes === 0
                  ? "Hoy"
                  : diasRestantes === 1
                    ? "Mañana"
                    : `${diasRestantes}d`}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
