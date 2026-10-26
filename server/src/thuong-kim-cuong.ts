// THỬ THÁCH KIM CƯƠNG (thưởng phạt 26/10 — LUAT-THUONG-PHAT.md «Thử thách Kim cương», DAC-TA §4.4). Tự chọn:
//   · mở khi chuyên đề đạt mức thành thạo theo Hành trình (bảng mức kỹ năng `hanh_trinh_v5_muc`: ≥ 80 % kỹ năng ĐÃ ĐO của chuyên đề ở trạng thái «vững»);
//   · 10 câu KHÓ của chuyên đề (laCauKho), 3 «ống nghiệm»: sai mỗi câu vỡ 1 ống, vỡ đủ 3 là trượt ⇒ khoá 24 giờ; bỏ dở quá hạn lượt (2 giờ) cũng tính là trượt;
//   · thưởng +40 tinh thể (một lần mỗi chuyên đề), huy hiệu `kc|<chuyên đề>`.
// ĐÁP ÁN KHÔNG XUỐNG MÁY: câu trả về qua `publicQuestion` (bỏ correct / solution). Nộp qua lệnh `answer` sẵn có (game-v2.ts) với `session = phien`.
// Phiên = một dòng `game_v2_session` (cờ `kimCuong`, KHÔNG `hocTap` ⇒ không bị Gói 7 nhận nhầm là chặng đang mở) + một dòng `kim_cuong_phien`.
import type { Env } from './kieu'
import { gameIdentityHaiBuoc } from './game-v2-auth'
import { docCauTheoRef, docKhoiEm, protectedQuestions } from './game-v2-bank'
import { readGameScope } from './game-v2-reports'
import { chanKhacKhoiEm } from './chan-khac-khoi'
import { laCauTuLuan } from './cam-tu-luan'
import { chuyenDeTuDang, TIEN_QUYET_CHUYEN_DE } from './hanh-trinh-chuyen-de'
import { publicQuestion, type PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { congTacTuDong, KC_KHOA_MS, KC_ONG, KC_SO_CAU, laCauKho, ngayVnTt, trangThaiKimCuong } from './thuong-luat'
import { lenhDocCongTac } from './thuong-d1'

type Dong = Record<string, unknown>
/** Hạn một lượt game (game-v2.ts `answer`: quá 2 giờ ⇒ «Lượt học đã hết hạn»). */
export const KC_HAN_LUOT_MS = 2 * 3_600_000
/** Tỉ lệ kỹ năng «vững» tối thiểu của chuyên đề để mở thử thách. */
export const KC_TI_LE_VUNG = 0.8

/** Một mục kết quả đã lưu trong JSON phiên (`$.nt`, game-v2.ts) — chỉ cần `d` (đúng) để đếm ống. */
export const ketQuaTuNt = (nt: unknown): boolean[] => (Array.isArray(nt) ? nt.map((x) => !!x && typeof x === 'object' && (x as { d?: unknown }).d === 1) : [])

/** Chuyên đề đã thành thạo theo mức kỹ năng Hành trình. Hàm thuần. */
export function chuyenDeThanhThao(mucJson: unknown, cd: string): boolean {
  let rows: unknown[] = []
  try { const r = typeof mucJson === 'string' ? JSON.parse(mucJson) : mucJson; rows = Array.isArray(r) ? r : [] } catch { rows = [] }
  const cua = rows.filter((r): r is { vkn: string; trangThai: string } => !!r && typeof (r as { vkn?: unknown }).vkn === 'string' && chuyenDeTuDang((r as { vkn: string }).vkn) === cd)
    .filter((r) => r.trangThai === 'vung' || r.trangThai === 'chua_vung')
  if (!cua.length) return false
  return cua.filter((r) => r.trangThai === 'vung').length / cua.length >= KC_TI_LE_VUNG
}

/** Trộn có hạt giống (cùng em + ngày + chuyên đề ⇒ cùng bộ câu). */
function tronCoHat<T>(ds: T[], hat: string): T[] {
  let h = 2166136261
  for (let i = 0; i < hat.length; i++) { h ^= hat.charCodeAt(i); h = Math.imul(h, 16777619) }
  let a = h >>> 0
  const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const ra = [...ds]
  for (let i = ra.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ra[i], ra[j]] = [ra[j]!, ra[i]!] }
  return ra
}

const SQL_UNG_VIEN = `SELECT q.ma_de, q.qid, q.version, q.content_group, q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de
  JOIN game_v2_index g ON g.ma_de = q.ma_de AND g.source_version = d.cap_nhat_luc
  WHERE COALESCE(d.da_xoa, 0) = 0 AND (q.dang LIKE ? OR q.dang LIKE ?) LIMIT 400`

/** POST /hs/kim-cuong/bat-dau {chuyenDe} → {ok, phien, cau: Question[10] (KHÔNG đáp án), ong: 3}. Lượt đang dở (chưa quá hạn) ⇒ trả lại đúng lượt ấy. */
export async function hsKimCuongBatDau(env: Env, b: Dong, nowMs: number = Date.now()): Promise<Dong> {
  const { sbd: sbdKy, xong } = await gameIdentityHaiBuoc(env, b)
  const cd = String(b.chuyenDe ?? '').trim().toUpperCase()
  if (!Object.hasOwn(TIEN_QUYET_CHUYEN_DE, cd)) return { ok: false, error: 'Em chọn một chuyên đề trên Lộ trình nhé.' }
  // MỘT lô đọc (cùng đợt lượt kiểm mật khẩu): công tắc · lượt gần nhất của chuyên đề + JSON phiên · mức kỹ năng · câu ứng viên.
  const lo = env.DB.batch([
    lenhDocCongTac(env),
    env.DB.prepare(`SELECT k.id, k.tao_luc, k.xong_luc, k.ket_qua, k.ong_con, s.json FROM kim_cuong_phien k LEFT JOIN game_v2_session s ON s.id = k.id AND s.sbd = k.em
        WHERE k.em = ? AND k.chuyen_de = ? ORDER BY k.tao_luc DESC LIMIT 1`).bind(sbdKy, cd),
    env.DB.prepare('SELECT muc_json FROM hanh_trinh_v5_muc WHERE sbd = ? ORDER BY cap_nhat_luc DESC LIMIT 1').bind(sbdKy),
    env.DB.prepare(SQL_UNG_VIEN).bind(`${cd}.%`, `dang:${cd}.%`),
  ])
  const phu = Promise.all([protectedQuestions(env), readGameScope(env, sbdKy), docKhoiEm(env, sbdKy).catch(() => null)])
  lo.catch(() => {})
  phu.catch(() => {})
  const sbd = await xong
  const kq = await lo
  if (congTacTuDong((kq[0]?.results ?? []) as { khoa: unknown; gia_tri: unknown }[]).thuong_kim_cuong === 'tat') return { ok: false, tat: true, error: 'Thử thách Kim cương đang tạm đóng.' }
  const cu = (kq[1]?.results?.[0] ?? null) as Dong | null
  if (cu) {
    const tao = Number(cu.tao_luc) || 0
    const dangDo = cu.ket_qua === null || cu.ket_qua === undefined
    if (dangDo && nowMs - tao < KC_HAN_LUOT_MS && cu.json) {
      // Lượt đang dở ⇒ trả lại đúng các câu đã phát (vẫn KHÔNG đáp án) + số ống còn.
      let s: { questions?: { qid: string; maDe: string; version: string }[]; nt?: unknown } = {}
      try { s = JSON.parse(String(cu.json)) } catch { s = {} }
      const cau = (await Promise.all((s.questions ?? []).map((r) => docCauTheoRef(env, r).catch(() => null)))).filter((q): q is PrivateQuestion => !!q)
      const t = trangThaiKimCuong(ketQuaTuNt(s.nt))
      if (!t.xong && cau.length) return { ok: true, phien: String(cu.id), cau: cau.map(publicQuestion), ong: t.ongCon, tiepTuc: true }
    }
    // Trượt (hoặc bỏ dở quá hạn ⇒ coi như trượt lúc hết hạn): khoá 24 giờ kể từ lúc kết thúc.
    const ketThuc = cu.ket_qua === 'truot' ? Number(cu.xong_luc) || tao : dangDo ? tao + KC_HAN_LUOT_MS : 0
    if ((cu.ket_qua === 'truot' || (dangDo && nowMs - tao >= KC_HAN_LUOT_MS)) && nowMs < ketThuc + KC_KHOA_MS) {
      return { ok: false, khoa: true, moLaiLuc: new Date(ketThuc + KC_KHOA_MS).toISOString(), error: 'Em nghỉ một chút rồi thử lại thử thách này sau 24 giờ nhé.' }
    }
  }
  if (!chuyenDeThanhThao((kq[2]?.results?.[0] as Dong | undefined)?.muc_json, cd)) {
    return { ok: false, chuaMo: true, error: 'Thử thách mở khi em đã vững chuyên đề này trên Lộ trình.' }
  }
  const [baoVe, pham, khoiEm] = await phu
  const ung: PrivateQuestion[] = []
  for (const r of (kq[3]?.results ?? []) as Dong[]) {
    let q: PrivateQuestion
    try { q = JSON.parse(String(r.json)) as PrivateQuestion } catch { continue }
    if (!q || !q.reviewed || !laCauKho(q) || laCauTuLuan(q)) continue
    if (baoVe.has(q.qid) || baoVe.has(q.group) || pham.blocked.includes(q.qid) || pham.blocked.includes(q.group)) continue
    if (pham.types.length && (!q.dang || !pham.types.includes(q.dang))) continue
    ung.push(q)
  }
  const quaKhoi = await chanKhacKhoiEm(env, 'goi7', { sbd, khoiEm }, ung)
  // Mỗi nhóm nội dung một câu (không lặp câu song sinh), trộn có hạt giống.
  const daNhom = new Set<string>()
  const chon = tronCoHat(quaKhoi, `${sbd}|${ngayVnTt(nowMs)}|${cd}|kim-cuong`).filter((q) => (daNhom.has(q.group) ? false : (daNhom.add(q.group), true))).slice(0, KC_SO_CAU)
  if (chon.length < KC_SO_CAU) return { ok: false, thieuCau: true, error: 'Chuyên đề này chưa đủ câu khó cho thử thách. Thầy sẽ bổ sung sớm.' }
  const phien = crypto.randomUUID()
  const refs = chon.map((q) => ({ qid: q.qid, maDe: q.maDe, version: q.version, group: q.group, novel: false, role: 'kim_cuong' }))
  await env.DB.batch([
    env.DB.prepare('INSERT INTO game_v2_session(id, sbd, json, created_at) VALUES (?, ?, ?, ?)')
      .bind(phien, sbd, JSON.stringify({ mode: 'adventure', created: nowMs, kimCuong: 1, kc: cd, questions: refs }), new Date(nowMs).toISOString()),
    env.DB.prepare('INSERT INTO kim_cuong_phien(id, em, chuyen_de, tao_luc, ong_con) VALUES (?, ?, ?, ?, ?)').bind(phien, sbd, cd, nowMs, KC_ONG),
  ])
  return { ok: true, phien, cau: chon.map(publicQuestion), ong: KC_ONG }
}
