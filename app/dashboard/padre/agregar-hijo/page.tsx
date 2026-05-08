"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  UserPlus,
  Loader2,
} from "lucide-react";

export default function AgregarHijoPage() {
  const [codigo, setCodigo] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [colegioId, setColegioId] = useState("");
  const [cursoNombre, setCursoNombre] = useState("");
  const [codigoVerificado, setCodigoVerificado] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [fechaNac, setFechaNac] = useState("");
  const [genero, setGenero] = useState("");
  const [relacion, setRelacion] = useState("padre");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function verificarCodigo() {
    if (!codigo.trim()) return;
    setVerificando(true);
    setErrorCodigo("");
    const { data, error } = await supabase
      .from("cursos")
      .select("id, nombre, colegio_id")
      .eq("codigo", codigo.trim().toLowerCase())
      .single();
    setVerificando(false);
    if (error || !data) {
      setErrorCodigo("Código incorrecto. Verificá con la maestra.");
      return;
    }
    setCursoId(data.id);
    setColegioId(data.colegio_id);
    setCursoNombre(data.nombre);
    setCodigoVerificado(true);
  }

  async function handleAgregar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: alumno, error: alumnoError } = await supabase
      .from("alumnos")
      .insert({
        nombre,
        apellido,
        fecha_nacimiento: fechaNac || null,
        genero: genero || null,
        curso_id: cursoId,
        colegio_id: colegioId,
      })
      .select("id")
      .single();
    if (alumnoError || !alumno) {
      setError("Error al crear el perfil del alumno");
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const { error: tutorError } = await supabase.from("tutores").insert({
      user_id: user.id,
      alumno_id: alumno.id,
      full_name: profile?.full_name ?? "",
      relacion,
      es_principal: true,
    });
    if (tutorError) {
      setError("Error al vincular el tutor");
      setLoading(false);
      return;
    }
    router.push("/dashboard/padre");
    router.refresh();
  }

  return (
    <main className="min-w-0 min-h-screen bg-gray-50 font-nunito">
      <div className="bg-white border-b border-gray-100 px-4 lg:px-7 py-3.5 flex items-center gap-3 sticky top-0 z-30">
        <Link
          href="/dashboard/padre"
          className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            Padre / Madre
          </p>
          <h1 className="text-lg font-black text-gray-900 leading-tight">
            Agregar hijo
          </h1>
        </div>
      </div>

      <div className="px-4 lg:px-7 pt-6 pb-12">
        <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-5 lg:gap-8">
          {/* COLUMNA IZQUIERDA — solo PC */}
          <div className="hidden lg:flex lg:col-span-2 flex-col justify-start pt-2">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-7 text-white sticky top-24">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-5">
                <UserPlus size={28} className="text-white" />
              </div>
              <h2 className="font-black text-2xl leading-tight mb-3">
                Registrá a tu hijo en el kinder
              </h2>
              <p className="text-orange-100 text-sm leading-relaxed mb-6">
                Con el código del aula podés vincular a tu hijo y seguir su día
                a día desde la app.
              </p>
              <div className="space-y-3">
                {[
                  "Pedile el código a la maestra",
                  "Ingresá los datos de tu hijo",
                  "¡Listo! Ya podés ver su bitácora diaria",
                ].map((paso, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-white">
                        {i + 1}
                      </span>
                    </div>
                    <p className="text-orange-100 text-sm font-medium">
                      {paso}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA — formulario */}
          <div className="lg:col-span-3 space-y-4">
            {/* CÓDIGO */}
            <div
              className={`bg-white rounded-2xl border overflow-hidden transition-all ${codigoVerificado ? "border-green-200" : "border-gray-100"}`}
            >
              <div
                className={`px-5 py-4 flex items-center gap-3 border-b ${codigoVerificado ? "border-green-100 bg-green-50" : "border-gray-50"}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${codigoVerificado ? "bg-green-500" : "bg-orange-50"}`}
                >
                  {codigoVerificado ? (
                    <CheckCircle2 size={18} className="text-white" />
                  ) : (
                    <KeyRound size={17} className="text-orange-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-black text-gray-900 text-sm">
                    {codigoVerificado
                      ? `Aula verificada: ${cursoNombre}`
                      : "Código del aula"}
                  </p>
                  <p
                    className={`text-xs font-medium ${codigoVerificado ? "text-green-600" : "text-gray-400"}`}
                  >
                    {codigoVerificado
                      ? "¡Listo! Completá los datos abajo"
                      : "Pedile el código a la maestra"}
                  </p>
                </div>
                {codigoVerificado && (
                  <button
                    onClick={() => {
                      setCodigoVerificado(false);
                      setCodigo("");
                      setErrorCodigo("");
                    }}
                    className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    Cambiar
                  </button>
                )}
              </div>
              {!codigoVerificado && (
                <div className="px-5 py-4 flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Ingresá el código del aula"
                    value={codigo}
                    onChange={(e) => {
                      setCodigo(e.target.value);
                      setErrorCodigo("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && verificarCodigo()}
                    className={`w-full border rounded-xl px-4 py-3.5 text-base font-mono font-bold outline-none focus:ring-2 focus:ring-orange-400 text-center tracking-[0.2em] uppercase transition-all ${errorCodigo ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                    autoFocus
                  />
                  {errorCodigo && (
                    <p className="text-red-500 text-sm font-bold text-center">
                      ⚠️ {errorCodigo}
                    </p>
                  )}
                  <button
                    onClick={verificarCodigo}
                    disabled={!codigo.trim() || verificando}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {verificando ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />{" "}
                        Verificando...
                      </>
                    ) : (
                      "Verificar código →"
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* FORMULARIO — aparece al verificar */}
            {codigoVerificado && (
              <form onSubmit={handleAgregar} className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    Datos del niño
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        placeholder="Juan"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-400"
                        required
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        placeholder="Pérez"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-400"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Fecha de nacimiento
                    </label>
                    <input
                      type="date"
                      value={fechaNac}
                      onChange={(e) => setFechaNac(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Género
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "masculino", label: "Niño" },
                      { value: "femenino", label: "Niña" },
                      { value: "otro", label: "Otro" },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setGenero(value)}
                        className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border-2 transition-all active:scale-95 ${genero === value ? "border-orange-400 bg-orange-50" : "border-gray-100 hover:border-orange-200"}`}
                      >
                        <span
                          className={`text-xs font-black ${genero === value ? "text-orange-600" : "text-gray-500"}`}
                        >
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Tu relación con el niño
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "padre", label: "Padre" },
                      { value: "madre", label: "Madre" },
                      { value: "tutor legal", label: "Tutor" },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRelacion(value)}
                        className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border-2 transition-all active:scale-95 ${relacion === value ? "border-orange-400 bg-orange-50" : "border-gray-100 hover:border-orange-200"}`}
                      >
                        <span
                          className={`text-xs font-black ${relacion === value ? "text-orange-600" : "text-gray-500"}`}
                        >
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-red-600 text-sm font-bold">⚠️ {error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-4 rounded-xl transition-all active:scale-95 shadow-sm shadow-orange-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />{" "}
                      Guardando...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} /> Agregar a {nombre || "mi hijo"}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
