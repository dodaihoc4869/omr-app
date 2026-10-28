// ĐÓNG ĐỢT CŨ HƠN 14 NGÀY THEO LUẬT TỰ LÀM — CRON ĐÊM (thầy duyệt 28/10 «sửa theo đề xuất»). Đặc tả luật: chua-gon.ts (`sqlDaTuSuaDungLai`).
// Đường đóng tự động khi em mở danh sách (`SQL_DONG_DA_DUNG_LAI`) chỉ xét đợt sai trong 14 ngày ⇒ đợt cũ hơn mà em đã làm đúng lại qua luật tự làm vẫn nằm
// «Cần sửa» mãi. Cron này xét các đợt ấy bằng ĐÚNG điều kiện cũ (sbd = cột của đợt), KHÔNG xoá gì, chỉ đóng đợt (`da_tu_sua`, `dong_luc`) một lần:
//   · chỉ 00:30–05:59 giờ VN (ngoài giờ học), mỗi phút MỘT lô `LO_DEM` đợt (đo 28/10: 14 287 đợt mở cũ, lô 200 ≈ 0,58 s D1 ⇒ lô 60 ≈ 0,18 s, ~240 phút một vòng) theo con trỏ id (chỉ mục bộ phận `idx_cld_mo_cu` dựng 00:01, chi-muc-luc-chay.ts);
//   · lô = một batch: chọn cửa sổ + đóng + lưu con trỏ (cau_hinh `tu_sua_dong_cu`); hết bảng ⇒ con trỏ về đầu, đêm sau xét lại (lượt đúng mới có thể tới);
//   · không thưởng nguyên tử (lượt đúng ở kênh khác đã có nguyên tử của kênh ấy).
import type { Env } from './kieu'
import { NGAY_CUA_SO_GON, sqlDaTuSuaDungLai } from './chua-gon'

export const LO_DEM = 60
export const KHOA_CON_TRO = 'tu_sua_dong_cu'
/** Khung chạy theo phút trong ngày VN: [00:30, 06:00). */
export const PHUT_TU = 30
export const PHUT_DEN = 360

const MO_CU = `dong_luc IS NULL AND trang_thai_day<>'da_tu_sua' AND COALESCE(sai_cuoi_luc,mo_luc)<?3`
/** ?1 = bây giờ (ms), ?2 = con trỏ id (đợt sau con trỏ), ?3 = mốc 14 ngày (ms), ?4 = cỡ lô. */
const CUA_SO = `SELECT id FROM chua_loi_dot WHERE id>?2 AND ${MO_CU} ORDER BY id LIMIT ?4`
export const SQL_DONG_CU_LO = `UPDATE chua_loi_dot SET trang_thai_day='da_tu_sua',dong_luc=?1,revision=revision+1,cap_nhat_luc=?1
  WHERE id IN (${CUA_SO}) AND ${MO_CU} AND ${sqlDaTuSuaDungLai('chua_loi_dot', 'chua_loi_dot.sbd')}`

export const trongKhungDem = (nowMs: number): boolean => {
  const g = new Date(nowMs + 7 * 3_600_000)
  const ph = g.getUTCHours() * 60 + g.getUTCMinutes()
  return ph >= PHUT_TU && ph < PHUT_DEN
}

export interface KetQuaDongCu { chay: boolean; xet: number; dong: number; het: boolean }

/** Một lô (cron mỗi phút). Ngoài khung ⇒ không truy vấn. `lo` chỉ để test. */
export async function cronDongDotCu(env: Env, nowMs: number, lo = LO_DEM, epBuoc = false): Promise<KetQuaDongCu> {
  if (!epBuoc && !trongKhungDem(nowMs)) return { chay: false, xet: 0, dong: 0, het: false }
  const tro = String((await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa=?').bind(KHOA_CON_TRO).first<{ gia_tri: string }>())?.gia_tri ?? '')
  const moc = nowMs - NGAY_CUA_SO_GON * 86_400_000
  // Cùng một batch (một giao dịch): đếm cửa sổ + lưu con trỏ (= id cuối cửa sổ; rỗng ⇒ '' về đầu) TRƯỚC khi đóng, rồi đóng (theo con trỏ CŨ đã gắn).
  const r = await env.DB.batch([
    env.DB.prepare(`SELECT COUNT(*) AS n FROM (${CUA_SO})`).bind(nowMs, tro, moc, lo),
    env.DB.prepare(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?1,COALESCE((SELECT MAX(id) FROM (${CUA_SO})), ''),strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri,cap_nhat_luc=excluded.cap_nhat_luc`).bind(KHOA_CON_TRO, tro, moc, lo),
    env.DB.prepare(SQL_DONG_CU_LO).bind(nowMs, tro, moc, lo),
  ])
  const xet = Number((r[0]?.results?.[0] as { n?: number } | undefined)?.n) || 0
  return { chay: true, xet, dong: Number(r[2]?.meta.changes) || 0, het: xet < lo }
}
