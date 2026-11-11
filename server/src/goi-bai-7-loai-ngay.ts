// LOẠI NGÀY Gói 7 — khối B đợt 1 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911 «duyệt, build và đẩy lên bản sống luôn»). Luật chọn: `chonLoaiNgay7`
// (goi-bai-7-loi.ts); chốt cùng lô dòng mức 28 (`chotMucNgay7`, goi-bai-7.ts). Tệp này: đọc MỨC + LOẠI NGÀY trong MỘT câu D1 (luật tốc độ: Sảnh không thêm lệnh).
import type { Env } from './kieu'
import type { TangHanhTrinh } from './hanh-trinh-ngay'
import type { MucNgay7, GoiCuaEm7 } from './goi-bai-7'
import type { HoSo2 } from './srs2-d1'
import { NGAY_LOAI_NGAY, chonLoaiNgay7, congNgay7, laLoaiNgay7, type LoaiNgay7 } from './goi-bai-7-loi'
import { docCotLyDo, type LyDoSai } from './ly-do-sai'
import { SQL_COT_NO, docCotNo, type DocNo7 } from './no-cau-d1'
import type { TomTatNo } from './no-cau'
export { noCau7 } from './no-cau-d1'

type Row = Record<string, unknown>
export interface MucLoai7 { muc: MucNgay7 | null; loai: LoaiNgay7 | null; truoc: LoaiNgay7[]; lyDo?: ReadonlyMap<string, LyDoSai | 'cc'>
  /** Lịch bài (10/11): loại đã chốt 21 ngày qua + ngày các lịch Kiểm tra ôn tập (kèm mã gói) — cùng câu đọc. */
  lich?: { daChot: Map<string, LoaiNgay7>; kt: [string, string][] }
  /** Nợ câu (11/11, no-cau-d1.ts): sổ nợ + lựa chọn hôm nay — cùng câu đọc; `noCau` = tóm tắt gửi app, `loaiNay` = loại ngày hôm nay (nhãn phần thiếu của ngày vắng). */
  no?: DocNo7; noCau?: TomTatNo | null; loaiNay?: LoaiNgay7 | null; /** lúc tạo dòng mức hôm nay */ mucLuc?: string }
const tang7 = (v: unknown): TangHanhTrinh => { const t = Math.floor(Number(v)); return (t >= 1 && t <= 4 ? t : 1) as TangHanhTrinh }
const mucCua = (r: Row | null | undefined): MucNgay7 | null =>
  r && Number(r.muc) > 0 ? { tang: tang7(r.tang), toiThieuTang: Number(r.toi_thieu_tang) || 0, quota: Number(r.quota) || 0, muc: Number(r.muc), daChot: true } : null
const docMucCu = (env: Env, sbd: string, ngay: string) =>
  env.DB.prepare('SELECT tang,toi_thieu_tang,quota,muc FROM goi_bai_7_muc_ngay WHERE sbd=? AND ngay=?').bind(sbd, ngay).first<Row>().then(mucCua, () => null)

const mang = (v: unknown): unknown[] => { try { const a: unknown = typeof v === 'string' ? JSON.parse(v) : []; return Array.isArray(a) ? a : [] } catch { return [] } }
const docLich = (lsu: unknown, kt: unknown): NonNullable<MucLoai7['lich']> => ({
  daChot: new Map(mang(lsu).flatMap((x): [string, LoaiNgay7][] => (Array.isArray(x) && typeof x[0] === 'string' && laLoaiNgay7(x[1]) ? [[x[0], x[1]]] : []))),
  kt: mang(kt).flatMap((x): [string, string][] => (Array.isArray(x) && typeof x[0] === 'string' && typeof x[1] === 'string' ? [[x[0], x[1]]] : [])),
})

/** Dòng mức hôm nay + loại ngày đã chốt hôm nay + loại của hai ngày có loại gần nhất (mới trước). Ngày trước mốc ⇒ đúng câu đọc mức cũ; câu mới lỗi ⇒ đọc cũ. */
export async function docMucLoai7(env: Env, sbd: string, ngay: string): Promise<MucLoai7> {
  if (ngay < NGAY_LOAI_NGAY) return { muc: await docMucCu(env, sbd, ngay), loai: null, truoc: [] }
  const q = 'SELECT loai FROM goi_bai_7_loai_ngay WHERE sbd=? AND ngay'
  // 09/11 lát 3: lý do sai («Vì sao em sai?», goi_bai_7_ly_do) đọc CÙNG câu (nhóm lỗi ngày Sửa); 10/11 Lịch bài: loại đã chốt 21 ngày qua + ngày lịch Kiểm tra ôn tập
  // (mã gói trong json) cũng CÙNG câu — câu đủ cột lỗi ⇒ bớt cột dần (chỉ khi lỗi), không thêm lệnh D1.
  const tu = congNgay7(ngay, -21)
  const doc = (muc: number) => env.DB.prepare(`SELECT m.tang,m.toi_thieu_tang,m.quota,m.muc,(${q}=?) loai,(${q}<? ORDER BY ngay DESC LIMIT 1) t1,(${q}<? ORDER BY ngay DESC LIMIT 1 OFFSET 1) t2${muc ? ',(SELECT json_group_array(json_array(qid,ly)) FROM (SELECT qid,ly,luc FROM (SELECT qid,ly,luc FROM goi_bai_7_ly_do WHERE sbd=? ORDER BY luc DESC LIMIT 400) ORDER BY luc)) ly' : ''}${muc > 1 ? `,(SELECT json_group_array(json_array(ngay,loai)) FROM goi_bai_7_loai_ngay WHERE sbd=? AND ngay>=? AND ngay<?) lsu,(SELECT json_group_array(json_array(ngay,json_extract(json,'$.goiId'))) FROM kiem_tra_ca_nhan WHERE sbd=? AND ngay>=?) kt` : ''}${muc > 2 ? `,m.luc mluc,${SQL_COT_NO}` : ''}
    FROM (SELECT 1) x LEFT JOIN goi_bai_7_muc_ngay m ON m.sbd=? AND m.ngay=?`).bind(sbd, ngay, sbd, ngay, sbd, ngay, ...(muc ? [sbd] : []), ...(muc > 1 ? [sbd, tu, ngay, sbd, tu] : []), ...(muc > 2 ? [sbd, sbd, ngay] : []), sbd, ngay).first<Row>()
  const r = await doc(3).catch(() => doc(2)).catch(() => doc(1)).catch(() => doc(0)).catch(() => undefined)
  if (r === undefined) return { muc: await docMucCu(env, sbd, ngay), loai: null, truoc: [] }
  return { muc: mucCua(r), loai: laLoaiNgay7(r?.loai) ? (r!.loai as LoaiNgay7) : null, truoc: [r?.t1, r?.t2].filter(laLoaiNgay7), lyDo: docCotLyDo(r?.ly), ...(r && 'lsu' in r ? { lich: docLich(r.lsu, r.kt) } : {}), ...(r && 'nc' in r ? { no: docCotNo(r.nc, r.ncc), ...(typeof r.mluc === 'string' ? { mucLuc: r.mluc } : {}) } : {}) }
}

/** Loại ngày của em hôm nay: đã chốt ⇒ giữ; chưa ⇒ luật `chonLoaiNgay7` (CPU, không đọc thêm — câu sai chờ sửa từ hồ sơ, câu mới còn của các gói sau cổng chặn).
 *  `loaiGhi` ≠ null ⇒ nơi gọi ghi cùng lô dòng mức 28. `conMoi7(g)` = câu mới còn của gói (ngày học mới lấy tới hết mức 28). */
export function loaiNgayEm7(ml: MucLoai7, ngay: string, goi: readonly GoiCuaEm7[], hs: Pick<HoSo2, 'cau' | 'loiV2'>, chan: ReadonlySet<string>, daGap: ReadonlySet<string>) {
  const conMoi7 = (g: GoiCuaEm7) => g.cau.filter(c => !daGap.has(c.qid) && !chan.has(c.qid) && !chan.has(c.group)).length
  const soSua = hs.cau.filter(c => ['mo', 'cho_kiem'].includes(hs.loiV2?.get(c.qid)?.trangThai ?? '') && !chan.has(c.qid)).length, soMoiCon = goi.reduce((n, g) => n + conMoi7(g), 0)
  const loaiNgay: LoaiNgay7 | null = ml.loai ?? chonLoaiNgay7({ ngay, truoc: ml.truoc, kiemNhe: goi.some(g => g.kiemNhe), soSua, soMoiCon })
  ml.loaiNay = loaiNgay
  return { loaiNgay, loaiGhi: ml.loai ? null : loaiNgay, conMoi7, lyDo: ml.lyDo ?? new Map<string, LyDoSai | 'cc'>(), soSua, soMoiCon }
}
