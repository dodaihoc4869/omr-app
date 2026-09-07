// CỔNG DUY NHẤT ĐỂ RÚT CÂU CHỮA — đặc tả v3 (06-09-2026).
//
// ============================================================================
// VÌ SAO CÓ FILE NÀY
// ============================================================================
// Câu chữa phải khắc phục ĐÚNG LỖI của câu sai đó. Em sai câu tính hiệu suất
// ester hoá thì nhận thêm câu tính hiệu suất ester hoá — KHÔNG BAO GIỜ nhận câu
// danh pháp ester chỉ vì cùng chuyên đề. Chuyên đề là cái rổ rộng; lọc theo nó
// chính là cái đang hỏng.
//
// ============================================================================
// CHỐT KIẾN TRÚC — chỗ quyết định cả đặc tả
// ============================================================================
// Máy KHÔNG đoán "giống dạng" lúc chạy. AI gán MÃ DẠNG cho từng câu MỘT LẦN
// lúc nạp đề, mã nằm luôn trong kho. Lúc rút chỉ so mã bằng nhau:
//
//   · đúng tuyệt đối — bằng thì bằng, không có ngưỡng nào để cãi;
//   · chạy offline, không key, không mạng;
//   · thầy đọc lại và sửa tay được khi AI gán sai.
//
// AI thành DỮ LIỆU KIỂM ĐƯỢC, không thành hộp đen chạy ngầm.
//
// VÌ SAO KHÔNG NHÚNG KEY AI VÀO ĐÂY: app chạy trên GitHub Pages, ai mở trang
// cũng đọc được mã nguồn. Key nằm trong client là ai cũng tiêu tiền của thầy
// được. Cần AI lúc chạy thì đi qua Apps Script — server giữ key. Chưa build.
//
// ============================================================================
// MỘT CỔNG, KHÔNG CÓ CỬA SAU
// ============================================================================
// `chonCauLuyen` không được gọi thẳng từ component; có test quét mã nguồn chặn.
// Ba luật sống chết — không lấy câu khác mã, không tụt xuống tầng chuyên đề,
// không câu nào không nhãn — chỉ giữ được nếu có đúng một chỗ thi hành.

import type { TeacherExamSource } from '../data/examContent'
import type { ChiTietCauRow } from './exam-api'
import { cauLuyenTuNguon, chonCauLuyen, type CauLuyen, type MucDoCau } from './bai-tap-pdf'
import { CHO_BAC_2, SO_CAU_MAC_DINH, hangUuTien, nhanhCoChe } from './cau-hinh-chua'
import { hopSao, LOC_SAO_MAC_DINH, type LocSao } from './loc-sao'
import { hopDang, LOC_DANG_MAC_DINH, type LocDang } from './dang-cau'

/** Nhãn gắn lên MỘT câu chữa. Đúng một, không phải mảng: một câu chữa phục vụ
 * một câu sai để nhãn hiện ra không mập mờ. Chiều ngược lại mới là một–nhiều. */
export interface NhanChua {
  qid: string
  soCau: number
  phan: 'I' | 'II' | 'III'
  /** Mã dạng của CÂU SAI. Câu chữa bậc 1 phải trùng đúng mã này. */
  maDang: string
  /** Tên dạng cho người đọc. Phiếu hiện TÊN, không hiện mã — mã là thứ nội bộ
   * (v4 mục 6). */
  tenDang: string
  /** 1 = trùng đúng mã. 2 = cùng chuyên đề và cùng cơ chế, khác việc phải làm. */
  bac: 1 | 2
  /** CHÍNH CÂU EM LÀM SAI, đưa lại vào phiếu để em làm lại — thầy chốt 07/09:
   * "câu nào chưa có câu chữa thì lấy lại câu sai đó, phân tích lỗi sai của em".
   * Thà cho em làm lại đúng câu đó còn hơn để trống chỗ ấy. */
  laLamLai?: true
  /** Em đã chọn phương án nào. */
  daChon?: string
  /** Vì sao phương án em chọn là sai — lấy từ lời giải của chính câu đó. */
  viSaoSai?: string
}

export interface SuatThieu {
  soCau: number
  /** BẮT BUỘC có phần. Số câu đánh lại từ 1 ở mỗi phần, nên "câu 2" trần là hai
   * câu khác nhau. Thầy bắt được 07/09: thanh kéo báo "chưa có câu chữa cho câu
   * 2" trong khi phiếu vẫn có 5 câu chữa cho câu 2 — hai câu 2 khác phần. */
  phan: 'I' | 'II' | 'III'
  /** Khoá thật, để đối chiếu không phải dò theo số câu. */
  qid: string
  /** Tên dạng cho thầy đọc; rỗng khi câu sai chưa gắn dạng. */
  tenDang: string
  vi: string
}

/** Tên gọi MỘT câu sai cho người đọc. Một chỗ duy nhất sinh chuỗi này để thanh
 * kéo, dòng cảnh báo và phiếu không nói ba kiểu khác nhau. */
export function tenCauSai(phan: 'I' | 'II' | 'III', soCau: number): string {
  return `câu ${soCau} phần ${phan}`
}

export interface CauSaiCanChua {
  qid: string
  soCau: number
  phan: 'I' | 'II' | 'III'
  mucDo: MucDoCau | ''
  maDang: string
  tenDang: string
  /** Em đã chọn gì. Cần để phiếu nói được vì sao em sai, không chỉ nói sai. */
  daChon: string
}

/** Số ứng viên riêng của một câu sai — đặc tả v4 mục 4.2. */
export interface PoolCauSai {
  qid: string
  soCau: number
  /** Xem `SuatThieu.phan` — thiếu nó là hai câu khác phần bị gộp làm một. */
  phan: 'I' | 'II' | 'III'
  tenDang: string
  pool: number
}

export interface KetQuaRutChua {
  cau: CauLuyen[]
  thieu: SuatThieu[]
  /** MAX CỦA THANH KÉO. Số câu PHÂN BIỆT trong cả kho mang nhãn của những câu
   * em sai. Một câu khớp nhãn hai câu sai chỉ đếm MỘT lần — đếm hai lần là kéo
   * tới max rồi trả thiếu câu. */
  tongUngVien: number
  /** Pool riêng từng câu sai, để màn hình nói được câu nào hết câu chữa. */
  poolTheoCauSai: PoolCauSai[]
  /** Số câu sai không được suất nào vì thầy đặt số câu quá nhỏ. */
  capBiCat: number
}

function laMucDo(v: unknown): MucDoCau | '' {
  return v === 'biet' || v === 'hieu' || v === 'van_dung' ? v : ''
}

/** Dạng gắn trên một câu trong kho. Câu cũ chưa gán thì không có. */
export interface DangCauKho {
  ma: string
  ten: string
}
type CoDang = { dang?: { ma?: string; ten?: string } | null; id?: string; mucDo?: string; chuyenDe?: string }

export function dangCuaCauKho(q: CoDang): DangCauKho | null {
  const ma = String(q?.dang?.ma ?? '').trim()
  return ma ? { ma, ten: String(q?.dang?.ten ?? '').trim() || ma } : null
}

// ---------------------------------------------------------------------------
// BƯỚC 1 — LIỆT KÊ CÂU SAI. Chỉ từ `rows`, không từ đâu khác.
// Đặc tả cấm suy câu sai từ điểm số: bịa câu sai là bịa cả phiếu.

export function cauSaiTuRows(rows: ChiTietCauRow[], traDang: (qid: string) => DangCauKho | null): CauSaiCanChua[] {
  return (rows ?? [])
    .filter((r) => r.dungSai === false)
    .map((r) => {
      const d = traDang(String(r.qid || ''))
      return {
        qid: String(r.qid || ''),
        soCau: Number(r.soCau) || 0,
        phan: r.phan,
        mucDo: laMucDo(r.mucDo),
        maDang: d?.ma ?? '',
        tenDang: d?.ten ?? '',
        daChon: String(r.dapAnChon || '').trim(),
      }
    })
    .filter((c) => c.qid !== '')
}

/** Hổng nền chữa trước, rồi số câu tăng dần. HOÀN TOÀN TẤT ĐỊNH — thầy in lại
 * phiếu không ra bộ khác. */
export function xepUuTienChua(ds: CauSaiCanChua[]): CauSaiCanChua[] {
  return [...ds].sort((a, b) => hangUuTien(a.mucDo) - hangUuTien(b.mucDo) || a.soCau - b.soCau)
}

export interface YeuCauRutChua {
  /** CẢ KHO. v3 bỏ hẳn ranh giới "đề đã tích" — mã dạng mới là ranh giới. */
  khoDe: TeacherExamSource[]
  rows: ChiTietCauRow[]
  qidTranh?: string[]
  /** Thầy kéo tới bao nhiêu. Thiếu thì lấy `SO_CAU_MAC_DINH`. KHÔNG có trần
   * cứng: kéo bao nhiêu thì phát bấy nhiêu, chỉ dừng khi hết ứng viên. */
  soCau?: number
  /** Ghi đè `CHO_BAC_2` cho một lượt rút (thanh kéo bật/tắt tại chỗ). */
  choBac2?: boolean
  /** LỌC THEO SAO (thầy chốt 07/09). Chỉ lọc ỨNG VIÊN, KHÔNG lọc câu sai:
   * em sai câu 0 sao thì vẫn phải được chữa, chỉ là chữa bằng câu 2 sao hay
   * 1 sao tuỳ thầy chọn. */
  locSao?: LocSao
  /** LỌC LÝ THUYẾT / BÀI TẬP — cũng phải đi qua cổng.
   *
   * Thầy bắt được 07/09: "dạng câu ngẫu nhiên lý thuyết bài tập tôi bấm vào nó
   * không báo có bao nhiêu câu giống với những câu làm sai". Đúng: trước đây lọc
   * dạng chỉ ăn ở đường rút TỰ DO, còn cổng chữa thì không biết tới nó, nên bấm
   * nút xong con số "kho có N câu cùng dạng" đứng im. */
  locDang?: LocDang
  /** NƠI TRA ĐỀ GỐC CỦA CÂU EM SAI — ngân hàng của chính ca đó.
   *
   * Cần riêng vì kho đề và đề của ca là hai thứ khác nhau: ca có thể thi bằng
   * đề chưa nằm trong kho, và khi ấy `khoDe` không tra ra được câu em vừa làm
   * sai. Không có thì rơi về `khoDe`. */
  nguonCauSai?: TeacherExamSource[]
}

/** Số câu chữa THẬT, không tính thẻ "làm lại chính câu em sai".
 *
 * Chỗ gọi dùng con số này để quyết định có lui về bài luyện chung hay không.
 * Đếm cả thẻ làm lại vào đây là em nhận đúng một câu thay vì cả bộ luyện. */
export function soCauChuaThat(kq: KetQuaRutChua | null | undefined): number {
  return (kq?.cau ?? []).filter((c) => !c.chuaCho?.laLamLai).length
}

interface UngVien {
  cau: CauLuyen
  ma: string
  bac: 1 | 2
}

/** Dàn cả kho thành ứng viên kèm mã dạng. Câu chưa gán dạng không bao giờ
 * thành ứng viên — cấm đoán. */
/** Câu trong kho DÙNG ĐƯỢC làm câu chữa: có mã dạng và không có hình.
 *
 * Xuất ra ngoài để màn Ngân hàng đếm nguồn hàng bằng ĐÚNG luật cổng đang dùng.
 * Đếm bằng luật riêng thì con số báo cho thầy sẽ lệch với thực tế rút được. */
/** Mã dạng của MỌI câu trong kho, kể cả câu có hình.
 *
 * Tách khỏi `ungVienChua` vì hai câu hỏi khác nhau: "câu này mang dạng gì" hỏi
 * cho CÂU SAI, "câu này dùng làm câu chữa được không" hỏi cho ỨNG VIÊN. Trước
 * đây tra dạng câu sai bằng danh sách ứng viên đã lọc hình, nên câu sai có hình
 * bị báo "chưa gắn dạng" dù kho đã gán mã cho nó — thầy thấy đúng lỗi này ở
 * câu 1 và câu 6 ngày 07/09. */
export function banDoDang(khoDe: TeacherExamSource[]): Map<string, DangCauKho> {
  const tra = new Map<string, DangCauKho>()
  for (const s of khoDe) {
    for (const q of [...s.phanI, ...s.phanII, ...s.phanIII]) {
      const d = dangCuaCauKho(q as CoDang)
      if (d) tra.set(String((q as CoDang).id ?? ''), d)
    }
  }
  return tra
}

export function ungVienChua(
  khoDe: TeacherExamSource[],
  locSao: LocSao = LOC_SAO_MAC_DINH,
  locDang: LocDang = LOC_DANG_MAC_DINH,
): { cau: CauLuyen; ma: string; ten: string }[] {
  const tra = banDoDang(khoDe)
  // `cauLuyenTuNguon` chỉ ĐỔI KIỂU sang `CauLuyen`, không chọn lọc gì — luật
  // chọn nằm ở đây. (Không dùng `chonCauLuyen` cho việc này: đưa `soCau` lớn
  // vào nó làm vòng thang bậc chạy tới cạn — tôi đã dính đúng bẫy đó.)
  //
  // CÂU CÓ HÌNH NAY VÀO ĐƯỢC PHIẾU (thầy chốt 08/09: "phải cho đầy đủ hình vào
  // phiếu in, không được thiếu câu nào").
  //
  // Luật cũ loại chúng vì "phiếu in không dựng được ảnh" — điều đó ĐÃ KHÔNG
  // CÒN ĐÚNG: `html-phieu.ts` dựng đủ ảnh thân câu (`anhThanCau`), ảnh từng
  // phương án (`anhLuaChon`) và ảnh theo vị trí (`hinh`). Giữ bộ lọc là đang
  // vứt 219 câu có mã ra khỏi kho chữa vì một giới hạn không còn tồn tại.
  return cauLuyenTuNguon(khoDe)
    .filter((c) => hopSao(c.sao, locSao))
    .filter((c) => hopDang(c.dang, locDang))
    .map((c) => ({ cau: c, ma: tra.get(c.id)?.ma ?? '', ten: tra.get(c.id)?.ten ?? '' }))
    .filter((x) => x.ma !== '')
}

/** Vì sao phương án em chọn là sai — đọc từ lời giải của CHÍNH câu đó.
 *
 * Không có lời giải cho phương án ấy thì trả rỗng. Cấm tự nghĩ lý do: một dòng
 * phân tích bịa còn tệ hơn không có dòng nào. */
export function viSaoChonSai(c: CauLuyen, daChon: string): string {
  const ch = String(daChon || '').trim()
  if (!ch) return ''
  // ĐỌC `lyDo` CHỨ KHÔNG PHẢI `loiGiai`. `CauLuyen` là kiểu ĐÃ ĐỔI: `doiSang`
  // đã dàn `loiGiai.tungPa` / `loiGiai.tungY` thành mảng `lyDo`. Bản đầu tôi
  // viết đọc `c.loiGiai` — trường đó không tồn tại trên `CauLuyen`, nên hàm
  // luôn trả rỗng và phần phân tích lỗi sai không bao giờ hiện ra.
  const ds = c.lyDo ?? []
  if (ds.length === 0) return ''
  // Phần I khoá là A–D, Phần II khoá là a–d, Phần III không có phương án.
  const khoa = c.phan === 'II' ? ch.toLowerCase() : ch.toUpperCase()
  return String(ds.find((x) => x.khoa === khoa)?.ly ?? '').trim()
}

/** CỔNG. Thuần logic, không đọc IndexedDB, KHÔNG GỌI MẠNG. */
export function rutDeChua(yc: YeuCauRutChua): KetQuaRutChua {
  const ra: KetQuaRutChua = { cau: [], thieu: [], tongUngVien: 0, poolTheoCauSai: [], capBiCat: 0 }
  const choBac2 = yc.choBac2 ?? CHO_BAC_2

  const kho = ungVienChua(yc.khoDe, yc.locSao ?? LOC_SAO_MAC_DINH, yc.locDang ?? LOC_DANG_MAC_DINH)
  // Tra dạng của CÂU SAI trên CẢ KHO, và lấy đúng `ten` của dạng.
  //
  // Hai lỗi cũ ở đúng hai dòng này, thầy bắt được 07/09:
  //   · tra trên `kho` (đã lọc bỏ câu có hình) ⇒ câu sai có hình bị báo "chưa
  //     gắn dạng" dù kho đã gán mã;
  //   · trả `cau.chuyenDe` làm tên dạng ⇒ mọi dòng cảnh báo đọc thành "kho chưa
  //     có câu nào cùng dạng 'Ester – lipid'", tức đọc ra tên CHƯƠNG, ba câu
  //     sai khác dạng in ra ba dòng y hệt nhau.
  const banDo = banDoDang(yc.khoDe)
  const traDang = (qid: string) => banDo.get(qid) ?? null
  const daXep = xepUuTienChua(cauSaiTuRows(yc.rows, traDang))
  if (daXep.length === 0) return ra

  const tranh = new Set([...(yc.qidTranh ?? []), ...daXep.map((c) => c.qid)])

  // ---- MỤC 4.2 — ĐẾM ỨNG VIÊN. Làm trước, vì con số này là MAX của thanh kéo.
  const xepHangCua = new Map<string, UngVien[]>()
  const hopUngVien = new Set<string>()
  for (const s of daXep) {
    // Câu sai CHƯA GẮN DẠNG thì pool bằng 0. Cấm đoán.
    if (!s.maDang) {
      ra.poolTheoCauSai.push({ qid: s.qid, soCau: s.soCau, phan: s.phan, tenDang: '', pool: 0 })
      ra.thieu.push({
        soCau: s.soCau,
        phan: s.phan,
        qid: s.qid,
        tenDang: '',
        vi: `${tenCauSai(s.phan, s.soCau)} chưa gắn dạng — vào Ngân hàng câu hỏi gán rồi rút lại`,
      })
      continue
    }
    const dungDuoc = (x: { cau: CauLuyen; ma: string }) => !tranh.has(x.cau.id) && x.cau.id !== s.qid
    // BẬC 1 — trùng ĐÚNG mã.
    const bac1 = kho.filter((x) => dungDuoc(x) && x.ma === s.maDang)
    // BẬC 2 — cùng chuyên đề VÀ cùng cơ chế, khác việc phải làm. Hết bậc 2 là
    // DỪNG: cấm tụt xuống tầng chuyên đề, đó chính là cái đang hỏng.
    const nhanh = nhanhCoChe(s.maDang)
    const bac2 = choBac2 && nhanh ? kho.filter((x) => dungDuoc(x) && x.ma !== s.maDang && nhanhCoChe(x.ma) === nhanh) : []

    // Trong cùng bậc: mức độ gần câu sai nhất trước, rồi `qid` tăng dần. Không
    // random — hai lần rút cùng dữ liệu phải ra cùng bộ câu.
    const xep = (ds: { cau: CauLuyen; ma: string }[]) =>
      [...ds].sort(
        (a, b) =>
          Math.abs(hangUuTien(a.cau.mucDo) - hangUuTien(s.mucDo)) - Math.abs(hangUuTien(b.cau.mucDo) - hangUuTien(s.mucDo)) ||
          a.cau.id.localeCompare(b.cau.id),
      )
    const xepHang: UngVien[] = [
      ...xep(bac1).map((x) => ({ cau: x.cau, ma: x.ma, bac: 1 as const })),
      ...xep(bac2).map((x) => ({ cau: x.cau, ma: x.ma, bac: 2 as const })),
    ]
    xepHangCua.set(s.qid, xepHang)
    for (const u of xepHang) hopUngVien.add(u.cau.id)
    ra.poolTheoCauSai.push({ qid: s.qid, soCau: s.soCau, phan: s.phan, tenDang: s.tenDang, pool: xepHang.length })
    if (xepHang.length === 0) {
      ra.thieu.push({
        soCau: s.soCau,
        phan: s.phan,
        qid: s.qid,
        tenDang: s.tenDang,
        vi: `${tenCauSai(s.phan, s.soCau)}: kho chưa có câu nào khác cùng dạng "${s.tenDang || s.maDang}"`,
      })
    }
  }
  // ĐẾM PHÂN BIỆT: hợp của mọi pool, không cộng dồn từng pool.
  ra.tongUngVien = hopUngVien.size

  // ---- MỤC 4.3 — CHIA SUẤT. Vòng tròn CÓ SỨC CHỨA, hoàn toàn tất định.
  //
  // Mỗi vòng phát 1 suất cho câu sai nào CÒN CHỖ (suất đang có < pool riêng).
  // Câu hết chỗ tự rơi ra, phần dư dồn sang câu còn chỗ — không cần luật riêng.
  // Pool [60,25,5]: kéo 30 -> [10,10,10]; kéo 80 -> [50,25,5]; kéo 90 -> [60,25,5].
  const xin = Math.max(0, Math.floor(yc.soCau ?? SO_CAU_MAC_DINH))
  const soCau = Math.min(xin, ra.tongUngVien)

  const daDung = new Set<string>()
  const demCua = new Map<string, number>()
  const con = new Map<string, UngVien[]>()
  for (const [qid, ds] of xepHangCua) con.set(qid, [...ds])

  let conCho = soCau
  let phatDuoc = soCau > 0
  while (conCho > 0 && phatDuoc) {
    phatDuoc = false
    for (const s of daXep) {
      if (conCho <= 0) break
      const ds = con.get(s.qid)
      if (!ds) continue
      // Câu khớp nhãn NHIỀU câu sai đã bị câu ưu tiên cao hơn lấy: bỏ qua, và
      // không cho xuất hiện lần thứ hai trong phiếu.
      while (ds.length > 0 && daDung.has(ds[0].cau.id)) ds.shift()
      if (ds.length === 0) continue
      const u = ds.shift() as UngVien
      daDung.add(u.cau.id)
      demCua.set(s.qid, (demCua.get(s.qid) ?? 0) + 1)
      ra.cau.push({ ...u.cau, chuaCho: { qid: s.qid, soCau: s.soCau, phan: s.phan, maDang: s.maDang, tenDang: s.tenDang, bac: u.bac } })
      conCho -= 1
      phatDuoc = true
    }
  }

  // ---- CÂU KHÔNG CÓ CÂU CHỮA: ĐƯA LẠI CHÍNH CÂU EM SAI.
  //
  // Thầy chốt 07/09: "câu nào chưa có câu chữa thì lấy lại câu sai đó chữa lại
  // và phân tích lỗi sai của em đó ở câu đó để học sinh làm lại".
  //
  // Trước đây chỗ này để trống và chỉ ghi một dòng "kho chưa có câu cùng dạng"
  // — em không có gì để làm. Nay: chính câu đó vào phiếu, kèm em đã chọn gì và
  // vì sao phương án ấy sai, lấy từ lời giải của chính câu đó. Không bịa: không
  // có lời giải thì để trống phần phân tích chứ không tự nghĩ ra lý do.
  //
  // CHỈ áp cho câu sai mà KHO KHÔNG CÓ câu nào cùng dạng (pool = 0). Câu sai chỉ
  // vì thầy kéo số câu quá nhỏ nên chưa tới suất thì KHÔNG đưa lại — kéo thanh
  // lên là có ngay, đưa lại chỉ làm phồng phiếu quá số thầy chọn.
  //
  // ĐIỀU KIỆN CHẠY: kho phải có ÍT NHẤT MỘT câu mang mã dạng. Kho chưa gán mã
  // nào là cổng chưa vận hành được — lúc ấy chỗ gọi lui hẳn về bài luyện chung
  // theo chuyên đề (luật cũ), và rắc thẻ làm lại vào đó chỉ làm mọi phiếu đều
  // mọc lại đúng đề em vừa thi. Kho thật đã gán 2.213 câu nên nhánh này chỉ còn
  // là đường lui cho dữ liệu cũ.
  const nguonGoc = yc.nguonCauSai && yc.nguonCauSai.length > 0 ? yc.nguonCauSai : yc.khoDe
  const tatCa = kho.length > 0 ? new Map(cauLuyenTuNguon(nguonGoc).map((c) => [c.id, c])) : new Map<string, CauLuyen>()
  for (const s of daXep) {
    if ((xepHangCua.get(s.qid)?.length ?? 0) > 0) continue
    const goc = tatCa.get(s.qid)
    if (!goc) continue
    ra.cau.push({
      ...goc,
      chuaCho: {
        qid: s.qid,
        soCau: s.soCau,
        phan: s.phan,
        maDang: s.maDang,
        tenDang: s.tenDang,
        bac: 1,
        laLamLai: true,
        daChon: s.daChon || undefined,
        viSaoSai: viSaoChonSai(goc, s.daChon),
      },
    })
  }

  // BÁO THIẾU / BỊ CẮT — nói ra, không nuốt.
  //
  // Hai thứ khác nhau:
  //   · THIẾU  = kho cạn câu cùng dạng trong khi thầy còn xin thêm. Lỗi của kho.
  //   · BỊ CẮT = thầy đặt số câu quá nhỏ nên câu sai này chưa tới suất. Không
  //     phải lỗi kho, chỉ cần kéo thanh lên.
  const canMoiCau = daXep.length > 0 ? Math.ceil(xin / daXep.length) : 0
  for (const s of daXep) {
    const pool = xepHangCua.get(s.qid)?.length ?? 0
    if (pool === 0) continue // đã ghi lý do ở phần đếm ứng viên
    const co = demCua.get(s.qid) ?? 0
    if (co === 0) {
      ra.capBiCat += 1
      continue
    }
    // Đã vét sạch pool mà vẫn ít hơn phần đáng ra được chia.
    if (co >= pool && co < canMoiCau) {
      ra.thieu.push({
        soCau: s.soCau,
        phan: s.phan,
        qid: s.qid,
        tenDang: s.tenDang,
        vi: `${tenCauSai(s.phan, s.soCau)}: kho chỉ còn ${co}/${canMoiCau} câu cùng dạng "${s.tenDang || s.maDang}"`,
      })
    }
  }

  return ra
}

/** Bảng đối chiếu đầu phiếu: câu sai → những câu chữa nào (vị trí trong phiếu,
 * tính từ 1). Câu sai không có câu chữa vẫn phải có dòng, kèm lý do. */
export function bangDoiChieu(kq: KetQuaRutChua, daXep: CauSaiCanChua[]): { cauSai: CauSaiCanChua; viTri: number[]; vi?: string }[] {
  return daXep.map((s) => {
    const viTri = kq.cau.map((c, i) => (c.chuaCho?.qid === s.qid ? i + 1 : 0)).filter((n) => n > 0)
    // Dò theo `qid`, KHÔNG theo `soCau`: số câu đánh lại từ 1 ở mỗi phần nên
    // dò theo số là gán lý do của câu 2 phần II vào câu 2 phần I.
    const t = kq.thieu.find((x) => x.qid === s.qid)
    return viTri.length > 0 && !t ? { cauSai: s, viTri } : { cauSai: s, viTri, vi: t?.vi ?? 'chưa tới suất trong phiếu này' }
  })
}

// ---------------------------------------------------------------------------
// RÚT TỰ DO — không có ca, nên không có câu sai để gắn nhãn.
//
// Màn Học sinh mở từ hồ sơ chung không gắn với ca nào: không có bảng chấm thì
// không biết em sai câu nào, và đặc tả cấm bịa câu sai. Phiếu ở đó là phiếu ÔN,
// không phải phiếu CHỮA — nên không mang nhãn, và đó là đúng.
//
// Vẫn đặt trong file này để giữ luật cấu trúc: component không gọi thẳng
// `chonCauLuyen`. Một cổng, hai cửa, cả hai nhìn thấy được ở đây.
export function rutTuDo(nguon: TeacherExamSource[], yc: Parameters<typeof chonCauLuyen>[1]): { cau: CauLuyen[]; thieu: SuatThieu[]; lapLai: number } {
  const kq = chonCauLuyen(nguon, yc)
  return { cau: kq.cau, thieu: [], lapLai: kq.lapLai }
}
