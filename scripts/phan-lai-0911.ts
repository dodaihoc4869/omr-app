// PHÂN LẠI CÂU CHO TOÀN BỘ HỌC SINH — chạy MỘT LẦN trong bước phát hành (thầy 09/11: «đẩy lên bản sống luôn đi và phân luôn lại câu cho toàn bộ học sinh»).
// Luật mới đã lên: mức 28 câu/ngày cố định + hạn chung cả lớp (server/src/han-chung.ts). Việc này áp luật cho các GÓI ĐANG CHẠY:
//   1. Mỗi gói còn hạn (han ≥ hôm nay, bài còn tick): hạn chung T theo năng lực lớp; hạn mới = max(hạn cũ, bắt đầu + T − 1) — CHỈ KÉO DÀI, không rút
//      (không em nào bỗng thành quá hạn). Đổi qua ĐÚNG đường «sửa hạn» của thầy (`suaHanCacGoi`): ghi hạn cũ vào goi_bai_7_sua_han (lùi được),
//      xoá số kế hoạch hôm nay của gói để tính lại, GIỮ mức của em đã đủ mức hôm nay (không đứt chuỗi).
//   2. Mức hôm nay khác 28 của em CHƯA đủ mức ⇒ xoá dòng chốt để lần mở kế tiếp chốt lại 28. Em đã đủ mức giữ nguyên.
// Không xoá sổ trả lời, không đổi điểm. Có ca thi mở ⇒ không làm gì, không đánh dấu (lần phát hành sau chạy lại). Đánh dấu cau_hinh 'phan_lai_0911' ⇒ chỉ một lần.
import type { Env } from '../server/src/kieu'
import { hanChungLop } from '../server/src/han-chung'
import { suaHanCacGoi } from '../server/src/goi-bai-7-thay'
import { sqlTenLopHs } from '../server/src/goi-bai-7'
import { congNgay7, ngayVn7 } from '../server/src/goi-bai-7-loi'
import { sqlDaDuMuc } from '../server/src/chuoi-ngay-bai'
import { MUC_NGAY_CO_DINH } from '../server/src/goi-bai-7-loi'

type Row = Record<string, unknown>
export async function phanLai0911(env: Env, now: number): Promise<Record<string, unknown>> {
  const ngay = ngayVn7(now)
  const da = await env.DB.prepare("SELECT 1 x FROM cau_hinh WHERE khoa='phan_lai_0911'").first<Row>()
  if (da) return { phanLai0911: 'da-chay-truoc' }
  const ca = await env.DB.prepare("SELECT COUNT(*) n FROM ca WHERE trang_thai='mo'").first<{ n: number }>()
  if (Number(ca?.n) > 0) return { phanLai0911: 'hoan-co-ca-mo' }
  const goi = (await env.DB.prepare(`SELECT g.id,g.lop,g.bat_dau,g.han,(SELECT COUNT(*) FROM goi_bai_7_cau c WHERE c.goi_id=g.id AND COALESCE(json_extract(c.meta_json,'$.hopLe'),1)<>0) so_cau
    FROM goi_bai_7 g JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE g.han>=?`).bind(ngay).all<Row>()).results
  const theoLop = new Map<string, string[]>()
  const doi: { goiId: string; lop: string; hanCu: string; hanMoi: string; T: number }[] = [], loi: string[] = []
  for (const g of goi) {
    const lop = String(g.lop), soCau = Number(g.so_cau) || 0
    if (!soCau) continue
    if (!theoLop.has(lop)) theoLop.set(lop, (await env.DB.prepare(`SELECT h.sbd FROM hoc_sinh h WHERE ${sqlTenLopHs('h')}=? AND COALESCE(h.trang_thai,'')<>'khoa'`).bind(lop).all<{ sbd: string }>()).results.map((x) => x.sbd))
    const hc = await hanChungLop(env, theoLop.get(lop)!, soCau, now)
    const hanMoi = [String(g.han), congNgay7(String(g.bat_dau), hc.T - 1)].sort().at(-1)!
    if (hanMoi === String(g.han)) continue
    try { await suaHanCacGoi(env, [{ goiId: String(g.id), hanCu: String(g.han) }], hanMoi, now); doi.push({ goiId: String(g.id), lop, hanCu: String(g.han), hanMoi, T: hc.T }) }
    catch (e) { loi.push(`${String(g.id)}: ${e instanceof Error ? e.message : String(e)}`) }
  }
  const xoaMuc = await env.DB.prepare(`DELETE FROM goi_bai_7_muc_ngay WHERE ngay=? AND muc<>? AND NOT ${sqlDaDuMuc('goi_bai_7_muc_ngay')} AND NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')`)
    .bind(ngay, MUC_NGAY_CO_DINH).run().then((r) => Number((r as { meta?: { changes?: number } }).meta?.changes ?? 0), () => -1)
  await env.DB.prepare("INSERT OR IGNORE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('phan_lai_0911',?,?)")
    .bind(JSON.stringify({ luc: new Date(now).toISOString(), soGoiDoiHan: doi.length, loi: loi.length }), new Date(now).toISOString()).run()
  return { phanLai0911: 'xong', soGoiConHan: goi.length, soGoiKeoDaiHan: doi.length, doi, loi, soDongMucHomNayTinhLai: xoaMuc }
}
