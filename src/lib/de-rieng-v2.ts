// RÚT ĐỀ CA KIỂM TRA v2 (02/10) — PHẦN MÁY THẦY: chạy thử lúc mở ca, chốt lúc bấm Bắt đầu thi.
//
//   chayThuRutDeCa  — ca đề riêng chưa bắt đầu: rút thử bộ câu cho TỪNG em của lớp (danh sách lớp ∪ phòng chờ) bằng đúng thang lấp
//                     sẽ dùng lúc Bắt đầu (src/lib/rut-de-v2.ts), cất kết quả trong bộ nhớ màn để thầy xem trước phân bổ.
//   chotRutDeCa     — bấm Bắt đầu: DÙNG LẠI kết quả chạy thử, chỉ rút thêm cho em vào phòng sau; nối vào kho ca những câu ngoài kho
//                     đã được chọn (câu gốc của lỗi, câu song sinh) rồi trả bản đồ để `batDauThi` chốt MỘT lệnh trên máy chủ.
//
// Lỗi đến hạn của từng em lấy từ máy chủ (`/ca/loi-den-han` — hàng chữa lỗi `docHoSo2`). Máy chủ chưa có lệnh ⇒ NÉM LỖI để
// màn Theo dõi đi đường rút cũ (`dungDeRiengChoCa`), không lặng lẽ rút thiếu.
import { mergeAndStrip, type TeacherExamSource, type TeacherMcqQuestion, type TeacherShortAnswerQuestion } from '../data/examContent'
import { docSoCauCa, loadExamSources, loadSessionTeacherBank, saveSessionTeacherBank } from './exam-db'
import { coLuotMoiTheoEm, loiDenHanTheoEm, noiKhoCa, type LoiDenHanEm } from './exam-api'
import { ngayVnCua } from './de-rieng-nguon'
import {
  BAC_HOI_LAI,
  banDoTuKetQua,
  gopKetQuaV2,
  khoTuNguon,
  loiDungDuoc,
  rutDeV2,
  type BacLap,
  type CauKhoV2,
  type HoSoEmV2,
  type KetQuaRutV2,
  type PhanV2,
} from './rut-de-v2'

export type CauNgoai = { phan: PhanV2; cau: TeacherMcqQuestion | TeacherShortAnswerQuestion | TeacherExamSource['phanII'][number] }

export interface RutThuCa {
  maCa: string
  ngay: string
  cheDo: 'ca' | 'diem_yeu'
  kq: KetQuaRutV2
  /** Câu NGOÀI kho ca (câu gốc của lỗi lấy từ cả kho máy thầy, câu song sinh dựng từ máy chủ) — nối vào kho ca lúc chốt. */
  cauNgoai: Record<string, CauNgoai>
  hoSo: Record<string, HoSoEmV2>
  /** qid → nhóm nội dung (câu trùng nội dung khác mã là một câu) — máy chủ trả cùng hồ sơ lỗi. */
  nhomTrung?: Record<string, string>
  kho: CauKhoV2[]
  khoCa: CauKhoV2[]
  /** Em không đọc được hồ sơ lỗi — rút như em chưa có lỗi nào (vẫn đủ câu). */
  hongHoSo: string[]
  lucRut: string
  /** Mốc TRƯỚC khi đọc hồ sơ của lượt rút này (ISO) — lượt tự làm của em sau mốc này là "mới" so với bản rút. Thiếu ⇒ dùng `lucRut`. */
  mocDoc?: string
  /** Thời gian chạy thuật toán trên máy này (ms). */
  msThuatToan: number
  /** Hồ sơ THÔ máy chủ trả cho từng em (lỗi kèm câu song sinh, câu đã gặp) — lúc chốt chỉ ĐỌC LẠI em có lượt mới, em khác dùng lại (30/10). */
  tho?: HoSoTho
}

/** Hồ sơ thô `/ca/loi-den-han` của một nhóm em (đúng dáng `loiDenHanTheoEm` trả). */
export type HoSoTho = { em: Record<string, LoiDenHanEm[]>; daGap: Record<string, Record<string, string>>; hong: string[]; nhomTrung?: Record<string, string> }

const nho = new Map<string, RutThuCa>()
/** Kết quả chạy thử đang giữ của một ca (màn Theo dõi đọc để vẽ bảng). */
export const docRutThu = (maCa: string): RutThuCa | undefined => nho.get(maCa)
export const boRutThu = (maCa: string): void => void nho.delete(maCa)

/** Dựng câu song sinh thành câu đề CÓ đáp án (chỉ nằm ở máy thầy + kho đáp án của ca). */
function cauTuSongSinh(l: LoiDenHanEm, goc?: { mucDo?: unknown; chuyenDe?: string; dang?: unknown }): CauNgoai | null {
  return l.cauSongSinh ? cauNgoaiTuBanDoiSo(l.cauSongSinh, goc, l.mucDo) : null
}

/**
 * Câu đổi số (song sinh `~ss`, biến thể bằng mã `~bt`) do máy chủ dựng ⇒ câu đề CÓ đáp án để nối vào kho ca. Mức / chuyên đề / dạng đi theo CÂU GỐC (`goc`), vắng mức thì
 * dùng `mucDoDuPhong`. Phần I cần đúng 4 phương án và đáp án A–D; Phần III cần đáp số; Phần II không có bản đổi số ⇒ null.
 */
export function cauNgoaiTuBanDoiSo(ss: NonNullable<LoiDenHanEm['cauSongSinh']>, goc?: { mucDo?: unknown; chuyenDe?: string; dang?: unknown }, mucDoDuPhong?: string): CauNgoai | null {
  if (!ss || !ss.id || !ss.text) return null
  const them = { ...(goc?.mucDo ? { mucDo: goc.mucDo } : mucDoDuPhong ? { mucDo: mucDoDuPhong } : {}), ...(goc?.chuyenDe ? { chuyenDe: goc.chuyenDe } : {}), ...(goc?.dang ? { dang: goc.dang } : {}),
    ...(ss.table ? { table: ss.table } : {}), ...(ss.hinhAnh?.length ? { hinhAnh: ss.hinhAnh } : {}) }
  if (ss.phan === 'I' && Array.isArray(ss.choices) && ss.choices.length === 4 && /^[ABCD]$/.test(ss.correct)) {
    return { phan: 'I', cau: { id: ss.id, text: ss.text, choices: ss.choices as [string, string, string, string], correct: ss.correct as 'A', ...them } as TeacherMcqQuestion }
  }
  if (ss.phan === 'III' && ss.correct) return { phan: 'III', cau: { id: ss.id, text: ss.text, correct: ss.correct, ...them } as TeacherShortAnswerQuestion }
  return null
}

/** Tìm câu theo id trong một danh sách đề. */
export function timCau(nguon: readonly TeacherExamSource[], ids: ReadonlySet<string>): Map<string, CauNgoai> {
  const ra = new Map<string, CauNgoai>()
  for (const s of nguon) {
    for (const [phan, ds] of [['I', s.phanI], ['II', s.phanII], ['III', s.phanIII]] as const) {
      for (const q of ds ?? []) if (ids.has(q.id) && !ra.has(q.id)) ra.set(q.id, { phan, cau: q })
    }
  }
  return ra
}

export interface NguonRut {
  bank: TeacherExamSource[]
  soCau: Record<PhanV2, number>
  khoCa: CauKhoV2[]
  khoToanBo?: TeacherExamSource[]
}

export async function napNguon(maCa: string): Promise<NguonRut> {
  const bank = await loadSessionTeacherBank(maCa)
  if (!bank || bank.length === 0) throw new Error('Máy này chưa có bản đề CÓ đáp án của ca')
  const sc = await docSoCauCa(maCa)
  if (!sc || sc.I + sc.II + sc.III === 0) throw new Error('Ca này chưa ghi số câu mỗi phần')
  return { bank, soCau: { I: sc.I, II: sc.II, III: sc.III }, khoCa: khoTuNguon(bank) }
}

/** Đọc hồ sơ lỗi của các em và dựng thêm câu ngoài kho (câu gốc của lỗi, câu song sinh). */
async function docHoSoVaCauNgoai(
  url: string,
  mat: string,
  dsSbd: string[],
  ngay: string,
  ng: NguonRut,
  cauNgoai: Record<string, CauNgoai>,
): Promise<{ hoSo: Record<string, HoSoEmV2>; hong: string[]; nhomTrung: Record<string, string>; tho: HoSoTho }> {
  const tho = (await loiDenHanTheoEm(url, mat, dsSbd, ngay, ng.khoCa.map((c) => c.id))) as HoSoTho
  return { ...(await dungHoSoVaCauNgoai(tho, dsSbd, ng, cauNgoai)), tho }
}

/** Dựng hồ sơ rút + câu ngoài kho từ hồ sơ THÔ đã có (không gọi mạng trừ lần đầu nạp cả kho máy thầy tìm câu gốc). */
async function dungHoSoVaCauNgoai(
  r: HoSoTho,
  dsSbd: string[],
  ng: NguonRut,
  cauNgoai: Record<string, CauNgoai>,
): Promise<{ hoSo: Record<string, HoSoEmV2>; hong: string[]; nhomTrung: Record<string, string> }> {
  const coTrongKho = new Set(ng.khoCa.map((c) => c.id))
  const canGoc = new Set<string>()
  for (const ds of Object.values(r.em)) for (const l of ds) if (!coTrongKho.has(l.qid) && !cauNgoai[l.qid]) canGoc.add(l.qid)
  // CÂU GỐC NGOÀI KHO CA: tìm trong CẢ KHO máy thầy (thầy chốt 08/09: câu em từng sai phải hỏi lại được dù khác chuyên đề ca).
  if (canGoc.size > 0) {
    ng.khoToanBo ??= await loadExamSources().catch(() => [] as TeacherExamSource[])
    for (const [id, c] of timCau(ng.khoToanBo, canGoc)) cauNgoai[id] = c
  }
  const gocCua = timCau(ng.bank, new Set(Object.values(r.em).flatMap((ds) => ds.map((l) => l.qid))))
  for (const ds of Object.values(r.em)) {
    for (const l of ds) {
      if (!l.cauSongSinh || cauNgoai[l.cauSongSinh.id] || coTrongKho.has(l.cauSongSinh.id)) continue
      const g = gocCua.get(l.qid)?.cau ?? cauNgoai[l.qid]?.cau
      const c = cauTuSongSinh(l, g as { mucDo?: unknown; chuyenDe?: string; dang?: unknown } | undefined)
      if (c) cauNgoai[c.cau.id] = c
    }
  }
  const hoSo: Record<string, HoSoEmV2> = {}
  for (const sbd of dsSbd) {
    hoSo[sbd] = {
      loi: (r.em[sbd] ?? []).map((l) => ({
        qid: l.qid,
        denHan: l.denHan,
        trangThai: l.trangThai,
        ...(l.nenSongSinh ? { nenSongSinh: true } : {}),
        ...(typeof l.songSinh === 'number' ? { songSinh: l.songSinh } : {}),
        ...(l.phan ? { phan: l.phan } : {}),
        ...(l.mucDo ? { mucDo: l.mucDo } : {}),
        ...(l.dang ? { dang: l.dang } : {}),
      })),
      daGap: r.daGap[sbd] ?? {},
    }
  }
  return { hoSo, hong: r.hong ?? [], nhomTrung: r.nhomTrung ?? {} }
}

/** Kho dùng để rút = kho ca + câu ngoài kho (đã lọc tự luận bằng `khoTuNguon`). Câu song sinh mang đúng mức/dạng câu gốc. */
export function khoDayDu(khoCa: CauKhoV2[], cauNgoai: Record<string, CauNgoai>): CauKhoV2[] {
  const nguon: TeacherExamSource = { maDe: 'ngoai-kho', phanI: [], phanII: [], phanIII: [] }
  for (const c of Object.values(cauNgoai)) (nguon[c.phan === 'I' ? 'phanI' : c.phan === 'II' ? 'phanII' : 'phanIII'] as unknown[]).push(c.cau)
  const theoId = new Map(khoCa.map((c) => [c.id, c]))
  const ngoai = khoTuNguon([nguon]).filter((c) => !theoId.has(c.id))
  for (const c of ngoai) {
    if (!c.songSinhCua) continue
    const g = theoId.get(c.songSinhCua) ?? ngoai.find((x) => x.id === c.songSinhCua)
    if (g) { c.mucDo = g.mucDo || c.mucDo; c.dang = g.dang || c.dang; c.lyThuyet = g.lyThuyet }
  }
  return [...khoCa, ...ngoai]
}

/** CHẠY THỬ cho cả lớp — gọi lúc màn Theo dõi mở một ca đề riêng chưa bắt đầu. Không ghi gì lên máy chủ. */
export async function chayThuRutDeCa(
  url: string,
  mat: string,
  maCa: string,
  dsSbd: string[],
  tuyChon: { cheDo: 'ca' | 'diem_yeu'; ngay?: string },
): Promise<RutThuCa> {
  const ngay = tuyChon.ngay ?? ngayVnCua(Date.now())
  const ds = [...new Set(dsSbd.map((x) => String(x || '').trim()).filter(Boolean))].sort()
  const ng = await napNguon(maCa)
  const cauNgoai: Record<string, CauNgoai> = {}
  const mocDoc = new Date().toISOString() // TRƯỚC khi đọc: lượt làm xen giữa lúc đọc vẫn bị bắt ở lần kiểm sau
  const { hoSo, hong, nhomTrung, tho } = await docHoSoVaCauNgoai(url, mat, ds, ngay, ng, cauNgoai)
  return rutTuHoSo(maCa, ngay, tuyChon.cheDo, ds, ng, cauNgoai, { hoSo, hong, nhomTrung }, tho, mocDoc)
}

/** Phần THUẦN của một lượt rút cả lớp (sau khi đã có hồ sơ): chạy thang lấp, cất vào bộ nhớ màn. */
function rutTuHoSo(
  maCa: string,
  ngay: string,
  cheDo: 'ca' | 'diem_yeu',
  ds: string[],
  ng: NguonRut,
  cauNgoai: Record<string, CauNgoai>,
  hs: { hoSo: Record<string, HoSoEmV2>; hong: string[]; nhomTrung: Record<string, string> },
  tho: HoSoTho,
  mocDoc: string,
): RutThuCa {
  const kho = khoDayDu(ng.khoCa, cauNgoai)
  const t0 = performance.now()
  const kq = rutDeV2({ kho, soCau: ng.soCau, dsSbd: ds, hoSo: hs.hoSo, ngay, cheDo, seed: maCa, nhomTrung: hs.nhomTrung })
  const rt: RutThuCa = { maCa, ngay, cheDo, kq, cauNgoai, hoSo: hs.hoSo, nhomTrung: hs.nhomTrung, kho, khoCa: ng.khoCa, hongHoSo: hs.hong, lucRut: new Date().toISOString(), mocDoc, msThuatToan: performance.now() - t0, tho }
  nho.set(maCa, rt)
  return rt
}

/**
 * RÚT LẠI CẢ LỚP khi có em làm bài sau lúc chạy thử — nhưng CHỈ ĐỌC LẠI hồ sơ của em có lượt mới (và em chưa có / lần trước đọc hỏng).
 * TỐC ĐỘ BẮT ĐẦU CA (30/10): bản cũ đọc lại hồ sơ CẢ LỚP (`/ca/loi-den-han`, ~10 truy vấn D1 mỗi em) — giờ cao điểm gần như luôn có một em
 * vừa làm bài ⇒ mỗi lần bấm Bắt đầu là đọc lại 30+ hồ sơ giữa lúc D1 nghẽn. Em KHÔNG có lượt mới thì hồ sơ không đổi ⇒ dùng lại bản thô đã
 * đọc; thang lấp vẫn chạy lại cho CẢ LỚP (cùng seed, cùng hồ sơ) ⇒ kết quả y hệt bản đọc lại toàn bộ.
 */
async function rutLaiTheoLuotMoi(
  url: string,
  mat: string,
  maCa: string,
  ds: string[],
  emMoi: readonly string[],
  cu: RutThuCa,
  tuyChon: { cheDo: 'ca' | 'diem_yeu'; ngay: string },
  mocDoc: string,
): Promise<RutThuCa> {
  if (!cu.tho) return chayThuRutDeCa(url, mat, maCa, ds, tuyChon)
  const ng = await napNguon(maCa)
  const hongCu = new Set(cu.tho.hong ?? [])
  const moi = new Set(emMoi)
  const canDoc = ds.filter((s) => moi.has(s) || !(s in cu.tho!.em) || hongCu.has(s))
  const docLai = new Set(canDoc)
  const giu = ds.filter((s) => !docLai.has(s))
  const vua: HoSoTho = canDoc.length > 0
    ? ((await loiDenHanTheoEm(url, mat, canDoc, tuyChon.ngay, ng.khoCa.map((c) => c.id))) as HoSoTho)
    : { em: {}, daGap: {}, hong: [], nhomTrung: {} }
  const tho: HoSoTho = {
    em: { ...Object.fromEntries(giu.map((s) => [s, cu.tho!.em[s] ?? []])), ...vua.em },
    daGap: { ...Object.fromEntries(giu.filter((s) => cu.tho!.daGap[s]).map((s) => [s, cu.tho!.daGap[s]!])), ...vua.daGap },
    hong: [...(vua.hong ?? [])],
    nhomTrung: { ...(cu.tho.nhomTrung ?? {}), ...(vua.nhomTrung ?? {}) },
  }
  const cauNgoai: Record<string, CauNgoai> = {}
  const hs = await dungHoSoVaCauNgoai(tho, ds, ng, cauNgoai)
  return rutTuHoSo(maCa, tuyChon.ngay, tuyChon.cheDo, ds, ng, cauNgoai, hs, tho, mocDoc)
}

/** Lượt nối sớm đang chạy theo ca — lúc chốt đợi nó (có trần) để biết câu nào đã nằm trong kho ca. */
const dangNoiSom = new Map<string, Promise<number>>()
/** Câu ngoài kho ĐÃ nối vào kho ca (theo ca, trong phiên màn này) — câu đã nối nằm luôn trong kho ca trên máy chủ, lúc chốt không gửi lại. */
const daNoiTheoCa = new Map<string, Set<string>>()
const daNoiCua = (maCa: string): Set<string> => { let s = daNoiTheoCa.get(maCa); if (!s) { s = new Set(); daNoiTheoCa.set(maCa, s) } return s }
/** Câu ngoài kho đã nối sẵn của một ca (màn / test đọc). */
export const docDaNoi = (maCa: string): ReadonlySet<string> => daNoiTheoCa.get(maCa) ?? new Set()
/** Trần chờ lượt nối sớm lúc bấm Bắt đầu (ms): quá trần thì lượt chốt tự nối các câu ấy (nối lặp an toàn ở máy chủ). */
const CHO_NOI_SOM_MS = 15_000

/** Thêm câu vào bản đề CÓ đáp án của ca trên máy này — bỏ câu đã có (nối sớm và lượt chốt có thể cùng nối một câu). */
async function luuBankThem(maCa: string, src: TeacherExamSource): Promise<void> {
  const bank = (await loadSessionTeacherBank(maCa)) ?? []
  const co = new Set(bank.flatMap((b) => [...b.phanI, ...b.phanII, ...b.phanIII].map((q) => q.id)))
  const loc: TeacherExamSource = { ...src, phanI: src.phanI.filter((q) => !co.has(q.id)), phanII: src.phanII.filter((q) => !co.has(q.id)), phanIII: src.phanIII.filter((q) => !co.has(q.id)) }
  if (loc.phanI.length + loc.phanII.length + loc.phanIII.length === 0) return
  await saveSessionTeacherBank(maCa, [...bank, loc])
}

/** Nối một nhóm câu ngoài kho vào kho ca (bản gửi máy em KHÔNG đáp án + bản có đáp án) rồi cất vào bản đề của máy này. */
async function noiVaoKhoCa(url: string, mat: string, maCa: string, canNoi: CauNgoai[]): Promise<void> {
  const src: TeacherExamSource = {
    maDe: `${maCa}-v2`,
    phanI: canNoi.filter((c) => c.phan === 'I').map((c) => c.cau as TeacherMcqQuestion),
    phanII: canNoi.filter((c) => c.phan === 'II').map((c) => c.cau as TeacherExamSource['phanII'][number]),
    phanIII: canNoi.filter((c) => c.phan === 'III').map((c) => c.cau as TeacherShortAnswerQuestion),
  }
  await noiKhoCa(url, mat, maCa, mergeAndStrip([src]), { phanI: src.phanI, phanII: src.phanII, phanIII: src.phanIII })
  await luuBankThem(maCa, src)
}

/**
 * NỐI SỚM (30/10): ngay sau khi CHẠY THỬ (ca còn ở phòng chờ), nối trước vào kho ca các câu ngoài kho mà bản chạy thử đã chọn — việc nặng nhất
 * của nút Bắt đầu (ca 269333: 344 câu, quá 25 giây lúc D1 nghẽn ⇒ đề mất hết câu sai cũ) dời ra lúc thầy còn chờ lớp vào phòng. Lúc bấm Bắt đầu
 * chỉ còn nối phần CHÊNH (câu mới được chọn sau). Câu đã nối mà cuối cùng không dùng chỉ nằm thừa trong kho ca (bản em không có đáp án).
 * Không chặn gì: lỗi ⇒ trả 0, lúc chốt nối như cũ.
 */
export async function noiSomCauNgoai(url: string, mat: string, maCa: string): Promise<number> {
  const dang = dangNoiSom.get(maCa)
  if (dang) return dang
  const viec = (async () => {
    const rt = nho.get(maCa)
    if (!rt) return 0
    const daNoi = daNoiCua(maCa)
    const dung = new Set(Object.values(rt.kq.theoEm).flatMap((ds) => ds.map((c) => c.qid)))
    const can = Object.entries(rt.cauNgoai).filter(([id]) => dung.has(id) && !daNoi.has(id))
    if (can.length === 0) return 0
    await noiVaoKhoCa(url, mat, maCa, can.map(([, c]) => c))
    for (const [id] of can) daNoi.add(id)
    return can.length
  })()
  dangNoiSom.set(maCa, viec)
  try {
    return await viec
  } catch {
    return 0
  } finally {
    dangNoiSom.delete(maCa)
  }
}

export interface KetQuaChotV2 {
  boTheoEm: Record<string, string[]>
  lapTheoEm: Record<string, string[]>
  bacTheoEm: Record<string, Record<string, BacLap>>
  bienBan: Record<string, unknown> & { lucRut: string }
  /** Số em rút thêm lúc bấm (vào phòng sau lượt chạy thử). */
  soEmRutThem: number
  /** Số em có lượt tự làm MỚI sau lúc chạy thử — vì họ mà cả lớp được rút lại bằng hồ sơ mới (0 = dùng lại bản chạy thử). */
  soEmCapNhat: number
  soCauNoiThem: number
  canhBao: string[]
}

/** CHỐT lúc bấm Bắt đầu: dùng lại chạy thử, rút thêm cho em trong phòng chờ chưa có bộ, nối câu ngoài kho vào kho ca. */
export async function chotRutDeCa(
  url: string,
  mat: string,
  maCa: string,
  dsCho: string[],
  tuyChon: { cheDo: 'ca' | 'diem_yeu'; ngay?: string; phamVi?: 'gan_nhat' | 'ba_ca' | 'khong' },
): Promise<KetQuaChotV2> {
  const ngay = tuyChon.ngay ?? ngayVnCua(Date.now())
  const canhBao: string[] = []
  let rt = nho.get(maCa)
  if (rt && (rt.ngay !== ngay || rt.cheDo !== tuyChon.cheDo)) rt = undefined // chạy thử từ hôm trước / chế độ khác ⇒ rút lại
  let soEmCapNhat = 0
  if (!rt) rt = await chayThuRutDeCa(url, mat, maCa, dsCho, { cheDo: tuyChon.cheDo, ngay })
  else {
    // CHẠY THỬ CŨ: em làm bài (mọi kênh) từ lúc chạy thử tới giờ ⇒ câu ấy không còn là câu "mới" của em. Có lượt mới của BẤT KỲ em nào
    // trong danh sách ca ⇒ rút lại CẢ LỚP bằng hồ sơ mới (cùng seed `maCa`: em không đổi dữ liệu thì ra đúng bộ cũ). Lỗi ⇒ giữ bản cũ + nói ra.
    const dsCa = [...new Set([...Object.keys(rt.kq.theoEm), ...dsCho.map((x) => String(x || '').trim()).filter(Boolean)])].sort()
    try {
      const mocKiem = new Date().toISOString() // TRƯỚC khi hỏi: lượt làm xen giữa vẫn bị bắt ở lần kiểm sau
      const { em: emMoi } = await coLuotMoiTheoEm(url, mat, dsCa, rt.mocDoc ?? rt.lucRut)
      if (emMoi.length > 0) {
        const cu = rt
        try {
          rt = await rutLaiTheoLuotMoi(url, mat, maCa, dsCa, emMoi, cu, { cheDo: tuyChon.cheDo, ngay }, mocKiem)
          soEmCapNhat = emMoi.length
        } catch (e) {
          rt = cu
          nho.set(maCa, cu)
          canhBao.push(`Chưa cập nhật được đề theo bài các em vừa làm — giữ đề đã chạy thử. ${e instanceof Error ? e.message : ''}`.trim())
        }
      }
    } catch (e) {
      canhBao.push(`Chưa kiểm được bài các em vừa làm — dùng đề đã chạy thử. ${e instanceof Error ? e.message : ''}`.trim())
    }
  }
  const them = [...new Set(dsCho.map((x) => String(x || '').trim()).filter(Boolean))].filter((s) => !rt!.kq.theoEm[s]).sort()
  if (them.length > 0) {
    const ng: NguonRut = { bank: (await loadSessionTeacherBank(maCa)) ?? [], soCau: { I: 0, II: 0, III: 0 }, khoCa: rt.khoCa }
    const cauNgoai = { ...rt.cauNgoai }
    const { hoSo, hong, nhomTrung, tho } = await docHoSoVaCauNgoai(url, mat, them, ngay, ng, cauNgoai)
    const kho = khoDayDu(rt.khoCa, cauNgoai)
    const kqThem = rutDeV2({ kho, soCau: { I: rt.kq.mucTieu.I.length, II: rt.kq.mucTieu.II.length, III: rt.kq.mucTieu.III.length }, mucTieu: rt.kq.mucTieu, dsSbd: them, hoSo, ngay, cheDo: rt.cheDo, seed: maCa, daDung: rt.kq.daDung })
    const thoGop: HoSoTho | undefined = rt.tho
      ? { em: { ...rt.tho.em, ...tho.em }, daGap: { ...rt.tho.daGap, ...tho.daGap }, hong: [...(rt.tho.hong ?? []), ...(tho.hong ?? [])], nhomTrung: { ...(rt.tho.nhomTrung ?? {}), ...(tho.nhomTrung ?? {}) } }
      : undefined
    rt = { ...rt, kq: gopKetQuaV2(rt.kq, kqThem), cauNgoai, kho, hoSo: { ...rt.hoSo, ...hoSo }, nhomTrung: { ...rt.nhomTrung, ...nhomTrung }, hongHoSo: [...rt.hongHoSo, ...hong], ...(thoGop ? { tho: thoGop } : {}) }
    nho.set(maCa, rt)
  }

  // NỐI CÂU NGOÀI KHO ĐÃ ĐƯỢC CHỌN vào kho ca (bản gửi máy em + bản có đáp án) TRƯỚC khi chốt — câu không có trong gói đề thì máy em
  // không hiện được. Nối hỏng ⇒ rút lại cả lớp chỉ từ kho ca (không phát câu máy em không có), và nói ra.
  // Lượt NỐI SỚM còn chạy ⇒ đợi nó (có trần) để biết câu nào đã nằm trong kho ca; câu đã nối sớm KHÔNG gửi lại.
  const dangNoi = dangNoiSom.get(maCa)
  if (dangNoi) await Promise.race([dangNoi.catch(() => 0), new Promise((xong) => setTimeout(xong, CHO_NOI_SOM_MS))])
  const daNoi = daNoiCua(maCa)
  const dung = new Set(Object.values(rt.kq.theoEm).flatMap((ds) => ds.map((c) => c.qid)))
  const canNoi = Object.entries(rt.cauNgoai).filter(([id]) => dung.has(id) && !daNoi.has(id)).map(([, c]) => c)
  const daNoiDung = Object.keys(rt.cauNgoai).filter((id) => dung.has(id) && daNoi.has(id)).length
  let soCauNoiThem = daNoiDung
  if (canNoi.length > 0) {
    try {
      await noiVaoKhoCa(url, mat, maCa, canNoi)
      for (const c of canNoi) daNoi.add(c.cau.id)
      soCauNoiThem = daNoiDung + canNoi.length
    } catch (e) {
      // Câu ĐÃ nối sớm vẫn nằm trong kho ca ⇒ rút lại từ kho ca + những câu ấy (bản cũ bỏ HẾT câu ngoài kho ⇒ đề «rút câu sai» mất câu sai cũ).
      canhBao.push(`Không nối được ${canNoi.length} câu ngoài kho (câu sai cũ, câu song sinh) vào ca — đã rút lại chỉ từ kho ca${daNoiDung > 0 ? ' và câu đã nối sẵn' : ''}. ${e instanceof Error ? e.message : ''}`.trim())
      const ds = Object.keys(rt.kq.theoEm)
      const cauNgoaiCo = Object.fromEntries(Object.entries(rt.cauNgoai).filter(([id]) => daNoi.has(id)))
      const kho = Object.keys(cauNgoaiCo).length > 0 ? khoDayDu(rt.khoCa, cauNgoaiCo) : rt.khoCa
      const kq = rutDeV2({ kho, soCau: { I: rt.kq.mucTieu.I.length, II: rt.kq.mucTieu.II.length, III: rt.kq.mucTieu.III.length }, mucTieu: rt.kq.mucTieu, dsSbd: ds, hoSo: rt.hoSo, ngay, cheDo: rt.cheDo, seed: maCa, ...(rt.nhomTrung ? { nhomTrung: rt.nhomTrung } : {}) })
      const dungMoi = new Set(Object.values(kq.theoEm).flatMap((x) => x.map((c) => c.qid)))
      soCauNoiThem = Object.keys(cauNgoaiCo).filter((id) => dungMoi.has(id)).length
      rt = { ...rt, kq, cauNgoai: cauNgoaiCo, kho }
      nho.set(maCa, rt)
    }
  }
  if (rt.hongHoSo.length > 0) canhBao.push(`${rt.hongHoSo.length} em chưa đọc được hồ sơ lỗi — các em đó nhận đề không có câu ôn lại.`)

  const bd = banDoTuKetQua(rt.kq)
  const kq = rt.kq
  const canCua: Record<string, number> = {}
  const soLapCua: Record<string, number> = {}
  const saiCaTruocCua: Record<string, number> = {}
  const cauGocTheoEm: Record<string, string[]> = {}
  const songSinhTheoEm: Record<string, string[]> = {}
  for (const [sbd, ds] of Object.entries(kq.theoEm)) {
    const lap = ds.filter((c) => BAC_HOI_LAI.has(c.bac))
    soLapCua[sbd] = lap.length
    canCua[sbd] = lap.length + (kq.loiChuaXep[sbd] ?? 0)
    saiCaTruocCua[sbd] = loiDungDuoc(rt.hoSo[sbd]?.loi ?? [], ngay, rt.cheDo).length
    const goc = ds.filter((c) => c.bac === 'muc_dich').map((c) => c.qid)
    const ss = ds.filter((c) => c.bac === 'song_sinh' || c.bac === 'cung_dang').map((c) => c.qid)
    if (goc.length) cauGocTheoEm[sbd] = goc
    if (ss.length) songSinhTheoEm[sbd] = ss
  }
  const lucRut = new Date().toISOString()
  const bienBan = {
    canCua,
    soLapCua,
    saiCaTruocCua,
    thieu: [],
    boQua: [],
    caDaQuet: [],
    ...(tuyChon.phamVi ? { phamVi: tuyChon.phamVi } : {}),
    cauGocTheoEm,
    songSinhTheoEm,
    ghiChu: [
      { loai: 'tin' as const, loi: `rút đề v2 (${rt.cheDo === 'diem_yeu' ? 'kiểm tra điểm yếu' : kq.mucDoCung ? 'ma trận cứng' : 'ca ngắn'}): câu sai đến lịch ôn lại → câu song sinh → câu cùng dạng → câu mới` },
      ...canhBao.map((loi) => ({ loai: 'canh_bao' as const, loi })),
    ],
    lucRut,
    v2: { cheDo: rt.cheDo, mucDoCung: kq.mucDoCung, mucTieu: kq.mucTieu, thieu: kq.thieu, loiChuaXep: kq.loiChuaXep },
  }
  return { boTheoEm: bd.bo, lapTheoEm: bd.lap, bacTheoEm: bd.bac, bienBan, soEmRutThem: them.length, soEmCapNhat, soCauNoiThem, canhBao }
}
