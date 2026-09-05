// HỎI BÀI THẦY — HOIBAITHAY.md, thầy duyệt 05/09.
//
// Em nộp bài xong, tick những câu chưa hiểu rồi gửi. Thầy mở một trang là thấy
// CẢ LỚP VƯỚNG Ở ĐÂU, chữa một lượt.
//
// QUYẾT ĐỊNH THIẾT KẾ QUAN TRỌNG NHẤT (mục 1.1): trang tổng hợp lấy CÂU làm đơn
// vị, không lấy em. Hai lẽ:
//
//   · Chữa một lần cho cả nhóm. Xếp theo em thì cùng một câu bị chữa lại năm
//     lần.
//   · Câu nào nhiều em hỏi nhất là câu phải chữa trên bảng. Xếp giảm dần theo
//     số em hỏi, thầy nhìn thứ tự là biết ưu tiên — thứ hôm nay thầy hoàn toàn
//     không có.
//
// Danh sách theo tên em vẫn giữ: nó là LỐI VÀO, còn trang tổng hợp là BẢN ĐỂ
// CHỮA.
//
// MÁY CHỦ CHỈ GIỮ MÃ CÂU (mục 2.1). Em gửi lên mảng `qid`, không gửi đề, không
// gửi ảnh, không gửi lời giải — máy thầy đã có `ca_<mã>_bank.json` nên tự dựng
// được nội dung. Gói gửi đi vài trăm byte thay vì vài megabyte, không có đáp án
// nào đi qua đường truyền của học sinh, và dữ liệu đề không rời máy thầy.
import type { CauLuyen } from './bai-tap-pdf'
import { biaHtml, ngayVN, taiLieuHtml, thanhHtml, theCauHtml, thoat, tongQuanHtml } from './html-phieu'

// ---------------------------------------------------------------------------
// MỘT NGUỒN SỰ THẬT CẤU HÌNH (mục 3). Cấm rải số vào màn hình.

/** Đủ một câu "em không hiểu bước quy đổi", không thành bài văn. Máy chủ cắt
 * lại lần nữa — không tin máy khách cắt hộ. */
export const TOI_DA_GHI_CHU = 300

/** Tick quá tỉ lệ này thì NHẮC, không chặn (mục 4A). Em vướng thật cả bài thì
 * đó là thông tin thầy cần biết. */
export const TI_LE_NHAC_NHIEU = 0.6

/** Dọn dòng đã chữa sau bấy nhiêu ngày. */
export const NGAY_GIU_CAU_HOI = 120

/** Trang tổng hợp liệt kê tối đa bấy nhiêu tên rồi ghi "và N em nữa". */
export const TOI_DA_TEN_HIEN = 8

// ---------------------------------------------------------------------------
// KIỂU DỮ LIỆU

/** Một dòng `CauHoiEm` trên máy chủ — đúng những gì máy chủ giữ, không hơn. */
export interface CauHoiCuaEm {
  maCa: string
  sbd: string
  hoTen: string
  qids: string[]
  ghiChu: string
  guiLuc: string
  daChua: boolean
  chuaLuc: string
}

/** Một câu sau khi GỘP: câu là đơn vị, tên em là thuộc tính của câu. */
export interface CauDaGop {
  qid: string
  /** Vị trí câu trong đề (1-based) — để xếp thứ tự khi số em hỏi bằng nhau. */
  viTri: number
  cau: CauLuyen
  /** Tên em hỏi câu này, theo thứ tự gửi. */
  emHoi: { sbd: string; hoTen: string; ghiChu: string }[]
}

// ---------------------------------------------------------------------------
// GÓI GỬI LÊN (mục 8 phép kiểm 1)
//
// Gói này bị QUÉT THẲNG bằng test: nó chỉ được chứa mã ca, số báo danh, mảng
// mã câu và ghi chú. Thêm bất kỳ trường nào mang nội dung đề, đáp án hay lời
// giải là vi phạm điều cấm số 1.

export interface GoiCauHoi {
  maCa: string
  sbd: string
  qids: string[]
  ghiChu: string
}

/** Dựng gói gửi lên. Cắt ghi chú, bỏ qid trùng, giữ nguyên thứ tự em tick. */
export function goiCauHoi(maCa: string, sbd: string, qids: string[], ghiChu: string): GoiCauHoi {
  const daCo = new Set<string>()
  const sach: string[] = []
  for (const q of qids) {
    const t = String(q || '').trim()
    if (!t || daCo.has(t)) continue
    daCo.add(t)
    sach.push(t)
  }
  return { maCa: String(maCa).trim(), sbd: String(sbd).trim(), qids: sach, ghiChu: String(ghiChu || '').slice(0, TOI_DA_GHI_CHU) }
}

/** Em tick quá nhiều thì nhắc một dòng. Chuỗi rỗng = không nhắc.
 *
 * NHẮC THÔI, VẪN CHO GỬI (điều cấm số 6). */
export function loiNhacTickNhieu(soTick: number, tongCau: number): string {
  if (tongCau <= 0 || soTick <= 0) return ''
  if (soTick / tongCau <= TI_LE_NHAC_NHIEU) return ''
  return `Em chọn ${soTick}/${tongCau} câu. Chọn vài câu vướng nhất thì Thầy chữa kỹ được hơn.`
}

// ---------------------------------------------------------------------------
// GỘP THEO CÂU (mục 1.1)

/** Gộp mọi dòng câu hỏi của một ca thành danh sách CÂU, xếp giảm dần theo số em
 * hỏi; bằng nhau thì theo thứ tự câu trong đề.
 *
 * `deCuaCa` là bộ câu đầy đủ của ca, đúng thứ tự in trên phiếu. Câu nào không
 * còn trong đề (thầy đổi đề sau khi em hỏi) thì BỎ QUA — không dựng thẻ rỗng,
 * và tuyệt đối không tự sinh nội dung thay (điều cấm số 7). */
export function gopTheoCau(dong: CauHoiCuaEm[], deCuaCa: CauLuyen[]): CauDaGop[] {
  const viTri = new Map<string, number>()
  const cauTheoQid = new Map<string, CauLuyen>()
  deCuaCa.forEach((c, i) => {
    viTri.set(c.id, i + 1)
    cauTheoQid.set(c.id, c)
  })

  const theoQid = new Map<string, CauDaGop>()
  for (const d of dong) {
    for (const q of d.qids) {
      const cau = cauTheoQid.get(q)
      if (!cau) continue
      let g = theoQid.get(q)
      if (!g) {
        g = { qid: q, viTri: viTri.get(q) ?? 0, cau, emHoi: [] }
        theoQid.set(q, g)
      }
      if (g.emHoi.some((e) => e.sbd === d.sbd)) continue
      g.emHoi.push({ sbd: d.sbd, hoTen: d.hoTen, ghiChu: d.ghiChu })
    }
  }

  return [...theoQid.values()].sort((a, b) => b.emHoi.length - a.emHoi.length || a.viTri - b.viTri)
}

/** Dòng tên em dưới mỗi câu. Quá `TOI_DA_TEN_HIEN` thì cắt và ghi "và N em nữa"
 * — một câu cả lớp hỏi thì liệt kê 30 tên là vô ích, mà số N mới là thứ thầy
 * cần thấy. */
export function dongTenEm(emHoi: { hoTen: string; sbd: string }[]): string {
  const ten = emHoi.map((e) => e.hoTen || e.sbd)
  if (ten.length <= TOI_DA_TEN_HIEN) return ten.join(' · ')
  return ten.slice(0, TOI_DA_TEN_HIEN).join(' · ') + ` và ${ten.length - TOI_DA_TEN_HIEN} em nữa`
}

/** Số em hỏi và tổng số câu KHÁC NHAU của một ca — con số trên thẻ ở Chi tiết
 * ca ("4 em hỏi · 11 câu"). */
export function demCauHoi(dong: CauHoiCuaEm[]): { soEm: number; soCau: number; chuaChua: number } {
  const qid = new Set<string>()
  let chuaChua = 0
  for (const d of dong) {
    for (const q of d.qids) qid.add(q)
    if (!d.daChua) chuaChua++
  }
  return { soEm: dong.length, soCau: qid.size, chuaChua }
}

// ---------------------------------------------------------------------------
// TRANG TỔNG HỢP (mục 4D)
//
// Dựng bằng ĐÚNG bộ `html-phieu.ts` đang dùng cho phiếu bài tập — không viết bộ
// dựng thứ hai, không thêm khối `<style>` tự chế (điều cấm số 4). Trang này
// phải nhìn y hệt phiếu bài tập, để mọi trang trong app nhìn như một.

export interface ThongTinTongHop {
  tenCa: string
  lop: string
  ngay: Date
}

/** Hàng tên em dưới một thẻ câu. Ghi chú của em in nghiêng ngay dưới tên em đó,
 * NGUYÊN VĂN (mục 4D điểm 3) — thầy cần đọc đúng chữ em viết. */
function hangEmHtml(g: CauDaGop): string {
  const ten = `<div class="em-hoi"><b>${g.emHoi.length} em hỏi:</b> ${thoat(dongTenEm(g.emHoi))}</div>`
  const chuThich = g.emHoi
    .filter((e) => e.ghiChu.trim())
    .map((e) => `<div class="em-ghi-chu"><i>${thoat(e.hoTen || e.sbd)}: “${thoat(e.ghiChu.trim())}”</i></div>`)
    .join('')
  return ten + chuThich
}

/** Dựng trang tổng hợp. Không em nào hỏi → trả CHUỖI RỖNG, chỗ gọi không dựng
 * trang rỗng (phép kiểm 12). */
export function dungTrangTongHop(t: ThongTinTongHop, dong: CauHoiCuaEm[], deCuaCa: CauLuyen[]): string {
  const gop = gopTheoCau(dong, deCuaCa)
  if (!gop.length) return ''

  const soEm = new Set(dong.filter((d) => d.qids.some((q) => deCuaCa.some((c) => c.id === q))).map((d) => d.sbd)).size
  const cau = gop.map((g) => g.cau)

  // Thẻ câu dựng bằng `theCauHtml` y như phiếu bài tập, rồi chèn hàng tên em
  // vào NGAY TRƯỚC thẻ đóng — không đụng vào bên trong thẻ, không sao chép lại
  // mã dựng thẻ.
  const the = gop
    .map((g, i) => `<div class="cau-hoi-nhom">${theCauHtml(g.cau, i + 1)}${hangEmHtml(g)}</div>`)
    .join('\n')

  const bia = biaHtml(
    {
      hoTen: '',
      sbd: '',
      ngay: t.ngay,
      tenChuyenDe: t.tenCa || 'Câu hỏi của lớp',
      ketQua: '',
      hienDapAn: true,
      nhanBia: 'Câu hỏi của em',
      oBia: [
        { nhan: 'Ca', gia: t.tenCa },
        { nhan: 'Lớp', gia: t.lop },
        { nhan: 'Em hỏi', gia: `${soEm} em · ${gop.length} câu` },
      ],
    },
    gop.length,
  )

  const than = `${bia}
<div class="khung">
  ${tongQuanHtml(cau)}
  ${thanhHtml(cau.length)}
  <div class="ds-cau">${the}</div>
  <div class="chan">Thầy Đỗ Đại Học · ${thoat(t.tenCa)} · ${ngayVN(t.ngay)}<span class="chi-man"><br>Câu nhiều em hỏi nhất xếp trên cùng. Bấm vào từng câu để mở lời giải.</span></div>
</div>`
  return taiLieuHtml(than, `Câu hỏi của em · ${t.tenCa}`)
}
