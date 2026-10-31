// BÁO CÁO TUẦN GỬI PHỤ HUYNH (thầy 24/10: «thay đổi bố cục tin nhắn gửi tự động cho phụ huynh đẹp hơn, nhiều dữ liệu hơn để phụ huynh nắm được trọn vẹn
// tình hình của mỗi học sinh»). App KHÔNG có kênh tự gửi Zalo/SMS (đã soát 24/10) ⇒ hai đầu ra:
//  - Tin SỐ LIỆU (7 ngày tới hôm nay): thẻ «Báo cáo tuần» trong app phụ huynh + thầy chép gửi Zalo.
//  - Tin NHẬN XÉT (một điểm yếu lớn nhất, đủ 4 phần: lỗi có ngày + số câu · nguyên nhân · việc có số lượng · mốc Thầy kiểm lại): CHỈ ở bản xem của thầy.
//    Máy không đo được nguyên nhân ⇒ để ô «[Thầy điền …]», thầy điền rồi mới chép (không đoán nguyên nhân thay thầy). Không tự hiện cho phụ huynh vì
//    mốc «Thầy kiểm lại» là lời hứa của thầy.
// Lời theo bộ quy tắc viết phụ huynh của thầy: xưng Thầy, gọi Anh/chị, vào thẳng số liệu, mỗi tin ≤ 120 chữ, không chào/chúc, không gạch dài, không emoji.
// Số nào không có dữ liệu thì KHÔNG viết (không bịa). Nhãn «Đối phó» chỉ kèm khi công tắc «bật» VÀ tuần đó máy/thầy đã báo phụ huynh.
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
  /** dd/mm = đến + 7 ngày — mốc Thầy kiểm lại trong tin nhận xét. */
  ngayKiem: string
  buoi: { tong: number; coMat: number; coPhep: number } | null
  soNgay: number
  ngayCoLam: number
  /** dd/mm các ngày không làm câu nào. */
  ngayKhongLam: string[]
  soCau: number
  soDung: number
  /** Trong các lượt đo được giây: thuộc = nhanh mà đúng; bấm vội = trả lời trước khi đọc xong đề mà sai; treo = để máy treo. */
  mucLam: { thuoc: number; bamVoi: number; treo: number; doDuoc: number } | null
  /** `hetHan` = dd/mm các bài để hết hạn mà chưa nộp. */
  ktcn: { nop: number; hetHan: string[]; diem: number[] }
  /** Câu bản khác (song sinh / câu anh em) của câu đã làm: hiểu thật hay chỉ nhớ đáp án. */
  banKhac: { lam: number; dung: number } | null
  banKhacTruoc: { lam: number; dung: number } | null
  chuyenDeYeu: { ten: string; sai: number; lam: number }[]
  /** Chỉ khi công tắc «bật» và tuần đó đã báo phụ huynh. */
  nhan?: 'Học thật' | 'Đối phó'
  lyDo?: string[]
}

export interface TinBaoCaoTuan {
  soLieu: string
  /** null = tuần không có điểm yếu cần nói. */
  nhanXet: string | null
  /** true = còn ô «[Thầy điền …]» phải điền trước khi gửi. */
  canDien: boolean
}

export const O_DIEN = '[Thầy điền nguyên nhân]'
const pt = (a: number, b: number) => `${Math.round((100 * a) / b)}%`
const diem1 = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const ddmm = (ngay: string) => `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`
const lietKe = (ds: string[]) => (ds.length <= 1 ? ds.join('') : `${ds.slice(0, -1).join(', ')} và ${ds[ds.length - 1]}`)
/** Tên gọi = chữ cuối của họ tên ("Nguyễn Văn An" ⇒ "An"). */
export const tenGoi = (hoTen: string): string => hoTen.trim().split(/\s+/).pop() || hoTen
export const demChu = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length

/** Soạn hai tin. Thuần. */
export function soanTinBaoCaoTuan(d: DuLieuTuan): TinBaoCaoTuan {
  const em = `em ${tenGoi(d.hoTen)}`
  const tuan = `Tuần ${d.tu} đến ${d.den}`
  const c: string[] = [`Anh/chị, tuần ${d.tu} đến ${d.den} của ${em}.`]
  if (d.buoi && d.buoi.tong > 0) c.push(`Đi học ${d.buoi.coMat}/${d.buoi.tong} buổi${d.buoi.coPhep ? `, vắng có phép ${d.buoi.coPhep} buổi` : ''}.`)
  if (d.soCau > 0) c.push(`Em làm bài ${d.ngayCoLam}/${d.soNgay} ngày, ${d.soCau} câu, đúng ${pt(d.soDung, d.soCau)}.`)
  else c.push('Cả tuần em không làm câu nào trên app.')
  if (d.mucLam && d.mucLam.doDuoc > 0) {
    const ve: string[] = []
    if (d.mucLam.thuoc) ve.push(`${d.mucLam.thuoc} câu làm nhanh vì đã thuộc`)
    if (d.mucLam.bamVoi) ve.push(`${d.mucLam.bamVoi} câu bấm vội mà sai`)
    if (d.mucLam.treo) ve.push(`${d.mucLam.treo} lần để máy treo`)
    if (ve.length) c.push(`Trong ${d.mucLam.doDuoc} câu đo được giờ làm có ${ve.join(', ')}.`)
  }
  const tongKt = d.ktcn.nop + d.ktcn.hetHan.length
  if (tongKt > 0) {
    const tb = d.ktcn.diem.length ? d.ktcn.diem.reduce((s, x) => s + x, 0) / d.ktcn.diem.length : null
    c.push(`Kiểm tra cá nhân nộp ${d.ktcn.nop}/${tongKt} bài${tb !== null ? `, điểm trung bình ${diem1(tb)}` : ''}${d.ktcn.hetHan.length ? `, để hết hạn ${d.ktcn.hetHan.length} bài` : ''}.`)
  }
  if (d.banKhac && d.banKhac.lam >= 5) {
    const truoc = d.banKhacTruoc && d.banKhacTruoc.lam >= 5 ? ` (tuần trước ${pt(d.banKhacTruoc.dung, d.banKhacTruoc.lam)})` : ''
    c.push(`Câu bản khác của câu đã làm: đúng ${pt(d.banKhac.dung, d.banKhac.lam)}${truoc}.`)
  }

  // Nhận xét: MỘT điểm yếu lớn nhất, đủ 4 phần theo thứ tự.
  const moc = `Ngày ${d.ngayKiem} Thầy kiểm lại số liệu 7 ngày tới.`
  const yeu = d.chuyenDeYeu[0]
  let p: [string, string, string] | null = null // [lỗi, nguyên nhân, việc]
  if (d.soCau === 0 || d.ngayCoLam <= Math.floor(d.soNgay / 2)) {
    const ngay = d.ngayKhongLam.length <= 4 ? ` các ngày ${lietKe(d.ngayKhongLam)}` : ` ${d.ngayKhongLam.length}/${d.soNgay} ngày`
    p = [`${tuan} ${em} không mở bài${ngay}.`, O_DIEN, `Tuần tới em làm đủ bài mỗi ngày, ${d.soNgay}/${d.soNgay} ngày.`]
  } else if (d.mucLam && d.mucLam.bamVoi >= 5 && d.mucLam.bamVoi * 100 >= 15 * d.mucLam.doDuoc) {
    p = [`${tuan} ${em} có ${d.mucLam.bamVoi}/${d.mucLam.doDuoc} câu trả lời trước khi đọc xong đề và sai.`, O_DIEN,
      `Tuần tới mỗi câu em đọc hết đề rồi mới chọn, số câu bấm vội dưới ${Math.max(1, Math.floor(d.mucLam.bamVoi / 2))}.`]
  } else if (d.ktcn.hetHan.length >= 2) {
    p = [`${cap(em)} để hết hạn ${d.ktcn.hetHan.length} bài kiểm tra cá nhân, ngày ${lietKe(d.ktcn.hetHan)}.`, O_DIEN, 'Tuần tới em nộp đủ mọi bài kiểm tra cá nhân trước hạn.']
  } else if (yeu && yeu.sai >= 3) {
    p = [`${tuan} ${em} sai ${yeu.sai}/${yeu.lam} câu chuyên đề ${yeu.ten}.`, O_DIEN, `Tuần tới em làm lại 10 câu ${yeu.ten} trong mục Tự sửa lỗi.`]
  }
  const nhan = d.nhan === 'Đối phó' && d.lyDo?.length ? `Tuần này Thầy xếp ${em} vào nhóm Đối phó: ${d.lyDo[0]}.` : ''
  const nhanXet = p ? [nhan, p[0], p[1], p[2], moc].filter(Boolean).join(' ') : nhan ? `${nhan} ${moc}` : null
  return { soLieu: c.join(' '), nhanXet, canDien: !!nhanXet && nhanXet.includes(O_DIEN) }
}

/** Đọc số liệu 7 ngày tới hôm nay của MỘT em. Một đợt chờ D1 (mọi lượt đọc song song), chỉ đọc. */
export async function duLieuTuanCuaEm(env: Env, sbd: string, nowMs: number): Promise<DuLieuTuan | null> {
  const den = ngayVn7(nowMs), tu = congNgay7(den, -6), tuTruoc = congNgay7(den, -13)
  const hoi = async (sql: string, ...b: unknown[]) => ((await env.DB.prepare(sql).bind(...b).all<Row>()).results ?? [])
  const LOC = `ket_qua IS NOT NULL AND COALESCE(purpose, '') NOT IN ('xem_loi_giai', 'luot', 'chan_doan', 'chua_buoc') AND COALESCE(visibility, '') <> 'embargoed'`
  const [hs, ngay, ktcn, bk, cd, che, chup, nhanMoi, baoPh] = await Promise.all([
    hoi('SELECT ho_ten FROM hoc_sinh WHERE sbd = ?', sbd),
    hoi(`SELECT ngay_vn, COUNT(*) AS n, SUM(ket_qua = 1) AS d FROM su_kien_hoc WHERE sbd = ?1 AND ngay_vn BETWEEN ?2 AND ?3 AND ${LOC} GROUP BY ngay_vn`, sbd, tu, den),
    hoi('SELECT ngay, trang_thai, diem FROM kiem_tra_ca_nhan WHERE sbd = ?1 AND ngay BETWEEN ?2 AND ?3 ORDER BY ngay', sbd, tu, den).catch(() => [] as Row[]),
    hoi(`SELECT ngay_vn >= ?2 AS nay, COUNT(*) AS n, SUM(ket_qua = 1) AS d FROM su_kien_hoc WHERE sbd = ?1 AND ngay_vn BETWEEN ?3 AND ?4 AND ${LOC}
      AND json_valid(raw_json) AND json_extract(raw_json, '$.tc') IS NOT NULL GROUP BY 1`, sbd, tu, tuTruoc, den).catch(() => [] as Row[]),
    hoi(`SELECT chuyen_de, COUNT(*) AS n, SUM(ket_qua = 0) AS s FROM su_kien_hoc WHERE sbd = ?1 AND ngay_vn BETWEEN ?2 AND ?3 AND ${LOC}
      AND COALESCE(chuyen_de, '') <> '' GROUP BY chuyen_de HAVING SUM(ket_qua = 0) >= 3 ORDER BY s DESC LIMIT 2`, sbd, tu, den).catch(() => [] as Row[]),
    docCheDo(env).catch(() => 'ngam' as const),
    tinhLoEm(env, [sbd], nowMs, { chiDoc: true, soNgay: 7, denHomNay: true }).catch(() => []),
    hoi('SELECT tuan, bac, phat_json FROM danh_gia_em_tuan WHERE sbd = ? ORDER BY tuan DESC LIMIT 1', sbd).catch(() => [] as Row[]),
    hoi(`SELECT gui_luc FROM can_thiep_em WHERE sbd = ? AND loai IN ('bao_ph', 'xac_nhan_nghi') ORDER BY gui_luc DESC LIMIT 3`, sbd).catch(() => [] as Row[]),
  ])
  if (!hs[0]) return null
  const c = chup[0]
  const ma = c?.kq.soLieu
  const coLam = new Set(ngay.map((x) => str(x.ngay_vn)))
  const bkNay = bk.find((x) => num(x.nay) === 1), bkTruoc = bk.find((x) => num(x.nay) !== 1)
  const ra: DuLieuTuan = {
    hoTen: str(hs[0].ho_ten) || sbd,
    tu: ddmm(tu),
    den: ddmm(den),
    ngayKiem: ddmm(congNgay7(den, 7)),
    // «Đi học x/y buổi» BỎ 31/10 (thầy: «Trên lớp sao mà biết đc») — app không biết em có mặt trên lớp; dòng ấy tự ẩn khi null.
    buoi: null,
    soNgay: 7,
    ngayCoLam: coLam.size,
    ngayKhongLam: Array.from({ length: 7 }, (_, i) => congNgay7(tu, i)).filter((x) => !coLam.has(x)).map(ddmm),
    soCau: ngay.reduce((s, x) => s + num(x.n), 0),
    soDung: ngay.reduce((s, x) => s + num(x.d), 0),
    mucLam: ma && ma.soDo > 0 ? { thuoc: ma.soThuoc, bamVoi: ma.soBamVoi, treo: ma.soTreo + ma.soCoTinh, doDuoc: ma.soDo } : null,
    ktcn: {
      nop: ktcn.filter((x) => str(x.trang_thai) === 'da_nop').length,
      hetHan: ktcn.filter((x) => str(x.trang_thai) === 'het_han').map((x) => ddmm(str(x.ngay))),
      diem: ktcn.filter((x) => str(x.trang_thai) === 'da_nop' && x.diem !== null).map((x) => num(x.diem)),
    },
    banKhac: bkNay ? { lam: num(bkNay.n), dung: num(bkNay.d) } : null,
    banKhacTruoc: bkTruoc ? { lam: num(bkTruoc.n), dung: num(bkTruoc.d) } : null,
    chuyenDeYeu: cd.map((x) => ({ ten: str(x.chuyen_de), sai: num(x.s), lam: num(x.n) })),
  }
  const r = nhanMoi[0]
  if (che === 'bat' && r) {
    const b = bacCongKhai(num(r.bac) as BacDanhGia)
    const tuTuan = Date.parse(str(r.tuan) + 'T00:00:00Z') - 7 * 3600_000
    const daBao = baoPh.some((x) => { const l = Date.parse(str(x.gui_luc)); return l >= tuTuan && l < tuTuan + 7 * 86400_000 })
    if (b === 1) ra.nhan = 'Học thật'
    else if (daBao) {
      ra.nhan = 'Đối phó'
      try { ra.lyDo = (JSON.parse(str(r.phat_json)) as { chu: string }[]).map((p) => p.chu) } catch { ra.lyDo = [] }
    }
  }
  return ra
}

/** `POST /gv/danh-gia/bao-cao-tuan {sbd}` — thầy xem hai tin + chép gửi Zalo (luôn có, không phụ thuộc công tắc). */
export async function gvBaoCaoTuan(env: Env, b: Row, nowMs = Date.now()): Promise<Row> {
  const sbd = str(b.sbd)
  if (!sbd || sbd.length > 40) return { ok: false, error: 'Thiếu mã học sinh.' }
  const d = await duLieuTuanCuaEm(env, sbd, nowMs)
  if (!d) return { ok: false, error: 'Không tìm thấy học sinh.' }
  return { ok: true, duLieu: d, ...soanTinBaoCaoTuan(d) }
}

// Phụ huynh: tối đa 300 người mở ⇒ giữ kết quả 3 giờ trong CACHE API của Cloudflare (dùng chung giữa các isolate cùng colo); Node test không có
// `caches` ⇒ đọc thẳng. Khoá theo sbd + ngày ⇒ sang ngày mới tự tính lại.
type CacheStorageCF = CacheStorage & { default?: Cache }
const PH_CACHE_S = 3 * 3600
const cacheMacDinh = (): Cache | null => ((typeof caches === 'undefined' ? undefined : caches) as CacheStorageCF | undefined)?.default ?? null

/** `POST /ph/bao-cao-tuan {pass|sbd}` — thẻ «Báo cáo tuần» của app phụ huynh: chỉ tin SỐ LIỆU (nhận xét do thầy gửi). */
export async function phBaoCaoTuan(env: Env, b: Row, nowMs = Date.now(), ctx?: ExecutionContext): Promise<Row> {
  const { sbd } = await sbdCuaPhuHuynh(env, b, 'ph-bao-cao-tuan', { chiToken: CHI_NHAN_TOKEN, envGhi: env, ctx })
  const c = cacheMacDinh()
  const khoa = `https://cache.omr/ph-bao-cao-tuan/${encodeURIComponent(sbd)}/${ngayVn7(nowMs)}`
  if (c) {
    try { const r = await c.match(khoa); if (r) return (await r.json()) as Row } catch { /* đọc thẳng */ }
  }
  // Khối `tuan` của thưởng phạt (thuong-gv-ph.ts) đọc SONG SONG với báo cáo tuần ⇒ cùng một đợt chờ D1. Lỗi ⇒ không có khối, thẻ cũ vẫn hiện.
  const [d, tuan] = await Promise.all([duLieuTuanCuaEm(env, sbd, nowMs), import('./thuong-gv-ph').then((m) => m.tuanThuongPh(env, sbd, nowMs)).catch(() => null)])
  if (!d) return { ok: false, error: 'Chưa tải được báo cáo tuần của con. Anh/chị thử lại sau ít phút.' }
  const ra: Row = { ok: true, duLieu: { ...d, lyDo: d.nhan === 'Đối phó' ? d.lyDo : undefined }, soLieu: soanTinBaoCaoTuan(d).soLieu, ...(tuan ? { tuan } : {}) }
  if (c) {
    const ghi = c.put(khoa, new Response(JSON.stringify(ra), { headers: { 'content-type': 'application/json', 'cache-control': `max-age=${PH_CACHE_S}` } })).catch(() => undefined)
    if (ctx) ctx.waitUntil(ghi)
    else await ghi
  }
  return ra
}
