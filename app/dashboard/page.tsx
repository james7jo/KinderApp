export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, colegio_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  // Director sin colegio completado → completar perfil
  if (profile.role === "director" && profile.colegio_id) {
    const { data: colegio } = await supabase
      .from("colegios")
      .select("nombre")
      .eq("id", profile.colegio_id)
      .single();

    console.log("Nombre colegio:", colegio?.nombre);
    console.log(
      "Empieza con Colegio de:",
      colegio?.nombre?.startsWith("Colegio de "),
    );

    if (colegio?.nombre?.startsWith("Colegio de ")) {
      redirect("/auth/completar-perfil");
    }
  }

  if (profile.role === "director") redirect("/dashboard/director");
  if (profile.role === "maestra") redirect("/dashboard/maestra");
  if (profile.role === "padre") redirect("/dashboard/padre");

  redirect("/auth/login");
}
