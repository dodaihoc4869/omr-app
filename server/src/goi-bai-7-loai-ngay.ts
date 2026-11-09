// LOẠI NGÀY Gói 7 — khối B đợt 1 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911 «duyệt, build và đẩy lên bản sống luôn»). Luật chọn: `chonLoaiNgay7`
// (goi-bai-7-loi.ts); chốt cùng lô dòng mức 28 (`chotMucNgay7`, goi-bai-7.ts). Tệp này: đọc MỨC + LOẠI NGÀY trong MỘT câu D1 (luật tốc độ: Sảnh không thêm lệnh).
import type { Env } from './kieu'
import type { TangHanhTrinh } from './hanh-trinh-ngay'
import type { MucNgay7, GoiCuaEm7 } from './goi-bai-7'
import type { HoSo2 } from './srs2-d1'
import { NGAY_LOAI_NGAY, chonLoaiNgay7, laLoaiNgay7, type LoaiNgay7 } from './goi-bai-7-loi'
import { docCotLyDo, type LyDoSai } from './ly-do-sai'

type Row = Record<string, unknown>
export interface MucLoai7 { muc: MucNgay7 | null; loai: LoaiNgay7 | null; truoc: LoaiNgay7[]; lyDo?: ReadonlyMap<string, LyDoSai> }
const tang7 = (v: unknown): TangHanhTrinh => { const t = Math.floor(Number(v)); return (t >= 1 && t <= 4 ? t : 1) as TangHanhTrinh }
const mucCua = (r: Row | null | undefined): MucNgay7 | null =>
  r && Number(r.muc) > 0 ? { tang: tang7(r.tang), toiThieuTang: Number(r.toi_thieu_tang) || 0, quota: Number(r.quota) || 0, muc: Number(r.muc), daChot: true } : null
const docMucCu = (env: Env, sbd: string, ngay: string) =>
  env.DB.prepare('SELECT tang,toi_thieu_tang,quota,muc FROM goi_bai_7_muc_ngay WHERE sbd=? AND ngay=?').bind(sbd, ngay).first<Row>().then(mucCua, () => null)

/** Dòng mức hôm nay + loại ngày đã chốt hôm nay + loại của hai ngày có loại gần nhất (mới trước). Ngày trước mốc ⇒ đúng câu đọc mức cũ; câu mới lỗi ⇒ đọc cũ. */
export async function docMucLoai7(env: Env, sbd: string, ngay: string): Promise<MucLoai7> {
  if (ngay < NGAY_LOAI_NGAY) return { muc: await docMucCu(env, sbd, ngay), loai: null, truoc: [] }
  const q = 'SELECT loai FROM goi_bai_7_loai_ngay WHERE sbd=? AND ngay'
  // 09/11 lát 3: lý do sai («Vì sao em sai?», goi_bai_7_ly_do) đọc CÙNG câu (nhóm lỗi ngày Sửa) — câu có cột ấy lỗi ⇒ đọc lại không cột (chỉ khi lỗi).
  const doc = (ly: boolean) => env.DB.prepare(`SELECT m.tang,m.toi_thieu_tang,m.quota,m.muc,(${q}=?) loai,(${q}<? ORDER BY ngay DESC LIMIT 1) t1,(${q}<? ORDER BY ngay DESC LIMIT 1 OFFSET 1) t2${ly ? ',(SELECT json_group_array(json_array(qid,ly)) FROM goi_bai_7_ly_do WHERE sbd=?) ly' : ''}
    FROM (SELECT 1) x LEFT JOIN goi_bai_7_muc_ngay m ON m.sbd=? AND m.ngay=?`).bind(sbd, ngay, sbd, ngay, sbd, ngay, ...(ly ? [sbd] : []), sbd, ngay).first<Row>()
  const r = await doc(true).catch(() => doc(false)).catch(() => undefined)
  if (r === undefined) return { muc: await docMucCu(env, sbd, ngay), loai: null, truoc: [] }
  return { muc: mucCua(r), loai: laLoaiNgay7(r?.loai) ? (r!.loai as LoaiNgay7) : null, truoc: [r?.t1, r?.t2].filter(laLoaiNgay7), lyDo: docCotLyDo(r?.ly) }
}

/** Loại ngày của em hôm nay: đã chốt ⇒ giữ; chưa ⇒ luật `chonLoaiNgay7` (CPU, không đọc thêm — câu sai chờ sửa từ hồ sơ, câu mới còn của các gói sau cổng chặn).
 *  `loaiGhi` ≠ null ⇒ nơi gọi ghi cùng lô dòng mức 28. `conMoi7(g)` = câu mới còn của gói (ngày học mới lấy tới hết mức 28). */
export function loaiNgayEm7(ml: MucLoai7, ngay: string, goi: readonly GoiCuaEm7[], hs: Pick<HoSo2, 'cau' | 'loiV2'>, chan: ReadonlySet<string>, daGap: ReadonlySet<string>) {
  const conMoi7 = (g: GoiCuaEm7) => g.cau.filter(c => !daGap.has(c.qid) && !chan.has(c.qid) && !chan.has(c.group)).length
  const loaiNgay: LoaiNgay7 | null = ml.loai ?? chonLoaiNgay7({ ngay, truoc: ml.truoc, kiemNhe: goi.some(g => g.kiemNhe),
    soSua: hs.cau.filter(c => ['mo', 'cho_kiem'].includes(hs.loiV2?.get(c.qid)?.trangThai ?? '') && !chan.has(c.qid)).length, soMoiCon: goi.reduce((n, g) => n + conMoi7(g), 0) })
  return { loaiNgay, loaiGhi: ml.loai ? null : loaiNgay, conMoi7, lyDo: ml.lyDo ?? new Map<string, LyDoSai>() }
}
