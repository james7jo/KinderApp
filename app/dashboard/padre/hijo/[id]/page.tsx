import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Phone,
  Shield,
  Users,
  Edit,
  ChevronRight,
} from "lucide-react";

export default async function HijoPage({
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
    .select(`*, cursos(nombre)`)
    .eq("id", id)
    .single();

  const { data: tutores } = await supabase
    .from("tutores")
    .select("*")
    .eq("alumno_id", id);

  const { data: terceros } = await supabase
    .from("terceros_autorizados")
    .select("*")
    .eq("alumno_id", id);

  const { data: recogidaHoy } = await supabase
    .from("plan_recogida")
    .select("*")
    .eq("alumno_id", id)
    .gte("fecha_inicio", new Date().toISOString().split("T")[0])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const edad = alumno?.fecha_nacimiento
    ? Math.floor(
        (new Date().getTime() - new Date(alumno.fecha_nacimiento).getTime()) /
          (1000 * 60 * 60 * 24 * 365),
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/padre"
            className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <h1 className="text-lg font-black text-gray-900">
            {alumno?.nombre} {alumno?.apellido}
          </h1>
        </div>
        <Link
          href={`/dashboard/padre/hijo/${id}/editar`}
          className="flex items-center gap-1.5 bg-orange-50 text-orange-500 text-xs font-bold px-3 py-2 rounded-xl"
        >
          <Edit size={14} />
          Editar
        </Link>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-500" />
          <div className="p-5 flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center shrink-0">
              <span className="text-3xl font-black text-orange-500">
                {alumno?.nombre[0]}
                {alumno?.apellido[0]}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="font-black text-gray-900 text-xl">
                {alumno?.nombre} {alumno?.apellido}
              </h2>
              <p className="text-gray-400 text-sm font-medium">
                {alumno?.cursos?.nombre}
              </p>
              {edad && (
                <p className="text-orange-500 text-sm font-bold mt-1">
                  {edad} años
                </p>
              )}
              {alumno?.genero && (
                <span className="inline-block bg-gray-50 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full mt-1 capitalize">
                  {alumno.genero}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl p-5 mb-5 border ${recogidaHoy ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1 text-gray-500">
                Recoge hoy
              </p>
              {recogidaHoy ? (
                <>
                  <p className="font-black text-gray-900">
                    {recogidaHoy.responsable_nombre}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {recogidaHoy.responsable_relacion}
                  </p>
                </>
              ) : (
                <p className="font-bold text-orange-500 text-sm">
                  No definido aún
                </p>
              )}
            </div>
            <Link
              href={`/dashboard/padre/hijo/${id}/recogida`}
              className="bg-white text-gray-600 text-xs font-bold px-3 py-2 rounded-xl border border-gray-200"
            >
              {recogidaHoy ? "Cambiar" : "Definir"}
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-red-400" />
                <p className="font-black text-gray-900 text-sm">
                  Información médica
                </p>
              </div>
              <Link
                href={`/dashboard/padre/hijo/${id}/editar`}
                className="text-orange-500 text-xs font-bold"
              >
                Editar
              </Link>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">
                  Tipo de sangre
                </p>
                <p className="font-bold text-gray-800 text-sm">
                  {alumno?.tipo_sangre ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">
                  Alergias
                </p>
                <p className="font-bold text-gray-800 text-sm">
                  {alumno?.alergias ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">
                  Medicamentos
                </p>
                <p className="font-bold text-gray-800 text-sm">
                  {alumno?.medicamentos ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">
                  Enfermedades
                </p>
                <p className="font-bold text-gray-800 text-sm">
                  {alumno?.enfermedades_cronicas ?? "—"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">
                  Capacidades diferentes
                </p>
                <p className="font-bold text-gray-800 text-sm">
                  {alumno?.capacidades_diferentes ?? "—"}
                </p>
              </div>
              <div className="col-span-2 bg-red-50 rounded-xl p-3">
                <p className="text-xs text-red-400 font-bold uppercase tracking-wide mb-1">
                  Médico / Pediatra
                </p>
                <p className="font-bold text-gray-800 text-sm">
                  {alumno?.medico_cabecera ?? "—"}
                </p>
                {alumno?.telefono_medico && (
                  <a
                    href={`tel:${alumno.telefono_medico}`}
                    className="flex items-center gap-1.5 text-red-500 text-xs font-bold mt-1"
                  >
                    <Phone size={12} />
                    {alumno.telefono_medico}
                  </a>
                )}
              </div>
              {alumno?.tiene_seguro && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">
                    Seguro médico
                  </p>
                  <p className="font-bold text-gray-800 text-sm">
                    {alumno?.nombre_seguro} — {alumno?.numero_seguro}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-400" />
                <p className="font-black text-gray-900 text-sm">
                  Tutores responsables
                </p>
              </div>
              <Link
                href={`/dashboard/padre/hijo/${id}/tutores`}
                className="text-orange-500 text-xs font-bold"
              >
                + Agregar
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {tutores && tutores.length > 0 ? (
                tutores.map((tutor) => (
                  <div
                    key={tutor.id}
                    className="px-5 py-4 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <span className="font-black text-blue-500 text-sm">
                        {tutor.full_name[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">
                        {tutor.full_name}
                      </p>
                      <p className="text-gray-400 text-xs capitalize">
                        {tutor.relacion}
                      </p>
                    </div>
                    {tutor.telefono && (
                      <a
                        href={`tel:${tutor.telefono}`}
                        className="text-blue-500"
                      >
                        <Phone size={16} />
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-5 py-6 text-center">
                  <p className="text-gray-400 text-sm">
                    No hay tutores registrados
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-green-400" />
                <p className="font-black text-gray-900 text-sm">
                  Autorizados para recoger
                </p>
              </div>
              <Link
                href={`/dashboard/padre/hijo/${id}/terceros`}
                className="text-orange-500 text-xs font-bold"
              >
                + Agregar
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {terceros && terceros.length > 0 ? (
                terceros.map((t) => (
                  <div key={t.id} className="px-5 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                      <span className="font-black text-green-500 text-sm">
                        {t.full_name[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">
                        {t.full_name}
                      </p>
                      <p className="text-gray-400 text-xs capitalize">
                        {t.relacion}
                      </p>
                      {t.documento_identidad && (
                        <p className="text-gray-300 text-xs">
                          CI: {t.documento_identidad}
                        </p>
                      )}
                    </div>
                    {t.telefono && (
                      <a href={`tel:${t.telefono}`} className="text-green-500">
                        <Phone size={16} />
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-5 py-6 text-center">
                  <p className="text-gray-400 text-sm">
                    No hay personas autorizadas
                  </p>
                  <Link
                    href={`/dashboard/padre/hijo/${id}/terceros`}
                    className="text-orange-500 text-xs font-bold mt-1 inline-block"
                  >
                    Agregar autorizado →
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
            <div className="divide-y divide-gray-50">
              {[
                {
                  href: `/dashboard/padre/hijo/${id}/bitacora`,
                  label: "Bitácora diaria",
                  desc: "Ver reportes de la maestra",
                },
                {
                  href: `/dashboard/padre/hijo/${id}/avisos`,
                  label: "Avisos",
                  desc: "Comunicados del curso",
                },
                {
                  href: `/dashboard/padre/hijo/${id}/actividades`,
                  label: "Actividades",
                  desc: "Eventos y cuotas",
                },
                {
                  href: `/dashboard/padre/hijo/${id}/gps`,
                  label: "GPS en tiempo real",
                  desc: "Ubicación de tu hijo",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-all"
                >
                  <div>
                    <p className="font-bold text-gray-800 text-sm">
                      {item.label}
                    </p>
                    <p className="text-gray-400 text-xs">{item.desc}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
