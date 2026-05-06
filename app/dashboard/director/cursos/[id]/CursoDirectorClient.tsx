"use client";

import { useState } from "react";
import {
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  Bell,
  X,
  Phone,
  Heart,
  Shield,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  GraduationCap,
  MapPin,
} from "lucide-react";

// ── Tipos ────────────────────────────────────────────────────────────────────
type Alumno = {
  id: string;
  nombre: string;
  apellido: string;
  genero?: string;
  fecha_nacimiento?: string;
  foto_url?: string;
  tipo_sangre?: string;
  alergias?: string;
  medicamentos?: string;
  enfermedades_cronicas?: string;
  capacidades_diferentes?: string;
  medico_cabecera?: string;
  telefono_medico?: string;
  tiene_seguro?: boolean;
  nombre_seguro?: string;
  numero_seguro?: string;
};
type Bitacora = {
  alumno_id: string;
  comio?: boolean | null;
  estado_animo?: string;
  actividades?: string;
  observaciones?: string;
  fecha: string;
};
type Tutor = {
  id: string;
  alumno_id: string;
  full_name: string;
  relacion: string;
  telefono?: string;
  es_principal?: boolean;
};
type Tercero = {
  id: string;
  alumno_id: string;
  full_name: string;
  relacion: string;
  telefono?: string;
  documento_identidad?: string;
  notas?: string;
};
type Recogida = {
  id: string;
  alumno_id: string;
  responsable_nombre: string;
  responsable_relacion: string;
  fecha_inicio: string;
  fecha_fin?: string;
  notas?: string;
};
type Aviso = {
  id: string;
  titulo: string;
  contenido: string;
  tipo: string;
  fecha?: string;
  hora?: string;
  lugar?: string;
  created_at: string;
};
type Actividad = {
  id: string;
  titulo: string;
  fecha?: string;
  descripcion?: string;
};
type MaestraCurso = {
  profiles: {
    id?: string;
    full_name?: string;
    email?: string;
    telefono?: string;
    avatar_url?: string;
    direccion?: string;
  } | null;
};

interface Props {
  cursoId: string;
  curso: any;
  maestrasCurso: MaestraCurso[];
  alumnos: Alumno[];
  bitacorasHoy: Bitacora[];
  tutores: Tutor[];
  terceros: Tercero[];
  recogidas: Recogida[];
  avisos: Aviso[];
  actividades: Actividad[];
  totalAlumnos: number;
  presentesHoy: number;
  today: string;
}

const ESTADO_EMOJI: Record<string, string> = {
  feliz: "😊",
  normal: "😐",
  triste: "😢",
  travieso: "😈",
  cansado: "😴",
  enfermo: "🤒",
};

// ── MODAL ALUMNO ─────────────────────────────────────────────────────────────
function ModalAlumno({
  alumno,
  bitacora,
  tutoresAlumno,
  tercerosAlumno,
  recogidaAlumno,
  onClose,
}: {
  alumno: Alumno;
  bitacora?: Bitacora;
  tutoresAlumno: Tutor[];
  tercerosAlumno: Tercero[];
  recogidaAlumno?: Recogida;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"info" | "medico" | "familia" | "bitacora">(
    "info",
  );

  const edad = alumno.fecha_nacimiento
    ? Math.floor(
        (Date.now() - new Date(alumno.fecha_nacimiento).getTime()) /
          (1000 * 60 * 60 * 24 * 365),
      )
    : null;

  const tabs = [
    { key: "info", label: "Info", icon: User },
    { key: "medico", label: "Médico", icon: Heart },
    { key: "familia", label: "Familia", icon: Users },
    { key: "bitacora", label: "Bitácora", icon: ClipboardList },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white w-full lg:max-w-lg lg:rounded-3xl rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br from-orange-100 to-orange-200 overflow-hidden">
            {alumno.foto_url ? (
              <img
                src={alumno.foto_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-black text-orange-500">
                {alumno.nombre[0]}
                {alumno.apellido[0]}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-gray-900 text-lg leading-tight">
              {alumno.nombre} {alumno.apellido}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {edad && (
                <span className="text-xs font-bold text-gray-400">
                  {edad} años
                </span>
              )}
              {alumno.genero && (
                <span className="text-xs font-bold text-gray-300 capitalize">
                  · {alumno.genero}
                </span>
              )}
              {recogidaAlumno && (
                <span className="text-[10px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                  Recoge: {recogidaAlumno.responsable_nombre}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all shrink-0"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0 px-2">
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
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* ── TAB INFO ── */}
          {tab === "info" && (
            <>
              <Section title="Datos generales" color="orange">
                <Row
                  label="Nombre completo"
                  value={`${alumno.nombre} ${alumno.apellido}`}
                />
                <Row label="Edad" value={edad ? `${edad} años` : "—"} />
                <Row
                  label="Fecha nacimiento"
                  value={
                    alumno.fecha_nacimiento
                      ? new Date(
                          alumno.fecha_nacimiento + "T12:00:00",
                        ).toLocaleDateString("es-BO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"
                  }
                />
                <Row label="Género" value={alumno.genero ?? "—"} capitalize />
              </Section>

              <Section title="Recogida de hoy" color="green">
                {recogidaAlumno ? (
                  <>
                    <Row
                      label="Responsable"
                      value={recogidaAlumno.responsable_nombre}
                    />
                    <Row
                      label="Relación"
                      value={recogidaAlumno.responsable_relacion}
                      capitalize
                    />
                    {recogidaAlumno.notas && (
                      <Row label="Notas" value={recogidaAlumno.notas} />
                    )}
                  </>
                ) : (
                  <p className="text-amber-500 text-sm font-bold">
                    ⚠ No definida para hoy
                  </p>
                )}
              </Section>
            </>
          )}

          {/* ── TAB MÉDICO ── */}
          {tab === "medico" && (
            <>
              <Section title="Información médica" color="red">
                <Row label="Tipo de sangre" value={alumno.tipo_sangre ?? "—"} />
                <Row label="Alergias" value={alumno.alergias ?? "—"} />
                <Row label="Medicamentos" value={alumno.medicamentos ?? "—"} />
                <Row
                  label="Enfermedades crónicas"
                  value={alumno.enfermedades_cronicas ?? "—"}
                />
                <Row
                  label="Capacidades diferentes"
                  value={alumno.capacidades_diferentes ?? "—"}
                />
              </Section>
              <Section title="Médico de cabecera" color="red">
                <Row label="Nombre" value={alumno.medico_cabecera ?? "—"} />
                {alumno.telefono_medico && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                      Teléfono
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
              </Section>
              {alumno.tiene_seguro && (
                <Section title="Seguro médico" color="violet">
                  <Row label="Seguro" value={alumno.nombre_seguro ?? "—"} />
                  <Row label="Número" value={alumno.numero_seguro ?? "—"} />
                </Section>
              )}
            </>
          )}

          {/* ── TAB FAMILIA ── */}
          {tab === "familia" && (
            <>
              <Section title={`Tutores (${tutoresAlumno.length})`} color="blue">
                {tutoresAlumno.length > 0 ? (
                  tutoresAlumno.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0"
                    >
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
                          className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center"
                        >
                          <Phone size={14} className="text-blue-500" />
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm py-2">
                    Sin tutores registrados
                  </p>
                )}
              </Section>

              <Section
                title={`Autorizados para recoger (${tercerosAlumno.length})`}
                color="green"
              >
                {tercerosAlumno.length > 0 ? (
                  tercerosAlumno.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0"
                    >
                      <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                        <Shield size={15} className="text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-gray-900">
                          {t.full_name}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">
                          {t.relacion}
                        </p>
                        {t.documento_identidad && (
                          <p className="text-xs text-gray-300">
                            CI: {t.documento_identidad}
                          </p>
                        )}
                        {t.notas && (
                          <p className="text-xs text-orange-400 font-medium mt-0.5">
                            📝 {t.notas}
                          </p>
                        )}
                      </div>
                      {t.telefono && (
                        <a
                          href={`tel:${t.telefono}`}
                          className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center"
                        >
                          <Phone size={14} className="text-green-500" />
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm py-2">
                    Sin personas autorizadas
                  </p>
                )}
              </Section>
            </>
          )}

          {/* ── TAB BITÁCORA ── */}
          {tab === "bitacora" && (
            <Section title="Bitácora de hoy" color="orange">
              {bitacora ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                      ¿Comió?
                    </span>
                    <span
                      className={`text-sm font-black px-3 py-1 rounded-lg ${
                        bitacora.comio === true
                          ? "bg-green-50 text-green-600"
                          : bitacora.comio === false
                            ? "bg-red-50 text-red-500"
                            : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      {bitacora.comio === true
                        ? "✅ Sí comió"
                        : bitacora.comio === false
                          ? "❌ No comió"
                          : "— Sin registro"}
                    </span>
                  </div>
                  {bitacora.estado_animo && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                        Estado
                      </span>
                      <span className="text-sm font-bold text-gray-700 capitalize">
                        {ESTADO_EMOJI[bitacora.estado_animo] ?? ""}{" "}
                        {bitacora.estado_animo}
                      </span>
                    </div>
                  )}
                  {bitacora.actividades && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                        Actividades
                      </p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">
                        {bitacora.actividades}
                      </p>
                    </div>
                  )}
                  {bitacora.observaciones && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                        Observaciones
                      </p>
                      <p className="text-sm text-gray-700 bg-orange-50 rounded-xl p-3 border border-orange-100">
                        {bitacora.observaciones}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-gray-400 text-sm font-bold">
                    La maestra aún no llenó la bitácora de hoy
                  </p>
                </div>
              )}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MODAL MAESTRA ─────────────────────────────────────────────────────────────
function ModalMaestra({
  maestra,
  onClose,
}: {
  maestra: MaestraCurso["profiles"];
  onClose: () => void;
}) {
  if (!maestra) return null;
  const initials = (maestra.full_name ?? "M")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white w-full lg:max-w-md lg:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-4 px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br from-violet-400 to-violet-600 overflow-hidden shadow-lg shadow-violet-200">
            {maestra.avatar_url ? (
              <img
                src={maestra.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-black text-white">{initials}</span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-black text-gray-900 text-xl">
              {maestra.full_name}
            </h2>
            <p className="text-violet-500 text-sm font-bold">
              Maestra de curso
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <Section title="Información de contacto" color="violet">
            {maestra.email && <Row label="Email" value={maestra.email} />}
            {maestra.telefono && (
              <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Teléfono
                </span>
                <a
                  href={`tel:${maestra.telefono}`}
                  className="flex items-center gap-1.5 text-sm font-bold text-blue-500"
                >
                  <Phone size={13} />
                  {maestra.telefono}
                </a>
              </div>
            )}
            {maestra.direccion && (
              <Row label="Dirección" value={maestra.direccion} />
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const COLORS = {
  orange: "bg-orange-50 text-orange-500 border-orange-100",
  red: "bg-red-50 text-red-400 border-red-100",
  green: "bg-green-50 text-green-500 border-green-100",
  blue: "bg-blue-50 text-blue-500 border-blue-100",
  violet: "bg-violet-50 text-violet-500 border-violet-100",
};

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: keyof typeof COLORS;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${COLORS[color]}`}>
      <p className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-70">
        {title}
      </p>
      <div className="bg-white rounded-xl px-3 divide-y divide-gray-50">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-start justify-between py-2.5 gap-4 border-b border-gray-50 last:border-0">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide shrink-0">
        {label}
      </span>
      <span
        className={`text-sm font-bold text-gray-800 text-right ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function CursoDirectorClient({
  cursoId,
  curso,
  maestrasCurso,
  alumnos,
  bitacorasHoy,
  tutores,
  terceros,
  recogidas,
  avisos,
  actividades,
  totalAlumnos,
  presentesHoy,
  today,
}: Props) {
  const [alumnoModal, setAlumnoModal] = useState<Alumno | null>(null);
  const [maestraModal, setMaestraModal] = useState<
    MaestraCurso["profiles"] | null
  >(null);
  const [activeTab, setActiveTab] = useState<
    "alumnos" | "avisos" | "actividades"
  >("alumnos");

  const bitacoraMap = new Map(bitacorasHoy.map((b) => [b.alumno_id, b]));
  const presentesSet = new Set(bitacorasHoy.map((b) => b.alumno_id));
  const pct =
    totalAlumnos > 0 ? Math.round((presentesHoy / totalAlumnos) * 100) : 0;

  return (
    <>
      <div className="px-4 lg:px-7 pt-5 pb-8">
        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-orange-500 rounded-2xl p-4 text-white text-center relative overflow-hidden shadow-lg shadow-orange-200">
            <div className="absolute -top-3 -right-3 w-16 h-16 bg-orange-400 opacity-40 rounded-full" />
            <p className="text-3xl lg:text-4xl font-black relative z-10">
              {totalAlumnos}
            </p>
            <p className="text-white/80 text-xs font-bold mt-1 relative z-10">
              Alumnos
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
            <p className="text-3xl lg:text-4xl font-black text-gray-900">
              {presentesHoy}
            </p>
            <p className="text-gray-400 text-xs font-bold mt-1">
              Presentes hoy
            </p>
          </div>
          <div
            className={`rounded-2xl p-4 border text-center ${pct >= 80 ? "bg-green-50 border-green-100" : pct >= 50 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"}`}
          >
            <p
              className={`text-3xl lg:text-4xl font-black ${pct >= 80 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-500"}`}
            >
              {pct}%
            </p>
            <p
              className={`text-xs font-bold mt-1 ${pct >= 80 ? "text-green-400" : pct >= 50 ? "text-amber-400" : "text-red-400"}`}
            >
              Asistencia
            </p>
          </div>
        </div>

        {/* ── MAESTRA(S) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Docente
          </p>
          {maestrasCurso.length > 0 ? (
            <div className="space-y-2">
              {maestrasCurso.map((mc, i) => {
                const m = mc.profiles;
                if (!m) return null;
                const initials = (m.full_name ?? "M")
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <button
                    key={i}
                    onClick={() => setMaestraModal(m)}
                    className="w-full flex items-center gap-3 bg-violet-50 hover:bg-violet-100 rounded-xl p-3 transition-all group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-violet-600 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-black text-sm">
                          {initials}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-black text-gray-900 text-sm">
                        {m.full_name}
                      </p>
                      {m.telefono && (
                        <p className="text-xs text-violet-400 font-medium">
                          {m.telefono}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-violet-300 group-hover:text-violet-500 transition-colors"
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-amber-500 text-sm font-bold">
              ⚠ Sin maestra asignada
            </p>
          )}
        </div>

        {/* ── TABS ── */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-4">
          {(
            [
              {
                key: "alumnos",
                label: `Alumnos (${totalAlumnos})`,
                icon: Users,
              },
              { key: "avisos", label: `Avisos (${avisos.length})`, icon: Bell },
              {
                key: "actividades",
                label: `Actividades (${actividades.length})`,
                icon: Calendar,
              },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* ── ALUMNOS ── */}
        {activeTab === "alumnos" && (
          <>
            {alumnos.length > 0 ? (
              <>
                {/* TARJETAS DESKTOP */}
                <div className="hidden lg:grid grid-cols-2 xl:grid-cols-3 gap-4">
                  {alumnos.map((alumno) => {
                    const presente = presentesSet.has(alumno.id);
                    const bitacora = bitacoraMap.get(alumno.id);
                    const recogida = recogidas.find(
                      (r) => r.alumno_id === alumno.id,
                    );
                    const edad = alumno.fecha_nacimiento
                      ? Math.floor(
                          (Date.now() -
                            new Date(alumno.fecha_nacimiento).getTime()) /
                            (1000 * 60 * 60 * 24 * 365),
                        )
                      : null;
                    return (
                      <button
                        key={alumno.id}
                        onClick={() => setAlumnoModal(alumno)}
                        className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:shadow-md hover:border-orange-200 transition-all group flex flex-col gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl shrink-0 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center overflow-hidden">
                            {alumno.foto_url ? (
                              <img
                                src={alumno.foto_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-black text-orange-500 text-xl">
                                {alumno.nombre[0]}
                                {alumno.apellido[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-gray-900 text-sm leading-tight">
                              {alumno.nombre} {alumno.apellido}
                            </p>
                            {edad && (
                              <p className="text-xs text-gray-400 font-medium mt-0.5">
                                {edad} años
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 ${
                              presente
                                ? "bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {presente ? "✓ Presente" : "Ausente"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {bitacora?.estado_animo && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                              <span>{ESTADO_EMOJI[bitacora.estado_animo]}</span>
                              <span className="capitalize">
                                {bitacora.estado_animo}
                              </span>
                            </div>
                          )}
                          {recogida ? (
                            <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
                              <Shield
                                size={12}
                                className="text-blue-400 shrink-0"
                              />
                              <span className="text-[11px] font-bold text-blue-600 truncate">
                                Recoge: {recogida.responsable_nombre}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2">
                              <AlertCircle
                                size={12}
                                className="text-amber-400 shrink-0"
                              />
                              <span className="text-[11px] font-bold text-amber-500">
                                Sin plan de recogida
                              </span>
                            </div>
                          )}
                          {bitacora?.observaciones && (
                            <p className="text-[11px] text-gray-400 bg-gray-50 rounded-xl px-3 py-2 line-clamp-2">
                              📋 {bitacora.observaciones}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                          <span className="text-[11px] font-bold text-gray-400">
                            Ver ficha completa
                          </span>
                          <ChevronRight
                            size={14}
                            className="text-gray-200 group-hover:text-orange-400 transition-colors"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* LISTA MÓVIL */}
                <div className="lg:hidden bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {alumnos.map((alumno) => {
                    const presente = presentesSet.has(alumno.id);
                    const bitacora = bitacoraMap.get(alumno.id);
                    const recogida = recogidas.find(
                      (r) => r.alumno_id === alumno.id,
                    );
                    return (
                      <button
                        key={alumno.id}
                        onClick={() => setAlumnoModal(alumno)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/80 transition-all group text-left"
                      >
                        <div className="w-10 h-10 rounded-xl shrink-0 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center overflow-hidden">
                          {alumno.foto_url ? (
                            <img
                              src={alumno.foto_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-black text-orange-500 text-sm">
                              {alumno.nombre[0]}
                              {alumno.apellido[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 text-sm">
                            {alumno.nombre} {alumno.apellido}
                          </p>
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
                              <span className="text-[10px]">
                                {ESTADO_EMOJI[bitacora.estado_animo]}
                              </span>
                            )}
                            {recogida && (
                              <span className="text-[10px] font-bold text-blue-400 truncate">
                                · Recoge: {recogida.responsable_nombre}
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
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center">
                <p className="text-gray-400 text-sm font-bold">
                  No hay alumnos en este curso
                </p>
              </div>
            )}
          </>
        )}

        {/* ── AVISOS ── */}
        {activeTab === "avisos" && (
          <div className="space-y-3">
            {avisos.length > 0 ? (
              avisos.map((aviso) => (
                <div
                  key={aviso.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-black text-gray-900 text-sm">
                      {aviso.titulo}
                    </p>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        aviso.tipo === "global"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {aviso.tipo}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {aviso.contenido}
                  </p>
                  {(aviso.fecha || aviso.lugar) && (
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                      {aviso.fecha && (
                        <span className="text-xs font-bold text-orange-500">
                          📅{" "}
                          {new Date(
                            aviso.fecha + "T12:00:00",
                          ).toLocaleDateString("es-BO", {
                            day: "numeric",
                            month: "short",
                          })}
                          {aviso.hora ? ` · ${aviso.hora}` : ""}
                        </span>
                      )}
                      {aviso.lugar && (
                        <span className="text-xs font-bold text-gray-400">
                          📍 {aviso.lugar}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center">
                <p className="text-3xl mb-2">📢</p>
                <p className="text-gray-400 text-sm font-bold">
                  Sin avisos aún
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVIDADES ── */}
        {activeTab === "actividades" && (
          <div className="space-y-3">
            {actividades.length > 0 ? (
              actividades.map((act) => (
                <div
                  key={act.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3"
                >
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar size={18} className="text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-sm">
                      {act.titulo}
                    </p>
                    {act.descripcion && (
                      <p className="text-gray-400 text-xs mt-0.5">
                        {act.descripcion}
                      </p>
                    )}
                    {act.fecha && (
                      <p className="text-orange-500 text-xs font-bold mt-1">
                        {new Date(act.fecha + "T12:00:00").toLocaleDateString(
                          "es-BO",
                          { weekday: "long", day: "numeric", month: "long" },
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-gray-400 text-sm font-bold">
                  Sin actividades próximas
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALES */}
      {alumnoModal && (
        <ModalAlumno
          alumno={alumnoModal}
          bitacora={bitacoraMap.get(alumnoModal.id)}
          tutoresAlumno={tutores.filter((t) => t.alumno_id === alumnoModal.id)}
          tercerosAlumno={terceros.filter(
            (t) => t.alumno_id === alumnoModal.id,
          )}
          recogidaAlumno={recogidas.find((r) => r.alumno_id === alumnoModal.id)}
          onClose={() => setAlumnoModal(null)}
        />
      )}
      {maestraModal && (
        <ModalMaestra
          maestra={maestraModal}
          onClose={() => setMaestraModal(null)}
        />
      )}
    </>
  );
}
