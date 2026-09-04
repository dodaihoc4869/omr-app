// GỌI HỌC SINH LÊN BẢNG — phân công câu chữa theo ĐÚNG chỗ em yếu.
//
// Thầy chọn một đề trong kho, tích những em muốn gọi, bấm một nút. Máy nhìn
// chuyên đề em sai nhiều nhất TRONG CA GẦN NHẤT của chính em đó rồi lấy trong
// đề ra một câu thuộc chuyên đề ấy. Em nào yếu chỗ nào chữa đúng chỗ đó.
//
// Ba luật bắt buộc, vì sai chỗ này là thầy đứng lớp mới phát hiện:
//   1. KHÔNG hai em cùng một câu — gọi lên bảng mà trùng đề là hỏng buổi chữa.
//   2. Không có câu nào thuộc chuyên đề yếu thì NÓI THẲNG "đề không có câu
//      chuyên đề này", rồi mới lấy câu khác. Không im lặng đưa câu lạc đề.
//   3. Em chưa thi ca nào, hoặc ca gần nhất không đủ dữ liệu chuyên đề, thì
//      ghi rõ "chưa có dữ liệu" — không đoán chuyên đề yếu.

export interface CauCoTheGoi {
  id: string
  phan: 'I' | 'II' | 'III'
  /** Số câu in trong đề, để thầy đọc to trên lớp. */
  so: number
  chuyenDe?: string
  mucDo?: 'biet' | 'hieu' | 'van_dung'
  /** Vài chữ đầu của đề bài, cho thầy nhận ra câu nào. */
  tomTat: string
}

export interface EmDeGoi {
  sbd: string
  hoTen: string
  lop?: string
  /** Chuyên đề của CA GẦN NHẤT: tên + số câu + số câu sai. Rỗng = chưa có dữ liệu. */
  chuyenDeCaGanNhat: { ten: string; soCau: number; soSai: number }[]
}

export type LyDoGoi = 'dung_chuyen_de_yeu' | 'de_khong_co_chuyen_de_nay' | 'chua_co_du_lieu'

export interface PhanCong {
  sbd: string
  hoTen: string
  /** Chuyên đề em yếu nhất trong ca gần nhất — null khi chưa có dữ liệu. */
  chuyenDeYeu: { ten: string; soCau: number; soSai: number } | null
  cau: CauCoTheGoi | null
  lyDo: LyDoGoi
  /** Câu nhắc thầy đọc khi lý do không phải "đúng chuyên đề yếu". */
  ghiChu?: string
}

/** Chuyên đề YẾU NHẤT của một em: nhiều câu sai nhất; bằng nhau thì tỉ lệ sai
 * cao hơn. Không tính chuyên đề không sai câu nào — chữa chỗ em đã làm đúng là
 * phí thời gian đứng lớp. */
export function chuyenDeYeuNhat(em: EmDeGoi): EmDeGoi['chuyenDeCaGanNhat'][number] | null {
  const co = em.chuyenDeCaGanNhat.filter((c) => c.soSai > 0 && c.ten.trim())
  if (co.length === 0) return null
  return [...co].sort((a, b) => b.soSai - a.soSai || b.soSai / b.soCau - a.soSai / a.soCau || a.ten.localeCompare(b.ten, 'vi'))[0]
}

/** So tên chuyên đề: bỏ dấu, thường hoá, gộp khoảng trắng, coi mọi loại gạch
 * ngang là một. Pipeline ghi "Ester – lipid" (gạch en) còn máy chủ có thể trả
 * "Ester - lipid" (gạch thường) — lệch một ký tự mà trượt hết thì vô lý. */
export function chuanChuyenDe(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[–—-]/g, '-')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Thứ tự ưu tiên khi có nhiều câu cùng chuyên đề: câu KHÓ HƠN lên bảng, vì
 * câu nhận biết thì chữa miệng cũng xong. Cùng mức độ thì theo số câu. */
const DIEM_MUC_DO: Record<string, number> = { van_dung: 0, hieu: 1, biet: 2 }
function xepCau(a: CauCoTheGoi, b: CauCoTheGoi): number {
  const ma = DIEM_MUC_DO[a.mucDo ?? ''] ?? 3
  const mb = DIEM_MUC_DO[b.mucDo ?? ''] ?? 3
  return ma - mb || a.phan.length - b.phan.length || a.so - b.so
}

/**
 * Phân công câu cho từng em. Duyệt em theo thứ tự truyền vào; em nào cũng lấy
 * câu KHÓ NHẤT còn trống trong chuyên đề yếu của mình.
 *
 * Em yếu chuyên đề hiếm câu được ưu tiên trước: xếp em có ít câu khả dụng lên
 * đầu, kẻo em đó bị em khác "ăn" mất câu cuối cùng của chuyên đề rồi phải nhận
 * câu lạc đề, trong khi em kia còn cả chục câu khác để chọn.
 */
export function phanCongCauHoi(dsEm: EmDeGoi[], cauHoi: CauCoTheGoi[]): PhanCong[] {
  const conTrong = new Map<string, CauCoTheGoi>()
  for (const c of cauHoi) conTrong.set(c.id, c)

  const yeu = new Map<string, ReturnType<typeof chuyenDeYeuNhat>>()
  const soCauCo = new Map<string, number>()
  for (const em of dsEm) {
    const cd = chuyenDeYeuNhat(em)
    yeu.set(em.sbd, cd)
    soCauCo.set(em.sbd, cd ? cauHoi.filter((c) => chuanChuyenDe(c.chuyenDe ?? '') === chuanChuyenDe(cd.ten)).length : Number.MAX_SAFE_INTEGER)
  }
  const thuTu = [...dsEm].sort((a, b) => (soCauCo.get(a.sbd) ?? 0) - (soCauCo.get(b.sbd) ?? 0))

  const ra = new Map<string, PhanCong>()
  for (const em of thuTu) {
    const cd = yeu.get(em.sbd) ?? null
    if (!cd) {
      ra.set(em.sbd, {
        sbd: em.sbd,
        hoTen: em.hoTen,
        chuyenDeYeu: null,
        cau: null,
        lyDo: 'chua_co_du_lieu',
        ghiChu: 'Em chưa có ca nào đã chấm, hoặc ca gần nhất chưa có dữ liệu chuyên đề — thầy tự chọn câu.',
      })
      continue
    }
    const khop = [...conTrong.values()].filter((c) => chuanChuyenDe(c.chuyenDe ?? '') === chuanChuyenDe(cd.ten)).sort(xepCau)
    if (khop.length > 0) {
      const c = khop[0]
      conTrong.delete(c.id)
      ra.set(em.sbd, { sbd: em.sbd, hoTen: em.hoTen, chuyenDeYeu: cd, cau: c, lyDo: 'dung_chuyen_de_yeu' })
      continue
    }
    // Hết câu đúng chuyên đề: vẫn gọi em lên, nhưng NÓI RÕ câu này lạc chuyên đề.
    const bu = [...conTrong.values()].sort(xepCau)[0] ?? null
    if (bu) conTrong.delete(bu.id)
    ra.set(em.sbd, {
      sbd: em.sbd,
      hoTen: em.hoTen,
      chuyenDeYeu: cd,
      cau: bu,
      lyDo: 'de_khong_co_chuyen_de_nay',
      ghiChu: `Đề đang chọn không còn câu nào thuộc "${cd.ten}"${bu ? ' — câu dưới đây là chuyên đề khác' : ' và cũng hết câu trống'}.`,
    })
  }
  // Trả về ĐÚNG thứ tự thầy tích, không phải thứ tự nội bộ của thuật toán.
  return dsEm.map((em) => ra.get(em.sbd)!).filter(Boolean)
}

/** Bảng phân công dạng chữ để thầy copy sang Zalo lớp hoặc dán vào giáo án. */
export function bangPhanCongChu(ds: PhanCong[], tenDe: string): string {
  const dong = ds.map((p, i) => {
    const cau = p.cau ? `Phần ${p.cau.phan} câu ${p.cau.so}` : 'chưa có câu'
    const cd = p.chuyenDeYeu ? ` (${p.chuyenDeYeu.ten}, sai ${p.chuyenDeYeu.soSai}/${p.chuyenDeYeu.soCau})` : ' (chưa có dữ liệu)'
    return `${i + 1}. ${p.hoTen || `SBD ${p.sbd}`} — ${cau}${cd}`
  })
  return [`Gọi lên bảng · đề ${tenDe}`, ...dong].join('\n')
}
