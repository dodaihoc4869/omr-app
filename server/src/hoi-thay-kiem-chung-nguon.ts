// Câu kiểm Hỏi thầy: chỉ nguồn đã kiểm duyệt, đúng bản gốc. Không sinh/chấm bằng AI.
import type { Env } from './kieu'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { docHocLieu } from './chua-cau-sai-hoc-lieu'
import type { ProbeRef } from './chua-cau-sai-kieu'
import { docBoTro } from './cau-bo-tro'
import { docCauKhoHienTai, docYDs } from './cau-y-ds'
import { apSongSinh } from './song-sinh-game'
import { apYDsMoi, nhomYDs } from './ban-khac-ao'
import { soOPhanIII } from '../../src/lib/so-o-tra-loi-ngan'

export interface CauKiemHoiThay {
  q: PrivateQuestion
  khoa: string
  /** Băm bản kho gốc, chỉ để nối hàng soạn. Không xuống máy em. */
  bamGoc?: string
  nguon: 'hoc_lieu' | 'song_sinh' | 'y_moi'
}
export async function bamKiemHoiThay(v: unknown): Promise<string> {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(v)))
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')
}
function noiDungChuan(q: PrivateQuestion) {
  const chu = (s: string) => s.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase()
  return [q.phan, chu(q.text), (q.choices ?? []).map(chu), (q.ideas ?? []).map(chu), (q.table ?? []).map(r => r.map(chu)),
    (q.hinhAnh ?? []).filter(h => h.viTri !== 'sau_loi_giai').map(h => [h.src, h.viTri]), q.thanCauImg ?? '', q.imageDataUrl ?? '', q.choiceImgs ?? [], q.ideaImgs ?? []]
}
/** Whitelist độc lập: trường lạ, đáp án, lời giải, dấu duyệt và tham chiếu riêng không lọt ra. */
export function congKhaiKiemHoiThay(q: PrivateQuestion) {
  const soO = q.phan === 'III' ? soOPhanIII(q.correct) : null
  return {
    qid: q.qid, phan: q.phan, text: q.text,
    ...(q.choices?.length ? { choices: q.choices } : {}),
    ...(q.ideas?.length ? { ideas: q.ideas } : {}),
    ...(q.table ? { table: q.table } : {}),
    ...(q.thanCauImg ? { thanCauImg: q.thanCauImg } : {}),
    ...(q.imageDataUrl ? { imageDataUrl: q.imageDataUrl } : {}),
    ...(q.choiceImgs ? { choiceImgs: q.choiceImgs } : {}),
    ...(q.ideaImgs ? { ideaImgs: q.ideaImgs } : {}),
    hinhAnh: (q.hinhAnh ?? []).filter(h => /^(sau_de|cuoi_cau|sau_pa_[ABCD]|sau_y_[abcd])$/.test(h.viTri))
      .map(h => ({ src: h.src, viTri: h.viTri, ...(h.alt ? { alt: h.alt } : {}) })),
    ...(soO !== null ? { soO } : {}),
  }
}
function tuProbe(goc: PrivateQuestion, p: ProbeRef): PrivateQuestion | null {
  const n = p.noiDungTrucTiep
  if (!p.laTuongDuong || !n?.hoi?.trim() || !n.dapAn?.trim() || !p.phienBan || !p.qid || p.qid.length > 120) return null
  const phan = p.phan
  if (phan !== 'I' && phan !== 'II' && phan !== 'III') return null
  // Một câu đầy đủ, không biến câu hỏi lý do/chẩn đoán ngắn thành chứng cứ cả bài.
  if (phan === 'I' && (n.kieu !== 'chon' || !/^[A-D]$/.test(n.dapAn) || !['A', 'B', 'C', 'D'].every(k => n.luaChon?.some(x => x.ky === k && x.noi.trim())))) return null
  if (phan === 'II' && (n.kieu !== 'ds' || n.y?.length !== 4 || !/^[DS]{4}$/.test(n.dapAn))) return null
  if (phan === 'III' && (n.kieu !== 'so' || soOPhanIII(n.dapAn) === null)) return null
  return {
    ...goc, qid: p.qid, phan, text: n.hoi, correct: n.dapAn,
    choices: phan === 'I' ? ['A', 'B', 'C', 'D'].map(k => n.luaChon!.find(x => x.ky === k)!.noi) : [],
    ideas: phan === 'II' ? [...n.y!] : [], table: n.bang,
    thanCauImg: undefined, imageDataUrl: undefined, choiceImgs: undefined, ideaImgs: undefined,
    hinhAnh: (n.hinhAnh ?? []).filter(h => h.viTri !== 'sau_loi_giai'),
    version: p.phienBan, solution: null, reviewed: true,
  }
}

/** Nhiều nhất vài bản của đúng MỘT gốc; không chọn kho toàn lớp và không dựng toàn hồ sơ em. */
export async function docNguonKiemHoiThay(env: Env, goc: PrivateQuestion, daDung: ReadonlySet<string> = new Set(), khoaCanKiem?: string): Promise<{ cau: CauKiemHoiThay[]; bamGoc?: string }> {
  const h = await docHocLieu(env, goc.qid).catch(() => null)
  const cau: CauKiemHoiThay[] = []
  const noiDungGoc = await bamKiemHoiThay(noiDungChuan(goc))
  const them = async (q: PrivateQuestion, nguon: CauKiemHoiThay['nguon'], bamGoc?: string) => {
    const noiDung = await bamKiemHoiThay(noiDungChuan(q))
    if (noiDung === noiDungGoc) return // Cờ tương đương không biến nguyên văn câu gốc thành một bản mới.
    const khoa = await bamKiemHoiThay([noiDung, q.correct])
    if (cau.some(c => c.khoa === khoa)) return
    // Probe nhúng thường chỉ tên "kiem1" trong học liệu của từng gốc. Không để trùng ID
    // của bài khác hoặc mượn ma trận Q của một câu kho tình cờ cùng tên.
    if (nguon === 'hoc_lieu') q.qid = `hk:${(await bamKiemHoiThay([goc.qid, q.qid])).slice(0, 40)}`
    // Phiên bản RIÊNG của bản kiểm, không mượn phiên bản câu gốc để chứng minh bản khác.
    q.version = await bamKiemHoiThay([goc.version, q.version, khoa])
    cau.push({ q, khoa, nguon, ...(bamGoc ? { bamGoc } : {}) })
  }
  if (h?.duDung && h.hocLieu?.contentVersion === goc.version) {
    for (const p of [...h.hocLieu.banGhepBai, ...h.hocLieu.banKiemChung].slice(0, 16)) {
      const q = tuProbe(goc, p)
      if (q) await them(q, 'hoc_lieu')
    }
  }
  // Đã có bản cần dùng trong học liệu đúng phiên bản: không đọc lại R2, hồ sơ và
  // kho bổ trợ chỉ để lấy những bản dự phòng chưa cần tới.
  if (cau.some(c => khoaCanKiem ? c.khoa === khoaCanKiem : !daDung.has(c.khoa))) return { cau }
  // Băm kho được tính lại từ chính R2 hiện tại. Không dùng học liệu cũ của câu vừa sửa.
  const ht = await docCauKhoHienTai(env, goc.qid).catch(() => null)
  if (!ht || ht.c.dapAn !== goc.correct || ht.c.de.trim() !== goc.text.trim()) return { cau }
  const duyet = await env.DB.prepare(`SELECT 1 AS co FROM loi_giai WHERE bam=? AND (trang_thai='da_duyet' OR (trang_thai='cho_duyet' AND so_co_dap_an=0))`)
    .bind(ht.bam).first().catch(() => null)
  if (!duyet) return { cau, bamGoc: ht.bam }
  if (goc.phan === 'II') {
    const ys = (await docYDs(env, [ht.bam])).get(ht.bam) ?? []
    for (let k = 0; k < Math.min(6, Math.floor(ys.length / 4)); k++) {
      const nhom = nhomYDs(ys, k)
      const q = nhom ? apYDsMoi(goc, `${goc.qid}~yd${k}`, nhom) : null
      if (q) await them(q, 'y_moi', ht.bam)
    }
  } else {
    const bt = (await docBoTro(env, [ht.bam])).get(ht.bam)
    for (const [i, ss] of (bt?.songSinh ?? []).slice(0, 4).entries()) {
      const q = apSongSinh(goc, ss, i)
      if (q) await them(q, 'song_sinh', ht.bam)
    }
  }
  return { cau, bamGoc: ht.bam }
}

/** Thiếu nguồn: nối vào hàng soạn sẵn có bằng một băm, không quét sổ cả trung tâm. */
export async function xepSoanKiemHoiThay(env: Env, q: PrivateQuestion, bam: string | undefined, now: number): Promise<boolean> {
  if (!bam) return false
  const iso = new Date(now).toISOString()
  const r = await env.DB.prepare(`INSERT INTO may_soan_viec(bam,qid,ma_de,dang,lop,bo,so_em_sai,thieu,uu_tien,trang_thai,so_lan,tao_luc,cap_nhat_luc)
    SELECT ?,l.qid,l.ma_de,l.dang,l.lop,l.bo,1,'mot_phan',1000,'cho',0,?,? FROM loi_giai_cau l WHERE l.qid=? AND l.bam=?
    ON CONFLICT(bam) DO UPDATE SET trang_thai='cho',thieu='mot_phan',uu_tien=MAX(may_soan_viec.uu_tien,1000),cap_nhat_luc=excluded.cap_nhat_luc
    WHERE may_soan_viec.trang_thai IN ('cho','xong')`).bind(bam, iso, iso, q.qid, bam).run()
  return r.meta.changes > 0
}
