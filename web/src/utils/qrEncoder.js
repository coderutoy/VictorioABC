/**
 * Pure-JS ISO/IEC 18004 QR Code Matrix Generator (Byte Mode, ECC Level L, Versions 1-4).
 * Generates a scannable boolean 2D matrix for URLs and patient QR tokens with zero external dependencies.
 */

const VERSION_PARAMS = {
  1: { size: 21, totalCodewords: 26, ecCodewords: 7, align: [] },
  2: { size: 25, totalCodewords: 44, ecCodewords: 10, align: [6, 18] },
  3: { size: 29, totalCodewords: 70, ecCodewords: 15, align: [6, 22] },
  4: { size: 33, totalCodewords: 100, ecCodewords: 20, align: [6, 26] },
};

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(poly.length + 1).fill(0);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function rsComputeRemainder(data, ecCount) {
  const gen = rsGeneratorPoly(ecCount);
  const rem = new Array(ecCount).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem[0];
    rem.shift();
    rem.push(0);
    for (let i = 0; i < ecCount; i += 1) {
      rem[i] ^= gfMul(gen[i + 1], factor);
    }
  }
  return rem;
}

function pickVersion(byteLength) {
  for (const v of [1, 2, 3, 4]) {
    const dataCap = VERSION_PARAMS[v].totalCodewords - VERSION_PARAMS[v].ecCodewords;
    if (byteLength + 2 <= dataCap) return v;
  }
  return 4;
}

export function encodeQrMatrix(text = 'https://victorio-abc-ph.vercel.app') {
  const bytes = Array.from(new TextEncoder().encode(text));
  const version = pickVersion(bytes.length);
  const { size, totalCodewords, ecCodewords, align } = VERSION_PARAMS[version];
  const dataCapacity = totalCodewords - ecCodewords;
  const payloadBytes = bytes.slice(0, dataCapacity - 2);

  // Build bit stream: 4-bit mode (0100 = byte) + 8-bit count + data + terminator + pad
  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i -= 1) {
      bits.push((val >>> i) & 1);
    }
  };

  pushBits(0b0100, 4);
  pushBits(payloadBytes.length, 8);
  for (const b of payloadBytes) pushBits(b, 8);

  const maxBits = dataCapacity * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  pushBits(0, termLen);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataWords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let w = 0;
    for (let j = 0; j < 8; j += 1) w = (w << 1) | bits[i + j];
    dataWords.push(w);
  }

  let padToggle = true;
  while (dataWords.length < dataCapacity) {
    dataWords.push(padToggle ? 0xec : 0x11);
    padToggle = !padToggle;
  }

  const ecWords = rsComputeRemainder(dataWords, ecCodewords);
  const allWords = [...dataWords, ...ecWords];

  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));

  const setModule = (r, c, val, isFunc = true) => {
    if (r < 0 || r >= size || c < 0 || c >= size) return;
    matrix[r][c] = Boolean(val);
    if (isFunc) reserved[r][c] = true;
  };

  const placeFinder = (row, col) => {
    for (let r = -1; r <= 7; r += 1) {
      for (let c = -1; c <= 7; c += 1) {
        const inBox = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const onOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        setModule(row + r, col + c, inBox && (onOuter || inInner), true);
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i += 1) {
    setModule(6, i, i % 2 === 0, true);
    setModule(i, 6, i % 2 === 0, true);
  }

  // Alignment patterns
  for (const r of align) {
    for (const c of align) {
      if (reserved[r][c]) continue;
      for (let dr = -2; dr <= 2; dr += 1) {
        for (let dc = -2; dc <= 2; dc += 1) {
          const dist = Math.max(Math.abs(dr), Math.abs(dc));
          setModule(r + dr, c + dc, dist !== 1, true);
        }
      }
    }
  }

  // Reserve format info areas & dark module
  for (let i = 0; i < 9; i += 1) {
    if (i !== 6) {
      reserved[8][i] = true;
      reserved[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i += 1) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }
  setModule(size - 8, 8, true, true);

  // Place data bits (upward/downward 2-column zigzag)
  const fullBits = [];
  for (const w of allWords) {
    for (let i = 7; i >= 0; i -= 1) fullBits.push((w >>> i) & 1);
  }

  let bitIdx = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert += 1) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j += 1) {
        const c = right - j;
        if (!reserved[r][c]) {
          const bit = bitIdx < fullBits.length ? fullBits[bitIdx] : 0;
          bitIdx += 1;
          // Apply mask pattern 0: (r + c) % 2 === 0
          const masked = ((r + c) % 2 === 0) ? bit ^ 1 : bit;
          matrix[r][c] = Boolean(masked);
        }
      }
    }
    upward = !upward;
  }

  // Write format bits for ECC Level L (01) + Mask 0 (000) -> BCH precomputed 0x77c4
  const formatBits = 0x77c4;
  const fBit = (i) => ((formatBits >>> i) & 1) === 1;

  for (let i = 0; i <= 5; i += 1) setModule(8, i, fBit(i), true);
  setModule(8, 7, fBit(6), true);
  setModule(8, 8, fBit(7), true);
  setModule(7, 8, fBit(8), true);
  for (let i = 9; i < 15; i += 1) setModule(14 - i, 8, fBit(i), true);

  for (let i = 0; i < 8; i += 1) setModule(8, size - 1 - i, fBit(i), true);
  for (let i = 8; i < 15; i += 1) setModule(size - 15 + i, 8, fBit(i), true);

  return matrix;
}
