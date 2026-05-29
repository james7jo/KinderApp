import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HologramaClient from "./HologramaClient";

export default async function HologramaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ trimestre?: string }>;
}) {
  const { id: alumnoId } = await params;
  const { trimestre: trimestreParam } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: alumno } = await supabase
    .from("alumnos")
    .select("id, nombre, apellido, curso_id, genero")
    .eq("id", alumnoId)
    .single();

  if (!alumno) redirect("/dashboard/padre");

  const trimestreActivo = trimestreParam ? Number(trimestreParam) : 1;
  const gestionActual = new Date().getFullYear();

  const { data: evaluaciones } = await supabase
    .from("observacion_semanal")
    .select("nota_ser, nota_saber, nota_hacer, nota_decidir")
    .eq("alumno_id", alumnoId)
    .eq("trimestre", trimestreActivo)
    .eq("gestion", gestionActual);

  let promedioSer = 0;
  let promedioSaber = 0;
  let promedioHacer = 0;
  let promedioDecidir = 0;

  if (evaluaciones && evaluaciones.length > 0) {
    const totalSemanas = evaluaciones.length;
    promedioSer = Math.round(
      evaluaciones.reduce((acc, curr) => acc + (curr.nota_ser || 0), 0) /
        totalSemanas,
    );
    promedioSaber = Math.round(
      evaluaciones.reduce((acc, curr) => acc + (curr.nota_saber || 0), 0) /
        totalSemanas,
    );
    promedioHacer = Math.round(
      evaluaciones.reduce((acc, curr) => acc + (curr.nota_hacer || 0), 0) /
        totalSemanas,
    );
    promedioDecidir = Math.round(
      evaluaciones.reduce((acc, curr) => acc + (curr.nota_decidir || 0), 0) /
        totalSemanas,
    );
  }

  return (
    <HologramaClient
      alumnoNombre={`${alumno.nombre} ${alumno.apellido}`}
      trimestre={trimestreActivo}
      genero={alumno.genero === "F" ? "F" : "M"}
      promedios={{
        ser: promedioSer,
        saber: promedioSaber,
        hacer: promedioHacer,
        decidir: promedioDecidir,
      }}
    />
  );
}
