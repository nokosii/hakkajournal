import { createRequire } from 'node:module';
import path from 'node:path';

type PdfTextItem = {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL: boolean;
};

type TextLine = {
  text: string;
  y: number;
  height: number;
  pageHeight: number;
};

const CJK_END = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}）】》〉」』]$/u;
const CJK_START = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}（【《〈「『]/u;
const SECTION_HEADING = /^(摘要|abstract|關鍵字|關鍵詞|keywords|前言|緒論|結論|結語|參考文獻|引用文獻|致謝|附錄)$/i;
const NUMBERED_HEADING = /^(第[一二三四五六七八九十百0-9]+[章節]|[一二三四五六七八九十]+、|\d+(?:\.\d+)*[.、]?\s+\S)/;
const BULLET = /^(?:[•●▪◦]|[-–—])\s*/;

function pdfJsDataUrl(folder: 'cmaps' | 'standard_fonts' | 'wasm') {
  const require = createRequire(path.join(process.cwd(), 'package.json'));
  const packageRoot = path.dirname(require.resolve('pdfjs-dist/package.json')).replaceAll('\\', '/');
  return `${packageRoot}/${folder}/`;
}

function median(values: number[]) {
  if (!values.length) return 12;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function normalizedText(value: string) {
  return value.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
}

function joinPieces(parts: Array<{ text: string; x: number; width: number; height: number }>) {
  const ordered = [...parts].sort((a, b) => a.x - b.x);
  let output = '';
  let previousEnd = 0;
  for (const part of ordered) {
    const text = normalizedText(part.text);
    if (!text) continue;
    const gap = part.x - previousEnd;
    const needsSpace = output && !/\s$/.test(output) && !/^\s/.test(part.text)
      && !CJK_END.test(output) && !CJK_START.test(text) && gap > Math.max(0.8, part.height * 0.08);
    output += `${needsSpace ? ' ' : ''}${text}`;
    previousEnd = part.x + part.width;
  }
  return output.trim();
}

function pageLines(items: unknown[], pageHeight: number) {
  const lines: Array<{ y: number; height: number; parts: Array<{ text: string; x: number; width: number; height: number }> }> = [];
  for (const candidate of items) {
    if (!candidate || typeof candidate !== 'object' || !('str' in candidate)) continue;
    const item = candidate as PdfTextItem;
    if (!item.str.trim() || !Array.isArray(item.transform)) continue;
    const x = Number(item.transform[4] ?? 0);
    const y = Number(item.transform[5] ?? 0);
    const height = Math.abs(Number(item.height || item.transform[3] || 12));
    const previous = lines.at(-1);
    if (!previous || Math.abs(previous.y - y) > Math.max(2, height * 0.28)) {
      lines.push({ y, height, parts: [{ text: item.str, x, width: Number(item.width || 0), height }] });
    } else {
      previous.parts.push({ text: item.str, x, width: Number(item.width || 0), height });
      previous.height = Math.max(previous.height, height);
    }
  }
  return lines.map((line) => ({ text: joinPieces(line.parts), y: line.y, height: line.height, pageHeight })).filter((line) => line.text);
}

function joinWrappedText(previous: string, next: string) {
  if (!previous) return next;
  if (/[-‐‑]$/.test(previous) && /^[A-Za-z]/.test(next)) return `${previous.slice(0, -1)}${next}`;
  if (CJK_END.test(previous) || CJK_START.test(next)) return `${previous}${next}`;
  return `${previous} ${next}`;
}

function linesToMarkdown(pages: TextLine[][]) {
  const allLines = pages.flat();
  const ordinaryHeight = median(allLines.map((line) => line.height).filter((height) => height > 4));
  const marginCounts = new Map<string, number>();

  for (const page of pages) {
    for (const line of page.filter((item) => item.y > item.pageHeight * 0.9 || item.y < item.pageHeight * 0.08)) {
      const key = line.text.toLowerCase();
      marginCounts.set(key, (marginCounts.get(key) ?? 0) + 1);
    }
  }

  const blocks: string[] = [];
  let paragraph = '';
  let firstContentSeen = false;
  const flush = () => {
    if (paragraph.trim()) blocks.push(paragraph.trim());
    paragraph = '';
  };

  pages.forEach((page, pageIndex) => {
    page.forEach((line, index) => {
      const text = line.text;
      const marginLine = line.y > line.pageHeight * 0.9 || line.y < line.pageHeight * 0.08;
      if (/^\d{1,4}$/.test(text) && marginLine) return;
      if (marginLine && (marginCounts.get(text.toLowerCase()) ?? 0) > 1) return;

      if (!firstContentSeen && text.length <= 140) {
        firstContentSeen = true;
        blocks.push(`# ${text.replace(/^#+\s*/, '')}`);
        return;
      }
      firstContentSeen = true;

      const subsection = text.match(/^([（(][一二三四五六七八九十0-9]+[）)])\s*(.*)$/);
      if (subsection) {
        flush();
        blocks.push(`### ${subsection[1]}`);
        paragraph = subsection[2];
        return;
      }

      if (pageIndex === 0 && index < 5 && text.length <= 40 && !SECTION_HEADING.test(text) && !NUMBERED_HEADING.test(text)) {
        flush();
        blocks.push(text);
        return;
      }

      const previous = page[index - 1];
      const verticalGap = previous ? Math.abs(previous.y - line.y) : 0;
      const largeGap = previous && verticalGap > Math.max(previous.height, line.height) * 1.75;
      const isHeading = SECTION_HEADING.test(text) || NUMBERED_HEADING.test(text)
        || (line.height >= ordinaryHeight * 1.45 && text.length <= 120);

      if (isHeading) {
        flush();
        const level = line.height >= ordinaryHeight * 1.9 ? '#' : '##';
        blocks.push(`${level} ${text.replace(/^#+\s*/, '')}`);
        return;
      }

      if (BULLET.test(text)) {
        flush();
        blocks.push(`- ${text.replace(BULLET, '')}`);
        return;
      }

      if (largeGap) flush();
      paragraph = joinWrappedText(paragraph, text);
    });
    flush();
  });

  return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

export async function pdfToMarkdown(data: Buffer) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = getDocument({
    data: Uint8Array.from(data),
    useWorkerFetch: false,
    cMapUrl: pdfJsDataUrl('cmaps'),
    standardFontDataUrl: pdfJsDataUrl('standard_fonts'),
    wasmUrl: pdfJsDataUrl('wasm'),
  });
  try {
    const document = await loadingTask.promise;
    if (document.numPages > 500) throw new Error('PDF 頁數超過 500 頁，無法自動轉換。');

    const pages: TextLine[][] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      pages.push(pageLines(content.items, viewport.height));
      page.cleanup();
    }

    const markdown = linesToMarkdown(pages);
    if (markdown.replace(/[#*\-\s]/g, '').length < 30) {
      throw new Error('此 PDF 沒有可擷取的文字層，請先完成 OCR 後再上傳。');
    }
    return markdown;
  } finally {
    await loadingTask.destroy();
  }
}
