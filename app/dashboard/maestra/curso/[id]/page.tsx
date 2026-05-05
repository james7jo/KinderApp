import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ClipboardList,
  Bell,
  Calendar,
  ArrowRight,
  BookOpen,
  Video,
  MapPin,
} from "lucide-react";

export default async function CursoMaestraPage({
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
    .select("id, nombre, codigo")
    .eq("id", id)
    .single();

  const { data: alumnos } = await supabase
    .from("alumnos")
    .select("id, nombre, apellido, foto_url")
    .eq("curso_id", id);

  const today = new Date().toISOString().split("T")[0];

  const { data: bitacorasHoy } = await supabase
    .from("bitacoras")
    .select("id, alumno_id")
    .eq("maestra_id", user.id)
    .eq("fecha", today);

  const asistenciaHoy = bitacorasHoy?.length ?? 0;
  const totalAlumnos = alumnos?.length ?? 0;

  const modulos = [
    {
      href: `/dashboard/maestra/curso/${id}/alumnos`,
      label: "Lista de alumnos",
      desc: `${totalAlumnos} estudiantes`,
      icon: Users,
      color: "bg-orange-50 text-orange-500",
    },
    {
      href: `/dashboard/maestra/curso/${id}/bitacora`,
      label: "Bitácora diaria",
      desc: `${asistenciaHoy} de ${totalAlumnos} completadas hoy`,
      icon: ClipboardList,
      color: "bg-violet-50 text-violet-500",
    },
    {
      href: `/dashboard/maestra/curso/${id}/avisos`,
      label: "Avisos",
      desc: "Comunicados al curso",
      icon: Bell,
      color: "bg-sky-50 text-sky-500",
    },
    {
      href: `/dashboard/maestra/curso/${id}/actividades`,
      label: "Actividades",
      desc: "Eventos y cuotas",
      icon: Calendar,
      color: "bg-green-50 text-green-500",
    },
    {
      href: `/dashboard/maestra/curso/${id}/camara`,
      label: "Cámaras",
      desc: "Monitoreo en vivo",
      icon: Video,
      color: "bg-red-50 text-red-500",
    },
    {
      href: `/dashboard/maestra/curso/${id}/mesa-directiva`,
      label: "Mesa directiva",
      desc: "Organización de padres",
      icon: Users,
      color: "bg-yellow-50 text-yellow-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28 lg:pb-10">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-5 lg:px-8 py-4 sticky top-0 z-30 flex items-center gap-4">
        <Link
          href="/dashboard/maestra"
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all"
        >
          ←
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-bold">CURSO</p>
          <h1 className="text-lg font-black text-gray-900">{curso?.nombre}</h1>
        </div>
      </div>

      <div className="px-5 lg:px-8 pt-6">
        {/* STATS */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-4 text-white shadow-sm text-center">
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

        {/* ALUMNOS RECIENTES */}
        {alumnos && alumnos.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-900 text-sm">Alumnos</h2>
              <Link
                href={`/dashboard/maestra/curso/${id}/alumnos`}
                className="text-orange-500 text-xs font-bold"
              >
                Ver todos →
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {alumnos.slice(0, 4).map((alumno) => (
                <div
                  key={alumno.id}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-orange-500">
                      {alumno.nombre[0]}
                      {alumno.apellido[0]}
                    </span>
                  </div>
                  <p className="font-bold text-gray-800 text-sm">
                    {alumno.nombre} {alumno.apellido}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MÓDULOS */}
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
          Gestión del curso
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {modulos.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group"
              >
                <div
                  className={`w-10 h-10 ${mod.color} rounded-xl flex items-center justify-center mb-3`}
                >
                  <Icon size={18} />
                </div>
                <p className="font-black text-gray-900 text-sm">{mod.label}</p>
                <p className="text-gray-400 text-xs mt-0.5 leading-tight">
                  {mod.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
