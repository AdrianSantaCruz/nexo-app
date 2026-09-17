const COLOR = {
  negro: "#14110F",
  border: "#2A2622",
  muted: "#8A8378",
};

export default function SiteFooter() {
  return (
    <footer
      className="px-4 md:px-8 py-6 text-center"
      style={{ backgroundColor: COLOR.negro, borderTop: `1px solid ${COLOR.border}` }}
    >
      <p className="text-xs" style={{ color: COLOR.muted }}>
        Nexo — Nero Labs · Arequipa, Perú
      </p>
    </footer>
  );
}