"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Heart,
  Shield,
  MapPin,
  Search,
  X,
  Users,
  ChevronRight,
  AlertCircle,
  User,
  CheckCircle2,
} from "lucide-react";

type Alumno = {
  id: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento?: string;
  genero?: string;
  foto_url?: string;
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

const COLORES = [
  "from-orange-100 to-orange-200 text-orange-500",
  "from-violet-100 to-violet-200 text-violet-500",
  "from-sky-100 to-sky-200 text-sky-500",
  "from-emerald-100 to-emerald-200 text-emerald-500",
  "from-rose-100 to-rose-200 text-rose-500",
];

function edad(fechaNac?: string) {
  if (!fechaNac) return null;
  return Math.floor(
    (Date.now() - new Date(fechaNac).getTime()) / (1000 * 60 * 60 * 24 * 365),
  );
}

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
  const e = edad(alumno.fecha_nacimiento);
  const color = COLORES[colorIdx % COLORES.length];
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
        {/* Handle móvil */}
        <div className="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-3 pb-4 border-b border-gray-100 shrink-0">
          <div
            className={`w-13 h-13 w-12 h-12 bg-gradient-to-br ${color.split(" ").slice(0, 2).join(" ")} rounded-2xl flex items-center justify-center shrink-0 overflow-hidden`}
          >
            {alumno.foto_url ? (
              <img
                src={alumno.foto_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className={`text-lg font-black ${color.split(" ")[2]}`}>
                {alumno.nombre[0]}
                {alumno.apellido[0]}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-gray-900 text-lg leading-tight truncate">
              {alumno.nombre} {alumno.apellido}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {e && (
                <span className="text-xs text-gray-400 font-medium">
                  {e} años
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

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4 overscroll-contain">
          {/* ── TAB INFO ── */}
          {tab === "info" && (
            <>
              {/* Recoge hoy */}
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
                    ? `${recogidaHoy.responsable_nombre}`
                    : "⚠ No definido"}
                </p>
                {recogidaHoy?.responsable_relacion && (
                  <p
                    className={`text-xs font-medium capitalize mt-0.5 ${recogidaHoy ? "text-green-600" : "text-amber-500"}`}
                  >
                    {recogidaHoy.responsable_relacion}
                  </p>
                )}
              </div>

              {/* Datos generales */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Datos generales
                </p>
                <div className="bg-white rounded-xl divide-y divide-gray-50">
                  {[
                    {
                      label: "Nombre completo",
                      value: `${alumno.nombre} ${alumno.apellido}`,
                    },
                    { label: "Edad", value: e ? `${e} años` : "—" },
                    {
                      label: "Fecha nacimiento",
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
                    {
                      label: "Género",
                      value: alumno.genero ?? "—",
                      capitalize: true,
                    },
                    {
                      label: "Tipo de sangre",
                      value: alumno.tipo_sangre ?? "—",
                    },
                  ].map(({ label, value, capitalize }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-3 py-2.5"
                    >
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                        {label}
                      </span>
                      <span
                        className={`text-sm font-bold text-gray-800 ${capitalize ? "capitalize" : ""}`}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas especiales */}
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

          {/* ── TAB FAMILIA ── */}
          {tab === "familia" && (
            <>
              {/* Tutores */}
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

              {/* Autorizados */}
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

          {/* ── TAB MÉDICO ── */}
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
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-0.5">
                          Alergias
                        </p>
                        <p className="text-sm font-bold text-red-700">
                          ⚠️ {alumno.alergias}
                        </p>
                      </div>
                    )}
                    {alumno.medicamentos && (
                      <div className="px-3 py-2.5">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-0.5">
                          Medicamentos
                        </p>
                        <p className="text-sm font-bold text-red-700">
                          💊 {alumno.medicamentos}
                        </p>
                      </div>
                    )}
                    {alumno.capacidades_diferentes && (
                      <div className="px-3 py-2.5">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-0.5">
                          Capacidades diferentes
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
                    {
                      label: "Tipo de sangre",
                      value: alumno.tipo_sangre ?? "—",
                    },
                    {
                      label: "Enfermedades crónicas",
                      value: alumno.enfermedades_cronicas ?? "—",
                    },
                    {
                      label: "Médico de cabecera",
                      value: alumno.medico_cabecera ?? "—",
                    },
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
                  {alumno.tiene_seguro && (
                    <div className="px-3 py-2.5">
                      <span className="text-xs font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        ✓ Tiene seguro médico
                      </span>
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

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export default function AlumnosClient({
  cursoId,
  cursoNombre,
  alumnos,
  today,
}: {
  cursoId: string;
  cursoNombre: string;
  alumnos: Alumno[];
  today: string;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Alumno | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const filtrados = useMemo(() => {
    const t = search.toLowerCase().trim();
    if (!t) return alumnos;
    return alumnos.filter((a) =>
      `${a.nombre} ${a.apellido}`.toLowerCase().includes(t),
    );
  }, [alumnos, search]);

  const conAlerta = alumnos.filter(
    (a) => a.alergias || a.medicamentos || a.capacidades_diferentes,
  ).length;

  return (
    <>
      <main className="min-w-0">
        {/* TOP BAR */}
        <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center gap-3 sticky top-0 z-30">
          <Link
            href={`/dashboard/maestra/curso/${cursoId}`}
            className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
              {cursoNombre}
            </p>
            <h1 className="text-lg font-black text-gray-900 leading-tight">
              Lista de alumnos
            </h1>
          </div>
          <span className="text-sm font-black text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full shrink-0">
            {alumnos.length}
          </span>
        </div>

        <div className="px-4 lg:px-7 pt-5 pb-8 max-w-2xl mx-auto">
          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-orange-500 rounded-2xl p-4 text-white relative overflow-hidden shadow-lg shadow-orange-200">
              <div className="absolute -top-3 -right-3 w-14 h-14 bg-orange-400 opacity-40 rounded-full" />
              <p className="text-2xl font-black relative z-10">
                {alumnos.length}
              </p>
              <p className="text-white/80 text-[11px] font-bold mt-0.5 relative z-10">
                Total
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-2xl font-black text-gray-900">
                {
                  alumnos.filter(
                    (a) => a.genero === "masculino" || a.genero === "hombre",
                  ).length
                }
              </p>
              <p className="text-gray-400 text-[11px] font-bold mt-0.5">
                Niños
              </p>
            </div>
            <div
              className={`rounded-2xl p-4 border text-center ${conAlerta > 0 ? "bg-red-50 border-red-100" : "bg-white border-gray-100"}`}
            >
              <p
                className={`text-2xl font-black ${conAlerta > 0 ? "text-red-500" : "text-gray-900"}`}
              >
                {conAlerta}
              </p>
              <p
                className={`text-[11px] font-bold mt-0.5 ${conAlerta > 0 ? "text-red-400" : "text-gray-400"}`}
              >
                {conAlerta > 0 ? "Alertas" : "Sin alertas"}
              </p>
            </div>
          </div>

          {/* Buscador */}
          <div className="relative mb-4">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
            />
            <input
              type="text"
              placeholder="Buscar alumno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-10 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X size={12} className="text-gray-500" />
              </button>
            )}
          </div>

          {/* Lista compacta */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {filtrados.length > 0 ? (
              filtrados.map((alumno, idx) => {
                const e = edad(alumno.fecha_nacimiento);
                const colorClass = COLORES[idx % COLORES.length];
                const tieneAlerta = !!(
                  alumno.alergias ||
                  alumno.medicamentos ||
                  alumno.capacidades_diferentes
                );
                const recogidaHoy = alumno.plan_recogida?.find(
                  (r) =>
                    r.fecha_inicio <= today &&
                    (!r.fecha_fin || r.fecha_fin >= today),
                );

                return (
                  <button
                    key={alumno.id}
                    onClick={() => {
                      setSelected(alumno);
                      setSelectedIdx(idx);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/80 transition-all group text-left"
                  >
                    {/* Avatar */}
                    <div
                      className={`w-11 h-11 bg-gradient-to-br ${colorClass.split(" ").slice(0, 2).join(" ")} rounded-xl flex items-center justify-center shrink-0 overflow-hidden`}
                    >
                      {alumno.foto_url ? (
                        <img
                          src={alumno.foto_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span
                          className={`font-black text-sm ${colorClass.split(" ")[2]}`}
                        >
                          {alumno.nombre[0]}
                          {alumno.apellido[0]}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-gray-900 text-sm">
                          {alumno.nombre} {alumno.apellido}
                        </p>
                        {tieneAlerta && (
                          <AlertCircle
                            size={12}
                            className="text-red-400 shrink-0"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {e && (
                          <span className="text-xs text-gray-400">
                            {e} años
                          </span>
                        )}
                        {recogidaHoy && (
                          <span className="text-[10px] font-bold text-green-600 truncate">
                            · Recoge: {recogidaHoy.responsable_nombre}
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
              })
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-400 text-sm font-bold">
                  Sin resultados para "{search}"
                </p>
                <button
                  onClick={() => setSearch("")}
                  className="text-orange-500 text-xs font-bold mt-2"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {selected && (
        <ModalAlumno
          alumno={selected}
          today={today}
          colorIdx={selectedIdx}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
