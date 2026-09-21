// BỘ NÃO — NÉN THẺ / HỒ SƠ CHO PHIÊN AI ĐỌC (Code 1, 21/09/2026; Boss sau lượt lay.mjs thật: 115 hồ sơ sâu ≈ 58 KB/tệp 12 hồ sơ ⇒ quá nặng).
// THUẦN, không import (mã lệnh `scripts/bo-nao/lay.mjs` nạp trực tiếp bằng Node). CHỈ đổi CÁCH VIẾT, không đổi con số: mọi số AI thấy đều nằm trong thẻ đầy đủ — mà kiểm khuôn dùng
// (mã lệnh giữ thẻ đầy đủ ở tệp riêng `.the-day-du.json`, AI không mở).
//
// QUY ƯỚC ĐỌC (ghi ở cẩm nang `bo-nao/HUONG-DAN-BO-NAO.md`): khoá vắng = 0 / rỗng / không (đã bỏ null, [], {}, false); `theoNgay` = mảng [ngày trước, số câu làm, số câu đúng];
// `dangChuY` = mảng [mã dạng, đã gặp, đã sai, bậc, tỉ lệ khắc phục, làm 7 ngày, sai 7 ngày]; `cauSaiGanDay` = mảng [dạng, lần sai, trạng thái, giây];
// hồ sơ: `dangThem` = [mã dạng, đã khắc phục, xu hướng] cho dạng ĐÃ có ở `dangChuY`; `dangKhac` = [mã dạng, đã gặp, đã sai, bậc, tỉ lệ khắc phục, làm 7, sai 7, đã khắc phục, xu hướng] cho dạng còn lại;
// `nguon` bỏ khoá bằng 0; `homQuaDc` chỉ còn lech/dang/khacPhuc;
// `loiNhanGanDay` còn ≤ 2 lời, mỗi lời ≤ 50 ký tự (đủ để tránh lặp cách mở đầu).
// Đích: thẻ nhanh ≤ 1,2 KB · hồ sơ sâu (thẻ + phần THÊM) ≤ 3 KB · thẻ vắng ≤ 0,4 KB (byte UTF-8).
type Obj = Record<string, unknown>

const laDoiTuong = (x: unknown): x is Obj => x !== null && typeof x === 'object' && !Array.isArray(x)
const laBo = (v: unknown): boolean => v === null || v === undefined || v === false || (Array.isArray(v) && v.length === 0) || (laDoiTuong(v) && Object.keys(v).length === 0)

/** Bỏ mọi giá trị null / undefined / false / [] / {} (đệ quy trong đối tượng; phần tử của mảng giữ nguyên nhưng đối tượng bên trong được gọn). Không đổi số. */
export function gon<T>(x: T): T {
  if (Array.isArray(x)) return x.map((y) => gon(y)) as unknown as T
  if (laDoiTuong(x)) {
    const ra: Obj = {}
    for (const [k, v] of Object.entries(x)) {
      const g = gon(v)
      if (!laBo(g)) ra[k] = g
    }
    return ra as T
  }
  return x
}

/** Cắt chuỗi còn `n` ký tự (thêm "…" khi bị cắt). */
export function cat(chu: unknown, n: number): string {
  const s = String(chu ?? '')
  return Array.from(s).length <= n ? s : `${Array.from(s).slice(0, n - 1).join('')}…`
}

const SO_KY_TU_LOI_GAN_DAY = 50
const SO_LOI_GAN_DAY = 2
const SO_KY_TU_LOI_VANG = 40

const cotDangChuY = (d: Obj): unknown[] => [d.ma, d.gap, d.sai, d.bac, d.tiLeKhacPhuc, d.lam7, d.sai7]
const cotDangKhac = (d: Obj): unknown[] => [...cotDangChuY(d), d.daKhacPhuc, d.xuHuong]

/** THẺ NGẮN nén: bỏ `ngay` (đã có tên thư mục), gọn khoá rỗng, cắt lời nhắn gần đây. */
export function nenThe(the: unknown): Obj {
  if (!laDoiTuong(the)) return {}
  const { ngay: _n, loiNhanGanDay, nguon, homQuaDc, ...con } = the as Obj & { loiNhanGanDay?: unknown }
  void _n
  const ra: Obj = { ...con }
  if (Array.isArray(loiNhanGanDay)) ra.loiNhanGanDay = loiNhanGanDay.slice(0, SO_LOI_GAN_DAY).map((l) => cat(l, SO_KY_TU_LOI_GAN_DAY))
  if (laDoiTuong(nguon)) ra.nguon = Object.fromEntries(Object.entries(nguon).filter(([, v]) => v !== 0)) // khoá vắng = 0
  if (laDoiTuong(homQuaDc)) ra.homQuaDc = { lech: homQuaDc.lech, dang: homQuaDc.dang, khacPhuc: homQuaDc.khacPhuc }
  else if (homQuaDc !== undefined) ra.homQuaDc = homQuaDc
  if (Array.isArray(ra.dangChuY)) ra.dangChuY = (ra.dangChuY as Obj[]).map(cotDangChuY)
  return gon(ra)
}

/** PHẦN THÊM của hồ sơ đầy đủ (những gì KHÔNG có trong thẻ): số câu theo ngày, từng dạng, câu sai gần đây. Không lặp lại thẻ. */
export function nenHoSo(the: unknown, hoSo: unknown): Obj | null {
  if (!laDoiTuong(hoSo)) return null
  const t = laDoiTuong(the) ? the : {}
  const ra: Obj = {}
  for (const [k, v] of Object.entries(hoSo)) {
    if (k in t && JSON.stringify(t[k]) === JSON.stringify(v)) continue // trùng thẻ
    if (k === 'ngay') continue
    ra[k] = v
  }
  if (Array.isArray(ra.theoNgay)) ra.theoNgay = ra.theoNgay.map((x) => (laDoiTuong(x) ? [x.ngayTruoc, x.lam, x.dung] : x))
  if (Array.isArray(ra.cauSaiGanDay)) ra.cauSaiGanDay = ra.cauSaiGanDay.map((x) => (laDoiTuong(x) ? [x.dang, x.lanSai, x.trangThai, x.giay ?? 0] : x))
  if (Array.isArray(ra.dang)) {
    const daCo = new Set((Array.isArray(t.dangChuY) ? (t.dangChuY as Obj[]) : []).map((d) => d.ma))
    const cacDang = (ra.dang as unknown[]).filter(laDoiTuong)
    delete ra.dang
    ra.dangThem = cacDang.filter((d) => daCo.has(d.ma)).map((d) => [d.ma, d.daKhacPhuc, d.xuHuong])
    ra.dangKhac = cacDang.filter((d) => !daCo.has(d.ma)).map(cotDangKhac)
  }
  const g = gon(ra)
  return Object.keys(g).length ? g : null
}

/** THẺ VẮNG rút gọn (em vắng ≥ 2 ngày: AI chỉ cần mời quay lại bằng một việc nhỏ): hoạt động, số câu 7 ngày, chuỗi, ca thi, MỘT dạng chú ý, cờ, lý do viết phụ huynh, một lời nhắn gần nhất (≤ 40 ký tự). */
export function nenTheVang(the: unknown): Obj {
  if (!laDoiTuong(the)) return {}
  const t = the as Obj
  const cau = laDoiTuong(t.cau) ? t.cau : {}
  const dangChuY = (Array.isArray(t.dangChuY) ? (t.dangChuY as Obj[]) : []).slice(0, 1).map((d) => ({ ma: d.ma, sai7: d.sai7 }))
  const loi = Array.isArray(t.loiNhanGanDay) ? (t.loiNhanGanDay as unknown[]).slice(0, 1).map((l) => cat(l, SO_KY_TU_LOI_VANG)) : []
  return gon({
    hoatDong: t.hoatDong,
    cau: { lam7: cau.lam7, dung7: cau.dung7, tiLe7: cau.tiLe7 },
    chuoi: t.chuoi,
    ca: t.ca,
    dangChuY,
    co: t.co,
    khiNaoVietPhuHuynh: t.khiNaoVietPhuHuynh,
    loiNhanGanDay: loi,
  })
}
