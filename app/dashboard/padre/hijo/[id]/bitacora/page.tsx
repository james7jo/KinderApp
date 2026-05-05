import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Utensils, BookOpen } from "lucide-react";

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

  const ESTADO_CONFIG: Record<
    string,
    { emoji: string; label: string; color: string }
  > = {
    feliz: { emoji: "😊", label: "Feliz", color: "bg-green-50 text-green-600" },
    normal: { emoji: "😐", label: "Normal", color: "bg-gray-50 text-gray-600" },
    triste: { emoji: "😢", label: "Triste", color: "bg-blue-50 text-blue-600" },
    travieso: {
      emoji: "😈",
      label: "Travieso",
      color: "bg-purple-50 text-purple-600",
    },
    cansado: {
      emoji: "😴",
      label: "Cansado",
      color: "bg-yellow-50 text-yellow-600",
    },
    enfermo: { emoji: "🤒", label: "Enfermo", color: "bg-red-50 text-red-600" },
  };

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
          <h1 className="text-lg font-black text-gray-900">Bitácora diaria</h1>
        </div>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto">
        {bitacoras && bitacoras.length > 0 ? (
          <div className="flex flex-col gap-4">
            {bitacoras.map((b) => {
              const estado = b.estado_animo
                ? ESTADO_CONFIG[b.estado_animo]
                : null;
              const fecha = new Date(b.fecha + "T12:00:00").toLocaleDateString(
                "es-BO",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                },
              );

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-500" />
                  <div className="p-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest capitalize mb-4">
                      {fecha}
                    </p>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {/* Comió */}
                      <div
                        className={`rounded-xl p-3 text-center ${b.comio === true ? "bg-green-50" : b.comio === false ? "bg-red-50" : "bg-gray-50"}`}
                      >
                        <Utensils
                          size={16}
                          className={`mx-auto mb-1 ${b.comio === true ? "text-green-500" : b.comio === false ? "text-red-400" : "text-gray-300"}`}
                        />
                        <p
                          className={`text-xs font-bold ${b.comio === true ? "text-green-600" : b.comio === false ? "text-red-500" : "text-gray-400"}`}
                        >
                          {b.comio === true
                            ? "Comió"
                            : b.comio === false
                              ? "No comió"
                              : "—"}
                        </p>
                      </div>

                      {/* Estado */}
                      {estado ? (
                        <div
                          className={`rounded-xl p-3 text-center ${estado.color}`}
                        >
                          <span className="text-xl block mb-1">
                            {estado.emoji}
                          </span>
                          <p className="text-xs font-bold">{estado.label}</p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                          <Heart
                            size={16}
                            className="mx-auto mb-1 text-gray-300"
                          />
                          <p className="text-xs font-bold text-gray-400">—</p>
                        </div>
                      )}

                      {/* Actividades */}
                      <div className="bg-orange-50 rounded-xl p-3 text-center">
                        <BookOpen
                          size={16}
                          className="mx-auto mb-1 text-orange-400"
                        />
                        <p className="text-xs font-bold text-orange-500">
                          {b.actividades ? "Activo" : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Actividades detalle */}
                    {b.actividades && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                          Actividades
                        </p>
                        <p className="text-sm text-gray-700 font-medium">
                          {b.actividades}
                        </p>
                      </div>
                    )}

                    {/* Observaciones */}
                    {b.observaciones ? (
                      <div className="bg-orange-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-orange-400 uppercase tracking-wide mb-1">
                          Mensaje de la maestra
                        </p>
                        <p className="text-sm text-gray-700 font-medium">
                          {b.observaciones}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-sm text-gray-400 font-medium text-center">
                          ✨ Tu hijo está pasando un día de maravilla en el
                          kínder
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-5">
              <BookOpen size={36} className="text-orange-300" />
            </div>
            <h2 className="font-black text-gray-800 text-xl mb-2">
              Sin bitácoras aún
            </h2>
            <p className="text-gray-400 text-sm max-w-xs">
              Cuando la maestra registre el día de tu hijo aparecerá aquí
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
