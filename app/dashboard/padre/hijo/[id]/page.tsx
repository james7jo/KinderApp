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
  ClipboardList,
  Bell,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Droplets,
} from "lucide-react";
import { hoyBolivia } from "@/lib/fecha-bolivia";

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
    .select(`*, cursos(id, nombre)`)
    .eq("id", id)
    .single();

  const [{ data: tutores }, { data: terceros }] = await Promise.all([
    supabase.from("tutores").select("*").eq("alumno_id", id),
    supabase.from("terceros_autorizados").select("*").eq("alumno_id", id),
  ]);

  const today = hoyBolivia();
  const { data: recogidaHoy } = await supabase
    .from("plan_recogida")
    .select("*")
    .eq("alumno_id", id)
    .gte("fecha_inicio", today)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: bitacoraHoy } = await supabase
    .from("bitacoras")
    .select("*")
    .eq("alumno_id", id)
    .eq("fecha", today)
    .single();

  const edad = alumno?.fecha_nacimiento
    ? Math.floor(
        (Date.now() - new Date(alumno.fecha_nacimiento).getTime()) /
          (1000 * 60 * 60 * 24 * 365),
      )
    : null;

  const tieneAlerta = !!(
    alumno?.alergias ||
    alumno?.medicamentos ||
    alumno?.capacidades_diferentes
  );

  const ESTADO_EMOJI: Record<string, string> = {
    feliz: "😊",
    normal: "😐",
    triste: "😢",
    travieso: "😈",
    cansado: "😴",
    enfermo: "🤒",
  };

  const modulos = [
    {
      href: `/dashboard/padre/hijo/${id}/bitacora`,
      label: "Bitácora",
      desc: "Reportes diarios",
      icon: ClipboardList,
      bg: "bg-violet-50",
      color: "text-violet-500",
      hover: "hover:border-violet-200",
    },
    {
      href: `/dashboard/padre/hijo/${id}/avisos`,
      label: "Avisos",
      desc: "Comunicados",
      icon: Bell,
      bg: "bg-sky-50",
      color: "text-sky-500",
      hover: "hover:border-sky-200",
    },
    {
      href: `/dashboard/padre/hijo/${id}/actividades`,
      label: "Actividades",
      desc: "Eventos del curso",
      icon: Calendar,
      bg: "bg-green-50",
      color: "text-green-500",
      hover: "hover:border-green-200",
    },
    {
      href: `/dashboard/padre/hijo/${id}/gps`,
      label: "GPS",
      desc: "Ubicación en vivo",
      icon: MapPin,
      bg: "bg-orange-50",
      color: "text-orange-500",
      hover: "hover:border-orange-200",
    },
  ];

  return (
    <main className="min-w-0 font-nunito">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/padre"
            className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center shrink-0 transition-all"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
              Mi hijo
            </p>
            <h1 className="text-lg font-black text-gray-900 leading-tight truncate">
              {alumno?.nombre} {alumno?.apellido}
            </h1>
          </div>
        </div>
        <Link
          href={`/dashboard/padre/hijo/${id}/editar`}
          className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-500 text-xs font-black px-3 py-2 rounded-xl transition-all shrink-0"
        >
          <Edit size={14} /> Editar
        </Link>
      </div>

      {/* ── LAYOUT: 1 col móvil | 3 col PC ── */}
      <div className="px-4 lg:px-7 pt-5 pb-8 lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start">
        {/* ══ COLUMNA IZQUIERDA PC — Perfil del niño ══ */}
        <div className="lg:col-span-1 space-y-4 mb-4 lg:mb-0 lg:sticky lg:top-20">
          {/* Hero card */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg shadow-orange-200">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-orange-400 opacity-30 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-orange-400 opacity-20 rounded-full" />
            <div className="relative z-10">
              {/* Avatar */}
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
                {alumno?.foto_url ? (
                  <img
                    src={alumno.foto_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black text-white">
                    {alumno?.nombre?.[0]}
                    {alumno?.apellido?.[0]}
                  </span>
                )}
              </div>
              <h2 className="font-black text-xl leading-tight">
                {alumno?.nombre} {alumno?.apellido}
              </h2>
              <p className="text-orange-100 text-sm mt-0.5">
                {alumno?.cursos?.nombre ?? "Sin curso"}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {edad && (
                  <span className="bg-white/20 text-white text-[11px] font-black px-2.5 py-1 rounded-full">
                    {edad} años
                  </span>
                )}
                {alumno?.genero && (
                  <span className="bg-white/20 text-white text-[11px] font-black px-2.5 py-1 rounded-full capitalize">
                    {alumno.genero}
                  </span>
                )}
                {tieneAlerta && (
                  <span className="bg-red-500/30 text-white text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    <AlertCircle size={10} /> Alerta médica
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bitácora de hoy */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList size={14} className="text-violet-500" />
                <p className="font-black text-gray-900 text-sm">
                  Bitácora de hoy
                </p>
              </div>
              <Link
                href={`/dashboard/padre/hijo/${id}/bitacora`}
                className="text-orange-500 text-xs font-bold hover:text-orange-600"
              >
                Ver más →
              </Link>
            </div>
            {bitacoraHoy ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                  <span className="text-sm font-bold text-green-600">
                    Completada
                  </span>
                  {bitacoraHoy.estado_animo && (
                    <span className="text-base ml-1">
                      {ESTADO_EMOJI[bitacoraHoy.estado_animo]}
                    </span>
                  )}
                </div>
                {bitacoraHoy.comio === true && (
                  <p className="text-xs text-gray-500 font-medium bg-green-50 rounded-lg px-3 py-1.5">
                    Comió hoy
                  </p>
                )}
                {bitacoraHoy.comio === false && (
                  <p className="text-xs text-red-500 font-medium bg-red-50 rounded-lg px-3 py-1.5">
                    No comió hoy
                  </p>
                )}
                {bitacoraHoy.observaciones && (
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-wide mb-1">
                      Nota de la maestra
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {bitacoraHoy.observaciones}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 rounded-xl p-3 flex items-center gap-2">
                <AlertCircle size={13} className="text-amber-500 shrink-0" />
                <p className="text-xs font-bold text-amber-600">
                  La maestra aún no llenó la bitácora
                </p>
              </div>
            )}
          </div>

          {/* Recogida de hoy */}
          <div
            className={`rounded-2xl border p-4 ${recogidaHoy ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin
                  size={14}
                  className={recogidaHoy ? "text-green-500" : "text-amber-500"}
                />
                <p
                  className={`font-black text-sm ${recogidaHoy ? "text-green-700" : "text-amber-700"}`}
                >
                  Recoge hoy
                </p>
              </div>
              <Link
                href={`/dashboard/padre/hijo/${id}/recogida`}
                className="text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors"
              >
                {recogidaHoy ? "Cambiar" : "Definir"} →
              </Link>
            </div>
            {recogidaHoy ? (
              <>
                <p className="font-black text-gray-900">
                  {recogidaHoy.responsable_nombre}
                </p>
                <p className="text-xs text-gray-500 capitalize mt-0.5">
                  {recogidaHoy.responsable_relacion}
                </p>
              </>
            ) : (
              <p className="text-sm font-bold text-amber-600">
                No definido — indicá quién recoge hoy
              </p>
            )}
          </div>
        </div>

        {/* ══ COLUMNA DERECHA PC — Info + acciones ══ */}
        <div className="lg:col-span-2 space-y-4">
          {/* Módulos */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Secciones
            </p>
            <div className="grid grid-cols-2 gap-3">
              {modulos.map(
                ({ href, label, desc, icon: Icon, bg, color, hover }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`bg-white rounded-2xl p-4 border border-gray-100 ${hover} hover:shadow-md transition-all group`}
                  >
                    <div
                      className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}
                    >
                      <Icon size={18} className={color} />
                    </div>
                    <p className="font-black text-gray-900 text-sm">{label}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                  </Link>
                ),
              )}
            </div>
          </div>

          {/* Info médica */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Heart size={15} className="text-red-400" />
                <p className="font-black text-gray-900 text-sm">
                  Información médica
                </p>
              </div>
              <Link
                href={`/dashboard/padre/hijo/${id}/editar`}
                className="text-orange-500 text-xs font-bold hover:text-orange-600"
              >
                Editar
              </Link>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {[
                {
                  label: "Tipo de sangre",
                  value: alumno?.tipo_sangre,
                  icon: Droplets,
                  alert: false,
                },
                {
                  label: "Alergias",
                  value: alumno?.alergias,
                  icon: AlertCircle,
                  alert: !!alumno?.alergias,
                },
                {
                  label: "Medicamentos",
                  value: alumno?.medicamentos,
                  icon: Heart,
                  alert: !!alumno?.medicamentos,
                },
                {
                  label: "Enfermedades",
                  value: alumno?.enfermedades_cronicas,
                  icon: AlertCircle,
                  alert: false,
                },
              ].map(({ label, value, alert }) => (
                <div
                  key={label}
                  className={`rounded-xl p-3 ${alert && value ? "bg-red-50" : "bg-gray-50"}`}
                >
                  <p
                    className={`text-[10px] font-black uppercase tracking-wide mb-1 ${alert && value ? "text-red-400" : "text-gray-400"}`}
                  >
                    {label}
                  </p>
                  <p
                    className={`font-bold text-sm ${alert && value ? "text-red-700" : "text-gray-800"}`}
                  >
                    {value ?? "—"}
                  </p>
                </div>
              ))}
              {alumno?.capacidades_diferentes && (
                <div className="col-span-2 bg-amber-50 rounded-xl p-3">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-wide mb-1">
                    Cap. diferentes
                  </p>
                  <p className="font-bold text-sm text-amber-700">
                    {alumno.capacidades_diferentes}
                  </p>
                </div>
              )}
              {(alumno?.medico_cabecera || alumno?.telefono_medico) && (
                <div className="col-span-2 bg-red-50 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-wide mb-1">
                      Médico / Pediatra
                    </p>
                    <p className="font-bold text-sm text-gray-800">
                      {alumno?.medico_cabecera ?? "—"}
                    </p>
                  </div>
                  {alumno?.telefono_medico && (
                    <a
                      href={`tel:${alumno.telefono_medico}`}
                      className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shrink-0"
                    >
                      <Phone size={16} className="text-white" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tutores */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-blue-400" />
                <p className="font-black text-gray-900 text-sm">
                  Tutores ({tutores?.length ?? 0})
                </p>
              </div>
              <Link
                href={`/dashboard/padre/hijo/${id}/tutores`}
                className="text-orange-500 text-xs font-bold hover:text-orange-600"
              >
                + Agregar
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {tutores && tutores.length > 0 ? (
                tutores.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.es_principal ? "bg-orange-500" : "bg-blue-50"}`}
                    >
                      <span
                        className={`text-xs font-black ${t.es_principal ? "text-white" : "text-blue-500"}`}
                      >
                        {t.full_name[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">
                        {t.full_name}
                      </p>
                      <p className="text-gray-400 text-xs capitalize">
                        {t.relacion}
                        {t.es_principal ? " · Principal" : ""}
                      </p>
                    </div>
                    {t.telefono && (
                      <a
                        href={`tel:${t.telefono}`}
                        className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center shrink-0"
                      >
                        <Phone size={14} className="text-white" />
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm px-4 py-4 text-center">
                  Sin tutores registrados
                </p>
              )}
            </div>
          </div>

          {/* Autorizados */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-green-400" />
                <p className="font-black text-gray-900 text-sm">
                  Autorizados para recoger ({terceros?.length ?? 0})
                </p>
              </div>
              <Link
                href={`/dashboard/padre/hijo/${id}/terceros`}
                className="text-orange-500 text-xs font-bold hover:text-orange-600"
              >
                + Agregar
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {terceros && terceros.length > 0 ? (
                terceros.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                      <Shield size={14} className="text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">
                        {t.full_name}
                      </p>
                      <p className="text-gray-400 text-xs capitalize">
                        {t.relacion}
                        {t.documento_identidad
                          ? ` · CI: ${t.documento_identidad}`
                          : ""}
                      </p>
                    </div>
                    {t.telefono && (
                      <a
                        href={`tel:${t.telefono}`}
                        className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center shrink-0"
                      >
                        <Phone size={14} className="text-white" />
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-4 text-center">
                  <p className="text-gray-400 text-sm">
                    Sin personas autorizadas
                  </p>
                  <Link
                    href={`/dashboard/padre/hijo/${id}/terceros`}
                    className="text-orange-500 text-xs font-bold mt-1 inline-block"
                  >
                    Agregar →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
