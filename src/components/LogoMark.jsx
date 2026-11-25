// Símbolo de Nexo (ícono de la app): la "N" verde sobre fondo negro.
// Uso: <LogoMark size={40} />
export default function LogoMark({ size = 40, className = "" }) {
  return (
    <img
      src="/nexo-icono.png"
      alt="Nexo"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      style={{ width: size, height: size, borderRadius: size * 0.225, boxShadow: "inset 0 0 0 1px #2A2622", outline: "1px solid #2A2622", outlineOffset: -1 }}
    />
  );
}
