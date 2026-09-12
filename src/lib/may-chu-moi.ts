// MÁY CHỦ MỚI — LỚP ĐỊNH TUYẾN ở máy em (MAY-CHU-MOI.md mục 7).
//
// Bốn lệnh nóng đi Worker khi thầy bật cờ; MỌI trục trặc đều rơi về Apps Script
// cho ĐÚNG lượt đó. Đây là luật, không phải tuỳ chọn — Cloudflare sập giữa ca
// thi mà không có đường lùi là mất cả buổi.
//
// BA ĐIỀU CẤM:
//   1. Cấm ném lỗi ra ngoài. Hàm ở đây trả `null` nghĩa là "đi đường cũ", và
//      chỗ gọi không cần biết vì sao.
//   2. Cấm đi Worker khi em CẦN GÓI ĐỀ mà Worker chưa có (`deUrl` rỗng) — em
//      vào được mà không có đề là hỏng nặng hơn chậm.
//   3. Cấm nhớ cấu hình quá lâu: thầy tắt cờ giữa ca thì lượt gọi tiếp theo
//      phải đi đường cũ ngay.
import { chuanHoaMayChu, gianVaoThi, type CauHinhMayChu } from './cau-hinh-may-chu'
import { loadCauHinhMayChu, loadDiaChiMayChuMoiChoEm, saveCauHinhMayChu } from './exam-db'

// ---------------------------------------------------------------------------
// CẦU DAO: CA NÀO MÁY CHỦ MỚI KHÔNG GIỮ THÌ THÔI GỌI CHO CẢ CA
//
// Hôm nay VÀO THI vẫn đi Apps Script, nên dòng `luot` của em nằm ở Sheet chứ
// không nằm ở D1. Không có cầu dao thì mỗi nhịp lưu tạm (135 nhịp một em) và
// mỗi nhịp hỏi phòng chờ (3 giây một lần) đều tốn MỘT lượt gọi Worker chắc chắn
// trượt rồi mới đi đường cũ — chậm hơn lúc chưa bật cờ, đúng thứ không được phép.
//
// Gạt cầu dao CHỈ khi máy chủ trả lời dứt khoát "không có ở đây". Mạng hỏng hay
// quá hạn thì KHÔNG gạt: đó là sự cố tạm, đường lùi đã lo, và ca có thể vẫn nằm
// trên máy chủ.
const caChuaLenMayChu = new Set<string>()

/** Máy chủ mới đã nói dứt khoát là không giữ ca này. */
function ghiNhanCaVang(maCa: string): void {
  if (maCa) caChuaLenMayChu.add(maCa)
}

/** Chỉ dùng cho phép kiểm và cho lúc thầy đổi cấu hình. */
export function quenCaVang(): void {
  caChuaLenMayChu.clear()
}

export function caDaBiGatCauDao(maCa: string): boolean {
  return caChuaLenMayChu.has(maCa)
}

/** Bộ nhớ tạm cấu hình. Sống ngắn để thầy gạt cờ là có tác dụng gần như ngay. */
const SONG_MS = 5000
let nhoCauHinh: { luc: number; ch: CauHinhMayChu } | null = null

// ---------------------------------------------------------------------------
// ĐỊA CHỈ MÁY CHỦ MỚI PHẢI TỚI ĐƯỢC MÁY EM
//
// Lỗi 11/09, thấy giữa ca thật 237124: máy nào KHÔNG phải máy thầy thì không có
// cấu hình trong IndexedDB, nên `BAT` luôn false và mọi lượt của em rơi về Apps
// Script — kể cả khi máy chủ mới đang chạy tốt. Tra D1 lúc ấy: ca có, mốc bắt
// đầu đã sang, mà 0 lượt thi · 0 em ở phòng chờ · 0 báo trạng thái.
//
// Cách chữa: nạp địa chỉ từ `public/cau-hinh.json` MỘT LẦN lúc khởi động app —
// đúng đường máy em vẫn dùng để biết link Apps Script — rồi cất vào IndexedDB.
// Đường nóng (vào thi, phòng chờ, lưu tạm, nộp) sau đó chỉ đọc IndexedDB.
//
// CẤM tải tệp ấy trong lượt vào thi: đó là cộng thêm một vòng mạng vào đúng
// chỗ không được phép chậm, và nhân lên 135 nhịp lưu tạm mỗi em.
let diaChiTuTep = ''

/** Chỉ dùng cho phép kiểm. */
export function quenDiaChiTuTep(): void {
  diaChiTuTep = ''
}

/** NẠP ĐỊA CHỈ CHO MÁY EM — gọi đúng một lần lúc khởi động app (`src/main.tsx`).
 *
 * Máy thầy đã có cấu hình riêng thì KHÔNG đụng vào, kể cả khi thầy CHỦ Ý TẮT
 * cờ: cờ tắt khẩn giữa ca thi phải còn nguyên tác dụng. */
let dangNap: Promise<void> | null = null

export function napDiaChiMayChuMoiChoEm(): Promise<void> {
  if (!dangNap) dangNap = napThat()
  return dangNap
}

async function napThat(): Promise<void> {
  const ch = await layCauHinhMayChu()
  if (ch.URL) return
  const url = await loadDiaChiMayChuMoiChoEm()
  if (!url) return
  diaChiTuTep = url
  const moi = chuanHoaMayChu({ ...ch, BAT: true, URL: url })
  await saveCauHinhMayChu(moi).catch(() => {})
  quenCauHinhMayChu()
}

/** CHỜ LƯỢT NẠP ĐỊA CHỈ LÚC KHỞI ĐỘNG XONG.
 *
 * Chỉ hai chỗ được dùng, và cả hai đều là lượt gọi ĐẦU TIÊN của một người:
 *   · phụ huynh mở link báo cáo (`layPhieu`);
 *   · em bấm Vào thi (`vaoThiQuaMayChuMoi`).
 *
 * Vì sao cần: `napDiaChiMayChuMoiChoEm()` chạy ở `main.tsx` và KHÔNG được chờ —
 * chờ nó là chặn lượt vẽ đầu tiên của app. Máy phụ huynh mở link lần đầu thì
 * màn báo cáo gọi `layPhieu` gần như cùng lúc; thua cuộc đua ấy là phụ huynh
 * rơi về Apps Script và ngồi nhìn 5 giây, đúng thứ cả việc này sinh ra để bỏ.
 *
 * Rẻ: tệp `cau-hinh.json` cùng gốc và đã nằm trong bộ nhớ đệm của service
 * worker. Chưa ai gọi nạp thì trả về ngay, không tự khởi động lượt nạp nào. */
export function xongNapDiaChi(): Promise<void> {
  return dangNap ?? Promise.resolve()
}

export async function layCauHinhMayChu(): Promise<CauHinhMayChu> {
  const nay = Date.now()
  if (nhoCauHinh && nay - nhoCauHinh.luc < SONG_MS) return nhoCauHinh.ch
  let ch = await loadCauHinhMayChu()
  // IndexedDB ghi hỏng (máy em ở chế độ riêng tư, hết chỗ) thì địa chỉ đọc được
  // lúc khởi động vẫn còn trong bộ nhớ — dùng nó, đừng bỏ em lại đường cũ.
  if (!ch.URL && diaChiTuTep) ch = chuanHoaMayChu({ ...ch, BAT: true, URL: diaChiTuTep })
  nhoCauHinh = { luc: nay, ch }
  return ch
}

/** Gọi sau khi thầy đổi cấu hình trong màn Cài đặt — bỏ bộ nhớ tạm. */
export function quenCauHinhMayChu(): void {
  nhoCauHinh = null
  caChuaLenMayChu.clear()
}

function ngu(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** Một lượt gọi Worker. Trả `null` cho MỌI trục trặc ⇒ chỗ gọi đi đường cũ.
 *
 * Thử lại có lùi kèm nhiễu: 30 em bấm cùng lúc mà thử lại đúng nhịp nhau là lại
 * húc cửa lần nữa. */
/** NHỊP CHO ĐƯỜNG NÓNG — bốn lệnh em gọi trong lúc thi.
 *
 * SỬA LỖI 11/09, trước ca thi thật. Bản đợt 3 dùng chung `HAN_GIAY = 10` và
 * `SO_LAN_THU = 3` cho mọi lệnh, nên khi Worker không với tới được thì máy em
 * chờ:
 *
 *     10s + 0,5s + 10s + 1,5s + 10s  ≈  32 GIÂY
 *
 * rồi MỚI bắt đầu đi Apps Script, tốn thêm 2,4–30 giây nữa. Cả lớp bấm Nộp
 * trong mười phút cuối mà Cloudflare chập một nhịp là em ngồi nhìn màn hình
 * hơn nửa phút — CHẬM HƠN HẲN so với khi chưa có máy chủ mới. Đây đúng là cái
 * bẫy duy nhất khiến việc chuyển máy chủ làm mọi thứ tệ đi.
 *
 * LUẬT CŨ (11/09): "Apps Script CHÍNH LÀ lượt thử lại" — còn đường lùi thì thử
 * ĐÚNG MỘT lần rồi lùi ngay, vì thử lại vào đúng cái máy chủ vừa im thì vô ích.
 *
 * LUẬT MỚI (12/09): KHÔNG CÒN ĐƯỜNG LÙI. Một lượt thử duy nhất với hạn 3 giây
 * nghĩa là một nhịp mạng chập của điện thoại em = hỏng hẳn, em đọc "Không kết
 * nối được máy chủ" giữa giờ thi. Nay phải thử lại đủ `SO_LAN_THU` lần: 3 lượt
 * × 3 giây + hai nhịp nghỉ ≈ 11 giây trường hợp xấu nhất, vẫn ngắn hơn hẳn 32
 * giây của bản đợt 3, mà không còn cửa hỏng vì một nhịp chập.
 *
 * `LUI_VE_APPS_SCRIPT` giữ trong cấu hình để bản ghi cũ trong IndexedDB đọc
 * được, nhưng KHÔNG còn ảnh hưởng tới nhịp. */
export function nhipNong(ch: CauHinhMayChu): { hanGiay: number; soLan: number } {
  return {
    hanGiay: ch.HAN_NONG_GIAY,
    soLan: Math.max(1, ch.SO_LAN_THU),
  }
}

export async function goiWorker<T = Record<string, unknown>>(
  ch: CauHinhMayChu,
  duong: string,
  than: unknown,
  nhip?: { hanGiay: number; soLan: number },
): Promise<T | null> {
  if (!ch.BAT || !ch.URL) return null
  const hanGiay = nhip?.hanGiay ?? ch.HAN_GIAY
  const soLan = Math.max(1, nhip?.soLan ?? ch.SO_LAN_THU)
  for (let lan = 0; lan < soLan; lan++) {
    if (lan > 0) await ngu(Math.round((500 * 3 ** (lan - 1)) * (0.6 + Math.random() * 0.8)))
    const bo = new AbortController()
    const hen = setTimeout(() => bo.abort(), hanGiay * 1000)
    try {
      const res = await fetch(`${ch.URL}${duong}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(than),
        signal: bo.signal,
      })
      // 4xx là máy chủ ĐÃ TRẢ LỜI, thử lại cũng thế — trả về luôn cho chỗ gọi xử.
      if (res.status >= 400 && res.status < 500) return (await res.json()) as T
      if (!res.ok) continue
      return (await res.json()) as T
    } catch {
      // mạng hỏng hoặc quá hạn — vòng sau
    } finally {
      clearTimeout(hen)
    }
  }
  return null
}

export interface KetQuaVaoThiMoi {
  ok: boolean
  cach?: 'moi' | 'khoi_phuc' | 'duyet_lai'
  lyDo?: string
  khoaLuot?: string
  lanThu?: number
  vaoLuc?: string
  hetGioLuc?: string
  thoiGianPhut?: number
  congBo?: string
  loai?: string
  hanNop?: string
  tenCa?: string
  nguongLan?: number
  nguongGiay?: number
  soCau?: { I: number; II: number; III: number }
  boTheoEm?: Record<string, string[]>
  deUrl?: string | null
  lop?: string
  giuDeDoc?: boolean
  anHanGiay?: number
  // Ba mốc giờ của lượt BỊ TỪ CHỐI. Thiếu chúng thì màn của em chỉ hiện câu
  // cụt "Em đã nộp bài ca này." mà không nói được lúc nào.
  nopLuc?: string
  batDau?: string
  hetHanVao?: string
  namSinh?: string
}

/** VÀO THI qua máy chủ. `null` ⇒ KHÔNG gọi được máy chủ (mạng hỏng, quá hạn).
 *
 * GỬI CẢ HỌ TÊN VÀ NĂM SINH: máy chủ cần hai trường này để ghi nhật ký chặn
 * vào. Thiếu chúng thì màn Chi tiết ca của Thầy chỉ thấy một số báo danh trần,
 * không biết em nào đứng ngoài cửa.
 *
 * KHÔNG còn nhánh "thiếu đề thì trả null": trước đây null nghĩa là đi Apps
 * Script, nay Apps Script không còn nên null chỉ làm mất lý do thật. Chỗ gọi
 * tự nói rõ thiếu gì. */
export async function vaoThiMoi(
  ch: CauHinhMayChu,
  maCa: string,
  sbd: string,
  idThietBi: string,
  danhTinh: { hoTen?: string; namSinh?: string; xacNhanTen?: boolean } = {},
): Promise<KetQuaVaoThiMoi | null> {
  if (!ch.BAT) return null
  await gianVaoThi(ch)
  return goiWorker<KetQuaVaoThiMoi>(
    ch,
    '/vao-thi',
    {
      maCa,
      sbd,
      idThietBi,
      hoTen: danhTinh.hoTen ?? '',
      namSinh: danhTinh.namSinh ?? '',
      // Em đã NHÌN THẤY tên của số báo danh mình gõ rồi mới bấm Bắt đầu (luật
      // thầy chốt 07/09). Máy chủ hiện không so tên nữa, nhưng cờ vẫn gửi để
      // nhật ký chặn vào ghi lại được em đã qua bước xác nhận hay chưa.
      xacNhanTen: danhTinh.xacNhanTen === true,
    },
    nhipNong(ch),
  )
}

export async function luuTamMoi(
  ch: CauHinhMayChu,
  maCa: string,
  sbd: string,
  dapAn: unknown,
  giayCau?: Record<string, number>,
): Promise<boolean | null> {
  if (caDaBiGatCauDao(maCa)) return null
  const r = await goiWorker<{ ok: boolean; lyDo?: string }>(ch, '/luu-tam', { maCa, sbd, dapAn, giayCau }, nhipNong(ch))
  if (!r) return null
  // Lượt không nằm ở máy chủ mới (em vào thi bằng đường cũ) ⇒ đi đường cũ, và
  // thôi hỏi lại cho cả ca này.
  if (!r.ok && r.lyDo === 'khong_dang_lam') {
    ghiNhanCaVang(maCa)
    return null
  }
  return !!r.ok
}

export async function nopMoi(
  ch: CauHinhMayChu,
  maCa: string,
  sbd: string,
  dapAn: unknown,
  integrity: unknown,
  giayCau?: Record<string, number>,
): Promise<{ ok: boolean; daNhan?: boolean; nopLuc?: string; congBo?: string; keyBank?: unknown } | null> {
  const r = await goiWorker<{ ok: boolean; lyDo?: string; daNhan?: boolean; nopLuc?: string; congBo?: string; keyBank?: unknown }>(ch, '/nop', {
    maCa,
    sbd,
    dapAn,
    integrity,
    giayCau,
  }, nhipNong(ch))
  if (!r) return null
  if (!r.ok && (r.lyDo === 'khong_tim_thay' || r.lyDo === 'thieu')) {
    ghiNhanCaVang(maCa)
    return null
  }
  return r
}

/** Nút "Thử kết nối" trong Cài đặt. Không dùng bộ nhớ tạm — thầy vừa gõ URL. */
export async function thuKetNoi(url: string): Promise<{ ok: boolean; chu: string }> {
  const ch = chuanHoaMayChu({ BAT: true, URL: url, HAN_GIAY: 8, SO_LAN_THU: 1 })
  if (!ch.BAT) return { ok: false, chu: 'Chưa điền địa chỉ máy chủ' }
  try {
    const res = await fetch(`${ch.URL}/khoe`, { method: 'GET' })
    const j = (await res.json()) as { ok?: boolean; coDB?: boolean; coR2?: boolean; coMat?: boolean }
    if (!j?.ok) return { ok: false, chu: 'Máy chủ trả lời nhưng không đúng dạng' }
    const thieu: string[] = []
    if (!j.coDB) thieu.push('chưa nối cơ sở dữ liệu')
    if (!j.coMat) thieu.push('chưa đặt mã bí mật')
    if (!j.coR2) thieu.push('chưa nối kho đề')
    return { ok: thieu.length === 0, chu: thieu.length === 0 ? 'Máy chủ sẵn sàng' : `Nối được, nhưng ${thieu.join(' · ')}` }
  } catch {
    return { ok: false, chu: 'Không gọi được máy chủ — kiểm tra lại địa chỉ' }
  }
}

// ---------------------------------------------------------------------------
// ĐỢT 3 — HAI LỆNH DÀY NHẤT CỦA MỘT CA
//
// Đếm thật trong một ca 45 phút, mỗi em:
//   đẩy trạng thái  270 lệnh  (10 giây một lần)
//   lưu tạm         135 lệnh  (20 giây một lần)
//   vào thi + nộp     2 lệnh
// Ba mươi em ⇒ 12.210 lệnh, trong đó 12.150 là hai lệnh trên — 99,5%.
//
// Vì vậy chuyển hai lệnh này đi là việc đáng giá nhất, và nó còn chữa gián tiếp
// cả chỗ treo lúc VÀO THI: vào thi vẫn ở Apps Script nhưng từ nay được dùng một
// mình toàn bộ sức máy chủ, không phải chen với 12.150 lệnh kia.
// ---------------------------------------------------------------------------

export interface TrangThaiEm {
  sbd: string
  maCa: string
  lop: string
  dangLam: boolean
  batDauLuc: string
  daLamCauHoi: number
  tongCauHoi: number
  soLanRoiApp: number
  blocked: boolean
}

/** ĐẨY TRẠNG THÁI LÀM BÀI. `null` ⇒ chỗ gọi đi Apps Script.
 *
 * Chỉ thử MỘT lần: nhịp sau tới sau mười giây, cố ở đây chỉ tổ giữ chân em. */
export async function trangThaiMoi(ch: CauHinhMayChu, tt: TrangThaiEm): Promise<boolean | null> {
  // Không cần tự kiểm cờ ở đây — `goiWorker` đã chốt `!ch.BAT || !ch.URL` ngay
  // dòng đầu. Thêm một chốt nữa chỉ tạo ra một dòng không phép kiểm nào chạm tới.
  const r = await goiWorker<{ ok: boolean }>(ch, '/trang-thai', tt, nhipNong(ch))
  return r ? !!r.ok : null
}

export interface PhongChoMoi {
  phongCho: boolean
  batDau: boolean
  batDauLuc: string
  trangThai: string
}

/** HỎI PHÒNG CHỜ. Đây là lúc ĐÔNG NHẤT cả ca — cả lớp đứng chờ và hỏi lại mỗi
 *  ba giây — nên gọi GET, một câu truy vấn, một lần thử. */
export async function phongChoMoi(ch: CauHinhMayChu, maCa: string): Promise<PhongChoMoi | null> {
  if (!ch.BAT || !ch.URL) return null
  if (caDaBiGatCauDao(maCa)) return null
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), ch.HAN_NONG_GIAY * 1000)
  try {
    const res = await fetch(`${ch.URL}/phong-cho?maCa=${encodeURIComponent(maCa)}`, { signal: bo.signal })
    if (!res.ok) return null
    const j = (await res.json()) as { ok?: boolean } & PhongChoMoi
    // Máy chủ TRẢ LỜI được nhưng không có ca ⇒ ca này chưa lên máy chủ mới.
    // Em đứng chờ hỏi lại mỗi ba giây — không gạt cầu dao là cả lớp nện một
    // lượt gọi thừa mỗi ba giây suốt lúc chờ.
    if (!j?.ok) {
      ghiNhanCaVang(maCa)
      return null
    }
    return { phongCho: !!j.phongCho, batDau: !!j.batDau, batDauLuc: String(j.batDauLuc ?? ''), trangThai: String(j.trangThai ?? '') }
  } catch {
    return null
  } finally {
    clearTimeout(hen)
  }
}
