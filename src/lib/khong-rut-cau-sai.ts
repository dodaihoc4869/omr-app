// QUY TẮC "CÂU ĐÃ GẶP" CỦA CA "KHÔNG RÚT CÂU SAI" — MỘT NƠI DUY NHẤT (thầy 06/10: hai đường không được khác luật).
//
// Hai đường cùng gọi hàm ở đây:
//   · đề chuẩn bị sẵn lúc Bắt đầu thi (máy thầy: `dungDeRieng` / `dungDeRiengLuotHai` trong de-rieng.ts);
//   · em vào muộn (máy chủ: `lapBoChoEmVaoMuon` trong server/src/rut-de-v2.ts — dùng `tapCamEmVaoMuon` bên dưới).
//
// Quy tắc:
//   (a) CẤM CỨNG: câu em đã gặp ở các ca kiểm tra trước (cả đúng lẫn sai).
//   (b) ƯU TIÊN BỎ (cấm mềm): câu em đã làm ở BẤT KỲ kênh nào (game, chiến dịch, luyện, Lên bảng, Đầu giờ…) trong
//       `SO_NGAY_CAM_MEM` = 30 ngày gần nhất.
//   (c) Kho thiếu câu mới ⇒ nới từ CUỐI tập cấm: nhóm (b) trước (câu làm lâu nhất trước), rồi mới tới câu ca trước cũ nhất;
//       câu bị lấy lại gắn nhãn "Đã làm ở …" (xem `daLamLaiTrongDe` trong de-rieng.ts).
// Hàm thuần: không đọc mạng, không đọc đồng hồ — dùng được cả ở máy thầy lẫn Worker.

/** Số ngày của cấm mềm (trước 06/10 là 7). */
export const SO_NGAY_CAM_MEM = 30

const MOT_NGAY_MS = 86_400_000

/** TẬP CẤM CỦA MỘT EM, đã xếp thứ tự nới: câu ca trước (mới nhất → cũ nhất) đứng TRƯỚC, câu làm gần đây ở kênh khác đứng SAU
 * (mới nhất → cũ nhất). Kho mỏng thì nới từ CUỐI mảng. Chỉ giữ câu có trong kho phần này và chưa nằm trong bộ sẵn (`daCo`). */
export function camKhongRutCauSai(
  daGapCaTruoc: Iterable<string>,
  lamGanDay: readonly string[],
  trongPool: ReadonlySet<string>,
  daCo: ReadonlySet<string>,
): string[] {
  const ra: string[] = []
  const caTruoc = new Set<string>()
  for (const q of daGapCaTruoc) {
    caTruoc.add(q)
    if (trongPool.has(q) && !daCo.has(q)) ra.push(q)
  }
  for (const q of lamGanDay) if (trongPool.has(q) && !daCo.has(q) && !caTruoc.has(q)) ra.push(q)
  return ra
}

/** Từ bản đồ "câu → ngày VN em làm gần nhất" (mọi kênh, vd `docDaGap` của máy chủ) lấy các câu trong `soNgay` ngày tính tới `ngay`,
 * mới nhất trước, cùng ngày thì qid tăng dần (giống thứ tự `lam` của hồ sơ ôn). */
export function lamGanDayTuDaGap(daGap: Readonly<Record<string, string>>, ngay: string, soNgay: number = SO_NGAY_CAM_MEM): string[] {
  const den = Date.parse(`${ngay}T00:00:00Z`)
  if (!Number.isFinite(den)) return []
  const tu = den - soNgay * MOT_NGAY_MS
  const ra: [string, string][] = []
  for (const [q, n] of Object.entries(daGap)) {
    const ms = Date.parse(`${String(n).slice(0, 10)}T00:00:00Z`)
    if (Number.isFinite(ms) && ms >= tu && ms <= den) ra.push([q, String(n).slice(0, 10)])
  }
  ra.sort((a, b) => (a[1] === b[1] ? (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0) : a[1] < b[1] ? 1 : -1))
  return ra.map((x) => x[0])
}

/** ĐƯỜNG EM VÀO MUỘN (máy chủ gọi): cùng quy tắc với đề chuẩn bị sẵn.
 * `caTruoc` = qid em đã gặp ở các ca kiểm tra trước (mới nhất trước); `daGap` = qid → ngày VN gần nhất ở MỌI kênh. */
export function tapCamEmVaoMuon(p: {
  caTruoc: Iterable<string>
  daGap: Readonly<Record<string, string>>
  ngay: string
  trongPool: ReadonlySet<string>
  daCo?: ReadonlySet<string>
}): string[] {
  return camKhongRutCauSai(p.caTruoc, lamGanDayTuDaGap(p.daGap, p.ngay), p.trongPool, p.daCo ?? new Set())
}
