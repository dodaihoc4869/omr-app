// LIVE BẢNG — LUẬT PHÒNG THUẦN (thầy 10/11 «thêm chế độ live màn hình chữa bài … giọng nói phải tức thì»; đặc tả docs/dac-ta-live-bang-1011.md mục 4.3).
// CHỈ THÊM vào phòng Bình Phản Ứng: mọi trường cũ giữ nguyên, máy em / bảng bản cũ gặp trường lạ thì bỏ qua. KHÔNG đọc mạng, KHÔNG đọc đồng hồ.
// Dùng chung: Durable Object (server/src/phong-live.ts gọi các hàm này), `viewBang` / `viewEm` (phong.ts) gắn khối `live`, thư viện máy khách (src/lib/live).
// BẤT BIẾN AN TOÀN: không trường nào của `live` mang đáp án / lời giải — test tests/live-an-toan-dap-an-1011.test.ts khoá.
// ĐỢT 1A (nền): bật / tắt, sẵn sàng, công tắc buổi, ai được xem, tiếng theo điểm quyết 3, rời màn theo điểm quyết 2.
// ĐỢT 2 (11/11, đặc tả 4.8 — đàm thoại hai chiều): hàng giơ tay `tay`, lời mời `moi` (MỘT em), em không bật được mic `micLoi`, nhật ký `nk` (ai giơ tay,
// được mời, nói từ giờ nào tới giờ nào, bị thu mic — phòng rút ra kho của Durable Object, KHÔNG D1), bố cục giấy đề của thầy `giay` (máy em soi đúng giấy).
import type { TrangThaiPhong } from './phong'

/** Phiên SFU của thầy cho máy em kéo về: `id` = mã phiên, `tieng` = tên track tiếng, `kenh` = tên DataChannel điểm đang viết (null ⇒ điểm đi WebSocket). Không phải bí mật. */
export interface PhienSfuThay { id: string; tieng: string | null; kenh: string | null }

export interface MicEm { sbd: string; id: string; tieng: string; mid: string; luc: number }
/** Một dòng NHẬT KÝ ĐÀM THOẠI (đặc tả 4.8 mục 8). `k`: tay = em giơ tay · ha = em tự hạ · ha-het = thầy hạ (một em / cả hàng) · moi = thầy mời nói ·
 *  de-sau = em bấm «Để sau» · mic-loi = máy em không bật được mic · noi = em bắt đầu nói · thoi = em thôi nói (`tu` = giờ bắt đầu, `vi` = vì sao). Không ghi âm. */
export interface MucNhatKy { k: 'tay' | 'ha' | 'ha-het' | 'moi' | 'de-sau' | 'mic-loi' | 'noi' | 'thoi'; sbd: string; luc: number; tu?: number; vi?: ViThoi }
/** Vì sao em thôi nói: thay = thầy «Thu mic» · em = em bấm «Xong, tắt mic» · moi-khac = thầy mời / gọi em khác · roi = em rời màn · mat = em mất kết nối ·
 *  luot = chấm xong / mở đáp án / lượt mới · tat = tắt live, hết buổi. */
export type ViThoi = 'thay' | 'em' | 'moi-khac' | 'roi' | 'mat' | 'luot' | 'tat'
/** BỐ CỤC GIẤY ĐỀ CỦA THẦY (đặc tả rủi ro R3): `k` = khoá trang, `w` × `h` = ô giấy (px của cửa sổ thầy), `la` = giấy có khối máy em không soi được
 *  (bảng số liệu, sơ đồ thí nghiệm…), `o` = các khối: [loại, thứ tự, x, y, rộng, cao, cỡ chữ × 10, cao dòng × 10, độ đậm / 100, x cuối chữ, y cuối chữ].
 *  Loại: 0 số câu · 1 tên phần · 2 đề · 3 chữ phương án · 4 ký hiệu phương án · 5 khung phương án · 6 dòng trả lời ngắn · 7 ảnh. Chỉ là SỐ ĐO — không chữ, không đáp án. */
export interface GiayThay { k: string; w: number; h: number; la: boolean; o: number[][] }
/** `che = 'sanh'` (thầy 12/11): thầy vừa bấm Bắt đầu, CHƯA chọn chế độ ⇒ máy em ở bảng danh sách bốn đội, đã nghe được thầy. */
export interface KhoiPhong { k: number; gd: 'cho' | 'dang'; che: 'hoc' | 'bang' | 'sanh' }
/** Chuẩn hoá `khoi` máy thầy gửi; sai dạng ⇒ undefined (giữ cái đang có), null ⇒ gỡ. */
export function chuanKhoi(v: unknown): KhoiPhong | null | undefined {
  if (v === null) return null
  const x = (v ?? null) as Record<string, unknown> | null, k = Number(x?.k)
  if (!x || typeof x !== 'object' || ![10, 11, 12].includes(k)) return undefined
  return { k, gd: x.gd === 'dang' ? 'dang' : 'cho', che: x.che === 'bang' ? 'bang' : x.che === 'sanh' ? 'sanh' : 'hoc' }
}
export interface LivePhong {
  /** Công tắc `cau_hinh.live_bang` (máy chủ nạp mỗi lần thầy mở phòng). Tắt ⇒ view không có khối `live`, mọi tin `live-*` bị bỏ. */
  cho: boolean
  /** Worker đã có khoá Cloudflare Realtime SFU. Chưa ⇒ `tieng: 'chua-cau-hinh'`, live vẫn chạy phần HÌNH qua WebSocket. */
  sfu: boolean
  /** Thầy đã sẵn sàng (đã phát sẵn track câm, hoặc chỉ hình) ⇒ máy em nạp lười mảnh live, tải ngầm sổ nét, nối SFU ngầm nếu có `ss`. */
  san: boolean
  bat: boolean
  /** Giờ bật (ms). */
  tu: number | null
  /** Tăng mỗi lần bật và mỗi lần thầy đổi phiên SFU khi đang live — chống gói lạc phiên cũ. */
  phien: number
  ss: PhienSfuThay | null
  /** Hàng giơ tay (Đợt 2). */
  tay: { sbd: string; luc: number }[]
  /** Em đang PHÁT MIC (tối đa một em — em đang được gọi lên bảng, thầy 10/11 «tự động bật mic cho bạn lên bảng»). Chi tiết track ở `mic`. */
  noi: string[]
  /** BẢNG LIVE có đang hiện trên máy em không (thầy 10/11): tiếng thì giữ suốt khi `bat`; bảng chỉ hiện khi thầy gọi em lên bảng (hoặc thầy bật tay),
   *  mở lượt mới ⇒ tắt (máy em về màn câu hỏi, tiếng vẫn chạy). Phòng lưu trước bản này không có ⇒ false. */
  bang?: boolean
  /** Track mic của em đang được gọi lên bảng: phiên SFU của máy em + tên track + mid (để máy chủ đóng track khi thu mic). Chỉ máy chủ ghi (sau khi SFU nhận track). */
  mic?: MicEm | null
  /** Track mic vừa bị THU, chờ máy chủ đóng ở SFU (thu mic có hiệu lực cả khi máy em không nghe lệnh). Phòng rút hàng này mỗi lần phát view. */
  micDong?: { id: string; mid: string }[]
  /** Cho em ở xa (thuộc lớp, chưa điểm danh) vào xem — điểm quyết 4, mặc định TẮT. */
  xa: boolean
  /** Máy em TRONG LỚP có phát tiếng không — điểm quyết 3. Thầy 11/11 lần 4 («Tự động bật tiếng … cho hs khi vào live»): mặc định BẬT («Tất cả»); thầy chọn
   *  «Em ở xa» ⇒ tắt (chống dàn đồng ca lệch + hú). Em ở xa luôn mặc định bật. */
  tiengLop: boolean
  /** Thầy ĐÃ TỰ CHỌN «Em ở xa» / «Tất cả» trong buổi này (kể cả trước khi bật live) ⇒ lần bật live đầu không ghi đè lựa chọn ấy. */
  tiengChon?: boolean
  /** Số thứ tự mục cuối của sổ nét. */
  soNet: number
  /** Lần cuối thầy có dấu hiệu đang live (bật, nhịp có tiếng / có nét, nét xong) — quá `TU_TAT_LIVE_MS` ⇒ phòng tự tắt live. */
  nhip: number
  /** ĐỢT 2 — em đang được thầy MỜI NÓI (một em mỗi lúc): em này được phép bật mic tới khi nói xong / thầy thu mic / thầy mời em khác. */
  moi?: { sbd: string; luc: number } | null
  /** Em vừa không bật được mic sau khi được mời (từ chối quyền / máy lỗi) ⇒ màn chiếu ghi «chưa bật được mic». Xoá khi thầy mời tiếp / tắt live. */
  micLoi?: { sbd: string; luc: number; ly: 'tu-choi' | 'loi' } | null
  /** Em LÊN BẢNG vừa bị thầy thu mic trong lượt gọi này ⇒ máy em không tự bật lại (xoá khi gọi em khác / lượt mới). */
  camMic?: string | null
  /** Nhật ký đàm thoại CHƯA rút ra kho (phòng rút mỗi lần phát view). */
  nk?: MucNhatKy[]
  /** LIVE THEO KHỐI (12/11, docs/dac-ta-live-moi-1211.md): buổi này là live cho cả khối `k`; `gd` = `cho` (phòng chờ, em chơi Giữ Lửa) | `dang` (thầy đã bấm
   *  Bắt đầu); `che` = `hoc` (màn live như cũ) | `bang` (bảng kín màn máy em). Thầy đặt bằng `live-dat { khoi }`. Vắng ⇒ buổi trên lớp như trước. */
  khoi?: KhoiPhong | null
  /** Bố cục giấy đề thầy đang chiếu (máy thầy gửi qua `live-dat { giay }`). */
  giay?: GiayThay | null
  /** TẠM DỪNG (thầy 11/11 «cần thêm nút tạm dừng live»): live vẫn `bat`, phiên SFU giữ nguyên; máy thầy tắt tiếng + ngừng gửi nét, máy em hiện «Thầy tạm dừng live».
   *  Tiếp tục ⇒ có lại ngay. Thầy đặt bằng `live-dat { nghi }` (chỉ khi đang live). Chỉ thêm — phòng / máy bản cũ không có ⇒ coi như không dừng.
   *  Tên trường là `nghi` (KHÔNG đặt `dung`: trùng khoá đáp án `dung` mà test an toàn soát trên mọi tin tới máy em). */
  nghi?: boolean
  /** XEM LẠI LIVE (11/11 — chỉ thêm): trạng thái máy ghi của máy thầy tự báo. VẮNG = công tắc `cau_hinh.live_xem_lai` tắt ⇒ view không có ngăn «Đang ghi». */
  ghi?: 'dang-ghi' | 'loi' | 'tat'
}
/** ĐỢT 2 (giơ tay, mời nói, em ở xa) — luật phòng + máy chủ đã có và có test, nhưng GIAO DIỆN CHƯA MỞ (11/11: phiên chính dời đợt 2 sang lượt sau, chờ thử
 *  tiếng trên máy thật). Bật cờ này ⇒ máy em hiện nút «Giơ tay», màn chiếu hiện công tắc «Cho em ở xa vào xem». */
export const GIAO_DIEN_DOT_2 = false

/** Thầy quên tắt live: mic im + không nét 15 phút (hoặc máy thầy mất hẳn) ⇒ tự tắt (đặc tả mục 5). */
export const TU_TAT_LIVE_MS = 15 * 60_000
/** Khung nhị phân lớn nhất phòng nhận (đặc tả 4.3). */
export const KHUNG_TOI_DA = 16 * 1024
/** Thầy gửi điểm đang viết qua WebSocket (đường dự phòng) tối đa ngần này lô mỗi giây; phòng bỏ phần vượt (có dư cho dồn gói mạng). */
export const LO_MOI_GIAY = 30
export const LO_MOI_GIAY_TRAN = 45
/** Hàng giơ tay dài nhất (em thứ 41 trở đi bấm không vào hàng — thầy hạ bớt rồi giơ lại). */
export const TAY_TOI_DA = 40
/** Nhật ký chờ rút dài nhất (phòng rút mỗi lần phát view nên bình thường chỉ vài dòng). */
const NK_CHO_TOI_DA = 200

/** MÃ KHUNG NHỊ PHÂN. Sổ nét (đúng + đủ, phòng đánh số thứ tự và lưu): byte 0 = mã, byte 1..4 = stt u32 LE (thầy gửi 0, phòng ghi).
 *  Điểm đang viết (không lưu, phòng chuyển nguyên văn): byte 0 = mã, byte 1..2 = phiên u16 LE, byte 3..6 = tGui u32 LE. Mã hoá đầy đủ: src/lib/live/ma-net.ts. */
export const MA_SO = { netXong: 0x11, xoaNet: 0x12, xoaHet: 0x13, bangMoi: 0x14, hoanTac: 0x15 } as const
export const MA_DIEM = { diem: 0x21, tro: 0x22, nhac: 0x23 } as const
/** Khung thuộc nhóm nào (chỉ nhìn byte đầu — phòng không giải mã thân). */
export function nhomKhung(ma: number): 'so' | 'diem' | null {
  return ma >= MA_SO.netXong && ma <= MA_SO.hoanTac ? 'so' : ma >= MA_DIEM.diem && ma <= MA_DIEM.nhac ? 'diem' : null
}
/** Mục sổ nét làm sổ bắt đầu lại (xoá sạch / bảng mới) ⇒ phòng dọn phần cũ. */
export const laMucDonSo = (ma: number): boolean => ma === MA_SO.xoaHet || ma === MA_SO.bangMoi

const liveTrong = (): LivePhong => ({ cho: false, sfu: false, san: false, bat: false, tu: null, phien: 0, ss: null, tay: [], noi: [], bang: false, mic: null, micDong: [], xa: false, tiengLop: true, soNet: 0, nhip: 0, moi: null, micLoi: null, camMic: null, nk: [], giay: null })
/** Khối live của phòng; phòng lưu trước 10/11 (chưa có) ⇒ null = coi như công tắc tắt tới khi thầy mở lại phòng. */
export const liveCua = (st: Pick<TrangThaiPhong, 'live'>): LivePhong | null => st.live ?? null
const liveMo = (st: TrangThaiPhong): LivePhong | null => (st.live && st.live.cho && !st.ketThuc ? st.live : null)

/** Máy chủ nạp công tắc + trạng thái khoá SFU mỗi lần thầy mở phòng (`/khoi`). Tắt công tắc khi đang live ⇒ tắt live. Trả true nếu có đổi. */
export function datCoLive(st: TrangThaiPhong, o: { cho: boolean; sfu: boolean }, nay: number): boolean {
  const l = st.live ?? (st.live = liveTrong())
  if (l.cho === o.cho && l.sfu === o.sfu) return false
  l.cho = o.cho; l.sfu = o.sfu
  if (!o.cho) { l.bat = false; l.tu = null; l.san = false; l.ss = null; l.bang = false; thuMic(l, nay, 'tat'); donDamThoai(l) }
  if (!o.sfu) { l.ss = null; thuMic(l, nay, 'tat') }
  st.capNhat = nay
  return true
}

/** Ghi một dòng nhật ký đàm thoại vào hàng chờ rút (quá dài ⇒ bỏ dòng cũ nhất). */
function ghiNk(l: LivePhong, m: MucNhatKy): void { l.nk = [...(l.nk ?? []), m].slice(-NK_CHO_TOI_DA) }
/** Rút nhật ký đàm thoại chờ ghi (phòng gọi mỗi lần phát view rồi nối vào kho của Durable Object — không D1). */
export function rutNhatKy(st: TrangThaiPhong): MucNhatKy[] {
  const l = st.live
  if (!l?.nk?.length) return []
  const ds = l.nk
  l.nk = []
  return ds
}
/** Xoá hàng giơ tay + lời mời (tắt live, công tắc tắt, bật live mới). */
function donDamThoai(l: LivePhong): void { l.tay = []; l.moi = null; l.micLoi = null; l.camMic = null; l.nghi = false }
/** Gỡ track mic đang phát (nếu có) + xếp vào hàng chờ đóng ở SFU + ghi nhật ký «nói từ … tới …». Trả true nếu có gỡ. */
function thuMic(l: LivePhong, nay?: number, vi: ViThoi = 'luot'): boolean {
  const m = l.mic
  l.noi = []
  if (!m) return false
  l.mic = null
  l.micDong = [...(l.micDong ?? []), { id: m.id, mid: m.mid }].slice(-8)
  ghiNk(l, { k: 'thoi', sbd: m.sbd, luc: Math.max(m.luc, nay ?? l.nhip), tu: m.luc, vi })
  return true
}
const MA_PHIEN = /^[A-Za-z0-9_-]{8,128}$/
const TEN_NGUON = /^[a-z0-9-]{1,32}$/
/** Chuẩn hoá phiên SFU thầy gửi lên; sai dạng ⇒ null. */
export function chuanPhienSfu(v: unknown): PhienSfuThay | null {
  const x = (v ?? null) as Record<string, unknown> | null
  if (!x || typeof x !== 'object' || typeof x.id !== 'string' || !MA_PHIEN.test(x.id)) return null
  const ten = (t: unknown): string | null => (typeof t === 'string' && TEN_NGUON.test(t) ? t : null)
  return { id: x.id, tieng: ten(x.tieng), kenh: ten(x.kenh) }
}

/** `live-san`: thầy đã sẵn sàng (`san` false ⇒ thôi sẵn sàng). `ss` chỉ nhận khi SFU đã cấu hình. Đang live mà phiên SFU đổi (thầy tải lại trang) ⇒ `phien` + 1. */
export function liveSan(st: TrangThaiPhong, o: { san?: boolean; ss?: unknown }, nay: number): boolean {
  const l = liveMo(st)
  if (!l) return false
  const san = o.san !== false, ss = san && l.sfu ? chuanPhienSfu(o.ss) : null
  const doiSs = (l.ss?.id ?? '') !== (ss?.id ?? '') || (l.ss?.kenh ?? '') !== (ss?.kenh ?? '') || (l.ss?.tieng ?? '') !== (ss?.tieng ?? '')
  if (l.san === san && !doiSs) return false
  l.san = san; l.ss = ss
  if (l.bat && doiSs) l.phien += 1
  if (l.bat) l.nhip = nay
  st.capNhat = nay
  return true
}
/** `live-bat`: chỉ nhận MỘT lần khi chưa live (bấm lặp / hai máy thầy cùng mở ⇒ false). */
export function liveBat(st: TrangThaiPhong, nay: number): boolean {
  const l = liveMo(st)
  if (!l || l.bat) return false
  // Thầy 11/11 lần 4: «Tự động bật tiếng … cho hs khi vào live» ⇒ lần bật live ĐẦU của buổi, máy em trong lớp cũng phát tiếng (phòng mở trước 11/11 còn giữ `tiengLop: false`).
  // Các lần bật sau trong buổi giữ lựa chọn của thầy («Em ở xa» / «Tất cả»); thầy đã chọn trong cửa sổ nút Live TRƯỚC khi bật (`tiengChon`) cũng giữ.
  if (l.phien === 0 && !l.tiengChon) l.tiengLop = true
  l.bat = true; l.san = true; l.tu = nay; l.phien += 1; l.nhip = nay
  thuMic(l, nay, 'tat'); donDamThoai(l)
  // Bật live khi thầy ĐANG gọi một em lên bảng ⇒ máy em vào bảng live ngay; còn lại máy em giữ màn câu hỏi, chỉ có tiếng.
  l.bang = !!st.luot?.goi && st.luot.pha !== 'mo'
  st.capNhat = nay
  return true
}
/** `live-tat` (thầy bấm, hết buổi, tự tắt): giữ `san` + `ss` (thầy còn nối, bật lại tức thì) và sổ nét (bảng còn nguyên). */
export function liveTat(st: TrangThaiPhong, nay: number): boolean {
  const l = st.live
  if (!l || !l.bat) return false
  l.bat = false; l.tu = null; l.bang = false
  thuMic(l, nay, 'tat'); donDamThoai(l)
  st.capNhat = nay
  return true
}
/** `live-dat`: công tắc buổi — cho em ở xa vào xem (điểm quyết 4), tiếng trên máy em trong lớp (điểm quyết 3), và `bang` = thầy bật / tắt TAY bảng live
 *  trên máy em (giảng trên bảng mà không gọi ai; chỉ khi đang live). */
export function liveDat(st: TrangThaiPhong, o: { xa?: unknown; tiengLop?: unknown; bang?: unknown; giay?: unknown; nghi?: unknown; khoi?: unknown }, nay: number): boolean {
  const l = liveMo(st)
  if (!l) return false
  const khoi = chuanKhoi(o.khoi), doiKhoi = khoi !== undefined && JSON.stringify(khoi) !== JSON.stringify(l.khoi ?? null)
  if (doiKhoi) l.khoi = khoi
  const xa = typeof o.xa === 'boolean' ? o.xa : l.xa, tiengLop = typeof o.tiengLop === 'boolean' ? o.tiengLop : l.tiengLop
  const bang = typeof o.bang === 'boolean' && l.bat ? o.bang : !!l.bang
  // `giay` (đợt 2, rủi ro R3): bố cục giấy đề thầy đang chiếu — null ⇒ xoá; sai dạng ⇒ giữ cái đang có.
  const giay = o.giay === null ? null : o.giay === undefined ? (l.giay ?? null) : (chuanGiay(o.giay) ?? l.giay ?? null)
  const doiGiay = JSON.stringify(giay) !== JSON.stringify(l.giay ?? null)
  // `nghi` (11/11): tạm dừng / tiếp tục — chỉ khi đang live. Tạm dừng ⇒ thu mic của em đang nói, thôi lời mời; tiếp tục ⇒ tính lại nhịp «thầy còn live».
  const nghi = typeof o.nghi === 'boolean' && l.bat ? o.nghi : !!l.nghi
  if (typeof o.tiengLop === 'boolean') l.tiengChon = true // thầy tự chọn ⇒ `liveBat` lần đầu không tự bật lại
  if (xa === l.xa && tiengLop === l.tiengLop && bang === !!l.bang && !doiGiay && nghi === !!l.nghi) { if (doiKhoi) st.capNhat = nay; return doiKhoi }
  if (nghi !== !!l.nghi) { l.nghi = nghi; l.nhip = nay; if (nghi) { thuMic(l, nay, 'tat'); l.moi = null } }
  // Tắt «cho em ở xa»: em ở xa không còn được xem ⇒ ra khỏi hàng giơ tay, thôi nói, thôi được mời.
  if (l.xa && !xa) for (const e of st.ds) if (!e.vao) boEm(l, e.sbd, nay, 'thay')
  l.xa = xa; l.tiengLop = tiengLop; l.bang = bang; l.giay = giay
  st.capNhat = nay
  return true
}
const soNguyen = (v: unknown, tu: number, den: number): number | null => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= tu && n <= den ? n : null }
/** Chuẩn hoá bố cục giấy máy thầy gửi (chỉ SỐ; tối đa 24 khối, mỗi khối 11 số trong khoảng hợp lệ). Sai dạng ⇒ null. */
export function chuanGiay(v: unknown): GiayThay | null {
  const x = (v ?? null) as Record<string, unknown> | null
  if (!x || typeof x !== 'object' || typeof x.k !== 'string' || x.k.length > 60 || !Array.isArray(x.o) || x.o.length > 24) return null
  const w = soNguyen(x.w, 80, 8000), h = soNguyen(x.h, 80, 8000)
  if (w == null || h == null) return null
  const o: number[][] = []
  for (const b of x.o as unknown[]) {
    if (!Array.isArray(b) || b.length !== 11) return null
    const so = b.map((n, i) => soNguyen(n, i < 2 ? 0 : -8000, i === 0 ? 7 : i === 1 ? 23 : 16000))
    if (so.some((n) => n == null)) return null
    o.push(so as number[])
  }
  return { k: x.k, w, h, la: x.la === true, o }
}

// ── BẢNG LIVE theo lượt + MIC của em được gọi lên bảng (thầy 10/11) ──
// «Khi bấm nút live, khi chuyển câu thì vẫn giữ live tiếng với hs, màn hình hs hiện câu hỏi như bình thường, khi bấm gọi lên bảng … lập tức màn hình hs chuyển
//  sang chế độ live để xem thầy và bạn được gọi lên bảng chữa bài, tự động bật mic cho bạn lên bảng».
/** Mic đang phát là của em được thầy MỜI NÓI (không phải em lên bảng). */
const laMicDuocMoi = (l: LivePhong): boolean => !!l.mic && !!l.moi && l.moi.sbd === l.mic.sbd
/** Thầy vừa gọi em lên bảng / cho em bắt đầu làm bảng (phong.ts gọi sau `goiLenBang` / `lamBang`): đang live ⇒ bật bảng live; mic của em KHÁC đang phát ⇒ thu. */
export function liveKhiGoi(st: TrangThaiPhong, nay?: number): void {
  const l = st.live
  if (!l?.bat) return
  l.bang = true
  // Một em nói một lúc: em lên bảng tự bật mic ⇒ lời mời nói đang treo (đợt 2) thôi hiệu lực, mic của em khác thu về.
  l.moi = null; l.camMic = null
  if (l.mic && l.mic.sbd !== st.luot?.goi?.sbd) thuMic(l, nay, 'moi-khac')
}
/** Mở lượt mới / bỏ lượt dở (phong.ts gọi): máy em về màn câu hỏi bình thường (`bang` tắt), tiếng VẪN chạy (không đụng `bat`, `phien`, `ss`); thu mic. */
export function liveKhiLuotMoi(st: TrangThaiPhong, nay?: number): void {
  const l = st.live
  if (!l) return
  l.bang = false; l.camMic = null
  // Em đang nói theo LỜI MỜI của thầy (đợt 2) không gắn với lượt ⇒ nói tiếp qua lượt mới; chỉ mic của em lên bảng mới thu.
  if (!laMicDuocMoi(l)) thuMic(l, nay, 'luot')
}
/** Thầy chấm Đạt / Chưa đạt, em rời màn, hết buổi (phong.ts gọi): thu mic; `bang` GIỮ (thầy còn chữa tiếp trên bảng tới lượt mới). `sbd` ⇒ chỉ khi đúng em đó đang phát. */
export function liveThuMic(st: TrangThaiPhong, nay: number, sbd?: string, vi: ViThoi = sbd != null ? 'mat' : 'luot'): boolean {
  const l = st.live
  if (!l?.mic || (sbd != null && l.mic.sbd !== sbd)) return false
  // Không nêu em (chấm xong / mở đáp án) ⇒ chỉ nhắm mic của em LÊN BẢNG; em đang nói theo lời mời của thầy nói tiếp.
  if (sbd == null && laMicDuocMoi(l)) return false
  thuMic(l, nay, vi)
  st.capNhat = nay
  return true
}

// ── ĐỢT 2 · ĐÀM THOẠI HAI CHIỀU (đặc tả 4.8): giơ tay ⇒ hàng chờ ⇒ thầy mời ⇒ em bật mic ⇒ cả lớp nghe ⇒ thu mic ──
/** Gỡ MỘT em khỏi mọi chỗ của đàm thoại (hàng tay, lời mời, mic). Trả true nếu có gỡ. */
function boEm(l: LivePhong, sbd: string, nay: number, vi: ViThoi): boolean {
  let doi = false
  if (l.tay.some((x) => x.sbd === sbd)) { l.tay = l.tay.filter((x) => x.sbd !== sbd); doi = true }
  if (l.moi?.sbd === sbd) { l.moi = null; doi = true }
  if (l.mic?.sbd === sbd) doi = thuMic(l, nay, vi) || doi
  return doi
}
/** EM bấm «Giơ tay» (`gio` true) / chạm lần nữa để hạ (`gio` false). Chỉ khi đang live và em được xem; em đang nói / đang được mời / đang rời màn không vào hàng. */
export function liveTay(st: TrangThaiPhong, sbd: string, gio: boolean, nay: number): boolean {
  const l = liveMo(st)
  if (!l || !l.bat || !sbd) return false
  const co = l.tay.some((x) => x.sbd === sbd)
  if (!gio) {
    if (!co) return false
    l.tay = l.tay.filter((x) => x.sbd !== sbd)
    ghiNk(l, { k: 'ha', sbd, luc: nay })
  } else {
    if (co || !duocXemLive(st, sbd) || l.mic?.sbd === sbd || l.moi?.sbd === sbd || st.roiNay?.includes(sbd) || l.tay.length >= TAY_TOI_DA) return false
    l.tay = [...l.tay, { sbd, luc: nay }]
    ghiNk(l, { k: 'tay', sbd, luc: nay })
  }
  st.capNhat = nay
  return true
}
/** THẦY «Hạ hết tay» (không `sbd`) hoặc hạ tay một em. */
export function liveHaTay(st: TrangThaiPhong, nay: number, sbd?: string): boolean {
  const l = liveMo(st)
  if (!l || !l.tay.length) return false
  const bo = sbd == null ? l.tay : l.tay.filter((x) => x.sbd === sbd)
  if (!bo.length) return false
  for (const x of bo) ghiNk(l, { k: 'ha-het', sbd: x.sbd, luc: nay })
  l.tay = sbd == null ? [] : l.tay.filter((x) => x.sbd !== sbd)
  st.capNhat = nay
  return true
}
/** THẦY «Mời nói»: em ra khỏi hàng tay, thành em được mời (MỘT em mỗi lúc — em đang nói / đang được mời trước đó thôi). Em phải đang được xem live, không đang rời màn. */
export function liveMoi(st: TrangThaiPhong, sbd: string, nay: number): boolean {
  const l = liveMo(st)
  if (!l || !l.bat || !sbd || !duocXemLive(st, sbd) || st.roiNay?.includes(sbd)) return false
  if (l.moi?.sbd === sbd) return false
  if (l.mic && l.mic.sbd !== sbd) thuMic(l, nay, 'moi-khac')
  l.tay = l.tay.filter((x) => x.sbd !== sbd)
  l.moi = { sbd, luc: nay }; l.micLoi = null
  ghiNk(l, { k: 'moi', sbd, luc: nay })
  st.capNhat = nay
  return true
}
/** EM bấm «Để sau» trên tấm «Thầy mời em nói»: thôi lời mời (tay đã hạ từ lúc được mời; muốn nói em giơ tay lại). */
export function liveDeSau(st: TrangThaiPhong, sbd: string, nay: number): boolean {
  const l = st.live
  if (!l?.moi || l.moi.sbd !== sbd || l.mic?.sbd === sbd) return false
  l.moi = null
  ghiNk(l, { k: 'de-sau', sbd, luc: nay })
  st.capNhat = nay
  return true
}
/** MÁY EM báo không bật được mic sau khi được mời (em / máy từ chối quyền, mic lỗi): lời mời thôi, màn chiếu ghi «chưa bật được mic». */
export function liveMicLoi(st: TrangThaiPhong, sbd: string, ly: unknown, nay: number): boolean {
  const l = st.live
  if (!l?.moi || l.moi.sbd !== sbd) return false
  l.moi = null
  if (l.mic?.sbd === sbd) thuMic(l, nay, 'em')
  l.micLoi = { sbd, luc: nay, ly: ly === 'tu-choi' ? 'tu-choi' : 'loi' }
  ghiNk(l, { k: 'mic-loi', sbd, luc: nay })
  st.capNhat = nay
  return true
}
/** THẦY «Thu mic» (một em) / «Tắt mic tất cả» (không `sbd`): gỡ lời mời + mic; em lên bảng bị thu ⇒ không tự bật lại trong lượt gọi này. */
export function liveThu(st: TrangThaiPhong, nay: number, sbd?: string): boolean {
  const l = st.live
  if (!l) return false
  let doi = false
  const m = l.mic
  if (l.moi && (sbd == null || l.moi.sbd === sbd)) { l.moi = null; doi = true }
  if (m && (sbd == null || m.sbd === sbd)) {
    if (st.luot?.goi?.sbd === m.sbd) l.camMic = m.sbd
    doi = thuMic(l, nay, 'thay') || doi
  }
  if (doi) st.capNhat = nay
  return doi
}
/** EM bấm «Xong, tắt mic» (hoặc máy em mất quyền mic giữa chừng): gỡ mic của CHÍNH em; em được mời ⇒ lời mời xong. */
export function liveEmTatMic(st: TrangThaiPhong, sbd: string, nay: number): boolean {
  const l = st.live
  if (!l || (l.mic?.sbd !== sbd && l.moi?.sbd !== sbd)) return false
  if (l.mic?.sbd === sbd) thuMic(l, nay, 'em')
  if (l.moi?.sbd === sbd) l.moi = null
  st.capNhat = nay
  return true
}
/** Em RỜI MÀN (phong.ts gọi): thôi nói, thôi được mời, ra khỏi hàng tay. */
export function liveKhiRoi(st: TrangThaiPhong, sbd: string, nay: number): boolean {
  const l = st.live
  if (!l || !boEm(l, sbd, nay, 'roi')) return false
  st.capNhat = nay
  return true
}
/** AI ĐƯỢC PHÁT MIC (một em mỗi lúc): đang live, em không đang rời màn, và
 *  · em đang được thầy MỜI NÓI (đợt 2 — em trong lớp hay em ở xa đang được xem live); hoặc
 *  · không có lời mời nào: đúng em đang được gọi lên bảng của lượt chưa mở đáp án, thầy chưa chấm, chưa bị thầy thu mic trong lượt gọi này. */
export function duocPhatMic(st: TrangThaiPhong, sbd: string): boolean {
  const l = liveMo(st), g = st.luot?.goi
  if (!l || !l.bat || l.nghi || !l.sfu || !sbd || st.roiNay?.includes(sbd) || !st.ds.some((e) => e.sbd === sbd)) return false
  if (l.moi) return l.moi.sbd === sbd && duocXemLive(st, sbd)
  return !!g && g.sbd === sbd && g.dat == null && st.luot!.pha !== 'mo' && l.camMic !== sbd
}
/** Máy chủ ghi track mic của em SAU khi SFU đã nhận track (cửa `/bpu/live/phat`). Em không (còn) được phép ⇒ false (máy chủ đóng track vừa tạo). */
export function liveMicBat(st: TrangThaiPhong, o: { sbd: string; id: unknown; tieng: unknown; mid: unknown }, nay: number): boolean {
  const l = liveMo(st)
  if (!l || !duocPhatMic(st, o.sbd)) return false
  const id = typeof o.id === 'string' && MA_PHIEN.test(o.id) ? o.id : '', tieng = typeof o.tieng === 'string' && TEN_NGUON.test(o.tieng) ? o.tieng : '', mid = typeof o.mid === 'string' && /^[A-Za-z0-9]{1,16}$/.test(o.mid) ? o.mid : ''
  if (!id || !tieng || !mid) return false
  if (l.mic) thuMic(l, nay, 'moi-khac')
  l.mic = { sbd: o.sbd, id, tieng, mid, luc: nay }
  l.noi = [o.sbd]
  l.tay = l.tay.filter((x) => x.sbd !== o.sbd)
  ghiNk(l, { k: 'noi', sbd: o.sbd, luc: nay })
  l.nhip = nay
  st.capNhat = nay
  return true
}
/** Rút hàng track chờ đóng ở SFU (phòng gọi mỗi lần phát view). */
export function rutMicDong(st: TrangThaiPhong): { id: string; mid: string }[] {
  const l = st.live
  if (!l?.micDong?.length) return []
  const ds = l.micDong
  l.micDong = []
  return ds
}
/** Thầy còn đang live thật (nhịp có tiếng / có nét, nét xong, lô điểm). Không phát view. */
export function liveNhip(st: TrangThaiPhong, nay: number): void { if (st.live?.bat) st.live.nhip = nay }
/** Đang live mà quá 15 phút không dấu hiệu nào của thầy ⇒ cần tự tắt. */
export const liveHetHan = (st: TrangThaiPhong, nay: number): boolean => !!st.live?.bat && nay - st.live.nhip > TU_TAT_LIVE_MS * (st.live.nghi ? 4 : 1) // đang tạm dừng (mic im, không nét) ⇒ chờ lâu gấp bốn: 60 phút

/** AI XEM ĐƯỢC (mục 4.9): em đã vào phòng buổi học; em thuộc lớp CHƯA điểm danh chỉ khi thầy bật «cho em ở xa»; em lạ không bao giờ. */
export function duocXemLive(st: TrangThaiPhong, sbd: string): boolean {
  const l = liveMo(st), e = st.ds.find((x) => x.sbd === sbd)
  return !!l && !!e && (e.vao || l.xa)
}
/** Em ở xa đang xem live (thuộc lớp, chưa điểm danh, thầy bật «cho em ở xa») — rời màn chỉ bị cảnh báo tên, không trừ kJ (điểm quyết 2). */
export function laEmXaDangLive(st: TrangThaiPhong, sbd: string): boolean {
  const l = liveMo(st), e = st.ds.find((x) => x.sbd === sbd)
  return !!l && l.bat && l.xa && !!e && !e.vao
}

export type TiengLive = 'bat' | 'tat' | 'chua-cau-hinh'

/** Khối `live` cho BẢNG CHIẾU. `dem` do phòng đếm trên kết nối đang mở: `xem` = em đã báo `live-ok` phiên này, còn nối, không đang rời màn;
 *  `ws` = trong số đó, em cần điểm đang viết qua WebSocket (chưa có DataChannel). Công tắc tắt / phòng đời cũ ⇒ null. */
export function viewLiveBang(st: TrangThaiPhong, dem?: { xem: number; ws: number; nghe?: number }) {
  const l = liveCua(st)
  if (!l || !l.cho) return null
  return {
    san: l.san, bat: l.bat, tu: l.tu, phien: l.phien, ss: l.ss, xem: dem?.xem ?? 0, ws: dem?.ws ?? 0, nghe: dem?.nghe ?? 0,
    tay: l.tay, noi: viewNoi(st, l), bang: !!l.bang, xa: l.xa, tiengLop: l.tiengLop, soNet: l.soNet,
    /** ĐỢT 2: em đang được mời nói (chưa / đang bật mic) · em vừa không bật được mic. */
    moi: l.moi ?? null, micLoi: l.micLoi ?? null,
    ...(l.khoi ? { khoi: l.khoi } : {}),
    /** Thầy đang TẠM DỪNG live. */
    nghi: l.bat && !!l.nghi,
    tieng: (l.sfu ? 'bat' : 'chua-cau-hinh') as Exclude<TiengLive, 'tat'>,
    /** Xem lại Live: 'dang-ghi' | 'loi' | 'tat'; vắng = công tắc tắt (màn chiếu không vẽ ngăn ghi). */
    ...(l.ghi !== undefined ? { ghi: l.ghi } : {}),
  }
}
/** Em đang phát mic (mảng tối đa MỘT phần tử): tên, đội, `xa` = em ở xa (chưa điểm danh tại lớp ⇒ máy thầy mới tự phát tiếng em ra loa),
 *  `ss` = phiên SFU + tên track của máy em để các máy khác kéo về nghe. Không phải bí mật. */
function viewNoi(st: TrangThaiPhong, l: LivePhong): { sbd: string; ten: string; doi: number; xa: boolean; ss: { id: string; tieng: string } }[] {
  const m = l.mic
  if (!m) return []
  const h = st.ds.find((x) => x.sbd === m.sbd)
  return [{ sbd: m.sbd, ten: h?.ten ?? m.sbd, doi: h?.doi ?? 0, xa: !h?.vao, ss: { id: m.id, tieng: m.tieng } }]
}
/** Khối `live` cho MÁY EM. Em không được xem ⇒ `bat` / `san` false, không có phiên SFU. KHÔNG mang gì về đáp án. */
export function viewLiveEm(st: TrangThaiPhong, sbd: string) {
  const l = liveCua(st)
  if (!l || !l.cho) return null
  const e = st.ds.find((x) => x.sbd === sbd), duoc = !st.ketThuc && !!e && (e.vao || l.xa)
  const hang = l.tay.findIndex((x) => x.sbd === sbd)
  // Điểm quyết 3 (thầy 11/11 lần 4): em trong lớp mặc định BẬT tiếng; thầy chọn «Em ở xa» (`tiengLop: false`) ⇒ tắt, em đeo tai nghe tự bật lại được. Em ở xa luôn bật.
  const tieng: TiengLive = !l.sfu ? 'chua-cau-hinh' : e?.vao && !l.tiengLop ? 'tat' : 'bat'
  return {
    duocXem: duoc, san: duoc && l.san, bat: duoc && l.bat, tu: duoc ? l.tu : null, phien: l.phien, ss: duoc ? l.ss : null, tieng, soNet: l.soNet,
    /** Máy em có hiện BẢNG LIVE không (false ⇒ giữ màn câu hỏi bình thường, tiếng vẫn chạy khi `bat`). Em Ở XA không có màn câu hỏi ⇒ luôn xem bảng khi live. */
    bang: duoc && l.bat && (!!l.bang || !e!.vao || l.khoi?.che === 'bang'),
    /** Live theo khối: giai đoạn + chế độ (máy em: phòng chờ / màn bốn đội / bảng kín màn). Chỉ có ở buổi live theo khối. */
    ...(duoc && l.khoi ? { khoi: l.khoi } : {}),
    /** Thầy đang TẠM DỪNG live ⇒ máy em hiện «Thầy tạm dừng live» (tiếng và nét ngừng tới, phiên giữ nguyên). */
    nghi: duoc && l.bat && !!l.nghi,
    /** Em Ở XA (thuộc lớp, chưa điểm danh, thầy bật «Cho em ở xa vào xem»): không đội, không kJ — khay ẩn dòng đội. */
    xa: duoc && !e!.vao,
    emTay: duoc && hang >= 0, hangTay: duoc && hang >= 0 ? hang + 1 : null,
    /** `emDuocMoi` = em ĐƯỢC PHÉP bật mic lúc này (em đang được gọi lên bảng, hoặc thầy mời nói); `emNoi` = track mic của em đang được phòng ghi nhận. */
    emDuocMoi: duoc && duocPhatMic(st, sbd), emNoi: l.mic?.sbd === sbd,
    /** ĐỢT 2: thầy đang MỜI em nói ⇒ tấm «Thầy mời em nói» (em phải chạm «Bật mic và nói» — mic không tự bật như lúc lên bảng). */
    emMoi: duoc && l.bat && l.moi?.sbd === sbd,
    noi: duoc ? viewNoi(st, l) : [],
    /** Bố cục giấy đề thầy đang chiếu (chỉ số đo) — máy em dựng giấy cùng bề rộng, cùng cỡ chữ. */
    giay: duoc && l.bat ? (l.giay ?? null) : null,
    /** Xem lại Live (điểm quyết 2): buổi live này đang được ghi ⇒ máy em đang bật mic hiện «Đang ghi để lớp xem lại». */
    ...(duoc && l.bat && l.ghi === 'dang-ghi' ? { ghi: true } : {}),
  }
}
export type ViewLiveBang = ReturnType<typeof viewLiveBang>
export type ViewLiveEm = ReturnType<typeof viewLiveEm>

/** Số thứ tự của một mục sổ nét (byte 1..4, LE). Khung quá ngắn ⇒ 0. */
export const docStt = (k: Uint8Array): number => (k.length >= 5 ? (k[1]! | (k[2]! << 8) | (k[3]! << 16) | (k[4]! << 24)) >>> 0 : 0)
/** Phòng đánh số thứ tự NGAY TRÊN khung thầy gửi (không dựng lại khung) rồi chuyển nguyên văn cho máy em. */
export function ghiStt(k: Uint8Array, stt: number): void { k[1] = stt & 255; k[2] = (stt >>> 8) & 255; k[3] = (stt >>> 16) & 255; k[4] = (stt >>> 24) & 255 }
