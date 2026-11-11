import { Fragment } from "react";

/**
 * Muestra las notas de la canción con un Markdown mínimo y seguro:
 * títulos (#), listas (- o *), **negrita** y *cursiva*. No interpreta HTML.
 */
export function SongNotes({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={blocks.length} className="list-disc space-y-0.5 pl-5">
        {list.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const item = /^\s*[-*]\s+(.*)$/.exec(line);
    if (item) {
      list.push(item[1]);
      continue;
    }
    flushList();
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading) blocks.push(<p key={blocks.length} className="font-semibold">{inline(heading[1])}</p>);
    else if (line.trim()) blocks.push(<p key={blocks.length}>{inline(line)}</p>);
    else blocks.push(<div key={blocks.length} className="h-2" />);
  }
  flushList();

  return <div className="space-y-1 text-sm">{blocks}</div>;
}

/** **negrita** y *cursiva* dentro de una línea. */
function inline(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}
