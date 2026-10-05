// GỌI LỆNH OMNI 3 CỦA APP THẦY (hợp đồng docs/hop-dong-omni-3.md mục B; kiểu server/src/omni-kieu.ts — chỉ `import type`):
//   `/gv/bai-da-day` (tick bài đã dạy ⇒ tự giao luyện theo bài) · `/gv/omni` (công tắc theo lớp, cấu hình, Bảng bài, xác nhận dạng, ma trận Q,
//   ca chốt 50/50) · `/kho/thu-muc` (thư mục mục đích DẠY HỌC / TU LUYỆN).
// Cách gọi y hệt `/gv/chien-dich` (api.ts): `goiLenh` + mã thầy, KHÔNG ném lỗi — trả `KetQuaLenh` với MỘT câu nói thật (màn hiện đúng câu ấy).
// Máy chủ đang dựng song song ⇒ mọi hàm ĐỌC KỸ hình dạng câu trả lời: sai dạng = lỗi `khong_doc_duoc` (màn ẩn phần OMNI, màn cũ y nguyên).
import type { BangOmni, CanThayChua, CoOmni, Phan, TrangThaiSprt, Vkn } from '../../../server/src/omni-kieu'
import { goiLenh, type KetQuaLenh } from '../../lib/goi-lenh-thay'

export const DUONG_BAI_DA_DAY = '/gv/bai-da-day'
export const DUONG_OMNI = '/gv/omni'
export const DUONG_THU_MUC = '/kho/thu-muc'
const CHU_CHUA_CO_BAI = 'Máy chủ chưa có lệnh Tick bài (OMNI 3) — cần đẩy bản máy chủ mới.'
const CHU_CHUA_CO_OMNI = 'Máy chủ chưa có lệnh OMNI — cần đẩy bản máy chủ mới.'
const CHU_CHUA_CO_THU_MUC = 'Máy chủ chưa có lệnh đồng bộ thư mục kho — cần đẩy bản máy chủ mới.'
const CHU_SAI_DANG = 'Máy chủ trả lời không đúng dạng (OMNI đang dựng).'

type Ho = Record<string, unknown>
type Loi = Extract<KetQuaLenh<never>, { ok: false }>
const loi = (loai: Loi['loai'], chu: string): Loi => ({ ok: false, loai, chu })
const saiDang = (): Loi => loi('khong_doc_duoc', CHU_SAI_DANG)

const laHo = (x: unknown): x is Ho => !!x && typeof x === 'object' && !Array.isArray(x)
const chu = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' && Number.isFinite(v) ? String(v) : '')
const so = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const soNguyen = (v: unknown, macDinh = 0): number => {
  const n = so(v)
  return n === null ? macDinh : Math.round(n)
}
const dsChu = (v: unknown): string[] => (Array.isArray(v) ? v.map(chu).filter(Boolean) : [])

/** Gọi an toàn: bọc `goiLenh` (kể cả khi bị thay bằng hàm giả trả về lạ) — luôn trả `KetQuaLenh`, không ném. */
async function goi(duong: string, body: Ho, chuChuaCo: string): Promise<KetQuaLenh<Ho>> {
  try {
    const r = (await goiLenh(duong, body, chuChuaCo)) as KetQuaLenh<Ho> | undefined | null
    if (!r || typeof r !== 'object') return saiDang()
    if (r.ok !== true) {
      const l = r as Partial<Loi>
      return loi(l.loai ?? 'tu_choi', chu(l.chu) || 'Máy chủ không đồng ý lệnh này.')
    }
    return laHo(r.du) ? { ok: true, du: r.du } : saiDang()
  } catch {
    return loi('mang', 'Không nối được máy chủ.')
  }
}
const goiBai = (action: string, body: Ho = {}) => goi(DUONG_BAI_DA_DAY, { ...body, action }, CHU_CHUA_CO_BAI)
const goiOmni = (action: string, body: Ho = {}) => goi(DUONG_OMNI, { ...body, action }, CHU_CHUA_CO_OMNI)

// ---------------------------------------------------------------- /gv/bai-da-day
export type TrangThaiBaiTick = 'dang_luyen' | 'da_day'
/** Một bài lớp đã tick (danh-sach). */
export interface BaiDaTick {
  khoaBai: string
  tenBai: string
  viTri: number
  tickLuc: string
  chienDichId: string | null
  trangThai: TrangThaiBaiTick
  /** `YYYY-MM-DD` (hết lúc 23:59). */
  hanNop: string | null
  conNgay: number | null
  chungChi: { dat: number; tong: number } | null
  /** Số em đã giao (chiến dịch của bài) — máy chủ gửi thì dùng; vắng ⇒ null (màn lấy `chungChi.tong`). */
  soEm: number | null
}
export interface DanhSachBaiDaDay {
  bai: BaiDaTick[]
  /** Lớp đang chờ bài mới (qua hạn bài gần nhất, chưa tick bài mới) — `soNgay` ngày. */
  choBaiMoi: { soNgay: number } | null
}
/** Đầu vào chung của `xem-truoc` và `tick`. */
export interface DauVaoBai {
  lop: string
  khoaBai: string
  tenBai: string
  viTri: number
  /** Mã tờ TỰ GIAO của bài: CHỈ tờ phần Trắc nghiệm / Đúng sai / Trả lời ngắn (…-TN / -DS / -TLN hoặc tờ chưa tách một phần) — không bao giờ có
   *  Ví dụ minh hoạ hay Các dạng toán trọng tâm (thầy 05/10; máy chủ cũng tự bỏ -VD/-DT/-TL). */
  maDe: string[]
  hanNop?: string
  theLucNgay?: number
  /** Em nhận bài (thầy chọn — bộ chọn em của màn Giao / theo điểm danh, 05/10). Vắng ⇒ máy chủ giao cả lớp như cũ. */
  sbd?: string[]
}
export interface BaiPhamVi {
  khoaBai: string
  tenBai: string
  viTri: number
  maDe: string[]
}
export interface XemTruocTick {
  soCau: number
  soTuLuan: number
  hanNop: string
  D: number
  luotCan: number
  sucChua: number
  /** Số em đủ lượt để luyện hết — tính trên EM ĐƯỢC GIAO (`soEmChon`). */
  duLuot: number
  /** Số em của cả lớp (danh sách học sinh). */
  tongEm: number
  /** Số em được giao sau lọc (thầy chọn em, 05/10) — máy chủ cũ chưa gửi ⇒ bằng `tongEm` (giao cả lớp). */
  soEmChon: number
  /** Số em đủ lượt để dự báo ca chốt ≥ 8; `null` = chưa có P để tính (màn ẩn ô này). */
  duDiem8: number | null
  quaTai: { sbd: string; ten: string }[]
  theLucNgay: number
}
export interface KetQuaTick {
  chienDichId: string
  hanNop: string
  /** Bài này đã tick trước đó ⇒ giữ chiến dịch có sẵn (không tạo thêm). */
  daCo: boolean
}

function docBaiDaTick(x: unknown): BaiDaTick | null {
  if (!laHo(x)) return null
  const khoaBai = chu(x.khoaBai)
  if (!khoaBai) return null
  const cc = laHo(x.chungChi) ? { dat: soNguyen(x.chungChi.dat), tong: soNguyen(x.chungChi.tong) } : null
  return {
    khoaBai,
    tenBai: chu(x.tenBai),
    viTri: soNguyen(x.viTri),
    tickLuc: chu(x.tickLuc),
    chienDichId: chu(x.chienDichId) || null,
    trangThai: x.trangThai === 'dang_luyen' ? 'dang_luyen' : 'da_day',
    hanNop: chu(x.hanNop) || null,
    conNgay: so(x.conNgay),
    chungChi: cc,
    soEm: so(x.soEm) === null ? null : soNguyen(x.soEm),
  }
}

export async function baiDaDayDanhSach(lop: string): Promise<KetQuaLenh<DanhSachBaiDaDay>> {
  const r = await goiBai('danh-sach', { lop })
  if (!r.ok) return r
  if (!Array.isArray(r.du.bai)) return saiDang()
  const bai = r.du.bai.map(docBaiDaTick).filter((b): b is BaiDaTick => !!b)
  const cho = laHo(r.du.choBaiMoi) && so(r.du.choBaiMoi.soNgay) !== null ? { soNgay: soNguyen(r.du.choBaiMoi.soNgay) } : null
  return { ok: true, du: { bai, choBaiMoi: cho } }
}

export async function baiDaDayXemTruoc(dv: DauVaoBai): Promise<KetQuaLenh<XemTruocTick>> {
  const r = await goiBai('xem-truoc', { ...dv })
  if (!r.ok) return r
  const d = r.du
  if (so(d.soCau) === null || so(d.luotCan) === null || so(d.sucChua) === null) return saiDang()
  return {
    ok: true,
    du: {
      soCau: soNguyen(d.soCau),
      soTuLuan: soNguyen(d.soTuLuan),
      hanNop: chu(d.hanNop),
      D: soNguyen(d.D),
      luotCan: soNguyen(d.luotCan),
      sucChua: soNguyen(d.sucChua),
      duLuot: soNguyen(d.duLuot),
      tongEm: soNguyen(d.tongEm),
      soEmChon: so(d.soEmChon) === null ? soNguyen(d.tongEm) : soNguyen(d.soEmChon),
      duDiem8: so(d.duDiem8) === null ? null : soNguyen(d.duDiem8),
      quaTai: Array.isArray(d.quaTai) ? d.quaTai.filter(laHo).map((e) => ({ sbd: chu(e.sbd), ten: chu(e.ten) || chu(e.sbd) })) : [],
      theLucNgay: soNguyen(d.theLucNgay),
    },
  }
}

export async function baiDaDayTick(dv: DauVaoBai & { phamVi: BaiPhamVi[] }): Promise<KetQuaLenh<KetQuaTick>> {
  const r = await goiBai('tick', { ...dv })
  if (!r.ok) return r
  return { ok: true, du: { chienDichId: chu(r.du.chienDichId), hanNop: chu(r.du.hanNop), daCo: r.du.daCo === true } }
}

export async function baiDaDayBoTick(lop: string, khoaBai: string): Promise<KetQuaLenh<{ chienDich: 'da_huy' | 'da_dong' | null }>> {
  const r = await goiBai('bo-tick', { lop, khoaBai })
  if (!r.ok) return r
  const c = r.du.chienDich
  return { ok: true, du: { chienDich: c === 'da_huy' || c === 'da_dong' ? c : null } }
}

// ---------------------------------------------------------------- /gv/omni — công tắc + cấu hình
/** Đọc công tắc OMNI có chống sai kiểu (giống `docCoOmniTu` của máy chủ). */
export function docCoOmniTuMay(x: unknown): CoOmni {
  const o = laHo(x) ? x : {}
  return { bat: o.bat === true, lop: dsChu(o.lop), sbd: dsChu(o.sbd) }
}
/** OMNI áp cho CẢ một lớp: bật không danh sách ⇒ mọi lớp; có danh sách lớp ⇒ lớp có tên trong đó. (Chỉ danh sách SBD chạy thử ⇒ không áp cả lớp.) */
export function omniApChoLop(co: CoOmni | null, lop: string | null | undefined): boolean {
  if (!co?.bat) return false
  if (!co.lop.length && !co.sbd.length) return true
  return !!lop && co.lop.includes(lop.trim())
}

export async function docCoOmni(): Promise<KetQuaLenh<CoOmni>> {
  const r = await goiOmni('co-doc')
  if (!r.ok) return r
  return { ok: true, du: docCoOmniTuMay(laHo(r.du.co) ? r.du.co : r.du) }
}
export async function luuCoOmni(co: CoOmni): Promise<KetQuaLenh<CoOmni>> {
  const r = await goiOmni('co-luu', { co: { bat: co.bat, lop: co.lop, sbd: co.sbd } })
  if (!r.ok) return r
  return { ok: true, du: laHo(r.du.co) ? docCoOmniTuMay(r.du.co) : co }
}

export interface MaTranThi {
  I: number
  II: number
  III: number
}
export interface CauHinhOmni {
  /** Số lượt câu mỗi ngày mặc định theo lớp `{ "12A1": 40 }` (vắng lớp ⇒ 40). */
  theLucLop: Record<string, number>
  /** Ma trận đề thi 2026 (số câu từng phần); `null` = thầy chưa nhập (máy chủ dùng 18/4/6). */
  maTran: MaTranThi | null
}
function docMaTran(x: unknown): MaTranThi | null {
  if (!laHo(x)) return null
  const I = so(x.I)
  const II = so(x.II)
  const III = so(x.III)
  return I === null || II === null || III === null ? null : { I: Math.round(I), II: Math.round(II), III: Math.round(III) }
}
export async function docCauHinhOmni(): Promise<KetQuaLenh<CauHinhOmni>> {
  const r = await goiOmni('cau-hinh-doc')
  if (!r.ok) return r
  const tl: Record<string, number> = {}
  if (laHo(r.du.theLucLop)) for (const [k, v] of Object.entries(r.du.theLucLop)) if (chu(k) && so(v) !== null && (v as number) > 0) tl[chu(k)] = Math.round(v as number)
  return { ok: true, du: { theLucLop: tl, maTran: docMaTran(r.du.maTran) } }
}
export async function luuCauHinhOmni(ch: { theLucLop?: Record<string, number>; maTran?: MaTranThi }): Promise<KetQuaLenh<Ho>> {
  return goiOmni('cau-hinh-luu', { ...ch })
}

// ---------------------------------------------------------------- /gv/omni — Bảng bài
function docBangOmni(d: Ho): BangOmni | null {
  if (!laHo(d.chienDich) || !Array.isArray(d.em) || !Array.isArray(d.dang) || !laHo(d.o)) return null
  if (!d.dang.every((x) => laHo(x) && !!chu(x.ma))) return null
  const em = d.em.filter(laHo).map((e) => ({ sbd: chu(e.sbd), ten: chu(e.ten) || chu(e.sbd) })).filter((e) => e.sbd)
  const dang = d.dang.filter(laHo).map((x) => ({ ma: chu(x.ma), ten: chu(x.ten) || chu(x.ma) }))
  const o: BangOmni['o'] = {}
  for (const [sbd, hang] of Object.entries(d.o)) {
    if (!laHo(hang)) continue
    const dong: Record<string, { p: number; n: number; trangThai: TrangThaiSprt }> = {}
    for (const [ma, x] of Object.entries(hang)) {
      if (!laHo(x) || so(x.p) === null) continue
      const tt = x.trangThai === 'vung' || x.trangThai === 'chua_vung' ? x.trangThai : 'chua_du'
      dong[ma] = { p: Math.max(0, Math.min(1, x.p as number)), n: soNguyen(x.n), trangThai: tt }
    }
    o[sbd] = dong
  }
  const banDoSo = (x: unknown): Record<string, number | null> => {
    const ra: Record<string, number | null> = {}
    if (laHo(x)) for (const [k, v] of Object.entries(x)) ra[k] = so(v)
    return ra
  }
  const hc = laHo(d.hieuChuan) ? d.hieuChuan : {}
  const cd = d.chienDich
  const canThayChua: CanThayChua[] = Array.isArray(d.canThayChua)
    ? d.canThayChua.filter(laHo).flatMap((x) => {
        const loai = x.loai === 'nut_that' || x.loai === 'cat_tia' || x.loai === 'so_y' ? x.loai : null
        if (!loai) return []
        const qids = dsChu(x.qids)
        const sbd = dsChu(x.sbd)
        return [{ loai, tieuDe: chu(x.tieuDe), phu: chu(x.phu), soEm: soNguyen(x.soEm), ...(qids.length ? { qids } : {}), ...(sbd.length ? { sbd } : {}), ...(chu(x.vkn) ? { vkn: chu(x.vkn) } : {}) }]
      })
    : []
  return {
    ok: true,
    chienDich: { id: chu(cd.id), ten: chu(cd.ten), hanNop: chu(cd.hanNop), lop: chu(cd.lop) || null },
    em,
    dang,
    o,
    sEm: banDoSo(d.sEm),
    khoangCach8: banDoSo(d.khoangCach8),
    sanSang: banDoSo(d.sanSang),
    hieuChuan: { soCaChot: soNguyen(hc.soCaChot), du: hc.du === true },
    canThayChua,
  }
}
/** Bảng bài OMNI của một chiến dịch. OMNI tắt / máy chủ chưa có / sai dạng ⇒ `ok:false` (màn giữ bảng chiến dịch cũ y nguyên). */
export async function docBangOmniCua(chienDichId: string): Promise<KetQuaLenh<BangOmni>> {
  const r = await goiOmni('bang', { chienDichId })
  if (!r.ok) return r
  const b = docBangOmni(r.du)
  return b ? { ok: true, du: b } : saiDang()
}
export const xacNhanDang = (sbd: string, maDang: string, ket: 'vung' | 'day_lai') => goiOmni('xac-nhan', { sbd, maDang, ket })

// ---------------------------------------------------------------- /gv/omni — ma trận Q (vi kỹ năng của từng câu)
export interface CauQ {
  qid: string
  stt: number
  /** Đề rút gọn (một dòng). */
  de: string
  phan: Phan
  maDang: string | null
  tenDang: string | null
  /** Vi kỹ năng A.I gợi ý (id). */
  goiY: string[]
  /** Phần II: vi kỹ năng từng ý (giữ nguyên khi duyệt). */
  vknY?: string[][]
}
export interface LoQ {
  cau: CauQ[]
  vkn: Vkn[]
  conLai: number
}
function docVkn(x: unknown): Vkn | null {
  if (!laHo(x) || !chu(x.id)) return null
  return { id: chu(x.id), maDang: chu(x.maDang), ten: chu(x.ten) || chu(x.id), tenLoi: chu(x.tenLoi) || null, nhanNen: chu(x.nhanNen) || null, thuTu: soNguyen(x.thuTu) }
}
export async function docLoQ(chienDichId: string, sau?: string): Promise<KetQuaLenh<LoQ>> {
  const r = await goiOmni('q-lo', sau ? { chienDichId, sau } : { chienDichId })
  if (!r.ok) return r
  if (!Array.isArray(r.du.cau)) return saiDang()
  const cau: CauQ[] = r.du.cau.filter(laHo).flatMap((x) => {
    const qid = chu(x.qid)
    if (!qid) return []
    const phan: Phan = x.phan === 'II' || x.phan === 'III' ? x.phan : 'I'
    const vknY = Array.isArray(x.vknY) && x.vknY.length ? x.vknY.map(dsChu) : undefined
    return [{ qid, stt: soNguyen(x.stt), de: chu(x.de), phan, maDang: chu(x.maDang) || null, tenDang: chu(x.tenDang) || null, goiY: dsChu(x.goiY), ...(vknY ? { vknY } : {}) }]
  })
  const vkn = Array.isArray(r.du.vkn) ? r.du.vkn.map(docVkn).filter((v): v is Vkn => !!v) : []
  return { ok: true, du: { cau, vkn, conLai: soNguyen(r.du.conLai) } }
}
export async function duyetLoQ(ds: { qid: string; vkn: string[]; vknY?: string[][] }[], vknMoi: Vkn[]): Promise<KetQuaLenh<{ daDuyet: number }>> {
  const r = await goiOmni('q-duyet', vknMoi.length ? { ds, vknMoi } : { ds })
  if (!r.ok) return r
  return { ok: true, du: { daDuyet: soNguyen(r.du.daDuyet, ds.length) } }
}

// ---------------------------------------------------------------- /gv/omni — ca chốt 50/50
export interface GoiCaChotOmni {
  qids: string[]
  /** Số câu chưa gặp (cùng ô, từ TU LUYỆN) và số câu của bài. */
  soLa: number
  soCu: number
}
export async function caChotOmni(chienDichId: string): Promise<KetQuaLenh<GoiCaChotOmni>> {
  const r = await goiOmni('ca-chot', { chienDichId })
  if (!r.ok) return r
  const qids = dsChu(r.du.qids)
  if (!qids.length) return saiDang()
  return { ok: true, du: { qids, soLa: soNguyen(r.du.soLa), soCu: soNguyen(r.du.soCu) } }
}
/** Ca vừa mở từ gói ca chốt 50/50 ⇒ gắn mã ca vào chiến dịch (máy chủ chấm điều kiện T của chứng chỉ). */
export const ganCaChot = (chienDichId: string, maCa: string) => goiOmni('gan-ca-chot', { chienDichId, maCa })

// ---------------------------------------------------------------- /kho/thu-muc
export async function guiThuMucKho(ds: { maDe: string; thuMuc: 'DAY_HOC' | 'TU_LUYEN' }[]): Promise<KetQuaLenh<{ daGhi: number }>> {
  const r = await goi(DUONG_THU_MUC, { ds }, CHU_CHUA_CO_THU_MUC)
  if (!r.ok) return r
  return { ok: true, du: { daGhi: soNguyen(r.du.daGhi, ds.length) } }
}
