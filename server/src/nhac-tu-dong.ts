// NHẮC TỰ ĐỘNG bài tập về nhà — Code 3, 21/09/2026. Luật do Boss chốt (prompt-hom-nay-gv-v2.md, CẬP NHẬT 21/09 phần A): thầy KHÔNG bấm gì, chỉ xem; KHÔNG dùng AI, lời theo MẪU có số thật.
//
// Cron mỗi phút gọi `nhacTuDong` nhưng CHỈ chạy MỘT lần mỗi 30 phút (chiếm lượt bằng `cau_hinh.nhac_tu_dong_lan`) và CHỈ trong khung `gioTu`–`gioDen` (mặc định 07:00–21:30 giờ VN).
// Bốn mốc cho mỗi em CHƯA nộp của mỗi bài đang chạy (bài thường lẫn cá nhân hoá):
//   M1 · nhắc sớm     còn ≤ 24 giờ tới hạn, em CHƯA MỞ bài .................. EM
//   M2 · tối hạn chót 20:00 NGÀY HẠN, chưa nộp ............................... EM + PHỤ HUYNH
//   M3 · trễ nhịp     20:00, chậm ≥ 2 chặng so với lịch (bài còn hạn ≥ 1 ngày) . EM
//   M4 · quá hạn      07:00 sáng hôm sau hạn, vẫn chưa nộp .................... EM + PHỤ HUYNH (MỘT lần/bài)
// TRẦN: em ≤ 1 tin "nhắc thường" (M1/M3, kể cả tin thầy bấm tay) / bài / ngày — M2 và M4 là hai mốc CHỐT HẠN, mỗi mốc đúng một lần/bài, không tính vào trần ấy (ngày hạn có thể có M1 sáng + M2 tối);
// PHỤ HUYNH ≤ 1 tin tự động / ngày (nhiều bài ⇒ GỘP MỘT tin) và ≤ 3 tin / 7 ngày. Không gửi cho em đã nộp, bài thu hồi/xoá, bài tắt (`baiTat`), mốc tắt (`mocTat`), cờ `bat = false`.
// Khoá idempotent `ca:<bài>:<em>:<mốc>:<ngày>` (khoá chính `canh_bao_thay`): chạy lại cùng lượt không gửi đôi. Ghi nhật ký = chính dòng `canh_bao_thay` (kèm em/phụ huynh đã xem).
import type { Env } from './kieu'
import { ngayVnCuaMs, chuHan, trangThaiNopBai, TEN_BAI_MAC_DINH, KENH_THONG_BAO, TIEU_DE_THONG_BAO } from './canh-bao-thay'
import { docChang1ChoEm } from './btvn-nang-do-d1'
import { docLichDaLuu, moLucChang } from './btvn-nang-do-chang'

type Hang = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
const so = (v: unknown): number => Number(v) || 0
const json = (v: unknown): string => JSON.stringify(v)
const MOT_NGAY_MS = 86_400_000
const GIO_VN_MS = 7 * 3_600_000
const NUA_GIO_MS = 30 * 60_000

export const KHOA_CAU_HINH = 'canh_bao_tu_dong'
export const KHOA_LAN_CHAY = 'nhac_tu_dong_lan'
export const CAC_MOC = ['M1', 'M2', 'M3', 'M4'] as const
export type Moc = (typeof CAC_MOC)[number]
/** Trần phụ huynh: mỗi ngày ≤ 1 tin, mỗi 7 ngày ≤ 3 tin (đếm theo nhóm tin `ph_nhom`). */
export const PH_TOI_DA_MOI_NGAY = 1
export const PH_TOI_DA_7_NGAY = 3
export const NGAY_PH_DEM = 7
/** M1: còn ≤ ngần này giờ; M2/M3 gửi từ 20:00; M4 từ 07:00 sáng hôm sau; M3: chậm ≥ ngần này chặng và bài còn ≥ 1 ngày. */
export const GIO_M1_TRUOC_HAN = 24
export const PHUT_TOI_HAN_CHOT = 20 * 60
export const PHUT_SANG_QUA_HAN = 7 * 60
export const SO_CHANG_CHAM_M3 = 2
/** Mỗi lượt chạy ghi tối đa ngần này dòng (bảo vệ giới hạn D1); phần còn lại được xử lý ở lượt 30 phút kế (khoá idempotent). */
export const TOI_DA_DONG_MOT_LUOT = 240

export interface CauHinhNhac {
  bat: boolean
  /** Mốc bị tắt, ví dụ ['M3']. */
  mocTat: Moc[]
  /** Bài tắt nhắc tự động (mã BTVN). */
  baiTat: string[]
  gioTu: string
  gioDen: string
}
export const CAU_HINH_MAC_DINH: CauHinhNhac = { bat: true, mocTat: [], baiTat: [], gioTu: '07:00', gioDen: '21:30' }

const laGio = (v: unknown): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v)
const phutCuaGio = (g: string): number => Number(g.slice(0, 2)) * 60 + Number(g.slice(3, 5))

/** Đọc cờ. Vắng / hỏng ⇒ MẶC ĐỊNH BẬT (thầy lệnh). Chỉ `bat === false` mới tắt; giờ sai định dạng ⇒ giờ mặc định. */
export function docCauHinhNhac(v: unknown): CauHinhNhac {
  let o: unknown = v
  if (typeof v === 'string') {
    try { o = JSON.parse(v) } catch { o = null }
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return { ...CAU_HINH_MAC_DINH }
  const c = o as Hang
  return {
    bat: c.bat !== false,
    mocTat: (Array.isArray(c.mocTat) ? c.mocTat : []).map(chuoi).filter((m): m is Moc => (CAC_MOC as readonly string[]).includes(m)),
    baiTat: (Array.isArray(c.baiTat) ? c.baiTat : []).map(chuoi).filter(Boolean),
    gioTu: laGio(c.gioTu) ? c.gioTu : CAU_HINH_MAC_DINH.gioTu,
    gioDen: laGio(c.gioDen) ? c.gioDen : CAU_HINH_MAC_DINH.gioDen,
  }
}
export async function docCauHinh(env: Env): Promise<CauHinhNhac> {
  try {
    const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_CAU_HINH).first<Hang>()
    return docCauHinhNhac(r?.gia_tri)
  } catch {
    return { ...CAU_HINH_MAC_DINH }
  }
}

/** Phút trong ngày (giờ VN) của một mốc ms. */
export const phutTrongNgayVn = (ms: number): number => {
  const d = new Date(ms + GIO_VN_MS)
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}
export const trongKhung = (ms: number, c: CauHinhNhac): boolean => {
  const p = phutTrongNgayVn(ms)
  return p >= phutCuaGio(c.gioTu) && p <= phutCuaGio(c.gioDen)
}
/** Lượt 30 phút chứa `ms` (khoá chiếm lượt), ví dụ "2026-09-22T20:00". */
export const khoaLuot = (ms: number): string => {
  const d = new Date(Math.floor(ms / NUA_GIO_MS) * NUA_GIO_MS + GIO_VN_MS).toISOString()
  return d.slice(0, 16)
}
/** Mốc `HH:MM` (giờ VN) của ngày VN `ngay` → ISO UTC. */
const gioVnLaIso = (ngay: string, phut: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) - GIO_VN_MS + phut * 60_000).toISOString()
const ngayKe = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * MOT_NGAY_MS).toISOString().slice(0, 10)

/** Lượt chạy KẾ (đầu 30 phút SAU `ms`, trong khung; đúng đầu lượt thì lượt vừa chạy đã qua, lấy lượt sau); trả ISO UTC. */
export function lanChayKe(ms: number, c: CauHinhNhac): string {
  let t = (Math.floor(ms / NUA_GIO_MS) + 1) * NUA_GIO_MS
  for (let i = 0; i < 60; i++, t += NUA_GIO_MS) if (trongKhung(t, c)) return new Date(t).toISOString()
  return new Date(t).toISOString()
}

const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const thuCua = (ngay: string): string => THU[new Date(`${ngay}T00:00:00Z`).getUTCDay()]!
/** "23:59 Thứ Năm" cho hạn nộp. */
export const chuHanCoThu = (hanIso: string): string => {
  const v = new Date(Date.parse(hanIso) + GIO_VN_MS).toISOString()
  return `${v.slice(11, 16)} ${thuCua(v.slice(0, 10))}`
}

/** Tên gọi của em (chữ cuối họ tên); không có ⇒ ''. */
const tenGoi = (hoTen: string): string => hoTen.trim().split(/\s+/).filter(Boolean).pop() ?? ''

// ================================================================== LỜI MẪU (số thật; xưng Thầy/Anh chị; không so bạn, không doạ, không emoji, không gạch dài) ==================================================================

export interface DauVaoLoi {
  tenBai: string
  hanIso: string
  nowMs: number
  hoTen: string
  soNgayQuaHan?: number
  /** Bài cá nhân hoá: tổng chặng, số chặng đã xong. */
  tongChang?: number
  daXongChang?: number
  /** M1: số câu và số phút ước tính của chặng 1 (từ bộ tính thử); vắng ⇒ không nói (không bịa). */
  chang1?: { soCau: number; phut: number }
  /** M3: số chặng chậm và số câu của chặng kế. */
  chamChang?: number
  soCauChangKe?: number
  /** M4: đã làm x trong y câu. */
  daLam?: number
  tongCau?: number
  /** Bài thường: số câu của bài. */
  soCauBai?: number
}
const tenBaiNgoac = (t: string): string => `«${t || TEN_BAI_MAC_DINH}»`

export function loiEmTheoMoc(m: Moc, x: DauVaoLoi): string {
  const bai = tenBaiNgoac(x.tenBai)
  const han = chuHanCoThu(x.hanIso)
  if (m === 'M1') {
    const c1 = x.chang1 ? ` Chặng 1 có ${x.chang1.soCau} câu, khoảng ${x.chang1.phut} phút.` : x.soCauBai ? ` Bài có ${x.soCauBai} câu.` : ''
    return `Bài tập về nhà ${bai} hạn nộp ${han}. Em chưa mở bài.${c1}`
  }
  if (m === 'M2') {
    const con = x.tongChang && x.tongChang > 0 ? ` Em còn chặng ${Math.max(0, x.tongChang - (x.daXongChang ?? 0))} trong ${x.tongChang} chặng.` : ' Em chưa nộp bài.'
    return `Hạn nộp ${chuHan(x.hanIso, x.nowMs).replace(/ hôm nay$/, ' tối nay')} của Bài tập về nhà ${bai}.${con}`
  }
  if (m === 'M3') return `Em đang chậm ${x.chamChang ?? SO_CHANG_CHAM_M3} chặng so với lịch của Bài tập về nhà ${bai}. Tối nay làm một chặng${x.soCauChangKe ? ` (${x.soCauChangKe} câu)` : ''} là bắt kịp.`
  return `Bài tập về nhà ${bai} đã quá hạn ${chuHan(x.hanIso, x.nowMs - MOT_NGAY_MS).replace(/ hôm nay$/, ' hôm qua')}. Em đã làm ${x.daLam ?? 0} trong ${x.tongCau ?? 0} câu.`
}

/** Lời cho PHỤ HUYNH của MỘT bài (M2/M4). */
export function loiPhMotBai(m: Moc, x: DauVaoLoi): string {
  const ten = tenGoi(x.hoTen)
  const em = ten ? `em ${ten}` : 'con'
  const bai = tenBaiNgoac(x.tenBai)
  if (m === 'M2') {
    const con = x.tongChang && x.tongChang > 0 ? `${em} còn chặng ${Math.max(0, x.tongChang - (x.daXongChang ?? 0))} trong ${x.tongChang} chặng` : `${em} chưa nộp`
    return `Anh/chị, ${con} của Bài tập về nhà ${bai}, hạn nộp ${chuHan(x.hanIso, x.nowMs).replace(/ hôm nay$/, ' tối nay')}. Anh/chị nhắc ${ten ? 'em' : 'con'} mở app giúp Thầy.`
  }
  return `Anh/chị, ${em} chưa nộp Bài tập về nhà ${bai}, đã quá hạn ${chuHan(x.hanIso, x.nowMs - MOT_NGAY_MS).replace(/ hôm nay$/, ' hôm qua')}, ${ten ? 'em' : 'con'} đã làm ${x.daLam ?? 0} trong ${x.tongCau ?? 0} câu. Anh/chị nhắc ${ten ? 'em' : 'con'} mở bài và nộp.`
}
/** GỘP nhiều bài vào MỘT tin phụ huynh. */
export function loiPhGop(hoTen: string, cacBai: { m: Moc; x: DauVaoLoi }[]): string {
  if (cacBai.length === 1) return loiPhMotBai(cacBai[0]!.m, cacBai[0]!.x)
  const ten = tenGoi(hoTen)
  const em = ten ? `em ${ten}` : 'con'
  const dong = cacBai.map(({ m, x }) => {
    const bai = tenBaiNgoac(x.tenBai)
    if (m === 'M2') return `${bai} hạn nộp ${chuHan(x.hanIso, x.nowMs).replace(/ hôm nay$/, ' tối nay')}${x.tongChang && x.tongChang > 0 ? `, còn chặng ${Math.max(0, x.tongChang - (x.daXongChang ?? 0))} trong ${x.tongChang}` : ''}`
    return `${bai} đã quá hạn ${chuHan(x.hanIso, x.nowMs - MOT_NGAY_MS).replace(/ hôm nay$/, ' hôm qua')}, đã làm ${x.daLam ?? 0} trong ${x.tongCau ?? 0} câu`
  })
  return `Anh/chị, ${em} còn ${cacBai.length} bài tập về nhà chưa nộp: ${dong.join('; ')}. Anh/chị nhắc ${ten ? 'em' : 'con'} mở app giúp Thầy.`
}

// ================================================================== ĐỌC BÀI + EM ==================================================================

interface BaiDangChay { ma: string; maDe: string; han: string; hanMs: number; soCau: number; caNhan: boolean; ten: string; giaoLuc: string; row: Hang }
interface EmChuaNop { row: Hang; sbd: string; hoTen: string }

async function docBaiDangChay(env: Env, nowMs: number): Promise<BaiDangChay[]> {
  const sql = (coCaNhan: boolean) =>
    `SELECT b.ma_btvn, b.ma_ca, b.ma_de, b.giao_luc, b.han_nop, b.so_cau, ${coCaNhan ? 'COALESCE(b.ca_nhan, 0)' : '0'} AS ca_nhan, ${coCaNhan ? 'b.hat_giong' : 'NULL'} AS hat_giong,
            COALESCE(NULLIF(TRIM(c.ten_ca), ''), d.ten_de, b.ma_de) AS ten
       FROM btvn b LEFT JOIN ca c ON c.ma_ca = b.ma_ca LEFT JOIN de_kho d ON d.ma_de = b.ma_de
      WHERE b.da_xoa = 0 AND b.giao_luc <= ? AND b.han_nop >= ? ORDER BY b.han_nop, b.ma_btvn LIMIT 80`
  const bind = [new Date(nowMs).toISOString(), new Date(nowMs - 2 * MOT_NGAY_MS).toISOString()]
  let r: { results?: Hang[] }
  try {
    r = await env.DB.prepare(sql(true)).bind(...bind).all<Hang>()
  } catch {
    r = await env.DB.prepare(sql(false)).bind(...bind).all<Hang>()
  }
  return (r.results ?? []).map((x) => ({
    ma: chuoi(x.ma_btvn), maDe: chuoi(x.ma_de), han: chuoi(x.han_nop), hanMs: Date.parse(chuoi(x.han_nop)), soCau: so(x.so_cau), caNhan: so(x.ca_nhan) === 1, ten: chuoi(x.ten), giaoLuc: chuoi(x.giao_luc), row: x,
  })).filter((b) => b.ma && Number.isFinite(b.hanMs))
}

// ================================================================== CHẠY MỘT LƯỢT ==================================================================

export interface KetQuaNhac {
  chay: boolean
  lyDo?: 'tat' | 'ngoai_khung' | 'da_chay_luot_nay' | 'chua_co_bang' | 'loi'
  soBai?: number
  soEmDuocNhac?: number
  soTinPhuHuynh?: number
  theoMoc?: Record<string, number>
  boQuaTran?: number
}

interface Dong {
  id: string; ma: string; sbd: string; ngay: string; tenBai: string; han: string; loiEm: string; loiPh: string; trangThai: string; moc: Moc; guiPh: number; phNhom: string | null
}

/**
 * MỘT lượt nhắc. `nowMs` để test tiêm giờ. `boQuaChiemLuot` (test) bỏ bước chiếm lượt 30 phút để gọi nhiều lần trong một test.
 * Không ném lỗi: mọi lỗi ghi log và trả `{chay:false, lyDo:'loi'}` (cron không được kéo việc khác đổ theo).
 */
export async function nhacTuDong(env: Env, nowMs: number = Date.now(), tuyChon: { boQuaChiemLuot?: boolean } = {}): Promise<KetQuaNhac> {
  try {
    const cfg = await docCauHinh(env)
    if (!cfg.bat) return { chay: false, lyDo: 'tat' }
    if (!trongKhung(nowMs, cfg)) return { chay: false, lyDo: 'ngoai_khung' }
    // Worker có thể lên TRƯỚC migration `canh_bao_thay`: chưa có bảng thì im lặng (không chiếm lượt, không ghi lỗi mỗi 30 phút).
    try {
      await env.DB.prepare('SELECT 1 FROM canh_bao_thay LIMIT 1').first()
    } catch {
      return { chay: false, lyDo: 'chua_co_bang' }
    }
    if (!tuyChon.boQuaChiemLuot) {
      const luot = khoaLuot(nowMs)
      const chiem = await env.DB.prepare(
        `INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc WHERE cau_hinh.gia_tri <> excluded.gia_tri`,
      ).bind(KHOA_LAN_CHAY, luot, new Date(nowMs).toISOString()).run()
      if (!chiem.meta.changes) return { chay: false, lyDo: 'da_chay_luot_nay' }
    }
    return await chayLuot(env, nowMs, cfg)
  } catch (e) {
    console.error('[nhac-tu-dong] lỗi:', e instanceof Error ? e.message : e)
    return { chay: false, lyDo: 'loi' }
  }
}

async function chayLuot(env: Env, nowMs: number, cfg: CauHinhNhac): Promise<KetQuaNhac> {
  const homNay = ngayVnCuaMs(nowMs)
  const phutNay = phutTrongNgayVn(nowMs)
  const luc = new Date(nowMs).toISOString()
  const bai = (await docBaiDangChay(env, nowMs)).filter((b) => !cfg.baiTat.includes(b.ma))
  if (bai.length === 0) return { chay: true, soBai: 0, soEmDuocNhac: 0, soTinPhuHuynh: 0, theoMoc: {}, boQuaTran: 0 }
  const dsMa = bai.map((b) => b.ma)

  const re = await env.DB.prepare(
    `SELECT ma_btvn, sbd, ho_ten, nop_luc, thu_hoi, dap_an_json, xong_vong1_luc, lo_da_xong, so_chang, so_cau_em, chot_luc, chang_mo_json, so_cau
       FROM btvn_em WHERE ma_btvn IN (SELECT value FROM json_each(?)) AND thu_hoi = 0 AND nop_luc IS NULL`,
  ).bind(json(dsMa)).all<Hang>()
  const emTheoBai = new Map<string, EmChuaNop[]>()
  for (const x of re.results ?? []) emTheoBai.set(chuoi(x.ma_btvn), [...(emTheoBai.get(chuoi(x.ma_btvn)) ?? []), { row: x, sbd: chuoi(x.sbd), hoTen: chuoi(x.ho_ten) }])

  const cu = await env.DB.prepare(
    `SELECT ma_btvn, sbd, moc, ngay FROM canh_bao_thay WHERE ma_btvn IN (SELECT value FROM json_each(?)) AND ngay >= ?`,
  ).bind(json(dsMa), ngayKe(homNay, -NGAY_PH_DEM)).all<Hang>()
  const daCo = new Set<string>() // `${ma}|${sbd}|${moc}|${ngay}`  — mọi nguồn (kể cả tay)
  const nhacThuongHomNay = new Set<string>() // `${ma}|${sbd}` đã có M1/M3/tay HÔM NAY
  const daCoM4 = new Set<string>() // `${ma}|${sbd}` đã có M4 (MỘT lần/bài)
  for (const x of cu.results ?? []) {
    const moc = chuoi(x.moc) || 'tay'
    daCo.add(`${chuoi(x.ma_btvn)}|${chuoi(x.sbd)}|${moc}|${chuoi(x.ngay)}`)
    if (chuoi(x.ngay) === homNay && (moc === 'M1' || moc === 'M3' || moc === 'tay')) nhacThuongHomNay.add(`${chuoi(x.ma_btvn)}|${chuoi(x.sbd)}`)
    if (moc === 'M4') daCoM4.add(`${chuoi(x.ma_btvn)}|${chuoi(x.sbd)}`)
  }
  // Trần phụ huynh: nhóm tin theo em, trong 7 ngày (mọi bài, mọi mốc tự động).
  const phDem = await env.DB.prepare('SELECT sbd, ngay, ph_nhom FROM canh_bao_thay WHERE ph_nhom IS NOT NULL AND ngay >= ? GROUP BY sbd, ph_nhom, ngay').bind(ngayKe(homNay, -(NGAY_PH_DEM - 1))).all<Hang>()
  const phHomNay = new Set<string>()
  const ph7Ngay = new Map<string, number>()
  for (const x of phDem.results ?? []) {
    if (chuoi(x.ngay) === homNay) phHomNay.add(chuoi(x.sbd))
    ph7Ngay.set(chuoi(x.sbd), (ph7Ngay.get(chuoi(x.sbd)) ?? 0) + 1)
  }

  interface UngVien { b: BaiDangChay; e: EmChuaNop; moc: Moc; x: DauVaoLoi; trangThai: string; guiPhMuon: boolean }
  const ungVien: UngVien[] = []
  let boQuaTran = 0
  for (const b of bai) {
    for (const e of emTheoBai.get(b.ma) ?? []) {
      const st = trangThaiNopBai(e.row, b.han, nowMs)
      const conHanMs = b.hanMs - nowMs
      const ngayHan = ngayVnCuaMs(b.hanMs)
      const lichChang = so(e.row.so_chang) > 0 && chuoi(e.row.chot_luc) !== ''
      const tongChang = so(e.row.so_chang)
      const daXongChang = Math.min(tongChang, so(e.row.lo_da_xong))
      const chon: Moc[] = []
      // Thứ tự ƯU TIÊN: M4 > M2 > M3 > M1 (mỗi lượt chọn các mốc ĐẾN HẠN; trần quyết định cái nào được gửi).
      if (!cfg.mocTat.includes('M4') && conHanMs < 0 && ngayHan < homNay && phutNay >= PHUT_SANG_QUA_HAN && !daCoM4.has(`${b.ma}|${e.sbd}`)) chon.push('M4')
      if (!cfg.mocTat.includes('M2') && conHanMs > 0 && ngayHan === homNay && phutNay >= PHUT_TOI_HAN_CHOT) chon.push('M2')
      let cham = 0
      if (lichChang) {
        const moLuc = docLichDaLuu(e.row.chang_mo_json, tongChang)?.moLuc ?? moLucChang(chuoi(e.row.chot_luc), tongChang)
        cham = moLuc.filter((m) => Date.parse(m) <= nowMs).length - daXongChang
      }
      if (!cfg.mocTat.includes('M3') && conHanMs >= MOT_NGAY_MS && phutNay >= PHUT_TOI_HAN_CHOT && cham >= SO_CHANG_CHAM_M3) chon.push('M3')
      if (!cfg.mocTat.includes('M1') && conHanMs > 0 && conHanMs <= GIO_M1_TRUOC_HAN * 3_600_000 && st.trangThai === 'chua_mo') chon.push('M1')
      for (const moc of chon) {
        if (daCo.has(`${b.ma}|${e.sbd}|${moc}|${homNay}`)) continue // khoá idempotent
        if ((moc === 'M1' || moc === 'M3') && nhacThuongHomNay.has(`${b.ma}|${e.sbd}`)) { boQuaTran++; continue } // trần 1 tin nhắc thường/em/bài/ngày
        if (moc === 'M2' && chon.includes('M4')) continue
        if (moc === 'M1' && chon.includes('M2')) continue // tối hạn chót đã bao trùm nhắc sớm
        const daLam = Object.keys((() => { try { return JSON.parse(chuoi(e.row.dap_an_json) || '{}') as Hang } catch { return {} } })()).length
        ungVien.push({
          b, e, moc, trangThai: st.trangThai, guiPhMuon: moc === 'M2' || moc === 'M4',
          x: {
            tenBai: b.ten, hanIso: b.han, nowMs, hoTen: e.hoTen, soNgayQuaHan: st.soNgayQuaHan, tongChang: lichChang ? tongChang : undefined, daXongChang: lichChang ? daXongChang : undefined,
            chamChang: cham, daLam, tongCau: so(e.row.so_cau_em) || b.soCau, soCauBai: b.soCau,
          },
        })
        // Một em/bài mỗi lượt chỉ nhận MỘT tin "thường" (M1/M3); M2/M4 đi riêng — nhưng M4 loại M2 (ở trên) và trong cùng lượt M1/M3 nhường nhau theo thứ tự chọn.
        if (moc === 'M1' || moc === 'M3') break
      }
    }
  }
  // M1: điền số THẬT của chặng 1 từ bộ tính thử (cùng hàm/hạt giống với lúc em mở bài) — chỉ bài cá nhân hoá; lỗi ⇒ không nói con số (không bịa).
  const m1Theo = new Map<string, string[]>()
  for (const u of ungVien) if (u.moc === 'M1' && u.b.caNhan) m1Theo.set(u.b.ma, [...(m1Theo.get(u.b.ma) ?? []), u.e.sbd])
  for (const [ma, ds] of m1Theo) {
    const b = bai.find((x) => x.ma === ma)!
    try {
      const ch1 = await docChang1ChoEm(env, b.row, ds, nowMs)
      for (const u of ungVien) if (u.moc === 'M1' && u.b.ma === ma) { const c = ch1.get(u.e.sbd); if (c) u.x.chang1 = c }
    } catch (e) {
      console.error('[nhac-tu-dong] không dựng được chặng 1 cho M1:', e instanceof Error ? e.message : e)
    }
  }
  // M3: số câu của chặng KẾ (chặng em chưa xong) từ bộ đã chốt.
  const m3 = ungVien.filter((u) => u.moc === 'M3')
  if (m3.length > 0) {
    const r3 = await env.DB.prepare(
      `SELECT ma_btvn, sbd, chang, COUNT(*) AS n FROM btvn_em_cau WHERE chang >= 0 AND ma_btvn IN (SELECT value FROM json_each(?)) AND sbd IN (SELECT value FROM json_each(?)) GROUP BY ma_btvn, sbd, chang`,
    ).bind(json([...new Set(m3.map((u) => u.b.ma))]), json([...new Set(m3.map((u) => u.e.sbd))])).all<Hang>()
    const n = new Map((r3.results ?? []).map((x) => [`${chuoi(x.ma_btvn)}|${chuoi(x.sbd)}|${so(x.chang)}`, so(x.n)]))
    for (const u of m3) u.x.soCauChangKe = n.get(`${u.b.ma}|${u.e.sbd}|${so(u.e.row.lo_da_xong)}`) || undefined
  }

  // GỘP tin phụ huynh theo em; áp trần ngày/7 ngày.
  const theoEm = new Map<string, UngVien[]>()
  for (const u of ungVien) if (u.guiPhMuon) theoEm.set(u.e.sbd, [...(theoEm.get(u.e.sbd) ?? []), u])
  const cuaPh = new Map<string, { nhom: string; lead: UngVien; loi: string }>() // sbd → tin
  for (const [sbd, ds] of theoEm) {
    if (phHomNay.has(sbd)) continue // đã có 1 tin phụ huynh hôm nay
    if ((ph7Ngay.get(sbd) ?? 0) >= PH_TOI_DA_7_NGAY) continue
    const sapXep = [...ds].sort((a, c) => (a.moc === 'M4' ? 0 : 1) - (c.moc === 'M4' ? 0 : 1) || (a.b.ma < c.b.ma ? -1 : 1))
    cuaPh.set(sbd, { nhom: `${sbd}|${homNay}`, lead: sapXep[0]!, loi: loiPhGop(ds[0]!.e.hoTen, sapXep.map((u) => ({ m: u.moc, x: u.x }))) })
  }

  const dong: Dong[] = []
  for (const u of ungVien) {
    const ph = cuaPh.get(u.e.sbd)
    const trongTin = !!ph && u.guiPhMuon
    dong.push({
      id: `ca:${u.b.ma}:${u.e.sbd}:${u.moc}:${homNay}`, ma: u.b.ma, sbd: u.e.sbd, ngay: homNay, tenBai: u.b.ten || TEN_BAI_MAC_DINH, han: u.b.han,
      loiEm: loiEmTheoMoc(u.moc, u.x), loiPh: trongTin && ph!.lead === u ? ph!.loi : '', trangThai: u.trangThai, moc: u.moc, guiPh: trongTin ? 1 : 0, phNhom: trongTin ? ph!.nhom : null,
    })
  }
  const cat = dong.slice(0, TOI_DA_DONG_MOT_LUOT)
  if (cat.length === 0) return { chay: true, soBai: bai.length, soEmDuocNhac: 0, soTinPhuHuynh: 0, theoMoc: {}, boQuaTran }
  const lenh: ReturnType<Env['DB']['prepare']>[] = []
  for (const d of cat) {
    lenh.push(
      env.DB.prepare(
        `INSERT OR IGNORE INTO canh_bao_thay (id, ma_btvn, sbd, ngay, ten_btvn, han_nop, loi_em, loi_ph, trang_thai_em, gui_luc, moc, gui_ph, ph_nhom) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(d.id, d.ma, d.sbd, d.ngay, d.tenBai, d.han, d.loiEm, d.loiPh, d.trangThai, luc, d.moc, d.guiPh, d.phNhom),
      env.DB.prepare('INSERT OR IGNORE INTO student_notice (id, sbd, title, body, target, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(d.id, d.sbd, TIEU_DE_THONG_BAO, d.loiEm, KENH_THONG_BAO, luc),
    )
  }
  for (let i = 0; i < lenh.length; i += 80) await env.DB.batch(lenh.slice(i, i + 80))
  const theoMoc: Record<string, number> = {}
  for (const d of cat) theoMoc[d.moc] = (theoMoc[d.moc] ?? 0) + 1
  return { chay: true, soBai: bai.length, soEmDuocNhac: new Set(cat.map((d) => d.sbd)).size, soTinPhuHuynh: new Set(cat.filter((d) => d.phNhom).map((d) => d.phNhom)).size, theoMoc, boQuaTran }
}

// ================================================================== HIỂN THỊ CHO THẦY (/gv/chua-nop) ==================================================================

/** Mốc KẾ của một em (chưa nộp) và giờ dự kiến; vắng khi hết mốc / bài sắp hết hạn / tắt. `daCoMoc` = các mốc ĐÃ gửi cho (bài, em). */
export function nhacKeCuaEm(x: { hanIso: string; nowMs: number; chuaMo: boolean; daCoMoc: ReadonlySet<string>; cfg: CauHinhNhac }): { moc: Moc; luc: string } | undefined {
  const { hanIso, nowMs, chuaMo, daCoMoc, cfg } = x
  if (!cfg.bat) return undefined
  const han = Date.parse(hanIso)
  if (!Number.isFinite(han)) return undefined
  const ngayHan = ngayVnCuaMs(han)
  const ds: { moc: Moc; luc: string }[] = []
  const trongCuaSo = (ms: number): string => lanChayKe(ms, cfg)
  if (!cfg.mocTat.includes('M1') && chuaMo && han > nowMs && !daCoMoc.has('M1')) {
    const tu = Math.max(nowMs, han - GIO_M1_TRUOC_HAN * 3_600_000)
    const luc = trongCuaSo(tu)
    if (Date.parse(luc) < han) ds.push({ moc: 'M1', luc })
  }
  if (!cfg.mocTat.includes('M2') && !daCoMoc.has('M2')) {
    const luc = gioVnLaIso(ngayHan, PHUT_TOI_HAN_CHOT)
    if (Date.parse(luc) > nowMs && Date.parse(luc) < han) ds.push({ moc: 'M2', luc })
  }
  if (!cfg.mocTat.includes('M4') && !daCoMoc.has('M4')) {
    const luc = gioVnLaIso(ngayKe(ngayHan, 1), PHUT_SANG_QUA_HAN)
    if (Date.parse(luc) > nowMs) ds.push({ moc: 'M4', luc })
  }
  ds.sort((a, c) => (a.luc < c.luc ? -1 : 1))
  return ds[0]
}

/**
 * `POST /gv/nhac-tu-dong {bat?, mocTat?, baiTat?, gioTu?, gioDen?}` (thầy): ĐỌC cờ nhắc tự động; có trường nào thì GHI (gộp vào cờ hiện tại, ghi lại `cau_hinh.canh_bao_tu_dong`).
 * Ra `{ok, cauHinh, lanKe?}`. Thầy chỉ tắt/bật; mặc định BẬT.
 */
export async function gvNhacTuDong(env: Env, b: Hang, nowMs: number = Date.now()): Promise<Hang> {
  const hienTai = await docCauHinh(env)
  const coDoi = ['bat', 'mocTat', 'baiTat', 'gioTu', 'gioDen'].some((k) => b[k] !== undefined)
  let moi = hienTai
  if (coDoi) {
    if (b.gioTu !== undefined && !laGio(b.gioTu)) return { ok: false, error: 'gioTu phải dạng HH:MM' }
    if (b.gioDen !== undefined && !laGio(b.gioDen)) return { ok: false, error: 'gioDen phải dạng HH:MM' }
    moi = docCauHinhNhac({ ...hienTai, ...(b.bat !== undefined ? { bat: b.bat !== false } : {}), ...(b.mocTat !== undefined ? { mocTat: b.mocTat } : {}), ...(b.baiTat !== undefined ? { baiTat: b.baiTat } : {}), ...(b.gioTu !== undefined ? { gioTu: b.gioTu } : {}), ...(b.gioDen !== undefined ? { gioDen: b.gioDen } : {}) })
    if (phutCuaGio(moi.gioTu) >= phutCuaGio(moi.gioDen)) return { ok: false, error: 'gioTu phải sớm hơn gioDen' }
    await env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
      .bind(KHOA_CAU_HINH, json(moi), new Date(nowMs).toISOString()).run()
  }
  return { ok: true, cauHinh: moi, ...(moi.bat ? { lanKe: lanChayKe(nowMs, moi) } : {}) }
}
