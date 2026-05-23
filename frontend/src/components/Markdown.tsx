import { useMemo } from "react";

/** Минимальный безопасный Markdown-рендерер (без сторонних зависимостей).
 *  Поддерживает: заголовки, списки, таблицы, инлайн-форматирование,
 *  блоки кода, цитаты. Не выполняет HTML.
 */
type Block =
  | { type: "h"; level: number; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "checklist"; items: { text: string; checked: boolean }[] }
  | { type: "quote"; text: string }
  | { type: "code"; text: string }
  | { type: "hr" }
  | { type: "table"; head: string[]; rows: string[][] };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inline(s: string): string {
  let r = escapeHtml(s);
  r = r.replace(/`([^`]+)`/g, '<code class="rounded bg-navy-900/8 px-1.5 py-0.5 text-[0.85em] font-mono text-gold-700 dark:bg-white/10 dark:text-gold-300">$1</code>');
  r = r.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  r = r.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  r = r.replace(/_([^_\n]+)_/g, "<em>$1</em>");
  r = r.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a class="text-gold-700 underline-offset-2 hover:underline dark:text-gold-300" href="$2" target="_blank" rel="noreferrer">$1</a>');
  return r;
}

function parse(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    // hr
    if (/^---+\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // code fence
    if (line.startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: "code", text: buf.join("\n") });
      continue;
    }

    // heading
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      blocks.push({ type: "h", level: h[1].length, text: h[2].trim() });
      i++;
      continue;
    }

    // quote
    if (/^>\s+/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s+/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s+/, ""));
        i++;
      }
      blocks.push({ type: "quote", text: buf.join(" ") });
      continue;
    }

    // table
    if (/\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*[-:|\s]+\|/.test(lines[i + 1])) {
      const head = line.split("|").map((c) => c.trim()).filter(Boolean);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /\|/.test(lines[i])) {
        rows.push(lines[i].split("|").map((c) => c.trim()).filter((c, idx, arr) => !(c === "" && (idx === 0 || idx === arr.length - 1))));
        i++;
      }
      blocks.push({ type: "table", head, rows });
      continue;
    }

    // checklist
    if (/^\s*-\s+\[[ xX]\]\s+/.test(line)) {
      const items: { text: string; checked: boolean }[] = [];
      while (i < lines.length && /^\s*-\s+\[[ xX]\]\s+/.test(lines[i])) {
        const m = /^\s*-\s+\[([ xX])\]\s+(.*)$/.exec(lines[i])!;
        items.push({ text: m[2], checked: m[1].toLowerCase() === "x" });
        i++;
      }
      blocks.push({ type: "checklist", items });
      continue;
    }

    // unordered list
    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // paragraph
    const buf: string[] = [line];
    i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#|>|-\s|\d+\.\s|```|---)/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", text: buf.join(" ") });
  }
  return blocks;
}

export default function Markdown({ source }: { source: string }) {
  const blocks = useMemo(() => parse(source), [source]);
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-navy-900/85 dark:text-white/85">
      {blocks.map((b, idx) => {
        if (b.type === "hr") return <hr key={idx} className="border-navy-900/10 dark:border-white/10" />;
        if (b.type === "h") {
          const size = ["text-2xl", "text-xl", "text-lg", "text-base"][b.level - 1] ?? "text-base";
          return (
            <h2
              key={idx}
              className={`font-display ${size} font-semibold tracking-tight text-navy-900 dark:text-white`}
              dangerouslySetInnerHTML={{ __html: inline(b.text) }}
            />
          );
        }
        if (b.type === "p") {
          return <p key={idx} dangerouslySetInnerHTML={{ __html: inline(b.text) }} />;
        }
        if (b.type === "quote") {
          return (
            <blockquote
              key={idx}
              className="rounded-2xl border-l-4 border-gold-500 bg-gold-500/8 px-4 py-3 text-navy-900/80 dark:text-white/80"
              dangerouslySetInnerHTML={{ __html: inline(b.text) }}
            />
          );
        }
        if (b.type === "code") {
          return (
            <pre
              key={idx}
              className="overflow-x-auto rounded-2xl border border-navy-900/10 bg-navy-900/5 p-4 font-mono text-[12.5px] leading-relaxed text-navy-900 dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
            >
              {b.text}
            </pre>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={idx} className="list-disc space-y-1.5 pl-6 marker:text-gold-500">
              {b.items.map((it, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: inline(it) }} />
              ))}
            </ul>
          );
        }
        if (b.type === "ol") {
          return (
            <ol key={idx} className="list-decimal space-y-1.5 pl-6 marker:text-gold-500 marker:font-semibold">
              {b.items.map((it, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: inline(it) }} />
              ))}
            </ol>
          );
        }
        if (b.type === "checklist") {
          return (
            <ul key={idx} className="space-y-1.5">
              {b.items.map((it, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                      it.checked
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-navy-900/30 dark:border-white/30"
                    }`}
                  >
                    {it.checked ? "✓" : ""}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: inline(it.text) }} />
                </li>
              ))}
            </ul>
          );
        }
        if (b.type === "table") {
          return (
            <div key={idx} className="overflow-x-auto rounded-2xl border border-navy-900/10 dark:border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-navy-900/5 dark:bg-white/5">
                  <tr>
                    {b.head.map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-2.5 font-semibold text-navy-900 dark:text-white"
                        dangerouslySetInnerHTML={{ __html: inline(h) }}
                      />
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-900/8 dark:divide-white/8">
                  {b.rows.map((r, i) => (
                    <tr key={i}>
                      {r.map((c, j) => (
                        <td
                          key={j}
                          className="px-4 py-2.5"
                          dangerouslySetInnerHTML={{ __html: inline(c) }}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
