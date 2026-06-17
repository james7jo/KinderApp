"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Home,
  Bell,
  LogOut,
  GraduationCap,
  ChevronRight,
  ClipboardList,
  Calendar,
  MapPin,
  Plus,
  Users,
  ChevronDown,
  ChevronUp,
  Activity,
  ClipboardCheck,
  Menu, // 🔥 Importamos los íconos de control para el Drawer móvil
  X,
} from "lucide-react";
import { useState } from "react";

type Hijo = {
  id: string;
  nombre: string;
  apellido: string;
  foto_url?: string | null;
  cursoId?: string;
  cursoNombre?: string;
  relacion?: string;
};

const GRADIENTS = [
  "from-orange-400 to-orange-500",
  "from-violet-400 to-violet-500",
  "from-sky-400 to-sky-500",
  "from-emerald-400 to-emerald-500",
];

export default function NavbarPadre({
  nombrePadre,
  colegio,
  hijos = [],
}: {
  nombrePadre?: string;
  colegio?: string;
  hijos?: Hijo[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [menuAbierto, setMenuAbierto] = useState(false); // 🔥 Estado para controlar el Drawer en móvil
  const [hijoExpandido, setHijoExpandido] = useState<string | null>(
    hijos.length === 1 ? hijos[0].id : null,
  );

  const isActive = (href: string, exact = false) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  const initials = (nombrePadre ?? "P")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const hijoModulos = (hijoId: string) => [
    { href: `/dashboard/padre/hijo/${hijoId}`, label: "Perfil", icon: Users },
    {
      href: `/dashboard/padre/hijo/${hijoId}/bitacora`,
      label: "Bitácora",
      icon: ClipboardList,
    },
    {
      href: `/dashboard/padre/hijo/${hijoId}/licencias`,
      label: "Pedir Licencia",
      icon: ClipboardCheck,
    },
    {
      href: `/dashboard/padre/hijo/${hijoId}/actividades`,
      label: "Actividades",
      icon: Calendar,
    },
    {
      href: `/dashboard/padre/hijo/${hijoId}/gps`,
      label: "GPS en vivo",
      icon: MapPin,
    },
    {
      href: `/dashboard/padre/hijo/${hijoId}/holograma`,
      label: "Mapa Corporal",
      icon: Activity,
    },
  ];

  // 📦 RENDERIZADO COMPLETO DEL MENÚ DE HIJOS (Reutilizable para Sidebar y Drawer)
  const renderSeccionHijos = (callbackCerrarMenu = false) => (
    <>
      <div className="pt-2 pb-1 px-3">
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
          Mis hijos
        </p>
      </div>

      {hijos.length > 0 ? (
        hijos.map((hijo, idx) => {
          const grad = GRADIENTS[idx % GRADIENTS.length];
          const estaExpandido = hijoExpandido === hijo.id;
          const enEsteHijo = pathname.includes(hijo.id);

          return (
            <div key={hijo.id}>
              <button
                onClick={() => setHijoExpandido(estaExpandido ? null : hijo.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                  enEsteHijo ? "bg-orange-50" : "hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-8 h-8 bg-gradient-to-br ${grad} rounded-xl flex items-center justify-center shrink-0 overflow-hidden`}
                >
                  {hijo.foto_url ? (
                    <img
                      src={hijo.foto_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-xs font-black">
                      {hijo.nombre[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-black truncate leading-tight ${enEsteHijo ? "text-orange-600" : "text-gray-700"}`}
                  >
                    {hijo.nombre}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium truncate">
                    {hijo.cursoNombre ?? "Sin curso"}
                  </p>
                </div>
                {estaExpandido ? (
                  <ChevronUp size={13} className="text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown size={13} className="text-gray-300 shrink-0" />
                )}
              </button>

              {estaExpandido && (
                <div className="ml-4 pl-3 border-l-2 border-orange-100 mt-0.5 mb-1 space-y-0.5">
                  {hijoModulos(hijo.id).map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() =>
                        callbackCerrarMenu && setMenuAbierto(false)
                      }
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive(href)
                          ? "bg-orange-500 text-white"
                          : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
                      }`}
                    >
                      <Icon size={14} className="shrink-0" />
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <Link
          href="/dashboard/padre/agregar-hijo"
          onClick={() => callbackCerrarMenu && setMenuAbierto(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition-all border-2 border-dashed border-gray-100 hover:border-orange-200"
        >
          <Plus size={16} className="shrink-0" />
          Agregar hijo
        </Link>
      )}

      {hijos.length > 0 && (
        <Link
          href="/dashboard/padre/agregar-hijo"
          onClick={() => callbackCerrarMenu && setMenuAbierto(false)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all mt-1"
        >
          <Plus size={13} className="shrink-0" />
          Agregar otro hijo
        </Link>
      )}
    </>
  );

  return (
    <>
      {/* ── 1. SIDEBAR DESKTOP (Fijo en pantallas grandes) ──────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white fixed top-0 left-0 h-screen border-r border-gray-100 z-40 font-nunito">
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-11 h-11 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                <GraduationCap
                  size={22}
                  className="text-white"
                  strokeWidth={2.5}
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-gray-900 text-sm leading-tight truncate">
                {colegio ?? "KinderApp"}
              </p>
              <span className="inline-block bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full mt-1">
                Familia
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 pt-3 overflow-y-auto space-y-0.5 pb-2 custom-scrollbar">
          <Link
            href="/dashboard/padre"
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${isActive("/dashboard/padre", true) ? "bg-orange-50 text-orange-600" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
          >
            {isActive("/dashboard/padre", true) && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-orange-500 rounded-r-full" />
            )}
            <Home size={16} className="shrink-0" />
            <span className="flex-1">Inicio</span>
          </Link>

          <Link
            href="/dashboard/padre/avisos"
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${isActive("/dashboard/padre/avisos") ? "bg-orange-50 text-orange-600" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
          >
            {isActive("/dashboard/padre/avisos") && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-orange-500 rounded-r-full" />
            )}
            <Bell size={16} className="shrink-0" />
            <span className="flex-1">Avisos</span>
          </Link>

          {renderSeccionHijos(false)}
        </nav>

        <div className="px-3 py-3 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-orange-200">
              <span className="text-white text-[11px] font-black">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-gray-900 truncate leading-tight">
                {nombrePadre ?? "Padre"}
              </p>
              <p className="text-[10px] text-gray-400 font-medium">Familia</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-xs font-bold w-full group"
          >
            <LogOut
              size={16}
              className="shrink-0 group-hover:scale-110 transition-transform"
            />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── 2. DRAWER DESPLEGABLE MÓVIL (Se activa al pulsar "Más") ────────────────────────────────────────── */}
      {menuAbierto && (
        <div className="lg:hidden fixed inset-0 z-50 font-nunito">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMenuAbierto(false)}
          />
          <div
            className="absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col"
            style={{ animation: "slideIn 0.2s ease-out" }}
          >
            <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-black">
                    {initials}
                  </span>
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm leading-tight">
                    {nombrePadre ?? "Padre"}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Familia
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMenuAbierto(false)}
                className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
              {renderSeccionHijos(true)}
            </div>

            <div className="px-3 py-3 border-t border-gray-100 shrink-0">
              <button
                onClick={logout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all text-sm font-bold w-full"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. BOTTOM NAV MÓVIL (Barra fija inferior para celulares) ────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 font-nunito">
        <div className="mx-3 mb-3 bg-white rounded-2xl shadow-xl border border-gray-100 px-1 py-2">
          <div className="flex items-center justify-around">
            {/* Inicio */}
            <Link
              href="/dashboard/padre"
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${isActive("/dashboard/padre", true) ? "text-orange-500" : "text-gray-300"}`}
            >
              <div
                className={`p-1.5 rounded-xl ${isActive("/dashboard/padre", true) ? "bg-orange-50" : ""}`}
              >
                <Home
                  size={20}
                  strokeWidth={isActive("/dashboard/padre", true) ? 2.5 : 2}
                />
              </div>
              <span className="text-[10px] font-bold">Inicio</span>
            </Link>

            {/* Avisos Generales */}
            <Link
              href="/dashboard/padre/avisos"
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${isActive("/dashboard/padre/avisos") ? "text-orange-500" : "text-gray-300"}`}
            >
              <div
                className={`p-1.5 rounded-xl ${isActive("/dashboard/padre/avisos") ? "bg-orange-50" : ""}`}
              >
                <Bell
                  size={20}
                  strokeWidth={isActive("/dashboard/padre/avisos") ? 2.5 : 2}
                />
              </div>
              <span className="text-[10px] font-bold">Avisos</span>
            </Link>

            {/* Acceso Rápido al Perfil del primer hijo (Si tiene) */}
            {hijos.length > 0 && (
              <Link
                href={`/dashboard/padre/hijo/${hijos[0].id}`}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${pathname.includes(`/hijo/${hijos[0].id}`) && !pathname.includes("/bitacora") ? "text-orange-500" : "text-gray-300"}`}
              >
                <div
                  className={`p-1 rounded-xl overflow-hidden ${pathname.includes(`/hijo/${hijos[0].id}`) && !pathname.includes("/bitacora") ? "ring-2 ring-orange-400" : ""}`}
                >
                  {hijos[0].foto_url ? (
                    <img
                      src={hijos[0].foto_url}
                      alt=""
                      className="w-6 h-6 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className={`w-6 h-6 rounded-lg bg-gradient-to-br ${GRADIENTS[0]} flex items-center justify-center`}
                    >
                      <span className="text-white text-[10px] font-black">
                        {hijos[0].nombre[0]}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold">Hijo</span>
              </Link>
            )}

            {/* 🔥 BOTÓN MÁGICO "MÁS": Desplaza el Drawer con todas las subcarpetas de los hijos */}
            <button
              onClick={() => setMenuAbierto(true)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${menuAbierto ? "text-orange-500" : "text-gray-300"}`}
            >
              <div
                className={`p-1.5 rounded-xl ${menuAbierto ? "bg-orange-50" : ""}`}
              >
                <Menu size={20} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold">Más</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
