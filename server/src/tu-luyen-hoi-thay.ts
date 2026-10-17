// Snapshot máy chủ của câu đã phát, kể cả bản thay số/song sinh/xáo không còn trong kho.
// Mã tiến độ khác mã nội dung: phải đối chiếu đúng chủ và đúng chỗ trong lượt.
import type { Env } from './kieu'
import { bamCau, cauTrongGoi, type CauKho } from '../../src/lib/loi-giai-kiem'
type Obj = Record<string, unknown>
const obj = (x: unknown): x is Obj => !!x && typeof x === 'object' && !Array.isArray(x)
const chu = (x: unknown) => typeof x === 'string' ? x : ''
export interface CauTuLuyenHoiThay { qid: string; c?: CauKho; bam?: string; dangLam: boolean; baoVe: string[] }
export interface NguCanhLuotTuLuyen { luotId: string; qidTrongLuot: string }

export async function cauHoiThayTuLuyen(env: Env, sbd: string, luotId: string, qid: string): Promise<CauTuLuyenHoiThay | null> {
  if (!/^tl_[a-z0-9]{6,20}$/.test(luotId)) return null
  const dong = await env.DB.prepare(`SELECT de_rieng_json, de_cong_khai_json, trang_thai,
    EXISTS(SELECT 1 FROM tu_luyen_cham_cau WHERE luot_id = ? AND sbd = ? AND qid = ?) AS da_cham
    FROM tu_luyen_luot WHERE id = ? AND sbd = ?`).bind(luotId, sbd, qid, luotId, sbd).first<Obj>()
  if (!dong) return null
  try {
    const ds: unknown = JSON.parse(chu(dong.de_rieng_json))
    if (!Array.isArray(ds)) return null
    const rieng = ds.find((v) => obj(v) && v.qid === qid) as Obj | undefined
    if (!rieng) return null
    const actual = (chu(rieng.hien) || qid).replace(/~\d+$/, '')
    const goc = (q: string) => q.replace(/(?:~(?:ss|bt|yd)?\d+|#\d+)$/, '')
    const ra: CauTuLuyenHoiThay = { qid: actual, dangLam: dong.trang_thai !== 'da_nop' && !Number(dong.da_cham), baoVe: [...new Set([goc(qid), goc(actual)])] }
    const cong: unknown = JSON.parse(chu(dong.de_cong_khai_json) || '[]')
    if (!Array.isArray(cong)) return null
    // Lượt rất cũ/fixture chưa lưu đề công khai mới được tra kho dự phòng.
    if (!cong.length) return ra
    const i = cong.findIndex((v) => obj(v) && v.qid === qid)
    const cc: unknown = cong[i]
    if (!obj(cc) || typeof cc.text !== 'string' || !['I','II','III'].includes(chu(cc.phan)) || cc.phan !== rieng.phan) return null
    const lyDo = Array.isArray(rieng.lyDo) ? rieng.lyDo.filter(obj) : []
    const tung = Object.fromEntries(lyDo.map((v) => [chu(v.khoa), { dung: v.dung === true, vi_sao: chu(v.ly) }]))
    const hinh = Array.isArray(cc.hinh) ? [...cc.hinh] : []
    if (cc.anhThanCau) hinh.push({ src: cc.anhThanCau, viTri: 'sau_de' })
    if (Array.isArray(cc.anhLuaChon)) cc.anhLuaChon.forEach((src, j) => { if (src) hinh.push({ src, viTri: cc.phan === 'II' ? `y_${'abcd'[j]}` : `pa_${'ABCD'[j]}` }) })
    const maDe = /^(.+)-(?:III|II|I)-\d+/.exec(actual)?.[1] || 'TL-snapshot'
    const [c] = cauTrongGoi(maDe, { cau: [{ qid: actual, so: String(i + 1), phan: cc.phan, text: cc.text,
      ...(cc.phan === 'II' ? { y: cc.luaChon } : { luaChon: cc.luaChon }), dapAn: rieng.dapAn, bang: cc.bang,
      dangMa: rieng.dangMa, can_chua: { sao: rieng.sao },
      loi_giai: { chot: chu(rieng.chot), buoc: rieng.buoc, ket_qua: chu(rieng.ketQua), ...(cc.phan === 'II' ? { tung_y: tung } : { tung_pa: tung }) },
    }] })
    if (!c) return null
    // Giữ cả ảnh URL đã phát, không chỉ ảnh nhúng của kho; nguồn không chứa ký tự thoát thuộc tính HTML.
    c.hinh = hinh.filter(obj).filter((h) => /^(?:data:image\/(?:png|jpe?g|gif|webp);base64,|https?:\/\/|\/)/.test(chu(h.src)) && !/["<>]/.test(chu(h.src)))
      .map((h) => ({ viTri: chu(h.viTri) || 'sau_de', duLieu: chu(h.src) }))
    ra.c = c; ra.bam = await bamCau(c)
    return ra
  } catch { return null }
}
