// Gọi Apps Script Web App (doGet/doPost trong docs/apps-script-kiem-tra.gs).
// Dùng Content-Type: text/plain cho POST để tránh trình duyệt gửi preflight
// OPTIONS — Apps Script Web App không xử lý OPTIONS, preflight sẽ lỗi CORS
// nếu dùng application/json.
import type { PublicExamBank, SoCauMoiPhan, TeacherExamSource } from '../data/examContent'
import type { AnswerRecord, IntegrityLog } from './exam-db'
import type { CauHoiCuaEm, GoiCauHoi } from './hoi-bai'
import type { DiemMotCa } from './phieu-du-lieu'
import { LUAT_DIEM } from '../engine/score'
import { dongBoGioMayChu } from './gio-may-chu'
import { chuanTenCa } from './ten-ca'
import { cauLapCuaEm, demLapCuaEm, moGoiDeRieng } from './de-rieng-goi'
import { layCauHinhMayChu, luuTamMoi, nopMoi, phongChoMoi, trangThaiMoi, vaoThiMoi } from './may-chu-moi'
import { dayPhieuMoi, layPhieuMoi } from './phieu-may-chu-moi'
import { dayCaMoi } from './day-ca-may-chu-moi'
import { loadTeacherSecret } from './exam-db'

/** Ngân hàng gộp CÓ đáp án (chỉ dùng nội bộ cho tính năng "xem điểm ngay"). */
export interface KeyBank {
  phanI: TeacherExamSource['phanI']
  phanII: TeacherExamSource['phanII']
  phanIII: TeacherExamSource['phanIII']
  /** SỐ CÂU MỖI PHẦN của ca — mẫu số, KHÁC cỡ kho ở trên.
   *
   * Ca đề riêng rút 8/2/2 từ kho 26/9/9: `phanI.length` là 26, `soCau.I` là 8.
   * Lấy nhầm con số là chấm sai cả lô (ghi chú dài ở `ghiDiem`).
   *
   * Trường này VẪN LUÔN CÓ trong gói máy chủ trả về; kiểu cũ bỏ sót nên chỗ gọi
   * phải ép kiểu `(kb as { soCau?: … })` — ép kiểu thì trình biên dịch hết cửa
   * nhắc, và đó là cách một con số quan trọng lặng lẽ bị bỏ quên. */
  soCau?: SoCauMoiPhan
}

export interface SessionConfig {
  found: boolean
  maCa?: string
  lop?: string
  thoiGianPhut?: number
  bank?: PublicExamBank
}

/** Giới hạn chờ mặc định, tính bằng giây.
 *
 * LỖI ĐÃ DÍNH 04-09: nút "Copy link" đứng mãi ở "Đang tạo…". `fetch` KHÔNG tự
 * bỏ cuộc — mạng chập hoặc Apps Script nghẹn là lời hứa treo vĩnh viễn, nút
 * kẹt ở trạng thái đang chạy và thầy không biết nên chờ hay bấm lại. Mọi lệnh
 * gọi máy chủ từ nay đều có hạn, hết hạn thì báo thẳng. */
const HAN_GIAY = 25

/** `fetch` có hạn chờ. Không dùng thẳng AbortSignal.timeout vì Safari cũ
 * (iPhone đời trước) chưa có — tự dựng bằng AbortController cho chắc. */
async function fetchCoHan(url: string, init: RequestInit, giay: number): Promise<Response> {
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), giay * 1000)
  try {
    return await fetch(url, { ...init, signal: bo.signal })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error(`Máy chủ không trả lời sau ${giay} giây. Kiểm tra mạng rồi thử lại.`)
    }
    throw e
  } finally {
    clearTimeout(hen)
  }
}

/** HẠN CHỜ RIÊNG CHO `vaoThi` VÀ `submit` — KHACPHUCTREOHANGLOAT.md T5.
 *
 * Hai lệnh này là hai lệnh duy nhất mà cả lớp bấm CÙNG MỘT LÚC, nên chúng là
 * hai lệnh duy nhất phải xếp hàng sau khoá toàn cục. Hết hạn sớm là máy em gửi
 * lại, và lượt gửi lại ấy nối vào cuối chính hàng đợi đang tắc. Thà chờ thêm
 * năm giây. Mọi lệnh khác giữ 25 giây. */
const HAN_GIAY_DONG_NGUOI = 30

/** BA NHỊP THỬ LẠI, mili giây, chưa cộng nhiễu. T5: 0,5 s → 1,5 s → 4 s. */
const NHIP_THU_LAI_MS = [500, 1500, 4000]

/** NHIỄU ±40%. Không có nhiễu thì ba mươi máy cùng hỏng cùng lúc sẽ cùng thử
 * lại đúng nửa giây sau — vẫn là ba mươi máy húc cửa cùng lúc, chỉ muộn hơn
 * nửa giây. Nhiễu mới là thứ biến cú húc thành dòng chảy. */
export function nhipThuLai(lan: number, nn: () => number = Math.random): number {
  const nen = NHIP_THU_LAI_MS[Math.min(lan, NHIP_THU_LAI_MS.length - 1)]
  return Math.round(nen * (0.6 + nn() * 0.8))
}

/** LỖI CÓ ĐÁNG THỬ LẠI KHÔNG.
 *
 * Chỉ thử lại lỗi ĐƯỜNG TRUYỀN: hết hạn, mất mạng, máy chủ 5xx, máy chủ đang
 * bận không lấy được khoá. Máy chủ trả lời tử tế "sai số báo danh" hay "ca đã
 * khoá" thì thử lại một trăm lần cũng vậy — chỉ tổ làm nặng thêm đúng lúc đang
 * nghẽn. */
export function loiNenThuLai(loi: unknown): boolean {
  const s = loi instanceof Error ? loi.message : String(loi ?? '')
  return (
    s.includes('không trả lời sau') ||
    s.includes('Failed to fetch') ||
    s.includes('NetworkError') ||
    s.includes('Load failed') ||
    s.includes('HTTP 5') ||
    s.includes('đang bận')
  )
}

/** GỬI CÓ THỬ LẠI — chỉ dùng cho lệnh AN TOÀN KHI GỬI LẠI.
 *
 * "An toàn khi gửi lại" nghĩa là máy chủ có khoá chống trùng cho lệnh đó:
 *   · `vaoThi`  — gửi lại chỉ trả về đúng lượt đang có, không tạo lượt thứ hai;
 *   · `submit`  — khoá `maCa|sbd|lanThu`, gửi lại trả `daNhan:true`, không ghi đè;
 *   · `luuTam`  — ghi đè đúng một dòng bằng đúng nội dung ấy.
 *
 * CẤM dùng cho lệnh ghi chưa có khoá chống trùng (mục 4 của đặc tả). Thêm lệnh
 * mới vào đây thì phải chỉ ra được khoá của nó trước. */
async function postCoThuLai(scriptUrl: string, body: unknown, giay: number, soLan = NHIP_THU_LAI_MS.length): Promise<any> {
  let cuoi: unknown = null
  for (let lan = 0; lan < soLan; lan++) {
    try {
      return await postJson(scriptUrl, body, giay)
    } catch (e) {
      cuoi = e
      if (!loiNenThuLai(e) || lan === soLan - 1) throw e
      await new Promise((nghi) => setTimeout(nghi, nhipThuLai(lan)))
    }
  }
  throw cuoi instanceof Error ? cuoi : new Error('Không gửi được')
}

async function postJson(scriptUrl: string, body: unknown, giay: number = HAN_GIAY): Promise<any> {
  const res = await fetchCoHan(
    scriptUrl,
    {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    },
    giay,
  )
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const r = await res.json()
  // Mọi phản hồi có serverNow → hiệu chỉnh đồng hồ theo máy chủ ngay tại đây,
  // màn hình không phải nhớ gọi.
  if (r && typeof r.serverNow === 'number') dongBoGioMayChu(r.serverNow)
  return r
}

// ============================================================================
// VÀO THI — một SBD một lượt mỗi ca + 3 mốc thời gian (QUANLYCATHI.md mục 1, 3)
// ============================================================================

/** Lý do máy chủ KHÔNG cho vào (xem quyetDinhVaoThi_ trong Apps Script). */
export type LyDoChan =
  | 'khong_co_ca'
  | 'da_xoa'
  | 'da_dong'
  | 'dang_lam_may_khac'
  | 'da_nop'
  | 'chua_mo'
  | 'het_han_vao'
  | 'chua_co_ho_so'
  | 'khong_thuoc_khoi'
  | 'khong_trong_danh_sach'
  | 'sai_ho_so'
  /** Thầy cho thi lại và khoá theo máy cũ; em đang mở ở máy khác. */
  | 'sai_may'
  | 'thieu'

/** Phạm vi gửi ca (QUANLYCATHI mục 4): tu_do = ai có mã đều vào · khoi = theo
 * năm sinh (hồ sơ HocSinh) · chon = danh sách SBD thầy tích. Máy chủ kiểm tra. */
export type PhamViCa = 'tu_do' | 'khoi' | 'chon' | 'sbd'

/** Khối lớp suy từ năm sinh theo năm học hiện tại (vào lớp 1 lúc 6 tuổi; năm
 * học mới tính từ tháng 9). 2010 → lớp 11 trong năm học 2026–2027. */
export function khoiTuNamSinh(namSinh: string | number, now: Date = new Date()): number | null {
  const ns = Number(namSinh)
  if (!Number.isFinite(ns) || ns < 1990 || ns > now.getFullYear()) return null
  const namHoc = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  return namHoc - ns - 5
}

export type KetQuaVaoThi =
  | {
      ok: true
      /** PHÒNG CHỜ (thầy chốt 07/09): em qua hết cổng nhưng thầy chưa bấm "Bắt
       * đầu thi". Chưa có lượt, chưa có đề, đồng hồ chưa chạy. */
      cach: 'cho'
      lop: string
      thoiGianPhut: number
      congBo: CongBoDiem
      tenCa: string
    }
  | {
      ok: true
      /** moi = lượt mới · khoi_phuc = mở lại cùng máy (rớt mạng) · duyet_lai = thầy đã duyệt cho thi lại */
      cach: 'moi' | 'khoi_phuc' | 'duyet_lai'
      lop: string
      thoiGianPhut: number
      congBo: CongBoDiem
      lanThu: number
      vaoLuc: string
      hetGioLuc: string
      /** Ngưỡng chống gian lận của ca (QUANLYCATHI mục 6): số lần rời màn → khoá; một lần rời quá N giây → khoá. */
      nguongLan: number
      nguongGiay: number
      /** Bài tập về nhà: không đồng hồ đếm ngược, chỉ hiện hạn nộp; nộp muộn vẫn nhận. */
      loai: LoaiCa
      hanNop: string
      tenCa: string
      /** GIỮ ĐỂ ĐỌC (GIUDEDOC mục 3): đề chỉ hiện khi ngón tay em còn trên màn.
       * Ca cũ không có cột ⇒ false, hành vi giống hệt bản đang chạy. */
      giuDeDoc: boolean
      anHanGiay: number
      /** true = thầy vừa mở khoá lượt này (máy em còn giữ cờ khoá) → bỏ khoá, làm tiếp. */
      daMoKhoa: boolean
      bank?: PublicExamBank
      /** CÂU HỎI LẠI của CHÍNH EM NÀY — qid những câu em đã sai buổi trước và
       * được rút vào đề lần này (thầy chốt 08/09: "phải đánh dấu trong phần
       * làm bài thi những câu đã làm sai của ca trước đó").
       *
       * Máy chủ chỉ trả phần của em đang thi, không trả bản đồ cả lớp: gửi cả
       * bản đồ là mỗi em đọc được câu bạn từng sai. */
      cauLap?: string[]
      /** BỘ CÂU CỦA CHÍNH EM NÀY — qid đúng tờ đề em phải nhận.
       *
       * Thầy bắt được 08/09: lệnh này gửi kho đề mà KHÔNG kèm bản đồ, nên máy
       * em cắt 28 câu theo luật hash còn máy thầy chấm theo bản đồ. Hai tờ đề
       * khác nhau ⇒ điểm sai và không câu hỏi lại nào vào được đề.
       *
       * Về ở TRƯỜNG RIÊNG chứ không chỉ trong `bank`: máy em có thể đã cất kho
       * đề từ lần vào trước, lúc đó `bank` không về mà bản đồ vẫn phải tới. */
      boCuaEm?: string[]
      /** qid → SỐ LẦN em đã sai câu đó TRƯỚC ca này. Nguồn của nhãn "sai lần
       * thứ N" và mục "Đã sửa được" trong báo cáo em xem ngay sau khi nộp. */
      demLap?: Record<string, number>
    }
  | { ok: false; lyDo: LyDoChan; nopLuc?: string; lanThu?: number; batDau?: string; hetHanVao?: string; namSinh?: string; error?: string }

/** Xin vào thi: máy chủ kiểm tra (mã ca, SBD, id thiết bị) rồi tạo/khôi phục
 * lượt và trả mốc giờ (vaoLuc, hetGioLuc theo giờ máy chủ). canBank=true khi
 * máy em chưa có đề trong cache → nhận luôn đề (không đáp án) trong cùng 1 lượt gọi. */
/** Danh tính gửi kèm khi vào thi.
 *
 * `xacNhanTen` = em đã NHÌN THẤY tên của số báo danh mình gõ trên màn xác nhận
 * và bấm Bắt đầu. Khi đó máy chủ không so tên và năm sinh nữa — cổng còn lại là
 * "số báo danh phải nằm trong danh sách lớp". */
export interface DanhTinhVaoThi {
  hoTen: string
  namSinh: string
  xacNhanTen?: boolean
}

export interface TenTheoSbd {
  sbd: string
  hoTen: string
  lop: string
  tenCa: string
}

/** TRA TÊN TỪ SỐ BÁO DANH cho màn xác nhận trước khi vào thi (thầy chốt 07/09).
 *
 * Gói gửi đi chỉ có mã ca và số báo danh; máy chủ trả về HỌ TÊN và lớp, không
 * trả năm sinh, không trả số điện thoại. */
export async function tenTheoSbd(scriptUrl: string, maCa: string, sbd: string): Promise<TenTheoSbd> {
  const r = await postJson(scriptUrl, { action: 'tenTheoSbd', maCa, sbd })
  if (!r.ok) throw new Error(r.error || 'Không tra được số báo danh')
  return {
    sbd: String(r.sbd ?? sbd),
    hoTen: String(r.hoTen ?? ''),
    lop: String(r.lop ?? ''),
    tenCa: String(r.tenCa ?? ''),
  }
}

export interface TrangThaiPhongCho {
  phongCho: boolean
  /** Thầy đã bấm "Bắt đầu thi" chưa. */
  batDau: boolean
  batDauLuc: string
  trangThai: string
}

/** MÁY EM HỎI LẠI: thầy bấm bắt đầu chưa. Lệnh nhẹ nhất có thể — em đang đứng
 * chờ và hỏi vài giây một lần. Ca bị thầy huỷ giữa lúc chờ thì ném lỗi để màn
 * chờ nói thẳng, đừng để em đứng mãi. */
export async function trangThaiPhongCho(scriptUrl: string, maCa: string): Promise<TrangThaiPhongCho> {
  // MÁY CHỦ MỚI TRƯỚC. Cả lớp đứng chờ và hỏi lại mỗi ba giây — đây là nhịp dày
  // nhất của cả ca. Máy chủ mới không trả lời được thì rơi về Apps Script ngay
  // trong chính lượt này, em không thấy gì khác ngoài việc chậm hơn một nhịp.
  const chMoi = await layCauHinhMayChu()
  const rMoi = await phongChoMoi(chMoi, maCa)
  if (rMoi) return rMoi

  const r = await postJson(scriptUrl, { action: 'trangThaiPhongCho', maCa })
  if (!r.ok) throw new Error(r.error || 'Không hỏi được trạng thái ca')
  return {
    phongCho: r.phongCho === true,
    batDau: r.batDau === true,
    batDauLuc: String(r.batDauLuc ?? ''),
    trangThai: String(r.trangThai ?? ''),
  }
}

/** CHO MỘT EM THI LẠI — xoá lịch sử lượt cũ, khoá đúng máy cũ, nhận đề mới.
 *
 * Thầy chốt 08/09: "nút cho thi lại sẽ xoá lịch sử của bài thi trước, khi bấm
 * cho thi lại học sinh đăng nhập đúng máy đã thi trước và rút lại đề mới".
 *
 * KHÁC `duyetThiLai`: lệnh đó chỉ thêm một lượt, lượt cũ còn nguyên và em thi
 * "lần 2". Lệnh này xoá hẳn lượt cũ, chi tiết từng câu, bản đồ sai và tổng hợp
 * chuyên đề của ca — chỉ chừa lại phiếu đã dựng, vì link phiếu có thể đã gửi
 * phụ huynh. */
export async function choThiLai(
  scriptUrl: string,
  secret: string,
  maCa: string,
  sbd: string,
  boCauMoi: string[],
  lapMoi?: string[],
): Promise<{ soLuotXoa: number; soCauXoa: number; khoaMay: boolean; daDoiDe: boolean }> {
  const r = await postJson(scriptUrl, { action: 'choThiLai', secret, maCa, sbd, boCauMoi, lapMoi })
  if (!r.ok) throw new Error(r.error || 'Không cho thi lại được')
  return { soLuotXoa: Number(r.soLuotXoa) || 0, soCauXoa: Number(r.soCauXoa) || 0, khoaMay: r.khoaMay === true, daDoiDe: r.daDoiDe === true }
}

/** BẢN ĐỒ SAI TỪNG CÂU của mấy ca, đọc MỘT LƯỢT từ máy chủ.
 *
 * Thầy chốt 08/09: "Ca thi nào cũng phải dựng sẵn bản đồ sai từng câu". Máy
 * chủ ghi bản đồ ngay lúc chấm, nên chế độ đề riêng không phải chấm lại từng
 * ca cũ ở máy thầy — máy nào cũng dựng đề được, kể cả máy chưa từng mở ca đó.
 *
 * Trả `{ maCa: { sai: {sbd:[qid]}, lam: {sbd:[qid]} } }`. Ca chưa có bản đồ
 * trả hai bản đồ rỗng, chỗ gọi tự biết phải dựng lại bằng cách cũ. */
export async function banDoSaiCa(
  scriptUrl: string,
  secret: string,
  dsMaCa: string[],
): Promise<Record<string, { sai: Record<string, string[]>; lam: Record<string, string[]> }>> {
  const ds = dsMaCa.map((x) => String(x || '').trim()).filter(Boolean)
  if (ds.length === 0) return {}
  const r = await postJson(scriptUrl, { action: 'banDoSaiCa', secret, dsMaCa: ds })
  if (!r.ok) throw new Error(r.error || 'Không đọc được bản đồ sai')
  const ra: Record<string, { sai: Record<string, string[]>; lam: Record<string, string[]> }> = {}
  const goc = (r.ca ?? {}) as Record<string, { sai?: Record<string, string[]>; lam?: Record<string, string[]> }>
  for (const [ma, v] of Object.entries(goc)) ra[ma] = { sai: v?.sai ?? {}, lam: v?.lam ?? {} }
  return ra
}

/** NỐI THÊM CÂU VÀO KHO CỦA MỘT CA — chỉ dùng cho đề riêng từng em.
 *
 * Câu em từng sai có thể nằm ngoài kho thầy vừa rút cho ca. Muốn hỏi lại đúng
 * câu đó thì phải nối nó vào kho của ca trước khi phát đề (thầy chốt 08/09:
 * "bất kể là tôi chọn chuyên đề gì thi mà ca trước sai 9 câu phải rút đúng 3
 * câu đó ra vào đề mới").
 *
 * Máy chủ CHẶN khi ca đã bấm Bắt đầu: lúc đó kho là thứ em đang cầm. */
export async function noiKhoCa(
  scriptUrl: string,
  secret: string,
  maCa: string,
  bank: PublicExamBank,
  keyBank: { phanI: TeacherExamSource['phanI']; phanII: TeacherExamSource['phanII']; phanIII: TeacherExamSource['phanIII'] },
): Promise<{ themBank: number; themKey: number }> {
  const r = await postJson(scriptUrl, { action: 'noiKhoCa', secret, maCa, bank, keyBank })
  if (!r.ok) throw new Error(r.error || 'Không nối được kho ca')
  return { themBank: Number(r.themBank) || 0, themKey: Number(r.themKey) || 0 }
}

/** THẦY BẤM BẮT ĐẦU THI. Từ giây đó máy em mới xin đề và đồng hồ mới chạy.
 * Bấm lần hai giữ mốc lần đầu — không kéo dài giờ của em đã vào. */
export async function batDauThi(
  scriptUrl: string,
  secret: string,
  maCa: string,
  /** ĐỀ RIÊNG TỪNG EM: bản đồ sbd → qid, dựng từ danh sách em ĐANG CHỜ và gửi
   * kèm đúng lúc bấm Bắt đầu. Máy chủ ghi bản đồ TRƯỚC khi ghi mốc giờ, nên
   * không em nào nhận đề trước khi bản đồ có mặt. */
  boTheoEm?: Record<string, string[]>,
  /** sbd → qid CÂU HỎI LẠI trong đề em đó. Gửi ở TRƯỜNG RIÊNG, không trộn vào
   * `boTheoEm`.
   *
   * VÌ SAO TÁCH: máy chủ bản cũ ghi thẳng `body.boTheoEm` xuống ô. Trộn hai
   * bản đồ vào đó là máy chủ chưa cập nhật ghi xuống một cấu trúc nó không
   * hiểu, `boTheoEm[sbd]` thành `undefined`, và em nhận bộ câu cắt theo luật
   * hash — tức LỆCH ĐỀ giữa máy em và bảng chấm của thầy, không có dấu hiệu
   * gì. Tách ra thì máy chủ cũ ghi đúng như hôm nay và chỉ thiếu phần đánh
   * dấu; máy chủ mới gói hai bản đồ lại. */
  lapTheoEm?: Record<string, string[]>,
  /** sbd → qid → số lần em đã sai câu đó TRƯỚC ca này. */
  demSaiTheoEm?: Record<string, Record<string, number>>,
  /** BIÊN BẢN lúc rút. Đi lên máy chủ để MÁY NÀO mở ca cũng đọc được, không
   * phải đúng cái máy đã bấm Bắt đầu (thầy chốt 08/09: "máy nào cũng được"). */
  bienBan?: Record<string, unknown> | null,
): Promise<{ batDauLuc: string; daBatTruoc: boolean; thieuBoTheoEm: boolean }> {
  const r = await postJson(scriptUrl, { action: 'batDauThi', secret, maCa, boTheoEm, lapTheoEm, demSaiTheoEm, bienBan })
  if (!r.ok) throw new Error(r.error || 'Không bắt đầu được ca')

  // ĐẨY MỐC BẮT ĐẦU VÀ BẢN ĐỒ ĐỀ RIÊNG sang máy chủ mới.
  //
  // Thiếu bước này thì em ở phòng chờ bên máy chủ mới không bao giờ được phát
  // đề: `/vao-thi` xem `bat_dau_thi_luc` còn rỗng nên giữ em lại mãi.
  try {
    const chMoi = await layCauHinhMayChu()
    await dayCaMoi(chMoi, secret, {
      maCa,
      batDauThiLuc: String(r.batDauLuc ?? ''),
      boTheoEm: boTheoEm ? { bo: boTheoEm, lap: lapTheoEm ?? {}, dem: demSaiTheoEm ?? {}, bb: bienBan ?? null } : undefined,
    })
  } catch {
    // không chặn việc bắt đầu ca
  }
  return {
    batDauLuc: String(r.batDauLuc ?? ''),
    daBatTruoc: r.daBatTruoc === true,
    // CA ĐỀ RIÊNG ĐÃ BẮT ĐẦU MÀ MÁY CHỦ KHÔNG CÓ BẢN ĐỒ. Em đang cầm đề cắt
    // theo luật hash, còn máy thầy chấm theo bản đồ ⇒ điểm sai. Phải hét lên,
    // không được nuốt.
    thieuBoTheoEm: r.daBatTruoc === true && r.canBoTheoEm === true && r.coBoTheoEm === false,
  }
}

/** VÀO THI QUA MÁY CHỦ MỚI — dịch câu trả lời của Worker sang đúng dáng
 * `KetQuaVaoThi` mà toàn bộ màn làm bài đang đọc.
 *
 * TRẢ `null` NGHĨA LÀ "ĐI ĐƯỜNG CŨ". Mọi chỗ không chắc đều trả `null`, vì một
 * lượt chậm hơn thì em chỉ chờ thêm hai giây, còn một lượt SAI ĐỀ thì điểm của
 * em sai mà không ai thấy.
 *
 * CHỖ NGUY HIỂM NHẤT, và vì sao nó được canh riêng: ca ĐỀ RIÊNG. Máy em cắt đề
 * theo `boCuaEm`; máy thầy chấm theo bản đồ trên máy chủ. Hai bên lệch nhau là
 * điểm sai LẶNG LẼ — đúng lỗi đã làm em 12124 tụt từ 5,69 xuống 2,56 hôm 10/09.
 * Nên: ca có bản đồ mà bản đồ KHÔNG có phần của chính em này ⇒ trả `null`, đi
 * đường cũ, chấp nhận chậm. */
async function vaoThiQuaMayChuMoi(
  maCa: string,
  sbd: string,
  idThietBi: string,
  canBank: boolean,
): Promise<KetQuaVaoThi | null> {
  const ch = await layCauHinhMayChu()
  if (!ch.BAT) return null
  const r = await vaoThiMoi(ch, maCa, sbd, idThietBi, canBank)
  if (!r) return null

  if (!r.ok) {
    // Máy chủ mới TỪ CHỐI có lý do rõ ⇒ tin và báo cho em. Đây là câu trả lời,
    // không phải sự cố.
    return { ok: false, lyDo: (r.lyDo ?? 'thieu') as never, lanThu: r.lanThu }
  }

  if (r.cach === undefined) return null

  // PHÒNG CHỜ. Thầy chưa bấm Bắt đầu: chưa có lượt, chưa có đề, đồng hồ chưa
  // chạy cho ai. Dáng trả về KHÁC HẲN nhánh vào thi thật — thiếu nhánh này thì
  // màn chờ nhận một gói có `lanThu` và `hetGioLuc` rỗng rồi dựng đề từ hư
  // không.
  if ((r.cach as string) === 'cho') {
    return {
      ok: true,
      cach: 'cho',
      lop: String((r as { lop?: string }).lop ?? ''),
      thoiGianPhut: Number(r.thoiGianPhut) || 45,
      congBo: (r.congBo ?? 'khong') as CongBoDiem,
      tenCa: String(r.tenCa ?? ''),
    }
  }

  const goi = (r.boTheoEm ?? null) as { bo?: Record<string, string[]>; lap?: Record<string, string[]>; dem?: Record<string, Record<string, number>> } | null
  const coBanDo = !!goi && !!goi.bo && Object.keys(goi.bo).length > 0
  const boEm = coBanDo ? goi!.bo![sbd] : undefined
  // CA ĐỀ RIÊNG MÀ THIẾU PHẦN CỦA EM ⇒ đi đường cũ. Xem ghi chú trên.
  if (coBanDo && (!Array.isArray(boEm) || boEm.length === 0)) return null

  // GÓI ĐỀ. Em chưa có bản trên máy mà máy chủ mới không đưa được ⇒ đường cũ.
  let bank: PublicExamBank | undefined
  if (canBank) {
    if (!r.deUrl) return null
    try {
      const res = await fetch(`${ch.URL}${r.deUrl}`)
      if (!res.ok) return null
      bank = (await res.json()) as PublicExamBank
    } catch {
      return null
    }
    if (!bank) return null
  }

  return {
    ok: true,
    cach: r.cach,
    lop: String((r as { lop?: string }).lop ?? ''),
    thoiGianPhut: Number(r.thoiGianPhut) || 45,
    congBo: (r.congBo ?? 'khong') as CongBoDiem,
    lanThu: Number(r.lanThu) || 1,
    vaoLuc: String(r.vaoLuc ?? ''),
    hetGioLuc: String(r.hetGioLuc ?? ''),
    nguongLan: Number(r.nguongLan) || 3,
    nguongGiay: Number(r.nguongGiay) || 10,
    loai: r.loai === 'baitap' ? 'baitap' : 'thi',
    hanNop: String(r.hanNop ?? ''),
    tenCa: String(r.tenCa ?? ''),
    giuDeDoc: (r as { giuDeDoc?: boolean }).giuDeDoc === true,
    anHanGiay: Number((r as { anHanGiay?: number }).anHanGiay) || 0,
    daMoKhoa: false,
    bank,
    cauLap: cauLapCuaEm(goi?.lap?.[sbd]),
    boCuaEm: cauLapCuaEm(boEm),
    demLap: demLapCuaEm(goi?.dem?.[sbd], cauLapCuaEm(goi?.lap?.[sbd])),
  }
}

export async function vaoThi(
  scriptUrl: string,
  maCa: string,
  sbd: string,
  idThietBi: string,
  canBank: boolean,
  danhTinh: DanhTinhVaoThi = { hoTen: '', namSinh: '' },
): Promise<KetQuaVaoThi> {
  // ── MÁY CHỦ MỚI TRƯỚC ────────────────────────────────────────────────────
  //
  // Đây là lệnh MỞ KHOÁ cho cả đường nóng: `luu-tam` và `nop` chỉ cập nhật dòng
  // lượt do `/vao-thi` tạo ra, nên vào thi còn ở Apps Script thì hai lệnh kia
  // nằm im và mọi thứ lùi về đường cũ.
  //
  // MỌI trục trặc trả `null` ⇒ rơi xuống đúng đường Apps Script bên dưới, cho
  // ĐÚNG lượt đó. Em không bao giờ kẹt vì máy chủ mới.
  try {
    const kqMoi = await vaoThiQuaMayChuMoi(maCa, sbd, idThietBi, canBank)
    if (kqMoi) return kqMoi
  } catch {
    // rơi xuống đường cũ
  }

  // THỬ LẠI ĐƯỢC (T5): máy chủ đã có khoá — gửi lại chỉ trả về đúng lượt đang
  // có (`cach: 'khoi_phuc'`), không bao giờ tạo lượt thứ hai cho cùng một em.
  const r = await postCoThuLai(scriptUrl, { action: 'vaoThi', maCa, sbd, idThietBi, canBank, hoTen: danhTinh.hoTen, namSinh: danhTinh.namSinh, xacNhanTen: danhTinh.xacNhanTen === true }, HAN_GIAY_DONG_NGUOI)
  if (r.ok) {
    return {
      ok: true,
      cach: r.cach,
      lop: String(r.lop ?? ''),
      thoiGianPhut: Number(r.thoiGianPhut) || 45,
      congBo: r.congBo ?? 'khong',
      lanThu: Number(r.lanThu) || 1,
      vaoLuc: String(r.vaoLuc),
      hetGioLuc: String(r.hetGioLuc),
      nguongLan: Number(r.nguongLan) || 3,
      nguongGiay: Number(r.nguongGiay) || 10,
      loai: r.loai === 'baitap' ? 'baitap' : 'thi',
      hanNop: String(r.hanNop ?? ''),
      tenCa: String(r.tenCa ?? ''),
      giuDeDoc: r.giuDeDoc === true,
      anHanGiay: Number(r.anHanGiay) || 0,
      daMoKhoa: r.daMoKhoa === true,
      bank: r.bank ?? undefined,
      cauLap: cauLapCuaEm(r.cauLap),
      boCuaEm: cauLapCuaEm(r.boCuaEm),
      demLap: demLapCuaEm(r.demLap, cauLapCuaEm(r.cauLap)),
    }
  }
  return { ok: false, lyDo: r.lyDo ?? 'thieu', nopLuc: r.nopLuc, lanThu: r.lanThu, batDau: r.batDau, hetHanVao: r.hetHanVao, namSinh: r.namSinh, error: r.error }
}

/** Thông điệp cho học sinh khi bị chặn — nêu rõ lý do + việc cần làm, không vòng vo. */
export function thongDiepChan(kq: Extract<KetQuaVaoThi, { ok: false }>, gio: (iso: string) => string): string {
  switch (kq.lyDo) {
    case 'khong_co_ca':
      return 'Không tìm thấy ca kiểm tra — kiểm tra lại mã ca.'
    case 'da_xoa':
      return 'Ca kiểm tra này đã bị thầy xoá.'
    case 'da_dong':
      return 'Ca kiểm tra này đã đóng.'
    case 'dang_lam_may_khac':
      return 'Số báo danh này đang làm bài ở máy khác. Nếu đúng là em, mở lại trên máy đã bắt đầu; nếu không, báo thầy ngay.'
    case 'sai_may':
      return 'Thầy cho em thi lại trên ĐÚNG máy em đã thi lần trước. Mở lại link trên máy đó, hoặc báo thầy.'
    case 'da_nop':
      return `Em đã nộp bài ca này${kq.nopLuc ? ` lúc ${gio(kq.nopLuc)}` : ''}${kq.lanThu && kq.lanThu > 1 ? ` (lần ${kq.lanThu})` : ''}. Muốn thi lại, xin thầy duyệt.`
    case 'chua_mo':
      return `Ca thi chưa mở${kq.batDau ? ` — bắt đầu lúc ${gio(kq.batDau)}` : ''}. Đợi đến giờ rồi bấm Vào thi lại.`
    case 'het_han_vao':
      return `Đã quá giờ vào phòng thi${kq.hetHanVao ? ` (hết hạn ${gio(kq.hetHanVao)})` : ''} — mã ca không còn hiệu lực.`
    case 'chua_co_ho_so':
      return `Ca này chỉ dành cho khối ${khoiTuNamSinh(kq.namSinh ?? '') ?? '?'} (sinh ${kq.namSinh}) — em chưa đăng ký hồ sơ (năm sinh). Vào mục Hồ sơ đăng ký rồi bấm Vào thi lại.`
    case 'khong_thuoc_khoi':
      return `Ca này dành cho khối ${khoiTuNamSinh(kq.namSinh ?? '') ?? '?'} (sinh ${kq.namSinh}). Số báo danh của em không thuộc khối này.`
    case 'khong_trong_danh_sach':
      return 'Số báo danh của em không có trong danh sách lớp của ca này. Kiểm tra lại đúng như Thầy ghi trong sổ; vẫn không vào được thì báo Thầy.'
    // KHÔNG nói rõ sai ở ô nào: nói ra là cho phép dò tên từ số báo danh.
    case 'sai_ho_so':
      return 'Số báo danh, họ tên hoặc năm sinh không khớp danh sách lớp. Kiểm tra lại đúng như Thầy ghi trong sổ; vẫn không vào được thì báo Thầy.'
    default:
      return kq.error || 'Không vào được ca thi.'
  }
}

/** Thầy MỞ KHOÁ lượt bị khoá vì rời màn (mục 6): trạng thái về dang_lam, em mở lại link trên cùng máy là làm tiếp. */
export async function moKhoa(scriptUrl: string, secret: string, maCa: string, sbd: string, nguoiMo = 'thầy'): Promise<void> {
  const r = await postJson(scriptUrl, { action: 'moKhoa', secret, maCa, sbd, nguoiMo })
  if (!r.ok) throw new Error(r.error || 'Không mở khoá được')
}

/** Thầy cho 1 em thi lại (cần mã bí mật) — máy chủ tạo lượt mới trạng thái duoc_duyet_lai. */
export async function duyetThiLai(scriptUrl: string, secret: string, maCa: string, sbd: string, nguoiDuyet = 'thầy'): Promise<number> {
  const r = await postJson(scriptUrl, { action: 'duyetThiLai', secret, maCa, sbd, nguoiDuyet })
  if (!r.ok) throw new Error(r.error || 'Không duyệt được')
  return Number(r.lanThu) || 1
}

/** Cách công bố điểm cho học sinh của 1 ca:
 * - khong: không công bố trên máy em — thầy chấm ở màn Theo dõi rồi gửi nhận xét.
 * - ngay: server trả keyBank (CÓ đáp án) ĐÚNG 1 LẦN trong response lần nộp của
 *   chính em đó (submitAnswers) — không có cách lấy đáp án trước khi nộp.
 * - ca_lop_xong: em nộp xong chỉ thấy "đang chờ cả lớp"; app tự hỏi lại
 *   (fetchKetQua) và server chỉ trả keyBank khi MỌI em đã vào thi đều đã nộp,
 *   hoặc mọi em đều đã hết giờ — tránh em nộp sớm đọc đáp án cho em đang làm.
 * Hai chế độ sau đều gửi keyBank lên máy chủ — thầy tự cân nhắc. */
export type CongBoDiem = 'khong' | 'ngay' | 'ca_lop_xong'

/** 3 mốc thời gian của ca (QUANLYCATHI.md mục 3). batDau/hetHanVao là ISO
 * tuyệt đối; rỗng = "mở ngay" (máy chủ lấy giờ của nó) / "không giới hạn giờ
 * vào". Thời lượng (phút) tính từ lúc TỪNG EM vào, không phải giờ chung. */
export interface MocThoiGianCa {
  batDau?: string
  hetHanVao?: string
  /** Số phút sau BẮT ĐẦU (tính theo giờ máy chủ) còn cho vào phòng — ưu tiên hơn hetHanVao. 0/undefined = dùng hetHanVao (rỗng = không giới hạn). */
  hanVaoPhut?: number
  tenCa?: string
  /** Phạm vi gửi ca (mục 4). khoi → danhSachMoi = năm sinh (chuỗi) · chon → danhSachMoi = mảng SBD. */
  phamVi?: PhamViCa
  danhSachMoi?: string | string[]
  /** Chống gian lận theo mức (mục 6): rời màn lần thứ N → khoá; rời quá N giây → khoá. Trống = mặc định máy chủ (3 / 30). */
  nguongLan?: number
  nguongGiay?: number
  /** BA-APP đợt 3: 'baitap' = bài tập về nhà (không đồng hồ, nộp muộn vẫn nhận,
   * xem lời giải ngay). Trống/'thi' = ca kiểm tra như cũ. */
  loai?: LoaiCa
  /** Hạn nộp bài tập (ISO). Chỉ có nghĩa với loai='baitap'. */
  hanNop?: string
  /** NÚT GẠT "dùng ca này để gọi lên bảng" (thầy chốt 05/09 chiều).
   *
   * Bật  — ca hiện ở màn Gọi lên bảng để rút câu chữa và phân công em.
   * Tắt  — ca chỉ để gửi phiếu phụ huynh và cộng dồn mạnh/yếu, không hiện ở
   *        màn đó nữa. Cờ KHÔNG đụng gì tới dữ liệu ghi xuống: điểm, chi tiết
   *        câu, chuyên đề vẫn ghi y hệt ở cả hai trạng thái.
   *
   * Trống = BẬT. Mọi ca mở trước 05/09 không có cột này nên phải hiện tiếp. */
  lenBang?: boolean
  /** GIỮ ĐỂ ĐỌC (GIUDEDOC mục 3). Trống = TẮT — ca mở trước bản này phải giữ
   * nguyên hành vi cũ. `anHanGiay` là một trong 2 / 3 / 5 / 10. */
  giuDeDoc?: boolean
  anHanGiay?: number
  /** PHÒNG CHỜ (thầy chốt 07/09): em vào ca thì đứng ở màn chờ, chưa nhận đề.
   * Cả lớp nhận đề đúng một thời điểm khi thầy bấm "Bắt đầu thi". */
  phongCho?: boolean
  /** ĐỀ RIÊNG TỪNG EM. Cờ này phải lên MÁY CHỦ, không nằm lại ở máy mở ca:
   * mở ca ở điện thoại rồi bấm Bắt đầu trên máy tính thì máy tính mới biết
   * phải rút bộ câu riêng (thầy bắt được ở ca 933467, 08/09). */
  deRieng?: boolean
  /** Lấy câu sai của ca gần nhất hay gộp 3 ca gần nhất (thầy chốt 08/09). */
  phamViHoiLai?: 'gan_nhat' | 'ba_ca'
}

/** Loại ca: kiểm tra hay bài tập về nhà. Dùng CHUNG mọi thứ, khác nhau bằng cờ này. */
export type LoaiCa = 'thi' | 'baitap'

export async function publishSession(
  scriptUrl: string,
  maCa: string,
  lop: string,
  thoiGianPhut: number,
  bank: PublicExamBank,
  congBoDiem: CongBoDiem = 'khong',
  keyBank?: KeyBank,
  moc: MocThoiGianCa = {},
): Promise<{ batDau: string; hetHanVao: string }> {
  const result = await postJson(scriptUrl, {
    action: 'publish',
    maCa,
    lop,
    thoiGianPhut,
    bank,
    // Cột ImmediateFeedback trên sheet: 'true' | 'false' | 'calop' (bản cũ chỉ có true/false).
    immediateFeedback: congBoDiem === 'ngay' ? true : congBoDiem === 'ca_lop_xong' ? 'calop' : false,
    keyBank: congBoDiem === 'khong' ? undefined : keyBank,
    batDau: moc.batDau || '',
    hetHanVao: moc.hetHanVao || '',
    hanVaoPhut: moc.hanVaoPhut || 0,
    tenCa: moc.tenCa || '',
    phamVi: moc.phamVi || 'tu_do',
    // Chế độ 'sbd' KHÔNG có danh sách riêng: cổng của nó là DanhSachLop trên
    // máy chủ, nên không gửi gì lên.
    danhSachMoi: moc.phamVi === 'chon' ? (Array.isArray(moc.danhSachMoi) ? moc.danhSachMoi : []) : moc.phamVi === 'khoi' ? String(moc.danhSachMoi ?? '') : '',
    loai: moc.loai || 'thi',
    hanNop: moc.hanNop || '',
    nguongLan: moc.nguongLan || 0,
    nguongGiay: moc.nguongGiay || 0,
    lenBang: moc.lenBang !== false,
    giuDeDoc: moc.giuDeDoc === true,
    anHanGiay: moc.giuDeDoc === true ? moc.anHanGiay || 3 : 0,
    phongCho: moc.phongCho === true,
    deRieng: moc.deRieng === true,
    phamViHoiLai: moc.phamViHoiLai === 'ba_ca' ? 'ba_ca' : 'gan_nhat',
  })
  if (!result.ok) throw new Error(result.error || 'Mở ca kiểm tra thất bại')

  // ĐẨY CA LÊN MÁY CHỦ MỚI. Không có bước này thì D1 không có ca nào, mà
  // `/vao-thi` cần ca trong D1 — nên cả đường nóng nằm im và mọi lệnh lùi về
  // Apps Script.
  //
  // `bank` ở đây là bản KHÔNG ĐÁP ÁN (`PublicExamBank`), đúng thứ Worker phục
  // vụ công khai ở `/de/:maCa`. Đẩy bản có đáp án lên đó là phát đáp án cả lớp.
  //
  // HỎNG THÌ BỎ QUA: ca đã mở thật ở dòng trên rồi. Đây chỉ là chỗ chạy nhanh.
  try {
    const chMoi = await layCauHinhMayChu()
    // Lấy mã bí mật từ kho của CHÍNH MÁY THẦY. `publishSession` không nhận mã
    // trong chữ ký, và đổi chữ ký lúc này là chạm vào mọi chỗ gọi — trong khi
    // mã vẫn đang nằm sẵn ở đúng chỗ mọi lệnh của thầy vẫn đọc.
    const matThay = await loadTeacherSecret()
    await dayCaMoi(
      chMoi,
      matThay,
      {
        maCa,
        tenCa: moc.tenCa || '',
        trangThai: 'mo',
        batDau: String(result.batDau || ''),
        hetHanVao: String(result.hetHanVao || ''),
        thoiGianPhut,
        loai: moc.loai || 'thi',
        hanNop: moc.hanNop || '',
        congBo: congBoDiem,
        nguongLan: moc.nguongLan || 0,
        nguongGiay: moc.nguongGiay || 0,
        lop,
        phongCho: moc.phongCho === true,
        giuDeDoc: moc.giuDeDoc === true,
        anHanGiay: moc.giuDeDoc === true ? moc.anHanGiay || 3 : 0,
      },
      bank,
    )
  } catch {
    // không chặn việc mở ca vì một đường tắt
  }

  return { batDau: String(result.batDau || ''), hetHanVao: String(result.hetHanVao || '') }
}

/** Cập nhật bản CÓ đáp án + lời giải của một ca ĐÃ MỞ (thầy chốt đáp án, hoặc
 * lời giải mới về máy) — học sinh xem lại thấy bản mới. Cần mã bí mật. */
export async function capNhatKeyBank(scriptUrl: string, secret: string, maCa: string, keyBank: KeyBank): Promise<CongBoDiem> {
  const r = await postJson(scriptUrl, { action: 'capNhatKeyBank', secret, maCa, keyBank })
  if (!r.ok) throw new Error(r.error || 'Không cập nhật được ca ' + maCa)
  // Danh sách ca vừa đổi — bỏ đệm để lượt hỏi tiếp theo thấy ngay.
  xoaBoDemCa()
  return r.congBo
}

/** Kết quả hỏi lại sau khi nộp (chế độ ca_lop_xong, hoặc mở lại app sau khi
 * đã nộp): sanSang=true kèm keyBank khi đã được phép xem. */
export interface KetQuaCongBo {
  congBo: CongBoDiem
  sanSang: boolean
  daNop: number
  daVao: number
  keyBank: KeyBank | null
}

export async function fetchKetQua(scriptUrl: string, maCa: string, sbd: string): Promise<KetQuaCongBo> {
  const url = `${scriptUrl}?action=ketQua&maCa=${encodeURIComponent(maCa)}&sbd=${encodeURIComponent(sbd)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const r = await res.json()
  if (!r.ok) throw new Error(r.error || 'Không hỏi được kết quả')
  return { congBo: r.congBo, sanSang: !!r.sanSang, daNop: r.daNop ?? 0, daVao: r.daVao ?? 0, keyBank: r.keyBank ?? null }
}

export async function fetchSession(scriptUrl: string, maCa: string): Promise<SessionConfig> {
  const url = `${scriptUrl}?action=session&maCa=${encodeURIComponent(maCa)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  return res.json()
}

export async function submitAnswers(
  scriptUrl: string,
  maCa: string,
  sbd: string,
  maDe: string,
  dapAn: AnswerRecord,
  integrity: IntegrityLog,
  lanThu = 1,
  idThietBi = '',
  giayCau?: Record<string, number>,
): Promise<{ keyBank: KeyBank | null; congBo: CongBoDiem }> {
  // THỬ LẠI ĐƯỢC (T5) — và CHỈ vì T4 đã có khoá chống trùng `maCa|sbd|lanThu`.
  // Trước T4, một lượt nộp hết hạn ở máy em nhưng đã tới nơi ở máy chủ sẽ bị ghi
  // đè lần nữa; nếu thầy vừa khoá ca giữa hai lượt thì lượt sau ăn 'da_dong' và
  // em thấy báo lỗi cho một bài ĐÃ NỘP XONG.
  // CẤT BÀI VÀO MÁY CHỦ MỚI TRƯỚC, rồi mới đi Apps Script.
  //
  // Đây chính là chỗ thầy báo treo: cả lớp bấm Nộp trong mười giây cuối, ba
  // mươi lượt dồn vào một cửa Apps Script xếp hàng theo khoá toàn cục. Ghi vào
  // D1 xong trước nghĩa là DÙ Apps Script có treo thì bài em VẪN AN TOÀN — bản
  // đồng bộ ngược sẽ đưa về Sheet sau, không mất chữ nào.
  //
  // Vẫn gọi Apps Script sau: điểm và đáp án công bố ngay do bên đó tính.
  const chMoi = await layCauHinhMayChu()
  const daCat = await nopMoi(chMoi, maCa, sbd, dapAn, integrity, giayCau)

  try {
    const result = await postCoThuLai(scriptUrl, { action: 'submit', maCa, sbd, maDe, dapAn, integrity, lanThu, idThietBi, giayCau }, HAN_GIAY_DONG_NGUOI)
    if (!result.ok) throw new Error(result.error || 'Nộp bài thất bại')
    return { keyBank: result.keyBank ?? null, congBo: result.congBo ?? (result.keyBank ? 'ngay' : 'khong') }
  } catch (e) {
    // Apps Script hỏng NHƯNG máy chủ mới đã nhận bài ⇒ KHÔNG báo lỗi cho em.
    // Báo đỏ lúc này là em tưởng mất bài và bấm nộp lại — đúng lúc máy chủ đang
    // quá tải nhất. Bài đã nằm trong D1, thầy kéo về sau.
    if (daCat?.ok) return { keyBank: null, congBo: 'khong' }
    throw e
  }
}

/** Chu kỳ máy em tự lưu bài đang làm lên máy chủ. 20 giây: đủ dày để khoá ca
 * giữa giờ không thổi bay quá một phần tư phút làm bài của em, đủ thưa để 30
 * máy trong phòng không nện Apps Script (30 em × 3 lần/phút = 90 lần/phút). */
export const CHU_KY_LUU_TAM_GIAY = 20

// ---------------------------------------------------------------------------
// GIẢM TẢI MÁY CHỦ TRONG CA THI (05/09, trước ca thi thật)
//
// ĐO ĐƯỢC: mỗi lệnh gọi Apps Script tốn 1,3 giây chi phí cố định. Một em trong
// ca 45 phút bắn 270 lệnh trạng thái (10 giây một lần) + 135 lệnh lưu tạm (20
// giây một lần) = 405 lệnh. Ba mươi em là hơn 12.000 lệnh, và tệ hơn: cả lớp
// vào thi cùng lúc nên MỌI MÁY ĐẬP CÙNG MỘT NHỊP — cứ 10 giây có 30 lệnh dồn
// vào máy chủ một lúc, trong khi Apps Script chỉ chạy được vài chục lệnh đồng
// thời.
//
// Hai cách chữa, đều không đổi giao thức và không đổi thứ thầy nhìn thấy:
//
//   1. LỆCH PHA. Mỗi máy cộng một khoảng ngẫu nhiên vào chu kỳ, nên ba mươi máy
//      trải đều ra thay vì dồn cục.
//   2. BỎ NHỊP KHI KHÔNG CÓ GÌ ĐỔI. Em làm 28 câu trong 45 phút thì chỉ có 28
//      lần đáp án thật sự đổi — 107 nhịp lưu tạm còn lại đang gửi lại y nguyên
//      thứ máy chủ đã có.

/** Khoảng lệch pha tối đa, tính theo phần của chu kỳ. 0,4 nghĩa là chu kỳ 20
 * giây rải đều trong 20–28 giây tuỳ máy. */
export const LECH_PHA = 0.4

/** Dù không có gì đổi, vẫn báo trạng thái ít nhất ngần này một lần — thầy phải
 * biết em còn đang làm chứ không phải đã tắt máy. */
export const NHIP_BAO_SONG_GIAY = 60

/** Chu kỳ đã lệch pha cho MÁY NÀY. Tính một lần rồi giữ nguyên cả ca: đổi mỗi
 * nhịp thì nhịp lại xô về nhau. */
export function chuKyLechPha(giay: number, nn: () => number = Math.random): number {
  return Math.round(giay * (1 + nn() * LECH_PHA))
}

/** Bản MILI GIÂY của `chuKyLechPha`.
 *
 * Phòng chờ hỏi mỗi 3 giây; làm tròn về giây như bản trên chỉ ra 3 hoặc 4 giây,
 * tức cả lớp vẫn dồn vào hai mốc. Ở nhịp ngắn thì phải rải bằng mili giây.
 *
 * Đo 09/09 trước ca thi đông: `trangThaiPhongCho` mất 2,2–3,3 giây một lượt khi
 * vắng, và 60 lượt CÙNG LÚC vẫn xong hết (0 hỏng, chậm nhất 4,3 giây). Máy chủ
 * chịu được; thứ cần chữa là nhịp gọi của từng máy, không phải sức máy chủ. */
export function chuKyLechPhaMs(ms: number, nn: () => number = Math.random): number {
  return Math.round(ms * (1 + nn() * LECH_PHA))
}

/**
 * LƯU TẠM bài đang làm (CATHIVAGOILENBANG mục 1).
 *
 * Gọi nền, KHÔNG chặn thao tác của em, KHÔNG hiện lỗi ra màn hình: mất mạng
 * một nhịp thì bỏ qua nhịp đó, nhịp sau ghi đè đủ. Trả về true khi máy chủ đã
 * nhận, để chỗ gọi biết mà không phải tự đoán.
 */
export async function luuTam(scriptUrl: string, maCa: string, sbd: string, dapAn: AnswerRecord, giayCau?: Record<string, number>): Promise<boolean> {
  try {
    // MÁY CHỦ MỚI TRƯỚC — 135 lượt một em một ca.
    //
    // `null` nghĩa là "lượt này không nằm ở máy chủ mới" (em vào thi bằng đường
    // cũ) hoặc máy chủ mới không với tới được — cả hai đều đi tiếp xuống dưới.
    const chMoi = await layCauHinhMayChu()
    const rMoi = await luuTamMoi(chMoi, maCa, sbd, dapAn, giayCau)
    if (rMoi !== null) return rMoi

    // Lưu tạm ghi ĐÈ đúng một dòng bằng đúng nội dung ấy, nên gửi lại vô hại.
    // Chỉ thử THÊM MỘT lần: nhịp sau còn tới, không việc gì phải cố.
    const r = await postCoThuLai(scriptUrl, { action: 'luuTam', maCa, sbd, dapAn, giayCau }, HAN_GIAY, 2)
    return !!r?.ok
  } catch {
    return false
  }
}

/** Thầy KHOÁ CA giữa giờ. Trả về số em đang làm bị nộp bài — để màn hình báo
 * đúng con số thật chứ không nói chung chung. */
export async function khoaCa(scriptUrl: string, secret: string, maCa: string, khoaBoi = 'thầy'): Promise<{ soEmBiNop: number; khoaLuc: string }> {
  const r = await postJson(scriptUrl, { action: 'khoaCa', secret, maCa, khoaBoi })
  if (!r.ok) throw new Error(r.error || 'Không khoá được ca')
  // Danh sách ca vừa đổi — bỏ đệm để lượt hỏi tiếp theo thấy ngay.
  xoaBoDemCa()
  return { soEmBiNop: Number(r.soEmBiNop) || 0, khoaLuc: String(r.khoaLuc || '') }
}

/** Thầy MỞ CA LẠI. Em đã bị nộp do khoá KHÔNG tự vào lại được — phải duyệt
 * thi lại từng em, đúng như mọi trường hợp thi lại khác. */
/** MỞ CA: gỡ khoá thủ công VÀ gỡ hạn vào phòng, để em đến muộn vào được ngay.
 * `goHanVao` = true khi ca có hạn vào và hạn đó vừa bị gỡ. */
export async function moKhoaCa(scriptUrl: string, secret: string, maCa: string): Promise<{ goHanVao: boolean }> {
  const r = await postJson(scriptUrl, { action: 'moKhoaCa', secret, maCa })
  if (!r.ok) throw new Error(r.error || 'Không mở lại được ca')
  // Danh sách ca vừa đổi — bỏ đệm để lượt hỏi tiếp theo thấy ngay.
  xoaBoDemCa()
  return { goHanVao: !!(r as { goHanVao?: boolean }).goHanVao }
}

export interface KetQuaDongBoTenCa {
  maCa: string
  tenCa: string
  /** Lượt đang bỏ trống tên, nay điền từ danh sách lớp. */
  daDien: { sbd: string; hoTen: string }[]
  /** Lượt có tên nhưng lệch danh sách — sửa theo danh sách, báo ra cũ → mới. */
  daSua: { sbd: string; cu: string; moi: string }[]
  /** Số báo danh không có trong danh sách lớp, hoặc dòng danh sách bỏ trống tên. */
  khongCo: string[]
  giuNguyen: number
}

/** ĐỒNG BỘ HỌ TÊN TỪ DANH SÁCH LỚP VÀO MỘT CA (thầy báo 07/09).
 *
 * Em vào thi chỉ gõ số báo danh nên cột HoTen của lượt bỏ trống, và phiếu gửi
 * phụ huynh in "SBD 10038" thay vì tên con. Lệnh này lấy tên từ danh sách lớp
 * điền vào lượt thi và vào hồ sơ em nếu hồ sơ đang trống.
 *
 * Không đụng điểm, đáp án hay chi tiết câu. Dựng lại phiếu sau khi chạy là tên
 * hiện đúng. */
export async function dongBoTenCa(scriptUrl: string, secret: string, maCa: string): Promise<KetQuaDongBoTenCa> {
  const r = await postJson(scriptUrl, { action: 'dongBoTenCa', secret, maCa })
  if (!r.ok) throw new Error(r.error || 'Không đồng bộ được tên')
  return {
    maCa: String(r.maCa || maCa),
    tenCa: String(r.tenCa || ''),
    daDien: Array.isArray(r.daDien) ? (r.daDien as KetQuaDongBoTenCa['daDien']) : [],
    daSua: Array.isArray(r.daSua) ? (r.daSua as KetQuaDongBoTenCa['daSua']) : [],
    khongCo: Array.isArray(r.khongCo) ? (r.khongCo as unknown[]).map((x) => String(x)) : [],
    giuNguyen: Number(r.giuNguyen) || 0,
  }
}

/** ĐỔI TÊN CA (thầy báo 07/09). Tên ca đặt lúc mở ca đi theo ca suốt đời — in
 * trong phiếu phụ huynh, bảng điểm, hồ sơ em — nên gõ vội một lần là sai mãi.
 *
 * Máy chủ chuẩn hoá LẠI chuỗi gửi lên rồi trả về tên nó đã ghi thật; màn hình
 * lấy chuỗi TRẢ VỀ mà hiển thị, không lấy chuỗi mình vừa gõ. Có vậy thì cái
 * thầy nhìn thấy mới đúng là cái nằm trong ô Sheet. */
export async function doiTenCa(scriptUrl: string, secret: string, maCa: string, tenCa: string): Promise<{ tenCa: string }> {
  const r = await postJson(scriptUrl, { action: 'doiTenCa', secret, maCa, tenCa: chuanTenCa(tenCa) })
  if (!r.ok) throw new Error(r.error || 'Không đổi được tên ca')
  // Danh sách ca vừa đổi — bỏ đệm để lượt hỏi tiếp theo thấy ngay.
  xoaBoDemCa()
  return { tenCa: String((r as { tenCa?: string }).tenCa ?? '') }
}

/** Trạng thái 1 lượt thi trên máy chủ (sheet LuotThi). */
export type TrangThaiLuot = 'dang_lam' | 'da_nop' | 'khoa' | 'duoc_duyet_lai'

export interface SubmissionRow {
  sbd: string
  hoTen?: string
  maDe: string
  /** Lượt thứ mấy của em trong ca (thi lại = 2, 3…). Bản cũ không có → 1. */
  lanThu?: number
  trangThai?: TrangThaiLuot
  vaoLuc?: string
  hetGioLuc?: string
  thoiGianNop: string
  dapAn: AnswerRecord | null
  integrity?: IntegrityLog | null
  ghiChu?: string
  duyetBoi?: string
  /** Giây làm từng câu (qid → giây) em gửi lúc nộp — mục 5. */
  giayCau?: Record<string, number> | null
  /** Điểm đã ghi trên máy chủ (ghiDiem / sendFeedback) — null nếu chưa. */
  tong?: number | null
}

/** Lượt MỚI NHẤT của mỗi SBD trong ca — mọi trạng thái (đang làm, đã nộp, bị
 * khoá, đã duyệt thi lại). Màn Theo dõi tự lọc đã nộp để chấm. */
export async function listSubmissions(scriptUrl: string, maCa: string): Promise<SubmissionRow[]> {
  const url = `${scriptUrl}?action=listSubmissions&maCa=${encodeURIComponent(maCa)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const data = await res.json()
  if (typeof data.serverNow === 'number') dongBoGioMayChu(data.serverNow)
  return (data.rows || []).map((r: SubmissionRow) => ({ ...r, lanThu: Number(r.lanThu) || 1, trangThai: r.trangThai || 'da_nop' }))
}

// ============================================================================
// PHỤ HUYNH — đăng ký, xem nhận xét sau khi nộp, theo dõi làm bài thời gian thực
// ============================================================================

export interface ParentFeedbackItem {
  maCa: string
  maDe: string
  thoiGianNop: string
  diem: number
  xepLoai: string
  cauSai: string // JSON stringify {phanI:number[], phanII:number[], phanIII:number[]}
}

export interface ParentFeedbackResult {
  found: boolean
  sdt?: string
  hoTenPhuHuynh?: string
  sbd?: string
  lop?: string
  hoTenHocSinh?: string
  items?: ParentFeedbackItem[]
}

export async function sendParentFeedback(
  scriptUrl: string,
  sbd: string,
  maCa: string,
  maDe: string,
  thoiGianNop: string,
  diem: number,
  xepLoai: string,
  cauSai: { phanI: number[]; phanII: number[]; phanIII: number[] },
  diemPhan?: { I: number; II: number; III: number },
  /** Id thiết bị của CHÍNH lượt này. Máy chủ đối chiếu với lượt trong LuotThi —
   * không có hoặc không khớp thì không được đặt điểm cho em khác. */
  idThietBi?: string,
  /** MẪU SỐ đã dùng để chấm — xem ghi chú dài ở `ghiDiem`. */
  soCau?: { I: number; II: number; III: number },
): Promise<void> {
  const result = await postJson(scriptUrl, {
    action: 'sendFeedback',
    sbd,
    maCa,
    maDe,
    thoiGianNop,
    diem,
    xepLoai,
    cauSai,
    diemPhan,
    idThietBi,
    // Tem luật chấm — xem ghi chú ở `LUAT_DIEM` trong engine/score.ts.
    luatDiem: LUAT_DIEM,
    // MẪU SỐ đã dùng để chấm — xem ghi chú dài ở `ghiDiem`. Lệch số câu thật
    // của ca thì máy chủ từ chối đặt điểm, có báo lý do.
    soCau,
  })
  if (!result.ok) throw new Error(result.error || 'Gửi nhận xét thất bại')
}

/** Học sinh tự động gửi lên định kỳ trong lúc làm bài + ngay mỗi lần rời màn
 * hình, để phụ huynh xem gần-thời-gian-thực và nhận cảnh báo rời màn hình
 * sớm nhất có thể (không phải push thật, phụ huynh tự poll lại). */
export async function pushExamStatus(
  scriptUrl: string,
  status: {
    sbd: string
    maCa: string
    lop: string
    dangLam: boolean
    batDauLuc: string
    daLamCauHoi: number
    tongCauHoi: number
    soLanRoiApp: number
    blocked: boolean
  },
): Promise<boolean> {
  try {
    // MÁY CHỦ MỚI TRƯỚC — 270 lượt một em một ca, lệnh dày nhất trong toàn bộ hệ.
    const chMoi = await layCauHinhMayChu()
    const rMoi = await trangThaiMoi(chMoi, status)
    if (rMoi !== null) return rMoi

    const r = await postJson(scriptUrl, { action: 'examStatus', ...status })
    return !!r?.ok
  } catch {
    // Cập nhật trạng thái theo dõi không phải luồng chính — mất mạng thì bỏ
    // qua, không chặn học sinh làm bài, lần đẩy tiếp theo sẽ tự bù.
    //
    // TRẢ VỀ FALSE, KHÔNG PHẢI VOID: chỗ gọi dùng giá trị này để biết có được
    // phép ghi nhớ "đã gửi rồi" hay không. Nuốt lỗi rồi im lặng báo thành công
    // là cách chắc chắn nhất để một nhịp rớt mạng biến thành mất dữ liệu.
    return false
  }
}

export interface ParentStatus {
  found: boolean
  hoTenHocSinh?: string
  sbd?: string
  status: {
    maCa: string
    lop: string
    dangLam: boolean
    batDauLuc: string
    daLamCauHoi: number
    tongCauHoi: number
    soLanRoiApp: number
    blocked: boolean
    capNhatLuc: string
  } | null
}

// ============================================================================
// HỌC SINH — đăng ký hồ sơ 1 lần (SBD + họ tên + năm sinh), dùng để tự điền
// sẵn SBD lúc vào thi và để nhắn tin cho thầy có tên hiển thị rõ ràng.
// ============================================================================

export interface StudentProfile {
  found: boolean
  sbd?: string
  hoTen?: string
  namSinh?: string
  lop?: string
}

/** Xoá đăng ký hồ sơ học sinh (theo SBD) — dùng khi đăng ký nhầm, cho đăng ký lại từ đầu. */
export async function deleteStudentRegistration(scriptUrl: string, secret: string, sbd: string): Promise<void> {
  const result = await postJson(scriptUrl, { action: 'deleteStudent', secret, sbd })
  if (!result.ok) throw new Error(result.error || 'Xoá đăng ký thất bại')
}

// ============================================================================
// TIN NHẮN PHỤ HUYNH/HỌC SINH ↔ THẦY — nhắn trực tiếp qua app, thầy xem chung 1 hộp thư
// ============================================================================

/** Học sinh nhắn tin cho thầy — hiển thị tên theo đúng cấu trúc hồ sơ đã đăng
 * ký ("Năm sinh - Họ Tên Học Sinh"), để thầy phân biệt được với tin nhắn phụ huynh. */
export async function sendStudentMessage(scriptUrl: string, sbd: string, hoTenHienThi: string, lop: string, noiDung: string): Promise<void> {
  const result = await postJson(scriptUrl, {
    action: 'sendMessage',
    sdt: '',
    hoTenPhuHuynh: '',
    sbd,
    lop,
    hoTenHocSinh: hoTenHienThi,
    noiDung,
    nguoiGui: 'hocsinh',
  })
  if (!result.ok) throw new Error(result.error || 'Gửi tin nhắn thất bại')
}

export interface ParentMessage {
  id: string
  sdt: string
  hoTenPhuHuynh: string
  sbd: string
  lop: string
  hoTenHocSinh: string
  noiDung: string
  thoiGian: string
  daDoc: boolean
  nguoiGui: 'phuhuynh' | 'hocsinh'
}

export async function listParentMessages(scriptUrl: string, secret: string): Promise<ParentMessage[]> {
  const url = `${scriptUrl}?action=listMessages&secret=${encodeURIComponent(secret)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const data = await res.json()
  return data.items || []
}

/** ĐẾM TIN CHƯA ĐỌC — dùng cho vòng hỏi lại của bong bóng nổi.
 *
 * Lấy `listParentMessages` để đếm là kéo cả hộp thư (mọi cột, mọi nội dung tin)
 * về chỉ để lấy một con số, cứ vài chục giây một lần, suốt ngày. Lệnh này đọc
 * đúng một cột trên máy chủ và trả về hai con số. */
export async function demTinMoi(scriptUrl: string, secret: string): Promise<{ soChuaDoc: number; tong: number }> {
  const url = `${scriptUrl}?action=demTinMoi&secret=${encodeURIComponent(secret)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const r = await res.json()
  if (!r.ok) throw new Error(r.error || 'Không đếm được tin')
  return { soChuaDoc: Number(r.soChuaDoc) || 0, tong: Number(r.tong) || 0 }
}

export async function markMessagesRead(scriptUrl: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const result = await postJson(scriptUrl, { action: 'markMessagesRead', ids })
  if (!result.ok) throw new Error(result.error || 'Đánh dấu đã đọc thất bại')
}

// ============================================================================
// TIN NHẮN THẦY → PHỤ HUYNH/HỌC SINH (chiều ngược lại) — thầy chọn đúng 1 em
// theo SBD (không suy đoán/khớp mờ tên) rồi gửi, phụ huynh/học sinh của em đó
// tự poll lại thấy tin.
// ============================================================================

export async function sendTeacherMessage(scriptUrl: string, secret: string, sbd: string, noiDung: string): Promise<void> {
  const result = await postJson(scriptUrl, { action: 'sendTeacherMessage', secret, sbd, noiDung })
  if (!result.ok) throw new Error(result.error || 'Gửi tin nhắn thất bại')
}

export interface TeacherMessage {
  id: string
  sbd: string
  noiDung: string
  thoiGian: string
  daXem: boolean
}

// ============================================================================
// QUẢN LÝ ĐĂNG KÝ (chỉ thầy dùng) — xem + xoá phụ huynh/học sinh đã đăng ký.
// Phụ huynh/học sinh KHÔNG có nút tự xoá trong app của họ — đăng ký xong là
// cố định, chỉ thầy xoá được ở màn này để cho đăng ký lại.
// ============================================================================

export interface RegisteredParent {
  sdt: string
  hoTenPhuHuynh: string
  sbd: string
  lop: string
  hoTenHocSinh: string
  dangKyLuc: string
  token?: string
  trangThai?: string
}

export interface RegisteredStudent {
  sbd: string
  hoTen: string
  namSinh: string
  lop: string
  dangKyLuc: string
  sdt?: string
  sdtPhuHuynh?: string
  token?: string
  trangThai?: string
}

/** Ô trong Google Sheet có thể là SỐ (SBD 12000, lớp 12, năm sinh 2009). JSON giữ
 * nguyên kiểu số, còn app thì gọi `.trim()`, `.toLowerCase()`, `.localeCompare()`
 * trên các trường này. Một ô số là đủ ném TypeError giữa lúc render → React gỡ
 * cây → MÀN TRẮNG. Ép chuỗi ngay tại cửa API, đúng một chỗ, cho mọi màn dùng chung. */
export function chuoi(v: unknown): string {
  return v === null || v === undefined ? '' : String(v)
}

export async function listRegisteredStudents(scriptUrl: string, secret: string): Promise<RegisteredStudent[]> {
  const url = `${scriptUrl}?action=listStudents&secret=${encodeURIComponent(secret)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Máy chủ trả lỗi HTTP ${res.status}`)
  const data = await res.json()
  return ((data.items || []) as RegisteredStudent[]).map((x) => ({
    ...x,
    sbd: chuoi(x.sbd),
    hoTen: chuoi(x.hoTen),
    namSinh: chuoi(x.namSinh),
    lop: chuoi(x.lop),
    dangKyLuc: chuoi(x.dangKyLuc),
    trangThai: chuoi(x.trangThai),
  }))
}

export interface FeedbackSummary {
  sbd: string
  maCa: string
  maDe: string
  thoiGianNop: string
  diem: number
  xepLoai: string
}

// ============================================================================
// BA VAI TRÒ — TOKEN & DUYỆT HỒ SƠ (BA-APP.md đợt 1)
// Máy em/phụ huynh vào bằng link riêng /hs/<token> · /ph/<token>. Máy chủ tra
// token ra SBD; app KHÔNG bao giờ tự khai mình là SBD nào.
// ============================================================================

export interface HoSoHocSinhToken {
  ok: boolean
  found: boolean
  sbd?: string
  hoTen?: string
  namSinh?: string
  lop?: string
  trangThai?: string
  error?: string
}

export interface HoSoPhuHuynhToken {
  ok: boolean
  found: boolean
  sdt?: string
  hoTenPhuHuynh?: string
  sbd?: string
  lop?: string
  hoTenHocSinh?: string
  trangThai?: string
  error?: string
}

export type LoaiHoSo = 'hs' | 'ph'

export interface HoSoChoDuyet {
  hocSinh: RegisteredStudent[]
  phuHuynh: RegisteredParent[]
}

// ============================================================================
// HỒ SƠ HỌC SINH (BA-APP.md đợt 2) — chuyên đề mạnh/yếu + lịch sử ca thi.
// Máy chủ tổng hợp sẵn (TienDoHS/TienDoCa) nên một lệnh là đủ.
// ============================================================================

export type XuHuong = 'tot' | 'xau' | 'deu' | 'chua_du'

export interface ChuyenDeEm {
  ten: string
  soCau: number
  soSai: number
  tiLeSai: number
  xuHuong: XuHuong
}

export interface CaCuaEm {
  maCa: string
  tenCa: string
  lop: string
  lanThu: number
  nopLuc: string
  trangThai: string
  diemI: number | null
  diemII: number | null
  diemIII: number | null
  tong: number | null
  /** TRẦN ĐIỂM từng phần của ca (4,50 · 4,00 · 1,50 với ca đủ ba phần). Thiếu ⇒
   * phiếu cũ, chỗ hiển thị hiểu là 10. Máy chủ không lưu, máy thầy tính lại từ
   * số câu của ca rồi gắn vào lúc dựng phiếu. */
  tranPhan?: { I: number; II: number; III: number } | null
  hang: number | null
  siSo: number | null
  soLanRoiMan: number
}

export interface HoSoEm {
  em: { sbd: string; hoTen: string; namSinh: string; lop: string }
  /** Chuyên đề CỘNG DỒN mọi ca — dùng cho bảng mạnh/yếu. */
  chuyenDe: ChuyenDeEm[]
  ca: CaCuaEm[]
  /** Ca gần nhất ĐÃ CHẤM (null nếu chưa có) — phiếu gửi phụ huynh dùng số của
   * riêng ca này, không dùng số cộng dồn. */
  caGanNhat: CaCuaEm | null
  chuyenDeCaGanNhat: { ten: string; soCau: number; soSai: number }[]
  soCauSaiCaGanNhat: number
}

/** Ai gọi: thầy (secret + sbd) · em (tokenHS) · phụ huynh (tokenPH). */
export interface QuyenHoSo {
  secret?: string
  sbd?: string
  tokenHS?: string
  tokenPH?: string
}

export async function hoSoEm(scriptUrl: string, quyen: QuyenHoSo): Promise<HoSoEm> {
  const r = await postJson(scriptUrl, { action: 'hoSoEm', ...quyen })
  if (!r.ok) throw new Error(r.error || 'Không lấy được hồ sơ')
  return {
    em: { ...r.em, sbd: chuoi(r.em.sbd), hoTen: chuoi(r.em.hoTen), namSinh: chuoi(r.em.namSinh), lop: chuoi(r.em.lop) },
    chuyenDe: r.chuyenDe || [],
    ca: (r.ca || []).map((c: CaCuaEm) => ({ ...c, maCa: String(c.maCa) })),
    caGanNhat: r.caGanNhat ? { ...r.caGanNhat, maCa: String(r.caGanNhat.maCa) } : null,
    chuyenDeCaGanNhat: r.chuyenDeCaGanNhat || [],
    soCauSaiCaGanNhat: Number(r.soCauSaiCaGanNhat) || 0,
  }
}

export interface EmTomTat {
  sbd: string
  hoTen: string
  namSinh: string
  lop: string
  trangThai: string
  soCa: number
  diemGanNhat: number | null
  caGanNhat: string
  nopGanNhat: string
}

export async function danhSachEm(scriptUrl: string, secret: string): Promise<EmTomTat[]> {
  const r = await postJson(scriptUrl, { action: 'danhSachEm', secret })
  if (!r.ok) throw new Error(r.error || 'Không lấy được danh sách học sinh')
  return (r.items as EmTomTat[]).map((x) => ({
    ...x,
    sbd: chuoi(x.sbd),
    hoTen: chuoi(x.hoTen),
    namSinh: chuoi(x.namSinh),
    lop: chuoi(x.lop),
    trangThai: chuoi(x.trangThai),
    caGanNhat: chuoi(x.caGanNhat),
    nopGanNhat: chuoi(x.nopGanNhat),
  }))
}

// ============================================================================
// BÀI TẬP VỀ NHÀ (BA-APP.md đợt 3) — là một CA loại 'baitap', giao đích danh.
// ============================================================================

/** Trạng thái bài tập nhìn từ phía em. */
export type TrangThaiBaiTap = 'chua_lam' | 'dang_lam' | 'da_nop' | 'qua_han'

export interface BaiTapCuaEm {
  maCa: string
  tenCa: string
  giaoLuc: string
  hanNop: string
  trangThai: TrangThaiBaiTap
  nopLuc: string
  tong: number | null
}

/** Bài tập của một em. Quyền: tokenHS (em) · tokenPH (phụ huynh) · secret+sbd (thầy). */
export async function baiTapCuaEm(scriptUrl: string, quyen: QuyenHoSo): Promise<BaiTapCuaEm[]> {
  const r = await postJson(scriptUrl, { action: 'baiTapCuaEm', ...quyen })
  if (!r.ok) throw new Error(r.error || 'Không lấy được danh sách bài tập')
  return (r.items as BaiTapCuaEm[]).map((x) => ({ ...x, maCa: String(x.maCa) }))
}

/** Tập câu em ĐÃ từng làm — để rút bài tập tránh câu cũ (chỉ thầy gọi được). */
export async function qidDaLam(scriptUrl: string, secret: string, sbd: string): Promise<string[]> {
  const r = await postJson(scriptUrl, { action: 'qidDaLam', secret, sbd })
  if (!r.ok) throw new Error(r.error || 'Không lấy được danh sách câu đã làm')
  return (r.qids as string[]).map(String)
}

// ============================================================================
// YÊU CẦU GIAO BÀI (BA-APP.md đợt 4) — phụ huynh bấm "Đồng ý giao bài" trên
// phiếu kết quả; MÁY THẦY là nơi rút câu nên yêu cầu nằm chờ ở máy chủ cho tới
// khi máy thầy mở app (kho đề nằm trong Drive, Apps Script đọc rất chậm).
// ============================================================================

export interface YeuCauGiaoBai {
  id: string
  sbd: string
  hoTen: string
  chuyenDe: string[]
  soCau: number
  taoLuc: string
  taoBoi: string
  trangThai: 'cho' | 'xong' | 'huy'
  maCa: string
}

export async function danhSachYeuCau(scriptUrl: string, secret: string, tatCa = false): Promise<YeuCauGiaoBai[]> {
  const r = await postJson(scriptUrl, { action: 'danhSachYeuCau', secret, tatCa })
  if (!r.ok) throw new Error(r.error || 'Không lấy được hàng chờ giao bài')
  return (r.items as YeuCauGiaoBai[]).map((x) => ({ ...x, sbd: String(x.sbd) }))
}

/** ĐẨY BẢN SAO DANH SÁCH LỚP LÊN MÁY CHỦ.
 *
 * Em vào thi chỉ gõ số báo danh, không gõ tên — nên máy chủ phải tra tên ở đâu
 * đó. Sheet danh sách lớp của thầy là nguồn sự thật; đây là bản sao chỉ-đọc để
 * máy chủ điền HỌ TÊN, NĂM SINH, LỚP cho em vào thi lần đầu. Ghi đè toàn bộ mỗi
 * lần đẩy. KHÔNG đụng tới điểm hay hồ sơ đã có. */
export interface KetQuaNapDanhSach {
  soDong: number
  /** Em có trong bản mới mà bản cũ chưa có. */
  them: { sbd: string; hoTen: string }[]
  /** Em BỊ BỎ khỏi danh sách — từ giờ đứng ngoài phòng thi. Thầy phải nhìn thấy. */
  bo: { sbd: string; hoTen: string }[]
  doiTen: { sbd: string; cu: string; moi: string }[]
}

export async function napDanhSachLop(
  scriptUrl: string,
  secret: string,
  items: { sbd: string; hoTen: string; namSinh: string; lop: string }[],
): Promise<KetQuaNapDanhSach> {
  const r = await postJson(scriptUrl, { action: 'napDanhSachLop', secret, items })
  if (!r.ok) throw new Error(r.error || 'Không đẩy được danh sách lớp')
  return {
    soDong: Number(r.soDong) || 0,
    // Máy chủ cũ chưa trả ba trường này ⇒ mảng rỗng, màn hình không vỡ.
    them: Array.isArray(r.them) ? (r.them as KetQuaNapDanhSach['them']) : [],
    bo: Array.isArray(r.bo) ? (r.bo as KetQuaNapDanhSach['bo']) : [],
    doiTen: Array.isArray(r.doiTen) ? (r.doiTen as KetQuaNapDanhSach['doiTen']) : [],
  }
}

export interface EmVuaThem {
  sbd: string
  hoTen: string
  namSinh: string
  lop: string
  /** Tên Google Sheet khối đã ghi vào — thầy đối chiếu xem có đúng khối không. */
  tenSheet: string
}

/** THÊM MỘT EM VÀO ĐÚNG SHEET KHỐI CỦA THẦY (thầy chốt 07/09).
 *
 * Ghi vào Google Sheet GỐC chứ không chỉ bản sao trên máy chủ: bản sao bị lượt
 * Đồng bộ kế tiếp ghi đè, nên em thêm vào bản sao sẽ biến mất mà không ai biết.
 * Ghi xong thêm luôn vào bản sao để em vào thi được ngay. */
export async function themEmVaoSheet(scriptUrl: string, secret: string, em: { sbd: string; hoTen: string; namSinh: string }): Promise<EmVuaThem> {
  const r = await postJson(scriptUrl, { action: 'themEmVaoSheet', secret, sbd: em.sbd, hoTen: em.hoTen, namSinh: em.namSinh })
  if (!r.ok) throw new Error(r.error || 'Không thêm được học sinh')
  return {
    sbd: String(r.sbd ?? em.sbd),
    hoTen: String(r.hoTen ?? em.hoTen),
    namSinh: String(r.namSinh ?? em.namSinh),
    lop: String(r.lop ?? ''),
    tenSheet: String(r.tenSheet ?? ''),
  }
}

/** Link danh sách lớp thầy đã lưu trên máy chủ (mỗi khối một link).
 *
 * Máy chủ chỉ GIỮ LINK hộ, không tải: `UrlFetchApp` đòi thêm quyền
 * `script.external_request`, mà thêm quyền là phải xin lại uỷ quyền cho cả ứng
 * dụng web — làm giữa buổi dạy thì chặn hết em đang thi. Máy thầy tự tải, tệp
 * "Xuất bản lên web" của Google có gắn nhãn CORS nên đọc thẳng được. */
export async function linkDanhSachLop(scriptUrl: string, secret: string): Promise<string[]> {
  const r = await postJson(scriptUrl, { action: 'linkDanhSachLop', secret })
  if (!r.ok) throw new Error(r.error || 'Không đọc được link danh sách')
  return Array.isArray(r.links) ? (r.links as unknown[]).map((x) => String(x)) : []
}

/** Lưu bộ link để lần sau thầy chỉ bấm Đồng bộ. Lưu ở Script property nên đổi
 * máy, mở app trên điện thoại vẫn còn. */
export async function luuLinkDanhSachLop(scriptUrl: string, secret: string, links: string[]): Promise<string[]> {
  const r = await postJson(scriptUrl, { action: 'luuLinkDanhSachLop', secret, links })
  if (!r.ok) throw new Error(r.error || 'Không lưu được link danh sách')
  return Array.isArray(r.links) ? (r.links as unknown[]).map((x) => String(x)) : []
}

export async function danhDauYeuCau(scriptUrl: string, secret: string, id: string, trangThai: 'xong' | 'huy', maCa = ''): Promise<void> {
  const r = await postJson(scriptUrl, { action: 'danhDauYeuCau', secret, id, trangThai, maCa })
  if (!r.ok) throw new Error(r.error || 'Không cập nhật được yêu cầu')
}

// ---------------------------------------------------------------------------
// KHO ĐỀ trên Apps Script (NAPDETUDONG.md, hướng A): pipeline "Nạp đề mới"
// đẩy đề đầy đủ (đáp án + lời giải + ảnh) lên đây bằng MÃ BÍ MẬT; app trên
// máy thầy tự tải về ngân hàng. Mã bí mật thầy nhập 1 lần, lưu IndexedDB máy
// thầy (không nhúng trong code). Tất cả đi qua POST để mã không lọt vào URL.
// ---------------------------------------------------------------------------
export interface KhoDeItem {
  maDe: string
  nguon: string
  ngayNap: string
  soCau: number
  soNghi: number
  capNhatLuc: string
  /** Nhóm đề (thư mục con trong kho-de/moi/) — rỗng nếu không có. */
  nhom?: string
}

export async function danhSachDe(scriptUrl: string, secret: string): Promise<KhoDeItem[]> {
  const r = await postJson(scriptUrl, { action: 'danhSachDe', secret })
  if (!r.ok) throw new Error(r.error || 'Không lấy được danh sách đề')
  return (r.items as KhoDeItem[]).map((x) => ({ ...x, maDe: String(x.maDe), ngayNap: String(x.ngayNap ?? ''), nguon: String(x.nguon ?? '') }))
}

/** Trả về JSON đề nguyên dạng pipeline đã đẩy (khuôn KhoDeJson, xem exam-kho-de-import.ts). */
export async function layDe(scriptUrl: string, secret: string, maDe: string): Promise<unknown> {
  const r = await postJson(scriptUrl, { action: 'layDe', secret, maDe })
  if (!r.ok) throw new Error(r.error || `Không lấy được đề ${maDe}`)
  return r.de
}

export async function luuDe(scriptUrl: string, secret: string, de: unknown): Promise<{ maDe: string; soCau: number; soNghi: number }> {
  const r = await postJson(scriptUrl, { action: 'luuDe', secret, de })
  if (!r.ok) throw new Error(r.error || 'Đẩy đề thất bại')
  return { maDe: String(r.maDe), soCau: Number(r.soCau), soNghi: Number(r.soNghi) }
}

// ---------------------------------------------------------------------------
// PHIẾU KẾT QUẢ GỬI PHỤ HUYNH — lưu theo mã ngẫu nhiên, đọc bằng đúng mã đó.
// `layPhieu` là lệnh đọc DUY NHẤT không cần mã bí mật (phụ huynh chỉ có link),
// nên nó chỉ trả về đúng một phiếu và không có lệnh liệt kê đi kèm.
// ---------------------------------------------------------------------------

/** Mã phiếu 10 ký tự trên bảng chữ 56 ký tự — khoảng 58 bit ngẫu nhiên.
 *
 * Vì sao đúng 10: link phải NGẮN NHẤT CÓ THỂ để dán vào Zalo cho gọn, mà vẫn
 * không dò ra được. 56^10 ≈ 3·10^17 tổ hợp; kho có 10.000 phiếu thì mỗi lần
 * đoán bừa trúng với xác suất 3·10^-14, và Apps Script còn chặn gọi dồn. Ngắn
 * hơn nữa thì bắt đầu đáng lo, dài hơn chỉ tổ dài link.
 *
 * Bỏ 0 O 1 I l khỏi bảng chữ để thầy đọc mã qua điện thoại không bị nhầm. */
export function sinhMaPhieu(): string {
  const chu = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const b = new Uint8Array(10)
  crypto.getRandomValues(b)
  let s = ''
  for (const x of b) s += chu[x % chu.length]
  return s
}

/** Gói phiếu lớn nhất còn gửi lên máy chủ được, tính bằng byte.
 *
 * Phiếu nhúng thẳng ảnh cắt từ đề dưới dạng data URL, nên một ca nhiều hình có
 * thể phình lên vài MB. Apps Script cắt nhỏ rồi cất vào ô của Sheet, quá cỡ là
 * nó nghẹn giữa chừng và trả lỗi khó hiểu — chặn ngay tại máy, báo đúng việc
 * thầy phải làm, hơn là để thầy ngồi chờ rồi nhận lỗi lạ. */
const CO_TOI_DA_PHIEU = 4 * 1024 * 1024

/** Loại phiếu: kết quả bài kiểm tra, hay bài tập giao về nhà. Một em trong một
 * ca có thể có cả hai, mà gửi Zalo thì phải gửi đúng loại. */
export type LoaiPhieu = 'ketqua' | 'baitap'

/** HỒ SƠ NHIỀU EM MỘT LƯỢT — dùng khi dựng phiếu cả ca.
 *
 * Gọi `hoSoEm` từng em thì máy chủ đọc trọn ba sheet cho MỖI em; ca ba chục em
 * là chín chục lượt đọc cùng một nội dung. Lệnh này đọc một lần rồi tính cho
 * cả danh sách. */
export async function hoSoNhieuEm(scriptUrl: string, secret: string, sbd: string[]): Promise<HoSoEm[]> {
  if (sbd.length === 0) return []
  const r = await postJson(scriptUrl, { action: 'hoSoNhieuEm', secret, sbd }, 90)
  if (!r.ok) throw new Error(r.error || 'Không lấy được hồ sơ')
  return (Array.isArray(r.items) ? r.items : []) as HoSoEm[]
}

export interface PhieuCanLuu {
  ma: string
  maCa: string
  sbd: string
  hoTen: string
  phieu: unknown
  loai?: LoaiPhieu
}

/** Số phiếu tối đa một gói — khớp `TRAN_PHIEU_MOT_GOI` bên máy chủ. */
export const TRAN_PHIEU_MOT_GOI = 6

/** LƯU NHIỀU PHIẾU MỘT LƯỢT. Tự chia gói, tự bỏ phiếu quá cỡ (nặng vì nhiều
 * hình) và báo lại — một em quá cỡ không được kéo theo cả ca không có link. */
export async function luuNhieuPhieu(
  scriptUrl: string,
  secret: string,
  ds: PhieuCanLuu[],
): Promise<{ daLuu: { sbd: string; ma: string }[]; loi: { sbd: string; vi_sao: string }[] }> {
  const daLuu: { sbd: string; ma: string }[] = []
  const loi: { sbd: string; vi_sao: string }[] = []
  const vua: PhieuCanLuu[] = []
  for (const p of ds) {
    const co = new Blob([JSON.stringify(p.phieu)]).size
    if (co > CO_TOI_DA_PHIEU) {
      loi.push({ sbd: p.sbd, vi_sao: `Phiếu nặng ${(co / 1024 / 1024).toFixed(1)} MB vì nhiều hình, quá cỡ gửi bằng link` })
      continue
    }
    vua.push(p)
  }
  for (let i = 0; i < vua.length; i += TRAN_PHIEU_MOT_GOI) {
    const goi = vua.slice(i, i + TRAN_PHIEU_MOT_GOI).map((p) => ({ ...p, loai: p.loai || 'ketqua' }))
    const r = await postJson(scriptUrl, { action: 'luuNhieuPhieu', secret, items: goi }, 120)
    if (!r.ok) throw new Error(r.error || 'Không lưu được phiếu')
    for (const x of r.daLuu || []) daLuu.push({ sbd: String(x.sbd), ma: String(x.ma) })
    for (const x of r.loi || []) loi.push({ sbd: String(x.sbd), vi_sao: String(x.vi_sao) })
  }
  return { daLuu, loi }
}

export async function luuPhieu(scriptUrl: string, secret: string, d: { ma: string; maCa: string; sbd: string; hoTen: string; phieu: unknown; loai?: LoaiPhieu }): Promise<void> {
  const co = new Blob([JSON.stringify(d.phieu)]).size
  if (co > CO_TOI_DA_PHIEU) {
    throw new Error(
      `Phiếu này nặng ${(co / 1024 / 1024).toFixed(1)} MB vì nhiều hình, quá cỡ gửi bằng link. Thầy bấm Xem phiếu rồi dùng nút Tải tệp, gửi thẳng tệp qua Zalo.`,
    )
  }
  // Gói nặng nên cho hạn rộng hơn mặc định: 4 MB qua 4G có khi mất cả phút.
  // `loai` đặt SAU `...d`: để trước thì `...d` rải đè lại bằng undefined khi chỗ
  // gọi không truyền, và máy chủ nhận rỗng.
  // MÁY CHỦ MỚI TRƯỚC — phụ huynh mở link sẽ đọc từ đây, nhanh hơn ~30 lần.
  // Hỏng thì BỎ QUA: đây là đường tắt, không phải nghĩa vụ. Phiếu vẫn lưu như
  // hôm nay ở dòng dưới, chỉ là mở chậm hơn.
  try {
    const chMoi = await layCauHinhMayChu()
    await dayPhieuMoi(chMoi, secret, { ma: d.ma, maCa: d.maCa, sbd: d.sbd, hoTen: d.hoTen, loai: d.loai || 'ketqua', phieu: d.phieu })
  } catch {
    // không chặn việc lưu vì một đường tắt
  }

  // APPS SCRIPT VẪN LÀ NGUỒN SỰ THẬT. Chỉ dòng này được phép ném lỗi: lưu hỏng
  // ở đây mới thật sự là chưa có phiếu.
  const r = await postJson(scriptUrl, { action: 'luuPhieu', secret, ...d, loai: d.loai || 'ketqua' }, 90)
  if (!r.ok) throw new Error(r.error || 'Không lưu được phiếu')
}

/** HẠN CHỜ CỦA PHỤ HUYNH. Bằng đúng hạn của `luuPhieu` — hai đầu cùng một gói.
 *
 * Thầy báo 10/09 lúc 22:05, kèm ảnh màn phụ huynh: "Không mở được báo cáo —
 * Máy chủ không trả lời sau 25 giây."
 *
 * Hai chỗ lệch nhau, và cái thứ hai mới là gốc:
 *
 *   1. Bên GHI (`luuPhieu`) đã cho 90 giây với đúng lý do "gói nặng, 4 MB qua
 *      4G có khi mất cả phút" — mà bên ĐỌC lại chỉ được 25 giây mặc định cho
 *      CHÍNH cái gói ấy. Phiếu ca 890691 nặng 176 KB, phiếu có hình còn nặng
 *      hơn nhiều.
 *   2. Apps Script khoá theo script, tức TOÀN CỤC: một ca đang nộp bài là mọi
 *      lệnh khác xếp hàng phía sau. Đo tối 10/09, lúc 14 em ca 817428 đang nộp:
 *      `danhSachCa` — lệnh đọc nhẹ nhất trong app — cũng quá 25 giây rồi hỏng.
 *      Phụ huynh mở link đúng vào lúc ấy thì không có cách nào kịp.
 *
 * Với phụ huynh, chờ thêm nửa phút vẫn hơn hẳn một câu báo lỗi: họ bấm link
 * trong Zalo đúng một lần rồi thôi. */
const HAN_GIAY_LAY_PHIEU = 90

/** Chờ giữa hai lượt, đủ để lượt đang tắc trên máy chủ chạy xong. */
const CHO_THU_LAI_MS = 2500

export async function layPhieu(scriptUrl: string, ma: string): Promise<unknown> {
  // MÁY CHỦ MỚI TRƯỚC. Đo đường cũ sau khi đã tối ưu: p50 5,13 s · p95 5,85 s —
  // phụ huynh bấm link rồi ngồi nhìn năm giây. R2 trả cùng gói ấy trong vài
  // trăm mili giây.
  //
  // `null` nghĩa là "hỏi chỗ cũ", dùng chung cho cả ba ca: cờ tắt · phiếu tạo
  // trước hôm nay nên chỉ có bên Apps Script · mạng hỏng. Không ca nào được
  // biến thành báo đỏ cho phụ huynh.
  try {
    const chMoi = await layCauHinhMayChu()
    const nhanh = await layPhieuMoi(chMoi, ma)
    if (nhanh !== null && nhanh !== undefined) return nhanh
  } catch {
    // rơi xuống đường cũ
  }

  let cuoi: unknown = null
  // THỬ LẠI ĐÚNG MỘT LƯỢT, và CHỈ khi hỏng vì mạng hoặc hết hạn chờ. Máy chủ
  // trả lời "không có phiếu" là một CÂU TRẢ LỜI (thầy đã thu hồi link) — báo
  // ngay, không bắt phụ huynh ngồi chờ thêm 90 giây nữa cho một kết cục đã biết.
  for (let lan = 0; lan < 2; lan++) {
    try {
      const r = await postJson(scriptUrl, { action: 'layPhieu', ma }, HAN_GIAY_LAY_PHIEU)
      if (r.ok) return r.phieu
      throw new Error(r.error || 'Không tìm thấy phiếu')
    } catch (e) {
      cuoi = e
      if (e instanceof Error && e.message.includes('Không tìm thấy phiếu')) throw e
      if (lan === 0) await new Promise((nghi) => setTimeout(nghi, CHO_THU_LAI_MS))
    }
  }
  throw cuoi instanceof Error ? cuoi : new Error('Không mở được báo cáo')
}

// ------------------------------------------------- NỘP PHIẾU KHẮC PHỤC
// NOP-PHIEU-KHAC-PHUC.md. Lệnh nộp là lệnh GHI CÔNG KHAI: em chỉ có cái link,
// không có mã bí mật. Máy chủ tự chấm lại nên con số trả về là con số ĐÃ GHI,
// không phải con số máy em tính.

export interface KetQuaNopKhacPhuc {
  lanThu: number
  soCau: number
  soDung: number
  qidSai: string[]
  nopLuc: string
}

export async function nopKhacPhuc(scriptUrl: string, ma: string, sbd: string, dapAn: Record<string, string>): Promise<KetQuaNopKhacPhuc> {
  const r = await postJson(scriptUrl, { action: 'nopKhacPhuc', ma, sbd, dapAn })
  if (!r.ok) throw new Error(r.error || 'Không nộp được bài')
  return {
    lanThu: Number(r.lanThu) || 1,
    soCau: Number(r.soCau) || 0,
    soDung: Number(r.soDung) || 0,
    qidSai: Array.isArray(r.qidSai) ? (r.qidSai as string[]).map(chuoi) : [],
    nopLuc: chuoi(r.nopLuc),
  }
}

export interface LuotNopKhacPhuc {
  ma: string
  sbd: string
  lanThu: number
  nopLuc: string
  soCau: number
  soDung: number
  qidSai: string[]
}

/** Mọi lượt nộp khắc phục của một ca. Cần mã bí mật — chỉ thầy đọc. */
export async function nopKhacPhucTheoCa(scriptUrl: string, secret: string, maCa: string): Promise<LuotNopKhacPhuc[]> {
  const r = await postJson(scriptUrl, { action: 'nopKhacPhucTheoCa', secret, maCa })
  if (!r.ok) throw new Error(r.error || 'Không lấy được lượt nộp khắc phục')
  return (r.items as LuotNopKhacPhuc[]).map((x) => ({
    ma: chuoi(x.ma),
    sbd: chuoi(x.sbd),
    lanThu: Number(x.lanThu) || 0,
    nopLuc: chuoi(x.nopLuc),
    soCau: Number(x.soCau) || 0,
    soDung: Number(x.soDung) || 0,
    qidSai: Array.isArray(x.qidSai) ? x.qidSai.map(chuoi) : [],
  }))
}

/** Một dòng trong danh sách phiếu của ca. KHÔNG kèm nội dung phiếu — gói phiếu
 * nặng vài MB mỗi cái, kéo cả ca về là nghẹn mà thầy cũng không cần. */
export interface PhieuCuaCa {
  ma: string
  sbd: string
  hoTen: string
  taoLuc: string
  /** Số lần link đã được mở — thầy biết phụ huynh đã xem chưa. */
  soLanXem: number
  xemLanCuoi: string
  loai: LoaiPhieu
}

/** MÃ PHIẾU CỦA CẢ MỘT CA, mới nhất trước.
 *
 * Trước đây muốn gửi Zalo cho 27 phụ huynh thì phải mở phiếu từng em rồi copy
 * từng link. Lệnh này trả hết mã trong một lần gọi để màn Theo dõi dựng sẵn
 * danh sách link. Cần mã bí mật — mã phiếu là chìa khoá mở báo cáo của em. */
export async function phieuTheoCa(scriptUrl: string, secret: string, maCa: string): Promise<PhieuCuaCa[]> {
  const r = await postJson(scriptUrl, { action: 'phieuTheoCa', secret, maCa })
  if (!r.ok) throw new Error(r.error || 'Không lấy được danh sách phiếu của ca')
  return (r.items as PhieuCuaCa[]).map((x) => ({
    ...x,
    ma: chuoi(x.ma),
    sbd: chuoi(x.sbd),
    hoTen: chuoi(x.hoTen),
    soLanXem: Number(x.soLanXem) || 0,
    loai: x.loai === 'baitap' ? 'baitap' : 'ketqua',
  }))
}

export async function xoaPhieu(scriptUrl: string, secret: string, ma: string): Promise<void> {
  const r = await postJson(scriptUrl, { action: 'xoaPhieu', secret, ma })
  if (!r.ok) throw new Error(r.error || 'Không thu hồi được phiếu')
}

export async function xoaDe(scriptUrl: string, secret: string, maDe: string): Promise<void> {
  const r = await postJson(scriptUrl, { action: 'xoaDe', secret, maDe })
  if (!r.ok) throw new Error(r.error || 'Xoá đề thất bại')
}

// ============================================================================
// LỊCH SỬ CA THI + CHI TIẾT + XOÁ MỀM + GHI ĐIỂM/CHI TIẾT CÂU (QUANLYCATHI 2, 5)
// Tất cả cần MA_BI_MAT (máy thầy); ghiDiem chấp nhận thêm idThietBi của chính lượt (máy em).
// ============================================================================

export interface CaTomTat {
  maCa: string
  tenCa: string
  lop: string
  thoiGianPhut: number
  moLuc: string
  batDau: string
  hetHanVao: string
  trangThai: 'mo' | 'dong' | 'da_xoa'
  phamVi: PhamViCa
  congBo: CongBoDiem
  /** 'baitap' = bài tập về nhà (BA-APP đợt 3). Ca cũ không có cột này → 'thi'. */
  loai: LoaiCa
  hanNop: string
  /** Nút gạt "dùng ca này để gọi lên bảng". Ca cũ không có cột này → true. */
  lenBang: boolean
  /** Thời điểm bị xoá mềm (chỉ có khi lấy danh sách ca đã xoá). */
  xoaLuc?: string
  /** Dấu vết KHOÁ CA thủ công — ai khoá lúc nào, mở lại lúc nào. */
  khoaLuc?: string
  khoaBoi?: string
  moKhoaLuc?: string
  /** PHÒNG CHỜ (thầy chốt 07/09): em vào ca thì đứng ở màn chờ, chưa nhận đề.
   * Ca cũ không có cột này ⇒ false, chạy y như trước. */
  phongCho?: boolean
  /** Thầy bấm "Bắt đầu thi" lúc nào. Rỗng = chưa bấm, em vẫn đang chờ. */
  batDauThiLuc?: string
  /** CA ĐỀ RIÊNG TỪNG EM — đọc từ máy chủ, nên máy nào mở ca cũng biết.
   * Ca mở trước 08/09 không có cột này ⇒ false, chạy y như trước. */
  deRieng?: boolean
  /** Phạm vi lấy câu sai của ca đề riêng: 'gan_nhat' | 'ba_ca'. */
  phamViHoiLai?: 'gan_nhat' | 'ba_ca'
  daVao: number
  daNop: number
  canhBao: number
}

// ---------------------------------------------------------------------------
// GỘP LƯỢT GỌI `danhSachCa` — lệnh bị gọi nhiều nhất trong app
// ---------------------------------------------------------------------------
//
// 11 chỗ trong app gọi lệnh này, và thầy đổi màn là gọi lại. Đo 10/09 tối, lúc
// máy chủ RẢNH: mỗi lượt 3,1 – 4,9 giây. Mở màn Ca thi rồi sang màn Học sinh
// rồi quay lại là ba lượt gọi cho cùng một danh sách 10 ca — mười giây ngồi
// nhìn vòng xoay, trong khi danh sách ấy không đổi.
//
// HAI LỚP, cả hai đều nhỏ và đều an toàn:
//
//   1. GỘP LƯỢT ĐANG BAY (single-flight). Hai màn cùng hỏi một lúc thì đi CHUNG
//      một lượt gọi. Không có lớp này thì màn Ca thi và thanh điều hướng bắn
//      hai lượt song song cho cùng một câu hỏi.
//   2. ĐỆM NGẮN 8 GIÂY. Đủ để nuốt trọn một chuỗi đổi màn, và ngắn hơn nhịp
//      làm mới của màn Theo dõi nên thầy không bao giờ nhìn phải số cũ quá một
//      nhịp.
//
// VÌ SAO 8 GIÂY LÀ AN TOÀN: danh sách ca đổi khi thầy TỰ mở/khoá/xoá ca — mà
// những việc đó đều đi qua `xoaBoDemCa()` ngay bên dưới, nên bấm xong là thấy
// ngay, không phải chờ hết đệm. Đệm chỉ chặn những lượt hỏi LẶP trong lúc không
// có gì thay đổi.
const DEM_CA_MS = 8000

interface DemCa {
  luc: number
  ds: CaTomTat[]
}
const demCa = new Map<string, DemCa>()
const dangBay = new Map<string, Promise<CaTomTat[]>>()

/** XOÁ ĐỆM. Gọi ngay sau mọi lệnh làm đổi danh sách ca — mở ca, khoá ca, đổi
 * tên, xoá, khôi phục. Thà hỏi lại một lượt còn hơn để thầy nhìn số cũ. */
export function xoaBoDemCa(): void {
  demCa.clear()
  dangBay.clear()
}

/** daXoa = true → lấy các ca ĐÃ XOÁ (thùng rác) thay vì ca đang dùng. */
export async function danhSachCa(scriptUrl: string, secret: string, daXoa = false): Promise<CaTomTat[]> {
  const khoa = `${scriptUrl}|${daXoa}`
  const co = demCa.get(khoa)
  if (co && Date.now() - co.luc < DEM_CA_MS) return co.ds
  const bay = dangBay.get(khoa)
  if (bay) return bay
  const p = danhSachCaThat(scriptUrl, secret, daXoa)
    .then((ds) => {
      demCa.set(khoa, { luc: Date.now(), ds })
      return ds
    })
    .finally(() => {
      dangBay.delete(khoa)
    })
  dangBay.set(khoa, p)
  return p
}

async function danhSachCaThat(scriptUrl: string, secret: string, daXoa: boolean): Promise<CaTomTat[]> {
  const r = await postJson(scriptUrl, { action: 'danhSachCa', secret, daXoa })
  if (!r.ok) throw new Error(r.error || 'Không lấy được danh sách ca')
  return (r.items as CaTomTat[]).map((c) => ({
    ...c,
    maCa: String(c.maCa),
    lop: String(c.lop ?? ''),
    tenCa: String(c.tenCa ?? ''),
    loai: c.loai === 'baitap' ? 'baitap' : 'thi',
    hanNop: String(c.hanNop ?? ''),
    // Máy chủ chưa cập nhật (.gs bản cũ) thì KHÔNG có trường này — coi như bật,
    // để danh sách ca ở màn Gọi lên bảng không rỗng sau khi cập nhật app.
    lenBang: c.lenBang !== false,
  }))
}

export interface LuotThiRow {
  sbd: string
  hoTen: string
  lanThu: number
  trangThai: TrangThaiLuot
  vaoLuc: string
  hetGioLuc: string
  nopLuc: string
  soLanRoiMan: number
  tongGiayRoiMan: number
  diemI: number | null
  diemII: number | null
  diemIII: number | null
  tong: number | null
  duyetBoi: string
  duyetLuc: string
  ghiChu: string
  dapAn: AnswerRecord | null
  integrity: IntegrityLog | null
  giayCau: Record<string, number> | null
}

export interface ChiTietCa {
  ca: Omit<CaTomTat, 'daVao' | 'daNop' | 'canhBao'> & { danhSachMoi: string | string[]; nguoiTao: string; nguongLan?: number; nguongGiay?: number }
  luot: LuotThiRow[]
  /** Ngân hàng CÓ đáp án của ca — chỉ trả khi gọi với `xinKeyBank`, để máy thầy
   * chưa có bản đề (ca mở ở máy khác) vẫn chấm lại và xuất phiếu được. */
  keyBank?: KeyBank | null
  /** Những lượt bị cổng danh sách CHẶN, mới nhất trước. Máy chủ cố ý không nói
   * cho em biết sai ô nào, nhưng thầy đứng trong phòng thì phải thấy. */
  biChan?: LuotBiChan[]
  /** EM ĐANG ĐỨNG Ở PHÒNG CHỜ, vào trước đứng trước.
   *
   * Cổng phòng chờ KHÔNG tạo lượt thi, nên đây là nguồn duy nhất trả lời "ai
   * đang có mặt" — và chế độ đề riêng từng em rút bộ câu đúng theo danh sách
   * này lúc thầy bấm Bắt đầu (thầy chốt 08/09). */
  dsCho?: { sbd: string; hoTen: string; vaoLuc: string }[]
  /** sbd → qid CÂU HỎI LẠI của em đó, đọc từ chính ô máy chủ đã ghi lúc bấm
   * Bắt đầu.
   *
   * Vì sao cần: bản đồ này được cất ở IndexedDB của MÁY BẤM BẮT ĐẦU. Thầy bấm
   * ở điện thoại rồi mở ca trên máy tính là máy tính không có gì, và màn Ca thi
   * im lặng — đúng lỗi thầy gặp 08/09. Lệnh này đã đòi mã bí mật nên trả cả
   * bản đồ lớp ở đây không mở thêm quyền cho ai. */
  /** BỘ CÂU TỪNG EM của ca, đọc từ máy chủ. Đây là bản đồ dùng để CHẤM.
   *
   * Thầy bắt được 08/09: màn Ca thi chỉ đọc bản đồ cất ở IndexedDB của đúng cái
   * máy đã bấm Bắt đầu. Mở ca ở máy khác là chấm lại bằng luật hash ⇒ khối "câu
   * em sai buổi trước" đếm ra 0 dù máy chủ có đủ 8 câu, và điểm hiện trên bảng
   * cũng là điểm của một bộ câu khác. */
  boTheoEmCa?: Record<string, string[]>
  lapTheoEm?: Record<string, string[]>
  /** sbd → qid → số lần sai trước ca này, đọc từ máy chủ. */
  demSaiTheoEm?: Record<string, Record<string, number>>
  /** Biên bản lúc rút đề riêng, đọc từ máy chủ. */
  bienBanDeRieng?: Record<string, unknown> | null
}

/** Một lượt bị cổng vào thi chặn. `lyDo` do máy chủ đặt:
 * `khong_co_sbd` số báo danh không có trong danh sách lớp ·
 * `lech_ho_ten` họ tên gõ khác danh sách · `lech_nam_sinh` năm sinh gõ khác. */
export interface LuotBiChan {
  luc: string
  sbd: string
  hoTenGoi: string
  namSinhGoi: string
  hoTenDs: string
  namSinhDs: string
  lyDo: string
}

const TEN_LY_DO_CHAN: Record<string, string> = {
  khong_co_sbd: 'Số báo danh không có trong danh sách lớp',
  lech_ho_ten: 'Họ tên gõ khác danh sách',
  lech_nam_sinh: 'Năm sinh gõ khác danh sách',
  // KHÔNG phải một lượt bị chặn: em VÀO ĐƯỢC. Dòng này để thầy biết máy em còn
  // giữ bản cũ (bản không có màn xác nhận tên), nên máy chủ không có gì để so.
  khong_gui_ten: 'Máy em còn bản cũ, không gửi tên để đối chiếu (em vẫn vào được)',
}

export function moTaLyDoChan(lyDo: string): string {
  return TEN_LY_DO_CHAN[lyDo] || 'Không khớp danh sách lớp'
}

/** Hạn cho lượt xin CHI TIẾT CA — LUÔN dùng, không phân biệt có xin đáp án.
 *
 * Thầy báo 08/09 khuya: điểm ca 447479 sai, mà `chamLaiCa` gọi qua cầu nối
 * hỏng BA LẦN liền, cả ba đều "Máy chủ không trả lời sau 25 giây". Ca đó 36 em;
 * gói trả về mang cả đáp án của kho lẫn bài làm của từng em, không có cách nào
 * gọn dưới 25 giây. Vòng vá đầu chỉ nới cho nhánh CÓ xin đáp án.
 *
 * ĐỢT 2, cùng đêm: `chamLaiCa('248567')` lại hỏng đúng câu đó HAI LẦN liền, dù
 * ca chỉ 21 em. Lần này `gomCa` KHÔNG xin đáp án (máy đã cất sẵn bộ đề của ca)
 * nên rơi vào nhánh 25 giây. Tức chỗ nặng KHÔNG phải ngân hàng đáp án: bản thân
 * `chiTietCa` đã trả về `dapAn` đầy đủ của từng lượt rồi.
 *
 * Nên hạn dài áp cho CẢ HAI nhánh. Đây không phải lượt gọi nhỏ trong bất kỳ
 * trường hợp nào. Lấy đúng mức của `hoSoNhieuEm`, vốn cũng là lượt gọi nặng. */
const HAN_GIAY_CHI_TIET_CA = 90

export async function chiTietCa(scriptUrl: string, secret: string, maCa: string, xinKeyBank = false): Promise<ChiTietCa> {
  const r = await postJson(scriptUrl, { action: 'chiTietCa', secret, maCa, xinKeyBank }, HAN_GIAY_CHI_TIET_CA)
  if (!r.ok) throw new Error(r.error || 'Không lấy được chi tiết ca')
  const goiDR = moGoiDeRieng(r.goiDeRieng)
  return {
    ca: { ...r.ca, maCa: String(r.ca.maCa), lop: String(r.ca.lop ?? '') },
    luot: (r.luot as LuotThiRow[]).map((l) => ({ ...l, sbd: String(l.sbd), lanThu: Number(l.lanThu) || 1 })),
    keyBank: (r.keyBank as KeyBank) ?? null,
    // Máy chủ cũ chưa có trường này ⇒ mảng rỗng, màn hình không vỡ.
    biChan: Array.isArray(r.biChan)
      ? (r.biChan as Record<string, unknown>[]).map((b) => ({
          luc: String(b.luc ?? ''),
          sbd: String(b.sbd ?? ''),
          hoTenGoi: String(b.hoTenGoi ?? ''),
          namSinhGoi: String(b.namSinhGoi ?? ''),
          hoTenDs: String(b.hoTenDs ?? ''),
          namSinhDs: String(b.namSinhDs ?? ''),
          lyDo: String(b.lyDo ?? ''),
        }))
      : [],
    dsCho: Array.isArray(r.dsCho)
      ? (r.dsCho as Record<string, unknown>[]).map((x) => ({ sbd: chuoi(x.sbd), hoTen: chuoi(x.hoTen), vaoLuc: chuoi(x.vaoLuc) })).filter((x) => x.sbd)
      : [],
    // Ưu tiên gói riêng (luôn có, mọi máy); `keyBank.boTheoEm` là đường cũ.
    boTheoEmCa: goiDR.bo ?? (r.keyBank as { boTheoEm?: Record<string, string[]> } | null | undefined)?.boTheoEm ?? undefined,
    lapTheoEm: goiDR.lap,
    demSaiTheoEm: goiDR.dem,
    bienBanDeRieng: goiDR.bb,
  }
}

/** GHI KẾT QUẢ CHỮA BÀI TRÊN BẢNG vào log mạnh–yếu của em.
 *
 * Một câu, một lần: đạt = làm đúng, không đạt = làm sai. Máy chủ cộng vào bảng
 * chuyên đề tổng của em nhưng KHÔNG tạo lượt thi giả và KHÔNG đụng điểm số —
 * nên nó không bao giờ bị nhầm thành "ca gần nhất". */
export async function ghiLenBang(scriptUrl: string, secret: string, d: { sbd: string; chuyenDe: string; dat: boolean; qid?: string }): Promise<void> {
  const r = await postJson(scriptUrl, { action: 'ghiLenBang', secret, sbd: d.sbd, chuyenDe: d.chuyenDe, dat: d.dat, qid: d.qid || '' })
  if (!r.ok) throw new Error(r.error || 'Không ghi được kết quả lên bảng')
}

/** Số lần mỗi em đã lên bảng trong `soNgay` ngày gần đây.
 *
 * Máy chủ trả về ĐÚNG bấy nhiêu: SBD, số lần, lần cuối, và mã câu đã chữa. Không
 * tên em, không nội dung câu — màn Gọi lên bảng chỉ cần chừng đó để tính hệ số
 * công bằng tần suất `moi(e)`.
 *
 * Sheet `LenBang` là sheet MỚI (thêm, không đụng bảng nào đang chạy). Máy chủ
 * bản cũ chưa có lệnh này ⇒ ném lỗi; chỗ gọi phải coi đó là "chưa có lịch sử"
 * chứ không phải hỏng. */
export interface LichSuLenBangEm {
  soLan: number
  lanCuoi: string
  qids: string[]
}
export async function lichSuLenBang(
  scriptUrl: string,
  secret: string,
  soNgay?: number,
): Promise<{ soNgay: number; theoEm: Record<string, LichSuLenBangEm> }> {
  const r = await postJson(scriptUrl, { action: 'lichSuLenBang', secret, soNgay: soNgay ?? 0 })
  if (!r.ok) throw new Error(r.error || 'Không đọc được lịch sử lên bảng')
  return { soNgay: Number(r.soNgay) || 30, theoEm: (r.theoEm ?? {}) as Record<string, LichSuLenBangEm> }
}

// ---------------------------------------------------------------------------
// HỎI BÀI THẦY (HOIBAITHAY.md mục 2.3)

/** EM GỬI CÂU HỎI. KHÔNG kèm mã bí mật — đây là lệnh ghi công khai, máy chủ
 * khoá bằng bốn lớp chứ không bằng mã bí mật (máy em không bao giờ có mã đó).
 *
 * Gói gửi đi CHỈ có mã ca, số báo danh, mảng mã câu và ghi chú — không đề,
 * không đáp án, không lời giải (điều cấm số 1). */
export async function guiCauHoi(scriptUrl: string, goi: GoiCauHoi): Promise<{ soCau: number; guiLuc: string }> {
  const r = await postJson(scriptUrl, { action: 'guiCauHoi', ...goi })
  if (!r.ok) throw new Error(r.error || 'Không gửi được câu hỏi')
  return { soCau: Number(r.soCau) || 0, guiLuc: String(r.guiLuc || '') }
}

/** MÃ PHIẾU KẾT QUẢ CỦA CHÍNH EM trong một ca — cho link `/d/<mã ca>`.
 *
 * KHÔNG kèm mã bí mật, và cũng KHÔNG trả nội dung phiếu: chỉ trả mã, rồi máy em
 * mở `/p#<mã>` bằng đúng lệnh `layPhieu` công khai đã có.
 *
 * Cổng danh tính y hệt lúc vào thi — phải khớp ĐỦ BA: số báo danh, họ tên, năm
 * sinh với danh sách lớp thầy đã nạp. Biết mỗi số báo danh thì không lấy được
 * gì, đúng như link vào thi. */
export interface BaiDaNopCuaEm {
  /** Mã phiếu kết quả — rỗng khi thầy chưa dựng phiếu cho ca. */
  ma: string
  maBaiTap: string
  tong: number | null
  hoTen: string
  lop: string
  tenCa: string
  thoiGianPhut: number
  giuDeDoc: boolean
  luot: {
    lanThu: number
    vaoLuc: string
    nopLuc: string
    trangThai: string
    dapAn: AnswerRecord | null
    giayCau: Record<string, number> | null
    integrity: IntegrityLog | null
    soLanRoiMan: number
    tongGiayRoiMan: number
  }
  /** Ngân hàng CÓ đáp án của ca — để máy em chấm lại và mở đề, lời giải. */
  bank: KeyBank | null
}

export async function phieuCuaEm(scriptUrl: string, maCa: string, sbd: string): Promise<BaiDaNopCuaEm> {
  const r = await postJson(scriptUrl, { action: 'phieuCuaEm', maCa, sbd })
  if (!r.ok) throw new Error(r.error || 'Không tìm được bài của em')
  const l = r.luot || {}
  return {
    ma: String(r.ma || ''),
    maBaiTap: String(r.maBaiTap || ''),
    tong: r.tong === null || r.tong === undefined ? null : Number(r.tong),
    hoTen: String(r.hoTen || ''),
    lop: String(r.lop || ''),
    tenCa: String(r.tenCa || ''),
    thoiGianPhut: Number(r.thoiGianPhut) || 0,
    giuDeDoc: r.giuDeDoc === true,
    luot: {
      lanThu: Number(l.lanThu) || 1,
      vaoLuc: String(l.vaoLuc || ''),
      nopLuc: String(l.nopLuc || ''),
      trangThai: String(l.trangThai || ''),
      dapAn: l.dapAn ?? null,
      giayCau: l.giayCau ?? null,
      integrity: l.integrity ?? null,
      soLanRoiMan: Number(l.soLanRoiMan) || 0,
      tongGiayRoiMan: Number(l.tongGiayRoiMan) || 0,
    },
    bank: r.bank ?? null,
  }
}

/** LỊCH SỬ ĐIỂM CỦA CHÍNH EM — để báo cáo sau thi vẽ đường tiến bộ.
 *
 * KHÔNG kèm mã bí mật: máy em không bao giờ có mã đó. Máy chủ khoá bằng hai
 * lớp — phải có lượt ĐÃ NỘP đúng cặp (maCa, sbd), và `idThietBi` phải khớp
 * lượt đó. Nhờ vậy đọc theo số báo danh trần không lấy được gì, mà em đổi máy
 * vẫn thấy đủ lịch sử (mỏ neo là lượt vừa nộp trên máy mới). */
export async function lichSuEm(scriptUrl: string, maCa: string, sbd: string, idThietBi: string): Promise<DiemMotCa[]> {
  const r = await postJson(scriptUrl, { action: 'lichSuEm', maCa, sbd, idThietBi })
  if (!r.ok) throw new Error(r.error || 'Không xem được lịch sử')
  const ds = Array.isArray(r.items) ? r.items : []
  return ds.map((x: { maCa?: string; tenCa?: string; ngay?: string; tong?: number }) => ({
    maCa: String(x.maCa || ''),
    tenCa: String(x.tenCa || ''),
    ngay: String(x.ngay || ''),
    tong: Number(x.tong) || 0,
    // Máy chủ KHÔNG trả hạng và sĩ số ở đây: tính hạng đòi đọc điểm cả lớp,
    // mà lệnh này là lệnh công khai — không mở đường đọc điểm em khác.
    hang: null,
    siSo: null,
  }))
}

// ---------------------------------------------------------------------------
// CÂU KHẮC PHỤC RÚT TỪ KHO ĐỀ (thầy chốt 06/09)

export interface KetQuaKhacPhuc {
  /** Từng đề gốc một khối, GIỮ NGUYÊN `ma_de` để mã câu không đụng nhau: hai
   * đề khác nhau đều có câu I-5, gộp chung một mã đề là mất một câu. */
  nguon: { maDe: string; json: unknown }[]
  soCau: number
  /** Số câu máy chủ CHỌN được. Lớn hơn `soCau` nghĩa là bị cắt vì gói quá nặng. */
  soChon: number
  /** Mã câu theo ĐÚNG thứ tự máy chủ đã xếp (dễ lên khó). Gói trả về gom theo
   * đề nên tự nó không giữ được thứ tự này. */
  thuTu: string[]
  catBotViNang: boolean
}

/** EM KÉO CÂU KHẮC PHỤC TỪ KHO ĐỀ sau khi nộp bài.
 *
 * Khoá y như `lichSuEm`: không kèm mã bí mật, máy chủ đòi có lượt ĐÃ NỘP đúng
 * cặp (maCa, sbd) và `idThietBi` khớp lượt đó. Đây là lệnh công khai duy nhất
 * trả về đề CÓ ĐÁP ÁN VÀ LỜI GIẢI nên còn thêm trần 60 câu và trần dung lượng.
 *
 * `loaiTru` là mã những câu em VỪA LÀM trong ca — thầy yêu cầu câu khắc phục
 * phải khác hẳn câu vừa sai, luyện lại đúng câu cũ thì em chỉ nhớ đáp án. */
export async function cauKhacPhuc(
  scriptUrl: string,
  maCa: string,
  sbd: string,
  idThietBi: string,
  chuyenDe: string[],
  loaiTru: string[],
  soCau: number,
): Promise<KetQuaKhacPhuc> {
  // HẠN 60 GIÂY thay vì 25 mặc định. Hai lý do: gói trả về tới 2,5 MB (câu có
  // ảnh), và lần gọi đầu sau khi thầy đẩy đề mới còn phải chờ máy chủ dựng lại
  // chỉ mục cả kho. Hết hạn thì em vẫn có bộ dự phòng của ca, nhưng để 25 giây
  // là gần như chắc chắn hụt đúng lần đầu.
  const r = await postJson(scriptUrl, { action: 'cauKhacPhuc', maCa, sbd, idThietBi, chuyenDe, loaiTru, soCau }, 60)
  if (!r.ok) throw new Error(r.error || 'Không lấy được câu khắc phục')
  const items = Array.isArray(r.items) ? r.items : []
  return {
    nguon: items.map((x: { ma_de?: string }) => ({ maDe: String(x?.ma_de || ''), json: x })),
    soCau: Number(r.soCau) || 0,
    soChon: Number(r.soChon) || 0,
    thuTu: Array.isArray(r.thuTu) ? r.thuTu.map((x: unknown) => String(x)) : [],
    catBotViNang: r.catBotViNang === true,
  }
}

/** MÁY EM GHI GÓI CÂU KHẮC PHỤC vừa nhận, để nộp được ngay sau khi thi.
 *
 * Báo cáo em xem ngay sau khi nộp do chính máy em dựng tại chỗ — không có mã
 * phiếu, mà `nopKhacPhuc` chấm theo mã. Lệnh này cấp mã cho đúng bộ câu em
 * đang cầm (thầy bắt được 08/09: "ca thi mới bấm tạo đề khắc phục ngay sau lúc
 * thi vẫn không có thanh nộp").
 *
 * KHÔNG kèm mã bí mật: máy em không bao giờ có. Cổng là lượt thi có thật của
 * chính em, đúng máy đã thi — cùng cổng với `cauKhacPhuc`. */
export async function ghiPhieuKhacPhuc(
  scriptUrl: string,
  maCa: string,
  sbd: string,
  idThietBi: string,
  cau: { id: string; phan: 'I' | 'II' | 'III'; dapAn: string }[],
  tt: { hoTen?: string; tenChuyenDe?: string } = {},
): Promise<string> {
  if (cau.length === 0) return ''
  const r = await postJson(scriptUrl, { action: 'ghiPhieuKhacPhuc', maCa, sbd, idThietBi, cau, hoTen: tt.hoTen || '', tenChuyenDe: tt.tenChuyenDe || '' }, 45)
  if (!r.ok) throw new Error(r.error || 'Không ghi được phiếu khắc phục')
  return String(r.ma || '')
}

/** THẦY dựng lại chỉ mục câu của kho đề sau khi đẩy đề mới, để em đầu tiên
 * bấm "tạo câu khắc phục" không phải chờ máy chủ mở cả kho. */
export async function dungChiMuc(scriptUrl: string, secret: string): Promise<number> {
  const r = await postJson(scriptUrl, { action: 'dungChiMuc', secret })
  if (!r.ok) throw new Error(r.error || 'Không dựng được chỉ mục')
  return Number(r.soCau) || 0
}

/** THẦY LẤY toàn bộ câu hỏi của một ca. */
export async function danhSachCauHoi(scriptUrl: string, secret: string, maCa: string, thungRac = false): Promise<CauHoiCuaEm[]> {
  const r = await postJson(scriptUrl, { action: 'danhSachCauHoi', secret, maCa, thungRac })
  if (!r.ok) throw new Error(r.error || 'Không lấy được câu hỏi')
  return Array.isArray(r.items) ? (r.items as CauHoiCuaEm[]) : []
}

/** THẦY BỎ CA VÀO THÙNG RÁC hoặc KHÔI PHỤC lại — nhiều ca một lượt.
 *
 * Máy chủ chỉ ĐÁNH DẤU cột `Xoa`, không xoá dòng, nên bấm nhầm còn lấy lại
 * được. `tatCa` dùng cho nút "Khôi phục tất cả" trong thùng rác. */
export async function xoaCauHoi(
  scriptUrl: string,
  secret: string,
  maCa: string[],
  opt: { khoiPhuc?: boolean; tatCa?: boolean } = {},
): Promise<{ soDong: number; soCa: number }> {
  const r = await postJson(scriptUrl, { action: 'xoaCauHoi', secret, maCa, khoiPhuc: opt.khoiPhuc === true, tatCa: opt.tatCa === true })
  if (!r.ok) throw new Error(r.error || (opt.khoiPhuc ? 'Không khôi phục được' : 'Không xoá được'))
  // Danh sách ca vừa đổi — bỏ đệm để lượt hỏi tiếp theo thấy ngay.
  xoaBoDemCa()
  return { soDong: Number(r.soDong) || 0, soCa: Number(r.soCa) || 0 }
}

/** ĐÁNH DẤU ĐÃ CHỮA. Không truyền `sbd` = cả ca. Dòng đã chữa KHÔNG bị xoá —
 * lần sau thầy còn tra lại được câu nào lớp hay vướng (mục 4E). */
export async function danhDauDaChua(scriptUrl: string, secret: string, maCa: string, sbd = '', chua = true): Promise<number> {
  const r = await postJson(scriptUrl, { action: 'danhDauDaChua', secret, maCa, sbd, chua })
  if (!r.ok) throw new Error(r.error || 'Không đánh dấu được')
  return Number(r.soDong) || 0
}

/** Xoá MỀM một ca — phải gõ lại đúng mã ca (xacNhan). Bài làm/điểm giữ nguyên trên Sheet. */
export async function xoaCa(scriptUrl: string, secret: string, maCa: string, xacNhan: string): Promise<void> {
  const r = await postJson(scriptUrl, { action: 'xoaCa', secret, maCa, xacNhan })
  if (!r.ok) throw new Error(r.error || 'Không xoá được ca')
}

/** Khôi phục một ca đã xoá mềm — bài làm vẫn còn nguyên nên lấy lại được. */
export async function khoiPhucCa(scriptUrl: string, secret: string, maCa: string): Promise<void> {
  const r = await postJson(scriptUrl, { action: 'khoiPhucCa', secret, maCa })
  if (!r.ok) throw new Error(r.error || 'Không khôi phục được ca')
  // Danh sách ca vừa đổi — bỏ đệm để lượt hỏi tiếp theo thấy ngay.
  xoaBoDemCa()
}

/** Kết quả xoá hàng loạt: ca nào xoá được, ca nào không kèm lý do. */
export interface KetQuaXoaNhieu {
  ok: string[]
  loi: { maCa: string; loi: string }[]
}

/** Xoá MỀM nhiều ca một lượt. Gọi tuần tự (Apps Script ghi Sheet, chạy song song
 * dễ chèn nhau); mỗi ca tự lấy mã của nó làm xacNhan vì thầy đã tích chọn ca đó
 * trên màn hình. Một ca lỗi KHÔNG chặn các ca còn lại. */
export async function xoaNhieuCa(scriptUrl: string, secret: string, dsMaCa: string[]): Promise<KetQuaXoaNhieu> {
  const kq: KetQuaXoaNhieu = { ok: [], loi: [] }
  for (const maCa of dsMaCa) {
    try {
      await xoaCa(scriptUrl, secret, maCa, maCa)
      kq.ok.push(maCa)
    } catch (e) {
      kq.loi.push({ maCa, loi: e instanceof Error ? e.message : 'lỗi không rõ' })
    }
  }
  return kq
}

/** Một dòng ChiTietCau (mục 5). soCau = số thứ tự em nhìn thấy (1..n trong phần). */
export interface ChiTietCauRow {
  phan: 'I' | 'II' | 'III'
  soCau: number
  qid: string
  chuyenDe: string
  mucDo: string
  dapAnChon: string
  dapAnDung: string
  dungSai: boolean | null
  giay: number | null
}

export interface BaiGhiDiem {
  sbd: string
  lanThu: number
  idThietBi?: string
  diem: { I: number; II: number; III: number; tong: number }
  cau: ChiTietCauRow[]
}

/** Ghi điểm + chi tiết từng câu cho nhiều lượt trong 1 lần gọi (máy thầy: secret;
 * máy em: secret rỗng + idThietBi của lượt). Trả về SBD đã ghi / bị từ chối. */
export async function ghiDiem(
  scriptUrl: string,
  secret: string,
  maCa: string,
  bai: BaiGhiDiem[],
  /** MẪU SỐ đã dùng để chấm lô này — số câu mỗi phần của ca.
   *
   * VÌ SAO BẮT KHAI (đo 09/09 chiều, ca 447479 bị đè điểm lần thứ ba).
   * Hai bên chấm ra CÙNG số câu đúng nhưng khác điểm, vì khác mẫu số: máy chấm
   * đúng chia theo số câu thật của ca (8/2/2 với ca đó), bên chấm sai rơi về
   * mặc định 18/4/6. Em 12038: 4 câu đúng phần I ra 2,25 với mẫu số đúng, ra
   * 1,00 với mẫu số mặc định — cả ba phần đều khớp kiểu ấy.
   *
   * Máy chủ giữ `keyBank.soCau` của ca, tức BIẾT mẫu số đúng. Nên nay bên ghi
   * phải khai mẫu số nó dùng; lệch là từ chối, có báo lý do. Chốt này chặn đúng
   * nguyên nhân và KHÔNG phụ thuộc vào việc máy nào đang chấm sai — thứ tôi đã
   * đoán sai hai lần liên tiếp. */
  soCau?: { I: number; II: number; III: number },
): Promise<{ daGhi: string[]; tuChoi: string[] }> {
  if (bai.length === 0) return { daGhi: [], tuChoi: [] }
  // `luatDiem`: tem luật chấm — máy chủ chỉ nhận ĐIỂM từ máy em khi tem khớp.
  // Xem ghi chú ở `LUAT_DIEM` trong engine/score.ts.
  //
  // HẠN 90 GIÂY, không phải 25. Đo 08/09 khuya bằng hook `fetch`: `chamLaiCa`
  // ca 248567 chết ở ĐÂY (`ghiDiem` một lô hỏng ở 25,3 giây) chứ không phải ở
  // `chiTietCa` (xong trong 5 giây) như vòng đoán trước. Lượt này vừa xoá dòng
  // chi tiết cũ vừa ghi hàng chục dòng mới — nặng nhất trong cả chuỗi.
  const r = await postJson(scriptUrl, { action: 'ghiDiem', secret, maCa, bai, luatDiem: LUAT_DIEM, soCau }, 90)
  if (!r.ok) throw new Error(r.error || 'Không ghi được điểm')
  return { daGhi: r.daGhi ?? [], tuChoi: r.tuChoi ?? [] }
}
