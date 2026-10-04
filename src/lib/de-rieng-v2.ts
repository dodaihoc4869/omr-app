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
import { loiDenHanTheoEm, noiKhoCa, type LoiDenHanEm } from './exam-api'
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
  kho: CauKhoV2[]
  khoCa: CauKhoV2[]
  /** Em không đọc được hồ sơ lỗi — rút như em chưa có lỗi nào (vẫn đủ câu). */
  hongHoSo: string[]
  lucRut: string
  /** Thời gian chạy thuật toán trên máy này (ms). */
  msThuatToan: number
}

const nho = new Map<string, RutThuCa>()
/** Kết quả chạy thử đang giữ của một ca (màn Theo dõi đọc để vẽ bảng). */
export const docRutThu = (maCa: string): RutThuCa | undefined => nho.get(maCa)
export const boRutThu = (maCa: string): void => void nho.delete(maCa)

/** Dựng câu song sinh thành câu đề CÓ đáp án (chỉ nằm ở máy thầy + kho đáp án của ca). */
function cauTuSongSinh(l: LoiDenHanEm, goc?: { mucDo?: unknown; chuyenDe?: string; dang?: unknown }): CauNgoai | null {
  const ss = l.cauSongSinh
  if (!ss || !ss.id || !ss.text) return null
  const them = { ...(goc?.mucDo ? { mucDo: goc.mucDo } : l.mucDo ? { mucDo: l.mucDo } : {}), ...(goc?.chuyenDe ? { chuyenDe: goc.chuyenDe } : {}), ...(goc?.dang ? { dang: goc.dang } : {}),
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
): Promise<{ hoSo: Record<string, HoSoEmV2>; hong: string[] }> {
  const r = await loiDenHanTheoEm(url, mat, dsSbd, ngay, ng.khoCa.map((c) => c.id))
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
  return { hoSo, hong: r.hong }
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
  const { hoSo, hong } = await docHoSoVaCauNgoai(url, mat, ds, ngay, ng, cauNgoai)
  const kho = khoDayDu(ng.khoCa, cauNgoai)
  const t0 = performance.now()
  const kq = rutDeV2({ kho, soCau: ng.soCau, dsSbd: ds, hoSo, ngay, cheDo: tuyChon.cheDo, seed: maCa })
  const rt: RutThuCa = { maCa, ngay, cheDo: tuyChon.cheDo, kq, cauNgoai, hoSo, kho, khoCa: ng.khoCa, hongHoSo: hong, lucRut: new Date().toISOString(), msThuatToan: performance.now() - t0 }
  nho.set(maCa, rt)
  return rt
}

export interface KetQuaChotV2 {
  boTheoEm: Record<string, string[]>
  lapTheoEm: Record<string, string[]>
  bacTheoEm: Record<string, Record<string, BacLap>>
  bienBan: Record<string, unknown> & { lucRut: string }
  /** Số em rút thêm lúc bấm (vào phòng sau lượt chạy thử). */
  soEmRutThem: number
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
  if (!rt) rt = await chayThuRutDeCa(url, mat, maCa, dsCho, { cheDo: tuyChon.cheDo, ngay })
  const them = [...new Set(dsCho.map((x) => String(x || '').trim()).filter(Boolean))].filter((s) => !rt!.kq.theoEm[s]).sort()
  if (them.length > 0) {
    const ng: NguonRut = { bank: (await loadSessionTeacherBank(maCa)) ?? [], soCau: { I: 0, II: 0, III: 0 }, khoCa: rt.khoCa }
    const cauNgoai = { ...rt.cauNgoai }
    const { hoSo, hong } = await docHoSoVaCauNgoai(url, mat, them, ngay, ng, cauNgoai)
    const kho = khoDayDu(rt.khoCa, cauNgoai)
    const kqThem = rutDeV2({ kho, soCau: { I: rt.kq.mucTieu.I.length, II: rt.kq.mucTieu.II.length, III: rt.kq.mucTieu.III.length }, mucTieu: rt.kq.mucTieu, dsSbd: them, hoSo, ngay, cheDo: rt.cheDo, seed: maCa, daDung: rt.kq.daDung })
    rt = { ...rt, kq: gopKetQuaV2(rt.kq, kqThem), cauNgoai, kho, hoSo: { ...rt.hoSo, ...hoSo }, hongHoSo: [...rt.hongHoSo, ...hong] }
    nho.set(maCa, rt)
  }

  // NỐI CÂU NGOÀI KHO ĐÃ ĐƯỢC CHỌN vào kho ca (bản gửi máy em + bản có đáp án) TRƯỚC khi chốt — câu không có trong gói đề thì máy em
  // không hiện được. Nối hỏng ⇒ rút lại cả lớp chỉ từ kho ca (không phát câu máy em không có), và nói ra.
  const dung = new Set(Object.values(rt.kq.theoEm).flatMap((ds) => ds.map((c) => c.qid)))
  const canNoi = Object.entries(rt.cauNgoai).filter(([id]) => dung.has(id)).map(([, c]) => c)
  let soCauNoiThem = 0
  if (canNoi.length > 0) {
    const src: TeacherExamSource = {
      maDe: `${maCa}-v2`,
      phanI: canNoi.filter((c) => c.phan === 'I').map((c) => c.cau as TeacherMcqQuestion),
      phanII: canNoi.filter((c) => c.phan === 'II').map((c) => c.cau as TeacherExamSource['phanII'][number]),
      phanIII: canNoi.filter((c) => c.phan === 'III').map((c) => c.cau as TeacherShortAnswerQuestion),
    }
    try {
      await noiKhoCa(url, mat, maCa, mergeAndStrip([src]), { phanI: src.phanI, phanII: src.phanII, phanIII: src.phanIII })
      const bank = (await loadSessionTeacherBank(maCa)) ?? []
      await saveSessionTeacherBank(maCa, [...bank, src])
      soCauNoiThem = canNoi.length
    } catch (e) {
      canhBao.push(`Không nối được ${canNoi.length} câu ngoài kho (câu sai cũ, câu song sinh) vào ca — đã rút lại chỉ từ kho ca. ${e instanceof Error ? e.message : ''}`.trim())
      const ds = Object.keys(rt.kq.theoEm)
      const kq = rutDeV2({ kho: rt.khoCa, soCau: { I: rt.kq.mucTieu.I.length, II: rt.kq.mucTieu.II.length, III: rt.kq.mucTieu.III.length }, mucTieu: rt.kq.mucTieu, dsSbd: ds, hoSo: rt.hoSo, ngay, cheDo: rt.cheDo, seed: maCa })
      rt = { ...rt, kq, cauNgoai: {}, kho: rt.khoCa }
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
  return { boTheoEm: bd.bo, lapTheoEm: bd.lap, bacTheoEm: bd.bac, bienBan, soEmRutThem: them.length, soCauNoiThem, canhBao }
}
