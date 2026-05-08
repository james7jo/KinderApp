import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AvisosPadrePage({
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

  // Avisos globales
  const { data: avisosGlobales } = await supabase
    .from("avisos")
    .select("*")
    .eq("curso_id", alumno?.curso_id)
    .eq("tipo", "global")
    .order("created_at", { ascending: false });

  // Avisos privados
  const { data: avisosPrivados } = await supabase
    .from("avisos")
    .select("*")
    .eq("curso_id", alumno?.curso_id)
    .eq("tipo", "privado")
    .eq("destinatario_id", user.id)
    .order("created_at", { ascending: false });

  const avisos = [...(avisosPrivados ?? []), ...(avisosGlobales ?? [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="min-h-screen bg-gray-50 font-nunito">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href={`/dashboard/padre/hijo/${id}`}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 transition hover:bg-gray-200"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </Link>

          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold uppercase tracking-wide text-gray-400">
              {alumno?.nombre} {alumno?.apellido}
            </p>

            <h1 className="text-xl font-black text-gray-900 sm:text-2xl">
              Avisos
            </h1>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {avisos.length > 0 ? (
          <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
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
                <article
                  key={aviso.id}
                  className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* TOP BAR */}
                  <div
                    className={`h-1.5 w-full ${
                      esPrivado
                        ? "bg-gradient-to-r from-blue-400 to-blue-500"
                        : "bg-gradient-to-r from-orange-400 to-orange-500"
                    }`}
                  />

                  <div className="p-5 sm:p-6">
                    {/* TOP INFO */}
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span
                        className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-black ${
                          esPrivado
                            ? "bg-blue-50 text-blue-600"
                            : "bg-orange-50 text-orange-600"
                        }`}
                      >
                        {esPrivado ? "🔒 Solo para ti" : "📢 General"}
                      </span>

                      <p className="shrink-0 text-xs font-semibold text-gray-400">
                        {fecha}
                      </p>
                    </div>

                    {/* TITLE */}
                    <h2 className="mb-3 text-lg font-black leading-tight text-gray-900 sm:text-xl">
                      {aviso.titulo}
                    </h2>

                    {/* CONTENT */}
                    <p className="text-sm leading-relaxed text-gray-600 sm:text-[15px]">
                      {aviso.contenido}
                    </p>

                    {/* EVENT */}
                    {aviso.fecha && (
                      <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
                        <div className="flex items-start gap-4">
                          {/* DATE BOX */}
                          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-orange-500 shadow-sm">
                            <span className="text-lg font-black leading-none text-white">
                              {new Date(aviso.fecha + "T12:00:00").getDate()}
                            </span>

                            <span className="text-[10px] font-bold uppercase tracking-wide text-orange-100">
                              {new Date(
                                aviso.fecha + "T12:00:00",
                              ).toLocaleDateString("es-BO", {
                                month: "short",
                              })}
                            </span>
                          </div>

                          {/* EVENT INFO */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black capitalize leading-snug text-gray-800 sm:text-base">
                              {new Date(
                                aviso.fecha + "T12:00:00",
                              ).toLocaleDateString("es-BO", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              })}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                              {aviso.hora && (
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-orange-600 shadow-sm">
                                  🕐 {aviso.hora.slice(0, 5)}
                                </span>
                              )}

                              {aviso.lugar && (
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm">
                                  📍 {aviso.lugar}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-orange-50 shadow-sm">
              <span className="text-5xl">📢</span>
            </div>

            <h2 className="mb-2 text-2xl font-black text-gray-800">
              Sin avisos aún
            </h2>

            <p className="max-w-sm text-sm leading-relaxed text-gray-400 sm:text-base">
              Cuando la maestra publique un aviso aparecerá aquí
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
