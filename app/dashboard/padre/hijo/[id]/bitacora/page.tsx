import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Utensils,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

export default async function BitacoraPadrePage({
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

  const { data: bitacoras } = await supabase
    .from("bitacoras")
    .select("*")
    .eq("alumno_id", id)
    .order("fecha", { ascending: false })
    .limit(30);

  const ESTADO: Record<
    string,
    { emoji: string; label: string; bg: string; text: string }
  > = {
    feliz: {
      emoji: "😊",
      label: "Feliz",
      bg: "bg-green-50",
      text: "text-green-600",
    },
    normal: {
      emoji: "😐",
      label: "Normal",
      bg: "bg-gray-50",
      text: "text-gray-600",
    },
    triste: {
      emoji: "😢",
      label: "Triste",
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    travieso: {
      emoji: "😈",
      label: "Travieso",
      bg: "bg-purple-50",
      text: "text-purple-600",
    },
    cansado: {
      emoji: "😴",
      label: "Cansado",
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    enfermo: {
      emoji: "🤒",
      label: "Enfermo",
      bg: "bg-red-50",
      text: "text-red-600",
    },
  };

  // Stats rápidos
  const total = bitacoras?.length ?? 0;
  const comioCount = bitacoras?.filter((b) => b.comio === true).length ?? 0;
  const estadoMasFrecuente =
    bitacoras && bitacoras.length > 0
      ? Object.entries(
          bitacoras.reduce((acc: Record<string, number>, b) => {
            if (b.estado_animo)
              acc[b.estado_animo] = (acc[b.estado_animo] ?? 0) + 1;
            return acc;
          }, {}),
        ).sort(([, a], [, b]) => b - a)[0]?.[0]
      : null;

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
            Bitácora diaria
          </h1>
        </div>
        {total > 0 && (
          <span className="text-xs font-black text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full shrink-0">
            {total} registros
          </span>
        )}
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8">
        {bitacoras && bitacoras.length > 0 ? (
          <>
            {/* STATS — solo PC */}
            <div className="hidden lg:grid grid-cols-3 gap-4 mb-6">
              <div className="bg-orange-500 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg shadow-orange-100">
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-orange-400 opacity-40 rounded-full" />
                <p className="text-3xl font-black relative z-10">{total}</p>
                <p className="text-orange-100 text-sm font-bold mt-1 relative z-10">
                  Días registrados
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-1">
                  <Utensils size={16} className="text-green-500" />
                  <p className="text-2xl font-black text-gray-900">
                    {total > 0 ? Math.round((comioCount / total) * 100) : 0}%
                  </p>
                </div>
                <p className="text-gray-400 text-sm font-bold">
                  Días que comió
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-1">
                  {estadoMasFrecuente && ESTADO[estadoMasFrecuente] ? (
                    <span className="text-2xl">
                      {ESTADO[estadoMasFrecuente].emoji}
                    </span>
                  ) : (
                    <Heart size={20} className="text-gray-300" />
                  )}
                  <p className="font-black text-gray-900 text-sm capitalize">
                    {estadoMasFrecuente
                      ? ESTADO[estadoMasFrecuente]?.label
                      : "Sin datos"}
                  </p>
                </div>
                <p className="text-gray-400 text-sm font-bold">
                  Estado más frecuente
                </p>
              </div>
            </div>

            {/* GRID PC | LISTA MÓVIL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {bitacoras.map((b) => {
                const estado = b.estado_animo ? ESTADO[b.estado_animo] : null;
                const fecha = new Date(
                  b.fecha + "T12:00:00",
                ).toLocaleDateString("es-BO", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                });
                const fechaCorta = new Date(
                  b.fecha + "T12:00:00",
                ).toLocaleDateString("es-BO", {
                  day: "numeric",
                  month: "short",
                });

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Barra color según estado */}
                    <div
                      className={`h-1.5 ${estado ? estado.bg.replace("bg-", "bg-") : "bg-gray-100"}`}
                      style={{ background: estado ? undefined : undefined }}
                    >
                      <div
                        className={`h-full ${
                          b.estado_animo === "feliz"
                            ? "bg-green-400"
                            : b.estado_animo === "triste"
                              ? "bg-blue-400"
                              : b.estado_animo === "enfermo"
                                ? "bg-red-400"
                                : b.estado_animo === "travieso"
                                  ? "bg-purple-400"
                                  : b.estado_animo === "cansado"
                                    ? "bg-amber-400"
                                    : "bg-orange-400"
                        }`}
                      />
                    </div>

                    <div className="p-4">
                      {/* Fecha */}
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest capitalize mb-3">
                        {fecha}
                      </p>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {/* Comió */}
                        <div
                          className={`rounded-xl p-2.5 text-center ${
                            b.comio === true
                              ? "bg-green-50"
                              : b.comio === false
                                ? "bg-red-50"
                                : "bg-gray-50"
                          }`}
                        >
                          {b.comio === true ? (
                            <CheckCircle2
                              size={16}
                              className="mx-auto mb-1 text-green-500"
                            />
                          ) : b.comio === false ? (
                            <XCircle
                              size={16}
                              className="mx-auto mb-1 text-red-400"
                            />
                          ) : (
                            <Utensils
                              size={16}
                              className="mx-auto mb-1 text-gray-300"
                            />
                          )}
                          <p
                            className={`text-[10px] font-black ${
                              b.comio === true
                                ? "text-green-600"
                                : b.comio === false
                                  ? "text-red-500"
                                  : "text-gray-400"
                            }`}
                          >
                            {b.comio === true
                              ? "Comió"
                              : b.comio === false
                                ? "No comió"
                                : "—"}
                          </p>
                        </div>

                        {/* Estado */}
                        <div
                          className={`rounded-xl p-2.5 text-center ${estado ? estado.bg : "bg-gray-50"}`}
                        >
                          {estado ? (
                            <span className="text-lg block mb-1">
                              {estado.emoji}
                            </span>
                          ) : (
                            <Heart
                              size={16}
                              className="mx-auto mb-1 text-gray-300"
                            />
                          )}
                          <p
                            className={`text-[10px] font-black ${estado ? estado.text : "text-gray-400"}`}
                          >
                            {estado ? estado.label : "—"}
                          </p>
                        </div>

                        {/* Actividades */}
                        <div
                          className={`rounded-xl p-2.5 text-center ${b.actividades ? "bg-orange-50" : "bg-gray-50"}`}
                        >
                          <BookOpen
                            size={16}
                            className={`mx-auto mb-1 ${b.actividades ? "text-orange-400" : "text-gray-300"}`}
                          />
                          <p
                            className={`text-[10px] font-black ${b.actividades ? "text-orange-500" : "text-gray-400"}`}
                          >
                            {b.actividades ? "Activo" : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Actividades texto */}
                      {b.actividades && (
                        <div className="mb-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-1">
                            Actividades
                          </p>
                          <p className="text-sm text-gray-700 font-medium">
                            {b.actividades}
                          </p>
                        </div>
                      )}

                      {/* Mensaje de la maestra */}
                      {b.observaciones ? (
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                          <p className="text-[10px] font-black text-orange-500 uppercase tracking-wide mb-1">
                            Nota de la maestra
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {b.observaciones}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-400 font-medium">
                            Sin observaciones este día
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center mb-6">
              <BookOpen size={40} className="text-orange-300" />
            </div>
            <h2 className="font-black text-gray-800 text-2xl mb-2">
              Sin bitácoras aún
            </h2>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
              Cuando la maestra registre el día de tu hijo aparecerá aquí
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
