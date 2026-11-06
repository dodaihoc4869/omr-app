// RÚT CÂU MỚI THEO MA TRẬN ĐỀ 2026 (thầy 06/11: «Phần rút câu mới tôi muốn bạn rút theo đúng tỷ lệ ma trận đề thi 2026 theo mỗi ngày chứ không dễ trước khó sau nữa»).
//
// Một hàm THUẦN cho mọi đường rút câu mới (Gói 7 `chonGoi7`, chiến dịch game `lapKeHoachNgay`): nhận danh sách câu mới ĐÃ XẾP theo luật riêng của đường ấy
// (sẵn sàng, trọng số OMNI, bốc cá nhân hoá …) rồi XẾP LẠI để MỌI ĐOẠN ĐẦU bám tỉ lệ ma trận theo ô (phần × mức). Số câu mới mỗi ngày KHÔNG đổi —
// nơi gọi vẫn cắt đúng quota cũ; chỉ đổi câu NÀO vào phần cắt ấy.
//
// - Ma trận chọn ô: bước kế tiếp lấy ô (còn câu) THIẾU nhiều nhất so với tỉ lệ = trọng số ô / tổng trọng số các ô còn câu × số câu đã rút.
// - Trong một ô: giữ đúng thứ tự nơi gọi truyền vào (luật riêng của đường ấy quyết định câu nào trước).
// - `daRut`: số câu mới ĐÃ rút trước đó của cùng gói / chiến dịch theo ô ⇒ ô trọng số nhỏ (Phần II Vận dụng, Phần III Biết: 1/28) không bị dồn
//   về những ngày cuối (lặp lại «khó sau» dưới tên khác); cả bài bám ma trận, từng ngày sát ma trận.
// - Ô không còn câu ⇒ tỉ lệ chia lại trên các ô còn câu (kho thầy giao không đủ ô nào thì ô khác bù, tổng số câu không hụt).
//
// Ma trận: MA_TRAN_HOA_2026 (src/lib/ma-tran-hoa-2026.ts — ứng dụng phân tích từ đề 0305, 0330, 0332, 0344; không phải ma trận Bộ công bố). Chép số
// sang đây để Worker không kéo theo mã máy thầy; tests/ma-tran-rut-moi-0611.test.ts khoá hai bản luôn trùng.

export type PhanMt = 'I' | 'II' | 'III'
export type MucMt = 'biet' | 'hieu' | 'van_dung'

export const MA_TRAN_RUT_MOI: Readonly<Record<PhanMt, Readonly<Record<MucMt, number>>>> = {
  I: { biet: 11, hieu: 4, van_dung: 3 },
  II: { biet: 0, hieu: 3, van_dung: 1 },
  III: { biet: 1, hieu: 2, van_dung: 3 },
}

const MUC_CHUAN: Record<string, MucMt> = {
  NB: 'biet', 'Nhận biết': 'biet', biet: 'biet',
  TH: 'hieu', 'Thông hiểu': 'hieu', hieu: 'hieu',
  VD: 'van_dung', 'Vận dụng': 'van_dung', van_dung: 'van_dung',
  VDC: 'van_dung', 'Vận dụng cao': 'van_dung', van_dung_cao: 'van_dung',
}

/**
 * Ô ma trận của một câu. Mức VDC gộp vào Vận dụng. Câu CHƯA GẮN MỨC ⇒ Hiểu (mức có ở cả ba phần — tự chốt, ghi rõ). Ô trọng số 0 (Phần II Biết)
 * ⇒ ô dương gần nhất cùng phần (Hiểu), không thì câu ấy nằm cuối mãi. Phần lạ ⇒ Phần I.
 */
export function oMaTran(phan: string | null | undefined, mucDo: string | null | undefined): string {
  const p: PhanMt = phan === 'II' || phan === 'III' ? phan : 'I'
  let m: MucMt = (mucDo != null && MUC_CHUAN[mucDo.trim()]) || 'hieu'
  if (MA_TRAN_RUT_MOI[p][m] <= 0) m = 'hieu'
  return `${p}|${m}`
}

const THU_TU_O = (Object.keys(MA_TRAN_RUT_MOI) as PhanMt[]).flatMap((p) => (Object.keys(MA_TRAN_RUT_MOI[p]) as MucMt[]).map((m) => `${p}|${m}`))
const trongSoO = (o: string): number => { const [p, m] = o.split('|') as [PhanMt, MucMt]; return MA_TRAN_RUT_MOI[p]?.[m] ?? 0 }

/** Đếm số câu theo ô (để làm `daRut`). */
export function demTheoO<T>(ds: Iterable<T>, o: (x: T) => string): Map<string, number> {
  const n = new Map<string, number>()
  for (const x of ds) { const k = o(x); n.set(k, (n.get(k) ?? 0) + 1) }
  return n
}

/**
 * Xếp lại `ds` (thứ tự trong từng ô giữ nguyên) để mọi đoạn đầu bám ma trận. Tất định: hoà ⇒ ô trọng số lớn trước, rồi thứ tự cố định
 * Phần I → III, Biết → Vận dụng. Không mất, không thêm câu.
 */
export function xepTheoMaTran<T>(ds: readonly T[], o: (x: T) => string, daRut?: ReadonlyMap<string, number>): T[] {
  if (ds.length <= 1) return [...ds]
  const hang = new Map<string, T[]>()
  for (const x of ds) { const k = o(x); const h = hang.get(k); if (h) h.push(x); else hang.set(k, [x]) }
  // Khoá lạ (nơi gọi không dùng `oMaTran`) ⇒ trọng số 0, đứng sau mọi ô thật — không bao giờ mất câu, không lặp vô hạn.
  const cacO = [...THU_TU_O.filter((k) => hang.has(k)), ...[...hang.keys()].filter((k) => !THU_TU_O.includes(k))]
  const viTri = new Map(cacO.map((k) => [k, 0]))
  const da = new Map(cacO.map((k) => [k, Math.max(0, Math.floor(Number(daRut?.get(k)) || 0))]))
  const ra: T[] = []
  while (ra.length < ds.length) {
    const con = cacO.filter((k) => viTri.get(k)! < hang.get(k)!.length)
    const W = con.reduce((s, k) => s + trongSoO(k), 0)
    const T = con.reduce((s, k) => s + da.get(k)!, 0) + 1
    let tot = con[0]!, diemTot = -Infinity
    if (W > 0) for (const k of con) {
      if (trongSoO(k) <= 0) continue
      const d = (trongSoO(k) / W) * T - da.get(k)!
      if (d > diemTot + 1e-9 || (Math.abs(d - diemTot) <= 1e-9 && trongSoO(k) > trongSoO(tot))) { tot = k; diemTot = d }
    }
    const i = viTri.get(tot)!
    ra.push(hang.get(tot)![i]!)
    viTri.set(tot, i + 1)
    da.set(tot, da.get(tot)! + 1)
  }
  return ra
}

/** Băm FNV-1a 32 bit — hoà trong một ô xoay theo ngày (không cố định theo mã câu). */
export function bamMt(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h >>> 0
}
