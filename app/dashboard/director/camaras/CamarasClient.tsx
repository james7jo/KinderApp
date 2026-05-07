"use client";

import { useState, useMemo } from "react";
import {
  Video,
  VideoOff,
  Plus,
  X,
  Check,
  WifiOff,
  MapPin,
  Maximize2,
  Trash2,
  RefreshCw,
  BookOpen,
  Building2,
  Globe,
  ChevronRight,
  Activity,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Camara = {
  id: string;
  nombre: string;
  ubicacion: string | null;
  stream_url: string;
  activa: boolean;
  tipo?: string | null;
  curso_id?: string | null;
};

type Curso = {
  id: string;
  nombre: string;
};

type Seccion = {
  key: string;
  label: string;
  desc: string;
  icon: any;
  color: string;
  iconBg: string;
  iconColor: string;
  barColor: string;
};

const SECCIONES: Seccion[] = [
  {
    key: "aulas",
    label: "Aulas",
    desc: "Cámaras dentro de las salas de clase",
    icon: BookOpen,
    color: "border-orange-200 bg-orange-50/50",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    barColor: "bg-orange-500",
  },
  {
    key: "kinder",
    label: "Kinder",
    desc: "Pasillos, patio y áreas comunes",
    icon: Building2,
    color: "border-violet-200 bg-violet-50/50",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-500",
    barColor: "bg-violet-500",
  },
  {
    key: "exterior",
    label: "Exterior",
    desc: "Entrada y calles alrededor del kinder",
    icon: Globe,
    color: "border-sky-200 bg-sky-50/50",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-500",
    barColor: "bg-sky-500",
  },
];

// ── STREAM ────────────────────────────────────────────────────────────────────
function StreamView({
  camara,
  compact = false,
}: {
  camara: Camara;
  compact?: boolean;
}) {
  const [error, setError] = useState(false);
  const [key, setKey] = useState(0);

  return (
    <div className="relative w-full h-full bg-gray-900">
      {!error ? (
        <img
          key={key}
          src={camara.stream_url}
          alt={camara.nombre}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
          <WifiOff size={22} className="text-gray-600" />
          <p className="text-gray-500 text-xs font-bold">Sin señal</p>
          {!compact && (
            <p className="text-gray-600 text-[10px] text-center break-all max-w-xs">
              {camara.stream_url}
            </p>
          )}
          <button
            onClick={() => {
              setError(false);
              setKey((k) => k + 1);
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-orange-400 hover:text-orange-500 mt-1"
          >
            <RefreshCw size={11} /> Reintentar
          </button>
        </div>
      )}
      {!error && (
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white text-[9px] font-black tracking-widest">
            EN VIVO
          </span>
        </div>
      )}
    </div>
  );
}

// ── MODAL DETALLE ─────────────────────────────────────────────────────────────
// ── MODAL DETALLE CON ELIMINACIÓN ─────────────────────────────────────────────
function ModalCamara({
  camara,
  onClose,
  onEliminar,
}: {
  camara: Camara;
  onClose: () => void;
  onEliminar: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const seccion =
    SECCIONES.find((s) => s.key === (camara.tipo ?? "kinder")) ?? SECCIONES[1];
  const Icon = seccion.icon;

  // ESTA FUNCIÓN AHORA BORRA DE VERDAD EL REGISTRO
  async function handleBorrarDefinitivo() {
    setLoading(true);
    const { error } = await supabase
      .from("camaras")
      .delete() // <--- Cambiado de update a delete
      .eq("id", camara.id);

    if (error) {
      alert("No se pudo eliminar la cámara");
      setLoading(false);
      return;
    }

    setLoading(false);
    onEliminar(camara.id); // Avisa al padre para que la quite de la lista
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative bg-white w-full lg:max-w-2xl rounded-t-3xl lg:rounded-3xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden"
        style={{
          height: "calc(100dvh - 48px)",
          maxHeight: "calc(100dvh - 48px)",
        }}
      >
        {/* Handle móvil fijo */}
        <div className="lg:hidden flex justify-center pt-3 pb-1 shrink-0 bg-white">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header fijo */}
        <div className="flex items-center gap-3 px-5 pt-3 pb-4 border-b border-gray-100 shrink-0 bg-white z-10">
          <div
            className={`w-10 h-10 ${seccion.iconBg} rounded-xl flex items-center justify-center shrink-0`}
          >
            <Icon size={18} className={seccion.iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-gray-900 text-base leading-tight truncate">
              {camara.nombre}
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {seccion.label}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all shrink-0"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Cuerpo Scrolleable */}
        <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col bg-slate-50">
          <div className="shrink-0 aspect-video bg-gray-900 shadow-inner">
            <StreamView camara={camara} />
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                Conexión
              </p>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3">
                <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">
                  Source URL
                </p>
                <p className="text-gray-600 text-xs font-mono break-all leading-relaxed">
                  {camara.stream_url}
                </p>
              </div>
              <a
                href={camara.stream_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-slate-900 text-white font-black py-3 rounded-xl text-xs hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
              >
                <Globe size={14} /> ABRIR TRANSMISIÓN
              </a>
            </div>

            <div className="flex items-start gap-3 px-2">
              <Activity size={14} className="text-orange-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                Asegúrese de que el servidor externo esté disponible. Si cambia
                la IP, deberá editar esta cámara.
              </p>
            </div>
          </div>
          <div className="h-6 shrink-0" />
        </div>

        {/* Footer fijo con el Basurero Pro */}
        <div className="shrink-0 border-t border-gray-100 p-5 bg-white z-10">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 font-black py-3.5 rounded-2xl transition-all text-sm active:scale-95"
            >
              <Trash2 size={16} /> ELIMINAR CÁMARA
            </button>
          ) : (
            <div className="flex gap-3 animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 border border-gray-200 text-gray-500 font-bold py-3.5 rounded-2xl text-sm hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleBorrarDefinitivo}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-2xl transition-all text-sm disabled:opacity-50 shadow-lg shadow-red-200 flex items-center justify-center gap-2"
              >
                {loading ? "Borrando..." : "SÍ, ELIMINAR"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MODAL NUEVA CÁMARA ────────────────────────────────────────────────────────
function ModalNuevaCamara({
  colegioId,
  cursos,
  onClose,
}: {
  colegioId: string;
  cursos: Curso[];
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [tipo, setTipo] = useState("aulas");
  const [cursoId, setCursoId] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleAgregar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("camaras").insert({
      colegio_id: colegioId,
      nombre,
      ubicacion: ubicacion || null,
      stream_url: streamUrl,
      tipo,
      curso_id: tipo === "aulas" && cursoId ? cursoId : null,
      activa: true,
    });
    setLoading(false);
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-white w-full lg:max-w-md rounded-t-3xl lg:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          height: "calc(100dvh - 64px)",
          maxHeight: "calc(100dvh - 64px)",
        }}
      >
        <div className="lg:hidden flex justify-center pt-3 pb-1 shrink-0 bg-white">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-gray-100 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
              <Video size={17} className="text-orange-500" />
            </div>
            <h2 className="font-black text-gray-900 text-lg leading-none">
              Nueva cámara
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <form
          onSubmit={handleAgregar}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-5 space-y-5 overscroll-contain">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">
                Sección *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SECCIONES.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setTipo(s.key)}
                      className={`flex flex-col items-center gap-2 py-3 rounded-2xl border-2 transition-all ${
                        tipo === s.key
                          ? "border-orange-400 bg-orange-50"
                          : "border-gray-50 hover:border-gray-100 bg-white"
                      }`}
                    >
                      <Icon
                        size={16}
                        className={
                          tipo === s.key ? "text-orange-500" : "text-gray-400"
                        }
                      />
                      <span
                        className={`text-[11px] font-black ${tipo === s.key ? "text-orange-600" : "text-gray-500"}`}
                      >
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Selector de curso — solo para aulas */}
            {tipo === "aulas" && cursos.length > 0 && (
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Curso asignado
                </label>
                <select
                  value={cursoId}
                  onChange={(e) => setCursoId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50/50"
                >
                  <option value="">Sin asignar a curso específico</option>
                  {cursos.map((cu) => (
                    <option key={cu.id} value={cu.id}>
                      {cu.nombre}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 font-medium mt-1.5">
                  La maestra del curso podrá ver esta cámara
                </p>
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                Nombre *
              </label>
              <input
                type="text"
                placeholder="Ej: Sala Inicial A"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50/50"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                Ubicación
              </label>
              <input
                type="text"
                placeholder="Ej: Primer piso - Pasillo norte"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                URL del Stream *
              </label>
              <input
                type="text"
                placeholder="http://192.168.x.x:8080/video"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50/50"
                required
              />
              <p className="text-[10px] text-gray-400 font-bold mt-2 flex items-center gap-1">
                <Activity size={10} /> Compatible con MJPEG, HLS o imagen
                estática
              </p>
            </div>
            <div className="h-4 shrink-0" />
          </div>
          <div className="p-5 border-t border-gray-100 bg-white shrink-0">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
            >
              <Check size={18} strokeWidth={3} />
              {loading ? "Registrando..." : "Agregar cámara"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export default function CamarasClient({
  camaras: initialCamaras,
  colegioId,
  cursos,
}: {
  camaras: Camara[];
  colegioId: string;
  cursos: Curso[];
}) {
  const [camaras, setCamaras] = useState(initialCamaras);
  const [selected, setSelected] = useState<Camara | null>(null);
  const [showNueva, setShowNueva] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  function handleEliminar(id: string) {
    setCamaras((prev) => prev.filter((c) => c.id !== id));
  }

  // ── BUSCADOR: filtra Y normaliza tipo en un solo useMemo ──────────────────
  const camarasFiltradas = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return camaras
      .map((c) => ({ ...c, tipo: c.tipo ?? "kinder" }))
      .filter((c) => {
        if (!term) return true;
        return (
          c.nombre.toLowerCase().includes(term) ||
          (c.ubicacion?.toLowerCase().includes(term) ?? false)
        );
      });
  }, [camaras, searchTerm]);

  const hayResultados = camarasFiltradas.length > 0;

  return (
    <>
      <main className="min-w-0 font-nunito">
        {/* TOP BAR */}
        <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3 sticky top-0 z-30 shadow-sm shadow-slate-200/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="hidden sm:block">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">
                  Director
                </p>
                <h1 className="text-lg font-black text-gray-900 leading-none">
                  Monitoreo
                </h1>
              </div>
              {/* Buscador */}
              <div className="relative flex-1 md:w-64 lg:w-80 group">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Buscar cámara o zona..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-100/80 border border-transparent focus:bg-white focus:border-orange-400 rounded-2xl pl-10 pr-8 py-2.5 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-200 hover:bg-slate-300 p-1 rounded-full transition-colors"
                  >
                    <X size={10} className="text-slate-600" />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowNueva(true)}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-sm font-black px-5 py-2.5 rounded-2xl transition-all shadow-sm shadow-orange-200"
            >
              <span className="hidden sm:inline">Nueva cámara</span>
              <Plus size={16} className="sm:hidden" />
            </button>
          </div>
        </div>

        <div className="px-4 lg:px-7 pt-5 pb-8">
          {/* Mensaje de búsqueda sin resultados */}
          {searchTerm && !hayResultados && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                <Search size={24} className="text-gray-300" />
              </div>
              <p className="font-black text-gray-700 text-lg mb-1">
                Sin resultados
              </p>
              <p className="text-gray-400 text-sm">
                No hay cámaras que coincidan con "{searchTerm}"
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 text-sm font-bold text-orange-500 hover:text-orange-600"
              >
                Limpiar búsqueda
              </button>
            </div>
          )}

          {/* Contador de resultados al buscar */}
          {searchTerm && hayResultados && (
            <div className="flex items-center gap-2 mb-5 px-1">
              <span className="text-sm font-bold text-gray-500">
                {camarasFiltradas.length} resultado
                {camarasFiltradas.length !== 1 ? "s" : ""} para
              </span>
              <span className="text-sm font-black text-orange-500">
                "{searchTerm}"
              </span>
              <button
                onClick={() => setSearchTerm("")}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 underline ml-1"
              >
                limpiar
              </button>
            </div>
          )}

          {/* Secciones — solo si hay cámaras o no hay búsqueda activa */}
          {(!searchTerm || hayResultados) &&
            (camaras.length > 0 ? (
              <div className="space-y-8">
                {SECCIONES.map((seccion) => {
                  // Filtrar por sección DENTRO de las ya filtradas por búsqueda
                  const camarasSeccion = camarasFiltradas.filter(
                    (c) => c.tipo === seccion.key,
                  );
                  // Si hay búsqueda activa y esta sección no tiene resultados, no mostrar
                  if (searchTerm && camarasSeccion.length === 0) return null;
                  const Icon = seccion.icon;
                  return (
                    <div key={seccion.key}>
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`w-9 h-9 ${seccion.iconBg} rounded-xl flex items-center justify-center shrink-0`}
                        >
                          <Icon size={17} className={seccion.iconColor} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h2 className="font-black text-gray-900 text-sm">
                              {seccion.label}
                            </h2>
                            <span className="text-[11px] font-bold text-gray-400">
                              {camarasSeccion.length}{" "}
                              {camarasSeccion.length === 1
                                ? "cámara"
                                : "cámaras"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 font-medium">
                            {seccion.desc}
                          </p>
                        </div>
                        <span className="flex-shrink-0 h-px flex-1 bg-gray-100 hidden sm:block" />
                      </div>

                      {camarasSeccion.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {camarasSeccion.map((camara) => (
                            <button
                              key={camara.id}
                              onClick={() => setSelected(camara)}
                              className="group text-left rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50 transition-all duration-200"
                            >
                              <div className={`h-1 ${seccion.barColor}`} />
                              <div className="relative aspect-video bg-gray-900 overflow-hidden">
                                <StreamView camara={camara} compact />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 bg-white/95 backdrop-blur rounded-xl px-3 py-2 flex items-center gap-1.5 shadow-lg">
                                    <Maximize2
                                      size={13}
                                      className="text-gray-700"
                                    />
                                    <span className="text-xs font-black text-gray-700">
                                      Ver detalle
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="px-4 py-3 flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-black text-gray-900 text-sm truncate">
                                    {camara.nombre}
                                  </p>
                                  {camara.ubicacion && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <MapPin
                                        size={10}
                                        className="text-gray-400 shrink-0"
                                      />
                                      <p className="text-gray-400 text-xs truncate">
                                        {camara.ubicacion}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <ChevronRight
                                  size={14}
                                  className="text-gray-200 group-hover:text-orange-400 transition-colors shrink-0"
                                />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        // Empty state por sección (solo sin búsqueda)
                        !searchTerm && (
                          <div
                            className={`rounded-2xl border-2 border-dashed ${seccion.color} py-8 text-center px-4`}
                          >
                            <div
                              className={`w-10 h-10 ${seccion.iconBg} rounded-xl flex items-center justify-center mx-auto mb-3`}
                            >
                              <Icon
                                size={18}
                                className={`${seccion.iconColor} opacity-40`}
                              />
                            </div>
                            <p className="text-sm font-bold text-gray-400">
                              Sin cámaras en esta sección
                            </p>
                            <button
                              onClick={() => setShowNueva(true)}
                              className="mt-3 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
                            >
                              + Agregar cámara de {seccion.label.toLowerCase()}
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                  <VideoOff size={36} className="text-gray-300" />
                </div>
                <h2 className="font-black text-gray-800 text-2xl mb-2">
                  Sin cámaras vinculadas
                </h2>
                <p className="text-gray-400 text-sm max-w-xs leading-relaxed mb-8">
                  Agregá cámaras IP para monitorear el colegio en tiempo real
                  desde cualquier dispositivo
                </p>
                <button
                  onClick={() => setShowNueva(true)}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-3.5 rounded-xl transition-all shadow-md shadow-orange-200"
                >
                  <Plus size={20} /> Agregar primera cámara
                </button>
              </div>
            ))}
        </div>
      </main>

      {selected && (
        <ModalCamara
          camara={selected}
          onClose={() => setSelected(null)}
          onEliminar={handleEliminar}
        />
      )}
      {showNueva && (
        <ModalNuevaCamara
          colegioId={colegioId}
          cursos={cursos}
          onClose={() => setShowNueva(false)}
        />
      )}
    </>
  );
}
