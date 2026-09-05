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
  /** Chỉ số câu trong mảng phần tương ứng của đề — để màn tra ra câu ĐẦY ĐỦ
   * (phương án, hình, lời giải) mà không phải chép lại nội dung vào đây. */
  viTri: number
  /** SAO CẦN CHỮA (0/1/2) chấm sẵn trong kho. Câu chưa gắn tính 0 — không đoán. */
  sao?: 0 | 1 | 2
  /** Vì sao câu này đáng chữa — thầy đọc để quyết có gọi câu đó không. */
  lyDoSao?: string
}

export interface EmDeGoi {
  sbd: string
  hoTen: string
  lop?: string
  /** Chuyên đề của CA GẦN NHẤT: tên + số câu + số câu sai. Rỗng = chưa có dữ liệu. */
  chuyenDeCaGanNhat: { ten: string; soCau: number; soSai: number }[]
}

export type MucDo = 'biet' | 'hieu' | 'van_dung'
export const BAC: MucDo[] = ['biet', 'hieu', 'van_dung']

export type LyDoGoi = 'dung_chuyen_de_yeu' | 'de_khong_co_chuyen_de_nay' | 'chua_co_du_lieu' | 'het_cau_moi'

/**
 * MỨC ĐỘ NÊN GỌI — cốt lõi của việc gọi lên bảng cho em TIẾN BỘ.
 *
 * Em sai 25/28 câu một chuyên đề là đang hổng gốc. Lôi em lên bảng chữa câu
 * vận dụng thì em đứng im, cả lớp chờ, và em nhục. Phải bắt đầu từ chỗ em với
 * tới được rồi nâng dần:
 *   sai ≥ 60%  → nhận biết
 *   sai 30–60% → thông hiểu
 *   sai < 30%  → vận dụng
 *
 * `soLanDaGoi` là số câu em ĐÃ được gọi ở chuyên đề này (kể cả bài tập đã làm):
 * mỗi lần trước nâng một bậc, nên gọi lại lần hai là câu khó hơn lần một.
 */
export function mucDoNenGoi(tiLeSai: number, soLanDaGoi = 0): MucDo {
  const goc = tiLeSai >= 0.6 ? 0 : tiLeSai >= 0.3 ? 1 : 2
  return BAC[Math.min(BAC.length - 1, goc + Math.max(0, soLanDaGoi))]
}

export interface PhanCong {
  sbd: string
  hoTen: string
  /** Chuyên đề em yếu nhất trong ca gần nhất — null khi chưa có dữ liệu. */
  chuyenDeYeu: { ten: string; soCau: number; soSai: number } | null
  cau: CauCoTheGoi | null
  lyDo: LyDoGoi
  /** Câu nhắc thầy đọc khi lý do không phải "đúng chuyên đề yếu". */
  ghiChu?: string
  /** Mức độ máy nhắm tới cho em này, và vì sao — để thầy đọc là hiểu ngay chứ
   * không phải tin một con số từ trên trời. */
  mucDoNham?: MucDo
  viSao?: string
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

/** Xếp câu theo ĐỘ HỢP với mức độ đang nhắm. Đúng mức thì tốt nhất; không có
 * thì lệch một bậc, và ưu tiên bậc DỄ HƠN — cho câu quá tầm là em đứng im. */
function xepTheoMuc(nham: MucDo) {
  const dich = BAC.indexOf(nham)
  return (a: CauCoTheGoi, b: CauCoTheGoi) => {
    const ia = BAC.indexOf((a.mucDo ?? '') as MucDo)
    const ib = BAC.indexOf((b.mucDo ?? '') as MucDo)
    // Câu không ghi mức độ xếp sau cùng: không biết khó dễ thì không dám đưa lên bảng trước.
    const da = ia < 0 ? 99 : Math.abs(ia - dich) * 2 + (ia > dich ? 1 : 0)
    const db = ib < 0 ? 99 : Math.abs(ib - dich) * 2 + (ib > dich ? 1 : 0)
    // ĐÚNG MỨC ĐỘ TRƯỚC, RỒI MỚI TỚI SAO. Sao nói câu nào đáng chữa với cả lớp;
    // mức độ nói câu nào em này với tới được. Lôi em hổng gốc lên chữa câu hai
    // sao vận dụng thì em đứng im, nên mức độ vẫn thắng.
    return da - db || (b.sao ?? 0) - (a.sao ?? 0) || a.phan.length - b.phan.length || a.so - b.so
  }
}

/**
 * Phân công câu cho từng em. Duyệt em theo thứ tự truyền vào; em nào cũng lấy
 * câu KHÓ NHẤT còn trống trong chuyên đề yếu của mình.
 *
 * Em yếu chuyên đề hiếm câu được ưu tiên trước: xếp em có ít câu khả dụng lên
 * đầu, kẻo em đó bị em khác "ăn" mất câu cuối cùng của chuyên đề rồi phải nhận
 * câu lạc đề, trong khi em kia còn cả chục câu khác để chọn.
 */
export function phanCongCauHoi(
  dsEm: EmDeGoi[],
  cauHoi: CauCoTheGoi[],
  /** Câu em ĐÃ được gọi hoặc đã làm — theo SBD. Phân công lại KHÔNG BAO GIỜ
   * lặp lại câu cũ: chữa đúng câu ấy lần nữa thì em có tiến bộ gì đâu. */
  tranhQid: Record<string, string[]> = {},
): PhanCong[] {
  const conTrong = new Map<string, CauCoTheGoi>()
  for (const c of cauHoi) conTrong.set(c.id, c)

  const yeu = new Map<string, ReturnType<typeof chuyenDeYeuNhat>>()
  const soCauCo = new Map<string, number>()
  for (const em of dsEm) {
    const cd = chuyenDeYeuNhat(em)
    yeu.set(em.sbd, cd)
    // Đếm câu CÒN MỚI với riêng em đó — em đã chữa gần hết chuyên đề thì mới
    // thật sự là "ít lựa chọn", phải chia trước.
    const daGoi = new Set(tranhQid[em.sbd] ?? [])
    soCauCo.set(
      em.sbd,
      cd ? cauHoi.filter((c) => !daGoi.has(c.id) && chuanChuyenDe(c.chuyenDe ?? '') === chuanChuyenDe(cd.ten)).length : Number.MAX_SAFE_INTEGER,
    )
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
    const daGoi = new Set(tranhQid[em.sbd] ?? [])
    const tiLe = cd.soCau > 0 ? cd.soSai / cd.soCau : 1
    // Đếm số câu CÙNG CHUYÊN ĐỀ em đã được gọi/đã làm — mỗi câu cũ nâng một bậc.
    const daGoiCungCd = cauHoi.filter((c) => daGoi.has(c.id) && chuanChuyenDe(c.chuyenDe ?? '') === chuanChuyenDe(cd.ten)).length
    const nham = mucDoNenGoi(tiLe, daGoiCungCd)
    const xep = xepTheoMuc(nham)
    const viSao = `Sai ${cd.soSai}/${cd.soCau} (${Math.round(tiLe * 100)}%)${daGoiCungCd > 0 ? `, đã chữa ${daGoiCungCd} câu chuyên đề này` : ''} → ${TEN_MUC[nham]}`

    const cungCd = [...conTrong.values()].filter((c) => chuanChuyenDe(c.chuyenDe ?? '') === chuanChuyenDe(cd.ten))
    const moi = cungCd.filter((c) => !daGoi.has(c.id)).sort(xep)
    if (moi.length > 0) {
      const c = moi[0]
      conTrong.delete(c.id)
      ra.set(em.sbd, { sbd: em.sbd, hoTen: em.hoTen, chuyenDeYeu: cd, cau: c, lyDo: 'dung_chuyen_de_yeu', mucDoNham: nham, viSao })
      continue
    }
    // Đúng chuyên đề nhưng em đã chữa hết: NÓI THẲNG chứ không lặng lẽ đưa lại
    // câu cũ — chữa lại đúng câu ấy thì em không tiến thêm bước nào.
    if (cungCd.length > 0) {
      const c = cungCd.sort(xep)[0]
      conTrong.delete(c.id)
      ra.set(em.sbd, {
        sbd: em.sbd,
        hoTen: em.hoTen,
        chuyenDeYeu: cd,
        cau: c,
        lyDo: 'het_cau_moi',
        mucDoNham: nham,
        viSao,
        ghiChu: `Em đã chữa hết câu "${cd.ten}" trong đề này — câu dưới đây là câu cũ, thầy nên đổi sang đề khác.`,
      })
      continue
    }
    // Hết câu đúng chuyên đề: vẫn gọi em lên, nhưng NÓI RÕ câu này lạc chuyên đề.
    const bu = [...conTrong.values()].filter((c) => !daGoi.has(c.id)).sort(xep)[0] ?? null
    if (bu) conTrong.delete(bu.id)
    ra.set(em.sbd, {
      sbd: em.sbd,
      hoTen: em.hoTen,
      chuyenDeYeu: cd,
      cau: bu,
      lyDo: 'de_khong_co_chuyen_de_nay',
      mucDoNham: nham,
      viSao,
      ghiChu: `Đề đang chọn không có câu nào thuộc "${cd.ten}"${bu ? ', câu dưới đây là chuyên đề khác' : ' và cũng hết câu trống'}.`,
    })
  }
  // Trả về ĐÚNG thứ tự thầy tích, không phải thứ tự nội bộ của thuật toán.
  return dsEm.map((em) => ra.get(em.sbd)!).filter(Boolean)
}

export const TEN_MUC: Record<MucDo, string> = { biet: 'nhận biết', hieu: 'thông hiểu', van_dung: 'vận dụng' }

/** Bảng phân công dạng chữ để thầy copy sang Zalo lớp hoặc dán vào giáo án. */
export function bangPhanCongChu(ds: PhanCong[], tenDe: string): string {
  const dong = ds.map((p, i) => {
    const cau = p.cau ? `Phần ${p.cau.phan} câu ${p.cau.so}${p.cau.sao ? ' ' + '★'.repeat(p.cau.sao) : ''}` : 'chưa có câu'
    const cd = p.chuyenDeYeu ? ` (${p.chuyenDeYeu.ten}, sai ${p.chuyenDeYeu.soSai}/${p.chuyenDeYeu.soCau})` : ' (chưa có dữ liệu)'
    return `${i + 1}. ${p.hoTen || `SBD ${p.sbd}`} — ${cau}${cd}`
  })
  return [`Gọi lên bảng · đề ${tenDe}`, ...dong].join('\n')
}
