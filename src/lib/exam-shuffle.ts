// Xáo thứ tự câu/đáp án RIÊNG cho từng học sinh, có seed tái tạo được (để
// phúc khảo đối chiếu lại đúng đề em đó đã làm). KHÔNG sinh nội dung câu hỏi
// mới — chỉ đổi thứ tự trình bày của nội dung do thầy soạn sẵn.
//
// Seed = hash(mãCa + SBD) → cùng 1 học sinh trong cùng 1 ca luôn ra đúng 1
// thứ tự cố định (deterministic), khác học sinh ra thứ tự khác nhau.

/** Hash chuỗi thành số nguyên 32-bit không âm — dùng làm seed PRNG. */
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0 // FNV-1a
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** PRNG mulberry32 — nhỏ gọn, đủ tốt cho xáo trình bày (không cần bảo mật mật mã). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Trả về hoán vị ngẫu nhiên (Fisher–Yates, seed cố định) của [0..n-1]:
 * permuted[viTriMoi] = chỉSốGốc.
 */
export function seededPermutation(n: number, seed: number): number[] {
  const rng = mulberry32(seed)
  const arr = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
