import NavbarMaestra from "@/components/navigation/NavbarMaestra";

export default function MaestraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28 lg:pb-10">
      {children}
      <NavbarMaestra />
    </div>
  );
}
