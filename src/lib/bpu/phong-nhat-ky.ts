// XEM LẠI LIVE — NHẬT KÝ CỦA PHÒNG, PHẦN THUẦN (thầy chốt build 11/11; đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.3, 4.7). KHÔNG mạng, KHÔNG đồng hồ.
// Phòng Bình Phản Ứng không phải sửa luật lượt: sau MỖI lần trạng thái đổi, máy chủ gọi `soVet(st, vết cũ, nay)` — hàm so «dấu vết» (đang live? lượt nào,
// pha nào, gọi ai, chấm chưa, bảng live, mic em) với lần trước rồi trả các DÒNG SỰ KIỆN mới (mở câu, gọi lên bảng, chấm, mở đáp án, lượt mới / bỏ lượt,
// bảng live bật / tắt, mic em bật / tắt, live bật / tắt). Nhật ký chỉ-nối; máy chủ (server/src/live-xem-lai.ts) ghi gom 1 giây.
// AN TOÀN: sự kiện không mang đáp án. Ảnh chụp lượt CÓ đáp án + lời giải (`chupLuot`) CHỈ tạo ở lúc lượt chuyển sang pha «mo».
// 11/11 (thầy chữa trên bảng mà không bấm mở đáp án ⇒ «kết thúc live chưa thấy có bản ghi»): lượt CHƯA mở đáp án nhưng đã gọi em lên bảng / bảng live đang bật
// ⇒ ảnh chụp KÍN (`chupKin`: đề công khai + tỉ lệ lớp + ai lên bảng; KHÔNG đáp án, KHÔNG lời giải), làm mới mỗi khi số em gửi / số em đúng / em lên bảng đổi.
import { DOI_BPU, diemDoi, soDoiCua, tenNgan, type LuotPhong, type TrangThaiPhong } from './phong'
import type { LuotChup, NetXl, SuKienXl } from '../live/xem-lai-dung'
import type { BangVangLive } from '../live/xem-lai-kieu'

/** Trạng thái ghi của máy thầy (máy ghi tự báo qua tin `live-ghi`). Phòng cất ở `st.live.ghi`; vắng = công tắc «Xem lại Live» tắt. */
export type TrangThaiGhi = 'dang-ghi' | 'loi' | 'tat'
export const laTrangThaiGhi = (v: unknown): v is TrangThaiGhi => v === 'dang-ghi' || v === 'loi' || v === 'tat'

export interface DauVet { bat: boolean; luot: string; so: number; pha: string; goi: string; dat: boolean | null; bang: boolean; mic: string; /** Dấu của ảnh chụp kín gần nhất. */ kin?: string }
export const vetRong = (): DauVet => ({ bat: false, luot: '', so: 0, pha: '', goi: '', dat: null, bang: false, mic: '' })

/** Ảnh chụp lượt lúc mở đáp án: đề công khai, đáp án, lời giải kho, tỉ lệ lớp, ai lên bảng. KHÔNG mang kết quả từng em. */
export function chupLuot(l: LuotPhong): LuotChup {
  return {
    so: l.so, bd: l.batDau, qid: l.qid, phan: l.phan, tuLuan: l.tuLuan, cau: l.cau, dung: l.dung, giai: l.giai ?? null,
    soDung: Object.values(l.ketQua ?? {}).filter((k) => k.dung).length, soGui: Object.keys(l.tra).length,
    goi: l.goi ? { sbd: l.goi.sbd, dat: l.goi.dat } : null,
  }
}

/** Ảnh chụp KÍN của lượt chưa mở đáp án đang chữa trên bảng. `ketQua` ở đây do máy chủ chấm sẵn (`NhatKyXl.soat`) chỉ để ĐẾM số em đúng. */
export function chupKin(l: LuotPhong): LuotChup {
  return { ...chupLuot(l), mo: false, dung: '', giai: null }
}

/** So dấu vết ⇒ sự kiện mới. Bật live ⇒ ghi lại cả trạng thái đang có (lượt đang mở, em đang trên bảng) để mỗi lần live tự đủ nghĩa. Không sửa `st`. */
export function soVet(st: TrangThaiPhong, cu: DauVet, nay: number): { vet: DauVet; suKien: SuKienXl[]; chup: LuotChup | null } {
  const sk: SuKienXl[] = []
  let chup: LuotChup | null = null
  const lv = st.live, bat = !!lv?.bat && !st.ketThuc
  let v = { ...cu }
  if (bat && !v.bat) { sk.push({ k: 'bat', t: nay }); v = { ...vetRong(), bat: true } }
  const l = st.luot, khoa = l ? `${l.so}:${l.batDau}` : ''
  if (khoa !== v.luot) {
    if (v.luot && v.pha !== 'mo') sk.push({ k: 'bo', t: nay, so: v.so })
    if (l) sk.push({ k: 'luot', t: nay, so: l.so, bd: l.batDau, qid: l.qid })
    v.luot = khoa; v.so = l?.so ?? 0; v.pha = l ? 'tra-loi' : ''; v.goi = ''; v.dat = null
  }
  if (l) {
    const goi = l.goi?.sbd ?? ''
    if (goi !== v.goi) { if (goi) sk.push({ k: 'goi', t: nay, so: l.so, sbd: goi }); v.goi = goi; v.dat = null }
    const dat = l.goi?.dat ?? null
    if (goi && dat != null && dat !== v.dat) sk.push({ k: 'cham', t: nay, so: l.so, sbd: goi, dat })
    v.dat = dat
    if (l.pha === 'mo' && v.pha !== 'mo') { sk.push({ k: 'mo', t: nay, so: l.so }); chup = chupLuot(l) }
    v.pha = l.pha
    // Đã từng chụp kín lượt này ⇒ tiếp tục làm mới tới khi mở đáp án / sang lượt khác (em còn gửi bài sau khi thầy tắt bảng).
    if (l.pha !== 'mo' && ((bat && (!!goi || !!lv?.bang)) || (v.kin ?? '').startsWith(`${khoa}|`))) {
      const c = chupKin(l), dau = `${khoa}|${c.soGui}|${c.soDung}|${c.goi?.sbd ?? ''}|${c.goi?.dat ?? ''}`
      if (dau !== v.kin) { v.kin = dau; chup = c }
    }
  }
  const bang = bat && !!lv?.bang
  if (bang !== v.bang) { sk.push({ k: 'bang', t: nay, v: bang }); v.bang = bang }
  const mic = bat ? (lv?.mic?.sbd ?? '') : ''
  if (mic !== v.mic) { if (v.mic) sk.push({ k: 'mic', t: nay, sbd: v.mic, v: false }); if (mic) sk.push({ k: 'mic', t: nay, sbd: mic, v: true }); v.mic = mic }
  if (!bat && v.bat) { sk.push({ k: 'tat', t: nay }); v.bat = false }
  return { vet: v, suKien: sk, chup }
}

/** Bảng vàng của buổi từ số thật của phòng lúc chốt. Chưa em nào có kJ ⇒ null. */
export function bangVangCua(st: TrangThaiPhong): BangVangLive | null {
  const doi = Array.from({ length: soDoiCua(st) }, (_, d) => ({ ten: DOI_BPU[d]?.ten ?? `Đội ${d + 1}`, kj: diemDoi(st, d) }))
  const em = st.ds.filter((e) => e.vao)
  if (!em.length || (doi.every((d) => d.kj <= 0) && em.every((e) => e.kj <= 0))) return null
  const cao = Math.max(...doi.map((d) => d.kj)), thang = doi.filter((d) => d.kj === cao)
  const top = [...em].filter((e) => e.kj > 0).sort((a, b) => b.kj - a.kj || (a.sbd < b.sbd ? -1 : 1)).slice(0, 3).map((e) => ({ ten: tenNgan(e.ten), doi: e.doi, kj: e.kj }))
  const dai = [...em].sort((a, b) => b.chuoi - a.chuoi || (a.sbd < b.sbd ? -1 : 1))[0]
  return { doi, doiThang: cao > 0 && thang.length === 1 ? doi.indexOf(thang[0]!) : null, top, chuoi: dai && dai.chuoi >= 2 ? { ten: tenNgan(dai.ten), doi: dai.doi, so: dai.chuoi } : null }
}

// ── Nhật ký nét: dãy bản ghi [loại u8][giờ phòng f64 LE][n u16 LE][khung] nối nhau, cắt MẢNH ≤ `MANH_NET_BYTE` để ghi storage ──
export const MANH_NET_BYTE = 64 * 1024
const DAU_NET = 11
export function maNetXl(r: NetXl): Uint8Array<ArrayBuffer> {
  const ra = new Uint8Array(DAU_NET + r.khung.length), dv = new DataView(ra.buffer)
  ra[0] = r.loai; dv.setFloat64(1, r.luc, true); dv.setUint16(9, r.khung.length, true)
  ra.set(r.khung, DAU_NET)
  return ra
}
/** Đọc một mảnh nhật ký nét. Bản ghi cụt ở cuối ⇒ bỏ. */
export function giaiNetXl(b: Uint8Array): NetXl[] {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength), ra: NetXl[] = []
  let o = 0
  while (o + DAU_NET <= b.length) {
    const loai = b[o]!, n = dv.getUint16(o + 9, true)
    if (loai > 2 || o + DAU_NET + n > b.length) break
    ra.push({ loai: loai as 0 | 1 | 2, luc: dv.getFloat64(o + 1, true), khung: b.slice(o + DAU_NET, o + DAU_NET + n) })
    o += DAU_NET + n
  }
  return ra
}
