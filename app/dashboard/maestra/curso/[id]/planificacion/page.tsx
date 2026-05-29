import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlanificacionMaestraClient from "./PlanificacionMaestraClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlanificacionMaestraPage({ params }: Props) {
  const supabase = await createClient();
  const { id: cursoId } = await params;

  // 1. Validar sesión de maestra
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, colegio_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "maestra") redirect("/dashboard");

  // 2. Obtener los datos del curso actual para saber qué anio_escolaridad es (1 o 2)
  const { data: curso } = await supabase
    .from("cursos")
    .select("id, nombre, anio_escolaridad")
    .eq("id", cursoId)
    .single();

  if (!curso) redirect("/dashboard/maestra");

  // 3. Jalar los contenidos e indicadores del Ministerio que aprobó el Director para este año exacto
  const { data: contenidosMinisterio } = await supabase
    .from("contenidos_trimestre")
    .select("*")
    .eq("anio_escolaridad", curso.anio_escolaridad)
    .order("trimestre")
    .order("id");

  // 4. Buscar si este curso ya tiene una planificación creada para esta gestión (2026)
  const gestionActual = new Date().getFullYear();
  const { data: planExistente } = await supabase
    .from("planificacion_anual") // Usa el nombre exacto de tu tabla si varía en mayúsculas
    .select("*")
    .eq("curso_id", curso.id)
    .eq("gestion", gestionActual)
    .maybeSingle();

  // 5. Traer los campos de saberes para organizar la interfaz por pestañas
  const { data: campos } = await supabase
    .from("campos_saberes")
    .select("id, nombre, sigla")
    .order("orden");

  return (
    <PlanificacionMaestraClient
      curso={curso}
      maestraId={user.id}
      colegioId={profile.colegio_id ?? ""}
      campos={campos ?? []}
      contenidosMinisterio={contenidosMinisterio ?? []}
      planExistente={planExistente ?? null}
    />
  );
}
