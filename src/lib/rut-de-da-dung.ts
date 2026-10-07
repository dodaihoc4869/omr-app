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
//   6. (thầy 06/10) Câu em đã đúng KHÔNG ra nguyên văn nữa — thay bằng BẢN KHÁC để em không làm theo trí nhớ đáp án, và GHI RÕ trên câu:
//        · câu tính toán có bản đổi số (song sinh / biến thể bằng mã) ⇒ "Câu này thay số của câu em đã đúng ở <nhãn>";
//        · câu lý thuyết (và Phần II, câu chưa có bản đổi số) ⇒ CÂU ANH EM cùng dạng, cùng mức, nội dung khác, em chưa gặp (cách làm lại câu sai —
//          server/src/cau-anh-em.ts) ⇒ "Câu lý thuyết này thay cho câu em đã đúng ở <nhãn> (cùng dạng bài, nội dung khác)";
//        · không tìm được bản thay ⇒ giữ nguyên câu em đã đúng như trước ("Em đã làm đúng: <nhãn>") — không bao giờ để trống ô.
//      Phần việc tìm bản thay nằm ở máy chủ (`/ca/cau-thay-so`, server/src/cau-thay-so.ts) vì cần sổ học của em; hàm thuần ở đây chỉ ÁP kết quả vào bộ câu.
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

// ---------------------------------------------------------------- nhãn câu THAY (thầy 06/10)

/** Cách một câu trong đề thay cho câu em đã đúng: `thay_so` = bản đổi số (song sinh / biến thể bằng mã) · `cung_dang` = câu anh em (cùng dạng, nội dung khác). */
export type KieuThay = 'thay_so' | 'cung_dang'

/**
 * Nhãn HIỆN CHO EM của câu đã được thay — là CẢ CÂU (máy em in nguyên văn, không thêm "Em đã làm đúng:"):
 *   thay_so   → "Câu này thay số của câu em đã đúng ở Ca Kiểm tra tuần 3 · 28/09 · Thông hiểu"
 *   cung_dang → "Câu này thay cho câu em đã đúng ở … (cùng dạng bài, nội dung khác)" · câu lý thuyết: "Câu lý thuyết này thay cho câu em đã đúng ở …"
 * Vì sao cả câu nằm trong chuỗi nhãn: máy em đang cache bản cũ vẫn in được (thành "Em đã làm đúng: Câu này thay số của …" — dài nhưng đủ nghĩa, không mất nhãn);
 * không thêm khoá mới vào gói đề của em (đường `/vao-thi` giữ nguyên).
 */
export function nhanThay(kieu: KieuThay, lyThuyet: boolean, nhanGoc: string): string {
  const noi = String(nhanGoc ?? '').trim()
  const o = noi ? `ở ${noi}` : 'trước đây'
  if (kieu === 'thay_so') return `Câu này thay số của câu em đã đúng ${o}`
  return `${lyThuyet ? 'Câu lý thuyết này' : 'Câu này'} thay cho câu em đã đúng ${o} (cùng dạng bài, nội dung khác)`
}
const MAU_NHAN_THAY = /^Câu (?:lý thuyết )?này (?:thay số của|thay cho) câu em đã đúng /
/** Nhãn này là nhãn câu ĐÃ THAY (nhãn câu nguyên văn bắt đầu bằng tên nơi: "Ca …", "Chiến dịch …", "Ôn lại"… — không bao giờ bằng "Câu này"). */
export const laNhanThay = (nhan: unknown): boolean => typeof nhan === 'string' && MAU_NHAN_THAY.test(nhan.trim())

/** Chữ đầy đủ máy em in dưới số câu: câu nguyên văn "Em đã làm đúng: <nhãn>"; câu đã thay in đúng nhãn thay (xem `nhanThay`). */
export const chuNhanDaDung = (nhan: string): string => {
  const n = String(nhan ?? '').trim()
  return laNhanThay(n) ? n : `Em đã làm đúng: ${n}`
}
/** Dòng nhãn trong báo cáo cuối bài của thầy: "đã làm đúng: <nơi>" cho câu nguyên văn; câu đã thay in cả nhãn thay (nó đã nói nơi). */
export const chuNhanBaoCao = (nhan: string): string => {
  const n = String(nhan ?? '').trim()
  return laNhanThay(n) ? n : `đã làm đúng: ${n || 'không rõ nơi'}`
}

/** Nhãn câu thay TÁCH thành phần (đọc cả nhãn đã lưu ở ca cũ — định dạng `nhanThay` không đổi): `noi` = "nơi · dd/mm · mức", rỗng khi nhãn ghi "trước đây". Không phải nhãn thay ⇒ null. */
export interface NhanThayTach { kieu: KieuThay; lyThuyet: boolean; noi: string }
const TACH_NHAN_THAY = /^Câu (lý thuyết )?này (thay số của|thay cho) câu em đã đúng (?:ở (.+?)|trước đây)(?: \(cùng dạng bài, nội dung khác\))?$/
export function tachNhanThay(nhan: unknown): NhanThayTach | null {
  if (typeof nhan !== 'string') return null
  const m = TACH_NHAN_THAY.exec(nhan.trim())
  if (!m) return null
  const thaySo = m[2] === 'thay số của'
  return { kieu: thaySo ? 'thay_so' : 'cung_dang', lyThuyet: !!m[1], noi: (m[3] ?? '').trim() }
}
/**
 * Dòng ĐẬM NGẮN của ô ghi chú câu thay trên máy em (thầy 07/10: "rút gọn ý nghĩa của phần ghi chú"); nơi · ngày · mức đi dòng phụ bên dưới.
 * Chữ lưu trong ca (`nhanThay`) và báo cáo của thầy giữ nguyên câu đầy đủ — chỉ máy em hiện bản gọn.
 */
export function chuNganNhanThay(t: Pick<NhanThayTach, 'kieu' | 'lyThuyet'>): string {
  if (t.kieu === 'thay_so') return 'Thay số từ câu em đã đúng'
  return t.lyThuyet ? 'Thay cho câu lý thuyết em đã đúng' : 'Thay cho câu em đã đúng'
}

/**
 * CÂU GỐC của câu thay (thầy 07/10: nút "Xem câu gốc" để em đối chiếu kiến thức): máy thầy ghi vào CHÍNH bản đồ nhãn của em thêm khoá "~goc:<qid câu thay>" → qid câu gốc
 * em đã đúng. Không phải qid thật nên không bao giờ trùng một câu trong đề; máy chủ cất/cắt bản đồ này nguyên văn (không cần sửa đường cất), máy em cũ bỏ qua.
 * Chỉ MAPPING (qid → qid, vài chục byte một câu) — nội dung công khai của câu gốc máy em xin riêng ở `/hs/cau-goc`, không đi trong gói đề của cả lớp.
 */
export const TIEN_TO_GOC = '~goc:'
export const khoaGoc = (qidThay: string): string => `${TIEN_TO_GOC}${qidThay}`
export const laKhoaGoc = (khoa: string): boolean => khoa.startsWith(TIEN_TO_GOC)
/** qid câu gốc của câu thay `qidThay` trong bản đồ nhãn của em (thiếu ⇒ rỗng). */
export function gocCuaCauThay(daDung: Readonly<Record<string, string>> | null | undefined, qidThay: string): string {
  const v = daDung?.[khoaGoc(qidThay)]
  return typeof v === 'string' ? v.trim() : ''
}
/** Mọi qid câu gốc có trong bản đồ nhãn của em (không trùng) — máy chủ chỉ phát nội dung công khai cho đúng những qid này. */
export function cacCauGocCuaEm(daDung: Readonly<Record<string, unknown>> | null | undefined): string[] {
  const ra = new Set<string>()
  for (const [k, v] of Object.entries(daDung ?? {})) if (laKhoaGoc(k) && typeof v === 'string' && v.trim()) ra.add(v.trim())
  return [...ra]
}

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
  /** qid CÂU TRONG ĐỀ: sau khi áp bản thay (`apThayVaoKetQua`) là qid của câu thay, `goc` giữ qid câu em đã đúng. */
  qid: string
  phan: PhanV2
  mucDo: string
  /** Mức của ô câu này lấp (khác `mucDo` ⇒ ô mượn mức gần nhất). */
  mucO: string
  lechMuc?: boolean
  /** Câu BÙ từ kho (em chưa làm đúng câu này) — không nhãn "đã làm đúng". */
  bu?: boolean
  /** Câu này THAY cho câu em đã đúng `goc` (thầy 06/10) theo cách `thay`; `lyThuyet` = câu em đã đúng là câu lý thuyết. */
  goc?: string
  thay?: KieuThay
  lyThuyet?: boolean
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

// ---------------------------------------------------------------- ÁP BẢN THAY VÀO BỘ CÂU (thầy 06/10)

/** Bản thay của MỘT câu em đã đúng: `id` = qid câu thay trong đề (qid ảo "<gốc>~ss<i>" / "<gốc>~bt<k>" hoặc qid thật của câu anh em). */
export interface BanThay {
  id: string
  kieu: KieuThay
}
/** sbd → qid câu em đã đúng → bản thay. */
export type ThayTheoEm = Record<string, Record<string, BanThay>>

/**
 * Áp bản thay lên kết quả rút: câu nào em đã đúng (KHÔNG phải câu bù) và có bản thay ⇒ qid trong đề đổi thành qid bản thay, `goc` giữ qid cũ, nhãn đổi thành
 * nhãn thay (`nhanThay`, dựng từ nhãn nơi · ngày · mức của câu gốc), đếm đúng/sai TRƯỚC ca của câu gốc đi theo qid mới. Không đổi ô (phần, mức) và không đổi
 * `daDung` (đếm xoay vòng theo qid gốc). Bản thay trùng một qid đã có trong đề của em ⇒ bỏ bản thay đó (đề không bao giờ có hai câu giống nhau).
 * `lyThuyet` = tập qid câu gốc là câu LÝ THUYẾT (chỉ để chọn lời nhãn). Thuần, không đổi đầu vào.
 */
export function apThayVaoKetQua(kq: KetQuaDaDung, thay: ThayTheoEm, lyThuyet: ReadonlySet<string> = new Set()): KetQuaDaDung {
  const ra: KetQuaDaDung = { ...kq, theoEm: { ...kq.theoEm }, nhan: { ...kq.nhan }, dem: { ...kq.dem } }
  for (const [sbd, ds] of Object.entries(kq.theoEm)) {
    const t = thay[sbd]
    if (!t) continue
    const dung = new Set(ds.map((c) => c.qid))
    const nhanEm = { ...(kq.nhan[sbd] ?? {}) }
    const demEm = { ...(kq.dem[sbd] ?? {}) }
    ra.theoEm[sbd] = ds.map((c) => {
      const b = c.bu ? undefined : t[c.qid]
      if (!b || typeof b.id !== 'string' || !b.id || dung.has(b.id) || (b.kieu !== 'thay_so' && b.kieu !== 'cung_dang')) return c
      dung.add(b.id)
      const ly = lyThuyet.has(c.qid)
      nhanEm[b.id] = nhanThay(b.kieu, ly, nhanEm[c.qid] ?? '')
      if (demEm[c.qid]) demEm[b.id] = demEm[c.qid]!
      delete nhanEm[c.qid]
      delete demEm[c.qid]
      return { ...c, qid: b.id, goc: c.qid, thay: b.kieu, ...(ly ? { lyThuyet: true } : {}) }
    })
    ra.nhan[sbd] = nhanEm
    ra.dem[sbd] = demEm
  }
  return ra
}

export interface ThongKeThay {
  /** Số câu đã được thay bằng bản đổi số (song sinh / biến thể bằng mã). */
  thaySo: number
  /** Số câu đã được thay bằng câu anh em (cùng dạng, nội dung khác) — trong đó `lyThuyet` là câu lý thuyết. */
  cungDang: number
  lyThuyet: number
  /** Số câu em đã đúng mà KHÔNG tìm được bản thay ⇒ giữ nguyên câu cũ (có nhãn "Em đã làm đúng"). */
  giuNguyen: number
  /** Số câu bù (em chưa làm đúng câu ấy) — không thuộc diện thay. */
  bu: number
  /** Số em có ít nhất một câu giữ nguyên. */
  emGiuNguyen: number
  theoEm: Record<string, { thaySo: number; cungDang: number; giuNguyen: number }>
}

/** Đếm cách thay trên kết quả (đã hoặc chưa áp bản thay) — số liệu cho thầy (bảng Xem trước phân bổ, biên bản lúc rút). */
export function thongKeThay(kq: Pick<KetQuaDaDung, 'theoEm'>): ThongKeThay {
  const ra: ThongKeThay = { thaySo: 0, cungDang: 0, lyThuyet: 0, giuNguyen: 0, bu: 0, emGiuNguyen: 0, theoEm: {} }
  for (const [sbd, ds] of Object.entries(kq.theoEm)) {
    const e = { thaySo: 0, cungDang: 0, giuNguyen: 0 }
    for (const c of ds) {
      if (c.bu) ra.bu++
      else if (c.thay === 'thay_so') e.thaySo++
      else if (c.thay === 'cung_dang') { e.cungDang++; if (c.lyThuyet) ra.lyThuyet++ }
      else e.giuNguyen++
    }
    ra.thaySo += e.thaySo
    ra.cungDang += e.cungDang
    ra.giuNguyen += e.giuNguyen
    if (e.giuNguyen > 0) ra.emGiuNguyen++
    ra.theoEm[sbd] = e
  }
  return ra
}

/**
 * Bản thay lấy từ KHO CA (đường em VÀO MUỘN, server): câu em đã đúng nào có câu đổi số của nó đã nằm sẵn trong kho ca (máy thầy nối lúc Bắt đầu cho em khác)
 * ⇒ dùng bản đó (`songSinhCua` = câu gốc). Câu lý thuyết không đổi số ⇒ bỏ qua. Ưu tiên bản em CHƯA gặp (`daGap`: sbd → qid → ngày gặp gần nhất); gặp hết ⇒ bản
 * gặp lâu nhất. Chọn tất định theo (mã ca, em, câu gốc). Không có bản nào trong kho ⇒ không thay (câu giữ nguyên, có nhãn "Em đã làm đúng").
 */
export function timThayTrongKho(
  kq: Pick<KetQuaDaDung, 'theoEm'>,
  kho: readonly { id: string; songSinhCua?: string }[],
  seed: string,
  daGap: Readonly<Record<string, Readonly<Record<string, string>>>> = {},
  lyThuyet: ReadonlySet<string> = new Set(),
): ThayTheoEm {
  const theoGoc = new Map<string, string[]>()
  for (const x of kho) if (x.songSinhCua) theoGoc.set(x.songSinhCua, [...(theoGoc.get(x.songSinhCua) ?? []), x.id])
  const ra: ThayTheoEm = {}
  for (const [sbd, ds] of Object.entries(kq.theoEm)) {
    for (const c of ds) {
      if (c.bu || c.thay || lyThuyet.has(c.qid)) continue
      const ung = [...(theoGoc.get(c.qid) ?? [])].sort()
      if (ung.length === 0) continue
      const gap = daGap[sbd] ?? {}
      const chua = ung.filter((id) => !gap[id])
      const pool = chua.length > 0 ? chua : [[...ung].sort((a, b) => (gap[a] ?? '').localeCompare(gap[b] ?? '') || a.localeCompare(b))[0]!]
      const id = pool[bam(`${seed}|${sbd}|${c.qid}`) % pool.length]!
      ;(ra[sbd] ??= {})[c.qid] = { id, kieu: 'thay_so' }
    }
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
    // Câu THAY (đã áp bản thay): kèm khoá "~goc:<qid câu thay>" → qid câu gốc em đã đúng, để máy em có nút "Xem câu gốc" (thầy 07/10). Câu bù / nguyên văn: không có.
    for (const c of ds) if (c.goc && daDung[sbd]![c.qid]) daDung[sbd]![khoaGoc(c.qid)] = c.goc // `goc` chỉ có ở câu đã THAY (apThayVaoKetQua đặt cùng `thay`)
    demDaDung[sbd] = Object.fromEntries(ds.map((c) => [c.qid, kq.dem[sbd]?.[c.qid] ?? [0, 0]]))
  }
  return { bo, daDung, demDaDung }
}

/** Nhãn "đã làm đúng" của MỘT em, đọc phòng thủ: qid → nhãn (chuỗi ≤ 260 ký tự — nhãn câu đã thay là cả câu, xem `nhanThay`). */
export function daDungCuaEm(v: unknown): Record<string, string> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const ra: Record<string, string> = {}
  for (const [q, n] of Object.entries(v as Record<string, unknown>)) {
    const qid = String(q ?? '').trim()
    if (!qid || typeof n !== 'string' || !n.trim()) continue
    ra[qid] = n.trim().slice(0, 260) // nhãn câu thay là cả câu (nhãn nơi + lời giải thích) — dài hơn nhãn nơi cũ
  }
  return ra
}

// ---------------------------------------------------------------- kết thúc bài: em sai lại câu đã làm đúng

export { dongCauSaiLai, loaiCauChuaDung, type LoaiChuaDung } from './loai-cau-chua-dung'
import { chuDemLoai, chuLoaiChuaDung, type LoaiChuaDung } from './loai-cau-chua-dung'

export interface CauSaiLaiDaDung {
  soCau: number
  phan: 'I' | 'II' | 'III'
  qid: string
  nhan: string
  soLanDung?: number
  soLanSai?: number
  /** Thiếu ở dữ liệu cũ ⇒ chỉ hiện "sai" như trước, không đoán. */
  loai?: LoaiChuaDung
}

/** "1 sai · 2 bỏ trống · 1 đúng một phần" cho một em — chỉ nêu loại có mặt. Có câu THIẾU loại (dữ liệu cũ) ⇒ rỗng: các số trong ngoặc phải cộng ĐÚNG bằng số câu nêu ở ngoài. */
export const chuChiTietChuaDung = (sai: readonly CauSaiLaiDaDung[]): string => (sai.every((c) => c.loai) ? chuDemLoai(sai) : '')
/** Hậu tố sau nhãn câu: " (bỏ trống)" · " (đúng một phần)"; câu sai thường hoặc thiếu loại ⇒ rỗng. */
export const chuHauToLoai = (l: LoaiChuaDung | undefined): string => (l === 'trong' || l === 'mot_phan' ? ` (${chuLoaiChuaDung(l)})` : '')
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
