import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CurriculoDirectorClient from "./CurriculoDirectorClient";

export default async function CurriculoDirectorPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "director") redirect("/dashboard");

  // 2. Traer los 4 campos de saberes oficiales para los selectores
  const { data: campos } = await supabase
    .from("campos_saberes")
    .select("id, nombre, sigla")
    .order("orden");

  // 3. Traer todos los contenidos e indicadores del PDF que ya están en la Base de Datos
  const { data: contenidos } = await supabase
    .from("contenidos_trimestre")
    .select("*")
    .order("anio_escolaridad")
    .order("trimestre")
    .order("id");

  return (
    <CurriculoDirectorClient
      campos={campos ?? []}
      contenidosIniciales={contenidos ?? []}
    />
  );
}
