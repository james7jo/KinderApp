"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  MapPin,
  CheckCircle2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import PantallaRastreo from "./PantallaRastreo";

type Estado =
  | "cargando"
  | "expirado"
  | "ya_escaneado"
  | "finalizado"
  | "login"
  | "autenticando"
  | "esperando_papa" // Nuevo estado del candado
  | "rechazado_papa" // Nuevo estado de denegación
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

  const verificarToken = useCallback(async () => {
    const { data, error } = await supabase
      .from("plan_recogida")
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

    if (data.estado_aprobacion === "rechazado") {
      setEstado("rechazado_papa");
      return;
    }

    if (data.estado_aprobacion === "aprobado" && data.escaneado_at) {
      setRecogida(data);
      setAlumno(data.alumnos);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUsuario(session.user);
        setEstado(data.finalizado ? "finalizado" : "rastreando");
      } else {
        setEstado("login");
      }
      return;
    }

    setRecogida(data);
    setAlumno(data.alumnos);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      setUsuario(session.user);
      if (data.estado_aprobacion === "esperando_aprobacion") {
        setEstado("esperando_papa");
      } else {
        setEstado("permisos");
      }
    } else {
      setEstado("login");
    }
  }, [token, supabase]);

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
  }, [verificarToken, supabase.auth]);

  // ESCUCHA EN TIEMPO REAL CORRECTA PARA EL RECOLECTOR
  useEffect(() => {
    if (!recogida?.id) return;

    const ch = supabase
      .channel("recolector-espera-" + recogida.id)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "plan_recogida",
          filter: "id=eq." + recogida.id,
        },
        (payload: any) => {
          const actualizado = payload.new;
          setRecogida(actualizado);

          if (actualizado.estado_aprobacion === "aprobado") {
            setEstado("rastreando");
          } else if (actualizado.estado_aprobacion === "rechazado") {
            setEstado("rechazado_papa");
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [recogida?.id, supabase]);

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
          .from("plan_recogida")
          .update({
            recolector_nombre: nombre,
            recolector_email: correo,
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
            escaneado_at: new Date().toISOString(),
            estado_aprobacion: "esperando_aprobacion",
          })
          .eq("token", token);

        setEstado("esperando_papa");
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
        <h1 className="font-black text-gray-900 text-2xl mb-2">
          QR inválido o expirado
        </h1>
        <p className="text-gray-400 text-sm max-w-xs">
          Pedile a la maestra que genere un código nuevo en la puerta.
        </p>
      </div>
    );

  if (estado === "esperando_papa")
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-500 to-orange-600 flex flex-col items-center justify-center font-nunito px-6 text-center text-white">
        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-5 border border-white/20 animate-pulse">
          <Loader2 size={36} className="text-white animate-spin" />
        </div>
        <span className="bg-white/20 text-white font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
          Esperando Confirmación
        </span>
        <h1 className="font-black text-2xl mt-4 mb-2">
          Solicitud Enviada al Tutor
        </h1>
        <p className="text-orange-100 text-xs max-w-xs leading-relaxed">
          Tus datos de Google y GPS inicial fueron enviados al teléfono del
          papá. Mantené esta pantalla abierta hasta que autorice tu salida del
          Kínder.
        </p>
      </div>
    );

  if (estado === "rechazado_papa")
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-nunito px-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mb-5 border border-red-200">
          <XCircle size={40} className="text-red-600" />
        </div>
        <h1 className="font-black text-gray-900 text-xl mb-1">
          Retiro Denegado
        </h1>
        <p className="text-red-600 font-bold text-xs uppercase tracking-wider mb-3">
          Acceso Bloqueado por Seguridad
        </p>
        <p className="text-gray-400 text-xs max-w-xs leading-relaxed">
          El tutor legal del alumno ha cancelado este permission de recogida.
          Por favor, comunícate directamente con los padres o la dirección
          escolar.
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
        </div>

        {(estado === "login" || estado === "autenticando") && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">
              Paso 1 — Identificate
            </p>
            <p className="text-xs text-gray-500 text-center mb-5 font-medium leading-relaxed">
              Iniciá sesión con Google para enviar una solicitud formal de
              retiro al panel del tutor legal.
            </p>
            <button
              onClick={loginGoogle}
              disabled={estado === "autenticando"}
              className="w-full bg-white border-2 border-gray-200 hover:border-orange-300 rounded-xl py-3.5 flex items-center justify-center gap-3 font-black text-gray-700 text-xs uppercase"
            >
              {estado === "autenticando" ? (
                <Loader2 size={16} className="animate-spin text-orange-500" />
              ) : (
                "Continuar con Google"
              )}
            </button>
          </div>
        )}

        {estado === "permisos" && usuario && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
              <div className="flex-1 min-w-0">
                <p className="font-black text-green-800 text-xs truncate">
                  {usuario.user_metadata?.full_name ?? usuario.email}
                </p>
                <p className="text-green-600 text-[10px] truncate">
                  {usuario.email}
                </p>
              </div>
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">
              Paso 2 — Validar Candado GPS
            </p>
            <p className="text-xs text-gray-500 text-center mb-5 font-medium leading-relaxed">
              Compartí tu ubicación inicial. No podrás retirar al niño hasta que
              el papá apruebe la entrega desde su terminal.
            </p>
            <button
              onClick={activarRastreo}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-md shadow-orange-200"
            >
              <MapPin size={16} /> Solicitar Autorización y Vincular GPS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
