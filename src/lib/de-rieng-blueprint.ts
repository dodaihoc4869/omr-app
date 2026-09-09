// PHÂN TẦNG BLUEPRINT — chạy thuật toán chặn trần trùng BÊN TRONG từng ô.
//
// Đặc tả: DE-RIENG-CHAN-TRAN-TRUNG.md, mục "luồng chính".
//
// VÌ SAO PHẢI PHÂN TẦNG. Hạ trùng bằng cách cho em này câu dễ hơn em kia là ăn
// gian: điểm hết so sánh được với nhau, và phiếu gửi phụ huynh nói dối. Nên mọi
// em phải cùng một blueprint — đúng số câu mỗi phần, mỗi chuyên đề, mỗi mức độ
// — còn việc hạ trùng làm bên trong từng ô.
//
// Ô = (phần × chuyên đề × mức độ). Số câu mỗi ô suy TẤT ĐỊNH từ cỡ kho theo
// phép chia lớn-dư-trước, nên mọi em ra cùng một bộ khung, và thầy in lại cũng
// ra đúng con số cũ.
import type { SoCauMoiPhan, TeacherExamSource } from '../data/examContent'
import { hashSeed } from './exam-shuffle'
import { CAU_HINH_TRAN_TRUNG_MAC_DINH, sanTrungTrungBinh, thieuBaoNhieuCauDeKhongTrung, type CauHinhDeRiengTranTrung } from './de-rieng-cau-hinh'
import { doTrung, lechTanSuat, sinhBoMotO } from './de-rieng-tran-trung'

export type TenPhan = 'I' | 'II' | 'III'

export interface OBlueprint {
  /** Khoá ô, dùng làm seed và để báo cáo: `I|Ester – lipid|hieu`. */
  khoa: string
  phan: TenPhan
  chuyenDe: string
  mucDo: string
  ids: string[]
  /** Số câu MỖI EM lấy trong ô này. */
  can: number
}

interface CoNhan {
  id: string
  chuyenDe?: string
  mucDo?: string
}

/** CHIA `k` SUẤT CHO CÁC Ô THEO CỠ KHO, lớn-dư-trước.
 *
 * Tất định tuyệt đối: cùng kho, cùng `k` thì luôn ra cùng một bảng phân bổ, nên
 * mọi em cùng blueprint và ca cũ dựng lại không lệch. Ô không đủ câu thì bị cắt
 * xuống bằng cỡ kho của ô, phần dư đẩy sang ô còn chỗ. */
export function chiaSuatChoO(cỡ: number[], k: number): number[] {
  const n = cỡ.length
  const ra = new Array(n).fill(0)
  if (n === 0 || k <= 0) return ra
  const tong = cỡ.reduce((a, b) => a + b, 0)
  if (tong === 0) return ra
  const can = Math.min(k, tong)

  const phan = cỡ.map((c, i) => ({ i, tho: (c * can) / tong }))
  for (const p of phan) ra[p.i] = Math.min(cỡ[p.i], Math.floor(p.tho))
  let con = can - ra.reduce((a, b) => a + b, 0)
  // Dư chia cho ô có phần lẻ lớn nhất; hoà thì ô có kho lớn hơn, rồi tới chỉ số
  // nhỏ hơn — ba mức để không bao giờ phụ thuộc thứ tự sắp xếp của trình duyệt.
  const xep = [...phan].sort((a, b) => {
    const la = a.tho - Math.floor(a.tho)
    const lb = b.tho - Math.floor(b.tho)
    return lb - la || cỡ[b.i] - cỡ[a.i] || a.i - b.i
  })
  let vong = 0
  while (con > 0 && vong < n * 2) {
    let daPhat = false
    for (const p of xep) {
      if (con <= 0) break
      if (ra[p.i] < cỡ[p.i]) {
        ra[p.i]++
        con--
        daPhat = true
      }
    }
    if (!daPhat) break
    vong++
  }
  return ra
}

function goc(q: CoNhan): { chuyenDe: string; mucDo: string } {
  return { chuyenDe: (q.chuyenDe ?? '').trim() || '(chưa gán)', mucDo: (q.mucDo ?? '').trim() || '(chưa gán)' }
}

/** Dựng danh sách ô cho MỘT phần. */
export function dungOChoPhan(cau: CoNhan[], phan: TenPhan, k: number): OBlueprint[] {
  const nhom = new Map<string, { chuyenDe: string; mucDo: string; ids: string[] }>()
  for (const q of cau) {
    const g = goc(q)
    const kh = `${g.chuyenDe}|${g.mucDo}`
    const cu = nhom.get(kh)
    if (cu) cu.ids.push(q.id)
    else nhom.set(kh, { chuyenDe: g.chuyenDe, mucDo: g.mucDo, ids: [q.id] })
  }
  // Thứ tự ô TẤT ĐỊNH theo khoá, không theo thứ tự chèn.
  const ds = [...nhom.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  const suat = chiaSuatChoO(
    ds.map(([, v]) => v.ids.length),
    k,
  )
  return ds.map(([kh, v], i) => ({
    khoa: `${phan}|${kh}`,
    phan,
    chuyenDe: v.chuyenDe,
    mucDo: v.mucDo,
    // Sắp id để pha 1 luôn xáo từ cùng một điểm xuất phát.
    ids: [...v.ids].sort(),
    can: suat[i],
  }))
}

export interface KetQuaSinhBo {
  /** sbd → danh sách id câu. Đúng dạng `bank.boTheoEm` đã có sẵn. */
  boTheoEm: Record<string, string[]>
  /** Đỉnh trùng đo trên TOÀN BỘ bộ câu của từng em (gộp cả ba phần). */
  dinhTrung: number
  trungBinhTrung: number
  /** Lệch tần suất lớn nhất trên mọi ô. */
  lechTanSuat: number
  /** Số câu còn thiếu để đỉnh trùng về 0, tính trên phần chật nhất. */
  thieuDeVeKhong: number
  /** Sàn lý thuyết của trung bình, để biết còn cải thiện được nữa không. */
  san: number
  msChay: number
  canhBao: string[]
}

/** SINH BỘ CÂU CHO CẢ CA, MỘT LƯỢT.
 *
 * Chạy độc lập trong từng ô blueprint rồi gộp lại. Seed lấy từ `maCa` + khoá ô
 * nên cùng ca, cùng kho, cùng danh sách em thì luôn ra đúng một kết quả — chấm
 * lại và dựng lại đề không bao giờ lệch. */
export function sinhBoTheoEm(
  nguon: TeacherExamSource[],
  sbds: string[],
  soCau: SoCauMoiPhan,
  maCa: string,
  cauHinh: CauHinhDeRiengTranTrung = CAU_HINH_TRAN_TRUNG_MAC_DINH,
): KetQuaSinhBo {
  const t0 = Date.now()
  // CHỪA LỀ CHO BƯỚC ĐO CUỐI. Hạn trong `haDinh` tính từ `t0` của cả lượt, nên
  // nếu để đúng bằng trần thì phần đo đỉnh trùng ở cuối đẩy tổng vượt trần —
  // đo được 510 ms so với trần 500 ms. Chừa 12% là đủ, và KHÔNG nới trần.
  const hanTrong: CauHinhDeRiengTranTrung = { ...cauHinh, NGAN_SACH_MS: Math.max(1, Math.floor(cauHinh.NGAN_SACH_MS * 0.88)) }
  const canhBao: string[] = []
  const em = sbds.map((s) => String(s || '').trim()).filter(Boolean)
  const m = em.length
  const boTheoEm: Record<string, string[]> = {}
  for (const s of em) boTheoEm[s] = []
  if (m === 0) {
    canhBao.push('Không có em nào trong danh sách — không sinh được bộ câu.')
    return { boTheoEm, dinhTrung: 0, trungBinhTrung: 0, lechTanSuat: 0, thieuDeVeKhong: 0, san: 0, msChay: 0, canhBao }
  }

  const gop = <T extends CoNhan>(lay: (s: TeacherExamSource) => T[]): T[] => {
    const ra: T[] = []
    const daCo = new Set<string>()
    for (const s of nguon) {
      for (const q of lay(s)) {
        if (!q?.id || daCo.has(q.id)) continue
        daCo.add(q.id)
        ra.push(q)
      }
    }
    return ra
  }

  const phanIds: { phan: TenPhan; cau: CoNhan[]; k: number }[] = [
    { phan: 'I', cau: gop((s) => s.phanI), k: soCau.I },
    { phan: 'II', cau: gop((s) => s.phanII), k: soCau.II },
    { phan: 'III', cau: gop((s) => s.phanIII), k: soCau.III },
  ]

  let lech = 0
  let thieu = 0
  let sanTong = 0
  for (const p of phanIds) {
    if (p.k <= 0) continue
    if (p.cau.length === 0) {
      canhBao.push(`Phần ${p.phan}: kho rỗng, không phát được câu nào.`)
      continue
    }
    if (p.cau.length < p.k) {
      canhBao.push(`Phần ${p.phan}: kho ${p.cau.length} câu, ít hơn ${p.k} câu mỗi em cần — mọi em nhận trọn kho.`)
    }
    thieu += thieuBaoNhieuCauDeKhongTrung(p.cau.length, Math.min(p.k, p.cau.length), m)
    sanTong += sanTrungTrungBinh(p.cau.length, Math.min(p.k, p.cau.length), m)

    for (const o of dungOChoPhan(p.cau, p.phan, p.k)) {
      if (o.can <= 0) continue
      const bo = sinhBoMotO(o.ids, o.can, m, hashSeed(`${maCa}:${o.khoa}`), hanTrong, t0)
      const l = lechTanSuat(bo, o.ids)
      if (l > lech) lech = l
      for (let i = 0; i < m; i++) boTheoEm[em[i]].push(...bo[i])
    }
  }

  // Đỉnh đo trên bộ ĐÃ GỘP: đó mới là thứ hai em ngồi cạnh nhau nhìn thấy.
  const tapEm = em.map((s) => new Set(boTheoEm[s]))
  const d = doTrung(tapEm)
  for (const s of em) boTheoEm[s].sort()
  return {
    boTheoEm,
    dinhTrung: d.dinh,
    trungBinhTrung: d.trungBinh,
    lechTanSuat: lech,
    thieuDeVeKhong: thieu,
    san: sanTong,
    msChay: Date.now() - t0,
    canhBao,
  }
}
