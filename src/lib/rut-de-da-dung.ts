// CHẾ ĐỘ "KIỂM CHỨNG CÂU ĐÃ ĐÚNG" (thầy yêu cầu 02/10) — HÀM THUẦN, dùng chung máy thầy (chạy thử lúc mở ca, chốt lúc Bắt đầu) và
// máy chủ (`/vao-thi` lấp riêng cho em vào phòng sau khi đã chốt — server/src/cau-da-dung.ts). Không gọi mạng, không đọc đồng hồ.
//
// Nguyên văn thầy: "Cho tôi thêm một chế độ giao đề chỉ chọn câu làm đúng trong tất cả chiến dịch đã làm bốc ngẫu nhiên nhưng đúng
// ma trận 2026 theo tỷ lệ từng câu. Ghi rõ nhãn trong bài thi đã làm đúng ở ca nào, mức độ gì. Khi kết thúc bài thi thì hs nào sai
// nhiều câu đã làm đúng hiển thị lên trên trước cho tôi biết."
//
// LUẬT:
//   1. Nguồn câu của mỗi em = câu thuộc BẤT KỲ chiến dịch nào em có mặt mà em đã TỰ LÀM ĐÚNG ít nhất một lần (máy chủ lọc — xem
//      server/src/cau-da-dung.ts). Câu đúng rồi sau đó lại sai VẪN vào nguồn (mục đích là kiểm chứng); số lần đúng/sai ghi kèm cho thầy.
//   2. Số câu của ca chia theo TỶ LỆ ma trận 2026 (MA_TRAN_HOA_2026): trước chia số câu từng PHẦN theo 18 : 4 : 6, rồi trong mỗi phần
//      chia theo mức độ của phần ấy — cả hai bước bằng phần dư lớn nhất ⇒ tổng luôn đúng bằng số câu ca; ca 28 câu ⇒ đúng y ma trận.
//   3. Thiếu câu đúng ở một ô (thầy 05/10: "không rút đủ câu đúng thì bù câu khác trong kho mức độ tương đương", em không bị chặn):
//      (a) câu KHÁC trong kho ca CÙNG phần, CÙNG mức độ; (b) câu em đã đúng cùng phần, mức gần nhất; (c) câu kho cùng phần, mức gần
//      nhất; hết sạch mới để trống. Câu bù KHÔNG mang nhãn "đã làm đúng" (không ghi sai sự thật cho em); thầy thấy số câu bù từng em.
//   4. Bốc NGẪU NHIÊN có hạt giống (mã ca + SBD) ⇒ chấm lại tái tạo được; câu nhiều em cùng có xoay vòng theo số em đã nhận ⇒ hai em
//      ngồi cạnh khác nhau khi kho đủ.
//   5. Nhãn mỗi câu = nơi của LẦN ĐÚNG GẦN NHẤT + ngày + mức độ ("Ca Kiểm tra tuần 3 · 28/09 · Thông hiểu"). Không mã nội bộ.
// GIẢ ĐỊNH ĐÃ CHỐT: "đã làm đúng ở ca nào" = nơi của lần đúng gần nhất; câu đúng rồi sai lại vẫn vào nguồn; thiếu câu đúng thì bù câu
// kho mức độ tương đương (luật 3) — em chưa đúng câu nào vẫn có đủ đề.
import { MA_TRAN_HOA_2026 } from './ma-tran-hoa-2026'
import { bam, PHAN_V2, type CauKhoV2, type PhanV2 } from './rut-de-v2'

export const CHE_DO_DA_DUNG = 'da_dung' as const
export type MucMaTran = 'biet' | 'hieu' | 'van_dung'
export const MUC_MA_TRAN: readonly MucMaTran[] = ['biet', 'hieu', 'van_dung']
/** Chữ mức độ của CÂU (bảng từ chuẩn: Nhận biết · Thông hiểu · Vận dụng). */
export const TEN_MUC_DO_CAU: Record<string, string> = { biet: 'Nhận biết', hieu: 'Thông hiểu', van_dung: 'Vận dụng' }

// ---------------------------------------------------------------- phân bổ ma trận

/** Chia `n` theo trọng số bằng phần dư lớn nhất. Hoà phần dư ⇒ trọng số lớn hơn trước, rồi vị trí đứng trước. Tổng luôn = n. */
export function chiaPhanDuLonNhat(n: number, trongSo: readonly number[]): number[] {
  const N = Math.max(0, Math.floor(Number(n) || 0))
  const tong = trongSo.reduce((a, b) => a + Math.max(0, b), 0)
  if (N === 0 || tong === 0) return trongSo.map(() => 0)
  const chia = trongSo.map((w, i) => {
    const t = (N * Math.max(0, w)) / tong
    return { i, w: Math.max(0, w), nguyen: Math.floor(t), du: t - Math.floor(t) }
  })
  let con = N - chia.reduce((a, x) => a + x.nguyen, 0)
  for (const x of [...chia].sort((a, b) => b.du - a.du || b.w - a.w || a.i - b.i)) {
    if (con <= 0) break
    if (x.w === 0) continue
    x.nguyen++
    con--
  }
  return chia.map((x) => x.nguyen)
}

export type PhanBoMaTran = Record<PhanV2, Record<MucMaTran, number>>

/** Số câu từng ô (phần × mức độ) cho ca `n` câu, theo tỷ lệ MA_TRAN_HOA_2026. 28 ⇒ đúng y ma trận; 14 ⇒ 9·2·3. */
export function phanBoMaTran2026(n: number): PhanBoMaTran {
  const tongPhan = PHAN_V2.map((p) => MUC_MA_TRAN.reduce((a, m) => a + MA_TRAN_HOA_2026[p][m], 0))
  const theoPhan = chiaPhanDuLonNhat(n, tongPhan)
  const ra = {} as PhanBoMaTran
  PHAN_V2.forEach((p, i) => {
    const theoMuc = chiaPhanDuLonNhat(theoPhan[i]!, MUC_MA_TRAN.map((m) => MA_TRAN_HOA_2026[p][m]))
    ra[p] = { biet: theoMuc[0]!, hieu: theoMuc[1]!, van_dung: theoMuc[2]! }
  })
  return ra
}

/** Số câu từng phần (ghi vào `so_cau_json` của ca). */
export function soCauTheoPhan(pb: PhanBoMaTran): Record<PhanV2, number> {
  const ra = { I: 0, II: 0, III: 0 } as Record<PhanV2, number>
  for (const p of PHAN_V2) ra[p] = MUC_MA_TRAN.reduce((a, m) => a + pb[p][m], 0)
  return ra
}

/** Một dòng chữ mô tả phân bổ cho màn thầy: "Phần I: 9 câu (Nhận biết 6 · Thông hiểu 2 · Vận dụng 1) · …". */
export function chuPhanBo(pb: PhanBoMaTran): string {
  return PHAN_V2.filter((p) => MUC_MA_TRAN.some((m) => pb[p][m] > 0))
    .map((p) => {
      const n = MUC_MA_TRAN.reduce((a, m) => a + pb[p][m], 0)
      return `Phần ${p}: ${n} câu (${MUC_MA_TRAN.filter((m) => pb[p][m] > 0).map((m) => `${TEN_MUC_DO_CAU[m]} ${pb[p][m]}`).join(' · ')})`
    })
    .join(' · ')
}

// ---------------------------------------------------------------- nhãn

/** 'YYYY-MM-DD' ⇒ 'dd/mm'; hỏng ⇒ ''. */
export function ngayNgan(ngay: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(ngay ?? ''))
  return m ? `${m[3]}/${m[2]}` : ''
}

/** Nhãn một câu (không kèm chữ "Em đã làm đúng:" — máy em tự thêm): "Ca Kiểm tra tuần 3 · 28/09 · Thông hiểu". */
export function taoNhanDaDung(noi: string, ngay: string, mucDo: string): string {
  return [String(noi ?? '').trim(), ngayNgan(ngay), TEN_MUC_DO_CAU[mucDo] ?? ''].filter(Boolean).join(' · ')
}

/** Chữ đầy đủ máy em in dưới số câu. */
export const chuNhanDaDung = (nhan: string): string => `Em đã làm đúng: ${String(nhan ?? '').trim()}`

// ---------------------------------------------------------------- rút

/** Một câu em đã tự làm đúng (máy chủ `/ca/cau-da-dung` trả, máy thầy gắn phần/mức theo kho đề). */
export interface CauDaDung {
  qid: string
  phan: PhanV2
  /** 'biet' | 'hieu' | 'van_dung' | '' (chưa gắn). */
  mucDo: string
  dang?: string
  /** Nhãn hiện cho em (không mã nội bộ). */
  nhan: string
  /** ISO của lần đúng gần nhất. */
  lucDung?: string
  soLanDung: number
  soLanSai: number
}

export interface CauRutDaDung {
  qid: string
  phan: PhanV2
  mucDo: string
  /** Mức của ô câu này lấp (khác `mucDo` ⇒ ô mượn mức gần nhất). */
  mucO: string
  lechMuc?: boolean
  /** Câu BÙ từ kho (em chưa làm đúng câu này) — không nhãn "đã làm đúng". */
  bu?: boolean
}

/** Một câu trong kho ca dùng để BÙ (luật 3) — đã bỏ tự luận và câu song sinh ở nơi gọi. */
export interface CauKhoBu {
  qid: string
  phan: PhanV2
  mucDo: string
}

export interface ThieuDaDung {
  phan: PhanV2
  mucDo: MucMaTran
  so: number
}

export interface DauVaoDaDung {
  /** sbd → câu em đã tự làm đúng. */
  nguon: Record<string, readonly CauDaDung[] | undefined>
  dsSbd: readonly string[]
  /** Tổng số câu của ca (chia theo tỷ lệ ma trận 2026). */
  tongCau: number
  /** Hạt giống tất định (mã ca). */
  seed: string
  /** Số em đã nhận mỗi câu (lượt rút trước) — rút thêm cho em vào sau vẫn xoay vòng. */
  daDung?: Record<string, number>
  /** Kho ca để BÙ khi em không đủ câu đã đúng (luật 3). Vắng ⇒ không bù (ô thiếu để trống). */
  khoBu?: readonly CauKhoBu[]
}

export interface KetQuaDaDung {
  phanBo: PhanBoMaTran
  theoEm: Record<string, CauRutDaDung[]>
  /** sbd → ô vẫn TRỐNG sau khi đã bù (kho ca không còn câu cùng phần). */
  thieu: Record<string, ThieuDaDung[]>
  /** sbd → số câu BÙ từ kho (em chưa làm đúng đủ câu) — báo thầy. */
  bu: Record<string, number>
  /** sbd → qid → nhãn hiện cho em. */
  nhan: Record<string, Record<string, string>>
  /** sbd → qid → [số lần đúng, số lần sai] (chỉ thầy xem). */
  dem: Record<string, Record<string, [number, number]>>
  daDung: Record<string, number>
}

const viTriMuc = (m: string): number => {
  const i = (MUC_MA_TRAN as readonly string[]).indexOf(m)
  return i < 0 ? MUC_MA_TRAN.length : i
}

/** Kho ca (`khoTuNguon` — đã bỏ tự luận) ⇒ câu dùng để BÙ: bỏ câu song sinh (song sinh chỉ dùng chữa lỗi của chính câu gốc). */
export function khoBuTuKho(kho: readonly Pick<CauKhoV2, 'id' | 'phan' | 'mucDo' | 'songSinhCua'>[]): CauKhoBu[] {
  return kho.filter((c) => !c.songSinhCua).map((c) => ({ qid: c.id, phan: c.phan, mucDo: c.mucDo }))
}

/** Rút cho cả danh sách em. Tất định theo (nguồn, seed, thứ tự dsSbd đã sắp, daDung). */
export function rutDeDaDung(dv: DauVaoDaDung): KetQuaDaDung {
  const phanBo = phanBoMaTran2026(dv.tongCau)
  const daDung: Record<string, number> = { ...(dv.daDung ?? {}) }
  const ra: KetQuaDaDung = { phanBo, theoEm: {}, thieu: {}, bu: {}, nhan: {}, dem: {}, daDung }
  const khoBu = [...new Map((dv.khoBu ?? []).filter((c) => c && c.qid && PHAN_V2.includes(c.phan)).map((c) => [c.qid, c] as const)).values()]
  const dsSbd = [...new Set(dv.dsSbd.map((s) => String(s).trim()).filter(Boolean))].sort()
  for (const sbd of dsSbd) {
    const hat = bam(`${dv.seed}|${sbd}`)
    const diem = (q: string) => (daDung[q] ?? 0) * 4294967296 + (Math.imul(bam(q) ^ hat, 2654435761) >>> 0)
    // Khử trùng qid, chỉ giữ câu có phần hợp lệ.
    const theoId = new Map<string, CauDaDung>()
    for (const c of dv.nguon[sbd] ?? []) if (c && c.qid && PHAN_V2.includes(c.phan) && !theoId.has(c.qid)) theoId.set(c.qid, c)
    const chon = new Set<string>()
    const bo: CauRutDaDung[] = []
    const thieu: ThieuDaDung[] = []
    for (const p of PHAN_V2) {
      const dsP = [...theoId.values()].filter((c) => c.phan === p).sort((a, b) => diem(a.qid) - diem(b.qid) || a.qid.localeCompare(b.qid))
      const can = { ...phanBo[p] }
      const cuaP: CauRutDaDung[] = []
      const nhan = (c: CauDaDung, mucO: MucMaTran) => {
        chon.add(c.qid)
        daDung[c.qid] = (daDung[c.qid] ?? 0) + 1
        cuaP.push({ qid: c.qid, phan: p, mucDo: c.mucDo, mucO, ...(c.mucDo !== mucO ? { lechMuc: true } : {}) })
      }
      const nhanBu = (c: CauKhoBu, mucO: MucMaTran) => {
        chon.add(c.qid)
        daDung[c.qid] = (daDung[c.qid] ?? 0) + 1
        cuaP.push({ qid: c.qid, phan: p, mucDo: c.mucDo, mucO, bu: true, ...(c.mucDo !== mucO ? { lechMuc: true } : {}) })
      }
      const buP = khoBu.filter((c) => c.phan === p && !theoId.has(c.qid)).sort((a, b) => diem(a.qid) - diem(b.qid) || a.qid.localeCompare(b.qid))
      const gan = (mucCau: string, m: MucMaTran) => Math.abs(viTriMuc(mucCau) - viTriMuc(m)) * 2 + (viTriMuc(mucCau) > viTriMuc(m) ? 1 : 0)
      // (1) câu em đã đúng, ĐÚNG mức — cho MỌI ô của phần trước (ô mượn mức không giành câu của ô đúng mức).
      for (const m of MUC_MA_TRAN) {
        for (const c of dsP) {
          if (can[m] <= 0) break
          if (c.mucDo === m && !chon.has(c.qid)) { nhan(c, m); can[m]-- }
        }
      }
      // (2) còn thiếu ⇒ BÙ câu khác trong kho ca CÙNG mức độ (thầy 05/10: "bù câu khác trong kho mức độ tương đương").
      for (const m of MUC_MA_TRAN) {
        for (const c of buP) {
          if (can[m] <= 0) break
          if (c.mucDo === m && !chon.has(c.qid)) { nhanBu(c, m); can[m]-- }
        }
      }
      // (3) vẫn thiếu ⇒ câu em đã đúng cùng phần, mức gần nhất (hoà ⇒ mức thấp hơn trước); câu chưa gắn mức xếp cuối;
      // (4) rồi câu kho cùng phần, mức gần nhất; (5) hết sạch ⇒ để trống và báo.
      for (const m of MUC_MA_TRAN) {
        while (can[m] > 0) {
          let best: CauDaDung | undefined
          let bk = Infinity
          for (const c of dsP) {
            if (chon.has(c.qid)) continue
            const k = gan(c.mucDo, m)
            if (k < bk) { bk = k; best = c }
          }
          if (!best) break
          nhan(best, m)
          can[m]--
        }
        while (can[m] > 0) {
          let best: CauKhoBu | undefined
          let bk = Infinity
          for (const c of buP) {
            if (chon.has(c.qid)) continue
            const k = gan(c.mucDo, m)
            if (k < bk) { bk = k; best = c }
          }
          if (!best) break
          nhanBu(best, m)
          can[m]--
        }
        if (can[m] > 0) thieu.push({ phan: p, mucDo: m, so: can[m] })
      }
      bo.push(...cuaP)
    }
    ra.theoEm[sbd] = bo
    if (thieu.length > 0) ra.thieu[sbd] = thieu
    const soBu = bo.filter((c) => c.bu).length
    if (soBu > 0) ra.bu[sbd] = soBu
    // Câu bù: nhãn rỗng (máy em không in "Em đã làm đúng") và đúng/sai cũ 0·0.
    ra.nhan[sbd] = Object.fromEntries(bo.map((c) => [c.qid, c.bu ? '' : theoId.get(c.qid)!.nhan]))
    ra.dem[sbd] = Object.fromEntries(bo.map((c) => [c.qid, c.bu ? [0, 0] as [number, number] : [theoId.get(c.qid)!.soLanDung, theoId.get(c.qid)!.soLanSai] as [number, number]]))
  }
  return ra
}

/** Câu báo thầy cho một em còn ô trống SAU KHI ĐÃ BÙ: gộp theo phần — "An thiếu 2 câu Phần III vì kho ca không đủ câu". */
export function chuThieuDaDung(ten: string, ds: readonly ThieuDaDung[]): string[] {
  const theoPhan = new Map<PhanV2, number>()
  for (const t of ds) theoPhan.set(t.phan, (theoPhan.get(t.phan) ?? 0) + t.so)
  return PHAN_V2.filter((p) => (theoPhan.get(p) ?? 0) > 0).map((p) => `${ten} thiếu ${theoPhan.get(p)} câu Phần ${p} vì kho ca không đủ câu`)
}

/** Gộp lượt rút thêm (em vào phòng sau) vào kết quả chạy thử — em đã có bộ GIỮ NGUYÊN. */
export function gopKetQuaDaDung(cu: KetQuaDaDung, them: KetQuaDaDung): KetQuaDaDung {
  const ra: KetQuaDaDung = { ...cu, theoEm: { ...cu.theoEm }, thieu: { ...cu.thieu }, bu: { ...(cu.bu ?? {}) }, nhan: { ...cu.nhan }, dem: { ...cu.dem }, daDung: { ...them.daDung } }
  for (const [sbd, ds] of Object.entries(them.theoEm)) {
    if (ra.theoEm[sbd]) continue
    ra.theoEm[sbd] = ds
    if (them.thieu[sbd]) ra.thieu[sbd] = them.thieu[sbd]!
    if (them.bu?.[sbd]) ra.bu[sbd] = them.bu[sbd]!
    ra.nhan[sbd] = them.nhan[sbd] ?? {}
    ra.dem[sbd] = them.dem[sbd] ?? {}
  }
  return ra
}

/** Bản đồ gửi máy chủ: `bo` (bộ câu), `daDung` (nhãn — máy chủ CHỈ trả phần của chính em), `demDaDung` (đúng/sai cũ — chỉ thầy xem). */
export function banDoDaDung(kq: Pick<KetQuaDaDung, 'theoEm' | 'nhan' | 'dem'>): { bo: Record<string, string[]>; daDung: Record<string, Record<string, string>>; demDaDung: Record<string, Record<string, [number, number]>> } {
  const bo: Record<string, string[]> = {}
  const daDung: Record<string, Record<string, string>> = {}
  const demDaDung: Record<string, Record<string, [number, number]>> = {}
  for (const [sbd, ds] of Object.entries(kq.theoEm)) {
    if (ds.length === 0) continue
    bo[sbd] = ds.map((c) => c.qid)
    // Câu BÙ (nhãn rỗng) không vào bảng nhãn — máy em chỉ in "Em đã làm đúng" cho câu thật sự đã đúng.
    daDung[sbd] = Object.fromEntries(ds.map((c) => [c.qid, kq.nhan[sbd]?.[c.qid] ?? '']).filter(([, n]) => n))
    demDaDung[sbd] = Object.fromEntries(ds.map((c) => [c.qid, kq.dem[sbd]?.[c.qid] ?? [0, 0]]))
  }
  return { bo, daDung, demDaDung }
}

/** Nhãn "đã làm đúng" của MỘT em, đọc phòng thủ: qid → nhãn (chuỗi ≤ 160 ký tự). */
export function daDungCuaEm(v: unknown): Record<string, string> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const ra: Record<string, string> = {}
  for (const [q, n] of Object.entries(v as Record<string, unknown>)) {
    const qid = String(q ?? '').trim()
    if (!qid || typeof n !== 'string' || !n.trim()) continue
    ra[qid] = n.trim().slice(0, 160)
  }
  return ra
}

// ---------------------------------------------------------------- kết thúc bài: em sai lại câu đã làm đúng

export interface CauSaiLaiDaDung {
  soCau: number
  phan: 'I' | 'II' | 'III'
  qid: string
  nhan: string
  soLanDung?: number
  soLanSai?: number
}
export interface EmSaiLaiDaDung {
  sbd: string
  hoTen: string
  /** Số câu đã làm đúng có trong đề của em (đã chấm). */
  tong: number
  sai: CauSaiLaiDaDung[]
}

/** Xếp em SAI NHIỀU câu đã làm đúng NHẤT lên đầu (thầy: "hiển thị lên trên trước cho tôi biết"); hoà ⇒ tỉ lệ sai cao hơn, rồi tên. */
export function xepSaiLaiDaDung(ds: readonly EmSaiLaiDaDung[]): EmSaiLaiDaDung[] {
  const tiLe = (e: EmSaiLaiDaDung) => (e.tong > 0 ? e.sai.length / e.tong : 0)
  return [...ds]
    .filter((e) => e.tong > 0)
    .sort((a, b) => b.sai.length - a.sai.length || tiLe(b) - tiLe(a) || (a.hoTen || a.sbd).localeCompare(b.hoTen || b.sbd, 'vi'))
}
