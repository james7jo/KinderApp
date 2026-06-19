"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Bell,
  LogOut,
  GraduationCap,
  ChevronRight,
  Calendar,
  Users,
  Video,
  Menu,
  X,
  Users2,
  QrCode,
  ClipboardCheck,
  TrendingUp,
  Calculator,
} from "lucide-react";

// Navegación estática raíz
const navMain = [
  {
    href: "/dashboard/maestra",
    label: "Inicio",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/maestra/curso",
    label: "Mis Cursos",
    icon: BookOpen,
    exact: true,
  },
];

// TODAS LAS NUEVAS OPCIONES DE
const accesosRapidos = [
  { label: "Lista de Alumnos", icon: Users, slug: "alumnos" },
  { label: "Bitácora Diaria", icon: ClipboardList, slug: "bitacora" },
  { label: "Licencias y Permisos", icon: ClipboardCheck, slug: "licencias" },
  { label: "Avisos de Aula", icon: Bell, slug: "avisos" },
  { label: "Actividades", icon: Calendar, slug: "actividades" },
  { label: "Cámaras en Vivo", icon: Video, slug: "camara" },
  { label: "Mesa Directiva", icon: Users2, slug: "mesa-directiva" },
  { label: "Recogida QR", icon: QrCode, slug: "recogida" },
  { label: "Evaluaciones", icon: BookOpen, slug: "evaluacion-cosmos" },
  { label: "Planificación Anual (PAT)", icon: Calendar, slug: "planificacion" },
  { label: "Tendencias y Gráficos", icon: TrendingUp, slug: "regresiones" },
  { label: "Cierre Trimestral", icon: Calculator, slug: "cierre-trimestral" },
];

export default function NavbarMaestra({
  colegio,
  nombreMaestra,
  primerCursoId,
}: {
  colegio?: string;
  nombreMaestra?: string;
  primerCursoId?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const isActive = (href: string, exact: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  const initials = (nombreMaestra ?? "M")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* ── SIDEBAR DESKTOP ──────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 bg-white fixed top-0 left-0 h-screen border-r border-r-gray-100 z-40 font-nunito">
        <div className="px-5 pt-6 pb-5 border-b border-gray-100">
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
                Maestra
              </span>
            </div>
          </div>
        </div>

        {/* Links principales */}
        <nav className="px-3 pt-4 pb-2">
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest px-3 mb-2">
            Principal
          </p>
          <ul className="space-y-0.5">
            {navMain.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${
                      active
                        ? "bg-orange-50 text-orange-600"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-orange-500 rounded-r-full" />
                    )}
                    <Icon
                      size={17}
                      className={`shrink-0 ${active ? "text-orange-500" : "group-hover:scale-110 transition-transform"}`}
                    />
                    <span className="flex-1">{label}</span>
                    <ChevronRight
                      size={13}
                      className={`shrink-0 transition-opacity ${active ? "text-orange-400 opacity-100" : "text-gray-200 opacity-0 group-hover:opacity-100"}`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 🚀 BLOQUE COMPLETO DE GESTIÓN ACADÉMICA DEL CURSO */}
        {primerCursoId && (
          <>
            <div className="mx-4 h-px bg-gray-100" />
            <div className="px-3 pt-3 pb-2 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest px-3 mb-2">
                Gestión del Curso Activo
              </p>
              <ul className="space-y-0.5">
                {accesosRapidos.map(({ label, icon: Icon, slug }) => {
                  const href = `/dashboard/maestra/curso/${primerCursoId}/${slug}`;
                  const active = pathname.startsWith(href);
                  return (
                    <li key={slug}>
                      <Link
                        href={href}
                        className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all group ${
                          active
                            ? "bg-orange-50 text-orange-600"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-orange-500 rounded-r-full" />
                        )}
                        <Icon
                          size={15}
                          className={`shrink-0 ${active ? "text-orange-500" : "text-gray-400 group-hover:scale-110 transition-transform"}`}
                        />
                        <span className="flex-1 truncate">{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}

        {/* Perfil inferior */}
        <div className="mx-4 h-px bg-gray-100" />
        <div className="px-3 py-3 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-orange-200">
              <span className="text-white text-[11px] font-black">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-gray-900 truncate leading-tight">
                {nombreMaestra ?? "Maestra"}
              </p>
              <p className="text-[10px] text-gray-400 font-medium">Docente</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-xs font-bold w-full group"
          >
            <LogOut
              size={15}
              className="shrink-0 group-hover:scale-110 transition-transform"
            />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── DRAWER MÓVIL ────────────────────────────────────────── */}
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
                    {nombreMaestra ?? "Maestra"}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Docente
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

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest px-3 mb-2">
                Principal
              </p>
              <ul className="space-y-0.5 mb-4">
                {navMain.map(({ href, label, icon: Icon, exact }) => {
                  const active = isActive(href, exact);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setMenuAbierto(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          active
                            ? "bg-orange-50 text-orange-600"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <Icon
                          size={18}
                          className={
                            active ? "text-orange-500" : "text-gray-400"
                          }
                        />
                        <span className="flex-1">{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {primerCursoId && (
                <>
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest px-3 mb-2">
                    Gestión del Curso Activo
                  </p>
                  <ul className="space-y-0.5">
                    {accesosRapidos.map(({ label, icon: Icon, slug }) => {
                      const href = `/dashboard/maestra/curso/${primerCursoId}/${slug}`;
                      const active = pathname.startsWith(href);
                      return (
                        <li key={slug}>
                          <Link
                            href={href}
                            onClick={() => setMenuAbierto(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                              active
                                ? "bg-orange-50 text-orange-600"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <Icon
                              size={16}
                              className={
                                active ? "text-orange-500" : "text-gray-400"
                              }
                            />
                            <span className="flex-1 truncate">{label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>

            <div className="px-3 py-3 border-t border-gray-100">
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

      {/* ── BOTTOM NAV MÓVIL ────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 font-nunito">
        <div className="mx-3 mb-3 bg-white rounded-2xl shadow-xl border border-gray-100 px-2 py-2">
          <div className="flex items-center justify-around">
            <Link
              href="/dashboard/maestra"
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                isActive("/dashboard/maestra", true)
                  ? "text-orange-500"
                  : "text-gray-300"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl ${isActive("/dashboard/maestra", true) ? "bg-orange-50" : ""}`}
              >
                <LayoutDashboard
                  size={18}
                  strokeWidth={isActive("/dashboard/maestra", true) ? 2.5 : 2}
                />
              </div>
              <span className="text-[9px] font-bold">Inicio</span>
            </Link>

            <Link
              href="/dashboard/maestra/curso"
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                pathname.includes("/curso")
                  ? "text-orange-500"
                  : "text-gray-300"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl ${pathname.includes("/curso") ? "bg-orange-50" : ""}`}
              >
                <BookOpen
                  size={18}
                  strokeWidth={pathname.includes("/curso") ? 2.5 : 2}
                />
              </div>
              <span className="text-[9px] font-bold">Cursos</span>
            </Link>

            {primerCursoId && (
              <Link
                href={`/dashboard/maestra/curso/${primerCursoId}/bitacora`}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                  pathname.includes("/bitacora")
                    ? "text-orange-500"
                    : "text-gray-300"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl ${pathname.includes("/bitacora") ? "bg-orange-50" : ""}`}
                >
                  <ClipboardList
                    size={18}
                    strokeWidth={pathname.includes("/bitacora") ? 2.5 : 2}
                  />
                </div>
                <span className="text-[9px] font-bold">Bitácora</span>
              </Link>
            )}

            <button
              onClick={() => setMenuAbierto(true)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-gray-300 hover:text-orange-400 transition-all"
            >
              <div className="p-1.5 rounded-xl">
                <Menu size={18} strokeWidth={2} />
              </div>
              <span className="text-[9px] font-bold">Más</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
