"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Video,
  LogOut,
  GraduationCap,
  MapPin,
  Phone,
  ChevronRight,
  TrendingUp,
  Settings,
} from "lucide-react";

type Colegio = {
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
};

type Props = {
  colegio: Colegio | null;
  userName?: string | null;
};

const navItems = [
  {
    href: "/dashboard/director",
    label: "Inicio",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/director/cursos",
    label: "Cursos",
    icon: BookOpen,
    exact: false,
  },
  {
    href: "/dashboard/director/maestras",
    label: "Maestras",
    icon: Users,
    exact: false,
  },
  {
    href: "/dashboard/director/camaras",
    label: "Cámaras",
    icon: Video,
    exact: false,
  },
];

const toolItems = [
  {
    href: "/dashboard/director/gps",
    label: "GPS en vivo",
    icon: MapPin,
    badge: null,
  },
  {
    href: "/dashboard/director/prediccion",
    label: "Predicción",
    icon: TrendingUp,
    badge: "Beta",
  },
];

export default function SidebarDirector({ colegio, userName }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isActive = (href: string, exact: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  const handleLogout = async () => {
    try {
      // 1. Cerramos sesión en Supabase (limpia localStorage/Auth)
      await supabase.auth.signOut();

      // 2. Forzamos un refresco total hacia el login
      // Esto es más seguro que router.push en el sidebar de PC
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Fallback por si falla el logout programático
      window.location.reload();
    }
  };

  // Iniciales del colegio para el avatar
  const initials = (colegio?.nombre ?? "K")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white fixed top-0 left-0 h-screen border-r border-gray-100 z-40 font-nunito">
      {/* ── BRAND ─────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="relative shrink-0">
            <div className="w-11 h-11 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
              <GraduationCap
                size={22}
                className="text-white"
                strokeWidth={2.5}
              />
            </div>
            {/* Dot online */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
          </div>

          {/* Nombre */}
          <div className="min-w-0 flex-1">
            <p className="font-black text-gray-900 text-sm leading-tight truncate">
              {colegio?.nombre ?? "KinderApp"}
            </p>
            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full mt-1">
              Director
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gray-100" />

      {/* ── NAV PRINCIPAL ─────────────────────────────────────────── */}
      <nav className="flex-1 px-3 pt-4 overflow-y-auto">
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest px-3 mb-2">
          Principal
        </p>

        <ul className="space-y-0.5 mb-5">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`
                    relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold
                    transition-all duration-150 group
                    ${
                      active
                        ? "bg-orange-50 text-orange-600"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                >
                  {/* Barra activa */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-orange-500 rounded-r-full" />
                  )}

                  <Icon
                    size={17}
                    className={`shrink-0 transition-transform duration-150
                      ${active ? "text-orange-500" : "group-hover:scale-110"}
                    `}
                  />
                  <span className="flex-1">{label}</span>

                  {active ? (
                    <ChevronRight
                      size={13}
                      className="text-orange-400 shrink-0"
                    />
                  ) : (
                    <ChevronRight
                      size={13}
                      className="text-gray-200 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ── HERRAMIENTAS ─────────────────────────────────────────── */}
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest px-3 mb-2">
          Herramientas
        </p>

        <ul className="space-y-0.5">
          {toolItems.map(({ href, label, icon: Icon, badge }) => {
            const active = isActive(href, false);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`
                    relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold
                    transition-all duration-150 group
                    ${
                      active
                        ? "bg-orange-50 text-orange-600"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-orange-500 rounded-r-full" />
                  )}
                  <Icon
                    size={17}
                    className={`shrink-0 transition-transform duration-150 ${active ? "text-orange-500" : "group-hover:scale-110"}`}
                  />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="text-[9px] font-black bg-orange-100 text-orange-500 px-1.5 py-0.5 rounded-md shrink-0">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── INFO COLEGIO ──────────────────────────────────────────── */}
      {(colegio?.direccion || colegio?.telefono) && (
        <>
          <div className="mx-4 h-px bg-gray-100" />
          <div className="px-5 py-3 space-y-1.5">
            {colegio.direccion && (
              <div className="flex items-start gap-2">
                <MapPin size={11} className="text-gray-300 mt-0.5 shrink-0" />
                <p className="text-gray-400 text-[11px] leading-tight">
                  {colegio.direccion}
                </p>
              </div>
            )}
            {colegio.telefono && (
              <div className="flex items-center gap-2">
                <Phone size={11} className="text-gray-300 shrink-0" />
                <p className="text-gray-400 text-[11px]">{colegio.telefono}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── FOOTER USUARIO ────────────────────────────────────────── */}
      <div className="mx-4 h-px bg-gray-100" />
      <div className="px-3 py-3">
        {/* Avatar + nombre */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl mb-1">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-orange-200">
            <span className="text-white text-[11px] font-black tracking-wide">
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-gray-900 truncate leading-tight">
              {userName ?? "Director"}
            </p>
            <p className="text-[10px] text-gray-400 font-medium">
              Administrador
            </p>
          </div>
          <Link
            href="/dashboard/director/configuracion"
            className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
          >
            <Settings size={13} />
          </Link>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
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
  );
}
