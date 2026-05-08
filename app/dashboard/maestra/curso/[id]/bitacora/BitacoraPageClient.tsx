"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ChevronDown,
  Check,
  X,
  Users,
  ClipboardList,
  Search,
} from "lucide-react";

type EstadoAnimo =
  | "feliz"
  | "triste"
  | "travieso"
  | "cansado"
  | "enfermo"
  | "normal";

const ESTADOS: { value: EstadoAnimo; emoji: string; label: string }[] = [
  { value: "feliz", emoji: "😊", label: "Feliz" },
  { value: "normal", emoji: "😐", label: "Normal" },
  { value: "triste", emoji: "😢", label: "Triste" },
  { value: "travieso", emoji: "😈", label: "Travieso" },
  { value: "cansado", emoji: "😴", label: "Cansado" },
  { value: "enfermo", emoji: "🤒", label: "Enfermo" },
];

const COLORES = [
  "from-orange-100 to-orange-200 text-orange-500",
  "from-violet-100 to-violet-200 text-violet-500",
  "from-sky-100 to-sky-200 text-sky-500",
  "from-emerald-100 to-emerald-200 text-emerald-500",
  "from-rose-100 to-rose-200 text-rose-500",
];

type Alumno = {
  id: string;
  nombre: string;
  apellido: string;
  foto_url?: string | null;
};
type Bitacora = {
  id: string;
  alumno_id: string;
  comio: boolean | null;
  estado_animo: string | null;
  actividades: string | null;
  observaciones: string | null;
};

// ── MODAL BITÁCORA ───────────────────────────────────────────────────────────
function ModalBitacora({
  alumno,
  idx,
  bitacora,
  maestraId,
  today,
  onClose,
}: {
  alumno: Alumno;
  idx: number;
  bitacora?: Bitacora;
  maestraId: string;
  today: string;
  onClose: () => void;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [comio, setComio] = useState<boolean | null>(bitacora?.comio ?? null);
  const [estado, setEstado] = useState<EstadoAnimo | "">(
    (bitacora?.estado_animo as EstadoAnimo) ?? "",
  );
  const [actividades, setActividades] = useState(bitacora?.actividades ?? "");
  const [observaciones, setObservaciones] = useState(
    bitacora?.observaciones ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const color = COLORES[idx % COLORES.length];
  const [c1, c2, c3] = color.split(" ");

  async function guardar() {
    setSaving(true);
    const data = {
      alumno_id: alumno.id,
      maestra_id: maestraId,
      fecha: today,
      comio,
      estado_animo: estado || null,
      actividades: actividades || null,
      observaciones: observaciones || null,
    };
    if (bitacora) {
      await supabase.from("bitacoras").update(data).eq("id", bitacora.id);
    } else {
      await supabase.from("bitacoras").insert(data);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      router.refresh();
      onClose();
    }, 800);
  }

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
            className={`w-12 h-12 bg-gradient-to-br ${c1} ${c2} rounded-2xl flex items-center justify-center shrink-0 overflow-hidden`}
          >
            {alumno.foto_url ? (
              <img
                src={alumno.foto_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className={`font-black text-lg ${c3}`}>
                {alumno.nombre[0]}
                {alumno.apellido[0]}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-gray-900 text-lg leading-tight truncate">
              {alumno.nombre} {alumno.apellido}
            </h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              {bitacora ? "Editar bitácora de hoy" : "Nueva bitácora de hoy"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all shrink-0"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Formulario scrolleable */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5 overscroll-contain">
          {/* Comió */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              ¿Comió hoy?
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: true, label: "✅ Sí" },
                { value: false, label: "❌ No" },
                { value: null, label: "— N/A" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setComio(opt.value)}
                  className={`py-3.5 rounded-xl text-sm font-black transition-all active:scale-95 ${
                    comio === opt.value
                      ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
                      : "bg-gray-50 text-gray-600 hover:bg-orange-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estado de ánimo */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              Estado de ánimo
            </p>
            <div className="grid grid-cols-3 gap-3">
              {ESTADOS.map((e) => (
                <button
                  key={e.value}
                  onClick={() => setEstado(e.value)}
                  className={`py-3 rounded-xl text-xs font-black flex flex-col items-center gap-1.5 transition-all active:scale-95 ${
                    estado === e.value
                      ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
                      : "bg-gray-50 text-gray-500 hover:bg-orange-50"
                  }`}
                >
                  <span className="text-2xl">{e.emoji}</span>
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actividades */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Actividades del día
            </p>
            <input
              type="text"
              placeholder="Ej: Pintura, cuentos, ronda..."
              value={actividades}
              onChange={(e) => setActividades(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition-all"
            />
          </div>

          {/* Observaciones */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Nota para los papás
            </p>
            <textarea
              placeholder="Algo importante que deba saber la familia..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none transition-all"
            />
          </div>

          <div className="h-2" />
        </div>

        {/* Botón guardar fijo abajo */}
        <div className="shrink-0 p-5 border-t border-gray-100">
          <button
            onClick={guardar}
            disabled={saving}
            className={`w-full font-black py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
              saved
                ? "bg-green-500 text-white"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200"
            } disabled:opacity-40`}
          >
            {saved ? (
              <>
                <Check size={18} /> ¡Guardado!
              </>
            ) : saving ? (
              "Guardando..."
            ) : (
              `✓ ${bitacora ? "Actualizar" : "Guardar"} bitácora`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CARD ALUMNO (solo display, abre modal al tocar) ───────────────────────────
function AlumnoCard({
  alumno,
  idx,
  bitacora,
  maestraId,
  today,
}: {
  alumno: Alumno;
  idx: number;
  bitacora?: Bitacora;
  maestraId: string;
  today: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const completada = !!bitacora;
  const color = COLORES[idx % COLORES.length];
  const [c1, c2, c3] = color.split(" ");

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`w-full bg-white rounded-2xl border transition-all hover:shadow-md group text-left overflow-hidden ${
          completada
            ? "border-green-200 hover:border-green-300"
            : "border-gray-100 hover:border-orange-200"
        }`}
      >
        <div
          className={`h-1 ${completada ? "bg-green-400" : "bg-gray-100 group-hover:bg-orange-300 transition-colors"}`}
        />
        <div className="flex items-center gap-3 p-4">
          <div
            className={`w-11 h-11 bg-gradient-to-br ${c1} ${c2} rounded-2xl flex items-center justify-center shrink-0 overflow-hidden`}
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
            <p className="font-black text-gray-900 text-sm">
              {alumno.nombre} {alumno.apellido}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {completada ? (
                <>
                  <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                  <span className="text-xs font-bold text-green-500">
                    Completada
                  </span>
                  {bitacora?.estado_animo && (
                    <span className="text-sm">
                      {
                        ESTADOS.find((e) => e.value === bitacora.estado_animo)
                          ?.emoji
                      }
                    </span>
                  )}
                  {bitacora?.comio === true && (
                    <span className="text-[10px] text-gray-400 font-medium">
                      · Comió ✓
                    </span>
                  )}
                  {bitacora?.comio === false && (
                    <span className="text-[10px] text-red-400 font-medium">
                      · No comió
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Clock size={12} className="text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-amber-500">
                    Toca para llenar
                  </span>
                </>
              )}
            </div>
          </div>
          <ChevronDown
            size={15}
            className={`shrink-0 transition-colors ${completada ? "text-green-300" : "text-gray-200 group-hover:text-orange-400"}`}
          />
        </div>
      </button>

      {showModal && (
        <ModalBitacora
          alumno={alumno}
          idx={idx}
          bitacora={bitacora}
          maestraId={maestraId}
          today={today}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export default function BitacoraPageClient({
  cursoId,
  cursoNombre,
  maestraId,
  alumnos,
  bitacorasHoy,
  today,
  fechaLabel,
}: {
  cursoId: string;
  cursoNombre: string;
  maestraId: string;
  alumnos: Alumno[];
  bitacorasHoy: Bitacora[];
  today: string;
  fechaLabel: string;
}) {
  const [search, setSearch] = useState("");
  const bitacoraMap = new Map(bitacorasHoy.map((b) => [b.alumno_id, b]));
  const completadas = bitacorasHoy.length;
  const total = alumnos.length;
  const pct = total > 0 ? Math.round((completadas / total) * 100) : 0;
  const pendientes = total - completadas;

  // Orden alfabético + filtro por búsqueda
  const alumnosOrdenados = useMemo(() => {
    const t = search.toLowerCase().trim();
    return [...alumnos]
      .sort((a, b) =>
        `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`),
      )
      .filter(
        (a) => !t || `${a.nombre} ${a.apellido}`.toLowerCase().includes(t),
      );
  }, [alumnos, search]);

  const pendientesLista = alumnosOrdenados.filter(
    (a) => !bitacoraMap.has(a.id),
  );
  const completadasLista = alumnosOrdenados.filter((a) =>
    bitacoraMap.has(a.id),
  );

  return (
    <main className="min-w-0 font-nunito">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center gap-3 sticky top-0 z-30">
        <Link
          href={`/dashboard/maestra/curso/${cursoId}`}
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate">
            {cursoNombre}
          </p>
          <h1 className="text-lg font-black text-gray-900 leading-tight">
            Bitácora del día
          </h1>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black shrink-0 ${
            pct === 100
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {pct === 100 ? <CheckCircle2 size={13} /> : <Clock size={13} />}
          {completadas}/{total}
        </div>
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8">
        {/* ── LAYOUT PC: banner izquierda + lista derecha ── */}
        <div className="flex flex-col lg:flex-row lg:gap-6">
          {/* COLUMNA IZQUIERDA — sticky en PC */}
          <div className="lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-20 lg:self-start space-y-4 mb-5 lg:mb-0">
            {/* Banner naranja */}
            <div className="bg-orange-500 rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-orange-400 opacity-30 rounded-full" />
              <div className="absolute bottom-[-30px] right-8 w-20 h-20 bg-orange-400 opacity-20 rounded-full" />
              <div className="relative z-10">
                <p className="text-orange-100 text-xs font-bold uppercase tracking-widest capitalize mb-4">
                  {fechaLabel}
                </p>
                <p className="text-5xl font-black leading-none mb-1">
                  {completadas}
                  <span className="text-2xl text-orange-200">/{total}</span>
                </p>
                <p className="text-orange-100 text-sm mb-4">
                  bitácoras completadas
                </p>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-100 text-xs font-bold">
                    {pct}%
                  </span>
                  <span className="text-orange-100 text-xs font-bold">
                    {pct === 100
                      ? "✓ Al día"
                      : `${pendientes} pendiente${pendientes !== 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats mini */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <p className="text-2xl font-black text-green-600">
                  {completadas}
                </p>
                <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                  Completas
                </p>
              </div>
              <div
                className={`rounded-2xl border p-4 text-center ${pendientes > 0 ? "bg-amber-50 border-amber-100" : "bg-white border-gray-100"}`}
              >
                <p
                  className={`text-2xl font-black ${pendientes > 0 ? "text-amber-600" : "text-gray-400"}`}
                >
                  {pendientes}
                </p>
                <p
                  className={`text-[11px] font-bold mt-0.5 ${pendientes > 0 ? "text-amber-400" : "text-gray-400"}`}
                >
                  Pendientes
                </p>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA — lista */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Buscador */}
            {total > 0 && (
              <div className="relative">
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
            )}

            {total > 0 ? (
              <>
                {/* Pendientes */}
                {pendientesLista.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
                      <Clock size={11} /> Pendientes ({pendientesLista.length})
                    </p>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
                      {pendientesLista.map((alumno, idx) => (
                        <AlumnoCard
                          key={alumno.id}
                          alumno={alumno}
                          idx={idx}
                          bitacora={undefined}
                          maestraId={maestraId}
                          today={today}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completadas */}
                {completadasLista.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
                      <CheckCircle2 size={11} /> Completadas (
                      {completadasLista.length})
                    </p>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
                      {completadasLista.map((alumno, idx) => (
                        <AlumnoCard
                          key={alumno.id}
                          alumno={alumno}
                          idx={idx + pendientesLista.length}
                          bitacora={bitacoraMap.get(alumno.id)}
                          maestraId={maestraId}
                          today={today}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sin resultados */}
                {alumnosOrdenados.length === 0 && (
                  <div className="py-12 text-center bg-white rounded-2xl border border-gray-100">
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
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-5">
                  <ClipboardList size={32} className="text-orange-300" />
                </div>
                <h2 className="font-black text-gray-800 text-xl mb-2">
                  Sin alumnos en el curso
                </h2>
                <p className="text-gray-400 text-sm">
                  El director debe agregar alumnos a este curso
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
