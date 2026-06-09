interface GeneratedCoverProps {
  title: string;
  author?: string;
  publication?: string;
  className?: string;
}

// Strip parenthesized content e.g. "അറബിപ്പൊന്ന് (Arabi Ponnu)" → "അറബിപ്പൊന്ന്"
const cleanText = (t?: string) =>
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

// Auto-fit font size based on character count (with non-latin script handling)
const fitTitleSize = (text: string) => {
  // Malayalam/Arabic glyphs render wider; treat each non-ASCII char as ~1.4 weight
  let weight = 0;
  for (const ch of text) weight += /[\x00-\x7F]/.test(ch) ? 1 : 1.4;
  if (weight > 60) return 18;
  if (weight > 45) return 22;
  if (weight > 32) return 26;
  if (weight > 22) return 30;
  if (weight > 14) return 34;
  return 38;
};

const fitAuthorSize = (text: string) => {
  let weight = 0;
  for (const ch of text) weight += /[\x00-\x7F]/.test(ch) ? 1 : 1.4;
  if (weight > 36) return 12;
  if (weight > 26) return 14;
  if (weight > 18) return 16;
  return 18;
};

export const GeneratedCover = ({ title, author, publication, className }: GeneratedCoverProps) => {
  const displayTitle = cleanText(title) || "Untitled";
  const displayAuthor = cleanText(author);
  const displayPub = cleanText(publication);
  const titleSize = fitTitleSize(displayTitle);
  const authorSize = fitAuthorSize(displayAuthor);

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

      {/* Title — generous box, vertical centering, auto-shrunk */}
      <foreignObject x="62" y="100" width="176" height="170">
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            fontFamily: "'Amiri','Lora','Noto Sans Malayalam',serif",
            fontWeight: 800,
            fontSize: `${titleSize}px`,
            lineHeight: 1.15,
            color: "#111",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            hyphens: "auto",
            padding: "0 2px",
          }}
        >
          <span>{displayTitle}</span>
        </div>
      </foreignObject>

      {/* Author */}
      {displayAuthor && (
        <foreignObject x="30" y="278" width="240" height="56">
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontFamily: "'Montserrat',sans-serif",
              fontWeight: 700,
              fontSize: `${authorSize}px`,
              lineHeight: 1.15,
              color: "#c0392b",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              padding: "0 6px",
            }}
          >
            <span>{displayAuthor}</span>
          </div>
        </foreignObject>
      )}

      {/* Publication */}
      {displayPub && (
        <foreignObject x="20" y="355" width="260" height="36">
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontFamily: "'Montserrat',sans-serif",
              fontWeight: 700,
              fontSize: "14px",
              color: "#111",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            <span>{displayPub}</span>
          </div>
        </foreignObject>
      )}
    </svg>
  );
};
