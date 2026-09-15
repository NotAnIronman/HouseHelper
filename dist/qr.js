(function (root) {
  "use strict";

  const RS_BLOCKS_M = {
    1: [[1, 26, 16]],
    2: [[1, 44, 28]],
    3: [[1, 70, 44]],
    4: [[2, 50, 32]],
    5: [[2, 67, 43]],
    6: [[4, 43, 27]],
    7: [[4, 49, 31]],
    8: [[2, 60, 38], [2, 61, 39]],
    9: [[3, 58, 36], [2, 59, 37]],
    10: [[4, 69, 43], [1, 70, 44]],
  };
  const ALIGNMENT = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
  };
  const EXP = new Uint8Array(512);
  const LOG = new Uint8Array(256);
  let value = 1;
  for (let index = 0; index < 255; index += 1) {
    EXP[index] = value;
    LOG[value] = index;
    value <<= 1;
    if (value & 0x100) value ^= 0x11d;
  }
  for (let index = 255; index < EXP.length; index += 1) EXP[index] = EXP[index - 255];

  function multiply(left, right) {
    return left && right ? EXP[LOG[left] + LOG[right]] : 0;
  }

  function generator(degree) {
    let result = [1];
    for (let index = 0; index < degree; index += 1) {
      const next = new Array(result.length + 1).fill(0);
      result.forEach((coefficient, position) => {
        next[position] ^= coefficient;
        next[position + 1] ^= multiply(coefficient, EXP[index]);
      });
      result = next;
    }
    return result;
  }

  function reedSolomon(data, degree) {
    const polynomial = generator(degree);
    const remainder = new Array(degree).fill(0);
    data.forEach((byte) => {
      const factor = byte ^ remainder[0];
      remainder.shift();
      remainder.push(0);
      for (let index = 0; index < degree; index += 1) remainder[index] ^= multiply(polynomial[index + 1], factor);
    });
    return remainder;
  }

  function appendBits(target, number, length) {
    for (let index = length - 1; index >= 0; index -= 1) target.push(number >>> index & 1);
  }

  function encodeData(text) {
    const bytes = [...new TextEncoder().encode(text)];
    let version = 0;
    let blocks;
    for (let candidate = 1; candidate <= 10; candidate += 1) {
      const candidateBlocks = RS_BLOCKS_M[candidate];
      const dataBytes = candidateBlocks.reduce((sum, [count, , dataCount]) => sum + count * dataCount, 0);
      const lengthBits = candidate < 10 ? 8 : 16;
      if (4 + lengthBits + bytes.length * 8 <= dataBytes * 8) {
        version = candidate;
        blocks = candidateBlocks;
        break;
      }
    }
    if (!version) throw new Error("Pairing address is too long for the offline QR generator");
    const dataCapacity = blocks.reduce((sum, [count, , dataCount]) => sum + count * dataCount, 0);
    const bits = [];
    appendBits(bits, 4, 4);
    appendBits(bits, bytes.length, version < 10 ? 8 : 16);
    bytes.forEach((byte) => appendBits(bits, byte, 8));
    const terminator = Math.min(4, dataCapacity * 8 - bits.length);
    appendBits(bits, 0, terminator);
    while (bits.length % 8) bits.push(0);
    const data = [];
    for (let index = 0; index < bits.length; index += 8) data.push(bits.slice(index, index + 8).reduce((sum, bit) => sum << 1 | bit, 0));
    let pad = 0;
    while (data.length < dataCapacity) data.push(pad++ % 2 ? 0x11 : 0xec);

    const dataBlocks = [];
    const errorBlocks = [];
    let offset = 0;
    blocks.forEach(([count, totalCount, dataCount]) => {
      for (let index = 0; index < count; index += 1) {
        const block = data.slice(offset, offset + dataCount);
        offset += dataCount;
        dataBlocks.push(block);
        errorBlocks.push(reedSolomon(block, totalCount - dataCount));
      }
    });
    const codewords = [];
    const maxData = Math.max(...dataBlocks.map((block) => block.length));
    const maxError = Math.max(...errorBlocks.map((block) => block.length));
    for (let index = 0; index < maxData; index += 1) dataBlocks.forEach((block) => { if (index < block.length) codewords.push(block[index]); });
    for (let index = 0; index < maxError; index += 1) errorBlocks.forEach((block) => { if (index < block.length) codewords.push(block[index]); });
    const resultBits = [];
    codewords.forEach((byte) => appendBits(resultBits, byte, 8));
    return { version, bits: resultBits };
  }

  function maskBit(mask, x, y) {
    if (mask === 0) return (x + y) % 2 === 0;
    if (mask === 1) return y % 2 === 0;
    if (mask === 2) return x % 3 === 0;
    if (mask === 3) return (x + y) % 3 === 0;
    if (mask === 4) return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    if (mask === 5) return x * y % 2 + x * y % 3 === 0;
    if (mask === 6) return (x * y % 2 + x * y % 3) % 2 === 0;
    return ((x + y) % 2 + x * y % 3) % 2 === 0;
  }

  function makeMatrix(version, dataBits, mask) {
    const size = version * 4 + 17;
    const modules = Array.from({ length: size }, () => new Array(size).fill(false));
    const fixed = Array.from({ length: size }, () => new Array(size).fill(false));
    const setFixed = (x, y, dark) => {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      modules[y][x] = Boolean(dark);
      fixed[y][x] = true;
    };
    const finder = (centerX, centerY) => {
      for (let dy = -4; dy <= 4; dy += 1) for (let dx = -4; dx <= 4; dx += 1) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        setFixed(centerX + dx, centerY + dy, distance !== 2 && distance !== 4);
      }
    };
    finder(3, 3);
    finder(size - 4, 3);
    finder(3, size - 4);
    for (let index = 8; index < size - 8; index += 1) {
      if (!fixed[6][index]) setFixed(index, 6, index % 2 === 0);
      if (!fixed[index][6]) setFixed(6, index, index % 2 === 0);
    }
    ALIGNMENT[version].forEach((centerY) => ALIGNMENT[version].forEach((centerX) => {
      if (fixed[centerY][centerX]) return;
      for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) setFixed(centerX + dx, centerY + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));

    const formatValue = mask;
    let formatRemainder = formatValue;
    for (let index = 0; index < 10; index += 1) formatRemainder = formatRemainder << 1 ^ (formatRemainder >>> 9) * 0x537;
    const formatBits = (formatValue << 10 | formatRemainder) ^ 0x5412;
    const formatBit = (index) => formatBits >>> index & 1;
    for (let index = 0; index <= 5; index += 1) setFixed(8, index, formatBit(index));
    setFixed(8, 7, formatBit(6));
    setFixed(8, 8, formatBit(7));
    setFixed(7, 8, formatBit(8));
    for (let index = 9; index < 15; index += 1) setFixed(14 - index, 8, formatBit(index));
    for (let index = 0; index < 8; index += 1) setFixed(size - 1 - index, 8, formatBit(index));
    for (let index = 8; index < 15; index += 1) setFixed(8, size - 15 + index, formatBit(index));
    setFixed(8, size - 8, true);

    if (version >= 7) {
      let remainder = version;
      for (let index = 0; index < 12; index += 1) remainder = remainder << 1 ^ (remainder >>> 11) * 0x1f25;
      const versionBits = version << 12 | remainder;
      for (let index = 0; index < 18; index += 1) {
        const bit = versionBits >>> index & 1;
        const a = size - 11 + index % 3;
        const b = Math.floor(index / 3);
        setFixed(a, b, bit);
        setFixed(b, a, bit);
      }
    }

    let bitIndex = 0;
    let upward = true;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right -= 1;
      for (let vertical = 0; vertical < size; vertical += 1) {
        const y = upward ? size - 1 - vertical : vertical;
        for (let offset = 0; offset < 2; offset += 1) {
          const x = right - offset;
          if (fixed[y][x]) continue;
          const bit = bitIndex < dataBits.length ? dataBits[bitIndex] === 1 : false;
          modules[y][x] = bit !== maskBit(mask, x, y);
          bitIndex += 1;
        }
      }
      upward = !upward;
    }
    return modules;
  }

  function penalty(modules) {
    const size = modules.length;
    let score = 0;
    const scan = (line) => {
      let run = 1;
      for (let index = 1; index < line.length; index += 1) {
        if (line[index] === line[index - 1]) run += 1;
        else {
          if (run >= 5) score += 3 + run - 5;
          run = 1;
        }
      }
      if (run >= 5) score += 3 + run - 5;
      const text = line.map((bit) => bit ? "1" : "0").join("");
      for (let index = 0; index <= text.length - 11; index += 1) if (text.slice(index, index + 11) === "10111010000" || text.slice(index, index + 11) === "00001011101") score += 40;
    };
    for (let index = 0; index < size; index += 1) {
      scan(modules[index]);
      scan(modules.map((row) => row[index]));
    }
    for (let y = 0; y < size - 1; y += 1) for (let x = 0; x < size - 1; x += 1) {
      const color = modules[y][x];
      if (modules[y][x + 1] === color && modules[y + 1][x] === color && modules[y + 1][x + 1] === color) score += 3;
    }
    const dark = modules.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
    score += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    return score;
  }

  function create(text) {
    const encoded = encodeData(String(text));
    let best = null;
    let bestPenalty = Infinity;
    for (let mask = 0; mask < 8; mask += 1) {
      const matrix = makeMatrix(encoded.version, encoded.bits, mask);
      const value = penalty(matrix);
      if (value < bestPenalty) {
        best = matrix;
        bestPenalty = value;
      }
    }
    return best;
  }

  function toCanvas(canvas, text) {
    const matrix = create(text);
    const quiet = 4;
    const pixels = Math.max(4, Math.floor(360 / (matrix.length + quiet * 2)));
    const size = (matrix.length + quiet * 2) * pixels;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.fillStyle = "#102f27";
    matrix.forEach((row, y) => row.forEach((dark, x) => {
      if (dark) context.fillRect((x + quiet) * pixels, (y + quiet) * pixels, pixels, pixels);
    }));
    return canvas;
  }

  root.HouseHelperQR = { create, toCanvas };
})(typeof window === "undefined" ? globalThis : window);
