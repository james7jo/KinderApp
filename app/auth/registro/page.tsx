"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Step = "rol" | "codigo" | "cuenta";

const ROLES = [
  {
    value: "director",
    label: "Director",
    emoji: "🏫",
    desc: "Administro un colegio",
  },
  {
    value: "maestra",
    label: "Maestra / Maestro",
    emoji: "👩‍🏫",
    desc: "Soy docente",
  },
  {
    value: "padre",
    label: "Papá / Mamá",
    emoji: "👨‍👩‍👧",
    desc: "Tengo hijos en el kinder",
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
  const supabase = createClient();
  const [relacionInvitado, setRelacionInvitado] = useState("Madre");

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
      // Primero verificar si es código de invitación
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

      // Si no es invitación, verificar código de curso normal
      const { data, error } = await supabase
        .from("cursos")
        .select("id, colegio_id")
        .eq("codigo", codigo.trim().toLowerCase())
        .single();

      if (error || !data) {
        setError("Código de aula incorrecto");
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
      rol: rol,
      colegio_id_param: colegioId || null,
    });

    if (fnError) {
      setError("Error: " + JSON.stringify(fnError));
      setLoading(false);
      return;
    }

    // Si viene de invitación, vincular al alumno y marcar como usada
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

    await new Promise((resolve) => setTimeout(resolve, 800));

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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏫</div>
          <h1 className="text-2xl font-bold text-gray-800">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === "rol" && "Seleccioná tu rol"}
            {step === "codigo" && "Ingresá el código que te dieron"}
            {step === "cuenta" && "Completá tus datos"}
          </p>
        </div>

        {/* PASO 1 — ROL */}
        {step === "rol" && (
          <div className="flex flex-col gap-3">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRol(r.value)}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  rol === r.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <span className="text-3xl">{r.emoji}</span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {r.label}
                  </p>
                  <p className="text-gray-500 text-xs">{r.desc}</p>
                </div>
              </button>
            ))}
            <button
              onClick={() =>
                rol === "director" ? setStep("cuenta") : setStep("codigo")
              }
              disabled={!rol}
              className="mt-2 w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 active:scale-95 transition-all"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* PASO 2 — CÓDIGO */}
        {step === "codigo" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              {rol === "maestra"
                ? "🔑 Pedile el código del colegio al director"
                : "🔑 Pedile el código del aula a la maestra o el código de invitación"}
            </p>
            <input
              type="text"
              placeholder="Ej: ab3f92c1"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest font-mono uppercase"
            />
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <button
              onClick={verificarCodigo}
              disabled={!codigo || loading}
              className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 active:scale-95 transition-all"
            >
              {loading ? "Verificando..." : "Verificar código"}
            </button>
            <button
              onClick={() => setStep("rol")}
              className="text-sm text-gray-400 hover:text-gray-600 text-center"
            >
              ← Volver
            </button>
          </div>
        )}

        {/* PASO 3 — CUENTA */}
        {step === "cuenta" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <form onSubmit={handleRegistro} className="flex flex-col gap-4">
              {invitacionId && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Tu relación con el niño
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Madre", "Abuelo/a", "Tutor legal", "Tío/a", "Otro"].map(
                      (r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRelacionInvitado(r)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all ${
                            relacionInvitado === r
                              ? "bg-blue-600 text-white"
                              : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          {r}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Nombre completo
                </label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="tucorreo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Contraseña
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 active:scale-95 transition-all"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </form>
            <button
              onClick={() =>
                rol === "director" ? setStep("rol") : setStep("codigo")
              }
              className="text-sm text-gray-400 hover:text-gray-600 text-center w-full mt-4"
            >
              ← Volver
            </button>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tenés cuenta?{" "}
          <a
            href="/auth/login"
            className="text-blue-600 font-medium hover:underline"
          >
            Ingresar
          </a>
        </p>
      </div>
    </main>
  );
}
