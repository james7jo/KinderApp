import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavbarDirector from "@/components/navigation/NavbarDirector";
import SidebarDirector from "@/components/navigation/SidebarDirector";

export default async function DirectorLayout({
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
    .select("nombre, direccion, telefono")
    .eq("id", profile?.colegio_id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 font-nunito">
      {/* Sidebar PC — solo visible en lg+ */}
      <SidebarDirector colegio={colegio} userName={profile?.full_name} />

      {/* Contenido principal
          - En PC: margen izquierdo = ancho del sidebar (w-64 = 256px)
          - En móvil: sin margen, padding bottom para el navbar flotante
      */}
      <div className="lg:ml-64 pb-28 lg:pb-0 min-w-0">{children}</div>

      {/* Navbar móvil — el que ya tenías, no se tocó */}
      <NavbarDirector />
    </div>
  );
}
