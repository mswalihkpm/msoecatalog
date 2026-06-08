interface GeneratedCoverProps {
  title: string;
  author?: string;
  publication?: string;
  className?: string;
}

// Strip parenthesized content e.g. "അറബിപ്പൊന്ന് (Arabi Ponnu)" → "അറബിപ്പൊന്ന്"
const cleanTitle = (t: string) =>
  (t || "").replace(/\s*[\(\[\{].*?[\)\]\}]\s*/g, " ").replace(/\s+/g, " ").trim();

const Ornament = ({ transform }: { transform: string }) => (
  <g transform={transform} stroke="#2b2b2b" strokeWidth="1.4" fill="none" strokeLinecap="round">
    <path d="M0,40 C10,30 25,25 40,30 C30,20 25,8 30,0" />
    <path d="M5,38 C18,32 30,22 35,10" />
    <path d="M0,40 C8,42 18,42 26,38" />
    <circle cx="32" cy="6" r="1.6" fill="#2b2b2b" />
    <circle cx="10" cy="34" r="1.2" fill="#2b2b2b" />
    <path d="M18,28 C22,24 26,22 30,22" />
  </g>
);

export const GeneratedCover = ({ title, author, publication, className }: GeneratedCoverProps) => {
  const display = cleanTitle(title) || "Untitled";
  // Auto-fit title font-size based on length
  const len = display.length;
  const titleSize = len > 40 ? 22 : len > 25 ? 28 : len > 15 ? 34 : 42;

  return (
    <svg
      viewBox="0 0 300 420"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8ebd6" />
          <stop offset="100%" stopColor="#dde2c4" />
        </linearGradient>
      </defs>
      <rect width="300" height="420" fill="url(#bg)" />

      {/* Corner ornaments */}
      <Ornament transform="translate(10,10) scale(1.1,1.1)" />
      <Ornament transform="translate(290,10) scale(-1.1,1.1)" />
      <Ornament transform="translate(10,410) scale(1.1,-1.1)" />
      <Ornament transform="translate(290,410) scale(-1.1,-1.1)" />

      {/* Side bars */}
      <rect x="48" y="80" width="3" height="260" fill="#b5773a" />
      <rect x="56" y="80" width="2" height="260" fill="#b5773a" />
      <rect x="242" y="80" width="2" height="260" fill="#b5773a" />
      <rect x="249" y="80" width="3" height="260" fill="#b5773a" />

      {/* Small book emblem top */}
      <g transform="translate(150,62)">
        <rect x="-18" y="6" width="36" height="6" rx="1" fill="#c0392b" />
        <rect x="-15" y="0" width="30" height="6" rx="1" fill="#c0392b" />
        <path d="M-12,-2 Q0,-18 12,-2 Z" fill="#c0392b" />
        <circle cx="0" cy="-14" r="2.5" fill="#7b1d12" />
      </g>

      {/* Title */}
      <foreignObject x="30" y="160" width="240" height="90">
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            fontFamily: "'Amiri','Lora',serif",
            fontWeight: 800,
            fontSize: `${titleSize}px`,
            lineHeight: 1.1,
            color: "#111",
            wordBreak: "break-word",
            padding: "0 6px",
          }}
        >
          {display}
        </div>
      </foreignObject>

      {/* Author */}
      {author && (
        <foreignObject x="30" y="260" width="240" height="40">
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              width: "100%",
              textAlign: "center",
              fontFamily: "'Montserrat',sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              color: "#c0392b",
            }}
          >
            {author}
          </div>
        </foreignObject>
      )}

      {/* Publication */}
      {publication && (
        <foreignObject x="20" y="355" width="260" height="36">
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              width: "100%",
              textAlign: "center",
              fontFamily: "'Montserrat',sans-serif",
              fontWeight: 700,
              fontSize: "15px",
              color: "#111",
            }}
          >
            {publication}
          </div>
        </foreignObject>
      )}
    </svg>
  );
};
