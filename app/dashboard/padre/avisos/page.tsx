import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AvisosPadreGeneralPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Obtener todos los hijos del padre
  const { data: tutores } = await supabase
    .from("tutores")
    .select(`alumno_id, alumnos(nombre, apellido, curso_id)`)
    .eq("user_id", user.id);

  // Obtener avisos de todos los cursos de sus hijos
  const cursoIds =
    tutores?.map((t: any) => t.alumnos?.curso_id).filter(Boolean) ?? [];

  const { data: avisosGlobales } = await supabase
    .from("avisos")
    .select("*")
    .in("curso_id", cursoIds.length > 0 ? cursoIds : ["none"])
    .eq("tipo", "global")
    .order("created_at", { ascending: false });

  const { data: avisosPrivados } = await supabase
    .from("avisos")
    .select("*")
    .in("curso_id", cursoIds.length > 0 ? cursoIds : ["none"])
    .eq("tipo", "privado")
    .eq("destinatario_id", user.id)
    .order("created_at", { ascending: false });

  const avisos = [...(avisosPrivados ?? []), ...(avisosGlobales ?? [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-30">
        <p className="text-xs text-gray-400 font-bold">PADRE</p>
        <h1 className="text-lg font-black text-gray-900">Avisos</h1>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto">
        {avisos.length > 0 ? (
          <div className="flex flex-col gap-3">
            {avisos.map((aviso) => {
              const esPrivado = aviso.tipo === "privado";
              const fecha = new Date(aviso.created_at).toLocaleDateString(
                "es-BO",
                {
                  day: "numeric",
                  month: "short",
                },
              );

              return (
                <div
                  key={aviso.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div
                    className={`h-1.5 ${
                      esPrivado
                        ? "bg-gradient-to-r from-blue-400 to-blue-500"
                        : "bg-gradient-to-r from-orange-400 to-orange-500"
                    }`}
                  />
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-xs font-black px-2 py-1 rounded-lg ${
                          esPrivado
                            ? "bg-blue-50 text-blue-500"
                            : "bg-orange-50 text-orange-500"
                        }`}
                      >
                        {esPrivado ? "🔒 Solo para ti" : "📢 General"}
                      </span>
                      <p className="text-xs text-gray-400 font-medium">
                        {fecha}
                      </p>
                    </div>
                    <h3 className="font-black text-gray-900 text-base mb-2">
                      {aviso.titulo}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {aviso.contenido}
                    </p>

                    {aviso.fecha && (
                      <div className="mt-4 bg-orange-50 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                          <div className="text-center">
                            <p className="text-white font-black text-lg leading-none">
                              {new Date(aviso.fecha + "T12:00:00").getDate()}
                            </p>
                            <p className="text-orange-200 text-xs leading-none capitalize">
                              {new Date(
                                aviso.fecha + "T12:00:00",
                              ).toLocaleDateString("es-BO", { month: "short" })}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="font-black text-gray-800 text-sm capitalize">
                            {new Date(
                              aviso.fecha + "T12:00:00",
                            ).toLocaleDateString("es-BO", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            {aviso.hora && (
                              <p className="text-orange-500 text-xs font-bold">
                                🕐 {aviso.hora.slice(0, 5)}
                              </p>
                            )}
                            {aviso.lugar && (
                              <p className="text-gray-500 text-xs font-medium">
                                📍 {aviso.lugar}
                              </p>
                            )}
                          </div>
                        </div>
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
              <span className="text-4xl">📢</span>
            </div>
            <h2 className="font-black text-gray-800 text-xl mb-2">
              Sin avisos aún
            </h2>
            <p className="text-gray-400 text-sm max-w-xs">
              Cuando la maestra publique un aviso aparecerá aquí
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
