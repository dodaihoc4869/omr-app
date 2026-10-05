// VÀNG TỰ ĐỘNG + RÈN KHIÊN BẰNG VÀNG — luật v4 (thầy chốt 29/09/2026, docs/DE-XUAT-EXP-2909.md mục 2.4–2.5).
//
// Vàng vẫn nằm ở sổ cái CHỈ THÊM DÒNG `vang_so` (số dư = SUM(so_vang)). Không có bảng/cột mới:
//   · ĐÚC: dòng `loai = 'doi'` (so_vang > 0, exp_tru = 0 vì thú KHÔNG bị trừ EXP), `khoa_yeu_cau = 'duc|<tổng đã đúc sau dòng này>'`.
//     Vàng đáng đúc = floor((earned − mocVang) / EXP_MOI_VANG) (`vangDangDuc`); mỗi lần đọc chỉ thêm PHẦN CHÊNH với tổng đã đúc, tính NGAY TRONG một câu SQL
//     (hai lượt chạy chồng không đúc đôi; cùng tổng ⇒ cùng khoá ⇒ UNIQUE(sbd, khoa_yeu_cau) chặn). Phần lẻ < 5 EXP không mất (lần sau đúc tiếp).
//   · RÈN KHIÊN: dòng `loai = 'mua'`, so_vang = −VANG_REN_KHIEN, ma_mon = 'khien-ren', khoá 'ren-khien|<lần rèn thứ n>' ⇒ gửi lại không trừ đôi.
// Dấu '|' không nằm trong khoá máy em gửi (`[A-Za-z0-9_-]`) nên không đụng dòng đổi/mua cũ. Vàng cũ (đổi tay 1:1) GIỮ NGUYÊN.
import type { Env } from './kieu'
import type { Profile } from './game-v2'
import { VANG_REN_KHIEN, vangDangDuc } from '../../src/lib/kinh-te-game'
import { renKhienBangVang } from './exp-ho-so-game'

export const TIEN_TO_DUC = 'duc|'
export const MA_MON_KHIEN_REN = 'khien-ren'
const thieuBang = (e: unknown): boolean => /no such table/i.test(e instanceof Error ? e.message : String(e))

/** Số vàng hiện có (SUM sổ). Chưa có bảng ⇒ 0. */
export async function docVangCo(env: Env, sbd: string): Promise<number> {
  try {
    const r = await env.DB.prepare('SELECT COALESCE(SUM(so_vang), 0) AS v FROM vang_so WHERE sbd = ?').bind(sbd).first<{ v: number }>()
    return Number(r?.v) || 0
  } catch (e) {
    if (!thieuBang(e)) throw e
    return 0
  }
}

/**
 * ĐÚC VÀNG LƯỜI cho một em từ hồ sơ đã đọc (`earned`, `mocVang`). Trả số vàng vừa đúc lần này (0 nếu đã bắt kịp). Không ném lỗi (vàng đúc trễ vẫn đúng ở lần đọc sau).
 */
export async function ducVang(env: Env, sbd: string, p: Pick<Profile, 'earned'> & { mocVang?: number }, nowMs: number = Date.now()): Promise<number> {
  const tong = vangDangDuc(p)
  if (tong <= 0) return 0
  try {
    const chen = env.DB.prepare(
      `INSERT OR IGNORE INTO vang_so(sbd, loai, so_vang, exp_tru, ma_mon, khoa_yeu_cau, luc)
       SELECT ?, 'doi', ? - d.v, 0, NULL, ?, ?
         FROM (SELECT COALESCE(SUM(so_vang), 0) AS v FROM vang_so WHERE sbd = ? AND loai = 'doi' AND khoa_yeu_cau LIKE '${TIEN_TO_DUC}%') d
        WHERE ? - d.v > 0`,
    ).bind(sbd, tong, `${TIEN_TO_DUC}${tong}`, new Date(nowMs).toISOString(), sbd, tong)
    const docLai = env.DB.prepare('SELECT so_vang FROM vang_so WHERE sbd = ? AND khoa_yeu_cau = ?').bind(sbd, `${TIEN_TO_DUC}${tong}`)
    // Tối ưu 05/10: chèn + đọc lại dòng vừa đúc trong MỘT lô (một giao dịch — câu đọc ngay sau câu chèn như đọc nối tiếp cũ) — trước: hai đợt. D1 không có `batch` ⇒ như cũ.
    if (typeof env.DB.batch === 'function') {
      const [r, moi] = await env.DB.batch<{ so_vang: number }>([chen, docLai])
      if (!r?.meta.changes) return 0
      return Math.max(0, Number(moi?.results?.[0]?.so_vang) || 0)
    }
    const r = await chen.run()
    if (!r.meta.changes) return 0
    const moi = await docLai.first<{ so_vang: number }>()
    return Math.max(0, Number(moi?.so_vang) || 0)
  } catch (e) {
    if (!thieuBang(e)) console.error('[vang-duc] đúc vàng lỗi (bỏ qua, lần đọc sau đúc tiếp):', e instanceof Error ? e.message : e)
    return 0
  }
}

/**
 * RÈN MỘT KHIÊN BẰNG VÀNG (nguyên tử): đúc vàng còn thiếu → kiểm luật (`renKhienBangVang`) → MỘT lô D1: (a) thêm dòng −1 400 vàng NẾU hồ sơ còn đúng `revision`,
 * đủ vàng và khoá lần rèn chưa có; (b) ghi hồ sơ (mảnh −21, đã rèn +1) CHỈ khi (a) vừa ghi. Gửi lại cùng `soDaRen` ⇒ `daRen: false`, không trừ thêm.
 */
export async function renKhienVang(env: Env, sbd: string, p: Profile, revision: number, soDaRen: number): Promise<{ daRen: boolean; revision: number }> {
  await ducVang(env, sbd, p)
  const vang = await docVangCo(env, sbd)
  const moi: Profile = JSON.parse(JSON.stringify(p)) as Profile
  if (!renKhienBangVang(moi, soDaRen, vang)) return { daRen: false, revision }
  const khoa = `ren-khien|${moi.khienRen!.daRen}`
  const luc = new Date().toISOString()
  const r = await env.DB.batch([
    env.DB.prepare(
      `INSERT OR IGNORE INTO vang_so(sbd, loai, so_vang, exp_tru, ma_mon, khoa_yeu_cau, luc)
       SELECT ?, 'mua', ?, 0, ?, ?, ?
        WHERE EXISTS (SELECT 1 FROM game_v2_profile WHERE sbd = ? AND revision = ?)
          AND (SELECT COALESCE(SUM(so_vang), 0) FROM vang_so WHERE sbd = ?) >= ?`,
    ).bind(sbd, -VANG_REN_KHIEN, MA_MON_KHIEN_REN, khoa, luc, sbd, revision, sbd, VANG_REN_KHIEN),
    env.DB.prepare('UPDATE game_v2_profile SET json = ?, revision = revision + 1 WHERE sbd = ? AND revision = ? AND changes() = 1').bind(JSON.stringify(moi), sbd, revision),
  ])
  if (r[1]?.meta?.changes === 1) {
    Object.assign(p, moi)
    return { daRen: true, revision: revision + 1 }
  }
  throw new Error('Chưa rèn được khiên vì hồ sơ vừa đổi. Em tải lại Túi đồ rồi rèn lại, vàng của em chưa bị trừ.')
}
