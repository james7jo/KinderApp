"use client";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    window.location.replace("/auth/login");
  }

  return (
    <button
      onClick={logout}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-sm font-bold w-full"
    >
      <LogOut size={18} />
      Cerrar sesión
    </button>
  );
}
