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

// Importamos el componente del calendario corregido
import CalendarioEvaluaciones from "./components/CalendarioEvaluaciones";

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
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-orange-500" />
            <h2 className="font-black text-gray-900 text-xs uppercase tracking-tight">
              Alumnos ({alumnos.length})
            </h2>
          </div>
          <Link
            href={`/dashboard/maestra/curso/${cursoId}/alumnos`}
            className="text-orange-500 text-[11px] font-black hover:text-orange-600 transition-colors uppercase tracking-tight"
          >
            Ver todos →
          </Link>
        </div>

        {/* Buscador */}
        {alumnos.length > 4 && (
          <div className="px-3 py-2 border-b border-gray-50">
            <div className="relative">
              <Search
                size={12}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
              />
              <input
                type="text"
                placeholder="Buscar alumno..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 rounded-xl pl-8 pr-8 py-1.5 text-[11px] font-bold outline-none focus:ring-1 focus:ring-orange-400 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  <X size={11} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="divide-y divide-gray-50 max-h-[290px] overflow-y-auto">
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
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-all group text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 bg-gradient-to-br ${c1} ${c2} rounded-lg flex items-center justify-center shrink-0 overflow-hidden`}
                  >
                    {alumno.foto_url ? (
                      <img
                        src={alumno.foto_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className={`font-black text-xs ${c3}`}>
                        {alumno.nombre[0]}
                        {alumno.apellido[0]}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-black text-gray-900 text-xs truncate">
                        {alumno.nombre} {alumno.apellido}
                      </p>
                      {tieneAlerta && (
                        <AlertCircle
                          size={11}
                          className="text-red-400 shrink-0"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
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
                        <span className="text-xs">
                          {ESTADO_EMOJI[bitacora.estado_animo]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={12}
                  className="text-gray-300 group-hover:text-orange-400 transition-colors shrink-0"
                />
              </button>
            );
          })}

          {filtrados.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-gray-400 text-xs font-bold">
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
  planificacionAnual = [],
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
  planificacionAnual?: any;
}) {
  const planEstructuradoReal = useMemo(() => {
    if (!planificacionAnual) return [];
    if (Array.isArray(planificacionAnual)) {
      return planificacionAnual[0]?.contenido_estructurado || [];
    }
    return planificacionAnual.contenido_estructurado || [];
  }, [planificacionAnual]);

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
    {
      href: `/dashboard/maestra/curso/${cursoId}/planificacion`,
      label: "Planificación Anual",
      desc: "Calendarizar indicadores (PAT)",
      icon: Calendar,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      hover: "hover:border-orange-200",
    },
  ];

  return (
    <main className="min-w-0 bg-gray-50/50 min-h-screen">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/maestra/curso"
            className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-all shrink-0"
          >
            <ArrowLeft size={16} className="text-gray-600" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 leading-tight truncate">
                {curso?.nombre}
              </h1>
              <span className="text-[9px] font-black text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md font-mono">
                {curso?.codigo}
              </span>
            </div>
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
              Panel de Control Docente
            </p>
          </div>
        </div>

        {/* 🌟 CÓDIGO PARENTAL MANTENIDO PEQUEÑO Y RE-UBICADO */}
        <span className="text-[10px] font-black text-gray-400 bg-gray-100/70 border border-gray-200/50 px-3 py-1 rounded-xl shrink-0 font-mono shadow-xs">
          {cursoId.substring(0, 8)}
        </span>
      </div>

      <div className="px-4 lg:px-7 py-4 space-y-4 max-w-[1600px] mx-auto">
        {/* 🌟 MINIMIZADO: MICRO-ESTADÍSTICAS COMPACTAS EN UNA SOLA LÍNEA */}
        <div className="grid grid-cols-3 gap-2.5 max-w-3xl">
          <div className="bg-white border border-gray-100 rounded-xl p-2.5 flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm shadow-orange-100">
              <Users size={14} />
            </div>
            <div>
              <p className="text-base font-black text-gray-900 leading-none">
                {totalAlumnos}
              </p>
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-wide mt-1">
                Alumnos
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-2.5 flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm shadow-emerald-100">
              <CheckCircle2 size={14} />
            </div>
            <div>
              <p className="text-base font-black text-gray-900 leading-none">
                {asistenciaHoy}
              </p>
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-wide mt-1">
                Presentes
              </p>
            </div>
          </div>

          <div
            className={`border rounded-xl p-2.5 flex items-center gap-3 shadow-xs ${
              pct >= 80
                ? "bg-green-50/40 border-green-100"
                : pct >= 50
                  ? "bg-amber-50/40 border-amber-100"
                  : "bg-red-50/40 border-red-100"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm ${
                pct >= 80
                  ? "bg-green-500 shadow-green-100"
                  : pct >= 50
                    ? "bg-amber-500 shadow-amber-100"
                    : "bg-red-500 shadow-red-100"
              }`}
            >
              <ClipboardList size={14} />
            </div>
            <div>
              <p
                className={`text-base font-black leading-none ${
                  pct >= 80
                    ? "text-green-600"
                    : pct >= 50
                      ? "text-amber-600"
                      : "text-red-600"
                }`}
              >
                {pct}%
              </p>
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-wide mt-1">
                Asistencia
              </p>
            </div>
          </div>
        </div>

        {/* ── 🌟 ESTRATEGIA DE DOS COLUMNAS (GRID) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* COLUMNA IZQUIERDA (ANCHEADA - 2 TERCIOS) */}
          <div className="lg:col-span-2 space-y-4">
            {/* ALERTA DE BITÁCORA */}
            {pendientes > 0 && (
              <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <AlertCircle size={15} className="text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-amber-800 text-xs leading-tight">
                      {pendientes} bitácora{pendientes !== 1 ? "s" : ""} sin
                      completar hoy
                    </p>
                    <p className="text-amber-600 text-[10px] font-bold mt-0.5">
                      Completá antes de que termine el día
                    </p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/maestra/curso/${cursoId}/bitacora`}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all shrink-0"
                >
                  Ir <ChevronRight size={11} />
                </Link>
              </div>
            )}

            {/* LISTA ALUMNOS COMPACTADA */}
            <ListaAlumnos
              alumnos={alumnos}
              bitacorasHoy={bitacorasHoy}
              today={today}
              cursoId={cursoId}
            />

            {/* MÓDULOS DE GESTIÓN */}
            <div>
              <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Gestión del curso
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {modulos.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <Link
                      key={mod.href}
                      href={mod.href}
                      className={`bg-white rounded-xl p-3 border border-gray-100 ${mod.hover} hover:shadow-xs transition-all group`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div
                          className={`w-8 h-8 ${mod.iconBg} rounded-lg flex items-center justify-center`}
                        >
                          <Icon size={15} className={mod.iconColor} />
                        </div>
                        {(mod as any).alert && (
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-0.5" />
                        )}
                      </div>
                      <p className="font-black text-gray-900 text-xs tracking-tight">
                        {mod.label}
                      </p>
                      <p
                        className={`text-[10px] mt-0.5 leading-tight font-bold truncate ${(mod as any).alert ? "text-amber-500" : "text-gray-400"}`}
                      >
                        {mod.desc}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA (ESTRECHA - 1 TERCIO) */}
          {/* Aquí se acopla el calendario pequeño en su ancho máximo nativo sin bailar */}
          <div className="w-full">
            <CalendarioEvaluaciones
              planEstructurado={planEstructuradoReal}
              eventosInstitucionales={[]}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
