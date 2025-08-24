export interface TranscriptSegment {
  id?: number;
  start: number; // seconds
  end: number;   // seconds
  text: string;
}

function toTimecode(sec: number): string {
  const ms = Math.round((sec % 1) * 1000);
  const total = Math.floor(sec);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

export function toSrt(segments: TranscriptSegment[]): string {
  return segments
    .map((seg, idx) => {
      const i = (idx + 1).toString();
      const line = `${toTimecode(seg.start)} --> ${toTimecode(seg.end)}`;
      return `${i}\n${line}\n${seg.text}\n`;
    })
    .join('\n');
}

import { generateVttCss } from '@/lib/constants/subtitle-styles';

export function toVtt(segments: TranscriptSegment[]): string {
  const header = `WEBVTT

${generateVttCss()}`;
  const body = segments
    .map((seg) => {
      const start = toTimecode(seg.start).replace(',', '.');
      const end = toTimecode(seg.end).replace(',', '.');
      return `${start} --> ${end}\n${seg.text}\n`;
    })
    .join('\n');
  return header + body;
}

