/**
 * ĐẤU TRƯỜNG CHÂN LÝ — PHÍA MÁY CHỦ.
 *
 * Thầy chốt 15-09: *"bấm vào võ đài xếp hạng thì phải hiện ra đấu trường chân
 * lý luôn, chọn cửa mời số báo danh tối đa được 6 người chơi cùng lúc, thiết
 * kế đánh nhau như đấu trường chân lý"*.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * MÁY CHỦ KHÔNG XỬ TRẬN, VÀ ĐÓ LÀ CHỦ Ý.
 *
 * Bộ luật đánh nhau nằm ở `src/game/than-thu-hoa-hoc/dau-truong-chan-ly.ts` và
 * nó TẤT ĐỊNH: cùng mã phòng, cùng vòng, cùng các đội hình đã nộp thì máy nào
 * tính cũng ra một kết quả. Chép bộ luật ấy sang Worker nghĩa là nuôi HAI bản
 * luật; sửa cân bằng một bên quên bên kia là em thấy thắng, bạn thấy thua, và
 * không ai truy được tại đâu. Ở đây máy chủ chỉ làm ĐÚNG MỘT VIỆC: giữ hộ đội
 * hình từng người đã nộp cho từng vòng.
 *
 * TẦNG ĐỎ. `voDaiXem` KHÔNG trả số báo danh của bạn cùng phòng về máy em —
 * mỗi người hiện ra bằng BIỆT DANH (tên thần thú). Số báo danh chỉ dùng đúng
 * chỗ thầy chốt: gõ vào ô mời. Người gõ vốn đã biết số ấy.
 */

import type { Env } from './kieu'
import { NAY, chuoi } from './goi-cu'

/** Sáu người một phòng — đúng con số thầy chốt. */
export const SO_NGUOI_TOI_DA = 6
/** Phòng để quá lâu không ai đụng thì coi như bỏ. */
const HAN_PHONG_GIO = 6
const MA_CHU_CAI = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function soNguyen(v: unknown, thap: number, cao: number, mac = 0): number {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return mac
  return Math.max(thap, Math.min(cao, n))
}

/** Mã phòng bốn ký tự, bỏ các ký tự dễ đọc nhầm (I, O, 0, 1). */
function maMoi(): string {
  let s = ''
  for (let i = 0; i < 4; i++) {
    s += MA_CHU_CAI[Math.floor(Math.random() * MA_CHU_CAI.length)]
  }
  return s
}

/** Một người trong phòng, ở dạng máy chủ cất giữ. */
interface NguoiLuu {
  sbd: string
  biDanh: string
  he: string
  /** Đội hình đã nộp theo vòng: `nop['3']` là đội hình vòng 3. */
  nop: Record<string, { doiHinh: { idQuan: string; sao: number }[]; mau: number; vang: number; kinhNghiem: number; chuoi: number }>
  vaoLuc: string
}

interface PhongLuu {
  nguoi: NguoiLuu[]
}

function docPhong(json: string): PhongLuu {
  try {
    const o = JSON.parse(json) as Record<string, unknown>
    const ds = Array.isArray(o.nguoi) ? o.nguoi : []
    return { nguoi: ds.map((x) => locNguoi(x)) }
  } catch {
    return { nguoi: [] }
  }
}

/** Lọc từng trường — không tin máy em gửi gì cũng cất. */
function locNguoi(x: unknown): NguoiLuu {
  const o = (x ?? {}) as Record<string, unknown>
  const nopTho = (o.nop ?? {}) as Record<string, unknown>
  const nop: NguoiLuu['nop'] = {}
  for (const khoa of Object.keys(nopTho).slice(0, 60)) {
    const v = (nopTho[khoa] ?? {}) as Record<string, unknown>
    const dh = Array.isArray(v.doiHinh) ? v.doiHinh : []
    nop[String(khoa).slice(0, 6)] = {
      doiHinh: dh.slice(0, SO_NGUOI_TOI_DA + 2).map((q) => {
        const d = (q ?? {}) as Record<string, unknown>
        return { idQuan: chuoi(d.idQuan).slice(0, 40), sao: soNguyen(d.sao, 1, 3, 1) }
      }).filter((q) => q.idQuan !== ''),
      mau: soNguyen(v.mau, 0, 999, 0),
      vang: soNguyen(v.vang, 0, 9999, 0),
      kinhNghiem: soNguyen(v.kinhNghiem, 0, 9999, 0),
      chuoi: soNguyen(v.chuoi, -50, 50, 0),
    }
  }
  return {
    sbd: chuoi(o.sbd).trim().slice(0, 40),
    biDanh: chuoi(o.biDanh).slice(0, 60),
    he: chuoi(o.he).slice(0, 20),
    nop,
    vaoLuc: chuoi(o.vaoLuc).slice(0, 40) || NAY(),
  }
}

async function layPhong(env: Env, ma: string): Promise<{ hang: Record<string, unknown>; phong: PhongLuu } | null> {
  const r = await env.DB.prepare(
    'SELECT ma, chu_sbd, trang_thai, vong, du_lieu_json, tao_luc, cap_nhat_luc FROM vo_dai_phong WHERE ma = ?',
  ).bind(ma).first<Record<string, unknown>>()
  if (!r) return null
  return { hang: r, phong: docPhong(chuoi(r.du_lieu_json)) }
}

async function ghiPhong(
  env: Env, ma: string, trangThai: string, vong: number, phong: PhongLuu,
): Promise<void> {
  await env.DB.prepare(
    `UPDATE vo_dai_phong SET trang_thai = ?, vong = ?, du_lieu_json = ?, cap_nhat_luc = ? WHERE ma = ?`,
  ).bind(trangThai, vong, JSON.stringify(phong), NAY(), ma).run()
}

/** MỞ PHÒNG. Trả về mã bốn ký tự để em đọc cho bạn, hoặc gửi lời mời. */
export async function voDaiTao(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  const biDanh = chuoi(b.biDanh).slice(0, 60) || 'Thần thú ẩn danh'
  const he = chuoi(b.he).slice(0, 20)

  // Một em chỉ giữ MỘT phòng đang mở. Mở phòng mới thì đóng phòng cũ, không
  // để rác phòng trống chất đống.
  await env.DB.prepare(
    `UPDATE vo_dai_phong SET trang_thai = 'xong', cap_nhat_luc = ?
     WHERE chu_sbd = ? AND trang_thai <> 'xong'`,
  ).bind(NAY(), sbd).run()

  let ma = ''
  for (let i = 0; i < 12; i++) {
    const thu = maMoi()
    const co = await env.DB.prepare('SELECT ma FROM vo_dai_phong WHERE ma = ?').bind(thu).first()
    if (!co) { ma = thu; break }
  }
  if (ma === '') return { ok: false, error: 'Máy chủ đang bận, thử lại' }

  const luc = NAY()
  const phong: PhongLuu = { nguoi: [{ sbd, biDanh, he, nop: {}, vaoLuc: luc }] }
  await env.DB.prepare(
    `INSERT INTO vo_dai_phong (ma, chu_sbd, trang_thai, vong, du_lieu_json, tao_luc, cap_nhat_luc)
     VALUES (?,?,'cho',0,?,?,?)`,
  ).bind(ma, sbd, JSON.stringify(phong), luc, luc).run()
  return { ok: true, ma }
}

/** MỜI theo số báo danh — đúng "chọn cửa mời số báo danh" thầy chốt. */
export async function voDaiMoi(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  const ma = chuoi(b.ma).trim().toUpperCase()
  const ds = (Array.isArray(b.dsSbd) ? b.dsSbd : []).map((x) => chuoi(x).trim()).filter((x) => x !== '')
  if (!sbd || !ma) return { ok: false, error: 'Thiếu số báo danh hoặc mã phòng' }
  const p = await layPhong(env, ma)
  if (p === null) return { ok: false, error: 'Không có phòng này' }
  if (chuoi(p.hang.chu_sbd) !== sbd) return { ok: false, error: 'Chỉ chủ phòng mới mời được' }
  if (chuoi(p.hang.trang_thai) !== 'cho') return { ok: false, error: 'Phòng đã vào trận' }

  const luc = NAY()
  let daMoi = 0
  for (const x of ds.slice(0, 20)) {
    if (x === sbd) continue
    await env.DB.prepare(
      `INSERT INTO vo_dai_moi (sbd, ma, moi_luc) VALUES (?,?,?)
       ON CONFLICT(sbd, ma) DO UPDATE SET moi_luc = excluded.moi_luc`,
    ).bind(x, ma, luc).run()
    daMoi += 1
  }
  return { ok: true, daMoi }
}

/** LỜI MỜI của em — chỉ những phòng còn đang chờ và chưa quá hạn. */
export async function voDaiLoiMoi(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  const han = new Date(Date.now() - HAN_PHONG_GIO * 3600_000).toISOString()
  const r = await env.DB.prepare(
    `SELECT m.ma AS ma, p.du_lieu_json AS du_lieu_json, p.trang_thai AS trang_thai, m.moi_luc AS moi_luc
     FROM vo_dai_moi m JOIN vo_dai_phong p ON p.ma = m.ma
     WHERE m.sbd = ? AND p.trang_thai = 'cho' AND p.cap_nhat_luc > ?
     ORDER BY m.moi_luc DESC LIMIT 10`,
  ).bind(sbd, han).all<Record<string, unknown>>()
  const ds = (r.results ?? []).map((x) => {
    const ph = docPhong(chuoi(x.du_lieu_json))
    return {
      ma: chuoi(x.ma),
      soNguoi: ph.nguoi.length,
      chuBiDanh: ph.nguoi[0]?.biDanh ?? '',
      moiLuc: chuoi(x.moi_luc),
    }
  })
  return { ok: true, ds }
}

/** VÀO PHÒNG bằng mã. Đủ sáu người hoặc đã vào trận thì không vào được nữa. */
export async function voDaiVao(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  const ma = chuoi(b.ma).trim().toUpperCase()
  if (!sbd || !ma) return { ok: false, error: 'Thiếu số báo danh hoặc mã phòng' }
  const p = await layPhong(env, ma)
  if (p === null) return { ok: false, error: 'Không có phòng này' }
  const trangThai = chuoi(p.hang.trang_thai)
  const daCo = p.phong.nguoi.some((n) => n.sbd === sbd)
  if (!daCo && trangThai !== 'cho') return { ok: false, error: 'Phòng đã vào trận, không thêm người được' }
  if (!daCo && p.phong.nguoi.length >= SO_NGUOI_TOI_DA) {
    return { ok: false, error: `Phòng đã đủ ${SO_NGUOI_TOI_DA} người` }
  }
  if (!daCo) {
    p.phong.nguoi.push({
      sbd,
      biDanh: chuoi(b.biDanh).slice(0, 60) || 'Thần thú ẩn danh',
      he: chuoi(b.he).slice(0, 20),
      nop: {},
      vaoLuc: NAY(),
    })
    await ghiPhong(env, ma, trangThai, soNguyen(p.hang.vong, 0, 999, 0), p.phong)
  }
  return { ok: true, ma }
}

/** CHỦ PHÒNG bấm bắt đầu. Ghế trống để máy lấp — luật ấy nằm ở máy em. */
export async function voDaiBatDau(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  const ma = chuoi(b.ma).trim().toUpperCase()
  const p = await layPhong(env, ma)
  if (p === null) return { ok: false, error: 'Không có phòng này' }
  if (chuoi(p.hang.chu_sbd) !== sbd) return { ok: false, error: 'Chỉ chủ phòng mới bắt đầu được' }
  await ghiPhong(env, ma, 'dang_choi', 1, p.phong)
  return { ok: true, ma, vong: 1 }
}

/**
 * XEM PHÒNG. KHÔNG trả số báo danh của người khác — chỉ biệt danh.
 *
 * `laMinh` cho máy em biết dòng nào là của chính em. `khoa` là chỉ số chỗ ngồi,
 * đủ để máy em ghép trận mà không lộ ai là ai.
 */
export async function voDaiXem(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  const ma = chuoi(b.ma).trim().toUpperCase()
  const p = await layPhong(env, ma)
  if (p === null) return { ok: false, error: 'Không có phòng này' }
  return {
    ok: true,
    phong: {
      ma,
      trangThai: chuoi(p.hang.trang_thai),
      vong: soNguyen(p.hang.vong, 0, 999, 0),
      laChu: chuoi(p.hang.chu_sbd) === sbd,
      nguoi: p.phong.nguoi.map((n, i) => ({
        khoa: `G${i + 1}`,
        biDanh: n.biDanh,
        he: n.he,
        laMinh: n.sbd === sbd,
        // Chỉ NHỮNG VÒNG ĐÃ NỘP, không kèm số báo danh.
        nop: n.nop,
      })),
    },
  }
}

/** NỘP đội hình của em cho một vòng. Nộp lại cùng vòng thì ghi đè. */
export async function voDaiNop(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  const ma = chuoi(b.ma).trim().toUpperCase()
  const vong = soNguyen(b.vong, 1, 999, 1)
  const p = await layPhong(env, ma)
  if (p === null) return { ok: false, error: 'Không có phòng này' }
  const toi = p.phong.nguoi.find((n) => n.sbd === sbd)
  if (toi === undefined) return { ok: false, error: 'Em không ở trong phòng này' }

  const mot = locNguoi({ sbd, biDanh: toi.biDanh, he: toi.he, nop: { [String(vong)]: b.nop } })
  toi.nop[String(vong)] = mot.nop[String(vong)]!
  const vongPhong = Math.max(soNguyen(p.hang.vong, 0, 999, 0), vong)
  await ghiPhong(env, ma, chuoi(p.hang.trang_thai), vongPhong, p.phong)

  const daNop = p.phong.nguoi.filter((n) => n.nop[String(vong)] !== undefined).length
  return { ok: true, daNop, tongNguoi: p.phong.nguoi.length }
}

/** ĐÓNG PHÒNG — chủ phòng bấm, hoặc máy em báo ván đã xong. */
export async function voDaiDong(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  const ma = chuoi(b.ma).trim().toUpperCase()
  const p = await layPhong(env, ma)
  if (p === null) return { ok: false, error: 'Không có phòng này' }
  if (chuoi(p.hang.chu_sbd) !== sbd) return { ok: false, error: 'Chỉ chủ phòng mới đóng được' }
  await ghiPhong(env, ma, 'xong', soNguyen(p.hang.vong, 0, 999, 0), p.phong)
  return { ok: true }
}
