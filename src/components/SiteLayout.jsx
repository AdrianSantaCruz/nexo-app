import { useLocation } from "react-router-dom";
import SiteSidebar from "./SiteSidebar";
import SiteFooter from "./SiteFooter";
import { PageTransition } from "./ui/Motion";

// Páginas de pantalla completa (ocupan exactamente un viewport y manejan su
// propio scroll interno, como el feed o un hilo de chat): no llevan footer
// debajo, o la página quedaría más alta que la pantalla.
const FULL_HEIGHT_ROUTES = [/^\/$/, /^\/chats/];

// Envoltura de cualquier página del sitio web: nav lateral fijo + contenido.
// El contenido (children) se renderiza a ancho completo del área restante —
// cada página decide su propio max-width interno según lo que muestre.
export default function SiteLayout({ children }) {
  const { pathname } = useLocation();
  const isFullHeight = FULL_HEIGHT_ROUTES.some((re) => re.test(pathname));
  // Solo el primer tramo de la ruta cambia la animación: abrir un producto
  // dentro de una tienda (/tienda/x/producto/y) no vuelve a animar la página.
  const section = pathname.split("/")[1] || "inicio";

  return (
    <div className="min-h-screen flex">
      <SiteSidebar />
      <div className="flex-1 flex flex-col min-w-0 pl-16 lg:pl-56">
        <main className="flex-1 min-w-0">
          <PageTransition routeKey={section}>{children}</PageTransition>
        </main>
        {!isFullHeight && <SiteFooter />}
      </div>
    </div>
  );
}
