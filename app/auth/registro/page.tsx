"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  GraduationCap,
  Building2,
  BookOpen,
  Users,
  ArrowLeft,
  Check,
} from "lucide-react";

type Step = "rol" | "codigo" | "cuenta";

const ROLES = [
  {
    value: "director",
    label: "Director",
    desc: "Administro una institución educativa",
    icon: Building2,
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
    activeBorder: "border-orange-500",
    activeBg: "bg-orange-50",
  },
  {
    value: "maestra",
    label: "Maestra / Maestro",
    desc: "Soy docente de nivel inicial",
    icon: BookOpen,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    activeBorder: "border-blue-500",
    activeBg: "bg-blue-50",
  },
  {
    value: "padre",
    label: "Papá / Mamá",
    desc: "Tengo hijos en el kinder",
    icon: Users,
    color: "text-green-500",
    bg: "bg-green-50",
    border: "border-green-200",
    activeBorder: "border-green-500",
    activeBg: "bg-green-50",
  },
];

export default function RegistroPage() {
  const [step, setStep] = useState<Step>("rol");
  const [rol, setRol] = useState("");
  const [codigo, setCodigo] = useState("");
  const [colegioId, setColegioId] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [invitacionId, setInvitacionId] = useState("");
  const [alumnoInvitadoId, setAlumnoInvitadoId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [relacionInvitado, setRelacionInvitado] = useState("Padre");
  const supabase = createClient();

  const rolActivo = ROLES.find((r) => r.value === rol);

  async function verificarCodigo() {
    setLoading(true);
    setError("");
    if (rol === "director") {
      setStep("cuenta");
      setLoading(false);
      return;
    }
    if (rol === "maestra") {
      const { data, error } = await supabase
        .from("colegios")
        .select("id")
        .eq("codigo_maestra", codigo.trim().toLowerCase())
        .single();
      if (error || !data) {
        setError("Código de colegio incorrecto");
        setLoading(false);
        return;
      }
      setColegioId(data.id);
      setStep("cuenta");
      setLoading(false);
      return;
    }
    if (rol === "padre") {
      const { data: invitacion } = await supabase
        .from("invitaciones_tutor")
        .select("id, alumno_id, alumnos(curso_id, colegio_id)")
        .eq("codigo", codigo.trim().toLowerCase())
        .eq("usado", false)
        .gte("expires_at", new Date().toISOString())
        .single();
      if (invitacion) {
        setColegioId((invitacion.alumnos as any)?.colegio_id);
        setCursoId((invitacion.alumnos as any)?.curso_id);
        setInvitacionId(invitacion.id);
        setAlumnoInvitadoId(invitacion.alumno_id);
        setStep("cuenta");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("cursos")
        .select("id, colegio_id")
        .eq("codigo", codigo.trim().toLowerCase())
        .single();
      if (error || !data) {
        setError("Código incorrecto");
        setLoading(false);
        return;
      }
      setCursoId(data.id);
      setColegioId(data.colegio_id);
      setStep("cuenta");
      setLoading(false);
      return;
    }
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError || !authData.user) {
      setError(authError?.message || "Error al crear la cuenta");
      setLoading(false);
      return;
    }
    await supabase.auth.signInWithPassword({ email, password });
    const { error: fnError } = await supabase.rpc("handle_new_director", {
      user_id: authData.user.id,
      nombre_director: fullName,
      rol,
      colegio_id_param: colegioId || null,
    });
    if (fnError) {
      setError("Error: " + JSON.stringify(fnError));
      setLoading(false);
      return;
    }
    if (invitacionId && alumnoInvitadoId) {
      await supabase.from("tutores").insert({
        user_id: authData.user.id,
        alumno_id: alumnoInvitadoId,
        full_name: fullName,
        relacion: relacionInvitado.toLowerCase(),
        es_principal: false,
      });
      await supabase
        .from("invitaciones_tutor")
        .update({ usado: true })
        .eq("id", invitacionId);
    }
    await new Promise((r) => setTimeout(r, 800));
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();
    if (!profile) {
      setError("Error: no se pudo crear el perfil");
      setLoading(false);
      return;
    }
    if (profile.role === "director")
      window.location.replace("/dashboard/director");
    else if (profile.role === "maestra")
      window.location.replace("/dashboard/maestra");
    else if (profile.role === "padre")
      window.location.replace("/dashboard/padre");
  }

  return (
    <main className="min-h-screen font-nunito bg-[#0F172A]">
      <div className="hidden lg:flex min-h-screen">
        {/* LEFT — mismo que login */}
        <div className="w-[45%] flex flex-col p-14 relative overflow-hidden bg-[#0F172A]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center gap-3 mb-16">
            <div className="w-11 h-11 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <GraduationCap
                size={24}
                className="text-white"
                strokeWidth={2.5}
              />
            </div>
            <div>
              <p className="text-white font-black text-xl">KinderApp</p>
              <p className="text-gray-500 text-xs">
                Sistema de gestión educativa
              </p>
            </div>
          </div>
          <div className="relative z-10 mb-8">
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              Creá tu cuenta
              <br />
              <span className="text-orange-400">en minutos</span>
            </h1>
            <p className="text-gray-400 text-base leading-relaxed">
              Registrate como director, maestra o padre y accedé a todas las
              funcionalidades del sistema.
            </p>
          </div>
          <div className="relative z-10 flex flex-col gap-4">
            {ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.value}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4"
                >
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{r.label}</p>
                    <p className="text-gray-500 text-xs">{r.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Form desktop */}
        <div className="flex-1 flex items-center justify-center p-16 bg-gray-50 overflow-y-auto">
          <div className="w-full max-w-sm py-8">
            {/* Steps */}
            <div className="flex items-center gap-2 mb-8">
              {["rol", "codigo", "cuenta"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      step === s
                        ? "bg-orange-500 text-white"
                        : ["rol", "codigo", "cuenta"].indexOf(step) > i
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {["rol", "codigo", "cuenta"].indexOf(step) > i ? (
                      <Check size={14} />
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < 2 && (
                    <div
                      className={`h-0.5 w-10 rounded-full ${
                        ["rol", "codigo", "cuenta"].indexOf(step) > i
                          ? "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-black text-gray-900 mb-1">
              {step === "rol" && "¿Cuál es tu rol?"}
              {step === "codigo" && "Ingresá tu código"}
              {step === "cuenta" && "Completá tus datos"}
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {step === "rol" && "Seleccioná cómo vas a usar KinderApp"}
              {step === "codigo" &&
                (rol === "maestra"
                  ? "Pedile el código al director"
                  : "Pedile el código a la maestra")}
              {step === "cuenta" && "Solo faltan tus datos personales"}
            </p>

            {/* PASO 1 */}
            {step === "rol" && (
              <div className="flex flex-col gap-3">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isActive = rol === r.value;
                  return (
                    <button
                      key={r.value}
                      onClick={() => setRol(r.value)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left bg-white shadow-sm ${
                        isActive
                          ? `${r.activeBorder} ${r.activeBg}`
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 ${r.bg} rounded-xl flex items-center justify-center shrink-0`}
                      >
                        <Icon size={20} className={r.color} />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-gray-900 text-sm">
                          {r.label}
                        </p>
                        <p className="text-gray-400 text-xs">{r.desc}</p>
                      </div>
                      {isActive && (
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    rol === "director" ? setStep("cuenta") : setStep("codigo")
                  }
                  disabled={!rol}
                  className="mt-2 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-200"
                >
                  Continuar →
                </button>
              </div>
            )}

            {/* PASO 2 */}
            {step === "codigo" && (
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Ej: ab3f92c1"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-4 text-lg outline-none focus:ring-2 focus:ring-orange-400 text-center tracking-widest font-mono font-black uppercase bg-white shadow-sm"
                />
                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full" />
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}
                <button
                  onClick={verificarCodigo}
                  disabled={!codigo || loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-orange-200"
                >
                  {loading ? "Verificando..." : "Verificar código →"}
                </button>
                <button
                  onClick={() => setStep("rol")}
                  className="flex items-center justify-center gap-2 text-gray-400 text-sm font-bold"
                >
                  <ArrowLeft size={16} /> Volver
                </button>
              </div>
            )}

            {/* PASO 3 */}
            {step === "cuenta" && (
              <form onSubmit={handleRegistro} className="flex flex-col gap-4">
                {invitacionId && (
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                      Tu relación
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        "Padre",
                        "Madre",
                        "Abuelo/a",
                        "Tutor legal",
                        "Tío/a",
                        "Otro",
                      ].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRelacionInvitado(r)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all ${relacionInvitado === r ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="tucorreo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white shadow-sm"
                    required
                    minLength={6}
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full" />
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-orange-200"
                >
                  {loading ? "Creando cuenta..." : "Crear cuenta →"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    rol === "director" ? setStep("rol") : setStep("codigo")
                  }
                  className="flex items-center justify-center gap-2 text-gray-400 text-sm font-bold"
                >
                  <ArrowLeft size={16} /> Volver
                </button>
              </form>
            )}

            <p className="text-center text-gray-400 text-sm mt-6">
              ¿Ya tenés cuenta?{" "}
              <a href="/auth/login" className="text-orange-500 font-black">
                Ingresar
              </a>
            </p>
          </div>
        </div>
      </div>
      <div className="min-h-screen flex flex-col">
        {/* Header oscuro */}
        <div className="bg-[#0F172A] px-6 pt-10 pb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <GraduationCap
                size={22}
                className="text-white"
                strokeWidth={2.5}
              />
            </div>
            <div>
              <p className="text-white font-black text-lg">KinderApp</p>
              <p className="text-gray-500 text-xs">
                Sistema de gestión educativa
              </p>
            </div>
          </div>

          <div className="relative z-10">
            {/* Steps indicator */}
            <div className="flex items-center gap-2 mb-4">
              {["rol", "codigo", "cuenta"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      step === s
                        ? "bg-orange-500 text-white"
                        : ["rol", "codigo", "cuenta"].indexOf(step) > i
                          ? "bg-green-500 text-white"
                          : "bg-white/10 text-gray-500"
                    }`}
                  >
                    {["rol", "codigo", "cuenta"].indexOf(step) > i ? (
                      <Check size={14} />
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < 2 && (
                    <div
                      className={`h-0.5 w-8 rounded-full transition-all ${
                        ["rol", "codigo", "cuenta"].indexOf(step) > i
                          ? "bg-green-500"
                          : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <h1 className="text-2xl font-black text-white mb-1">
              {step === "rol" && "¿Cuál es tu rol?"}
              {step === "codigo" && "Ingresá tu código"}
              {step === "cuenta" && "Creá tu cuenta"}
            </h1>
            <p className="text-gray-400 text-sm">
              {step === "rol" && "Seleccioná cómo vas a usar KinderApp"}
              {step === "codigo" &&
                (rol === "maestra"
                  ? "Pedile el código al director"
                  : "Pedile el código a la maestra")}
              {step === "cuenta" && "Completá tus datos personales"}
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 bg-gray-50 px-6 pt-8 pb-10">
          {/* PASO 1 — ROL */}
          {step === "rol" && (
            <div className="flex flex-col gap-3 max-w-lg mx-auto">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isActive = rol === r.value;
                return (
                  <button
                    key={r.value}
                    onClick={() => setRol(r.value)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left bg-white shadow-sm ${
                      isActive
                        ? `${r.activeBorder} ${r.activeBg}`
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 ${r.bg} rounded-2xl flex items-center justify-center shrink-0`}
                    >
                      <Icon size={22} className={r.color} />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-gray-900">{r.label}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{r.desc}</p>
                    </div>
                    {isActive && (
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}

              <button
                onClick={() =>
                  rol === "director" ? setStep("cuenta") : setStep("codigo")
                }
                disabled={!rol}
                className="mt-2 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-200"
              >
                Continuar →
              </button>
            </div>
          )}

          {/* PASO 2 — CÓDIGO */}
          {step === "codigo" && (
            <div className="max-w-lg mx-auto">
              <div
                className={`${rolActivo?.bg} border ${rolActivo?.border} rounded-2xl p-4 mb-5 flex items-center gap-3`}
              >
                <div
                  className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0`}
                >
                  {rolActivo && (
                    <rolActivo.icon size={20} className={rolActivo.color} />
                  )}
                </div>
                <div>
                  <p className="font-black text-gray-800 text-sm">
                    {rolActivo?.label}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {rol === "maestra"
                      ? "Código del colegio"
                      : "Código del aula o invitación"}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Ej: ab3f92c1"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-4 text-lg outline-none focus:ring-2 focus:ring-orange-400 text-center tracking-widest font-mono font-black uppercase"
                />

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full shrink-0" />
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}

                <button
                  onClick={verificarCodigo}
                  disabled={!codigo || loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-200"
                >
                  {loading ? "Verificando..." : "Verificar código →"}
                </button>
              </div>

              <button
                onClick={() => setStep("rol")}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm font-bold mt-5 mx-auto"
              >
                <ArrowLeft size={16} /> Volver
              </button>
            </div>
          )}

          {/* PASO 3 — CUENTA */}
          {step === "cuenta" && (
            <div className="max-w-lg mx-auto">
              <div
                className={`${rolActivo?.bg} border ${rolActivo?.border} rounded-2xl p-4 mb-5 flex items-center gap-3`}
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                  {rolActivo && (
                    <rolActivo.icon size={20} className={rolActivo.color} />
                  )}
                </div>
                <div>
                  <p className="font-black text-gray-800 text-sm">
                    {rolActivo?.label}
                  </p>
                  <p className="text-gray-500 text-xs">Completá tus datos</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <form onSubmit={handleRegistro} className="flex flex-col gap-4">
                  {invitacionId && (
                    <div>
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                        Tu relación con el niño
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          "Padre",
                          "Madre",
                          "Abuelo/a",
                          "Tutor legal",
                          "Tío/a",
                          "Otro",
                        ].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRelacionInvitado(r)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all ${
                              relacionInvitado === r
                                ? "bg-orange-500 text-white"
                                : "bg-gray-50 text-gray-500 hover:bg-orange-50"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      placeholder="Tu nombre completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="tucorreo@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 font-medium"
                      required
                      minLength={6}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full shrink-0" />
                      <p className="text-red-600 text-sm font-medium">
                        {error}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-200 mt-1"
                  >
                    {loading ? "Creando cuenta..." : "Crear cuenta →"}
                  </button>
                </form>
              </div>

              <button
                onClick={() =>
                  rol === "director" ? setStep("rol") : setStep("codigo")
                }
                className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm font-bold mt-5 mx-auto"
              >
                <ArrowLeft size={16} /> Volver
              </button>
            </div>
          )}

          <p className="text-center text-gray-400 text-sm mt-8">
            ¿Ya tenés cuenta?{" "}
            <a
              href="/auth/login"
              className="text-orange-500 font-black hover:text-orange-600"
            >
              Ingresar
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
