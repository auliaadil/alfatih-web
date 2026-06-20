import { Textbox, Canvas } from 'fabric';

export interface BulletListConfig {
  style: 'diamond' | 'number';
  bulletColor: string;
}

type BulletTextbox = Textbox & { bulletList: BulletListConfig };

export function applyBulletStyles(obj: BulletTextbox): void {
  const { bulletColor, style } = obj.bulletList;
  const lines = obj.text.split('\n');
  const styles: Record<number, Record<number, { fill: string }>> = {};

  lines.forEach((line, lineIndex) => {
    let prefixLen = 0;
    if (style === 'diamond' && line.startsWith('◆ ')) {
      prefixLen = 2;
    } else if (style === 'number') {
      const match = line.match(/^(\d+\. )/);
      if (match) prefixLen = match[1].length;
    }
    if (prefixLen > 0) {
      styles[lineIndex] = {};
      for (let i = 0; i < prefixLen; i++) {
        styles[lineIndex][i] = { fill: bulletColor };
      }
    }
  });

  obj.set({ styles });
}

export function normalizeBulletList(obj: BulletTextbox): void {
  const { style } = obj.bulletList;
  const lines = obj.text.split('\n');

  const cleanLines = lines.map(line => {
    if (style === 'diamond') return line.startsWith('◆ ') ? line.slice(2) : line;
    return line.replace(/^\d+\.\s/, '');
  });

  let counter = 1;
  const newLines = cleanLines.map(line => {
    if (line === '') return '';
    if (style === 'diamond') return `◆ ${line}`;
    return `${counter++}. ${line}`;
  });

  obj.set({ text: newLines.join('\n') });
  applyBulletStyles(obj);
}

export function changeBulletStyle(
  obj: BulletTextbox,
  newStyle: 'diamond' | 'number',
  canvas: Canvas
): void {
  obj.bulletList = { ...obj.bulletList, style: newStyle };
  normalizeBulletList(obj);
  canvas.requestRenderAll();
}

export function changeBulletColor(
  obj: BulletTextbox,
  newColor: string,
  canvas: Canvas
): void {
  obj.bulletList = { ...obj.bulletList, bulletColor: newColor };
  applyBulletStyles(obj);
  canvas.requestRenderAll();
}

export function createBulletListTextbox(
  canvas: Canvas,
  config?: Partial<BulletListConfig>
): Textbox {
  const bulletList: BulletListConfig = {
    style: config?.style ?? 'diamond',
    bulletColor: config?.bulletColor ?? '#F59E0B',
  };

  const defaultText =
    '◆ Fasilitas pertama\n◆ Fasilitas kedua\n◆ Fasilitas ketiga';

  const tb = new Textbox(defaultText, {
    left: ((canvas.width ?? 1080) / 2) - 400,
    top: ((canvas.height ?? 1350) / 2) - 54,
    originX: 'left',
    originY: 'top',
    width: 800,
    fontSize: 18,
    lineHeight: 1.8,
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fill: '#0F172A',
    fontWeight: '500',
    editable: true,
  });

  (tb as BulletTextbox).bulletList = bulletList;
  applyBulletStyles(tb as BulletTextbox);

  return tb;
}
