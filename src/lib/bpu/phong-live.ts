// LIVE BẢNG — LUẬT PHÒNG THUẦN (thầy 10/11 «thêm chế độ live màn hình chữa bài … giọng nói phải tức thì»; đặc tả docs/dac-ta-live-bang-1011.md mục 4.3).
// CHỈ THÊM vào phòng Bình Phản Ứng: mọi trường cũ giữ nguyên, máy em / bảng bản cũ gặp trường lạ thì bỏ qua. KHÔNG đọc mạng, KHÔNG đọc đồng hồ.
// Dùng chung: Durable Object (server/src/phong-live.ts gọi các hàm này), `viewBang` / `viewEm` (phong.ts) gắn khối `live`, thư viện máy khách (src/lib/live).
// BẤT BIẾN AN TOÀN: không trường nào của `live` mang đáp án / lời giải — test tests/live-an-toan-dap-an-1011.test.ts khoá.
// ĐỢT 1A (nền): bật / tắt, sẵn sàng, công tắc buổi, ai được xem, tiếng theo điểm quyết 3, rời màn theo điểm quyết 2. `tay` / `noi` (giơ tay, mời nói — Đợt 2)
// đã có chỗ trong trạng thái để hợp đồng không đổi, đợt này luôn rỗng.
import type { TrangThaiPhong } from './phong'

/** Phiên SFU của thầy cho máy em kéo về: `id` = mã phiên, `tieng` = tên track tiếng, `kenh` = tên DataChannel điểm đang viết (null ⇒ điểm đi WebSocket). Không phải bí mật. */
export interface PhienSfuThay { id: string; tieng: string | null; kenh: string | null }

export interface MicEm { sbd: string; id: string; tieng: string; mid: string; luc: number }
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
  /** Máy em TRONG LỚP có phát tiếng không — điểm quyết 3, mặc định TẮT (chống dàn đồng ca lệch + hú). Em ở xa luôn mặc định bật. */
  tiengLop: boolean
  /** Số thứ tự mục cuối của sổ nét. */
  soNet: number
  /** Lần cuối thầy có dấu hiệu đang live (bật, nhịp có tiếng / có nét, nét xong) — quá `TU_TAT_LIVE_MS` ⇒ phòng tự tắt live. */
  nhip: number
  /** XEM LẠI LIVE (11/11 — chỉ thêm): trạng thái máy ghi của máy thầy tự báo. VẮNG = công tắc `cau_hinh.live_xem_lai` tắt ⇒ view không có ngăn «Đang ghi». */
  ghi?: 'dang-ghi' | 'loi' | 'tat'
}

/** Thầy quên tắt live: mic im + không nét 15 phút (hoặc máy thầy mất hẳn) ⇒ tự tắt (đặc tả mục 5). */
export const TU_TAT_LIVE_MS = 15 * 60_000
/** Khung nhị phân lớn nhất phòng nhận (đặc tả 4.3). */
export const KHUNG_TOI_DA = 16 * 1024
/** Thầy gửi điểm đang viết qua WebSocket (đường dự phòng) tối đa ngần này lô mỗi giây; phòng bỏ phần vượt (có dư cho dồn gói mạng). */
export const LO_MOI_GIAY = 30
export const LO_MOI_GIAY_TRAN = 45

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

const liveMoi = (): LivePhong => ({ cho: false, sfu: false, san: false, bat: false, tu: null, phien: 0, ss: null, tay: [], noi: [], bang: false, mic: null, micDong: [], xa: false, tiengLop: false, soNet: 0, nhip: 0 })
/** Khối live của phòng; phòng lưu trước 10/11 (chưa có) ⇒ null = coi như công tắc tắt tới khi thầy mở lại phòng. */
export const liveCua = (st: Pick<TrangThaiPhong, 'live'>): LivePhong | null => st.live ?? null
const liveMo = (st: TrangThaiPhong): LivePhong | null => (st.live && st.live.cho && !st.ketThuc ? st.live : null)

/** Máy chủ nạp công tắc + trạng thái khoá SFU mỗi lần thầy mở phòng (`/khoi`). Tắt công tắc khi đang live ⇒ tắt live. Trả true nếu có đổi. */
export function datCoLive(st: TrangThaiPhong, o: { cho: boolean; sfu: boolean }, nay: number): boolean {
  const l = st.live ?? (st.live = liveMoi())
  if (l.cho === o.cho && l.sfu === o.sfu) return false
  l.cho = o.cho; l.sfu = o.sfu
  if (!o.cho) { l.bat = false; l.tu = null; l.san = false; l.ss = null; l.tay = []; l.bang = false; thuMic(l) }
  if (!o.sfu) { l.ss = null; thuMic(l) }
  st.capNhat = nay
  return true
}

/** Gỡ track mic đang phát (nếu có) + xếp vào hàng chờ đóng ở SFU. Trả true nếu có gỡ. */
function thuMic(l: LivePhong): boolean {
  const m = l.mic
  l.noi = []
  if (!m) return false
  l.mic = null
  l.micDong = [...(l.micDong ?? []), { id: m.id, mid: m.mid }].slice(-8)
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
  l.bat = true; l.san = true; l.tu = nay; l.phien += 1; l.nhip = nay; l.tay = []
  thuMic(l)
  // Bật live khi thầy ĐANG gọi một em lên bảng ⇒ máy em vào bảng live ngay; còn lại máy em giữ màn câu hỏi, chỉ có tiếng.
  l.bang = !!st.luot?.goi && st.luot.pha !== 'mo'
  st.capNhat = nay
  return true
}
/** `live-tat` (thầy bấm, hết buổi, tự tắt): giữ `san` + `ss` (thầy còn nối, bật lại tức thì) và sổ nét (bảng còn nguyên). */
export function liveTat(st: TrangThaiPhong, nay: number): boolean {
  const l = st.live
  if (!l || !l.bat) return false
  l.bat = false; l.tu = null; l.tay = []; l.bang = false
  thuMic(l)
  st.capNhat = nay
  return true
}
/** `live-dat`: công tắc buổi — cho em ở xa vào xem (điểm quyết 4), tiếng trên máy em trong lớp (điểm quyết 3), và `bang` = thầy bật / tắt TAY bảng live
 *  trên máy em (giảng trên bảng mà không gọi ai; chỉ khi đang live). */
export function liveDat(st: TrangThaiPhong, o: { xa?: unknown; tiengLop?: unknown; bang?: unknown }, nay: number): boolean {
  const l = liveMo(st)
  if (!l) return false
  const xa = typeof o.xa === 'boolean' ? o.xa : l.xa, tiengLop = typeof o.tiengLop === 'boolean' ? o.tiengLop : l.tiengLop
  const bang = typeof o.bang === 'boolean' && l.bat ? o.bang : !!l.bang
  if (xa === l.xa && tiengLop === l.tiengLop && bang === !!l.bang) return false
  l.xa = xa; l.tiengLop = tiengLop; l.bang = bang
  st.capNhat = nay
  return true
}

// ── BẢNG LIVE theo lượt + MIC của em được gọi lên bảng (thầy 10/11) ──
// «Khi bấm nút live, khi chuyển câu thì vẫn giữ live tiếng với hs, màn hình hs hiện câu hỏi như bình thường, khi bấm gọi lên bảng … lập tức màn hình hs chuyển
//  sang chế độ live để xem thầy và bạn được gọi lên bảng chữa bài, tự động bật mic cho bạn lên bảng».
/** Thầy vừa gọi em lên bảng / cho em bắt đầu làm bảng (phong.ts gọi sau `goiLenBang` / `lamBang`): đang live ⇒ bật bảng live; mic của em KHÁC đang phát ⇒ thu. */
export function liveKhiGoi(st: TrangThaiPhong): void {
  const l = st.live
  if (!l?.bat) return
  l.bang = true
  if (l.mic && l.mic.sbd !== st.luot?.goi?.sbd) thuMic(l)
}
/** Mở lượt mới / bỏ lượt dở (phong.ts gọi): máy em về màn câu hỏi bình thường (`bang` tắt), tiếng VẪN chạy (không đụng `bat`, `phien`, `ss`); thu mic. */
export function liveKhiLuotMoi(st: TrangThaiPhong): void {
  const l = st.live
  if (!l) return
  l.bang = false
  thuMic(l)
}
/** Thầy chấm Đạt / Chưa đạt, em rời màn, hết buổi (phong.ts gọi): thu mic; `bang` GIỮ (thầy còn chữa tiếp trên bảng tới lượt mới). `sbd` ⇒ chỉ khi đúng em đó đang phát. */
export function liveThuMic(st: TrangThaiPhong, nay: number, sbd?: string): boolean {
  const l = st.live
  if (!l?.mic || (sbd != null && l.mic.sbd !== sbd)) return false
  thuMic(l)
  st.capNhat = nay
  return true
}
/** AI ĐƯỢC PHÁT MIC: đang live, đúng em đang được gọi lên bảng của lượt chưa mở đáp án, thầy chưa chấm, em không đang rời màn. Một em mỗi lúc. */
export function duocPhatMic(st: TrangThaiPhong, sbd: string): boolean {
  const l = liveMo(st), g = st.luot?.goi
  return !!l && l.bat && l.sfu && !!sbd && !!g && g.sbd === sbd && g.dat == null && st.luot!.pha !== 'mo' && !st.roiNay?.includes(sbd) && st.ds.some((e) => e.sbd === sbd)
}
/** Máy chủ ghi track mic của em SAU khi SFU đã nhận track (cửa `/bpu/live/phat`). Em không (còn) được phép ⇒ false (máy chủ đóng track vừa tạo). */
export function liveMicBat(st: TrangThaiPhong, o: { sbd: string; id: unknown; tieng: unknown; mid: unknown }, nay: number): boolean {
  const l = liveMo(st)
  if (!l || !duocPhatMic(st, o.sbd)) return false
  const id = typeof o.id === 'string' && MA_PHIEN.test(o.id) ? o.id : '', tieng = typeof o.tieng === 'string' && TEN_NGUON.test(o.tieng) ? o.tieng : '', mid = typeof o.mid === 'string' && /^[A-Za-z0-9]{1,16}$/.test(o.mid) ? o.mid : ''
  if (!id || !tieng || !mid) return false
  if (l.mic) thuMic(l)
  l.mic = { sbd: o.sbd, id, tieng, mid, luc: nay }
  l.noi = [o.sbd]
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
export const liveHetHan = (st: TrangThaiPhong, nay: number): boolean => !!st.live?.bat && nay - st.live.nhip > TU_TAT_LIVE_MS

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
export function viewLiveBang(st: TrangThaiPhong, dem?: { xem: number; ws: number }) {
  const l = liveCua(st)
  if (!l || !l.cho) return null
  return {
    san: l.san, bat: l.bat, tu: l.tu, phien: l.phien, ss: l.ss, xem: dem?.xem ?? 0, ws: dem?.ws ?? 0,
    tay: l.tay, noi: viewNoi(st, l), bang: !!l.bang, xa: l.xa, tiengLop: l.tiengLop, soNet: l.soNet,
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
  // Điểm quyết 3: em trong lớp mặc định TẮT tiếng (thầy bật «Tất cả» thì bật); em ở xa mặc định bật. Máy em tự bật được khi đeo tai nghe.
  const tieng: TiengLive = !l.sfu ? 'chua-cau-hinh' : e?.vao && !l.tiengLop ? 'tat' : 'bat'
  return {
    duocXem: duoc, san: duoc && l.san, bat: duoc && l.bat, tu: duoc ? l.tu : null, phien: l.phien, ss: duoc ? l.ss : null, tieng, soNet: l.soNet,
    /** Máy em có hiện BẢNG LIVE không (false ⇒ giữ màn câu hỏi bình thường, tiếng vẫn chạy khi `bat`). */
    bang: duoc && l.bat && !!l.bang,
    emTay: hang >= 0, hangTay: hang >= 0 ? hang + 1 : null,
    /** `emDuocMoi` = em ĐƯỢC PHÉP bật mic lúc này (em đang được gọi lên bảng); `emNoi` = track mic của em đang được phòng ghi nhận. */
    emDuocMoi: duoc && duocPhatMic(st, sbd), emNoi: l.mic?.sbd === sbd,
    noi: duoc ? viewNoi(st, l) : [],
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
