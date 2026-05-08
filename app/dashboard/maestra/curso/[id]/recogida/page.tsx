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
  MapPin,
  X,
  Loader2,
  User,
} from "lucide-react";
import QRCode from "react-qr-code";

type Alumno = {
  id: string;
  nombre: string;
  apellido: string;
  foto_url?: string | null;
};
type Recogida = {
  id: string;
  alumno_id: string;
  token: string;
  activo: boolean;
  nombre_recogedor?: string;
  correo_recogedor?: string;
  latitud?: number;
  longitud?: number;
  escaneado_at?: string;
  expires_at: string;
};

export default function RecogidaMaestraPage() {
  const params = useParams();
  const cursoId = params.id as string;
  const supabase = createClient();

  const [cursoNombre, setCursoNombre] = useState("");
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [recogidas, setRecogidas] = useState<Recogida[]>([]);
  const [qrModal, setQrModal] = useState<{
    alumno: Alumno;
    recogida: Recogida;
  } | null>(null);
  const [generando, setGenerando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
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

    // Recogidas activas de hoy
    const today = new Date().toISOString().split("T")[0];
    const { data: recs } = await supabase
      .from("recogidas_qr")
      .select("*")
      .in(
        "alumno_id",
        (alus ?? []).map((a) => a.id),
      )
      .gte("created_at", today + "T00:00:00")
      .order("created_at", { ascending: false });
    setRecogidas(recs ?? []);
  }, [cursoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Realtime — cuando alguien escanea, actualiza automáticamente
  useEffect(() => {
    const channel = supabase
      .channel("recogidas")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "recogidas_qr" },
        () => cargar(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [cargar]);

  async function generarQR(alumno: Alumno) {
    setGenerando(alumno.id);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Desactivar QRs anteriores del alumno
    await supabase
      .from("recogidas_qr")
      .update({ activo: false })
      .eq("alumno_id", alumno.id)
      .eq("activo", true);

    // Crear nuevo
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
    await cargar();

    if (nueva) {
      setQrModal({ alumno, recogida: nueva });
    }
  }

  const getRecogida = (alumnoId: string) =>
    recogidas.find((r) => r.alumno_id === alumnoId && r.activo);

  const recogidos = recogidas.filter((r) => r.escaneado_at).length;
  const totalAlumnos = alumnos.length;

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
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            {cursoNombre}
          </p>
          <h1 className="text-lg font-black text-gray-900 leading-tight">
            Recogida QR
          </h1>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black ${
            recogidos === totalAlumnos && totalAlumnos > 0
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          <CheckCircle2 size={12} />
          {recogidos}/{totalAlumnos}
        </div>
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8 max-w-3xl mx-auto">
        {/* Info */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
            <QrCode size={17} className="text-orange-500" />
          </div>
          <p className="text-sm font-bold text-orange-700 leading-relaxed">
            Tocá el botón QR de cada alumno. El autorizado escanea con su
            celular, inicia sesión con Google y confirma la recogida. Los papás
            reciben una notificación automática.
          </p>
        </div>

        {/* Lista de alumnos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {alumnos.map((alumno, idx) => {
            const recogida = getRecogida(alumno.id);
            const yaRecogido = !!recogida?.escaneado_at;
            const tieneQR = !!recogida && !recogida.escaneado_at;

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
                  yaRecogido ? "border-green-200" : "border-gray-100"
                }`}
              >
                <div
                  className={`h-1 ${yaRecogido ? "bg-green-400" : tieneQR ? "bg-orange-400" : "bg-gray-100"}`}
                />
                <div className="flex items-center gap-3 p-4">
                  {/* Avatar */}
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
                    {yaRecogido ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2
                          size={11}
                          className="text-green-500 shrink-0"
                        />
                        <p className="text-xs text-green-600 font-bold truncate">
                          {recogida?.nombre_recogedor ?? "Recogido"}
                        </p>
                      </div>
                    ) : tieneQR ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock size={11} className="text-orange-400 shrink-0" />
                        <p className="text-xs text-orange-500 font-bold">
                          QR activo
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        Sin QR
                      </p>
                    )}
                  </div>

                  {/* Botón acción */}
                  {yaRecogido ? (
                    <div className="flex items-center gap-2 shrink-0">
                      {recogida?.latitud && (
                        <a
                          href={`https://maps.google.com/?q=${recogida.latitud},${recogida.longitud}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center"
                        >
                          <MapPin size={15} className="text-green-500" />
                        </a>
                      )}
                      <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                        <CheckCircle2 size={15} className="text-green-500" />
                      </div>
                    </div>
                  ) : tieneQR ? (
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
                      onClick={() => generarQR(alumno)}
                      disabled={generando === alumno.id}
                      className="flex items-center gap-1.5 bg-gray-900 hover:bg-orange-600 text-white text-xs font-black px-3 py-2 rounded-xl transition-all active:scale-95 shrink-0 disabled:opacity-40"
                    >
                      {generando === alumno.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <QrCode size={14} />
                      )}
                      QR
                    </button>
                  )}
                </div>

                {/* Detalle si fue recogido */}
                {yaRecogido && recogida?.correo_recogedor && (
                  <div className="px-4 pb-3">
                    <div className="bg-green-50 rounded-xl px-3 py-2 flex items-center gap-2">
                      <User size={11} className="text-green-500 shrink-0" />
                      <p className="text-[11px] text-green-700 font-medium truncate">
                        {recogida.correo_recogedor}
                      </p>
                      {recogida.escaneado_at && (
                        <span className="text-[10px] text-green-500 font-black ml-auto shrink-0">
                          {new Date(recogida.escaneado_at).toLocaleTimeString(
                            "es-BO",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL QR */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
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

            {/* QR */}
            <div className="p-6 flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl border-4 border-orange-100 mb-4">
                <QRCode
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/recogida/${qrModal.recogida.token}`}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              <p className="text-xs text-gray-400 font-medium text-center leading-relaxed">
                El autorizado escanea este QR con su celular, inicia sesión con
                Google y confirma la recogida. Los papás reciben una
                notificación.
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
