// RÚT ĐỀ CA KIỂM TRA v2 (02/10) — THANG LẤP TỪNG Ô CỦA TỪNG EM. Hàm THUẦN, dùng chung máy thầy (chạy thử lúc mở ca, chốt lúc Bắt đầu)
// và máy chủ (`/vao-thi` lấp riêng cho em vào phòng sau khi đã chốt — server/src/rut-de-v2.ts). Không gọi mạng, không đọc đồng hồ.
//
// LUẬT (đặc tả "Rút đề ca thi v2"):
//   1. Ma trận = số câu từng phần (CỨNG mọi ca) + mức độ từng ô. Ca đánh giá (> 10 câu) mức độ cũng CỨNG: ô Thông hiểu chỉ nhận câu
//      Thông hiểu chừng nào kho còn câu như thế. Ca ngắn (≤ 10 câu) và Kiểm tra điểm yếu: mức độ SÁT NHẤT có thể.
//   2. Ô dành cho lỗi của em (trần 30% mỗi phần ở ca thường; Kiểm tra điểm yếu: cả phần) lấp theo thang:
//        câu đúng mục đích (lỗi đến hạn, chính câu gốc) → câu SONG SINH (`<gốc>~ss0|1`, chỉ khi kho ca có) → câu CÙNG DẠNG chưa gặp.
//      Luật đóng lỗi bảo "lượt tới nên là song sinh" (`nenSongSinh`) mà kho có song sinh ⇒ không dùng lại câu gốc.
//      Kiểm tra điểm yếu: ƯU TIÊN song sinh (song sinh → gốc → cùng dạng).
//   3. Ô còn lại: câu MỚI (em chưa gặp) đúng phần + mức độ → câu đã gặp lâu nhất (kho thiếu) → lệch mức độ gần nhất. Không bao giờ để trống
//      ô khi kho còn câu — một em thiếu không được chặn cả phòng.
//   4. Câu LÝ THUYẾT em đã gặp chỉ quay lại sau ≥ 30 ngày (kể cả câu gốc của lỗi: khi đó dùng song sinh/cùng dạng để kiểm chứng).
//   5. Không câu tự luận: `khoTuNguon` lọc bằng `laCauRutDuoc` (src/lib/cau-tu-luan.ts).
//   6. Mỗi câu ghi `bac` (bậc lấp) để thầy xem; câu xoay vòng theo số em đã nhận ⇒ hai em ngồi cạnh ít trùng nhất.
import { dangCua } from './dang-cau'
import { laCauRutDuoc } from './cau-tu-luan'

export type PhanV2 = 'I' | 'II' | 'III'
export const PHAN_V2: readonly PhanV2[] = ['I', 'II', 'III']
export type BacLap = 'muc_dich' | 'song_sinh' | 'cung_dang' | 'moi' | 'nhac_lai'
export const MOI_BAC_LAP: readonly BacLap[] = ['muc_dich', 'song_sinh', 'cung_dang', 'moi', 'nhac_lai']
/** Chữ trên màn THẦY (bảng Xem trước phân bổ). */
export const TEN_BAC_LAP: Record<BacLap, string> = {
  muc_dich: 'Câu sai đến lịch ôn lại',
  song_sinh: 'Câu song sinh',
  cung_dang: 'Câu cùng dạng',
  moi: 'Câu mới',
  nhac_lai: 'Câu đã gặp (kho thiếu)',
}
/** Bậc lấp tính là "câu hỏi lại" (đi vào `lap` của bản đồ — màn ca đánh dấu, khối "còn sai lại" đếm). */
export const BAC_HOI_LAI: ReadonlySet<BacLap> = new Set<BacLap>(['muc_dich', 'song_sinh', 'cung_dang'])
export const NGAY_QUAY_LAI_LY_THUYET = 30
/** Ca ≤ 10 câu là ca ngắn: mức độ sát nhất có thể, không cứng. */
export const NGUONG_CA_NGAN = 10
/** Trần ô dành cho lỗi ở ca thường: 30% số câu mỗi phần, làm tròn lên (14 câu 9·2·3 ⇒ 3·1·1). */
export const TI_LE_MUC_DICH_CA = 0.3

export interface CauKhoV2 {
  id: string
  phan: PhanV2
  /** 'biet' | 'hieu' | 'van_dung' | '' (chưa gắn). */
  mucDo: string
  /** Khoá dạng: mã dạng của kho, không có thì `CD:<chuyên đề>`; rỗng = không rõ. */
  dang: string
  lyThuyet: boolean
  /** Câu song sinh `<gốc>~ssK` ⇒ qid gốc. Song sinh chỉ dùng cho lỗi của chính câu gốc, không làm "câu mới". */
  songSinhCua?: string
}

export interface LoiEmV2 {
  qid: string
  /** Ngày VN đến hạn ('YYYY-MM-DD'); rỗng = không còn việc. */
  denHan: string
  trangThai: string
  /** Chỉ số song sinh nên dùng ở lượt tới (hàng chữa lỗi `songSinhCho`). */
  songSinh?: number
  nenSongSinh?: boolean
  /** Meta câu gốc (máy chủ gửi kèm) — cần khi câu gốc không nằm trong kho ca. */
  phan?: PhanV2
  mucDo?: string
  dang?: string
}

export interface HoSoEmV2 {
  loi: LoiEmV2[]
  /** qid → ngày VN gần nhất em gặp câu (mọi kênh). */
  daGap?: Record<string, string>
  /** Ca "Không rút câu sai": câu em đã gặp ở các ca kiểm tra trước (cấm cứng). Hết câu mới thì nới câu cấm mềm trước, câu này sau cùng. */
  camCung?: readonly string[]
}

export interface CauRutV2 {
  qid: string
  phan: PhanV2
  mucDo: string
  bac: BacLap
  /** Câu lấp thay cho lỗi nào (song sinh / cùng dạng / chính nó). */
  goc?: string
  /** Ô này phải nhận câu khác mức độ (kho hết câu đúng mức). */
  lechMuc?: boolean
}

export interface OThieuV2 {
  phan: PhanV2
  mucDo: string
  /** Lấp bằng gì; 'trong' = kho cạn, ô bỏ trống (máy em tự bù từ gói đề ca). */
  bac: BacLap | 'trong'
  qid?: string
  lyDo: string
}

export interface DauVaoRutV2 {
  kho: readonly CauKhoV2[]
  soCau: Record<PhanV2, number>
  dsSbd: readonly string[]
  hoSo: Record<string, HoSoEmV2 | undefined>
  /** Ngày VN của ca ('YYYY-MM-DD'). */
  ngay: string
  cheDo: 'ca' | 'diem_yeu'
  /** Hạt giống tất định (mã ca). */
  seed: string
  tiLeMucDich?: number
  /** Số em đã nhận mỗi câu (từ lượt rút trước) — để rút thêm cho em vào sau vẫn xoay vòng. */
  daDung?: Record<string, number>
  /** Mức độ từng ô; vắng ⇒ tính theo tỉ lệ mức độ của kho. */
  mucTieu?: Record<PhanV2, string[]>
  /**
   * 06/10 — qid → `content_group` (băm nội dung). Hai câu khác mã cùng nhóm là MỘT câu: (a) lần gặp của câu này tính cho cả nhóm (bản trùng của câu em vừa làm
   * không ra như câu mới); (b) bộ câu của MỘT em không có hai câu cùng nhóm (giữ câu được chọn trước). Câu vắng trong bảng này ⇒ coi là khác mọi câu (không đoán).
   * Không truyền ⇒ y như cũ. Luật đóng lỗi KHÔNG đổi theo nhóm.
   */
  nhomTrung?: Record<string, string>
}

export interface KetQuaRutV2 {
  theoEm: Record<string, CauRutV2[]>
  thieu: Record<string, OThieuV2[]>
  daDung: Record<string, number>
  mucTieu: Record<PhanV2, string[]>
  /** Mức độ là ràng buộc cứng (ca đánh giá > 10 câu). */
  mucDoCung: boolean
  /** Số lỗi đến hạn của em CHƯA xếp được vào đề (vượt trần / kho không có câu dùng được). */
  loiChuaXep: Record<string, number>
}

// ---------------------------------------------------------------- tiện ích

const THU_TU_MUC = ['biet', 'hieu', 'van_dung', 'van_dung_cao', '']
const viTriMuc = (m: string): number => {
  const i = THU_TU_MUC.indexOf(m)
  return i < 0 ? THU_TU_MUC.length : i
}
/** FNV-1a — tất định, không phụ thuộc thư viện (máy chủ dùng chung). */
export function bam(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
const MS_NGAY = 86_400_000
/** Số ngày từ `tu` tới `den` (cả hai 'YYYY-MM-DD'); hỏng ⇒ 0 (coi như vừa gặp — an toàn cho luật 30 ngày). */
export function soNgayGiua(tu: string, den: string): number {
  const a = Date.parse(`${String(tu).slice(0, 10)}T00:00:00Z`)
  const b = Date.parse(`${String(den).slice(0, 10)}T00:00:00Z`)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return Math.round((b - a) / MS_NGAY)
}
// 06/10: "~bt<k>" (biến thể bằng mã, server/src/bien-the-sinh.ts) cũng là câu đổi số của câu gốc — ca "Kiểm chứng câu đã đúng" nối nó vào kho ca như song sinh.
export const laQidSongSinh = (qid: string): boolean => /~(?:ss|bt)\d+$/.test(qid)
export const gocCuaSongSinh = (qid: string): string => qid.replace(/~(?:ss|bt)\d+$/, '')

/** Mức độ từng ô theo tỉ lệ mức độ của kho (chia phần dư lớn nhất) — cùng cho mọi em ⇒ ma trận cả lớp như nhau. */
export function mucTieuTheoKho(kho: readonly CauKhoV2[], soCau: Record<PhanV2, number>): Record<PhanV2, string[]> {
  const ra = { I: [], II: [], III: [] } as Record<PhanV2, string[]>
  for (const p of PHAN_V2) {
    const n = Math.max(0, Math.floor(Number(soCau[p]) || 0))
    if (n === 0) continue
    const dem = new Map<string, number>()
    for (const c of kho) if (c.phan === p && !c.songSinhCua) dem.set(c.mucDo, (dem.get(c.mucDo) ?? 0) + 1)
    const tong = [...dem.values()].reduce((a, b) => a + b, 0)
    if (tong === 0) {
      ra[p] = Array.from({ length: n }, () => '')
      continue
    }
    const muc = [...dem.keys()].sort((a, b) => viTriMuc(a) - viTriMuc(b) || a.localeCompare(b))
    const chia = muc.map((m) => {
      const t = (n * (dem.get(m) ?? 0)) / tong
      return { m, nguyen: Math.floor(t), du: t - Math.floor(t) }
    })
    let con = n - chia.reduce((a, x) => a + x.nguyen, 0)
    for (const x of [...chia].sort((a, b) => b.du - a.du || viTriMuc(a.m) - viTriMuc(b.m))) {
      if (con <= 0) break
      x.nguyen++
      con--
    }
    for (const x of chia) for (let i = 0; i < x.nguyen; i++) ra[p].push(x.m)
  }
  return ra
}

/** Câu kiểu đề thầy (TeacherExamSource) — khuôn tối thiểu để máy chủ dùng chung mà không kéo cả `examContent`. */
export interface CauNguonV2 {
  id: string
  text?: string
  mucDo?: unknown
  chuyenDe?: string
  dang?: { ma?: string } | null
  choices?: unknown[]
  ideas?: unknown[]
  correct?: unknown
  kieu?: string
}
export interface NguonV2 {
  phanI?: readonly CauNguonV2[]
  phanII?: readonly CauNguonV2[]
  phanIII?: readonly CauNguonV2[]
}

/** Dàn kho đề (có đáp án) thành ứng viên v2. Bỏ câu TỰ LUẬN (`laCauRutDuoc`) và câu trùng id. */
export function khoTuNguon(nguon: readonly NguonV2[]): CauKhoV2[] {
  const ra: CauKhoV2[] = []
  const da = new Set<string>()
  for (const s of nguon) {
    const day: [PhanV2, readonly CauNguonV2[] | undefined][] = [['I', s.phanI], ['II', s.phanII], ['III', s.phanIII]]
    for (const [phan, ds] of day) {
      for (const q of ds ?? []) {
        if (!q || typeof q.id !== 'string' || !q.id || da.has(q.id)) continue
        if (!laCauRutDuoc(q, phan)) continue
        da.add(q.id)
        const mucDo = q.mucDo === 'biet' || q.mucDo === 'hieu' || q.mucDo === 'van_dung' ? q.mucDo : ''
        const ma = String(q.dang?.ma ?? '').trim()
        const cd = String(q.chuyenDe ?? '').trim()
        const lt =
          dangCua({
            phan,
            text: q.text,
            luaChon: (phan === 'I' ? q.choices : phan === 'II' ? q.ideas : []) as (string | undefined)[] | undefined,
            dapAn: phan === 'III' ? String(q.correct ?? '') : '',
            mucDo: typeof q.mucDo === 'string' ? q.mucDo : undefined,
            kieu: q.kieu,
          }) === 'ly_thuyet'
        ra.push({ id: q.id, phan, mucDo, dang: ma || (cd ? `CD:${cd}` : ''), lyThuyet: lt, ...(laQidSongSinh(q.id) ? { songSinhCua: gocCuaSongSinh(q.id) } : {}) })
      }
    }
  }
  return ra
}

// ---------------------------------------------------------------- thuật toán

interface ChiMuc {
  theoId: Map<string, CauKhoV2>
  songSinhCua: Map<string, CauKhoV2[]>
  theoPhan: Map<PhanV2, CauKhoV2[]>
  theoDang: Map<string, CauKhoV2[]>
  bamId: Map<string, number>
}

function dungChiMuc(kho: readonly CauKhoV2[]): ChiMuc {
  const cm: ChiMuc = { theoId: new Map(), songSinhCua: new Map(), theoPhan: new Map(), theoDang: new Map(), bamId: new Map() }
  for (const c of kho) {
    if (cm.theoId.has(c.id)) continue
    cm.theoId.set(c.id, c)
    cm.bamId.set(c.id, bam(c.id))
    if (c.songSinhCua) {
      const ds = cm.songSinhCua.get(c.songSinhCua) ?? []
      ds.push(c)
      cm.songSinhCua.set(c.songSinhCua, ds)
      continue
    }
    const p = cm.theoPhan.get(c.phan) ?? []
    p.push(c)
    cm.theoPhan.set(c.phan, p)
    if (c.dang) {
      const k = `${c.phan}|${c.dang}`
      const d = cm.theoDang.get(k) ?? []
      d.push(c)
      cm.theoDang.set(k, d)
    }
  }
  return cm
}

/** Lỗi được xếp vào ô dành cho lỗi: đến hạn (≤ ngày ca) trước; Kiểm tra điểm yếu thêm câu "đúng chưa kiểm chứng" (chờ kiểm, chưa tới hạn). */
export function loiDungDuoc(loi: readonly LoiEmV2[], ngay: string, cheDo: 'ca' | 'diem_yeu'): LoiEmV2[] {
  const denHan = loi.filter((l) => l.trangThai !== 'khong_loi' && !!l.denHan && l.denHan <= ngay)
  const them = cheDo === 'diem_yeu' ? loi.filter((l) => l.trangThai === 'cho_kiem' && !(l.denHan && l.denHan <= ngay)) : []
  const xep = (a: LoiEmV2, b: LoiEmV2) => (a.denHan || '9999').localeCompare(b.denHan || '9999') || a.qid.localeCompare(b.qid)
  const da = new Set<string>()
  return [...denHan.sort(xep), ...them.sort(xep)].filter((l) => (da.has(l.qid) ? false : (da.add(l.qid), true)))
}

/** Mốc "đã gặp" gộp theo nhóm nội dung: mọi câu trong `nhomTrung` cùng nhóm với một câu đã gặp nhận MAX ngày của nhóm. Không có nhóm ⇒ trả nguyên `daGap`. Thuần. */
function gopDaGapNhom(daGap: Record<string, string>, nhomTrung: Record<string, string> | undefined): Record<string, string> {
  if (!nhomTrung) return daGap
  const max = new Map<string, string>()
  for (const [q, n] of Object.entries(daGap)) { const g = nhomTrung[q]; if (g && n > (max.get(g) ?? '')) max.set(g, n) }
  if (max.size === 0) return daGap
  const ra: Record<string, string> = { ...daGap }
  for (const [q, g] of Object.entries(nhomTrung)) { const n = max.get(g); if (n && n > (ra[q] ?? '')) ra[q] = n }
  return ra
}

/** Rút cho cả danh sách em. Tất định theo (kho, hồ sơ, seed, thứ tự dsSbd đã sắp). */
export function rutDeV2(dv: DauVaoRutV2): KetQuaRutV2 {
  const cm = dungChiMuc(dv.kho)
  const mucTieu = dv.mucTieu ?? mucTieuTheoKho(dv.kho, dv.soCau)
  const tongCau = PHAN_V2.reduce((a, p) => a + (mucTieu[p]?.length ?? 0), 0)
  const mucDoCung = dv.cheDo === 'ca' && tongCau > NGUONG_CA_NGAN
  const tiLe = dv.cheDo === 'diem_yeu' ? 1 : (dv.tiLeMucDich ?? TI_LE_MUC_DICH_CA)
  const daDung: Record<string, number> = { ...(dv.daDung ?? {}) }
  const ra: KetQuaRutV2 = { theoEm: {}, thieu: {}, daDung, mucTieu, mucDoCung, loiChuaXep: {} }
  const dsSbd = [...new Set(dv.dsSbd.map((s) => String(s).trim()).filter(Boolean))].sort()

  for (const sbd of dsSbd) {
    const hs = dv.hoSo[sbd]
    const nhomCua = (id: string): string => dv.nhomTrung?.[id] ?? ''
    const daGap = gopDaGapNhom(hs?.daGap ?? {}, dv.nhomTrung)
    const chonNhom = new Set<string>() // nhóm nội dung đã có câu trong bộ của em này
    const daChon = (id: string): boolean => chon.has(id) || (nhomCua(id) !== '' && chonNhom.has(nhomCua(id)))
    const hatEm = bam(`${dv.seed}|${sbd}`)
    const chon = new Set<string>()
    const bo: CauRutV2[] = []
    const thieu: OThieuV2[] = []
    const ngayGap = (id: string): number | null => (daGap[id] ? soNgayGiua(daGap[id], dv.ngay) : null)
    const chuaGap = (id: string) => !daGap[id]
    const camCung = new Set(hs?.camCung ?? [])
    /** Lý thuyết đã gặp < 30 ngày ⇒ chưa được quay lại. */
    const camLyThuyet = (c: CauKhoV2) => {
      const n = ngayGap(c.id)
      return c.lyThuyet && n !== null && n < NGAY_QUAY_LAI_LY_THUYET
    }
    const diem = (c: CauKhoV2) => (daDung[c.id] ?? 0) * 4294967296 + (Math.imul((cm.bamId.get(c.id) ?? 0) ^ hatEm, 2654435761) >>> 0)
    const tot = (ds: readonly CauKhoV2[] | undefined, loc: (c: CauKhoV2) => boolean): CauKhoV2 | undefined => {
      let best: CauKhoV2 | undefined
      let bd = Infinity
      for (const c of ds ?? []) {
        if (daChon(c.id) || !loc(c)) continue
        const d = diem(c)
        if (d < bd) { bd = d; best = c }
      }
      return best
    }
    const nhan = (c: CauKhoV2, phan: PhanV2, mucO: string, bac: BacLap, goc?: string) => {
      chon.add(c.id)
      if (nhomCua(c.id) !== '') chonNhom.add(nhomCua(c.id))
      daDung[c.id] = (daDung[c.id] ?? 0) + 1
      bo.push({ qid: c.id, phan, mucDo: c.mucDo, bac, ...(goc ? { goc } : {}), ...(c.mucDo !== mucO ? { lechMuc: true } : {}) })
    }
    function gan(ds: readonly CauKhoV2[] | undefined, m: string, loc: (c: CauKhoV2) => boolean): CauKhoV2 | undefined {
      let best: CauKhoV2 | undefined
      let bk = Infinity
      let bd = Infinity
      for (const c of ds ?? []) {
        if (daChon(c.id) || !loc(c)) continue
        const k = Math.abs(viTriMuc(c.mucDo) - viTriMuc(m))
        const d = diem(c)
        if (k < bk || (k === bk && d < bd)) { bk = k; bd = d; best = c }
      }
      return best
    }
    /** Câu em đã gặp, lâu nhất trước; lý thuyết < 30 ngày xếp cuối cùng. */
    function ganNhatDaGap(ds: readonly CauKhoV2[] | undefined, loc: (c: CauKhoV2) => boolean): CauKhoV2 | undefined {
      let best: CauKhoV2 | undefined
      let bk = -Infinity
      for (const c of ds ?? []) {
        if (daChon(c.id) || !loc(c)) continue
        const n = ngayGap(c.id) ?? 0
        const k = (camLyThuyet(c) ? -1e6 : 0) - (camCung.has(c.id) ? 5e5 : 0) + n
        if (k > bk) { bk = k; best = c }
      }
      return best
    }
    const loi = loiDungDuoc(hs?.loi ?? [], dv.ngay, dv.cheDo)
    let chuaXep = 0
    const loiTheoPhan = new Map<PhanV2, LoiEmV2[]>()
    for (const l of loi) {
      const p = cm.theoId.get(l.qid)?.phan ?? l.phan ?? cm.songSinhCua.get(l.qid)?.[0]?.phan
      if (!p) { chuaXep++; continue }
      loiTheoPhan.set(p, [...(loiTheoPhan.get(p) ?? []), l])
    }

    for (const p of PHAN_V2) {
      const con = [...(mucTieu[p] ?? [])]
      const n = con.length
      if (n === 0) { chuaXep += loiTheoPhan.get(p)?.length ?? 0; continue }
      /** Lấy một ô cho câu mức `m`: đúng mức trước; mức độ mềm ⇒ ô gần nhất. Trả mức của ô, hoặc null. */
      const layO = (m: string): string | null => {
        const i = con.indexOf(m)
        if (i >= 0) return con.splice(i, 1)[0]!
        if (mucDoCung || con.length === 0) return null
        let k = 0
        for (let j = 1; j < con.length; j++) if (Math.abs(viTriMuc(con[j]!) - viTriMuc(m)) < Math.abs(viTriMuc(con[k]!) - viTriMuc(m))) k = j
        return con.splice(k, 1)[0]!
      }
      const coO = (m: string) => con.includes(m) || (!mucDoCung && con.length > 0)

      // (A) Ô dành cho lỗi của em.
      const tran = Math.min(n, Math.ceil(n * tiLe))
      let daXep = 0
      for (const l of loiTheoPhan.get(p) ?? []) {
        if (daXep >= tran || con.length === 0) { chuaXep++; continue }
        const goc = cm.theoId.get(l.qid)
        const dsSS = (cm.songSinhCua.get(l.qid) ?? []).filter((c) => c.phan === p && !daChon(c.id) && !camLyThuyet(c))
        const ss = dsSS.find((c) => c.id === `${l.qid}~ss${l.songSinh ?? -1}`) ?? dsSS[0]
        const gocDung = !!goc && goc.phan === p && !daChon(goc.id) && !camLyThuyet(goc) && !(l.nenSongSinh && ss)
        const thang: { c: CauKhoV2 | undefined; bac: BacLap }[] = dv.cheDo === 'diem_yeu'
          ? [{ c: ss, bac: 'song_sinh' }, { c: gocDung ? goc : undefined, bac: 'muc_dich' }]
          : [{ c: gocDung ? goc : undefined, bac: 'muc_dich' }, { c: ss, bac: 'song_sinh' }]
        let xong = false
        for (const b of thang) {
          if (!b.c || !coO(b.c.mucDo)) continue
          const o = layO(b.c.mucDo)
          if (o === null) continue
          nhan(b.c, p, o, b.bac, l.qid)
          xong = true
          break
        }
        if (!xong) {
          // CÙNG DẠNG, khác nội dung, em chưa gặp — đúng mức ô còn trống trước.
          const dang = goc?.dang || l.dang || ''
          const ung = dang ? cm.theoDang.get(`${p}|${dang}`) : undefined
          const c = tot(ung, (x) => x.id !== l.qid && chuaGap(x.id) && con.includes(x.mucDo)) ?? (mucDoCung ? undefined : tot(ung, (x) => x.id !== l.qid && chuaGap(x.id)))
          if (c) {
            const o = layO(c.mucDo)
            if (o !== null) {
              nhan(c, p, o, 'cung_dang', l.qid)
              thieu.push({ phan: p, mucDo: o, bac: 'cung_dang', qid: c.id, lyDo: `câu gốc ${l.qid} và câu song sinh không dùng được — lấp bằng câu cùng dạng` })
              xong = true
            }
          }
        }
        if (xong) daXep++
        else chuaXep++
      }

      // (B) Ô còn lại. Ca đánh giá (mức độ cứng): câu mới đúng mức → câu đã gặp lâu nhất ĐÚNG MỨC → lệch mức gần nhất.
      //     Ca ngắn / điểm yếu (mức độ mềm): câu mới đúng mức → câu mới mức gần nhất → câu đã gặp lâu nhất.
      //     Lý thuyết gặp < 30 ngày luôn là lựa chọn cuối cùng. Kho còn câu thì không bỏ trống ô.
      const dsP = cm.theoPhan.get(p)
      while (con.length > 0) {
        const m = con.shift()!
        const ghi = (c: CauKhoV2, lyDo: string) => {
          const bac: BacLap = chuaGap(c.id) ? 'moi' : 'nhac_lai'
          nhan(c, p, m, bac)
          if (lyDo) thieu.push({ phan: p, mucDo: m, bac, qid: c.id, lyDo })
        }
        const moi = tot(dsP, (x) => x.mucDo === m && chuaGap(x.id))
        if (moi) { ghi(moi, ''); continue }
        const thang: [() => CauKhoV2 | undefined, string][] = mucDoCung
          ? [
              [() => ganNhatDaGap(dsP, (x) => x.mucDo === m && !camLyThuyet(x)), 'kho hết câu mới đúng mức — dùng câu em đã gặp lâu nhất'],
              [() => ganNhatDaGap(dsP, (x) => x.mucDo === m), 'kho hết câu đúng mức — đành dùng câu lý thuyết em gặp chưa đủ 30 ngày'],
              [() => gan(dsP, m, (x) => chuaGap(x.id)) ?? gan(dsP, m, (x) => !camLyThuyet(x)) ?? gan(dsP, m, () => true), 'kho không còn câu mức này — lấy câu mức gần nhất'],
            ]
          : [
              [() => gan(dsP, m, (x) => chuaGap(x.id)), 'kho hết câu mới đúng mức — lấy câu mới mức gần nhất'],
              [() => ganNhatDaGap(dsP, (x) => !camLyThuyet(x)), 'kho hết câu mới — dùng câu em đã gặp lâu nhất'],
              [() => ganNhatDaGap(dsP, () => true), 'kho hết câu — đành dùng câu lý thuyết em gặp chưa đủ 30 ngày'],
            ]
        let xong = false
        for (const [lay, lyDo] of thang) {
          const c = lay()
          if (c) { ghi(c, lyDo); xong = true; break }
        }
        if (!xong) thieu.push({ phan: p, mucDo: m, bac: 'trong', lyDo: 'kho phần này đã cạn — máy em tự bù từ gói đề ca' })
      }

    }
    ra.theoEm[sbd] = bo
    if (thieu.length > 0) ra.thieu[sbd] = thieu
    if (chuaXep > 0) ra.loiChuaXep[sbd] = chuaXep
  }
  return ra
}

/** Bản đồ gửi máy chủ: `bo` (bộ câu), `lap` (câu hỏi lại), `bac` (bậc lấp từng câu — chỉ thầy xem, không xuống máy em). */
export function banDoTuKetQua(kq: Pick<KetQuaRutV2, 'theoEm'>): { bo: Record<string, string[]>; lap: Record<string, string[]>; bac: Record<string, Record<string, BacLap>> } {
  const bo: Record<string, string[]> = {}
  const lap: Record<string, string[]> = {}
  const bac: Record<string, Record<string, BacLap>> = {}
  for (const [sbd, ds] of Object.entries(kq.theoEm)) {
    if (ds.length === 0) continue
    bo[sbd] = ds.map((c) => c.qid)
    const l = ds.filter((c) => BAC_HOI_LAI.has(c.bac)).map((c) => c.qid)
    if (l.length > 0) lap[sbd] = l
    bac[sbd] = Object.fromEntries(ds.map((c) => [c.qid, c.bac]))
  }
  return { bo, lap, bac }
}

/** Gộp lượt rút thêm (em vào phòng sau) vào kết quả chạy thử — em đã có bộ GIỮ NGUYÊN. */
export function gopKetQuaV2(cu: KetQuaRutV2, them: KetQuaRutV2): KetQuaRutV2 {
  const ra: KetQuaRutV2 = { ...cu, theoEm: { ...cu.theoEm }, thieu: { ...cu.thieu }, loiChuaXep: { ...cu.loiChuaXep }, daDung: { ...them.daDung } }
  for (const [sbd, ds] of Object.entries(them.theoEm)) {
    if (ra.theoEm[sbd]) continue
    ra.theoEm[sbd] = ds
    if (them.thieu[sbd]) ra.thieu[sbd] = them.thieu[sbd]!
    if (them.loiChuaXep[sbd]) ra.loiChuaXep[sbd] = them.loiChuaXep[sbd]!
  }
  return ra
}

/** Đếm theo bậc lấp của một em — cho bảng Xem trước phân bổ. */
export function demBac(ds: readonly CauRutV2[]): Record<BacLap, number> {
  const ra = { muc_dich: 0, song_sinh: 0, cung_dang: 0, moi: 0, nhac_lai: 0 } as Record<BacLap, number>
  for (const c of ds) ra[c.bac]++
  return ra
}
