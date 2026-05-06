"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Clock, UserPlus } from "lucide-react";

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

  const cargarData = useCallback(async () => {
    const { data: alumno } = await supabase
      .from("alumnos")
      .select("nombre, apellido")
      .eq("id", id)
      .single();
    setAlumnoNombre(`${alumno?.nombre} ${alumno?.apellido}`);

    const { data: t } = await supabase
      .from("tutores")
      .select("*")
      .eq("alumno_id", id);
    setTutores(t ?? []);

    const { data: inv } = await supabase
      .from("invitaciones_tutor")
      .select("*")
      .eq("alumno_id", id)
      .eq("usado", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    setInvitaciones(inv ?? []);
  }, [id]);

  useEffect(() => {
    if (id) cargarData();
  }, [id, cargarData]);

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
      setSuccess("✅ Código generado — válido por 48 horas");
      setTimeout(() => setSuccess(""), 4000);
    }
    await cargarData();
    setLoading(false);
  }

  async function copiarCodigo(codigo: string) {
    await navigator.clipboard.writeText(codigo);
    setCopiado(codigo);
    setTimeout(() => setCopiado(""), 2000);
  }

  async function eliminarInvitacion(invId: string) {
    await supabase.from("invitaciones_tutor").delete().eq("id", invId);
    await cargarData();
  }

  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-30 flex items-center gap-4">
        <Link
          href={`/dashboard/padre/hijo/${id}`}
          className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-bold">{alumnoNombre}</p>
          <h1 className="text-lg font-black text-gray-900">
            Tutores responsables
          </h1>
        </div>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto">
        {/* Tutores actuales */}
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
          Tutores ({tutores.length})
        </h2>
        <div className="flex flex-col gap-3 mb-7">
          {tutores.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${t.es_principal ? "bg-orange-500" : "bg-blue-50"}`}
              >
                <span
                  className={`font-black text-sm ${t.es_principal ? "text-white" : "text-blue-500"}`}
                >
                  {t.full_name[0]}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-sm">{t.full_name}</p>
                <p className="text-gray-400 text-xs capitalize">{t.relacion}</p>
              </div>
              {t.es_principal && (
                <span className="text-xs font-bold bg-orange-50 text-orange-500 px-2 py-1 rounded-lg">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Generar invitación */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus size={18} className="text-orange-500" />
            <h2 className="font-black text-gray-900">
              Invitar a mamá / otro tutor
            </h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Generá un código único de un solo uso. La otra persona lo usa al
            registrarse y verá automáticamente a {alumnoNombre}.
          </p>

          {success && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-4">
              <p className="text-green-600 text-sm font-bold">{success}</p>
            </div>
          )}

          <button
            onClick={generarInvitacion}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <UserPlus size={18} />
            {loading ? "Generando..." : "Generar código de invitación"}
          </button>
        </div>

        {/* Invitaciones activas */}
        {invitaciones.length > 0 && (
          <>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
              Códigos activos
            </h2>
            <div className="flex flex-col gap-3">
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
                    className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-orange-400" />
                        <p className="text-xs text-orange-500 font-bold">
                          Expira: {expira}
                        </p>
                      </div>
                      <button
                        onClick={() => eliminarInvitacion(inv.id)}
                        className="text-xs text-red-400 font-bold hover:text-red-500"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-3 flex items-center justify-between">
                      <p className="font-mono font-black text-xl text-orange-600 tracking-widest">
                        {inv.codigo}
                      </p>
                      <button
                        onClick={() => copiarCodigo(inv.codigo)}
                        className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center transition-all active:scale-95"
                      >
                        {copiado === inv.codigo ? (
                          <Check size={16} className="text-white" />
                        ) : (
                          <Copy size={16} className="text-white" />
                        )}
                      </button>
                    </div>

                    <p className="text-gray-400 text-xs mt-2 text-center">
                      Compartí este código — solo funciona una vez
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
