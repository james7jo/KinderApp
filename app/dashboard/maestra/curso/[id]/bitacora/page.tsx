import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react";
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

  const today = new Date().toISOString().split("T")[0];

  const { data: bitacorasHoy } = await supabase
    .from("bitacoras")
    .select("*")
    .eq("maestra_id", user.id)
    .eq("fecha", today);

  const bitacoraMap = new Map(bitacorasHoy?.map((b) => [b.alumno_id, b]) ?? []);

  const fechaFormateada = new Date().toLocaleDateString("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-30 flex items-center gap-4">
        <Link
          href={`/dashboard/maestra/curso/${id}`}
          className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-bold">{curso?.nombre}</p>
          <h1 className="text-lg font-black text-gray-900">Bitácora del día</h1>
        </div>
      </div>

      <div className="px-5 pt-5 max-w-lg mx-auto">
        {/* Fecha + progreso */}
        <div className="bg-orange-500 rounded-2xl p-5 mb-6 text-white">
          <p className="text-orange-100 text-xs font-bold uppercase tracking-widest capitalize mb-1">
            {fechaFormateada}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-2xl">
                {bitacorasHoy?.length ?? 0} / {alumnos?.length ?? 0}
              </p>
              <p className="text-orange-100 text-sm">bitácoras completadas</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <p className="font-black text-2xl">
                {alumnos?.length
                  ? Math.round(
                      ((bitacorasHoy?.length ?? 0) / alumnos.length) * 100,
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>

        {/* Lista de alumnos */}
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
          Alumnos
        </h2>
        <div className="flex flex-col gap-3">
          {alumnos?.map((alumno) => {
            const bitacora = bitacoraMap.get(alumno.id);
            return (
              <div
                key={alumno.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="p-4 flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shrink-0">
                    <span className="font-black text-orange-500 text-sm">
                      {alumno.nombre[0]}
                      {alumno.apellido[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900">
                      {alumno.nombre} {alumno.apellido}
                    </p>
                    {bitacora ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CheckCircle size={13} className="text-green-500" />
                        <p className="text-green-500 text-xs font-bold">
                          Bitácora completada
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock size={13} className="text-orange-400" />
                        <p className="text-orange-400 text-xs font-bold">
                          Pendiente
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <BitacoraForm
                  alumnoId={alumno.id}
                  maestraId={user.id}
                  fecha={today}
                  bitacoraExistente={bitacora ?? null}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
