// BÁO CÁO TUẦN GỬI PHỤ HUYNH (thầy 24/10: «thay đổi bố cục tin nhắn gửi tự động cho phụ huynh đẹp hơn, nhiều dữ liệu hơn để phụ huynh nắm được trọn vẹn
// tình hình của mỗi học sinh»). App KHÔNG có kênh tự gửi Zalo/SMS (đã soát 24/10) ⇒ máy soạn sẵn: thẻ «Báo cáo tuần» trong app phụ huynh + chữ để thầy
// bấm «Chép gửi Zalo». Lời theo bộ quy tắc viết phụ huynh của thầy: xưng Thầy, gọi Anh/chị, vào thẳng số liệu, mỗi tin ≤ 120 chữ (dài thì tách 2 tin),
// không chào/chúc, không gạch dài, không emoji; nhận xét đủ 4 phần (lỗi cụ thể · nguyên nhân · việc có số lượng · mốc Thầy kiểm lại).
// Số nào không có dữ liệu thì KHÔNG viết (không bịa).
import type { Env, ExecutionContext } from './kieu'
import { sbdCuaPhuHuynh } from './ph-truy-cap'
import { CHI_NHAN_TOKEN } from './ph-tat-ca-ve-con'
import { congNgay7, ngayVn7 } from './goi-bai-7-loi'
import { docCheDo, tinhLoEm } from './danh-gia-hoc-that-d1'
import { bacCongKhai, type BacDanhGia } from './danh-gia-hoc-that'

type Row = Record<string, unknown>
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x)).trim()
const num = (x: unknown): number => (typeof x === 'number' ? x : Number(x)) || 0

export interface DuLieuTuan {
  hoTen: string
  /** dd/mm */
  tu: string
  den: string
  /** dd/mm của thứ Hai kế tiếp — mốc Thầy gửi lại số liệu. */
  thuHaiToi: string
  buoi: { tong: number; coMat: number; coPhep: number } | null
  soNgay: number
  ngayCoLam: number
  soCau: number
  soDung: number
  mucLam: { thuoc: number; bamVoi: number; treo: number; coNghi: number } | null
  ktcn: { nop: number; bo: number; diem: number[] }
  banKhac: { lam: number; dung: number } | null
  banKhacTruoc: { lam: number; dung: number } | null
  chuyenDeYeu: { ten: string; sai: number; lam: number }[]
  /** Chỉ khi công tắc xếp học sinh «bật». */
  nhan?: 'Học thật' | 'Đối phó'
  lyDo?: string[]
}

const pt = (a: number, b: number) => `${Math.round((100 * a) / b)}%`
const diem1 = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',')
/** Tên gọi = chữ cuối của họ tên ("Nguyễn Văn An" ⇒ "An"). */
export const tenGoi = (hoTen: string): string => hoTen.trim().split(/\s+/).pop() || hoTen
export const demChu = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length

/** Hai tin Zalo (tin 2 chỉ khi có điểm yếu cần nói). Thuần. */
export function soanTinBaoCaoTuan(d: DuLieuTuan): string[] {
  const em = `em ${tenGoi(d.hoTen)}`
  const c: string[] = []
  c.push(`Anh/chị, tuần ${d.tu} đến ${d.den} của ${em}.`)
  if (d.buoi && d.buoi.tong > 0) c.push(`Đi học ${d.buoi.coMat}/${d.buoi.tong} buổi${d.buoi.coPhep ? `, vắng có phép ${d.buoi.coPhep} buổi` : ''}.`)
  if (d.soCau > 0) c.push(`Em làm bài ${d.ngayCoLam}/${d.soNgay} ngày, ${d.soCau} câu, đúng ${pt(d.soDung, d.soCau)}.`)
  else c.push(`Cả tuần em không làm câu nào trên app.`)
  if (d.mucLam && d.soCau > 0) {
    const ve: string[] = []
    if (d.mucLam.thuoc) ve.push(`${d.mucLam.thuoc} câu làm nhanh vì đã thuộc`)
    if (d.mucLam.bamVoi) ve.push(`${d.mucLam.bamVoi} câu bấm vội mà sai`)
    if (d.mucLam.treo) ve.push(`${d.mucLam.treo} lần để máy treo`)
    if (ve.length) c.push(`Trong đó ${ve.join(', ')}.`)
  }
  const tongKt = d.ktcn.nop + d.ktcn.bo
  if (tongKt > 0) {
    const tb = d.ktcn.diem.length ? d.ktcn.diem.reduce((s, x) => s + x, 0) / d.ktcn.diem.length : null
    c.push(`Kiểm tra cá nhân nộp ${d.ktcn.nop}/${tongKt} bài${tb !== null ? `, điểm trung bình ${diem1(tb)}` : ''}${d.ktcn.bo ? `, bỏ ${d.ktcn.bo} bài` : ''}.`)
  }
  if (d.banKhac && d.banKhac.lam >= 5) {
    const truoc = d.banKhacTruoc && d.banKhacTruoc.lam >= 5 ? ` (tuần trước ${pt(d.banKhacTruoc.dung, d.banKhacTruoc.lam)})` : ''
    c.push(`Câu từng sai, làm lại bản khác: đúng ${pt(d.banKhac.dung, d.banKhac.lam)}${truoc}.`)
  }
  const tin1 = c.join(' ')

  // Tin 2: MỘT điểm yếu lớn nhất, đủ 4 phần. Không có điểm yếu ⇒ không gửi tin 2.
  const t2: string[] = []
  if (d.nhan === 'Đối phó' && d.lyDo?.length) t2.push(`Tuần này Thầy xếp ${em} vào nhóm Đối phó: ${d.lyDo[0]}.`)
  const moc = `Thứ Hai ${d.thuHaiToi} Thầy gửi lại số liệu để anh/chị đối chiếu.`
  const yeu = d.chuyenDeYeu[0]
  if (d.soCau === 0 || d.ngayCoLam <= Math.floor(d.soNgay / 2)) {
    t2.push(`${cap(em)} chỉ làm bài ${d.ngayCoLam}/${d.soNgay} ngày, các ngày còn lại không mở bài.`)
    t2.push(`Tuần tới em làm đủ bài mỗi ngày, ${d.soNgay}/${d.soNgay} ngày.`, moc)
  } else if (d.mucLam && d.mucLam.bamVoi >= 5 && d.mucLam.bamVoi * 100 >= 15 * d.soCau) {
    t2.push(`${cap(em)} có ${d.mucLam.bamVoi} câu trả lời trước khi đọc xong đề và sai.`)
    t2.push(`Em bấm để xong bài, chưa đọc hết đề và các phương án.`)
    t2.push(`Tuần tới mỗi câu em đọc hết đề rồi mới chọn, số câu bấm vội phải dưới ${Math.max(1, Math.floor(d.mucLam.bamVoi / 2))}.`, moc)
  } else if (d.ktcn.bo >= 2) {
    t2.push(`${cap(em)} bỏ ${d.ktcn.bo} bài kiểm tra cá nhân vì không mở bài trong hạn.`)
    t2.push(`Tuần tới em nộp đủ mọi bài kiểm tra cá nhân Thầy giao.`, moc)
  } else if (yeu && yeu.sai >= 3) {
    t2.push(`Chuyên đề ${yeu.ten} ${em} sai ${yeu.sai}/${yeu.lam} câu, em chưa nắm chắc dạng này.`)
    t2.push(`Tuần tới em làm lại 10 câu ${yeu.ten} trong mục Tự sửa lỗi.`, moc)
  } else if (d.nhan === 'Đối phó') {
    t2.push(moc)
  }
  return t2.length ? [tin1, t2.join(' ')] : [tin1]
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const ddmm = (ngay: string) => `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`

/** Đọc số liệu 7 ngày gần nhất của MỘT em (song song, chỉ đọc). */
export async function duLieuTuanCuaEm(env: Env, sbd: string, nowMs: number): Promise<DuLieuTuan | null> {
  const den = ngayVn7(nowMs), tu = congNgay7(den, -6), tuTruoc = congNgay7(den, -13)
  const hoi = async (sql: string, ...b: unknown[]) => ((await env.DB.prepare(sql).bind(...b).all<Row>()).results ?? [])
  const [hs, ngay, ktcn, bk, cd, che, chup] = await Promise.all([
    hoi('SELECT ho_ten FROM hoc_sinh WHERE sbd = ?', sbd),
    hoi(`SELECT ngay_vn, COUNT(*) AS n, SUM(ket_qua = 1) AS d FROM su_kien_hoc WHERE sbd = ?1 AND ngay_vn BETWEEN ?2 AND ?3 AND ket_qua IS NOT NULL
      AND COALESCE(purpose, '') NOT IN ('xem_loi_giai', 'luot', 'chan_doan', 'chua_buoc') AND COALESCE(visibility, '') <> 'embargoed' GROUP BY ngay_vn`, sbd, tu, den),
    hoi('SELECT trang_thai, diem FROM kiem_tra_ca_nhan WHERE sbd = ?1 AND ngay BETWEEN ?2 AND ?3 ORDER BY ngay', sbd, tu, den).catch(() => [] as Row[]),
    hoi(`SELECT ngay_vn >= ?2 AS nay, COUNT(*) AS n, SUM(ket_qua = 1) AS d FROM su_kien_hoc WHERE sbd = ?1 AND ngay_vn BETWEEN ?3 AND ?4 AND ket_qua IS NOT NULL
      AND json_valid(raw_json) AND json_extract(raw_json, '$.tc') IS NOT NULL GROUP BY 1`, sbd, tu, tuTruoc, den).catch(() => [] as Row[]),
    hoi(`SELECT chuyen_de, COUNT(*) AS n, SUM(ket_qua = 0) AS s FROM su_kien_hoc WHERE sbd = ?1 AND ngay_vn BETWEEN ?2 AND ?3 AND ket_qua IS NOT NULL
      AND COALESCE(chuyen_de, '') <> '' AND COALESCE(purpose, '') NOT IN ('xem_loi_giai', 'luot', 'chan_doan', 'chua_buoc') GROUP BY chuyen_de HAVING SUM(ket_qua = 0) >= 3 ORDER BY s DESC LIMIT 2`, sbd, tu, den).catch(() => [] as Row[]),
    docCheDo(env).catch(() => 'ngam' as const),
    tinhLoEm(env, [sbd], nowMs, { chiDoc: true, soNgay: 7 }).catch(() => []),
  ])
  if (!hs[0]) return null
  const c = chup[0]
  const ma = c?.kq.soLieu
  const thuHai = (() => { const d = new Date(den + 'T00:00:00Z').getUTCDay(); return congNgay7(den, ((8 - d) % 7) || 7) })()
  const bkNay = bk.find((x) => num(x.nay) === 1), bkTruoc = bk.find((x) => num(x.nay) !== 1)
  const ra: DuLieuTuan = {
    hoTen: str(hs[0].ho_ten) || sbd,
    tu: ddmm(tu),
    den: ddmm(den),
    thuHaiToi: ddmm(thuHai),
    buoi: c?.buoi ?? null,
    soNgay: 7,
    ngayCoLam: ngay.length,
    soCau: ngay.reduce((s, x) => s + num(x.n), 0),
    soDung: ngay.reduce((s, x) => s + num(x.d), 0),
    mucLam: ma ? { thuoc: ma.soThuoc, bamVoi: ma.soBamVoi, treo: ma.soTreo + ma.soCoTinh, coNghi: Math.max(0, ma.soDo - ma.soThuoc - ma.soBamVoi) } : null,
    ktcn: { nop: ktcn.filter((x) => str(x.trang_thai) === 'da_nop').length, bo: ktcn.filter((x) => str(x.trang_thai) === 'het_han').length, diem: ktcn.filter((x) => str(x.trang_thai) === 'da_nop' && x.diem !== null).map((x) => num(x.diem)) },
    banKhac: bkNay ? { lam: num(bkNay.n), dung: num(bkNay.d) } : null,
    banKhacTruoc: bkTruoc ? { lam: num(bkTruoc.n), dung: num(bkTruoc.d) } : null,
    chuyenDeYeu: cd.map((x) => ({ ten: str(x.chuyen_de), sai: num(x.s), lam: num(x.n) })),
  }
  if (che === 'bat') {
    const r = await env.DB.prepare('SELECT bac, phat_json FROM danh_gia_em_tuan WHERE sbd = ? ORDER BY tuan DESC LIMIT 1').bind(sbd).first<Row>().catch(() => null)
    if (r) {
      const b = bacCongKhai(num(r.bac) as BacDanhGia)
      ra.nhan = b === 1 ? 'Học thật' : 'Đối phó'
      if (b === 3) { try { ra.lyDo = (JSON.parse(str(r.phat_json)) as { chu: string }[]).map((p) => p.chu) } catch { ra.lyDo = [] } }
    }
  }
  return ra
}

/** `POST /gv/danh-gia/bao-cao-tuan {sbd}` — thầy xem + chép gửi Zalo (luôn có, không phụ thuộc công tắc; nhãn chỉ kèm khi «bật»). */
export async function gvBaoCaoTuan(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  const sbd = str(b.sbd)
  if (!sbd || sbd.length > 40) return { ok: false, error: 'Thiếu mã học sinh.' }
  const d = await duLieuTuanCuaEm(env, sbd, nowMs)
  if (!d) return { ok: false, error: 'Không tìm thấy học sinh.' }
  return { ok: true, duLieu: d, tin: soanTinBaoCaoTuan(d) }
}

/** `POST /ph/bao-cao-tuan {pass|sbd}` — thẻ «Báo cáo tuần» của app phụ huynh. */
export async function phBaoCaoTuan(env: Env, b: Row, nowMs = Date.now(), ctx?: ExecutionContext): Promise<Row> {
  const { sbd } = await sbdCuaPhuHuynh(env, b, 'ph-bao-cao-tuan', { chiToken: CHI_NHAN_TOKEN, envGhi: env, ctx })
  const d = await duLieuTuanCuaEm(env, sbd, nowMs)
  if (!d) return { ok: false, error: 'Chưa tải được báo cáo tuần của con. Anh/chị thử lại sau ít phút.' }
  return { ok: true, duLieu: d, tin: soanTinBaoCaoTuan(d) }
}
