"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  ClipboardList,
  Bell,
  Calendar,
  BookOpen,
  Video,
  ArrowLeft,
  AlertCircle,
  ChevronRight,
  Users2,
  Search,
  X,
  Phone,
  Heart,
  Shield,
  MapPin,
  User,
  QrCode,
  CheckCircle2,
} from "lucide-react";

type Alumno = {
  id: string;
  nombre: string;
  apellido: string;
  foto_url?: string;
  genero?: string;
  fecha_nacimiento?: string;
  tipo_sangre?: string;
  alergias?: string;
  enfermedades_cronicas?: string;
  capacidades_diferentes?: string;
  medicamentos?: string;
  medico_cabecera?: string;
  telefono_medico?: string;
  tiene_seguro?: boolean;
  notas_especiales?: string;
  tutores: any[];
  terceros_autorizados: any[];
  plan_recogida: any[];
};

const ESTADO_EMOJI: Record<string, string> = {
  feliz: "😊",
  normal: "😐",
  triste: "😢",
  travieso: "😈",
  cansado: "😴",
  enfermo: "🤒",
};

const COLORES = [
  "from-orange-100 to-orange-200 text-orange-500",
  "from-violet-100 to-violet-200 text-violet-500",
  "from-sky-100 to-sky-200 text-sky-500",
  "from-emerald-100 to-emerald-200 text-emerald-500",
  "from-rose-100 to-rose-200 text-rose-500",
];

// ── MODAL ALUMNO ──────────────────────────────────────────────────────────────
function ModalAlumno({
  alumno,
  today,
  colorIdx,
  onClose,
}: {
  alumno: Alumno;
  today: string;
  colorIdx: number;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"info" | "familia" | "medico">("info");
  const color = COLORES[colorIdx % COLORES.length];
  const [c1, c2, c3] = color.split(" ");

  const edad = alumno.fecha_nacimiento
    ? Math.floor(
        (Date.now() - new Date(alumno.fecha_nacimiento).getTime()) /
          (1000 * 60 * 60 * 24 * 365),
      )
    : null;

  const tutorPrincipal = alumno.tutores?.find((t) => t.es_principal);
  const recogidaHoy = alumno.plan_recogida?.find(
    (r) => r.fecha_inicio <= today && (!r.fecha_fin || r.fecha_fin >= today),
  );
  const tieneAlerta = !!(
    alumno.alergias ||
    alumno.medicamentos ||
    alumno.capacidades_diferentes
  );

  const tabs = [
    { key: "info", label: "Info", icon: User },
    { key: "familia", label: "Familia", icon: Users },
    { key: "medico", label: "Médico", icon: Heart },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-white w-full lg:max-w-lg rounded-t-3xl lg:rounded-3xl shadow-2xl flex flex-col"
        style={{
          height: "calc(100dvh - 48px)",
          maxHeight: "calc(100dvh - 48px)",
        }}
      >
        <div className="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-3 pb-4 border-b border-gray-100 shrink-0">
          <div
            className={`w-12 h-12 bg-gradient-to-br ${c1} ${c2} rounded-2xl flex items-center justify-center shrink-0 overflow-hidden`}
          >
            {alumno.foto_url ? (
              <img
                src={alumno.foto_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className={`text-lg font-black ${c3}`}>
                {alumno.nombre[0]}
                {alumno.apellido[0]}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-gray-900 text-lg leading-tight truncate">
              {alumno.nombre} {alumno.apellido}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {edad && (
                <span className="text-xs text-gray-400 font-medium">
                  {edad} años
                </span>
              )}
              {alumno.genero && (
                <span className="text-xs text-gray-300 capitalize">
                  · {alumno.genero}
                </span>
              )}
              {tieneAlerta && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                  <AlertCircle size={10} /> Alerta médica
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all shrink-0"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-black transition-all ${
                tab === key
                  ? "text-orange-500 border-b-2 border-orange-500"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4 overscroll-contain">
          {tab === "info" && (
            <>
              <div
                className={`rounded-2xl p-4 ${recogidaHoy ? "bg-green-50 border border-green-100" : "bg-amber-50 border border-amber-100"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MapPin
                    size={14}
                    className={
                      recogidaHoy ? "text-green-500" : "text-amber-500"
                    }
                  />
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest ${recogidaHoy ? "text-green-600" : "text-amber-600"}`}
                  >
                    Recoge hoy
                  </p>
                </div>
                <p
                  className={`font-black text-base ${recogidaHoy ? "text-green-800" : "text-amber-700"}`}
                >
                  {recogidaHoy
                    ? recogidaHoy.responsable_nombre
                    : "⚠ No definido"}
                </p>
                {recogidaHoy?.responsable_relacion && (
                  <p className="text-xs font-medium capitalize text-green-600 mt-0.5">
                    {recogidaHoy.responsable_relacion}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Datos generales
                </p>
                <div className="bg-white rounded-xl divide-y divide-gray-50">
                  {[
                    {
                      label: "Nombre",
                      value: `${alumno.nombre} ${alumno.apellido}`,
                    },
                    { label: "Edad", value: edad ? `${edad} años` : "—" },
                    {
                      label: "Nacimiento",
                      value: alumno.fecha_nacimiento
                        ? new Date(
                            alumno.fecha_nacimiento + "T12:00:00",
                          ).toLocaleDateString("es-BO", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "—",
                    },
                    { label: "Género", value: alumno.genero ?? "—", cap: true },
                    { label: "Sangre", value: alumno.tipo_sangre ?? "—" },
                  ].map(({ label, value, cap }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-3 py-2.5"
                    >
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                        {label}
                      </span>
                      <span
                        className={`text-sm font-bold text-gray-800 ${cap ? "capitalize" : ""}`}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {alumno.notas_especiales && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">
                    Notas especiales
                  </p>
                  <p className="text-sm text-gray-700">
                    {alumno.notas_especiales}
                  </p>
                </div>
              )}
            </>
          )}

          {tab === "familia" && (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">
                  Tutores ({alumno.tutores?.length ?? 0})
                </p>
                <div className="bg-white rounded-xl divide-y divide-gray-50 overflow-hidden">
                  {alumno.tutores?.length > 0 ? (
                    alumno.tutores.map((t: any) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 px-3 py-3"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.es_principal ? "bg-orange-500" : "bg-blue-100"}`}
                        >
                          <span
                            className={`text-xs font-black ${t.es_principal ? "text-white" : "text-blue-500"}`}
                          >
                            {t.full_name[0]}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-gray-900">
                            {t.full_name}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">
                            {t.relacion}
                            {t.es_principal ? " · Principal" : ""}
                          </p>
                        </div>
                        {t.telefono && (
                          <a
                            href={`tel:${t.telefono}`}
                            className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center"
                          >
                            <Phone size={14} className="text-white" />
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 px-3 py-3">
                      Sin tutores registrados
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-3">
                  Autorizados para recoger (
                  {alumno.terceros_autorizados?.length ?? 0})
                </p>
                <div className="bg-white rounded-xl divide-y divide-gray-50 overflow-hidden">
                  {alumno.terceros_autorizados?.length > 0 ? (
                    alumno.terceros_autorizados.map((t: any) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 px-3 py-3"
                      >
                        <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                          <Shield size={14} className="text-green-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-gray-900">
                            {t.full_name}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">
                            {t.relacion}
                            {t.documento_identidad
                              ? ` · CI: ${t.documento_identidad}`
                              : ""}
                          </p>
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
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 px-3 py-3">
                      Sin personas autorizadas
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === "medico" && (
            <>
              {tieneAlerta && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={15} className="text-red-500" />
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                      Alertas médicas
                    </p>
                  </div>
                  <div className="bg-white rounded-xl divide-y divide-gray-50">
                    {alumno.alergias && (
                      <div className="px-3 py-2.5">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-0.5">
                          Alergias
                        </p>
                        <p className="text-sm font-bold text-red-700">
                          ⚠️ {alumno.alergias}
                        </p>
                      </div>
                    )}
                    {alumno.medicamentos && (
                      <div className="px-3 py-2.5">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-0.5">
                          Medicamentos
                        </p>
                        <p className="text-sm font-bold text-red-700">
                          💊 {alumno.medicamentos}
                        </p>
                      </div>
                    )}
                    {alumno.capacidades_diferentes && (
                      <div className="px-3 py-2.5">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-0.5">
                          Cap. diferentes
                        </p>
                        <p className="text-sm font-bold text-red-700">
                          ♿ {alumno.capacidades_diferentes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Info médica
                </p>
                <div className="bg-white rounded-xl divide-y divide-gray-50">
                  {[
                    { label: "Tipo sangre", value: alumno.tipo_sangre ?? "—" },
                    {
                      label: "Enfermedades",
                      value: alumno.enfermedades_cronicas ?? "—",
                    },
                    { label: "Médico", value: alumno.medico_cabecera ?? "—" },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-3 py-2.5"
                    >
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                        {label}
                      </span>
                      <span className="text-sm font-bold text-gray-800 text-right max-w-[60%]">
                        {value}
                      </span>
                    </div>
                  ))}
                  {alumno.telefono_medico && (
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                        Tel. médico
                      </span>
                      <a
                        href={`tel:${alumno.telefono_medico}`}
                        className="flex items-center gap-1.5 text-sm font-bold text-blue-500"
                      >
                        <Phone size={13} />
                        {alumno.telefono_medico}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}

// ── LISTA CON BUSCADOR ────────────────────────────────────────────────────────
function ListaAlumnos({
  alumnos,
  bitacorasHoy,
  today,
  cursoId,
}: {
  alumnos: Alumno[];
  bitacorasHoy: any[];
  today: string;
  cursoId: string;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{
    alumno: Alumno;
    idx: number;
  } | null>(null);

  const filtrados = useMemo(() => {
    const t = search.toLowerCase().trim();
    if (!t) return alumnos;
    return alumnos.filter((a) =>
      `${a.nombre} ${a.apellido}`.toLowerCase().includes(t),
    );
  }, [alumnos, search]);

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-orange-500" />
            <h2 className="font-black text-gray-900 text-sm">
              Alumnos ({alumnos.length})
            </h2>
          </div>
          <Link
            href={`/dashboard/maestra/curso/${cursoId}/alumnos`}
            className="text-orange-500 text-xs font-bold hover:text-orange-600 transition-colors"
          >
            Ver todos →
          </Link>
        </div>

        {/* Buscador */}
        {alumnos.length > 4 && (
          <div className="px-4 py-2 border-b border-gray-50">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
              />
              <input
                type="text"
                placeholder="Buscar alumno..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 rounded-xl pl-9 pr-8 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-400 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  <X size={12} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="divide-y divide-gray-50">
          {filtrados.slice(0, 5).map((alumno, idx) => {
            const bitacora = bitacorasHoy?.find(
              (b) => b.alumno_id === alumno.id,
            );
            const presente = !!bitacora;
            const color = COLORES[idx % COLORES.length];
            const [c1, c2, c3] = color.split(" ");
            const tieneAlerta = !!(
              alumno.alergias ||
              alumno.medicamentos ||
              alumno.capacidades_diferentes
            );

            return (
              <button
                key={alumno.id}
                onClick={() => setSelected({ alumno, idx })}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50/50 transition-all group text-left"
              >
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${c1} ${c2} rounded-xl flex items-center justify-center shrink-0 overflow-hidden`}
                >
                  {alumno.foto_url ? (
                    <img
                      src={alumno.foto_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className={`font-black text-sm ${c3}`}>
                      {alumno.nombre[0]}
                      {alumno.apellido[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-black text-gray-900 text-sm truncate">
                      {alumno.nombre} {alumno.apellido}
                    </p>
                    {tieneAlerta && (
                      <AlertCircle
                        size={11}
                        className="text-red-400 shrink-0"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {presente ? (
                      <span className="text-[10px] font-bold text-green-500">
                        ✓ Presente
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400">
                        Ausente
                      </span>
                    )}
                    {bitacora?.estado_animo && (
                      <span className="text-sm">
                        {ESTADO_EMOJI[bitacora.estado_animo]}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className="text-gray-200 group-hover:text-orange-400 transition-colors shrink-0"
                />
              </button>
            );
          })}

          {filtrados.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-400 text-sm font-bold">
                Sin resultados para "{search}"
              </p>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <ModalAlumno
          alumno={selected.alumno}
          today={today}
          colorIdx={selected.idx}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export default function CursoHubClient({
  cursoId,
  curso,
  alumnos,
  bitacorasHoy,
  avisosRecientes,
  actProximas,
  totalAlumnos,
  asistenciaHoy,
  pendientes,
  pct,
  today,
}: {
  cursoId: string;
  curso: any;
  alumnos: Alumno[];
  bitacorasHoy: any[];
  avisosRecientes: any[];
  actProximas: any[];
  totalAlumnos: number;
  asistenciaHoy: number;
  pendientes: number;
  pct: number;
  today: string;
}) {
  const modulos = [
    {
      href: `/dashboard/maestra/curso/${cursoId}/alumnos`,
      label: "Lista de alumnos",
      desc: `${totalAlumnos} estudiantes`,
      icon: Users,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      hover: "hover:border-orange-200",
    },
    {
      href: `/dashboard/maestra/curso/${cursoId}/bitacora`,
      label: "Bitácora diaria",
      desc:
        pendientes > 0
          ? `${pendientes} pendiente${pendientes !== 1 ? "s" : ""} hoy`
          : "Al día ✓",
      icon: ClipboardList,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-500",
      hover: "hover:border-violet-200",
      alert: pendientes > 0,
    },
    {
      href: `/dashboard/maestra/curso/${cursoId}/avisos`,
      label: "Avisos",
      desc:
        avisosRecientes.length > 0 ? avisosRecientes[0].titulo : "Sin avisos",
      icon: Bell,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-500",
      hover: "hover:border-sky-200",
    },
    {
      href: `/dashboard/maestra/curso/${cursoId}/actividades`,
      label: "Actividades",
      desc: actProximas.length > 0 ? actProximas[0].titulo : "Sin actividades",
      icon: Calendar,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
      hover: "hover:border-green-200",
    },
    {
      href: `/dashboard/maestra/curso/${cursoId}/camara`,
      label: "Cámaras",
      desc: "Monitoreo en vivo",
      icon: Video,
      iconBg: "bg-red-50",
      iconColor: "text-red-400",
      hover: "hover:border-red-200",
    },
    {
      href: `/dashboard/maestra/curso/${cursoId}/mesa-directiva`,
      label: "Mesa directiva",
      desc: "Organización de padres",
      icon: Users2,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      hover: "hover:border-amber-200",
    },
    {
      href: `/dashboard/maestra/curso/${cursoId}/recogida`,
      label: "Recogida QR",
      desc: "Control de salida",
      icon: QrCode,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-500",
      hover: "hover:border-teal-200",
    },
    {
      href: `/dashboard/maestra/curso/${cursoId}/evaluacion-cosmos`,
      label: "Evaluación Cosmos",
      desc: "Seguimiento curricular",
      icon: BookOpen,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      hover: "hover:border-orange-200",
    },
  ];

  return (
    <main className="min-w-0">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center gap-3 sticky top-0 z-30">
        <Link
          href="/dashboard/maestra/curso"
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            Curso
          </p>
          <h1 className="text-lg font-black text-gray-900 leading-tight truncate">
            {curso?.nombre}
          </h1>
        </div>
        <span className="text-[10px] font-black text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full shrink-0 font-mono">
          {curso?.codigo}
        </span>
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8 space-y-5">
        {/* STATS */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-orange-500 rounded-2xl p-4 text-white relative overflow-hidden shadow-lg shadow-orange-200">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-orange-400 opacity-40 rounded-full" />
            <div className="relative z-10">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <Users size={14} className="text-white" />
              </div>
              <p className="text-2xl lg:text-3xl font-black leading-none">
                {totalAlumnos}
              </p>
              <p className="text-white/80 text-[11px] font-bold mt-1">
                Alumnos
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
            <p className="text-2xl lg:text-3xl font-black text-gray-900 leading-none">
              {asistenciaHoy}
            </p>
            <p className="text-gray-400 text-[11px] font-bold mt-1">
              Presentes hoy
            </p>
          </div>
          <div
            className={`rounded-2xl p-4 border text-center ${pct >= 80 ? "bg-green-50 border-green-100" : pct >= 50 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"}`}
          >
            <p
              className={`text-2xl lg:text-3xl font-black leading-none ${pct >= 80 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-500"}`}
            >
              {pct}%
            </p>
            <p
              className={`text-[11px] font-bold mt-1 ${pct >= 80 ? "text-green-400" : pct >= 50 ? "text-amber-400" : "text-red-400"}`}
            >
              Asistencia
            </p>
          </div>
        </div>

        {/* ALERTA */}
        {pendientes > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-amber-800 text-sm">
                {pendientes} bitácora{pendientes !== 1 ? "s" : ""} sin completar
                hoy
              </p>
              <p className="text-amber-600 text-xs font-medium">
                Completá antes de que termine el día
              </p>
            </div>
            <Link
              href={`/dashboard/maestra/curso/${cursoId}/bitacora`}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black px-3 py-2 rounded-xl transition-all shrink-0"
            >
              Ir <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {/* LISTA ALUMNOS CON MODAL */}
        {alumnos.length > 0 && (
          <ListaAlumnos
            alumnos={alumnos}
            bitacorasHoy={bitacorasHoy}
            today={today}
            cursoId={cursoId}
          />
        )}

        {/* MÓDULOS */}
        <div>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Gestión del curso
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {modulos.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className={`bg-white rounded-2xl p-4 border border-gray-100 ${mod.hover} hover:shadow-md transition-all group`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-10 h-10 ${mod.iconBg} rounded-xl flex items-center justify-center`}
                    >
                      <Icon size={18} className={mod.iconColor} />
                    </div>
                    {(mod as any).alert && (
                      <span className="w-2 h-2 bg-amber-400 rounded-full mt-1" />
                    )}
                  </div>
                  <p className="font-black text-gray-900 text-sm">
                    {mod.label}
                  </p>
                  <p
                    className={`text-xs mt-0.5 leading-tight font-medium ${(mod as any).alert ? "text-amber-500" : "text-gray-400"}`}
                  >
                    {mod.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
