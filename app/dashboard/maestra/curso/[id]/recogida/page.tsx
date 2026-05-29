"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  QrCode,
  RefreshCw,
  CheckCircle2,
  Clock,
  X,
  Loader2,
  User,
  Shield,
  ChevronRight,
  Heart,
  LogOut,
  Search,
  MousePointerClick,
} from "lucide-react";
import QRCode from "react-qr-code";

type Alumno = {
  id: string;
  nombre: string;
  apellido: string;
  foto_url?: string | null;
};
type Tutor = {
  id: string;
  alumno_id: string;
  full_name: string;
  relacion: string;
  foto_url?: string | null;
};
type Recogida = {
  id: string;
  alumno_id: string;
  token: string;
  activo: boolean;
  escaneado_at?: string;
  expires_at: string;
};
type Notificacion = {
  id: string;
  alumno_id: string;
  nombre_recogedor: string;
  tipo_entrega: string;
  relacion?: string;
  recogido_at: string;
};

export default function RecogidaMaestraPage() {
  const params = useParams();
  const cursoId = params.id as string;
  const supabase = createClient();

  const [cursoNombre, setCursoNombre] = useState("");
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [recogidas, setRecogidas] = useState<Recogida[]>([]);
  const [notifs, setNotifs] = useState<Notificacion[]>([]);
  const [qrModal, setQrModal] = useState<{
    alumno: Alumno;
    recogida: Recogida;
  } | null>(null);
  const [seleccionado, setSeleccionado] = useState<Alumno | null>(null);
  const [generando, setGenerando] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const cargarBase = useCallback(async () => {
    const [{ data: curso }, { data: alus }] = await Promise.all([
      supabase.from("cursos").select("nombre").eq("id", cursoId).single(),
      supabase
        .from("alumnos")
        .select("id, nombre, apellido, foto_url")
        .eq("curso_id", cursoId)
        .order("nombre"),
    ]);
    setCursoNombre(curso?.nombre ?? "");
    setAlumnos(alus ?? []);
    const alumnoIds = (alus ?? []).map((a) => a.id);
    if (alumnoIds.length === 0) return;
    const { data: tuts } = await supabase
      .from("tutores")
      .select("id, alumno_id, full_name, relacion, foto_url")
      .in("alumno_id", alumnoIds);
    setTutores(tuts ?? []);
    await cargarEstado(alumnoIds);
  }, [cursoId]);

  const cargarEstado = useCallback(
    async (ids?: string[]) => {
      const alumnoIds = ids ?? alumnos.map((a) => a.id);
      if (alumnoIds.length === 0) return;
      const hoy = new Date().toISOString().split("T")[0];
      const [{ data: recs }, { data: nots }] = await Promise.all([
        supabase
          .from("recogidas_qr")
          .select("*")
          .in("alumno_id", alumnoIds)
          .gte("created_at", hoy + "T00:00:00")
          .order("created_at", { ascending: false }),
        supabase
          .from("notificaciones_recogida")
          .select("*")
          .in("alumno_id", alumnoIds)
          .gte("recogido_at", hoy + "T00:00:00")
          .order("recogido_at", { ascending: false }),
      ]);
      setRecogidas(recs ?? []);
      setNotifs(nots ?? []);
    },
    [alumnos],
  );

  useEffect(() => {
    cargarBase();
  }, [cargarBase]);

  useEffect(() => {
    if (alumnos.length === 0) return;
    const ch = supabase
      .channel("recogidas-curso-" + cursoId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recogidas_qr" },
        () => cargarEstado(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notificaciones_recogida" },
        () => cargarEstado(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [cargarEstado, cursoId, alumnos.length]);

  async function generarQR(alumno: Alumno) {
    setGenerando(alumno.id);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("recogidas_qr")
      .update({ activo: false })
      .eq("alumno_id", alumno.id)
      .eq("activo", true);
    const { data: nueva } = await supabase
      .from("recogidas_qr")
      .insert({
        alumno_id: alumno.id,
        maestra_id: user?.id,
        activo: true,
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      })
      .select("*")
      .single();
    setGenerando(null);
    setSeleccionado(null);
    await cargarEstado();
    if (nueva) setQrModal({ alumno, recogida: nueva });
  }

  async function registrarEntregaDirecta(
    alumno: Alumno,
    tipo: "padre" | "madre" | "tutor",
    tutor?: Tutor,
  ) {
    setRegistrando(true);
    const nombre = tutor?.full_name ?? `${tipo} de ${alumno.nombre}`;
    const relacion = tutor?.relacion ?? tipo;
    const optimista: Notificacion = {
      id: "temp-" + Date.now(),
      alumno_id: alumno.id,
      nombre_recogedor: nombre,
      tipo_entrega: tipo,
      relacion: relacion,
      recogido_at: new Date().toISOString(),
    };
    setNotifs((prev) => [optimista, ...prev]);
    setSeleccionado(null);
    await supabase.from("notificaciones_recogida").insert({
      alumno_id: alumno.id,
      nombre_recogedor: nombre,
      tipo_entrega: tipo,
      relacion: relacion,
      recogido_at: new Date().toISOString(),
    });
    setRegistrando(false);
    await cargarEstado();
  }

  const getEntregaHoy = (alumnoId: string) =>
    notifs.find((n) => n.alumno_id === alumnoId);
  const getRecogidaActiva = (alumnoId: string) =>
    recogidas.find(
      (r) => r.alumno_id === alumnoId && r.activo && !r.escaneado_at,
    );
  const getTutoresDe = (alumnoId: string) =>
    tutores.filter((t) => t.alumno_id === alumnoId);

  const entregados = notifs.length;
  const total = alumnos.length;

  const alumnosFiltrados = alumnos
    .slice()
    .sort((a, b) =>
      `${a.nombre} ${a.apellido}`.localeCompare(
        `${b.nombre} ${b.apellido}`,
        "es",
      ),
    )
    .filter((a) => {
      const q = busqueda.toLowerCase().trim();
      if (!q) return true;
      return `${a.nombre} ${a.apellido}`.toLowerCase().includes(q);
    });

  // ── Componente de opciones de entrega (reutilizado en panel desktop y modal móvil) ──
  function OpcionesEntrega({ alumno }: { alumno: Alumno }) {
    const tutoresAlumno = getTutoresDe(alumno.id);
    const padre = tutoresAlumno.find(
      (t) => t.relacion?.toLowerCase() === "padre",
    );
    const madre = tutoresAlumno.find(
      (t) => t.relacion?.toLowerCase() === "madre",
    );
    const tutor = tutoresAlumno.find((t) =>
      ["tutor", "tutor legal", "abuelo", "abuela"].includes(
        t.relacion?.toLowerCase() ?? "",
      ),
    );

    return (
      <div className="space-y-2">
        {/* Padre */}
        {padre ? (
          <button
            onClick={() => registrarEntregaDirecta(alumno, "padre", padre)}
            disabled={registrando}
            className="w-full bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 text-left"
          >
            <div className="w-11 h-11 bg-sky-500 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
              {padre.foto_url ? (
                <img
                  src={padre.foto_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className="text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest">
                Padre
              </p>
              <p className="font-black text-gray-900 text-sm truncate">
                {padre.full_name}
              </p>
            </div>
            <ChevronRight size={16} className="text-sky-500" />
          </button>
        ) : (
          <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-3 opacity-50">
            <div className="w-11 h-11 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
              <User size={20} className="text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Padre
              </p>
              <p className="text-sm font-bold text-gray-400">No registrado</p>
            </div>
          </div>
        )}
        {/* Madre */}
        {madre ? (
          <button
            onClick={() => registrarEntregaDirecta(alumno, "madre", madre)}
            disabled={registrando}
            className="w-full bg-pink-50 hover:bg-pink-100 border border-pink-100 rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 text-left"
          >
            <div className="w-11 h-11 bg-pink-500 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
              {madre.foto_url ? (
                <img
                  src={madre.foto_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <Heart size={20} className="text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-pink-600 uppercase tracking-widest">
                Madre
              </p>
              <p className="font-black text-gray-900 text-sm truncate">
                {madre.full_name}
              </p>
            </div>
            <ChevronRight size={16} className="text-pink-500" />
          </button>
        ) : (
          <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-3 opacity-50">
            <div className="w-11 h-11 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
              <Heart size={20} className="text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Madre
              </p>
              <p className="text-sm font-bold text-gray-400">No registrada</p>
            </div>
          </div>
        )}
        {/* Tutor */}
        {tutor && (
          <button
            onClick={() => registrarEntregaDirecta(alumno, "tutor", tutor)}
            disabled={registrando}
            className="w-full bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 text-left"
          >
            <div className="w-11 h-11 bg-violet-500 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
              {tutor.foto_url ? (
                <img
                  src={tutor.foto_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <Shield size={20} className="text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest capitalize">
                {tutor.relacion}
              </p>
              <p className="font-black text-gray-900 text-sm truncate">
                {tutor.full_name}
              </p>
            </div>
            <ChevronRight size={16} className="text-violet-500" />
          </button>
        )}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-gray-100" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            o si vino otra persona
          </p>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <button
          onClick={() => generarQR(alumno)}
          disabled={generando === alumno.id}
          className="w-full bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 text-left shadow-sm shadow-orange-200"
        >
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            {generando === alumno.id ? (
              <Loader2 size={20} className="text-white animate-spin" />
            ) : (
              <QrCode size={20} className="text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-orange-100 uppercase tracking-widest">
              Autorizado externo
            </p>
            <p className="font-black text-white text-sm">
              Generar QR con rastreo GPS
            </p>
          </div>
          <ChevronRight size={16} className="text-white" />
        </button>
        <p className="text-[10px] text-gray-400 text-center mt-2 font-medium leading-relaxed">
          El QR es para tíos, abuelos, vecinos u otros autorizados. El padre ve
          la ubicación en tiempo real.
        </p>
      </div>
    );
  }

  return (
    <main className="min-w-0 font-nunito">
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
            Entrega de niños
          </h1>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black ${
            entregados === total && total > 0
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          <CheckCircle2 size={12} />
          {entregados}/{total}
        </div>
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8 max-w-6xl mx-auto">
        {/* Layout: lista (izq) + panel opciones (der) en desktop */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start">
          {/* COLUMNA IZQUIERDA — lista */}
          <div className="lg:col-span-2">
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                <LogOut size={17} className="text-orange-500" />
              </div>
              <p className="text-sm font-bold text-orange-700 leading-relaxed">
                Tocá un niño para registrar quién lo recoge. Familiar conocido =
                un tap. Otra persona = QR con GPS.
              </p>
            </div>

            <div className="relative mb-4">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300"
              />
              <input
                type="text"
                placeholder="Buscar alumno por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-10 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-300 transition-all"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-all"
                >
                  <X size={13} className="text-gray-500" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alumnosFiltrados.length === 0 ? (
                <div className="col-span-full py-12 text-center">
                  <p className="text-gray-400 font-bold text-sm">
                    {busqueda
                      ? `Sin resultados para "${busqueda}"`
                      : "No hay alumnos"}
                  </p>
                </div>
              ) : (
                alumnosFiltrados.map((alumno, idx) => {
                  const entrega = getEntregaHoy(alumno.id);
                  const recogida = getRecogidaActiva(alumno.id);
                  const yaEntregado = !!entrega;
                  const tieneQRActivo = !!recogida && !entrega;
                  const estaSeleccionado = seleccionado?.id === alumno.id;
                  const COLORS = [
                    "from-orange-100 to-orange-200 text-orange-500",
                    "from-violet-100 to-violet-200 text-violet-500",
                    "from-sky-100 to-sky-200 text-sky-500",
                    "from-emerald-100 to-emerald-200 text-emerald-500",
                  ];
                  const c = COLORS[idx % COLORS.length].split(" ");

                  return (
                    <div
                      key={alumno.id}
                      className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                        estaSeleccionado
                          ? "border-orange-400 ring-2 ring-orange-200"
                          : yaEntregado
                            ? "border-green-200"
                            : "border-gray-100"
                      }`}
                    >
                      <div
                        className={`h-1 ${yaEntregado ? "bg-green-400" : tieneQRActivo ? "bg-orange-400" : "bg-gray-100"}`}
                      />
                      <div className="flex items-center gap-3 p-4">
                        <div
                          className={`w-11 h-11 bg-gradient-to-br ${c[0]} ${c[1]} rounded-xl flex items-center justify-center shrink-0 overflow-hidden`}
                        >
                          {alumno.foto_url ? (
                            <img
                              src={alumno.foto_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className={`font-black text-sm ${c[2]}`}>
                              {alumno.nombre[0]}
                              {alumno.apellido[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 text-sm">
                            {alumno.nombre} {alumno.apellido}
                          </p>
                          {yaEntregado ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <CheckCircle2
                                size={11}
                                className="text-green-500 shrink-0"
                              />
                              <p className="text-xs text-green-600 font-bold truncate">
                                Entregado a {entrega?.nombre_recogedor}
                              </p>
                            </div>
                          ) : tieneQRActivo ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <QrCode
                                size={11}
                                className="text-orange-400 shrink-0"
                              />
                              <p className="text-xs text-orange-500 font-bold">
                                QR activo
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 font-medium mt-0.5">
                              Pendiente
                            </p>
                          )}
                        </div>
                        {yaEntregado ? (
                          <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle2
                              size={16}
                              className="text-green-500"
                            />
                          </div>
                        ) : tieneQRActivo ? (
                          <button
                            onClick={() =>
                              setQrModal({ alumno, recogida: recogida! })
                            }
                            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black px-3 py-2 rounded-xl transition-all active:scale-95 shrink-0"
                          >
                            <QrCode size={14} /> Ver QR
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setSeleccionado(estaSeleccionado ? null : alumno)
                            }
                            className={`flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-xl transition-all active:scale-95 shrink-0 ${
                              estaSeleccionado
                                ? "bg-orange-500 text-white"
                                : "bg-gray-900 hover:bg-orange-600 text-white"
                            }`}
                          >
                            Entregar <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                      {yaEntregado && entrega && (
                        <div className="px-4 pb-3">
                          <div className="bg-green-50 rounded-xl px-3 py-2 flex items-center gap-2">
                            <Clock
                              size={11}
                              className="text-green-500 shrink-0"
                            />
                            <p className="text-[11px] text-green-700 font-bold capitalize">
                              {entrega.tipo_entrega === "qr"
                                ? "Por QR (externo)"
                                : entrega.relacion}
                            </p>
                            <span className="text-[10px] text-green-500 font-black ml-auto shrink-0">
                              {new Date(entrega.recogido_at).toLocaleTimeString(
                                "es-BO",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA — panel de opciones (solo desktop) */}
          <div className="hidden lg:block lg:col-span-1 lg:sticky lg:top-24">
            {seleccionado ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 pt-4 pb-4 border-b border-gray-100">
                  <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {seleccionado.foto_url ? (
                      <img
                        src={seleccionado.foto_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-black">
                        {seleccionado.nombre[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Entregar a
                    </p>
                    <h2 className="font-black text-gray-900 text-base truncate">
                      {seleccionado.nombre} {seleccionado.apellido}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSeleccionado(null)}
                    className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
                <div className="p-4">
                  <OpcionesEntrega alumno={seleccionado} />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MousePointerClick size={24} className="text-orange-300" />
                </div>
                <p className="font-black text-gray-700 text-sm mb-1">
                  Seleccioná un niño
                </p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Tocá "Entregar" en cualquier alumno para ver las opciones de
                  recogida aquí
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL ENTREGA — solo móvil */}
      {seleccionado && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSeleccionado(null)}
          />
          <div className="relative bg-white w-full rounded-t-3xl shadow-2xl flex flex-col max-h-[90dvh]">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center gap-3 px-5 pt-3 pb-4 border-b border-gray-100">
              <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                {seleccionado.foto_url ? (
                  <img
                    src={seleccionado.foto_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-black">
                    {seleccionado.nombre[0]}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Entregar a
                </p>
                <h2 className="font-black text-gray-900 text-base truncate">
                  {seleccionado.nombre} {seleccionado.apellido}
                </h2>
              </div>
              <button
                onClick={() => setSeleccionado(null)}
                className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex-1">
              <OpcionesEntrega alumno={seleccionado} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL QR */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">
                  Escanear para recoger
                </p>
                <button
                  onClick={() => setQrModal(null)}
                  className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                  {qrModal.alumno.foto_url ? (
                    <img
                      src={qrModal.alumno.foto_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-black text-xl">
                      {qrModal.alumno.nombre[0]}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-black text-lg leading-tight">
                    {qrModal.alumno.nombre} {qrModal.alumno.apellido}
                  </p>
                  <p className="text-orange-100 text-xs">Válido 2 horas</p>
                </div>
              </div>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl border-4 border-orange-100 mb-4">
                <QRCode
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/recogida/${qrModal.recogida.token}`}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              <p className="text-xs text-gray-400 font-medium text-center leading-relaxed">
                El autorizado escanea, inicia sesión con Google y compartirá su
                ubicación durante el trayecto.
              </p>
              <button
                onClick={() => {
                  setQrModal(null);
                  generarQR(qrModal.alumno);
                }}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors mt-3"
              >
                <RefreshCw size={12} /> Generar nuevo QR
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
