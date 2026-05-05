"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, BookOpen, Users, Video, LogOut } from "lucide-react";

const navItems = [
  { href: "/dashboard/director", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/director/cursos", label: "Cursos", icon: BookOpen },
  { href: "/dashboard/director/maestras", label: "Maestras", icon: Users },
  { href: "/dashboard/director/camaras", label: "Cámaras", icon: Video },
];

export default function NavbarDirector() {
  const pathname = usePathname();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    window.location.replace("/auth/login");
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-3 mb-3 bg-white rounded-2xl shadow-xl border border-orange-100 px-2 py-3">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                  isActive
                    ? "text-orange-500"
                    : "text-gray-300 hover:text-gray-400"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-orange-50" : ""}`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-xs font-bold">{item.label}</span>
              </Link>
            );
          })}
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
  );
}
