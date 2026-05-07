import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CamarasClient from "./CamarasClient";

export default async function CamarasDirectorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("colegio_id")
    .eq("id", user.id)
    .single();

  const { data: camaras } = await supabase
    .from("camaras")
    .select("*")
    .eq("colegio_id", profile?.colegio_id)
    .eq("activa", true)
    .order("created_at");

  const { data: cursos } = await supabase
    .from("cursos")
    .select("id, nombre")
    .eq("colegio_id", profile?.colegio_id)
    .order("nombre");

  return (
    <CamarasClient
      camaras={camaras ?? []}
      colegioId={profile?.colegio_id ?? ""}
      cursos={cursos ?? []}
    />
  );
}
