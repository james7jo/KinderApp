import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavbarMaestra from "@/components/navigation/NavbarMaestra";

export default async function MaestraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, colegio_id")
    .eq("id", user.id)
    .single();

  const { data: colegio } = await supabase
    .from("colegios")
    .select("nombre")
    .eq("id", profile?.colegio_id)
    .single();

  // Obtener el primer curso asignado para los accesos rápidos del sidebar
  const { data: misCursos } = await supabase
    .from("maestra_curso")
    .select("curso_id")
    .eq("maestra_id", user.id)
    .limit(1)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 font-nunito">
      <NavbarMaestra
        colegio={colegio?.nombre}
        nombreMaestra={profile?.full_name}
        primerCursoId={misCursos?.curso_id}
      />
      <div className="lg:ml-60 pb-28 lg:pb-0 min-w-0">{children}</div>
    </div>
  );
}
