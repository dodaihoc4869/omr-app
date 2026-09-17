// XEM ĐỀ VÀ LỜI GIẢI KÈM LỖI SAI — dựng NGAY TẠI MÁY EM.
//
// VÌ SAO KHÔNG MỞ `/t/<mã ca>` TRONG KHUNG:
// Bản 14/09 mở đường dẫn ấy trong lớp phủ. Nó phụ thuộc vào việc máy chủ (hoặc
// service worker) trả đúng `index.html` cho một đường dẫn không có tệp thật —
// và đó chính là chỗ vỡ: Cloudflare Pages trả 404, còn máy đã cài service
// worker thiếu đường lui thì ra thẳng trang lỗi trình duyệt. Em bấm nút là
// thấy "không vào được".
//
// Nay dựng HTML tại chỗ, đúng khuôn phiếu đã thiết kế (`dungPhieu`), giống hệt
// phiếu bài tập và phiếu khắc phục. Không đụng tới điều hướng, nên chạy cả khi
// mất mạng và không bao giờ phụ thuộc cấu hình máy chủ.
import { cauLuyenTuNguon, type CauLuyen } from './bai-tap-pdf'
import { taoChiTietCau } from './chi-tiet-cau'
import { dungPhieu, type ThongTinPhieu } from './html-phieu'
import { phieuCuaEm, type ChiTietCauRow, type KeyBank } from './exam-api'

/** Chọn đúng dấu vết đề đã làm; chỉ tái dựng cho dữ liệu ca cũ chưa có bảng chấm. */
export function chiTietDeDaLam(
  bank: KeyBank,
  maCa: string,
  sbd: string,
  rowsMayChu: ChiTietCauRow[] | null | undefined,
  dapAn: Parameters<typeof taoChiTietCau>[3],
  giayCau: Parameters<typeof taoChiTietCau>[4],
  boCuaEm?: string[] | null,
): ChiTietCauRow[] {
  return rowsMayChu?.length ? rowsMayChu : taoChiTietCau(bank, maCa, sbd, dapAn, giayCau, boCuaEm)
}

/** Ghép bộ câu của chính em với lời giải, đánh dấu đúng chỗ em sai. */
export function dungHtmlDeVaLoiGiai(
  bank: KeyBank,
  maCa: string,
  sbd: string,
  hoTen: string,
  tenCa: string,
  rows: ChiTietCauRow[],
): string {
  const nguon = [{ maDe: maCa, phanI: bank.phanI, phanII: bank.phanII, phanIII: bank.phanIII }] as Parameters<
    typeof cauLuyenTuNguon
  >[0]
  const tatCa = cauLuyenTuNguon(nguon)
  const theoId = new Map<string, CauLuyen>()
  for (const c of tatCa) theoId.set(c.id, c)

  // ĐI THEO BẢNG CHẤM CỦA CHÍNH EM, không theo cả gói đề: ca đề riêng thì gói
  // đề chứa cả kho của lớp, còn bảng chấm chỉ có đúng tờ đề em nhận.
  const cau: CauLuyen[] = []
  for (const r of rows) {
    const c = theoId.get(r.qid)
    if (!c) continue
    // Câu SAI mang nhãn đỏ kèm đáp án em đã chọn; câu đúng để nguyên.
    cau.push(
      r.dungSai === false
        ? {
            ...c,
            chuaCho: {
              qid: r.qid,
              soCau: r.soCau,
              phan: r.phan,
              maDang: '',
              tenDang: r.chuyenDe || '',
              bac: 1 as const,
              daChon: r.dapAnChon || '',
              // ĐÂY LÀ TỜ ĐỀ CỦA EM, KHÔNG PHẢI PHIẾU KHẮC PHỤC (thầy bắt
              // 14/09: bấm "Xem đề và lời giải" ra một tờ dán đầy nhãn "Khắc
              // phục lỗi sai"). Cờ này đổi nhãn sang "Em làm sai câu N phần P"
              // và bỏ hẳn bảng "phiếu này khắc phục lỗi nào".
              laDeCuaEm: true as const,
              dapAnDung: r.dapAnDung || '',
            },
          }
        : c,
    )
  }
  if (cau.length === 0) return ''

  const soSai = rows.filter((r) => r.dungSai === false).length
  const tt: ThongTinPhieu = {
    hoTen,
    sbd,
    ngay: new Date(),
    tenChuyenDe: tenCa || `Ca ${maCa}`,
    ketQua: soSai > 0 ? `${cau.length} câu · em sai ${soSai} câu` : `${cau.length} câu · em làm đúng hết`,
    hienDapAn: true,
    nhanBia: 'ĐỀ VÀ LỜI GIẢI',
  }
  return dungPhieu(tt, cau, { anGiai: false })
}

/** Lấy bài đã nộp của em từ máy chủ rồi dựng phiếu. Rỗng = chưa dựng được. */
export async function deVaLoiGiaiCuaEm(
  url: string,
  maCa: string,
  sbd: string,
  hoTenDuPhong = '',
): Promise<{ html: string; loi: string }> {
  let b: Awaited<ReturnType<typeof phieuCuaEm>>
  try {
    b = await phieuCuaEm(url, maCa, sbd)
  } catch (e) {
    return { html: '', loi: e instanceof Error ? e.message : 'Không lấy được bài của em' }
  }
  if (!b?.bank) return { html: '', loi: 'Ca này chưa có đáp án trên máy chủ — báo Thầy.' }
  const dapAn = b.luot?.dapAn ?? { phanI: {}, phanII: {}, phanIII: {} }
  // Bảng chấm trên máy chủ là bản ghi chính xác của đề em đã nhận: đúng qid,
  // đúng số câu và đúng thứ tự tại thời điểm làm bài. Không dựng lại từ kho
  // hiện tại vì ca đề riêng có thể rút một bộ khác khi quy tắc/kho đã đổi.
  // Ca cũ chưa có bảng chấm mới dùng đường lui từ dấu vết bài làm.
  const rows = chiTietDeDaLam(b.bank, maCa, sbd, b.chiTietCau, dapAn, b.luot?.giayCau, b.boCuaEm)
  const html = dungHtmlDeVaLoiGiai(b.bank, maCa, sbd, b.hoTen || hoTenDuPhong, b.tenCa || '', rows)
  if (!html) return { html: '', loi: 'Không dựng được đề của em — báo Thầy.' }
  return { html, loi: '' }
}
