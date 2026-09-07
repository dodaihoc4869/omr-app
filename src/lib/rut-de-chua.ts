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
import { CHO_BAC_2, SO_CAU_MOI_CAU_SAI, TRAN_CAU_CHUA, hangUuTien, nhanhCoChe } from './cau-hinh-chua'

/** Nhãn gắn lên MỘT câu chữa. Đúng một, không phải mảng: một câu chữa phục vụ
 * một câu sai để nhãn hiện ra không mập mờ. Chiều ngược lại mới là một–nhiều. */
export interface NhanChua {
  qid: string
  soCau: number
  phan: 'I' | 'II' | 'III'
  /** Mã dạng của CÂU SAI. Câu chữa bậc 1 phải trùng đúng mã này. */
  maDang: string
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

export interface KetQuaRutChua {
  cau: CauLuyen[]
  thieu: SuatThieu[]
  /** Số câu sai bị cắt vì chạm `TRAN_CAU_CHUA` — phải nói ra, không nuốt. */
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
  soCau?: number
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
  const soCau = Math.max(0, Math.min(yc.soCau ?? TRAN_CAU_CHUA, TRAN_CAU_CHUA))
  const ra: KetQuaRutChua = { cau: [], thieu: [], capBiCat: 0 }

  const kho = ungVienChua(yc.khoDe)
  const traDang = (qid: string) => {
    const t = kho.find((x) => x.cau.id === qid)
    return t ? { ma: t.ma, ten: t.cau.chuyenDe } : null
  }
  const daXep = xepUuTienChua(cauSaiTuRows(yc.rows, traDang))
  if (daXep.length === 0 || soCau === 0) return ra

  const tranh = new Set([...(yc.qidTranh ?? []), ...daXep.map((c) => c.qid)])
  const daDung = new Set<string>()
  let conCho = soCau

  // BƯỚC 3–6 — DỰNG SẴN xếp hạng ứng viên cho TỪNG câu sai, chưa lấy câu nào.
  // Tách "xếp hạng" khỏi "chia suất" vì hai việc có luật khác nhau, gộp lại thì
  // không chia đều được.
  const xepHangCua = new Map<string, UngVien[]>()
  for (const s of daXep) {
    // BƯỚC 2 — câu sai CHƯA GẮN DẠNG thì không rút gì cả. Cấm đoán.
    if (!s.maDang) {
      ra.thieu.push({ soCau: s.soCau, tenDang: '', vi: `câu ${s.soCau} chưa gắn dạng — vào Ngân hàng câu hỏi gán rồi rút lại` })
      continue
    }
    const dungDuoc = (x: { cau: CauLuyen; ma: string }) => !tranh.has(x.cau.id) && x.cau.id !== s.qid
    // BẬC 1 — trùng ĐÚNG mã.
    const bac1 = kho.filter((x) => dungDuoc(x) && x.ma === s.maDang)
    // BẬC 2 — cùng chuyên đề VÀ cùng cơ chế, khác việc phải làm. Hết bậc 2 là
    // DỪNG: cấm tụt xuống tầng chuyên đề, đó chính là cái đang hỏng.
    const nhanh = nhanhCoChe(s.maDang)
    const bac2 = CHO_BAC_2 && nhanh ? kho.filter((x) => dungDuoc(x) && x.ma !== s.maDang && nhanhCoChe(x.ma) === nhanh) : []

    // Trong cùng bậc: mức độ gần câu sai nhất trước, rồi `qid` tăng dần. Không
    // random — hai lần rút cùng dữ liệu phải ra cùng bộ câu.
    const xep = (ds: { cau: CauLuyen; ma: string }[]) =>
      [...ds].sort(
        (a, b) =>
          Math.abs(hangUuTien(a.cau.mucDo) - hangUuTien(s.mucDo)) - Math.abs(hangUuTien(b.cau.mucDo) - hangUuTien(s.mucDo)) ||
          a.cau.id.localeCompare(b.cau.id),
      )

    xepHangCua.set(s.qid, [
      ...xep(bac1).map((x) => ({ cau: x.cau, ma: x.ma, bac: 1 as const })),
      ...xep(bac2).map((x) => ({ cau: x.cau, ma: x.ma, bac: 2 as const })),
    ])
  }

  // CHIA SUẤT THEO VÒNG — thầy chốt 07/09: "nếu kéo nhiều thì ghép nhiều câu
  // chữa cho những câu sai đó".
  //
  // Mỗi vòng phát cho mỗi câu sai đúng MỘT câu, theo thứ tự ưu tiên, rồi mới
  // sang vòng sau. Nhờ vậy: chỗ ít thì câu sai nào cũng có phần trước khi ai đó
  // được câu thứ hai; thầy kéo số câu lên thì phần dư chia đều tiếp, không đổ
  // hết vào một câu sai.
  //
  // `SO_CAU_MOI_CAU_SAI` do đó đổi nghĩa: từ "đúng 2 câu" thành "TỐI THIỂU 2
  // câu mỗi câu sai" — bản v3 mục 3 ghi cứng 2 nên kéo 40 câu vẫn chỉ ra 2.
  const demCua = new Map<string, number>()
  const conUngVien = new Map<string, UngVien[]>()
  for (const [qid, ds] of xepHangCua) conUngVien.set(qid, [...ds])

  let phatDuoc = true
  while (conCho > 0 && phatDuoc) {
    phatDuoc = false
    for (const s of daXep) {
      if (conCho <= 0) break
      const con = conUngVien.get(s.qid)
      if (!con) continue
      // Bỏ những câu đã bị câu sai khác lấy mất.
      while (con.length > 0 && daDung.has(con[0].cau.id)) con.shift()
      if (con.length === 0) continue
      const u = con.shift() as UngVien
      daDung.add(u.cau.id)
      demCua.set(s.qid, (demCua.get(s.qid) ?? 0) + 1)
      ra.cau.push({ ...u.cau, chuaCho: { qid: s.qid, soCau: s.soCau, phan: s.phan, maDang: s.maDang, bac: u.bac } })
      conCho -= 1
      phatDuoc = true
    }
  }

  // BÁO THIẾU — so với mức tối thiểu, và chỉ khi thiếu vì HẾT CÂU trong kho.
  // Thiếu vì thầy đặt số câu quá nhỏ thì đó là `capBiCat`, không phải lỗi kho.
  for (const s of daXep) {
    if (!s.maDang) continue
    const co = demCua.get(s.qid) ?? 0
    const conLai = (conUngVien.get(s.qid) ?? []).filter((u) => !daDung.has(u.cau.id)).length
    if (co === 0 && conLai === 0) {
      ra.thieu.push({ soCau: s.soCau, tenDang: s.tenDang, vi: `kho chưa có câu nào cùng dạng "${s.tenDang || s.maDang}"` })
    } else if (co === 0) {
      ra.capBiCat += 1
    } else if (co < SO_CAU_MOI_CAU_SAI && conLai === 0) {
      ra.thieu.push({ soCau: s.soCau, tenDang: s.tenDang, vi: `kho chỉ còn ${co}/${SO_CAU_MOI_CAU_SAI} câu cùng dạng "${s.tenDang || s.maDang}"` })
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
