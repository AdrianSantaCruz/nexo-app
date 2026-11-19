import { Component } from "react";

// Si una pantalla falla, en lugar de dejar toda la web en negro se muestra un
// aviso con la opción de recargar o volver al inicio.
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Error en la interfaz:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#0B0A09" }}>
        <div className="max-w-sm text-center">
          <p className="text-lg font-semibold" style={{ color: "#FBF6EF" }}>
            Algo salió mal
          </p>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: "#8A8378" }}>
            Esta pantalla tuvo un problema. Recarga la página para continuar.
          </p>
          <div className="flex gap-3 justify-center mt-5">
            <button onClick={() => window.location.reload()} className="rounded-full px-6 py-2.5 text-sm font-semibold" style={{ backgroundColor: "#C8FF4D", color: "#0B0A09" }}>
              Recargar
            </button>
            <a href="/" className="rounded-full px-6 py-2.5 text-sm" style={{ border: "1px solid #2A2622", color: "#FBF6EF" }}>
              Ir al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }
}
