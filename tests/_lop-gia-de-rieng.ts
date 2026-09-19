// LỚP GIẢ TẤT ĐỊNH cho test đề riêng (GĐ 6 Kênh 1, 19/09). Không phải test —
// tên bắt đầu bằng `_` như `_d1-that.ts`.
//
// Dùng ở `de-rieng-ho-so-1909.test.ts` để khoá "KHÔNG có hồ sơ ôn ⇒ bộ đề Y HỆT
// bản trước 19/09": 30 lớp dưới đây đã được chạy qua mã CŨ (commit 6eefaa3) và
// dấu vân tay `boTheoEm` của từng lớp ghi cứng trong test. ĐỪNG sửa bộ sinh này
// — sửa là dấu vân tay hết nghĩa.
import type { CaTruocDaCham, YeuCauDeRieng } from '../src/lib/de-rieng'
import { CAU_HINH_DE_RIENG_MAC_DINH } from '../src/lib/cau-hinh-de-rieng'
import { hashSeed } from '../src/lib/exam-shuffle'
import type { CauUngVien, PhanDe } from '../src/lib/rut-de'

/** PRNG của riêng bộ sinh dữ liệu — KHÔNG phải của thuật toán. */
export function bocSoGia(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function cauGia(phan: PhanDe, i: number, dang: CauUngVien['dang'] = 'chua_ro', chuyenDe = ['Ester', 'Amin', 'Polime'][i % 3]!): CauUngVien {
  return { phan, id: `${phan}-${i}`, maDe: 'D', soGoc: i + 1, chuyenDe, mucDo: '', dang, text: '', coHinh: false, canXem: false, sao: 0, lyDoSao: '' }
}

/** Lớp giả thứ `c` (0..29): kho, số câu, số em, 1–4 ca trước đều rút từ `c`. */
export function lopGia(c: number): YeuCauDeRieng {
  const r = bocSoGia(1909 + c * 7919)
  const kieu = () => (['ly_thuyet', 'bai_tap', 'chua_ro'] as const)[Math.floor(r() * 3)]!
  const soI = 12 + Math.floor(r() * 60)
  const soII = 3 + Math.floor(r() * 10)
  const soIII = 3 + Math.floor(r() * 12)
  const uv = {
    I: Array.from({ length: soI }, (_, i) => cauGia('I', i, kieu())),
    II: Array.from({ length: soII }, (_, i) => cauGia('II', i, kieu())),
    III: Array.from({ length: soIII }, (_, i) => cauGia('III', i, kieu())),
  }
  const tat = [...uv.I, ...uv.II, ...uv.III].map((x) => x.id)
  const m = 2 + Math.floor(r() * 38)
  const dsSbd = Array.from({ length: m }, (_, i) => String(12000 + i))
  const dsCa: CaTruocDaCham[] = Array.from({ length: 1 + Math.floor(r() * 4) }, (_, j) => {
    const daLamCua: Record<string, string[]> = {}
    const saiCua: Record<string, string[]> = {}
    for (const sbd of dsSbd) {
      if (r() < 0.2) continue // em nghỉ ca này
      const lam = tat.filter(() => r() < 0.35)
      daLamCua[sbd] = lam
      saiCua[sbd] = lam.filter(() => r() < 0.4)
    }
    return { maCa: `ca${j}`, daLamCua, saiCua }
  })
  const soCau = c % 3 === 0 ? { I: 9, II: 2, III: 3 } : { I: Math.min(soI, 6 + Math.floor(r() * 12)), II: Math.min(soII, 2), III: Math.min(soIII, 3) }
  return {
    uv,
    yc: { soCau, chuyenDe: [], mucDo: [], tranhQid: [], seed: hashSeed(`lop-gia-${c}`) },
    dsSbd,
    dsCa,
    ch: { ...CAU_HINH_DE_RIENG_MAC_DINH, PHAM_VI_HOI_LAI: c % 4 === 1 ? 'ba_ca' : 'gan_nhat' },
  }
}

/** Dấu vân tay của một bản đồ đề: thứ tự em và thứ tự câu đều tính. */
export function vanTay(boTheoEm: Record<string, string[]>): number {
  return hashSeed(JSON.stringify(boTheoEm))
}
