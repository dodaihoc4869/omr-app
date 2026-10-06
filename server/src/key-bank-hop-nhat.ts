// HỢP NHẤT TỜ ĐÁP ÁN `key/<maCa>.json` KHI MÁY THẦY ĐẨY BẢN MỚI — KHÔNG GHI ĐÈ MÙ (thầy 06/10: "không được phép chấm sai cho bất kì bài kiểm tra nào").
//
// VÌ SAO. `capNhatKeyBank` trước đây `put` NGUYÊN VĂN gói máy thầy gửi. Mà ba đường gửi (chốt đáp án ở màn Ngân hàng đề, `capNhatCaDaMo` khi kho sửa lời giải,
// vá nền ở màn Theo dõi) gửi `mergeKeepAnswers(nguon)` TRẦN — KHÔNG kèm `soCau` (số câu mỗi em) và `boTheoEm` (bản đồ đề riêng). Hậu quả đo được ở mã:
//   · tờ đáp án của ca mất `soCau` ⇒ máy em mở lại app sau nộp dựng bộ câu "bù cho đủ CẢ KHO" ⇒ mẫu số phình, điểm hiện trên máy em loãng đi;
//   · mất `boTheoEm` ⇒ chấm lại phải đoán bộ câu từ bài làm;
//   · gói gửi lên ít câu hơn tờ đang giữ (máy khác mở ca trước khi nối thêm câu / câu thay số) ⇒ câu MẤT, em nào có câu ấy bị bù câu khác âm thầm.
// Luật hợp nhất:
//   · mỗi phần: GIỮ THỨ TỰ CŨ (thứ tự kho quyết định câu bù và hạt giống rút), câu có trong bản mới thì lấy NỘI DUNG MỚI (đáp án / lời giải mới),
//     câu CHỈ có ở bản cũ thì GIỮ (em đã làm câu ấy), câu chỉ có ở bản mới thì NỐI ĐUÔI;
//   · `soCau`, `boTheoEm`: bản mới nếu có, thiếu thì GIỮ bản cũ;
//   · trường khác: bản mới thắng.
// Gói mới không đọc được (không phải đối tượng có ba mảng câu) ⇒ TỪ CHỐI, không ghi — trước đây ghi "null" xoá sạch tờ đáp án.

type Obj = Record<string, unknown>

const laObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)

function idCua(q: unknown): string {
  return laObj(q) ? String(q.id ?? q.qid ?? '') : ''
}

function hopPhan(cu: unknown, moi: unknown): unknown[] {
  const dsCu = Array.isArray(cu) ? cu : []
  const dsMoi = Array.isArray(moi) ? moi : []
  const theoId = new Map<string, unknown>()
  for (const q of dsMoi) {
    const id = idCua(q)
    if (id) theoId.set(id, q)
  }
  const daCo = new Set<string>()
  const ra: unknown[] = dsCu.map((q) => {
    const id = idCua(q)
    if (id) daCo.add(id)
    return (id && theoId.get(id)) || q
  })
  for (const q of dsMoi) {
    const id = idCua(q)
    if (!id || !daCo.has(id)) ra.push(q)
  }
  return ra
}

/** Gói đáp án hợp lệ = đối tượng có đủ ba mảng `phanI`, `phanII`, `phanIII`. */
export function laKeyBankHopLe(v: unknown): v is Obj {
  return laObj(v) && Array.isArray(v.phanI) && Array.isArray(v.phanII) && Array.isArray(v.phanIII)
}

/** Hợp nhất `moi` (máy thầy vừa gửi) vào `cu` (đang nằm ở R2). `cu` rỗng/hỏng ⇒ lấy `moi`. `moi` không hợp lệ ⇒ trả `null` (chỗ gọi từ chối). */
export function hopNhatKeyBank(cu: unknown, moi: unknown): Obj | null {
  if (!laKeyBankHopLe(moi)) return null
  if (!laKeyBankHopLe(cu)) return moi
  const ra: Obj = { ...cu, ...moi }
  ra.phanI = hopPhan(cu.phanI, moi.phanI)
  ra.phanII = hopPhan(cu.phanII, moi.phanII)
  ra.phanIII = hopPhan(cu.phanIII, moi.phanIII)
  if (moi.soCau === undefined || moi.soCau === null) {
    if (cu.soCau !== undefined && cu.soCau !== null) ra.soCau = cu.soCau
    else delete ra.soCau
  }
  if (moi.boTheoEm === undefined || moi.boTheoEm === null) {
    if (cu.boTheoEm !== undefined && cu.boTheoEm !== null) ra.boTheoEm = cu.boTheoEm
    else delete ra.boTheoEm
  }
  return ra
}

/** `soCau` hợp lệ = ba số nguyên không âm, tổng > 0. */
function docSoCau(raw: unknown): { I: number; II: number; III: number } | null {
  let v: unknown = raw
  if (typeof raw === 'string') {
    try { v = JSON.parse(raw) } catch { return null }
  }
  if (!laObj(v)) return null
  const so = (x: unknown) => (Number.isInteger(x) && (x as number) >= 0 ? (x as number) : NaN)
  const r = { I: so(v.I), II: so(v.II), III: so(v.III) }
  return [r.I, r.II, r.III].some(Number.isNaN) || r.I + r.II + r.III === 0 ? null : r
}

/**
 * Tờ đáp án gửi cho em THIẾU `soCau` ⇒ bù từ D1 (`ca.so_cau_json`). Trả `null` khi không cần bù (đã có `soCau`) hoặc không bù được (D1 cũng thiếu / hỏng).
 * `tho` = JSON nguyên văn của tờ đáp án (nếu có): nối `,"soCau":{…}` vào TRƯỚC dấu `}` cuối, khỏi stringify lại cả tờ.
 */
export function buSoCauChoKeyBank(giaTri: unknown, tho: string | null, soCauD1: unknown): { giaTri: Obj; tho: string } | null {
  if (!laKeyBankHopLe(giaTri)) return null
  if (docSoCau(giaTri.soCau)) return null
  const sc = docSoCau(soCauD1)
  if (!sc) return null
  const moi: Obj = { ...giaTri, soCau: sc }
  const nguyenVan = typeof tho === 'string' && /\}\s*$/.test(tho) ? tho.replace(/\}\s*$/, `,"soCau":${JSON.stringify(sc)}}`) : JSON.stringify(moi)
  return { giaTri: moi, tho: nguyenVan }
}
