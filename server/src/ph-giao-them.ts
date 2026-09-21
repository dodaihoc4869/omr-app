// `POST /ph/giao-them` — MỘT NÚT "Giao thêm bài cho con" của phụ huynh (thầy lệnh 21/09; đề bài prompt-ph-giao-them-bai-2109.md; hợp đồng docs/hop-dong-ph-giao-them-2109.md mục 5).
// Máy chủ DỰNG đầu vào cho hàm thuần `tinhGiaoThem` (Code 1, `src/lib/giao-them-cho-con.ts`: quyết ĐỊNH giao hay từ chối và CƠ CẤU), rồi CHỌN qid cụ thể theo cơ cấu đó (KHÔNG tự luận, KHÔNG đề thi đang bảo vệ, KHÔNG câu của bài tập về nhà chưa nộp,
// KHÔNG câu làm trong 14 ngày trừ câu đến lịch ôn, KHÔNG vượt bậc + 1), tạo bài qua đường "Bài gia đình giao" (`mom_bai`), ghi lượt vào `ph_giao_them` (trần 3 lượt THÀNH CÔNG/ngày VN, bấm đúp không tạo hai gói) và báo cho con MỘT tin.
// Lượt bị từ chối KHÔNG ghi gì và KHÔNG mất lượt. Không đáp án xuống máy phụ huynh: lệnh chỉ trả cơ cấu + chữ, không trả câu.
import type { Env } from './kieu'
import { GIAO_THEM, tinhGiaoThem, type DangCuaCon, type DauVaoGiaoThem, type KetQuaGiaoThem, type ThanhPhanGiaoThem, type ViecBatBuoc } from '../../src/lib/giao-them-cho-con'
import { phutUocTinhChang } from '../../src/lib/btvn-nang-do-lich'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { chuHan } from './canh-bao-thay'
import { protectedQuestions } from './game-v2-bank'
import { dangYeu, type NamKtDang } from './ho-so-nam-kt'
import { lapVaLuuKeHoach } from './ke-hoach-ngay-d1'
import { mom } from './mom'
import { cauChoMom, docCauKho } from './parent-news-nguon-cau'
import { THU_TU_MUC_DO } from './parent-news-chon-cau'
import { sbdCuaPhuHuynh } from './ph-truy-cap'
import { ngayVn } from './su-kien-hoc'
import { tenCuaCacDang } from './ten-dang-bo-nao'

type Row = Record<string, unknown>
const MOT_NGAY_MS = 86_400_000
const SO_NGAY_KHONG_LAI = 14
const LOP_HOP_LE = new Set(['10', '11', '12'])
const TIEU_DE_TIN = 'A.I Đỗ Đại Học · Bài gia đình giao'
const so = (v: unknown): number => Number(v) || 0
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
const json = (v: unknown): string => JSON.stringify(v)
const themNgay = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * MOT_NGAY_MS).toISOString().slice(0, 10)

/** Bảng/cột chưa có (migration chưa chạy) ⇒ giá trị mặc định; lỗi khác vẫn ném. */
async function tat<T>(f: () => Promise<T>, dpr: T): Promise<T> {
  try {
    return await f()
  } catch (e) {
    if (/no such (table|column)/i.test(e instanceof Error ? e.message : String(e))) return dpr
    throw e
  }
}
const rong = { results: [] as Row[] }

interface HangLuot {
  khoa: string
  luot: number
  soCau: number
  phutUocTinh: number
  thanhPhan: ThanhPhanGiaoThem[]
  lyDo: string[]
  maMom: string
  luc: string
  qid: string[]
}
const docHang = (x: Row): HangLuot => ({
  khoa: chuoi(x.khoa), luot: so(x.luot), soCau: so(x.so_cau), phutUocTinh: so(x.phut_uoc_tinh), thanhPhan: parse<ThanhPhanGiaoThem[]>(x.thanh_phan_json, []),
  lyDo: parse<string[]>(x.ly_do_json, []), maMom: chuoi(x.ma_mom), luc: chuoi(x.luc), qid: parse<string[]>(x.qid_json, []),
})
function parse<T>(v: unknown, mac: T): T {
  try { return typeof v === 'string' && v ? (JSON.parse(v) as T) : mac } catch { return mac }
}

const mucCua = (q: PrivateQuestion): number => THU_TU_MUC_DO.indexOf((q.mucDo ?? '') as never)

// ================================================================== DỰNG ĐẦU VÀO + CHỌN CÂU ==================================================================

interface Nguon {
  dauVao: DauVaoGiaoThem
  /** Câu ĐẾN LỊCH ôn khả dụng (đã xếp: mốc sớm trước, sai nhiều trước). */
  denLichOn: PrivateQuestion[]
  /** Câu từng sai chưa khắc phục, khả dụng, KHÔNG đến lịch. */
  saiChuaKhacPhuc: PrivateQuestion[]
  /** Câu mới theo dạng: `theoDang[ma][mức]` = câu khả dụng (đã loại câu đã làm 14 ngày, câu bài tập chưa nộp, câu thuộc hai nhóm trên). */
  theoDang: Map<string, Map<number, PrivateQuestion[]>>
  ten: Map<string, string>
  goiTruocMom?: string
}

async function dungNguon(env: Env, sbd: string, nowMs: number, cacHang: HangLuot[]): Promise<Nguon> {
  const homNay = ngayVn(nowMs)
  const lopEm = chuoi((await tat(() => env.DB.prepare('SELECT lop FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<Row>(), null))?.lop)
  const loLop = LOP_HOP_LE.has(lopEm) ? ' AND d.lop = ?' : ''
  const themLop = LOP_HOP_LE.has(lopEm) ? [lopEm] : []
  // KẾ HOẠCH NGÀY TRƯỚC, đọc hồ sơ SAU: `lapVaLuuKeHoach` dựng lại hồ sơ nắm kiến thức từ sổ khi sổ đổi so với lần lập trước — đọc song song sẽ thấy bảng đang bị xoá dựng lại.
  const kh = (await lapVaLuuKeHoach(env, [sbd], nowMs)).get(sbd)
  const [rDang, rCau, rGan, rHomNay, rGiay, rBtvn, baoVe] = await Promise.all([
    tat(() => env.DB.prepare('SELECT * FROM nam_kt_dang WHERE sbd = ?').bind(sbd).all<Row>(), rong),
    tat(() => env.DB.prepare(
      `SELECT qid, ma_dang, trang_thai, moc_on_ke, lan_sai FROM nam_kt_cau
        WHERE sbd = ? AND trang_thai IN ('moi_sai','dang_on','da_khac_phuc') AND can_day_lai = 0 ORDER BY moc_on_ke, lan_sai DESC, qid LIMIT 1200`,
    ).bind(sbd).all<Row>(), rong),
    tat(() => env.DB.prepare('SELECT qid, MAX(ngay_vn) AS ngay FROM su_kien_hoc WHERE sbd = ? AND ngay_vn >= ? GROUP BY qid').bind(sbd, themNgay(homNay, -(SO_NGAY_KHONG_LAI - 1))).all<Row>(), rong),
    tat(() => env.DB.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN ket_qua = 1 THEN 1 ELSE 0 END), 0) AS d FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND ket_qua IS NOT NULL').bind(sbd, homNay).first<Row>(), null),
    tat(() => env.DB.prepare('SELECT giay FROM su_kien_hoc WHERE sbd = ? AND ngay_vn >= ? AND giay BETWEEN 5 AND 1200 ORDER BY luc DESC LIMIT 300').bind(sbd, themNgay(homNay, -13)).all<Row>(), rong),
    tat(() => env.DB.prepare(
      `SELECT DISTINCT c.qid FROM btvn_em_cau c JOIN btvn_em e ON e.ma_btvn = c.ma_btvn AND e.sbd = c.sbd JOIN btvn b ON b.ma_btvn = c.ma_btvn
        WHERE c.sbd = ? AND e.nop_luc IS NULL AND e.thu_hoi = 0 AND b.da_xoa = 0`,
    ).bind(sbd).all<Row>(), rong),
    protectedQuestions(env),
  ])
  if (!kh) throw new Error('Chưa lập được kế hoạch ngày của con nên chưa giao thêm được.')

  const dangEm: NamKtDang[] = (rDang.results ?? []).map((x) => ({
    sbd, maDang: chuoi(x.ma_dang), soGap: so(x.so_gap), soSai: so(x.so_sai), soDaKhacPhuc: so(x.so_da_khac_phuc), soMoiSai: so(x.so_moi_sai), soChuaThaySai: so(x.so_chua_thay_sai), bac: so(x.bac),
    mocOnKe: x.moc_on_ke ? chuoi(x.moc_on_ke) : null, mocMoiSai: x.moc_moi_sai ? chuoi(x.moc_moi_sai) : null,
  })).filter((d) => d.maDang && !d.maDang.startsWith('CD:'))
  const daLam14 = new Set((rGan.results ?? []).map((x) => chuoi(x.qid)))
  // Câu đã làm HÔM NAY hoặc đã nằm trong gói giao thêm hôm nay không bao giờ giao lại trong ngày (kể cả câu đến lịch ôn mà con vừa sai lại).
  const khongGiaoLai = new Set<string>([...(rGan.results ?? []).filter((x) => chuoi(x.ngay) === homNay).map((x) => chuoi(x.qid)), ...cacHang.flatMap((h) => h.qid)])
  const btvnChuaNop = new Set((rBtvn.results ?? []).map((x) => chuoi(x.qid)))

  // Câu đến lịch / câu sai chưa khắc phục (theo hồ sơ), rồi đọc nội dung từ kho — CHỈ câu dùng được.
  const denLichQid: string[] = []
  const saiQid: string[] = []
  for (const x of rCau.results ?? []) {
    const q = chuoi(x.qid)
    const moc = chuoi(x.moc_on_ke)
    if (moc && moc <= homNay) denLichQid.push(q)
    else if (chuoi(x.trang_thai) === 'moi_sai' || chuoi(x.trang_thai) === 'dang_on') saiQid.push(q)
  }
  const kho = new Map<string, PrivateQuestion>()
  const nap = (ds: PrivateQuestion[]) => { for (const q of ds) if (!kho.has(q.qid)) kho.set(q.qid, q) }
  const cacQid = [...new Set([...denLichQid, ...saiQid])].slice(0, 600)
  if (cacQid.length > 0) nap(await docCauKho(env, 'AND q.qid IN (SELECT value FROM json_each(?))', [json(cacQid)], baoVe, 600))
  const maDangLay = [...dangEm].sort((a, b) => Number(dangYeu(b, homNay)) - Number(dangYeu(a, homNay)) || b.soMoiSai - a.soMoiSai || a.maDang.localeCompare(b.maDang)).slice(0, 12).map((d) => d.maDang)
  const khoDang = new Map<string, PrivateQuestion>()
  if (maDangLay.length > 0) for (const q of await docCauKho(env, `AND q.dang IN (SELECT value FROM json_each(?))${loLop}`, [json(maDangLay), ...themLop], baoVe, 600)) khoDang.set(q.qid, q)

  const khaDungCu = (qid: string) => kho.get(qid) ?? khoDang.get(qid)
  const denLichOn = denLichQid.map(khaDungCu).filter((q): q is PrivateQuestion => !!q && !btvnChuaNop.has(q.qid) && !khongGiaoLai.has(q.qid))
  const daLayDen = new Set(denLichOn.map((q) => q.qid))
  const saiChuaKhacPhuc = saiQid
    .filter((q) => !daLam14.has(q) && !daLayDen.has(q) && !khongGiaoLai.has(q))
    .map(khaDungCu)
    .filter((q): q is PrivateQuestion => !!q && !btvnChuaNop.has(q.qid))
  const daLayNhom = new Set([...daLayDen, ...saiChuaKhacPhuc.map((q) => q.qid), ...denLichQid, ...saiQid])

  const theoDang = new Map<string, Map<number, PrivateQuestion[]>>()
  for (const q of khoDang.values()) {
    if (!q.dang || daLam14.has(q.qid) || khongGiaoLai.has(q.qid) || btvnChuaNop.has(q.qid) || daLayNhom.has(q.qid)) continue
    const muc = mucCua(q)
    if (muc < 0) continue
    const m = theoDang.get(q.dang) ?? new Map<number, PrivateQuestion[]>()
    m.set(muc, [...(m.get(muc) ?? []), q])
    theoDang.set(q.dang, m)
  }
  const ten = await tenCuaCacDang(env, maDangLay)

  const dang: DangCuaCon[] = dangEm.filter((d) => maDangLay.includes(d.maDang)).map((d) => {
    const bac = (d.bac === 0 ? 0 : d.bac === 2 ? 2 : 1) as 0 | 1 | 2
    const yeu = dangYeu(d, homNay)
    const dem = (muc: number) => theoDang.get(d.maDang)?.get(muc)?.length ?? 0
    return {
      ma: d.maDang, ten: ten.get(d.maDang), bac, vap: yeu || d.soMoiSai > 0, yeu, tiLeKhacPhuc: d.soGap > 0 ? (d.soDaKhacPhuc + d.soChuaThaySai) / d.soGap : null, soSai7: d.soMoiSai,
      soKhaDungDungBac: dem(bac), soKhaDungThapHon: bac > 0 ? dem(bac - 1) : 0, soKhaDungCaoHon: bac < 2 ? dem(bac + 1) : 0,
    }
  })

  // Ngân sách hôm nay + việc BẮT BUỘC còn lại (đúng thứ Bảng nhiệm vụ đang xếp "Bắt buộc hôm nay").
  const batBuocConLai: ViecBatBuoc[] = kh.viec
    .filter((v) => v.hien && v.batBuoc && v.soCau > 0 && !String(v.id).startsWith('mom:giao_them_')) // gói giao thêm trước là việc riêng (`goiTruoc`), không tính là "bắt buộc" khác
    .map((v) => {
      const chiSo = so((v.chiTiet as Row | undefined)?.chiSo)
      const loai: ViecBatBuoc['loai'] = v.loai === 'btvn_lo' ? 'chang_btvn' : v.loai === 'on_lai' ? 'on_lai' : 'khac'
      const ten = v.loai === 'btvn_lo' ? `chặng ${chiSo + 1} bài tập về nhà` : v.loai === 'on_lai' ? 'phần ôn lại' : v.loai === 'mom' ? 'bài gia đình giao' : 'việc bắt buộc'
      return { loai, soCau: v.soCau, ten, ...(v.hanCung ? { han: chuHan(v.hanCung, nowMs) } : {}) }
    })
  const onLaiBatBuoc = batBuocConLai.filter((v) => v.loai === 'on_lai').reduce((t, v) => t + v.soCau, 0)

  // Gói trước (gần nhất hôm nay): số câu đã làm theo sổ.
  const truoc = cacHang[cacHang.length - 1]
  let goiTruoc: DauVaoGiaoThem['goiTruoc'] = null
  if (truoc) {
    const r = await tat(() => env.DB.prepare("SELECT COUNT(DISTINCT qid) AS n FROM su_kien_hoc WHERE sbd = ? AND nguon = 'mom' AND ma_nguon = ? AND ket_qua IS NOT NULL").bind(sbd, truoc.maMom).first<Row>(), null)
    goiTruoc = { soCau: truoc.soCau, soDaLam: so(r?.n), lucGiaoMs: Date.parse(truoc.luc) || nowMs }
  }
  const giay = (rGiay.results ?? []).map((x) => so(x.giay)).sort((a, b) => a - b)
  const giayMoiCau = giay.length >= 5 ? giay[Math.floor(giay.length / 2)] : undefined

  return {
    dauVao: {
      hoSo: { dang, soCauDenLichOn: Math.max(0, denLichOn.length - onLaiBatBuoc), soCauSaiChuaKhacPhuc: saiChuaKhacPhuc.length },
      nganSach: { mucTieuCau: kh.nganSach.mucTieuCau, daLam: so(rHomNay?.n), dung: so(rHomNay?.d), batBuocConLai },
      bayGioMs: nowMs, luot: cacHang.length + 1, tongDaGiaoHomNay: cacHang.reduce((t, h) => t + h.soCau, 0), goiTruoc, ...(giayMoiCau ? { giayMoiCau } : {}),
    },
    denLichOn, saiChuaKhacPhuc, theoDang, ten,
  }
}

/** Chọn qid đúng `thanhPhan` (theo thứ tự ưu tiên), các nhóm KHÔNG trùng nhau. Chọn được ít hơn thì trả đúng số chọn được. */
function chonQid(thanhPhan: ThanhPhanGiaoThem[], n: Nguon): { cau: PrivateQuestion[]; thucTe: ThanhPhanGiaoThem[] } {
  const da = new Set<string>()
  const cau: PrivateQuestion[] = []
  const thucTe: ThanhPhanGiaoThem[] = []
  const lay = (ds: PrivateQuestion[], so_: number): PrivateQuestion[] => {
    const ra: PrivateQuestion[] = []
    for (const q of ds) {
      if (ra.length >= so_) break
      if (da.has(q.qid)) continue
      da.add(q.qid); ra.push(q)
    }
    return ra
  }
  const theoBac = (ma: string, thuTuMuc: number[]): PrivateQuestion[] => thuTuMuc.flatMap((m) => n.theoDang.get(ma)?.get(m) ?? [])
  for (const tp of thanhPhan) {
    let chon: PrivateQuestion[] = []
    if (tp.loai === 'on_lai') chon = lay(n.denLichOn, tp.soCau)
    else if (tp.loai === 'cau_sai') chon = lay(n.saiChuaKhacPhuc, tp.soCau)
    else if (tp.loai === 'dang_vap' && tp.dang) {
      const d = n.dauVao.hoSo.dang.find((x) => x.ma === tp.dang)
      const bac = d?.bac ?? 1
      // gợi ý bậc: thấp hơn một bậc trước khi con vấp nặng; ngoài ra đúng bậc; luôn trong [bậc − 1, bậc] (không vượt bậc + 1)
      const thuTu = tp.bac === 'thap_hon_mot_bac' ? [bac - 1, bac] : [bac, bac - 1]
      chon = lay(theoBac(tp.dang, thuTu.filter((m) => m >= 0 && m <= 2)), tp.soCau)
    } else if (tp.loai === 'thu_suc' && tp.dang) {
      const bac = n.dauVao.hoSo.dang.find((x) => x.ma === tp.dang)?.bac ?? 1
      chon = bac < 2 ? lay(theoBac(tp.dang, [bac + 1]), 1) : []
    }
    if (chon.length > 0) {
      cau.push(...chon)
      thucTe.push({ ...tp, ...(tp.dang && n.ten.get(tp.dang) ? { tenDang: n.ten.get(tp.dang) } : {}), soCau: chon.length } as ThanhPhanGiaoThem)
    }
  }
  return { cau, thucTe }
}

/** Lời cho phụ huynh khi số câu giao thật khác số hàm đề nghị (chọn được ít hơn): dựng lại từ SỐ THẬT, không nhắc game. */
function lyDoTuSoThat(thanhPhan: ThanhPhanGiaoThem[], tong: number, phut: number, ten: Map<string, string>): string[] {
  const chu = (t: ThanhPhanGiaoThem): string => {
    const dang = t.dang ? (ten.get(t.dang) ?? t.dang) : ''
    if (t.loai === 'on_lai') return `${t.soCau} câu ôn lại đến lịch`
    if (t.loai === 'dang_vap') return `${t.soCau} câu dạng ${dang} (dạng con đang vấp)`
    if (t.loai === 'cau_sai') return `${t.soCau} câu con từng sai chưa khắc phục`
    return `${t.soCau} câu thử sức khó hơn một bậc ở dạng ${dang}`
  }
  return [`Đã giao cho con ${tong} câu, khoảng ${phut} phút.`, thanhPhan.map(chu).join(' · ')].filter(Boolean)
}

// ================================================================== LỆNH ==================================================================

const conLai = (cacHang: HangLuot[]): number => Math.max(0, GIAO_THEM.SO_LUOT_TOI_DA - cacHang.length)

async function goiGanNhat(env: Env, sbd: string, hang: HangLuot | undefined): Promise<Row | undefined> {
  if (!hang) return undefined
  const r = await tat(
    () => env.DB.prepare("SELECT COUNT(DISTINCT qid) AS n, COALESCE(SUM(CASE WHEN ket_qua = 1 THEN 1 ELSE 0 END), 0) AS d FROM su_kien_hoc WHERE sbd = ? AND nguon = 'mom' AND ma_nguon = ? AND ket_qua IS NOT NULL").bind(sbd, hang.maMom).first<Row>(),
    null,
  )
  return { luc: hang.luc, soCau: hang.soCau, soDaLam: so(r?.n), soDung: so(r?.d), phutUocTinh: hang.phutUocTinh }
}

const daGiaoTuHang = (h: HangLuot, laLuotCu: boolean): Row => ({ soCau: h.soCau, luot: h.luot, luc: h.luc, phutUocTinh: h.phutUocTinh, lyDo: h.lyDo, thanhPhan: h.thanhPhan, laLuotCu })

export async function phGiaoThem(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Row> {
  const { sbd } = await sbdCuaPhuHuynh(env, b, 'ph-giao-them', { chiToken: true })
  const ngay = ngayVn(nowMs)
  const rHang = await tat(() => env.DB.prepare('SELECT * FROM ph_giao_them WHERE sbd = ? AND ngay_vn = ? ORDER BY luot').bind(sbd, ngay).all<Row>(), null)
  if (rHang === null) return { ok: false, error: 'Máy chủ chưa cập nhật bảng giao thêm (cần chạy migration-2109-ph-giao-them.sql).' }
  const cacHang = (rHang.results ?? []).map(docHang)
  const khoaPhut = `${sbd}|${ngay}|${new Date(nowMs).toISOString().slice(0, 16)}`
  const base = { ok: true, serverNow: nowMs }

  if (b.chiXem === true) {
    const g = await goiGanNhat(env, sbd, cacHang[cacHang.length - 1])
    return { ...base, conLaiHomNay: conLai(cacHang), ...(g ? { goiGanNhat: g } : {}) }
  }
  // Bấm đúp CÙNG PHÚT: trả lại gói vừa giao, không tạo gói mới, không mất thêm lượt.
  const trung = cacHang.find((h) => h.khoa === khoaPhut)
  if (trung) return { ...base, conLaiHomNay: conLai(cacHang), goiGanNhat: await goiGanNhat(env, sbd, cacHang[cacHang.length - 1]), daGiao: daGiaoTuHang(trung, true) }

  const nguon = await dungNguon(env, sbd, nowMs, cacHang)
  const kq: KetQuaGiaoThem = tinhGiaoThem(nguon.dauVao)
  const g0 = await goiGanNhat(env, sbd, cacHang[cacHang.length - 1])
  const tuChoi = (ma: string, lyDo: string[]): Row => ({ ...base, conLaiHomNay: conLai(cacHang), ...(g0 ? { goiGanNhat: g0 } : {}), tuChoi: { ma, lyDo } })
  if (kq.tuChoi) return tuChoi(kq.tuChoi.ma, kq.tuChoi.lyDo)

  const { cau, thucTe } = chonQid(kq.thanhPhan, nguon)
  const h = nguon.dauVao.hoSo
  if (cau.length < GIAO_THEM.TOI_THIEU_MOI_GOI) {
    const vap = h.dang.reduce((t, d) => t + d.soKhaDungDungBac + d.soKhaDungThapHon, 0)
    return tuChoi('khong_co_cau', [`Hôm nay chưa có đủ câu phù hợp để giao thêm (ôn lại ${nguon.denLichOn.length} câu, dạng con đang vấp ${vap} câu, câu từng sai ${nguon.saiChuaKhacPhuc.length} câu).`])
  }
  const tong = cau.length
  const giay = nguon.dauVao.giayMoiCau ?? 90
  const phut = tong === kq.soCau ? kq.phutUocTinh : phutUocTinhChang(tong, giay)
  const lyDo = tong === kq.soCau ? kq.lyDo : lyDoTuSoThat(thucTe, tong, phut, nguon.ten)
  const luc = new Date(nowMs).toISOString()

  // GHI LƯỢT (nguyên tử): chỉ chèn khi CHƯA đủ 3 lượt trong ngày; lượt = số dòng + 1 tính ngay trong câu lệnh. Trùng khoá phút / trùng lượt ⇒ không chèn.
  const ma = `giao_them_${ngay}_` // mã bài chỉ nhận chữ, số, gạch dưới, gạch nối (`mom.ts`)
  const ins = await env.DB.prepare(
    `INSERT OR IGNORE INTO ph_giao_them (khoa, sbd, ngay_vn, luot, so_cau, phut_uoc_tinh, thanh_phan_json, ly_do_json, ma_mom, qid_json, luc)
     SELECT ?, ?, ?, n.luot, ?, ?, ?, ?, ? || n.luot, ?, ?
       FROM (SELECT COUNT(*) + 1 AS luot FROM ph_giao_them WHERE sbd = ? AND ngay_vn = ?) n WHERE n.luot <= ?`,
  ).bind(khoaPhut, sbd, ngay, tong, phut, json(thucTe), json(lyDo), ma, json(cau.map((q) => q.qid)), luc, sbd, ngay, GIAO_THEM.SO_LUOT_TOI_DA).run()
  const rSau = await env.DB.prepare('SELECT * FROM ph_giao_them WHERE sbd = ? AND ngay_vn = ? ORDER BY luot').bind(sbd, ngay).all<Row>()
  const sau = (rSau.results ?? []).map(docHang)
  const cua = sau.find((x) => x.khoa === khoaPhut)
  if (!Number(ins.meta?.changes ?? 0) || !cua) {
    const trung2 = sau.find((x) => x.khoa === khoaPhut)
    if (trung2) return { ...base, conLaiHomNay: conLai(sau), goiGanNhat: await goiGanNhat(env, sbd, sau[sau.length - 1]), daGiao: daGiaoTuHang(trung2, true) }
    return { ...base, conLaiHomNay: conLai(sau), tuChoi: { ma: 'het_luot', lyDo: ['Hôm nay anh/chị đã giao đủ 3 lượt, mai giao tiếp được.'] } }
  }

  // Tạo bài "gia đình giao" cho con; lỗi ⇒ trả lại lượt (xoá dòng vừa ghi) và báo, KHÔNG mất lượt.
  try {
    await mom(env, 'create', { sbd, id: cua.maMom, tieuDe: `Gia đình giao thêm · ${tong} câu`, dsCau: cau.map(cauChoMom) }, { noiBo: true })
  } catch (e) {
    await env.DB.prepare('DELETE FROM ph_giao_them WHERE khoa = ?').bind(khoaPhut).run()
    return { ok: false, error: e instanceof Error ? e.message : 'Chưa giao được bài. Anh/chị thử lại sau.' }
  }
  // MỘT tin cho con: đặt ĐÚNG mã tin của bài mom (`mom:<sbd>:<id>`) để đường đồng bộ thông báo không tạo thêm tin chung chung.
  await env.DB.prepare('INSERT OR IGNORE INTO student_notice (id, sbd, title, body, target, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(`mom:${sbd}:${cua.maMom}`, sbd, TIEU_DE_TIN, `Gia đình vừa giao cho em ${tong} câu, khoảng ${phut} phút. A.I Đỗ Đại Học đã chọn các câu hợp với em hôm nay.`, 'mom', luc)
    .run()
  return { ...base, conLaiHomNay: conLai(sau), goiGanNhat: await goiGanNhat(env, sbd, sau[sau.length - 1]), daGiao: daGiaoTuHang(cua, false) }
}
