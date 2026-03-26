import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import { createClient } from "@/lib/supabase/server";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Removed maximumScale: 1 to allow user zooming
};

export const metadata: Metadata = {
  title: "Cupoferta - Comunidad de Ofertas y Descuentos",
  description: "Descubre y comparte las mejores ofertas, cupones y promociones en México.",
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
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ClientLayout user={user}>
            {children}
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
