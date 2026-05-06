"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Eye,
  EyeOff,
  Shield,
  Camera,
  MapPin,
  ClipboardList,
  Bell,
  TrendingUp,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const features = [
    { icon: Camera, label: "Cámaras en vivo", desc: "Monitoreo 24/7" },
    {
      icon: MapPin,
      label: "GPS en tiempo real",
      desc: "Ubicación instantánea",
    },
    {
      icon: ClipboardList,
      label: "Bitácora diaria",
      desc: "Reporte por alumno",
    },
    { icon: Bell, label: "Avisos y alertas", desc: "Comunicación directa" },
    { icon: Shield, label: "Control de acceso", desc: "Seguridad total" },
    { icon: TrendingUp, label: "Predicción IA", desc: "Regresión lineal" },
  ];

  return (
    <main className="min-h-screen font-nunito bg-[#0F172A]">
      {/* DESKTOP */}
      <div className="hidden lg:flex min-h-screen">
        <div className="w-[55%] flex flex-col p-14 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

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

          <div className="relative z-10 mb-12">
            <h1 className="text-5xl font-black text-white leading-tight mb-4">
              Gestión educativa
              <br />
              <span className="text-orange-400">inteligente</span>
              <br />
              para nivel inicial
            </h1>
            <p className="text-gray-400 text-base leading-relaxed max-w-md">
              Plataforma integral que conecta directores, maestras y padres con
              monitoreo GPS, cámaras en vivo y comunicación en tiempo real.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3 mb-8">
            {[
              { value: "3", label: "Roles" },
              { value: "GPS", label: "Tiempo real" },
              { value: "24/7", label: "Monitoreo" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center"
              >
                <p className="text-orange-400 font-black text-2xl">{s.value}</p>
                <p className="text-gray-500 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 hover:border-orange-500/30 transition-all"
                >
                  <div className="w-8 h-8 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-xs">{f.label}</p>
                    <p className="text-gray-500 text-xs">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-16 bg-gray-50">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-gray-900 mb-2">
                Bienvenido
              </h2>
              <p className="text-gray-400 text-sm font-medium">
                Ingresá con tu cuenta para continuar
              </p>
            </div>
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="tucorreo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-200 mt-1"
              >
                {loading ? "Ingresando..." : "Ingresar al sistema →"}
              </button>
            </form>
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-400 text-sm">
                ¿No tenés cuenta?{" "}
                <a
                  href="/auth/registro"
                  className="text-orange-500 font-black hover:text-orange-600"
                >
                  Registrarse
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MÓVIL */}
      <div className="lg:hidden min-h-screen flex flex-col">
        <div className="bg-[#0F172A] px-6 pt-10 pb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-2 mb-8 relative z-10">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <p className="text-white font-black text-lg">KinderApp</p>
          </div>
          <div className="relative z-10 mb-6">
            <h1 className="text-3xl font-black text-white leading-tight mb-2">
              Gestión educativa
              <br />
              <span className="text-orange-400">inteligente</span>
            </h1>
            <p className="text-gray-400 text-sm">
              Para directores, maestras y padres
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 relative z-10 mb-6">
            {[
              { value: "3", label: "Roles" },
              { value: "GPS", label: "Tiempo real" },
              { value: "24/7", label: "Monitoreo" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"
              >
                <p className="text-orange-400 font-black text-xl">{s.value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 relative z-10 -mx-2 px-2">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 shrink-0"
                >
                  <Icon size={14} className="text-orange-400" />
                  <span className="text-white text-xs font-bold whitespace-nowrap">
                    {f.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 bg-gray-50 px-6 pt-8 pb-10">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-gray-900 mb-1">
              Iniciar sesión
            </h2>
            <p className="text-gray-400 text-sm">
              Ingresá con tu cuenta para continuar
            </p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                Email
              </label>
              <input
                type="email"
                placeholder="tucorreo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-200 mt-1"
            >
              {loading ? "Ingresando..." : "Ingresar al sistema →"}
            </button>
          </form>
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              ¿No tenés cuenta?{" "}
              <a
                href="/auth/registro"
                className="text-orange-500 font-black hover:text-orange-600 transition-colors"
              >
                Registrarse
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
