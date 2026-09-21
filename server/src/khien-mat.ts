// MẤT KHIÊN KHI VẮNG (thầy lệnh 21/09: "Thêm tiêu chí mất chuỗi bao nhiêu ngày sẽ bị mất 1 khiên"; Boss chốt số ở `KHIEN_MAT_KHI_VANG_NGAY` = 7).
// Cron 00:01 giờ VN (`scheduled`, cùng mốc `1 17 * * *`): với mỗi em ĐANG CÓ khiên (`khienConLai > 0`), đếm số NGÀY LIÊN TIẾP đến hôm qua KHÔNG đạt nhiệm vụ ngày.
//   · ≥ 7 ngày ⇒ trừ 1 khiên: khiên RÈN chưa dùng trước, hết thì khiên QUÀ chưa dùng; không có khiên ⇒ không trừ gì, không âm. MẢNH khiên KHÔNG bị trừ.
//   · Sau khi trừ, bộ đếm vắng về 0 (vắng tiếp 7 ngày NỮA mới trừ tiếp): cửa sổ đếm bắt đầu từ ngày trừ.
//   · Ngày nghỉ hợp lệ (`cau_hinh.ngay_nghi`) không tính là vắng (bỏ qua, không cắt chuỗi vắng). Không đếm ngày trước mốc `khien_moc` (mọi em xuất phát cùng lúc); chưa đặt mốc ⇒ không chạy.
//   · Đúng ngày vắng thứ 5, em ĐANG có khiên nhận MỘT tin trong app ("Còn 2 ngày nữa chưa quay lại thì em mất 1 khiên…"); khi mất: MỘT tin nói thật + đường quay lại. Em chưa có khiên: không tin nào.
// Idempotent bằng khoá sổ `khien|mat|<sbd>|<ngày>` (bảng `khien_mat_so`; ghi để đối soát/lùi) và CAS theo `revision` của hồ sơ game. Không ném lỗi ra ngoài (cron bọc `ghiLoiMay`).
import type { Env } from './kieu'
import { KHIEN_BAO_VANG_NGAY, KHIEN_MAT_KHI_VANG_NGAY, KHOA_KHIEN_MOC } from './exp-cau-hinh'
import { khienConLai, khienRenChuaDung, type HoSoGameExp } from './exp-ho-so-game'
import { themNgay } from './ho-so-nam-kt'
import { docNgayNghi } from './ke-hoach-ngay-d1'
import { ngayVn } from './su-kien-hoc'

export const TIEU_DE_KHIEN = 'A.I Đỗ Đại Học · Khiên của em'
export const KENH_KHIEN = 'khien'
const DANG_NGAY = /^\d{4}-\d{2}-\d{2}$/

export const loiBaoSapMat = (): string =>
  `Em đã nghỉ ${KHIEN_BAO_VANG_NGAY} ngày. Còn ${KHIEN_MAT_KHI_VANG_NGAY - KHIEN_BAO_VANG_NGAY} ngày nữa chưa quay lại thì em mất 1 khiên — làm một việc nhỏ hôm nay là giữ được.`
export const loiDaMat = (): string =>
  `Em đã nghỉ ${KHIEN_MAT_KHI_VANG_NGAY} ngày liên tiếp nên A.I Đỗ Đại Học đã trừ 1 khiên của em. Em làm nhiệm vụ ngày hôm nay là bắt đầu rèn lại được; mảnh khiên em đã có vẫn còn nguyên.`

/**
 * HÀM THUẦN: số ngày vắng liên tiếp tính ngược từ `homQua` về `batDau` (gồm cả hai đầu). Ngày đạt cắt chuỗi; ngày nghỉ bị bỏ qua (không cộng, không cắt).
 * `batDau` = max(mốc, ngày trừ khiên gần nhất) — nên sau khi trừ bộ đếm về 0.
 */
export function soNgayVang(homQua: string, batDau: string, ngayDat: ReadonlySet<string>, ngayNghi: ReadonlySet<string>): number {
  let dem = 0
  for (let d = homQua; d >= batDau; d = themNgay(d, -1)) {
    if (ngayDat.has(d)) break
    if (ngayNghi.has(d)) continue
    dem++
  }
  return dem
}

export interface KetQuaMatKhien {
  chay: boolean
  lyDo?: 'chua_dat_moc' | 'chua_toi_ngay_moc' | 'loi'
  soTru: number
  soBao: number
}

type Hang = Record<string, unknown>

export async function matKhienVangNgay(env: Env, nowMs: number): Promise<KetQuaMatKhien> {
  const khong = (lyDo: KetQuaMatKhien['lyDo']): KetQuaMatKhien => ({ chay: false, lyDo, soTru: 0, soBao: 0 })
  try {
    const rMoc = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_KHIEN_MOC).first<{ gia_tri: string }>()
    const moc = String(rMoc?.gia_tri ?? '').trim()
    if (!DANG_NGAY.test(moc)) return khong('chua_dat_moc')
    const homNay = ngayVn(nowMs)
    const homQua = themNgay(homNay, -1)
    if (homQua < moc) return khong('chua_toi_ngay_moc')
    const luc = new Date(nowMs).toISOString()

    const [rHoSo, rDat, rMat, ngayNghi] = await Promise.all([
      env.DB.prepare('SELECT sbd, revision, json FROM game_v2_profile').all<Hang>(),
      env.DB.prepare("SELECT sbd, ngay_vn FROM manh_khien_so WHERE loai = 'dat' AND ngay_vn >= ?").bind(moc).all<Hang>(),
      env.DB.prepare('SELECT sbd, MAX(ngay_vn) AS m FROM khien_mat_so GROUP BY sbd').all<Hang>(),
      docNgayNghi(env),
    ])
    const ngayDatCua = new Map<string, Set<string>>()
    for (const x of rDat.results ?? []) {
      const s = String(x.sbd)
      const t = ngayDatCua.get(s) ?? new Set<string>()
      t.add(String(x.ngay_vn))
      ngayDatCua.set(s, t)
    }
    const matCuoi = new Map((rMat.results ?? []).map((x) => [String(x.sbd), String(x.m ?? '')]))

    let soTru = 0
    let soBao = 0
    for (const h of rHoSo.results ?? []) {
      const sbd = String(h.sbd)
      let p: HoSoGameExp & Record<string, unknown>
      try { p = JSON.parse(String(h.json)) as HoSoGameExp & Record<string, unknown> } catch { continue }
      if (khienConLai(p) <= 0) continue // chưa có khiên ⇒ không trừ gì, không tin nào
      const truoc = matCuoi.get(sbd) ?? ''
      const batDau = truoc > moc ? truoc : moc // ngày trừ gần nhất là ngày đầu của cửa sổ mới (bộ đếm về 0)
      const vang = soNgayVang(homQua, batDau, ngayDatCua.get(sbd) ?? new Set(), ngayNghi)

      if (vang >= KHIEN_MAT_KHI_VANG_NGAY) {
        const kq = await truKhien(env, sbd, Number(h.revision) || 0, p, homNay, vang, luc)
        if (kq) soTru++
      } else if (vang === KHIEN_BAO_VANG_NGAY) {
        const r = await env.DB.prepare('INSERT OR IGNORE INTO student_notice (id, sbd, title, body, target, created_at) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(`khien|bao|${sbd}|${batDau}`, sbd, TIEU_DE_KHIEN, loiBaoSapMat(), KENH_KHIEN, luc)
          .run()
        if (Number(r.meta?.changes ?? 0) > 0) soBao++
      }
    }
    return { chay: true, soTru, soBao }
  } catch (e) {
    console.error('[khien-mat] lỗi:', e instanceof Error ? e.message : e)
    throw e
  }
}

/** Trừ 1 khiên MỘT em: CAS theo `revision`; sổ + tin chỉ ghi khi hồ sơ VỪA được cập nhật (cùng batch). Thử lại một lần nếu hồ sơ vừa đổi. */
async function truKhien(env: Env, sbd: string, revision: number, p0: HoSoGameExp & Record<string, unknown>, homNay: string, vang: number, luc: string): Promise<boolean> {
  const khoa = `khien|mat|${sbd}|${homNay}`
  let rev = revision
  let p = p0
  for (let lan = 0; lan < 2; lan++) {
    const daCo = await env.DB.prepare('SELECT 1 AS x FROM khien_mat_so WHERE khoa = ?').bind(khoa).first()
    if (daCo) return false // hôm nay đã trừ (chạy lại)
    if (khienConLai(p) <= 0) return false
    const q = JSON.parse(JSON.stringify(p)) as HoSoGameExp & Record<string, unknown>
    let tu: 'ren' | 'qua'
    if (khienRenChuaDung(q) > 0) {
      q.khienRen = { manh: Math.max(0, q.khienRen?.manh ?? 0), daRen: Math.max(0, (q.khienRen?.daRen ?? 0) - 1) }
      tu = 'ren'
    } else {
      q.shields = { ...(q.shields ?? { used: 0 }), used: Math.max(0, q.shields?.used ?? 0) + 1 }
      tu = 'qua'
    }
    const kq = await env.DB.batch([
      env.DB.prepare('UPDATE game_v2_profile SET json = ?, revision = revision + 1 WHERE sbd = ? AND revision = ?').bind(JSON.stringify(q), sbd, rev),
      env.DB.prepare(
        `INSERT OR IGNORE INTO khien_mat_so (khoa, sbd, ngay_vn, so_ngay_vang, tu, luc)
         SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM game_v2_profile WHERE sbd = ? AND revision = ?)`,
      ).bind(khoa, sbd, homNay, vang, tu, luc, sbd, rev + 1),
      env.DB.prepare(
        `INSERT OR IGNORE INTO student_notice (id, sbd, title, body, target, created_at)
         SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM khien_mat_so WHERE khoa = ?)`,
      ).bind(khoa, sbd, TIEU_DE_KHIEN, loiDaMat(), KENH_KHIEN, luc, khoa),
    ])
    if (Number((kq[0] as { meta?: { changes?: number } })?.meta?.changes ?? 0) > 0) return true
    // hồ sơ vừa bị ghi chỗ khác: đọc lại rồi thử một lần nữa
    const moi = await env.DB.prepare('SELECT revision, json FROM game_v2_profile WHERE sbd = ?').bind(sbd).first<{ revision: number; json: string }>()
    if (!moi) return false
    rev = Number(moi.revision) || 0
    try { p = JSON.parse(moi.json) as HoSoGameExp & Record<string, unknown> } catch { return false }
  }
  return false
}
