"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
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
  TrendingUp,
} from "lucide-react";

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
    exact: false,
  },
];

const accesosRapidos = [
  { label: "Bitácora", icon: ClipboardList, slug: "bitacora" },
  { label: "Avisos", icon: Bell, slug: "avisos" },
  { label: "Actividades", icon: Calendar, slug: "actividades" },
  { label: "Alumnos", icon: Users, slug: "alumnos" },
  { label: "Cámaras", icon: Video, slug: "camara" },
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
      <aside className="hidden lg:flex flex-col w-60 bg-white fixed top-0 left-0 h-screen border-r border-gray-100 z-40 font-nunito">
        {/* Brand */}
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

        {/* Nav principal */}
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

        {/* Accesos rápidos al curso */}
        {primerCursoId && (
          <>
            <div className="mx-4 h-px bg-gray-100" />
            <div className="px-3 pt-3 pb-2 flex-1 overflow-y-auto">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest px-3 mb-2">
                Acceso rápido
              </p>
              <ul className="space-y-0.5">
                {accesosRapidos.map(({ label, icon: Icon, slug }) => {
                  const href = `/dashboard/maestra/curso/${primerCursoId}/${slug}`;
                  const active = pathname.startsWith(href);
                  return (
                    <li key={slug}>
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
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}

        {/* Footer usuario */}
        <div className="mx-4 h-px bg-gray-100" />
        <div className="px-3 py-3">
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-sm font-bold w-full group"
          >
            <LogOut
              size={16}
              className="shrink-0 group-hover:scale-110 transition-transform"
            />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── BOTTOM NAV MÓVIL ─────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 font-nunito">
        <div className="mx-3 mb-3 bg-white rounded-2xl shadow-xl border border-gray-100 px-2 py-3">
          <div className="flex items-center justify-around">
            {navMain.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                    active
                      ? "text-orange-500"
                      : "text-gray-300 hover:text-gray-400"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-xl ${active ? "bg-orange-50" : ""}`}
                  >
                    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span className="text-xs font-bold">{label}</span>
                </Link>
              );
            })}
            {/* Accesos rápidos en móvil */}
            {primerCursoId && (
              <>
                <Link
                  href={`/dashboard/maestra/curso/${primerCursoId}/bitacora`}
                  className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                    pathname.includes("/bitacora")
                      ? "text-orange-500"
                      : "text-gray-300"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-xl ${pathname.includes("/bitacora") ? "bg-orange-50" : ""}`}
                  >
                    <ClipboardList
                      size={20}
                      strokeWidth={pathname.includes("/bitacora") ? 2.5 : 2}
                    />
                  </div>
                  <span className="text-xs font-bold">Bitácora</span>
                </Link>
                <Link
                  href={`/dashboard/maestra/curso/${primerCursoId}/avisos`}
                  className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                    pathname.includes("/avisos")
                      ? "text-orange-500"
                      : "text-gray-300"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-xl ${pathname.includes("/avisos") ? "bg-orange-50" : ""}`}
                  >
                    <Bell
                      size={20}
                      strokeWidth={pathname.includes("/avisos") ? 2.5 : 2}
                    />
                  </div>
                  <span className="text-xs font-bold">Avisos</span>
                </Link>
              </>
            )}
            <button
              onClick={logout}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-gray-300 hover:text-red-400 transition-all"
            >
              <div className="p-1.5 rounded-xl">
                <LogOut size={20} strokeWidth={2} />
              </div>
              <span className="text-xs font-bold">Salir</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
