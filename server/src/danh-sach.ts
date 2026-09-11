// CHUẨN HOÁ DANH SÁCH LỚP TRƯỚC KHI GHI XUỐNG D1 — hàm thuần, tách ra để kiểm
// được bằng phép kiểm, không cần D1.
//
// VÌ SAO TÁCH (lỗi thật, tìm ra 11/09 trước khi phát hành):
//
//   ds.map(e => String(e.sbd).trim())      // mảng CHUỖI
//     .filter(x => x.length > 0)           // BỎ BỚT phần tử ⇒ chỉ số lệch
//     .map((_, i) => ...bind(ds[i].sbd, ds[i].hoTen, ...))   // tra mảng GỐC
//
// Chỉ cần MỘT em trong tệp của thầy thiếu số báo danh là mọi em đứng sau bị gán
// họ tên và năm sinh của em kế tiếp, và những em cuối danh sách rơi mất. Cổng
// vào thi khi ấy vẫn "chạy" — nó chỉ chặn nhầm người. Đúng kiểu hỏng tệ nhất:
// im lặng và sai.
//
// LUẬT PHẢI KHỚP APPS SCRIPT (`napDanhSachLop`), vì hai máy chủ cùng gác một
// cổng; lệch luật là em qua được bên này, bị chặn bên kia:
//   · bỏ dòng không có số báo danh;
//   · số báo danh trùng thì GIỮ DÒNG ĐẦU (Apps Script: `if (daCo[sbd]) continue`);
//   · ghi đè toàn bộ — em bị bỏ khỏi tệp của thầy phải biến mất khỏi cổng.

export interface EmDanhSachMay {
  sbd: string
  hoTen: string
  namSinh: string
  lop: string
}

export function chuanHoaDanhSach(ds: unknown): EmDanhSachMay[] {
  if (!Array.isArray(ds)) return []
  const ra: EmDanhSachMay[] = []
  const daCo = new Set<string>()
  for (const e of ds) {
    const o = (e ?? {}) as Record<string, unknown>
    const sbd = String(o.sbd ?? '').trim()
    if (!sbd || daCo.has(sbd)) continue
    daCo.add(sbd)
    ra.push({
      sbd,
      hoTen: String(o.hoTen ?? '').trim(),
      namSinh: String(o.namSinh ?? '').trim(),
      lop: String(o.lop ?? '').trim(),
    })
  }
  return ra
}
