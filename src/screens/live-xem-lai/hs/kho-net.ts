// XEM LẠI LIVE — KHO NÉT: tải `net.bin` THEO KHÚC giữa hai mốc «bảng mới» (`BuoiLiveJson.mocBang`, đặc tả mục 4.9 «tua»). Không DOM.
// Mỗi khúc `[moc[i].byte, moc[i+1].byte)` bắt đầu đúng đầu một bản ghi ⇒ giải độc lập (`docNetBin`); tải một lần rồi nhớ.
// Tua tới `t`: lấy khúc của mốc gần nhất phía trước. Mốc là «xoá hết» (bản ghi đầu không phải «bảng mới» ⇒ không mang khoá trang + tỉ lệ) thì lùi tiếp tới
// mốc «bảng mới» gần nhất — các nét ở giữa bị chính lệnh xoá ấy dọn khi dựng lại, nên bảng vẫn đúng.
// Máy chủ trả 200 kèm CẢ tệp (không nhận Range) ⇒ giữ cả tệp, các khúc sau cắt tại chỗ, không tải lại.
import { docNetBin } from '../../../lib/live/xem-lai-kieu'
import { giaiMuc, type MucPhat } from './may-phat'

export interface MocBang { t: number; byte: number }
export interface KhucTai { status: number; b: Uint8Array }

export function taoKhoNet(o: { byteNet: number; moc: readonly MocBang[]; tai: (tu: number, den: number) => Promise<KhucTai> }) {
  const byteNet = Math.max(0, Math.floor(o.byteNet))
  const moc: MocBang[] = [{ t: 0, byte: 0 }]
  for (const m of o.moc.slice().sort((a, b) => a.byte - b.byte)) {
    const c = moc[moc.length - 1]!
    if (m && m.byte > c.byte && m.byte < byteNet && m.t >= c.t) moc.push({ t: m.t, byte: m.byte })
  }
  let caTep: Uint8Array | null = null
  const nho = new Map<number, Promise<MucPhat[]>>()

  async function taiKhuc(i: number): Promise<MucPhat[]> {
    const tu = moc[i]!.byte, den = i + 1 < moc.length ? moc[i + 1]!.byte : byteNet
    if (den <= tu) return []
    if (!caTep) {
      const r = await o.tai(tu, den)
      // 206 = đúng khúc xin. 200 mà dài hơn khúc xin = máy chủ trả cả tệp.
      if (r.status === 200 && r.b.length > den - tu) caTep = r.b
      else return giaiMuc(docNetBin(r.b.length > den - tu ? r.b.subarray(0, den - tu) : r.b).muc)
    }
    return giaiMuc(docNetBin(caTep.subarray(tu, Math.min(den, caTep.length))).muc)
  }
  /** Các mục của khúc thứ `i`. Tải hỏng ⇒ ném lỗi của `tai` và KHÔNG nhớ (lần sau thử lại). */
  function khuc(i: number): Promise<MucPhat[]> {
    let h = nho.get(i)
    if (!h) { h = taiKhuc(i); nho.set(i, h); h.catch(() => { if (nho.get(i) === h) nho.delete(i) }) }
    return h
  }
  /** Chỉ số mốc gần nhất có giờ không lớn hơn `t`. */
  function chiSo(t: number): number {
    let i = 0
    while (i + 1 < moc.length && moc[i + 1]!.t <= t) i++
    return i
  }
  /** Mọi mục cần để dựng bảng tại `t`: từ mốc «bảng mới» gần nhất phía trước (`tu`) tới hết khúc chứa `t` (`den`). */
  async function napTu(t: number): Promise<{ tu: number; den: number; muc: MucPhat[] }> {
    const den = chiSo(t)
    let tu = den, muc = await khuc(den)
    while (tu > 0 && muc[0]?.k !== 'bang') { tu -= 1; muc = (await khuc(tu)).concat(muc) }
    return { tu, den, muc }
  }
  return { khuc, chiSo, napTu, soKhuc: moc.length, gioMoc: (i: number): number => (i < moc.length ? moc[i]!.t : Infinity) }
}
export type KhoNet = ReturnType<typeof taoKhoNet>
