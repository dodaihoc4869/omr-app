// CÂU SONG SINH TRONG GAME — Vòng học khép kín v2. Câu sai được làm lại bằng câu SONG SINH (cùng cách giải, đổi số) để em không làm lại
// theo trí nhớ đáp án. Song sinh không có dòng riêng trong kho game: qid ảo "<gốc>~ss0|1" ⇒ nạp câu gốc rồi PHỦ đề / phương án / đáp án /
// lời giải của song sinh (bảng `cau_bo_tro`). Đáp án chỉ nằm ở máy chủ như câu thường (`publicQuestion` bỏ `correct`, `solution`).
import type { Env } from './kieu'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { dongBoTro, docBangSongSinh, songSinhDuDuLieu, type BoTro, type SongSinh } from './cau-bo-tro'
import { tachSongSinh } from './loi-hoc-luat'

type Obj = Record<string, unknown>

/** qid ảo của song sinh thứ i (0|1). */
export const qidSongSinh = (goc: string, i: number) => `${goc}~ss${i}`

/** Phủ song sinh lên câu gốc. Chỉ Phần I (4 phương án) và Phần III (số); Phần II / song sinh thiếu dữ liệu ⇒ null. */
export function apSongSinh(q: PrivateQuestion, ss: SongSinh, i: number): PrivateQuestion | null {
  if (!songSinhDuDuLieu(q.phan, ss)) return null
  if (q.phan === 'II') return null
  if (q.phan === 'I') {
    const pa = ss.pa ?? {}
    const choices = ['A', 'B', 'C', 'D'].map((k) => String(pa[k] ?? '').trim())
    if (choices.some((x) => !x) || !/^[ABCD]$/.test(ss.dap_an.trim())) return null
    return phu(q, ss, i, { choices, correct: ss.dap_an.trim() })
  }
  if (!/^-?\d+(,\d+)?$/.test(ss.dap_an.trim())) return null
  return phu(q, ss, i, { choices: [], correct: ss.dap_an.trim() })
}

function phu(q: PrivateQuestion, ss: SongSinh, i: number, them: { choices: string[]; correct: string }): PrivateQuestion {
  const lg = (q.solution && typeof q.solution === 'object' ? q.solution : {}) as Obj
  return {
    ...q,
    qid: qidSongSinh(tachSongSinh(q.qid).goc, i),
    text: ss.de,
    choices: them.choices,
    correct: them.correct,
    // Giữ bảng/ảnh CỦA SONG SINH; tuyệt đối không trộn dữ kiện của câu gốc đã đổi số.
    table: docBangSongSinh(ss.bang), thanCauImg: undefined, imageDataUrl: undefined, choiceImgs: undefined, ideaImgs: undefined,
    hinhAnh: (ss.hinh ?? []).filter(h => /^(sau_de|cuoi_cau|sau_pa_[ABCD]|sau_y_[abcd])$/.test(h.vi_tri))
      .map(h => ({ src: h.du_lieu, viTri: h.vi_tri })),
    solution: { chot: typeof lg.chot === 'string' ? lg.chot : '', buoc: ss.buoc ?? [], ket_qua: ss.dap_an, dap_an_de: them.correct, song_sinh: true },
  }
}

/** Học liệu bổ trợ theo qid câu gốc (qid → băm qua `loi_giai_cau`). */
export async function boTroTheoQid(env: Env, qids: readonly string[]): Promise<Map<string, BoTro>> {
  const ra = new Map<string, BoTro>()
  const ds = [...new Set(qids.filter(Boolean))]
  if (!ds.length) return ra
  // MỘT truy vấn (JOIN qid → băm → học liệu), không tạo bảng trên đường đọc: kế hoạch ngày có ngân sách vòng D1 (do-toi-uu-may-chu-2809).
  // Bảng chưa có (chưa nạp học liệu lần nào) ⇒ lỗi ⇒ rỗng.
  const r = await env.DB.prepare(`SELECT lc.qid AS qid_hoi, b.* FROM loi_giai_cau lc JOIN cau_bo_tro b ON b.bam = lc.bam WHERE lc.qid IN (SELECT value FROM json_each(?))`)
    .bind(JSON.stringify(ds)).all<Obj>().catch(() => ({ results: [] as Obj[] }))
  for (const x of r.results ?? []) ra.set(String(x.qid_hoi), dongBoTro(x))
  return ra
}

/** Câu gốc (đã nạp) → câu song sinh theo qid ảo đã yêu cầu; không có song sinh ⇒ null. */
export async function phuSongSinhTheoQid(env: Env, goc: PrivateQuestion, qidAo: string): Promise<PrivateQuestion | null> {
  const t = tachSongSinh(qidAo)
  if (t.songSinh === null) return goc
  const bt = (await boTroTheoQid(env, [t.goc])).get(t.goc)
  const ss = bt?.songSinh[t.songSinh]
  return ss ? apSongSinh(goc, ss, t.songSinh) : null
}
