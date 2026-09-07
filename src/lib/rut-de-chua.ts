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
}

export interface SuatThieu {
  soCau: number
  /** Tên dạng cho thầy đọc; rỗng khi câu sai chưa gắn dạng. */
  tenDang: string
  vi: string
}

export interface CauSaiCanChua {
  qid: string
  soCau: number
  phan: 'I' | 'II' | 'III'
  mucDo: MucDoCau | ''
  maDang: string
  tenDang: string
}

/** Số ứng viên riêng của một câu sai — đặc tả v4 mục 4.2. */
export interface PoolCauSai {
  qid: string
  soCau: number
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
export function ungVienChua(khoDe: TeacherExamSource[]): { cau: CauLuyen; ma: string }[] {
  const tra = new Map<string, string>()
  for (const s of khoDe) {
    for (const q of [...s.phanI, ...s.phanII, ...s.phanIII]) {
      const d = dangCuaCauKho(q as CoDang)
      if (d) tra.set(String((q as CoDang).id ?? ''), d.ma)
    }
  }
  // `cauLuyenTuNguon` chỉ ĐỔI KIỂU sang `CauLuyen`, không chọn lọc gì — luật
  // chọn nằm ở đây. (Không dùng `chonCauLuyen` cho việc này: đưa `soCau` lớn
  // vào nó làm vòng thang bậc chạy tới cạn — tôi đã dính đúng bẫy đó.)
  //
  // Câu CÓ HÌNH bị loại: phiếu in không dựng được ảnh, luật cũ mục 7.
  return cauLuyenTuNguon(khoDe)
    .filter((c) => !c.anhThanCau && !(c.hinh && c.hinh.length > 0) && !(c.anhLuaChon && c.anhLuaChon.some(Boolean)))
    .map((c) => ({ cau: c, ma: tra.get(c.id) ?? '' }))
    .filter((x) => x.ma !== '')
}

/** CỔNG. Thuần logic, không đọc IndexedDB, KHÔNG GỌI MẠNG. */
export function rutDeChua(yc: YeuCauRutChua): KetQuaRutChua {
  const ra: KetQuaRutChua = { cau: [], thieu: [], tongUngVien: 0, poolTheoCauSai: [], capBiCat: 0 }
  const choBac2 = yc.choBac2 ?? CHO_BAC_2

  const kho = ungVienChua(yc.khoDe)
  const traDang = (qid: string) => {
    const t = kho.find((x) => x.cau.id === qid)
    return t ? { ma: t.ma, ten: t.cau.chuyenDe } : null
  }
  const daXep = xepUuTienChua(cauSaiTuRows(yc.rows, traDang))
  if (daXep.length === 0) return ra

  const tranh = new Set([...(yc.qidTranh ?? []), ...daXep.map((c) => c.qid)])

  // ---- MỤC 4.2 — ĐẾM ỨNG VIÊN. Làm trước, vì con số này là MAX của thanh kéo.
  const xepHangCua = new Map<string, UngVien[]>()
  const hopUngVien = new Set<string>()
  for (const s of daXep) {
    // Câu sai CHƯA GẮN DẠNG thì pool bằng 0. Cấm đoán.
    if (!s.maDang) {
      ra.poolTheoCauSai.push({ qid: s.qid, soCau: s.soCau, tenDang: '', pool: 0 })
      ra.thieu.push({ soCau: s.soCau, tenDang: '', vi: `câu ${s.soCau} chưa gắn dạng — vào Ngân hàng câu hỏi gán rồi rút lại` })
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
    ra.poolTheoCauSai.push({ qid: s.qid, soCau: s.soCau, tenDang: s.tenDang, pool: xepHang.length })
    if (xepHang.length === 0) {
      ra.thieu.push({ soCau: s.soCau, tenDang: s.tenDang, vi: `kho chưa có câu nào cùng dạng "${s.tenDang || s.maDang}"` })
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
  if (soCau === 0) {
    for (const s of daXep) if ((xepHangCua.get(s.qid)?.length ?? 0) > 0) ra.capBiCat += 1
    return ra
  }

  const daDung = new Set<string>()
  const demCua = new Map<string, number>()
  const con = new Map<string, UngVien[]>()
  for (const [qid, ds] of xepHangCua) con.set(qid, [...ds])

  let conCho = soCau
  let phatDuoc = true
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
        tenDang: s.tenDang,
        vi: `kho chỉ còn ${co}/${canMoiCau} câu cùng dạng "${s.tenDang || s.maDang}"`,
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
    const t = kq.thieu.find((x) => x.soCau === s.soCau)
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
