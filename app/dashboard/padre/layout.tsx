import NavbarPadre from "@/components/navigation/NavbarPadre";

export default function PadreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 font-nunito pb-28 lg:pb-10">
      {children}
      <NavbarPadre />
    </div>
  );
}
