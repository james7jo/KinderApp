"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  MapPin,
  CheckCircle2,
  Loader2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import PantallaRastreo from "./PantallaRastreo";

type Estado =
  | "cargando"
  | "expirado"
  | "ya_escaneado"
  | "finalizado"
  | "login"
  | "autenticando"
  | "permisos"
  | "rastreando";

export default function RecogidaQRPage() {
  const params = useParams();
  const token = params.token as string;
  const supabase = createClient();

  const [estado, setEstado] = useState<Estado>("cargando");
  const [alumno, setAlumno] = useState<any>(null);
  const [recogida, setRecogida] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    verificarToken();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUsuario(session.user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUsuario(session.user);
        setEstado((prev) =>
          prev === "login" || prev === "autenticando" ? "permisos" : prev,
        );
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function verificarToken() {
    const { data, error } = await supabase
      .from("recogidas_qr")
      .select(`*, alumnos(id, nombre, apellido, foto_url, cursos(nombre))`)
      .eq("token", token)
      .single();

    if (error || !data || !data.activo) {
      setEstado("expirado");
      return;
    }
    if (new Date(data.expires_at) < new Date()) {
      setEstado("expirado");
      return;
    }
    if (data.finalizado) {
      setEstado("finalizado");
      setAlumno(data.alumnos);
      return;
    }

    if (data.escaneado_at) {
      const ultimoPing = data.ultimo_ping ? new Date(data.ultimo_ping) : null;
      const segundosSinPing = ultimoPing
        ? (Date.now() - ultimoPing.getTime()) / 1000
        : 999;
      if (segundosSinPing < 60) {
        setEstado("ya_escaneado");
        setAlumno(data.alumnos);
        return;
      }
    }

    setRecogida(data);
    setAlumno(data.alumnos);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      setUsuario(session.user);
      setEstado("permisos");
    } else {
      setEstado("login");
    }
  }

  async function loginGoogle() {
    setEstado("autenticando");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/recogida/${token}`,
        scopes: "email profile",
      },
    });
    if (error) {
      setError("Error al conectar con Google");
      setEstado("login");
    }
  }

  async function activarRastreo() {
    if (!navigator.geolocation) {
      setError("Tu dispositivo no soporta GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const nombre =
          usuario?.user_metadata?.full_name ?? usuario?.email ?? "Desconocido";
        const correo = usuario?.email ?? "";

        await supabase
          .from("recogidas_qr")
          .update({
            nombre_recogedor: nombre,
            correo_recogedor: correo,
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
            escaneado_at: new Date().toISOString(),
            ultimo_ping: new Date().toISOString(),
          })
          .eq("token", token);

        await supabase.from("notificaciones_recogida").insert({
          alumno_id: alumno.id,
          nombre_recogedor: nombre,
          correo_recogedor: correo,
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          recogido_at: new Date().toISOString(),
        });

        const { data: refreshed } = await supabase
          .from("recogidas_qr")
          .select("*")
          .eq("token", token)
          .single();
        if (refreshed) setRecogida(refreshed);
        setEstado("rastreando");
      },
      () =>
        setError(
          "Necesitamos permiso de ubicación. Activá GPS y volvé a intentar.",
        ),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  if (estado === "cargando")
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-nunito">
        <Loader2 size={32} className="text-orange-500 animate-spin" />
      </div>
    );

  if (estado === "expirado")
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-nunito px-6 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-5">
          <AlertCircle size={36} className="text-red-400" />
        </div>
        <h1 className="font-black text-gray-900 text-2xl mb-2">QR expirado</h1>
        <p className="text-gray-400 text-sm max-w-xs">
          Pedile a la maestra que genere uno nuevo.
        </p>
      </div>
    );

  if (estado === "ya_escaneado")
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-nunito px-6 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-5">
          <AlertTriangle size={36} className="text-amber-500" />
        </div>
        <h1 className="font-black text-gray-900 text-2xl mb-2">QR ya activo</h1>
        <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
          Este código ya está siendo usado en otro dispositivo.
        </p>
      </div>
    );

  if (estado === "finalizado")
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-nunito px-6 text-center">
        <div className="w-24 h-24 bg-green-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-green-200">
          <CheckCircle2 size={48} className="text-white" />
        </div>
        <h1 className="font-black text-gray-900 text-2xl mb-2">
          {alumno?.nombre} ya fue entregado
        </h1>
        <p className="text-gray-400 text-sm">Esta recogida ya finalizó.</p>
      </div>
    );

  if (estado === "rastreando" && recogida && alumno) {
    return (
      <PantallaRastreo
        recogidaId={recogida.id}
        token={token}
        alumno={alumno}
        usuario={usuario}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-nunito flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 mb-5 text-white text-center shadow-xl shadow-orange-200">
          {alumno?.foto_url ? (
            <img
              src={alumno.foto_url}
              alt=""
              className="w-20 h-20 rounded-2xl object-cover mx-auto mb-3 border-4 border-white/30"
            />
          ) : (
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-4xl font-black">
                {alumno?.nombre?.[0] ?? "?"}
              </span>
            </div>
          )}
          <h1 className="font-black text-2xl leading-tight">
            {alumno?.nombre} {alumno?.apellido}
          </h1>
          <p className="text-orange-100 text-sm mt-1">
            {alumno?.cursos?.nombre}
          </p>
          <div className="mt-3 bg-white/20 rounded-xl px-4 py-2">
            <p className="text-white text-xs font-bold">Recogida en curso</p>
          </div>
        </div>

        {(estado === "login" || estado === "autenticando") && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">
              Paso 1 — Identificate
            </p>
            <p className="text-sm text-gray-600 text-center mb-5 font-medium leading-relaxed">
              Iniciá sesión con Google para que los papás sepan quién recoge al
              niño
            </p>
            <button
              onClick={loginGoogle}
              disabled={estado === "autenticando"}
              className="w-full bg-white border-2 border-gray-200 hover:border-orange-300 rounded-xl py-3.5 flex items-center justify-center gap-3 transition-all active:scale-95 font-black text-gray-700 hover:text-orange-600 shadow-sm"
            >
              {estado === "autenticando" ? (
                <Loader2 size={20} className="animate-spin text-orange-500" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              {estado === "autenticando"
                ? "Conectando..."
                : "Continuar con Google"}
            </button>
            {error && (
              <p className="text-red-500 text-xs font-bold text-center mt-3">
                {error}
              </p>
            )}
          </div>
        )}

        {estado === "permisos" && usuario && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
              {usuario.user_metadata?.avatar_url && (
                <img
                  src={usuario.user_metadata.avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-black text-green-800 text-sm truncate">
                  {usuario.user_metadata?.full_name ?? usuario.email}
                </p>
                <p className="text-green-600 text-xs truncate">
                  {usuario.email}
                </p>
              </div>
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
            </div>

            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">
              Paso 2 — Activar GPS
            </p>
            <p className="text-sm text-gray-600 text-center mb-5 font-medium leading-relaxed">
              Compartí tu ubicación en tiempo real con los papás durante todo el
              trayecto
            </p>

            <button
              onClick={activarRastreo}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl transition-all active:scale-95 shadow-sm shadow-orange-200 flex items-center justify-center gap-2"
            >
              <MapPin size={18} /> Iniciar rastreo GPS
            </button>
            {error && (
              <p className="text-red-500 text-xs font-bold text-center mt-3">
                {error}
              </p>
            )}
            <p className="text-[10px] text-gray-400 text-center mt-3 font-medium leading-relaxed">
              Mantené esta pantalla abierta durante el trayecto.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
