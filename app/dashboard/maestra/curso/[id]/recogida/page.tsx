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
  ShieldCheck,
  ShieldAlert,
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
type PlanRecogida = {
  id: string;
  alumno_id: string;
  token: string;
  activo: boolean;
  estado_aprobacion:
    | "pendiente"
    | "esperando_aprobacion"
    | "aprobado"
    | "rechazado";
  recolector_nombre?: string | null;
  recolector_email?: string | null;
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
  const [planRecogidas, setPlanRecogidas] = useState<PlanRecogida[]>([]);
  const [notifs, setNotifs] = useState<Notificacion[]>([]);
  const [qrModal, setQrModal] = useState<{
    alumno: Alumno;
    recogida: PlanRecogida;
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
          .from("plan_recogida")
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
      setPlanRecogidas(recs ?? []);
      setNotifs(nots ?? []);

      // Si el modal del QR está abierto, actualizamos sus datos en vivo
      if (qrModal) {
        const actualizado = (recs ?? []).find(
          (r) => r.id === qrModal.recogida.id,
        );
        if (actualizado) {
          setQrModal((prev) =>
            prev ? { ...prev, recogida: actualizado } : null,
          );
        }
      }
    },
    [alumnos, qrModal],
  );

  useEffect(() => {
    cargarBase();
  }, [cargarBase]);

  // ESCUCHA EN TIEMPO REAL (REALTIME) DE TU NUEVA TABLA PLAN_RECOGIDA
  useEffect(() => {
    if (alumnos.length === 0) return;
    const ch = supabase
      .channel("plan-recogida-curso-" + cursoId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plan_recogida" },
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

    // Desactivamos cualquier plan previo activo de este alumno
    await supabase
      .from("plan_recogida")
      .update({ activo: false })
      .eq("alumno_id", alumno.id)
      .eq("activo", true);

    // Insertamos el nuevo plan con token único y estado inicial 'pendiente'
    const tokenUnico =
      Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const { data: nueva } = await supabase
      .from("plan_recogida")
      .insert({
        alumno_id: alumno.id,
        maestra_id: user?.id,
        token: tokenUnico,
        activo: true,
        estado_aprobacion: "pendiente",
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
    tipo: "padre" | "madre" | "tutor" | "qr",
    nombreEspecifico?: string,
    relacionEspecifica?: string,
  ) {
    setRegistrando(true);
    const nombre = nombreEspecifico ?? `${tipo} de ${alumno.nombre}`;
    const relacion = relacionEspecifica ?? tipo;

    await supabase.from("notificaciones_recogida").insert({
      alumno_id: alumno.id,
      nombre_recogedor: nombre,
      tipo_entrega: tipo,
      relacion: relacion,
      recogido_at: new Date().toISOString(),
    });

    // Si se concreta por QR, apagamos el plan_recogida ya consumido
    if (tipo === "qr" && qrModal) {
      await supabase
        .from("plan_recogida")
        .update({ activo: false })
        .eq("id", qrModal.recogida.id);
      setQrModal(null);
    }

    setRegistrando(false);
    await cargarEstado();
  }

  const getEntregaHoy = (alumnoId: string) =>
    notifs.find((n) => n.alumno_id === alumnoId);
  const getRecogidaActiva = (alumnoId: string) =>
    planRecogidas.find(
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
        {padre ? (
          <button
            onClick={() =>
              registrarEntregaDirecta(
                alumno,
                "padre",
                padre.full_name,
                padre.relacion,
              )
            }
            disabled={registrando}
            className="w-full bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-2xl p-4 flex items-center gap-3 transition-all text-left"
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

        {madre ? (
          <button
            onClick={() =>
              registrarEntregaDirecta(
                alumno,
                "madre",
                madre.full_name,
                madre.relacion,
              )
            }
            disabled={registrando}
            className="w-full bg-pink-50 hover:bg-pink-100 border border-pink-100 rounded-2xl p-4 flex items-center gap-3 transition-all text-left"
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

        {tutor && (
          <button
            onClick={() =>
              registrarEntregaDirecta(
                alumno,
                "tutor",
                tutor.full_name,
                tutor.relacion,
              )
            }
            disabled={registrando}
            className="w-full bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-2xl p-4 flex items-center gap-3 transition-all text-left"
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
          className="w-full bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-4 flex items-center gap-3 transition-all shadow-sm shadow-orange-200"
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
              Generar QR con Candado GPS
            </p>
          </div>
          <ChevronRight size={16} className="text-white" />
        </button>
      </div>
    );
  }

  return (
    <main className="min-w-0 font-nunito">
      {/* BARRA SUPERIOR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center gap-3 sticky top-0 z-30">
        <Link
          href={`/dashboard/maestra/curso/${cursoId}`}
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center shrink-0"
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
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black ${entregados === total && total > 0 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
        >
          <CheckCircle2 size={12} /> {entregados}/{total}
        </div>
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8 max-w-6xl mx-auto">
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start">
          {/* COLUMNA LISTA ALUMNOS */}
          <div className="lg:col-span-2">
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                <LogOut size={17} className="text-orange-500" />
              </div>
              <p className="text-sm font-bold text-orange-700 leading-relaxed">
                Familiar conocido = un tap. Externo = Generar QR. El menor no
                saldrá hasta que el papá presione "Autorizar".
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
                className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-10 py-3 text-sm font-medium outline-none"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alumnosFiltrados.map((alumno, idx) => {
                const entrega = getEntregaHoy(alumno.id);
                const planActivo = planRecogidas.find(
                  (r) => r.alumno_id === alumno.id && r.activo,
                );
                const yaEntregado = !!entrega;
                const estaSeleccionado = seleccionado?.id === alumno.id;
                const COLORS = [
                  "from-orange-100 to-orange-200 text-orange-500",
                  "from-violet-100 to-violet-200 text-violet-500",
                  "from-sky-100 to-sky-200 text-sky-500",
                ];
                const c = COLORS[idx % COLORS.length].split(" ");

                return (
                  <div
                    key={alumno.id}
                    className={`bg-white rounded-2xl border overflow-hidden transition-all ${estaSeleccionado ? "border-orange-400 ring-2 ring-orange-200" : yaEntregado ? "border-green-200" : "border-gray-100"}`}
                  >
                    <div
                      className={`h-1 ${yaEntregado ? "bg-green-400" : planActivo ? "bg-orange-400" : "bg-gray-100"}`}
                    />
                    <div className="flex items-center gap-3 p-4">
                      <div
                        className={`w-11 h-11 bg-gradient-to-br ${c[0]} ${c[1]} rounded-xl flex items-center justify-center overflow-hidden shrink-0`}
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
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 text-sm">
                          {alumno.nombre} {alumno.apellido}
                        </p>
                        {yaEntregado ? (
                          <p className="text-xs text-green-600 font-bold truncate">
                            ✓ Retirado por {entrega?.nombre_recogedor}
                          </p>
                        ) : planActivo ? (
                          <p className="text-xs text-orange-500 font-bold capitalize">
                            ⚠️ QR:{" "}
                            {planActivo.estado_aprobacion.replace("_", " ")}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 font-medium">
                            En Aula
                          </p>
                        )}
                      </div>

                      {yaEntregado ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : planActivo ? (
                        <button
                          onClick={() =>
                            setQrModal({ alumno, recogida: planActivo })
                          }
                          className="bg-orange-500 text-white text-xs font-black px-3 py-2 rounded-xl"
                        >
                          Ver Estado
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setSeleccionado(estaSeleccionado ? null : alumno)
                          }
                          className="bg-gray-900 text-white text-xs font-black px-3 py-2 rounded-xl"
                        >
                          Entregar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* OPCIONES LATERALES DESKTOP */}
          <div className="hidden lg:block lg:col-span-1">
            {seleccionado ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <h2 className="font-black text-gray-900 text-sm mb-3">
                  Opciones para {seleccionado.nombre}
                </h2>
                <OpcionesEntrega alumno={seleccionado} />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
                <MousePointerClick
                  size={24}
                  className="mx-auto mb-2 text-orange-300"
                />
                <p className="font-bold text-xs">Seleccioná un alumno</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🚨 MODAL DEL QR CON VERIFICACIÓN Y CANDADO DE SEGURIDAD EN VIVO */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-orange-50">
            {/* 🚨 BUSCA ESTE BLOQUE EN EL MODAL 'PENDIENTE' DE LA MAESTRA */}
            {qrModal.recogida.estado_aprobacion === "pendiente" && (
              <>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white flex justify-between items-center">
                  <div>
                    <p className="text-orange-100 text-[9px] font-black uppercase tracking-widest">
                      Escanear en la puerta
                    </p>
                    <h3 className="font-black text-base">
                      {qrModal.alumno.nombre} {qrModal.alumno.apellido}
                    </h3>
                  </div>
                  <button
                    onClick={() => setQrModal(null)}
                    className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="p-6 flex flex-col items-center text-center">
                  <div className="bg-white p-4 rounded-2xl border-4 border-orange-100 mb-4">
                    <QRCode
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/recogida/${qrModal.recogida.token}`}
                      size={180}
                    />
                  </div>
                  <p className="text-xs text-gray-500 font-bold">
                    Esperando que el recolector escanee el código...
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                    Al escanear, el tercero iniciará sesión con Google y le
                    mandará su perfil y GPS al papá.
                  </p>

                  {/* 🛠️ PEGA ESTE BOTÓN AQUÍ ADENTRO: */}
                  <button
                    onClick={() => {
                      // Llama a la función que ya limpia la base de datos y crea un registro nuevo activo
                      generarQR(qrModal.alumno);
                    }}
                    className="mt-4 flex items-center gap-2 text-[11px] font-black text-orange-500 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl transition-all uppercase tracking-wider"
                  >
                    <RefreshCw
                      size={12}
                      className={
                        generando === qrModal.alumno.id ? "animate-spin" : ""
                      }
                    />
                    {generando === qrModal.alumno.id
                      ? "Generando..."
                      : "Generar nuevo QR"}
                  </button>
                </div>
              </>
            )}

            {/* ESTADO 2: ESPERANDO APROBACIÓN (Escaneó y se le mandó alerta al papá) */}
            {qrModal.recogida.estado_aprobacion === "esperando_aprobacion" && (
              <div className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center border border-amber-100 animate-pulse">
                  <Clock size={24} />
                </div>
                <div>
                  <span className="bg-amber-100 text-amber-700 font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Verificando en vivo
                  </span>
                  <h3 className="font-black text-sm text-gray-800 mt-2">
                    ¡QR Escaneado por Tercero!
                  </h3>
                  <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl mt-3 text-left space-y-1">
                    <p className="text-gray-500 font-bold text-[10px]">
                      Identidad de Google Detectada:
                    </p>
                    <p className="text-gray-900 font-black text-xs">
                      {qrModal.recogida.recolector_nombre}
                    </p>
                    <p className="text-gray-400 font-mono text-[9px] truncate">
                      {qrModal.recogida.recolector_email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-amber-600 font-bold text-[11px] bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/50">
                  <Loader2 size={13} className="animate-spin" />
                  <span>
                    Esperando que el Papá presione "Autorizar" en su celular...
                  </span>
                </div>
              </div>
            )}

            {/* ESTADO 3: APROBADO (El papá dio el visto bueno, control físico docente) */}
            {qrModal.recogida.estado_aprobacion === "aprobado" && (
              <div className="p-6 flex flex-col items-center text-center space-y-4 bg-emerald-50/10">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <span className="bg-emerald-500 text-white font-black text-[9px] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    ✓ AUTORIZADO POR EL TUTOR
                  </span>
                  <h3 className="font-black text-base text-gray-900 mt-2">
                    ¡Permiso Concedido!
                  </h3>
                  <p className="text-gray-500 text-[11px] mt-1">
                    El papá autorizó la entrega explícitamente a:
                  </p>

                  <div className="bg-white border border-emerald-100 p-3 rounded-xl mt-3 text-left shadow-xs">
                    <p className="text-[10px] text-gray-400 font-bold">
                      Recolector Oficial:
                    </p>
                    <p className="text-gray-800 font-black text-xs uppercase">
                      {qrModal.recogida.recolector_nombre}
                    </p>
                    <p className="text-gray-400 font-mono text-[9px] mt-0.5">
                      {qrModal.recogida.recolector_email}
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl text-left text-[10px] font-bold leading-normal">
                  📢 **Control Docente Exigido:** Pide el documento físico de
                  identidad (CI) de la persona y confirma que se llame **
                  {qrModal.recogida.recolector_nombre}** antes de soltar al
                  niño.
                </div>

                <button
                  onClick={() =>
                    registrarEntregaDirecta(
                      qrModal.alumno,
                      "qr",
                      qrModal.recogida.recolector_nombre || undefined,
                      "Autorizado por QR",
                    )
                  }
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-black uppercase text-xs tracking-wider transition-all shadow-md"
                >
                  Confirmar Entrega y Activar GPS
                </button>
              </div>
            )}

            {/* ESTADO 4: RECHAZADO (El papá bloqueó el retiro) */}
            {qrModal.recogida.estado_aprobacion === "rechazado" && (
              <div className="p-6 flex flex-col items-center text-center space-y-4 bg-red-50/20">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center border border-red-100">
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <span className="bg-red-600 text-white font-black text-[9px] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    🛑 ACCESO BLOQUEADO
                  </span>
                  <h3 className="font-black text-base text-gray-900 mt-2">
                    Entrega Denegada
                  </h3>
                  <p className="text-gray-500 text-[11px] mt-1">
                    El papá rechazó la solicitud de recogida para esta persona:
                  </p>
                  <p className="text-red-600 font-black text-xs mt-2 uppercase">
                    {qrModal.recogida.recolector_nombre}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-100 text-red-800 p-3 rounded-xl text-xs font-bold leading-normal">
                  ⚠️ **ALERTA:** No entregues al niño bajo ninguna
                  circunstancia. El tutor ha cancelado el permiso desde su
                  sesión.
                </div>
                <button
                  onClick={() => setQrModal(null)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold uppercase transition-all"
                >
                  Cerrar Alerta
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
