import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { LEGAL_DOCS } from "../lib/legalDocs";
import { EmptyState, Reveal, Stagger, StaggerItem } from "./ui/Motion";

const COLOR = { lima: "#C8FF4D", hueso: "#FBF6EF", muted: "#8A8378" };

export default function LegalPage() {
  const { doc } = useParams();
  const content = LEGAL_DOCS[doc];

  if (!content) {
    return <EmptyState icon={FileText} title="Documento no encontrado" subtitle="Vuelve a Ajustes e inténtalo de nuevo." />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      <Reveal>
        <Link to="/ajustes" className="inline-flex items-center gap-1.5 text-xs mb-3 hover:underline" style={{ color: COLOR.muted }}>
          <ArrowLeft size={13} />
          Ajustes
        </Link>
        <h1 className="text-2xl font-bold mb-7" style={{ color: COLOR.hueso }}>
          {content.title}
        </h1>
      </Reveal>
      <Stagger stagger={0.05} className="flex flex-col gap-6">
        {content.sections.map((s) => (
          <StaggerItem key={s.heading}>
            <h2 className="text-sm font-semibold mb-1.5" style={{ color: COLOR.lima }}>
              {s.heading}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: COLOR.hueso, opacity: 0.9 }}>
              {s.body}
            </p>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
