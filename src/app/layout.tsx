import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import { createClient } from "@/lib/supabase/server";
import { ThemeProvider } from "@/components/ThemeProvider";
import SwRegister from "@/components/SwRegister";
import TopDealsSidebar from "@/components/TopDealsSidebar";



export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Removed maximumScale: 1 to allow user zooming
};

export const metadata: Metadata = {
  title: "Cupoferta - Comunidad de Ofertas y Descuentos",
  description: "Descubre y comparte las mejores ofertas, cupones y promociones en México.",
  manifest: "/manifest.json",
  other: {
    clckd: "ddbbc72fe192c1cf3befc20b85938043",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans">
        <SwRegister />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ClientLayout user={user} rightSidebar={<TopDealsSidebar />}>
            {children}
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
