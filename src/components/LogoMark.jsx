// Logo de Nexo — fondo negro, "N" en verde lima.
// Uso: <LogoMark size={40} />
export default function LogoMark({ size = 40 }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: "#14110F",
        border: "1px solid #2A2622",
      }}
    >
      <span
        style={{
          fontFamily: "Georgia, serif",
          fontWeight: 700,
          fontSize: size * 0.52,
          color: "#C8FF4D",
          lineHeight: 1,
        }}
      >
        N
      </span>
    </div>
  );
}