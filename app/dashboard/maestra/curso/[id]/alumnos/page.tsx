import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Heart, Shield, MapPin } from "lucide-react";

export default async function AlumnosPage({
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
    .select(
      `
      id, nombre, apellido, fecha_nacimiento, genero, foto_url,
      tipo_sangre, alergias, enfermedades_cronicas, capacidades_diferentes,
      medicamentos, medico_cabecera, telefono_medico, tiene_seguro,
      notas_especiales,
      tutores ( id, full_name, relacion, telefono, es_principal ),
      terceros_autorizados ( id, full_name, relacion, telefono, documento_identidad ),
      plan_recogida ( id, responsable_nombre, responsable_relacion, fecha_inicio, fecha_fin )
    `,
    )
    .eq("curso_id", id)
    .order("nombre");

  const today = new Date().toISOString().split("T")[0];

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
          <h1 className="text-lg font-black text-gray-900">Lista de alumnos</h1>
        </div>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto">
        {/* Stats */}
        <div className="bg-orange-500 rounded-2xl p-5 mb-6 text-white">
          <p className="font-black text-3xl">{alumnos?.length ?? 0}</p>
          <p className="text-orange-100 text-sm">alumnos en {curso?.nombre}</p>
        </div>

        {/* Lista */}
        <div className="flex flex-col gap-4">
          {alumnos?.map((alumno) => {
            const edad = alumno.fecha_nacimiento
              ? Math.floor(
                  (new Date().getTime() -
                    new Date(alumno.fecha_nacimiento).getTime()) /
                    (1000 * 60 * 60 * 24 * 365),
                )
              : null;

            const tutorPrincipal = (alumno.tutores as any[])?.find(
              (t) => t.es_principal,
            );
            const recogidaHoy = (alumno.plan_recogida as any[])?.find(
              (r) =>
                r.fecha_inicio <= today &&
                (!r.fecha_fin || r.fecha_fin >= today),
            );
            const terceros = alumno.terceros_autorizados as any[];
            const tieneMedico = alumno.medico_cabecera;
            const tieneAlergias = alumno.alergias;
            const tieneMedicamentos = alumno.medicamentos;

            return (
              <div
                key={alumno.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-500" />

                {/* Header alumno */}
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center shrink-0">
                      <span className="text-xl font-black text-orange-500">
                        {alumno.nombre[0]}
                        {alumno.apellido[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-lg">
                        {alumno.nombre} {alumno.apellido}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {edad && (
                          <span className="text-gray-400 text-xs font-medium">
                            {edad} años
                          </span>
                        )}
                        {alumno.genero && (
                          <span className="bg-gray-50 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full capitalize">
                            {alumno.genero}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quién recoge hoy */}
                  <div
                    className={`rounded-xl p-3 mb-4 flex items-center justify-between ${recogidaHoy ? "bg-green-50" : "bg-orange-50"}`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin
                        size={14}
                        className={
                          recogidaHoy ? "text-green-500" : "text-orange-400"
                        }
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-500">
                          Recoge hoy
                        </p>
                        <p
                          className={`text-sm font-black ${recogidaHoy ? "text-green-700" : "text-orange-500"}`}
                        >
                          {recogidaHoy
                            ? `${recogidaHoy.responsable_nombre} (${recogidaHoy.responsable_relacion})`
                            : "No definido"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Alertas médicas */}
                  {(tieneAlergias ||
                    tieneMedicamentos ||
                    alumno.capacidades_diferentes) && (
                    <div className="bg-red-50 rounded-xl p-3 mb-4 border border-red-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Heart size={14} className="text-red-400" />
                        <p className="text-xs font-black text-red-500 uppercase tracking-wide">
                          Alertas médicas
                        </p>
                      </div>
                      {tieneAlergias && (
                        <p className="text-xs text-red-600 font-medium">
                          ⚠️ Alergias: {alumno.alergias}
                        </p>
                      )}
                      {tieneMedicamentos && (
                        <p className="text-xs text-red-600 font-medium mt-1">
                          💊 Medicamentos: {alumno.medicamentos}
                        </p>
                      )}
                      {alumno.capacidades_diferentes && (
                        <p className="text-xs text-red-600 font-medium mt-1">
                          ♿ {alumno.capacidades_diferentes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tutor principal */}
                  {tutorPrincipal && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                        Tutor responsable
                      </p>
                      <div className="flex items-center justify-between bg-blue-50 rounded-xl p-3">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">
                            {tutorPrincipal.full_name}
                          </p>
                          <p className="text-gray-400 text-xs capitalize">
                            {tutorPrincipal.relacion}
                          </p>
                        </div>
                        {tutorPrincipal.telefono && (
                          <a
                            href={`tel:${tutorPrincipal.telefono}`}
                            className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center"
                          >
                            <Phone size={16} className="text-white" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Terceros autorizados */}
                  {terceros && terceros.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                        Autorizados para recoger
                      </p>
                      <div className="flex flex-col gap-2">
                        {terceros.map((t: any) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between bg-green-50 rounded-xl p-3"
                          >
                            <div className="flex items-center gap-2">
                              <Shield size={14} className="text-green-500" />
                              <div>
                                <p className="font-bold text-gray-800 text-sm">
                                  {t.full_name}
                                </p>
                                <p className="text-gray-400 text-xs capitalize">
                                  {t.relacion}
                                  {t.documento_identidad &&
                                    ` · CI: ${t.documento_identidad}`}
                                </p>
                              </div>
                            </div>
                            {t.telefono && (
                              <a
                                href={`tel:${t.telefono}`}
                                className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center"
                              >
                                <Phone size={14} className="text-white" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Médico */}
                  {tieneMedico && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                          Médico
                        </p>
                        <p className="font-bold text-gray-800 text-sm">
                          {alumno.medico_cabecera}
                        </p>
                      </div>
                      {alumno.telefono_medico && (
                        <a
                          href={`tel:${alumno.telefono_medico}`}
                          className="w-9 h-9 bg-red-400 rounded-xl flex items-center justify-center"
                        >
                          <Phone size={16} className="text-white" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Notas especiales */}
                  {alumno.notas_especiales && (
                    <div className="mt-4 bg-yellow-50 rounded-xl p-3">
                      <p className="text-xs font-bold text-yellow-600 uppercase tracking-wide mb-1">
                        Notas especiales
                      </p>
                      <p className="text-sm text-gray-700">
                        {alumno.notas_especiales}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
