"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Clock,
  UserPlus,
  Users,
  Phone,
  Trash2,
  X,
} from "lucide-react";

type Invitacion = {
  id: string;
  codigo: string;
  usado: boolean;
  expires_at: string;
  created_at: string;
};

type Tutor = {
  id: string;
  full_name: string;
  relacion: string;
  telefono: string | null;
  es_principal: boolean;
};

export default function TutoresPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [alumnoNombre, setAlumnoNombre] = useState("");
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState("");
  const [success, setSuccess] = useState("");

  const cargar = useCallback(async () => {
    const [{ data: alumno }, { data: t }, { data: inv }] = await Promise.all([
      supabase.from("alumnos").select("nombre, apellido").eq("id", id).single(),
      supabase.from("tutores").select("*").eq("alumno_id", id),
      supabase
        .from("invitaciones_tutor")
        .select("*")
        .eq("alumno_id", id)
        .eq("usado", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }),
    ]);
    setAlumnoNombre(`${alumno?.nombre} ${alumno?.apellido}`);
    setTutores(t ?? []);
    setInvitaciones(inv ?? []);
  }, [id]);

  useEffect(() => {
    if (id) cargar();
  }, [id, cargar]);

  async function generarInvitacion() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("invitaciones_tutor")
      .insert({ alumno_id: id, creado_por: user.id })
      .select("*")
      .single();
    if (data) {
      setSuccess("Código generado — válido por 48 horas");
      setTimeout(() => setSuccess(""), 4000);
    }
    await cargar();
    setLoading(false);
  }

  async function copiarCodigo(codigo: string) {
    await navigator.clipboard.writeText(codigo);
    setCopiado(codigo);
    setTimeout(() => setCopiado(""), 2000);
  }

  async function eliminarInvitacion(invId: string) {
    await supabase.from("invitaciones_tutor").delete().eq("id", invId);
    await cargar();
  }

  return (
    <main className="min-w-0 font-nunito">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center gap-3 sticky top-0 z-30">
        <Link
          href={`/dashboard/padre/hijo/${id}`}
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate">
            {alumnoNombre}
          </p>
          <h1 className="text-lg font-black text-gray-900 leading-tight">
            Tutores responsables
          </h1>
        </div>
        <span className="text-xs font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full shrink-0">
          {tutores.length} tutor{tutores.length !== 1 ? "es" : ""}
        </span>
      </div>

      <div className="px-4 lg:px-7 pt-5 pb-8">
        <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-2 lg:gap-6 space-y-5 lg:space-y-0">
          {/* ── COLUMNA IZQUIERDA — Tutores actuales ── */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Tutores registrados ({tutores.length})
            </p>

            {tutores.length > 0 ? (
              <div className="space-y-3">
                {tutores.map((t) => (
                  <div
                    key={t.id}
                    className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                      t.es_principal ? "border-orange-200" : "border-gray-100"
                    }`}
                  >
                    <div
                      className={`h-1 ${t.es_principal ? "bg-orange-500" : "bg-blue-300"}`}
                    />
                    <div className="flex items-center gap-3 p-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          t.es_principal
                            ? "bg-orange-500 shadow-sm shadow-orange-200"
                            : "bg-blue-50"
                        }`}
                      >
                        <span
                          className={`font-black text-lg ${t.es_principal ? "text-white" : "text-blue-500"}`}
                        >
                          {t.full_name[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-gray-900 text-sm">
                            {t.full_name}
                          </p>
                          {t.es_principal && (
                            <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs capitalize mt-0.5">
                          {t.relacion}
                        </p>
                      </div>
                      {t.telefono && (
                        <a
                          href={`tel:${t.telefono}`}
                          className="w-9 h-9 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center justify-center transition-all shrink-0"
                        >
                          <Phone size={15} className="text-blue-500" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 py-10 text-center px-4">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users size={24} className="text-blue-300" />
                </div>
                <p className="font-black text-gray-700">Sin tutores aún</p>
              </div>
            )}

            {/* Info sobre la relación */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">
                Sobre la relación
              </p>
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                La relación (Padre, Madre, Tutor legal) se define cuando cada
                persona crea su cuenta y agrega al niño. Si la relación no es
                correcta, la persona debe editar su perfil.
              </p>
            </div>
          </div>

          {/* ── COLUMNA DERECHA — Invitaciones ── */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Invitar a otro tutor
            </p>

            {/* Card de invitación */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                  <UserPlus size={20} className="text-white" />
                </div>
                <h2 className="font-black text-white text-lg leading-tight mb-1">
                  Invitar a otro tutor
                </h2>
                <p className="text-orange-100 text-sm leading-relaxed">
                  Generá un código único. La otra persona elige su relación
                  (Padre, Madre, etc.) al registrarse y se vincula
                  automáticamente a {alumnoNombre || "tu hijo"}.
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-xs font-medium text-gray-500">
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-green-500 shrink-0" />
                    El código funciona solo una vez y expira en 48h
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-green-500 shrink-0" />
                    La persona elige su relación al registrarse (Madre, Padre,
                    etc.)
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-green-500 shrink-0" />
                    Al usarse queda inválido automáticamente
                  </div>
                </div>

                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
                    <Check size={14} className="text-green-500 shrink-0" />
                    <p className="text-green-600 text-sm font-bold">
                      {success}
                    </p>
                  </div>
                )}

                <button
                  onClick={generarInvitacion}
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-3.5 rounded-xl transition-all active:scale-95 shadow-sm shadow-orange-200 flex items-center justify-center gap-2"
                >
                  <UserPlus size={17} />
                  {loading ? "Generando..." : "Generar código de invitación"}
                </button>
              </div>
            </div>

            {/* Códigos activos */}
            {invitaciones.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Códigos activos ({invitaciones.length})
                </p>
                <div className="space-y-3">
                  {invitaciones.map((inv) => {
                    const expira = new Date(inv.expires_at).toLocaleDateString(
                      "es-BO",
                      {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    );
                    return (
                      <div
                        key={inv.id}
                        className="bg-white rounded-2xl border border-orange-200 overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-orange-100 bg-orange-50/50">
                          <div className="flex items-center gap-2">
                            <Clock size={13} className="text-orange-400" />
                            <p className="text-xs font-bold text-orange-600">
                              Expira: {expira}
                            </p>
                          </div>
                          <button
                            onClick={() => eliminarInvitacion(inv.id)}
                            className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-500 transition-colors"
                          >
                            <X size={12} /> Cancelar
                          </button>
                        </div>
                        <div className="p-4">
                          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between">
                            <p className="font-mono font-black text-2xl text-orange-600 tracking-[0.3em]">
                              {inv.codigo.toUpperCase()}
                            </p>
                            <button
                              onClick={() => copiarCodigo(inv.codigo)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                                copiado === inv.codigo
                                  ? "bg-green-500"
                                  : "bg-orange-500 hover:bg-orange-600"
                              }`}
                            >
                              {copiado === inv.codigo ? (
                                <Check size={16} className="text-white" />
                              ) : (
                                <Copy size={16} className="text-white" />
                              )}
                            </button>
                          </div>
                          <p className="text-center text-xs text-gray-400 font-medium mt-2">
                            Compartí este código — solo funciona una vez
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
