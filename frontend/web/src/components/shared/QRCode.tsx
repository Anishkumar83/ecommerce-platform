import { useMemo } from 'react';

/**
 * A self-contained QR encoder — byte mode, error correction level M, versions
 * 1–10 (up to 213 bytes, comfortably more than any zha.example/c/CODE URL).
 *
 * Written out rather than pulled from npm so campaign QR codes work offline,
 * add no bundle dependency, and render as plain SVG that prints cleanly.
 */

// ─── Galois field (GF(256), primitive polynomial 0x11D) ──────────────────────

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function initTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

const gfMul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

/** Generator polynomial for `degree` error-correction codewords. */
function generatorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function reedSolomon(data: number[], ecLen: number): number[] {
  const gen = generatorPoly(ecLen);
  const res = new Array(ecLen).fill(0);
  for (const byte of data) {
    const factor = byte ^ res[0];
    res.shift();
    res.push(0);
    for (let i = 0; i < ecLen; i++) res[i] ^= gfMul(gen[i + 1], factor);
  }
  return res;
}

// ─── Version tables (error correction level M only) ──────────────────────────
// [ total codewords, EC codewords per block, group1 blocks, group2 blocks ]
const VERSIONS: Record<number, { total: number; ecPerBlock: number; g1: number; g2: number }> = {
  1: { total: 26, ecPerBlock: 10, g1: 1, g2: 0 },
  2: { total: 44, ecPerBlock: 16, g1: 1, g2: 0 },
  3: { total: 70, ecPerBlock: 26, g1: 1, g2: 0 },
  4: { total: 100, ecPerBlock: 18, g1: 2, g2: 0 },
  5: { total: 134, ecPerBlock: 24, g1: 2, g2: 0 },
  6: { total: 172, ecPerBlock: 16, g1: 4, g2: 0 },
  7: { total: 196, ecPerBlock: 18, g1: 4, g2: 0 },
  8: { total: 242, ecPerBlock: 22, g1: 2, g2: 2 },
  9: { total: 292, ecPerBlock: 22, g1: 3, g2: 2 },
  10: { total: 346, ecPerBlock: 26, g1: 4, g2: 1 },
};

const ALIGNMENT: Record<number, number[]> = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
  6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
};

/** Pre-computed 18-bit version information for versions 7 and up. */
const VERSION_INFO: Record<number, number> = {
  7: 0x07c94, 8: 0x085bc, 9: 0x09a99, 10: 0x0a4d3,
};

/** Pre-computed 15-bit format strings for EC level M, masks 0–7. */
const FORMAT_INFO = [
  0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0,
];

// ─── Encoding ────────────────────────────────────────────────────────────────

function toUtf8(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

/** Smallest version of EC level M that fits `byteLen` bytes. */
function pickVersion(byteLen: number): number {
  for (let v = 1; v <= 10; v++) {
    const { total, ecPerBlock, g1, g2 } = VERSIONS[v];
    const dataCodewords = total - ecPerBlock * (g1 + g2);
    const lenBits = v < 10 ? 8 : 16;
    const needed = Math.ceil((4 + lenBits + byteLen * 8) / 8);
    if (needed <= dataCodewords) return v;
  }
  throw new Error('QR payload too long for version 10');
}

function buildCodewords(bytes: number[], version: number): number[] {
  const { total, ecPerBlock, g1, g2 } = VERSIONS[version];
  const dataCodewords = total - ecPerBlock * (g1 + g2);

  // Bit stream: mode indicator (0100 = byte), length, payload, terminator.
  const bits: number[] = [];
  const push = (value: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) push(b, 8);

  const capacity = dataCodewords * 8;
  push(0, Math.min(4, capacity - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((acc, b) => (acc << 1) | b, 0));
  }
  // Alternate the two standard pad codewords until the block is full.
  const PAD = [0xec, 0x11];
  let padIndex = 0;
  while (data.length < dataCodewords) data.push(PAD[padIndex++ % 2]);

  // Split into blocks. Group 2 blocks hold one more data codeword than group 1.
  const blockCount = g1 + g2;
  const shortLen = Math.floor(dataCodewords / blockCount);
  const blocks: number[][] = [];
  let offset = 0;
  for (let i = 0; i < blockCount; i++) {
    const len = i < g1 ? shortLen : shortLen + 1;
    blocks.push(data.slice(offset, offset + len));
    offset += len;
  }
  const ecBlocks = blocks.map(b => reedSolomon(b, ecPerBlock));

  // Interleave data, then EC.
  const out: number[] = [];
  const maxData = Math.max(...blocks.map(b => b.length));
  for (let i = 0; i < maxData; i++) {
    for (const b of blocks) if (i < b.length) out.push(b[i]);
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const b of ecBlocks) out.push(b[i]);
  }
  return out;
}

type Matrix = (0 | 1 | null)[][];

function buildMatrix(codewords: number[], version: number): boolean[][] {
  const size = version * 4 + 17;
  const m: Matrix = Array.from({ length: size }, () => new Array(size).fill(null));

  const placeFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r, cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const onRing = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6));
        const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        m[rr][cc] = onRing || inCore ? 1 : 0;
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const bit: 0 | 1 = i % 2 === 0 ? 1 : 0;
    if (m[6][i] === null) m[6][i] = bit;
    if (m[i][6] === null) m[i][6] = bit;
  }

  // Alignment patterns, skipping any that would collide with a finder.
  const centres = ALIGNMENT[version];
  for (const r of centres) {
    for (const c of centres) {
      if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          m[r + dr][c + dc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1 ? 1 : 0;
        }
      }
    }
  }

  // Dark module — always set, always reserved.
  m[size - 8][8] = 1;

  // Reserve format areas so data placement skips them.
  const reserveFormat = () => {
    for (let i = 0; i < 9; i++) {
      if (m[8][i] === null) m[8][i] = 0;
      if (m[i][8] === null) m[i][8] = 0;
    }
    for (let i = 0; i < 8; i++) {
      if (m[8][size - 1 - i] === null) m[8][size - 1 - i] = 0;
      if (m[size - 1 - i][8] === null) m[size - 1 - i][8] = 0;
    }
  };
  reserveFormat();
  // Version info blocks (v7+) are also reserved.
  if (version >= 7) {
    for (let i = 0; i < 18; i++) {
      const r = Math.floor(i / 3), c = i % 3;
      m[size - 11 + c][r] = 0;
      m[r][size - 11 + c] = 0;
    }
  }
  const isFunction: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) isFunction[r][c] = m[r][c] !== null;

  // Data placement: two-column zig-zag, right to left, skipping column 6.
  const dataBits: number[] = [];
  for (const cw of codewords) for (let i = 7; i >= 0; i--) dataBits.push((cw >> i) & 1);

  let bitIndex = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col = 5;
    for (let step = 0; step < size; step++) {
      const row = upward ? size - 1 - step : step;
      for (const c of [col, col - 1]) {
        if (isFunction[row][c]) continue;
        m[row][c] = bitIndex < dataBits.length ? (dataBits[bitIndex] as 0 | 1) : 0;
        bitIndex++;
      }
    }
    upward = !upward;
  }

  // Mask 0 — (row + col) % 2 === 0. One fixed mask keeps this compact; the
  // penalty-scoring pass that would pick the best of eight is overkill for
  // short, high-contrast URLs.
  const MASK = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFunction[r][c]) continue;
      if ((r + c) % 2 === 0) m[r][c] = (m[r][c] === 1 ? 0 : 1) as 0 | 1;
    }
  }

  // Format information, twice.
  const fmt = FORMAT_INFO[MASK];
  const fmtBit = (i: number) => ((fmt >> i) & 1) as 0 | 1;
  for (let i = 0; i <= 5; i++) m[8][i] = fmtBit(14 - i);
  m[8][7] = fmtBit(8);
  m[8][8] = fmtBit(7);
  m[7][8] = fmtBit(6);
  for (let i = 9; i <= 14; i++) m[14 - i][8] = fmtBit(14 - i);
  for (let i = 0; i <= 7; i++) m[size - 1 - i][8] = fmtBit(14 - i);
  for (let i = 8; i <= 14; i++) m[8][size - 15 + i] = fmtBit(14 - i);
  m[size - 8][8] = 1;

  // Version information, twice, for v7+.
  if (version >= 7) {
    const vi = VERSION_INFO[version];
    for (let i = 0; i < 18; i++) {
      const bit = ((vi >> i) & 1) as 0 | 1;
      const r = Math.floor(i / 3), c = i % 3;
      m[size - 11 + c][r] = bit;
      m[r][size - 11 + c] = bit;
    }
  }

  return m.map(row => row.map(cell => cell === 1));
}

/** Encodes text to a boolean matrix. Exported for testing. */
export function encodeQR(text: string): boolean[][] {
  const bytes = toUtf8(text);
  const version = pickVersion(bytes.length);
  return buildMatrix(buildCodewords(bytes, version), version);
}

// ─── Component ───────────────────────────────────────────────────────────────

interface QRCodeProps {
  value: string;
  /** Rendered edge length in px. */
  size?: number;
  /** Quiet-zone width in modules. The spec asks for 4. */
  margin?: number;
  dark?: string;
  light?: string;
  className?: string;
}

export default function QRCode({
  value,
  size = 180,
  margin = 4,
  dark = '#111827',
  light = '#ffffff',
  className = '',
}: QRCodeProps) {
  const matrix = useMemo(() => {
    try {
      return encodeQR(value);
    } catch {
      return null;
    }
  }, [value]);

  if (!matrix) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-gray-50 text-xs text-gray-400 ${className}`}
        style={{ width: size, height: size }}
      >
        Cannot encode
      </div>
    );
  }

  const modules = matrix.length;
  const total = modules + margin * 2;

  // One path for every dark module keeps the DOM small enough to inline.
  const path = matrix
    .flatMap((row, r) =>
      row.map((on, c) => (on ? `M${c + margin} ${r + margin}h1v1h-1z` : '')))
    .join('');

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={size}
      height={size}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code for ${value}`}
    >
      <rect width={total} height={total} fill={light} />
      <path d={path} fill={dark} />
    </svg>
  );
}
