import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  ClipboardList,
  Calendar,
  BookOpen,
} from "lucide-react";

export default async function CursoDirectorPage({
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
    .select("nombre, codigo")
    .eq("id", id)
    .single();

  const { data: maestras } = await supabase
    .from("maestra_curso")
    .select("profiles(full_name)")
    .eq("curso_id", id);

  const { data: alumnos } = await supabase
    .from("alumnos")
    .select("id, nombre, apellido, genero, fecha_nacimiento")
    .eq("curso_id", id)
    .order("nombre");

  const today = new Date().toISOString().split("T")[0];

  const { data: bitacorasHoy } = await supabase
    .from("bitacoras")
    .select("alumno_id")
    .eq("fecha", today)
    .in("alumno_id", alumnos?.map((a) => a.id) ?? []);

  const { data: actividades } = await supabase
    .from("actividades")
    .select("id, titulo, fecha")
    .eq("curso_id", id)
    .order("fecha", { ascending: true })
    .limit(3);

  const asistenciaHoy = bitacorasHoy?.length ?? 0;
  const totalAlumnos = alumnos?.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28 lg:pb-10">
      <div className="bg-white border-b border-gray-100 px-5 lg:px-8 py-4 sticky top-0 z-30 flex items-center gap-4">
        <Link
          href="/dashboard/director/cursos"
          className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-bold">DIRECTOR</p>
          <h1 className="text-lg font-black text-gray-900">{curso?.nombre}</h1>
        </div>
      </div>

      <div className="px-5 lg:px-8 pt-6 max-w-2xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-4 text-white text-center shadow-sm">
            <p className="text-3xl font-black">{totalAlumnos}</p>
            <p className="text-white/80 text-xs font-bold mt-1">Alumnos</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-black text-gray-900">{asistenciaHoy}</p>
            <p className="text-gray-400 text-xs font-bold mt-1">Hoy</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-black text-gray-900">
              {totalAlumnos > 0
                ? Math.round((asistenciaHoy / totalAlumnos) * 100)
                : 0}
              %
            </p>
            <p className="text-gray-400 text-xs font-bold mt-1">Asistencia</p>
          </div>
        </div>

        {/* Maestra */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-orange-400" />
            <p className="font-black text-gray-900 text-sm">Docente</p>
          </div>
          {maestras && maestras.length > 0 ? (
            <div className="flex flex-col gap-2">
              {maestras.map((m: any, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-orange-50 rounded-xl p-3"
                >
                  <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-white font-black text-sm">
                      {m.profiles?.full_name?.[0]}
                    </span>
                  </div>
                  <p className="font-bold text-gray-800 text-sm">
                    {m.profiles?.full_name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Sin maestra asignada</p>
          )}
        </div>

        {/* Alumnos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-400" />
              <p className="font-black text-gray-900 text-sm">
                Alumnos ({totalAlumnos})
              </p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {alumnos && alumnos.length > 0 ? (
              alumnos.map((alumno) => {
                const asistioHoy = bitacorasHoy?.some(
                  (b) => b.alumno_id === alumno.id,
                );
                const edad = alumno.fecha_nacimiento
                  ? Math.floor(
                      (new Date().getTime() -
                        new Date(alumno.fecha_nacimiento).getTime()) /
                        (1000 * 60 * 60 * 24 * 365),
                    )
                  : null;

                return (
                  <div
                    key={alumno.id}
                    className="px-5 py-3 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shrink-0">
                      <span className="font-black text-orange-500 text-sm">
                        {alumno.nombre[0]}
                        {alumno.apellido[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">
                        {alumno.nombre} {alumno.apellido}
                      </p>
                      {edad && (
                        <p className="text-gray-400 text-xs">{edad} años</p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        asistioHoy
                          ? "bg-green-50 text-green-500"
                          : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      {asistioHoy ? "✓ Presente" : "Ausente"}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-gray-400 text-sm">
                  No hay alumnos en este curso
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actividades recientes */}
        {actividades && actividades.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <div className="px-5 py-4 flex items-center gap-2 border-b border-gray-50">
              <Calendar size={16} className="text-green-400" />
              <p className="font-black text-gray-900 text-sm">
                Próximas actividades
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {actividades.map((a) => (
                <div
                  key={a.id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <p className="font-bold text-gray-800 text-sm">{a.titulo}</p>
                  {a.fecha && (
                    <p className="text-orange-500 text-xs font-bold">
                      {new Date(a.fecha + "T12:00:00").toLocaleDateString(
                        "es-BO",
                        { day: "numeric", month: "short" },
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bitácoras hoy */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-2 border-b border-gray-50">
            <ClipboardList size={16} className="text-purple-400" />
            <p className="font-black text-gray-900 text-sm">Bitácoras de hoy</p>
          </div>
          <div className="p-5">
            {asistenciaHoy > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-orange-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${(asistenciaHoy / totalAlumnos) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-sm font-black text-gray-700">
                  {asistenciaHoy}/{totalAlumnos}
                </p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center">
                Aún no hay bitácoras hoy
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
