// NHỊP SỐNG CỦA MỘT CA ĐANG MỞ — `POST /ca/nhip` (đòi mã bí mật, CHỈ ĐỌC, chỉ-thêm 29/09/2026).
//
// Thầy 29/09: "Phần trên [màn Theo dõi ca] cho đồng bộ trực tiếp thời gian thực luôn". Trước đây màn thầy chỉ tải lại TOÀN BỘ chi tiết ca
// (`/ca/chi-tiet`: 4 câu D1 + 1 R2, kéo cả đáp án từng em) mỗi 20 giây. Hỏi dày như thế thì nặng; nên tách một lệnh NHẸ để hỏi 3 giây/lần:
//   1. `tt`    — tiến độ SỐNG từng em từ bảng `trang_thai` (máy em đẩy ~10 s/lần: số câu đã làm, số lần rời màn, đang làm, bị chặn) — CHỈ những dòng
//                đổi từ mốc `sau` (máy thầy gửi lại `moc` của lần trước) ⇒ lần hỏi thường chỉ trả vài dòng.
//   2. `dauVet` — dấu vết gọn của những gì BẮT BUỘC tải lại cả ca: số lượt, số lượt theo trạng thái, giờ vào/nộp/duyệt mới nhất, hạn giờ, ca đổi
//                (thêm phút, đóng cửa, kết thúc), phòng chờ. KHÔNG tính `cap_nhat_luc` của lượt vì lưu tạm đáp án đổi nó liên tục.
//   3. `gioMayChu` — giờ máy chủ để đồng hồ màn thầy chạy theo máy chủ.
// Một lượt `DB.batch` (một vòng đi-về D1, 4 câu). KHÔNG trả đáp án, KHÔNG trả mã máy, KHÔNG ghi gì.

interface D1Cau {
  bind(...v: unknown[]): D1Cau
}
interface D1Nho {
  prepare(sql: string): D1Cau
  batch(cau: D1Cau[]): Promise<{ results?: Record<string, unknown>[] }[]>
}

export interface DongTienDoSong {
  sbd: string
  dangLam: boolean
  daLam: number
  tongCau: number
  soLanRoiMan: number
  biChan: boolean
  batDauLuc: string
  capNhatLuc: string
}

/** Mốc `sau` hợp lệ: chuỗi giờ ISO ngắn; lạ ⇒ coi như lần đầu (trả hết). */
function chuanMoc(v: unknown): string {
  const s = typeof v === 'string' ? v.trim() : ''
  return s.length <= 40 && /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(s) ? s : ''
}

export async function nhipCa(env: { DB: D1Nho }, b: Record<string, unknown>, nay = Date.now()): Promise<Record<string, unknown>> {
  const maCa = String(b.maCa ?? '').trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  const sau = chuanMoc(b.sau)
  const [rCa, rLuot, rCho, rTt] = await env.DB.batch([
    env.DB.prepare(
      'SELECT trang_thai, thoi_gian_phut, them_phut_tong, het_han_vao, bat_dau_thi_luc, dong_bo_gio, phong_cho, cap_nhat_luc FROM ca WHERE ma_ca = ?',
    ).bind(maCa),
    // `>=` chứ không `>`: hai lần ghi cùng một mili-giây vẫn không lọt; máy thầy gộp trùng theo SBD.
    env.DB.prepare(
      `SELECT COUNT(*) AS n,
              SUM(trang_thai = 'dang_lam') AS dl, SUM(trang_thai = 'da_nop') AS dn, SUM(trang_thai = 'khoa') AS kh,
              MAX(vao_luc) AS vao, MAX(nop_luc) AS nop, MAX(duyet_luc) AS duyet, MAX(het_gio_luc) AS het,
              SUM(so_lan_roi_man) AS rm, SUM(tong IS NOT NULL) AS co_diem
         FROM luot WHERE ma_ca = ?`,
    ).bind(maCa),
    env.DB.prepare('SELECT COUNT(*) AS n, MAX(ghi_luc) AS moi FROM phong_cho WHERE ma_ca = ?').bind(maCa),
    env.DB.prepare(
      `SELECT sbd, dang_lam, da_lam_cau_hoi, tong_cau_hoi, so_lan_roi_app, blocked, bat_dau_luc, cap_nhat_luc
         FROM trang_thai WHERE ma_ca = ? AND cap_nhat_luc >= ? ORDER BY cap_nhat_luc LIMIT 500`,
    ).bind(maCa, sau),
  ])
  const ca = rCa.results?.[0]
  if (!ca) return { ok: true, coCa: false, gioMayChu: nay }
  const l = rLuot.results?.[0] ?? {}
  const c = rCho.results?.[0] ?? {}
  const s = (v: unknown) => (v === null || v === undefined ? '' : String(v))
  const dauVet = [
    s(ca.trang_thai), s(ca.thoi_gian_phut), s(ca.them_phut_tong), s(ca.het_han_vao), s(ca.bat_dau_thi_luc), s(ca.dong_bo_gio), s(ca.phong_cho), s(ca.cap_nhat_luc),
    s(l.n), s(l.dl), s(l.dn), s(l.kh), s(l.vao), s(l.nop), s(l.duyet), s(l.het), s(l.rm), s(l.co_diem),
    s(c.n), s(c.moi),
  ].join('|')
  const tt: DongTienDoSong[] = (rTt.results ?? []).map((r) => ({
    sbd: s(r.sbd),
    dangLam: Number(r.dang_lam) === 1,
    daLam: Number(r.da_lam_cau_hoi) || 0,
    tongCau: Number(r.tong_cau_hoi) || 0,
    soLanRoiMan: Number(r.so_lan_roi_app) || 0,
    biChan: Number(r.blocked) === 1,
    batDauLuc: s(r.bat_dau_luc),
    capNhatLuc: s(r.cap_nhat_luc),
  }))
  const moc = tt.reduce((m, x) => (x.capNhatLuc > m ? x.capNhatLuc : m), sau)
  return { ok: true, coCa: true, gioMayChu: nay, dauVet, tt, moc }
}
