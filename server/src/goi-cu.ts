// CỔNG TƯƠNG THÍCH `/goi` — CẮT HẲN GOOGLE.
//
// Thầy chốt 12/09 rạng sáng: "gỡ sạch google, toàn bộ app phải được chạy trên
// máy chủ mới". App đang gọi Apps Script bằng 67 lệnh dạng `{action: '...'}`.
// Viết lại 67 chỗ gọi trong một đêm là cách chắc chắn nhất để làm hỏng một thứ
// đang chạy, nên đường đi là NGƯỢC LẠI: giữ nguyên dáng lệnh cũ, đổi nơi nhận.
//
// Một cổng, một bảng dịch, mỗi lệnh một hàm đọc thẳng D1. Màn hình không đổi
// một dòng nào, và `grep script.google.com src/` phải ra 0 — đó là thước đo.
//
// BA LUẬT GIỮ NGUYÊN TỪ `index.ts`:
//   1. Mỗi lệnh 1–3 câu truy vấn. Vòng lặp truy vấn theo số em là chạm trần 50.
//   2. Gói đề và gói phiếu nằm ở R2, D1 chỉ giữ khoá và phần tra cứu.
//   3. Lệnh của HỌC SINH không đòi mã bí mật; lệnh của THẦY thì đòi. Bảng
//      `LENH_CUA_THAY` dưới đây là nơi duy nhất quyết định điều đó.
import type { Env } from './kieu'

export const NAY = (): string => new Date().toISOString()

export function chuoi(v: unknown): string {
  return v === null || v === undefined ? '' : String(v)
}

export function soHoacNull(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function doJson(v: unknown): unknown {
  if (typeof v !== 'string' || v === '') return null
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

/** Đọc một khoá cấu hình (thay Script property). */
export async function layCauHinh(env: Env, khoa: string): Promise<unknown> {
  const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(khoa).first<{ gia_tri: string }>()
  return doJson(r?.gia_tri)
}

export async function ghiCauHinh(env: Env, khoa: string, gia: unknown): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?)
     ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc`,
  )
    .bind(khoa, JSON.stringify(gia ?? null), NAY())
    .run()
}

// ===========================================================================
// HỒ SƠ EM — chuyên đề mạnh/yếu + lịch sử ca, tổng hợp sẵn bằng 3 câu.
//
// Apps Script đọc hai sheet TienDoHS/TienDoCa. Ở đây `tien_do_hs` đã được
// `/cham-diem` dựng lại mỗi lần chấm, nên chỉ việc đọc.
// ===========================================================================

export async function hoSoEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }

  const em = await env.DB.prepare(
    `SELECT d.sbd, d.ho_ten, d.nam_sinh, d.lop FROM danh_sach d WHERE d.sbd = ?`,
  )
    .bind(sbd)
    .first<Record<string, unknown>>()

  const rCd = await env.DB.prepare('SELECT chuyen_de, so_cau, so_sai FROM tien_do_hs WHERE sbd = ? ORDER BY chuyen_de')
    .bind(sbd)
    .all<Record<string, unknown>>()

  // Lịch sử ca: một câu, nối sang `ca` để lấy tên ca. Không đọc điểm cả lớp ở
  // đây — hạng và sĩ số do máy thầy tính, đúng như đường cũ.
  const rCa = await env.DB.prepare(
    `SELECT l.ma_ca, l.lan_thu, l.nop_luc, l.trang_thai, l.diem_i, l.diem_ii, l.diem_iii, l.tong,
            l.so_lan_roi_man, c.ten_ca, c.lop
       FROM luot l LEFT JOIN ca c ON c.ma_ca = l.ma_ca
      WHERE l.sbd = ? ORDER BY l.nop_luc DESC LIMIT 200`,
  )
    .bind(sbd)
    .all<Record<string, unknown>>()

  const ca = (rCa.results ?? []).map((x) => ({
    maCa: chuoi(x.ma_ca),
    tenCa: chuoi(x.ten_ca),
    lop: chuoi(x.lop),
    lanThu: Number(x.lan_thu) || 1,
    nopLuc: chuoi(x.nop_luc),
    trangThai: chuoi(x.trang_thai),
    diemI: soHoacNull(x.diem_i),
    diemII: soHoacNull(x.diem_ii),
    diemIII: soHoacNull(x.diem_iii),
    tong: soHoacNull(x.tong),
    hang: null,
    siSo: null,
    soLanRoiMan: Number(x.so_lan_roi_man) || 0,
  }))

  // CA GẦN NHẤT ĐÃ CHẤM — phiếu gửi phụ huynh dùng số của riêng ca này.
  const caGanNhat = ca.find((c) => c.tong !== null) ?? null

  let chuyenDeCaGanNhat: { ten: string; soCau: number; soSai: number }[] = []
  let soCauSaiCaGanNhat = 0
  if (caGanNhat) {
    const rG = await env.DB.prepare('SELECT chuyen_de, so_cau, so_sai FROM tien_do_ca WHERE ma_ca = ? AND sbd = ? ORDER BY chuyen_de')
      .bind(caGanNhat.maCa, sbd)
      .all<Record<string, unknown>>()
    chuyenDeCaGanNhat = (rG.results ?? []).map((x) => ({
      ten: chuoi(x.chuyen_de),
      soCau: Number(x.so_cau) || 0,
      soSai: Number(x.so_sai) || 0,
    }))
    soCauSaiCaGanNhat = chuyenDeCaGanNhat.reduce((t, x) => t + x.soSai, 0)
  }

  return {
    ok: true,
    em: {
      sbd,
      hoTen: chuoi(em?.ho_ten),
      namSinh: chuoi(em?.nam_sinh),
      lop: chuoi(em?.lop),
    },
    chuyenDe: (rCd.results ?? []).map((x) => {
      const soCau = Number(x.so_cau) || 0
      const soSai = Number(x.so_sai) || 0
      return {
        ten: chuoi(x.chuyen_de),
        soCau,
        soSai,
        tiLeSai: soCau > 0 ? soSai / soCau : 0,
        // Xu hướng đòi chuỗi thời gian từng ca; bảng cộng dồn không nói được
        // điều đó, nên khai đúng 'chua_du' thay vì bịa ra một chiều mũi tên.
        xuHuong: 'chua_du',
      }
    }),
    ca,
    caGanNhat,
    chuyenDeCaGanNhat,
    soCauSaiCaGanNhat,
  }
}

export async function hoSoNhieuEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ds = Array.isArray(b.sbd) ? (b.sbd as unknown[]).map((x) => chuoi(x).trim()).filter(Boolean) : []
  const items: unknown[] = []
  // TRẦN 50 CÂU MỘT LƯỢT GỌI: mỗi em tốn 3–4 câu, nên cắt ở 12 em một lượt và
  // để máy thầy gọi nhiều lượt. Thà chậm hơn là lượt gọi chết giữa chừng.
  for (const sbd of ds.slice(0, 12)) {
    const r = await hoSoEm(env, { sbd })
    if (r.ok) items.push(r)
  }
  return { ok: true, items, conLai: Math.max(0, ds.length - 12) }
}

// ===========================================================================
// TIN NHẮN
// ===========================================================================

export async function guiTin(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const noiDung = chuoi(b.noiDung).trim()
  if (!noiDung) return { ok: false, error: 'Tin nhắn rỗng' }
  const tu = chuoi(b.sbd).trim() || chuoi(b.sdt).trim()
  const vai = chuoi(b.nguoiGui) === 'hocsinh' ? 'hs' : 'ph'
  await env.DB.prepare('INSERT INTO tin_nhan (tu, den, vai, noi_dung, da_doc, gui_luc) VALUES (?, ?, ?, ?, 0, ?)')
    .bind(tu, 'thay', vai, noiDung, NAY())
    .run()
  return { ok: true }
}

export async function guiTinCuaThay(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  const noiDung = chuoi(b.noiDung).trim()
  if (!sbd || !noiDung) return { ok: false, error: 'Thiếu số báo danh hoặc nội dung' }
  await env.DB.prepare('INSERT INTO tin_nhan (tu, den, vai, noi_dung, da_doc, gui_luc) VALUES (?, ?, ?, ?, 0, ?)')
    .bind('thay', sbd, 'hs', noiDung, NAY())
    .run()
  return { ok: true }
}

export async function hopThu(env: Env): Promise<Record<string, unknown>> {
  const r = await env.DB.prepare(
    `SELECT t.id, t.tu, t.vai, t.noi_dung, t.da_doc, t.gui_luc,
            COALESCE(d.ho_ten,'') AS ho_ten, COALESCE(d.lop,'') AS lop
       FROM tin_nhan t LEFT JOIN danh_sach d ON d.sbd = t.tu
      WHERE t.den = 'thay' ORDER BY t.gui_luc DESC LIMIT 300`,
  ).all<Record<string, unknown>>()
  return {
    ok: true,
    items: (r.results ?? []).map((x) => ({
      id: chuoi(x.id),
      sdt: '',
      hoTenPhuHuynh: chuoi(x.vai) === 'ph' ? chuoi(x.ho_ten) : '',
      sbd: chuoi(x.tu),
      lop: chuoi(x.lop),
      hoTenHocSinh: chuoi(x.ho_ten),
      noiDung: chuoi(x.noi_dung),
      thoiGian: chuoi(x.gui_luc),
      daDoc: Number(x.da_doc) === 1,
      nguoiGui: chuoi(x.vai) === 'ph' ? 'phuhuynh' : 'hocsinh',
    })),
  }
}

export async function demTinMoi(env: Env): Promise<Record<string, unknown>> {
  const r = await env.DB.prepare(
    `SELECT COUNT(*) AS tong, SUM(CASE WHEN da_doc = 0 THEN 1 ELSE 0 END) AS chua FROM tin_nhan WHERE den = 'thay'`,
  ).first<{ tong: number; chua: number }>()
  return { ok: true, tong: Number(r?.tong) || 0, soChuaDoc: Number(r?.chua) || 0 }
}

export async function danhDauDaDoc(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ids = Array.isArray(b.ids) ? (b.ids as unknown[]).map((x) => chuoi(x).trim()).filter(Boolean) : []
  if (ids.length === 0) return { ok: true, soDong: 0 }
  // MỘT CÂU cho cả danh sách — vòng lặp UPDATE theo từng id là đường chạm trần.
  const cho = ids.map(() => '?').join(',')
  const r = await env.DB.prepare(`UPDATE tin_nhan SET da_doc = 1 WHERE id IN (${cho})`).bind(...ids).run()
  return { ok: true, soDong: r.meta.changes ?? 0 }
}

// ===========================================================================
// HỎI BÀI THẦY
// ===========================================================================

export async function guiCauHoi(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  const maCa = chuoi(b.maCa).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  // Máy em gửi `qids` (mảng mã câu em tick) + `ghiChu`. Giữ NGUYÊN thứ tự em
  // tick — thứ tự ấy là thứ tự em muốn hỏi.
  const qids = Array.isArray(b.qids) ? (b.qids as unknown[]).map((x) => chuoi(x).trim()).filter(Boolean) : []
  const ghiChu = chuoi(b.ghiChu).trim()
  if (qids.length === 0 && !ghiChu) return { ok: false, error: 'Không có câu hỏi nào' }

  // MỘT LƯỢT GỬI = MỘT MỐC THỜI GIAN, dùng chung cho mọi dòng. Nhờ vậy chỗ đọc
  // gom lại được đúng một lượt bấm gửi của em.
  const nay = NAY()
  const lenh = qids.map((q) =>
    env.DB.prepare('INSERT INTO cau_hoi_em (sbd, ma_ca, qid, noi_dung, da_chua, da_xoa, luc) VALUES (?, ?, ?, ?, 0, 0, ?)').bind(sbd, maCa, q, '', nay),
  )
  if (ghiChu) {
    lenh.push(
      env.DB.prepare('INSERT INTO cau_hoi_em (sbd, ma_ca, qid, noi_dung, da_chua, da_xoa, luc) VALUES (?, ?, ?, ?, 0, 0, ?)').bind(sbd, maCa, '', ghiChu, nay),
    )
  }
  for (let i = 0; i < lenh.length; i += 40) await env.DB.batch(lenh.slice(i, i + 40))
  return { ok: true, soCau: qids.length, guiLuc: nay }
}

export async function danhSachCauHoi(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const thungRac = b.thungRac === true
  const dk = maCa ? 'q.ma_ca = ? AND q.da_xoa = ?' : 'q.da_xoa = ?'
  const tham = maCa ? [maCa, thungRac ? 1 : 0] : [thungRac ? 1 : 0]
  const r = await env.DB.prepare(
    `SELECT q.*, COALESCE(d.ho_ten,'') AS ho_ten, COALESCE(c.ten_ca,'') AS ten_ca
       FROM cau_hoi_em q
       LEFT JOIN danh_sach d ON d.sbd = q.sbd
       LEFT JOIN ca c ON c.ma_ca = q.ma_ca
      WHERE ${dk} ORDER BY q.luc DESC LIMIT 500`,
  )
    .bind(...tham)
    .all<Record<string, unknown>>()

  // GOM THEO (ca, em, lúc gửi): màn "Học sinh hỏi" đọc MỘT dòng cho một lượt
  // em bấm gửi, kèm danh sách mã câu — không phải mỗi câu một dòng.
  const theo = new Map<string, Record<string, unknown>>()
  for (const x of r.results ?? []) {
    const khoa = `${chuoi(x.ma_ca)}|${chuoi(x.sbd)}|${chuoi(x.luc)}`
    let d = theo.get(khoa)
    if (!d) {
      d = {
        maCa: chuoi(x.ma_ca),
        tenCa: chuoi(x.ten_ca),
        sbd: chuoi(x.sbd),
        hoTen: chuoi(x.ho_ten),
        qids: [] as string[],
        ghiChu: '',
        guiLuc: chuoi(x.luc),
        daChua: Number(x.da_chua) === 1,
        chuaLuc: '',
        xoa: Number(x.da_xoa) === 1 ? chuoi(x.luc) : '',
      }
      theo.set(khoa, d)
    }
    const qid = chuoi(x.qid)
    if (qid) (d.qids as string[]).push(qid)
    // Ghi chú của em: nối các dòng có nội dung, KHÔNG cắt bớt.
    const noi = chuoi(x.noi_dung).trim()
    if (noi) d.ghiChu = d.ghiChu ? `${d.ghiChu}\n${noi}` : noi
  }
  return { ok: true, items: [...theo.values()] }
}

export async function xoaCauHoi(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const khoiPhuc = b.khoiPhuc === true
  const tatCa = b.tatCa === true
  const dat = khoiPhuc ? 0 : 1
  const nguoc = khoiPhuc ? 1 : 0
  const r = tatCa
    ? await env.DB.prepare('UPDATE cau_hoi_em SET da_xoa = ? WHERE da_xoa = ?').bind(dat, nguoc).run()
    : await env.DB.prepare('UPDATE cau_hoi_em SET da_xoa = ? WHERE ma_ca = ? AND da_xoa = ?').bind(dat, maCa, nguoc).run()
  return { ok: true, soDong: r.meta.changes ?? 0, soCa: tatCa ? 0 : 1 }
}

export async function danhDauDaChua(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const sbd = chuoi(b.sbd).trim()
  const chua = b.chua === false ? 0 : 1
  const r = sbd
    ? await env.DB.prepare('UPDATE cau_hoi_em SET da_chua = ? WHERE ma_ca = ? AND sbd = ?').bind(chua, maCa, sbd).run()
    : await env.DB.prepare('UPDATE cau_hoi_em SET da_chua = ? WHERE ma_ca = ?').bind(chua, maCa).run()
  return { ok: true, soDong: r.meta.changes ?? 0 }
}

// ===========================================================================
// SỔ PHIẾU — nội dung ở R2, tra cứu ở D1.
// ===========================================================================

export async function luuPhieu(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ma = chuoi(b.ma).trim()
  if (!ma) return { ok: false, error: 'Thiếu mã phiếu' }
  if (!env.DE) return { ok: false, error: 'Chưa nối R2 — chưa lưu phiếu được' }
  const nay = NAY()
  const goi = {
    ma,
    maCa: chuoi(b.maCa),
    sbd: chuoi(b.sbd),
    hoTen: chuoi(b.hoTen),
    loai: chuoi(b.loai) || 'ketqua',
    phieu: b.phieu ?? null,
    ghiLuc: nay,
  }
  await env.DE.put(`phieu/${ma}.json`, JSON.stringify(goi))
  await env.DB.prepare(
    `INSERT INTO phieu (ma, ma_ca, sbd, ho_ten, loai, so_lan_xem, thu_hoi, luu_luc)
     VALUES (?, ?, ?, ?, ?, 0, 0, ?)
     ON CONFLICT(ma) DO UPDATE SET ma_ca = excluded.ma_ca, sbd = excluded.sbd,
       ho_ten = excluded.ho_ten, loai = excluded.loai, thu_hoi = 0, luu_luc = excluded.luu_luc`,
  )
    .bind(ma, goi.maCa, goi.sbd, goi.hoTen, goi.loai, nay)
    .run()
  return { ok: true }
}

export async function luuNhieuPhieu(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const items = Array.isArray(b.items) ? (b.items as Record<string, unknown>[]) : []
  const daLuu: { sbd: string; ma: string }[] = []
  const loi: { sbd: string; vi_sao: string }[] = []
  for (const it of items) {
    const r = await luuPhieu(env, it)
    if (r.ok) daLuu.push({ sbd: chuoi(it.sbd), ma: chuoi(it.ma) })
    else loi.push({ sbd: chuoi(it.sbd), vi_sao: chuoi(r.error) })
  }
  return { ok: true, daLuu, loi }
}

/** ĐỌC PHIẾU — lệnh CÔNG KHAI duy nhất trả nội dung. Đếm lượt mở để thầy biết
 * phụ huynh đã xem hay chưa; đếm hỏng thì vẫn trả phiếu. */
export async function layPhieu(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ma = chuoi(b.ma).trim()
  if (!ma) return { ok: false, error: 'Thiếu mã phiếu' }
  if (!env.DE) return { ok: false, error: 'Không tìm thấy phiếu' }
  const o = await env.DE.get(`phieu/${ma}.json`)
  if (!o) return { ok: false, error: 'Không tìm thấy phiếu' }
  let goi: Record<string, unknown> | null = null
  try {
    goi = (await new Response(o.body).json()) as Record<string, unknown>
  } catch {
    goi = null
  }
  if (!goi || goi.thuHoi === true || goi.phieu === null) return { ok: false, error: 'Không tìm thấy phiếu' }
  await env.DB.prepare('UPDATE phieu SET so_lan_xem = so_lan_xem + 1 WHERE ma = ?').bind(ma).run().catch(() => {})
  return { ok: true, phieu: goi.phieu }
}

export async function xoaPhieu(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ma = chuoi(b.ma).trim()
  if (!ma) return { ok: false, error: 'Thiếu mã phiếu' }
  if (env.DE) await env.DE.put(`phieu/${ma}.json`, JSON.stringify({ ma, thuHoi: true, phieu: null, ghiLuc: NAY() }))
  await env.DB.prepare('UPDATE phieu SET thu_hoi = 1 WHERE ma = ?').bind(ma).run()
  return { ok: true }
}

export async function phieuTheoCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const r = await env.DB.prepare('SELECT * FROM phieu WHERE ma_ca = ? AND thu_hoi = 0 ORDER BY luu_luc DESC')
    .bind(maCa)
    .all<Record<string, unknown>>()
  return {
    ok: true,
    items: (r.results ?? []).map((x) => ({
      ma: chuoi(x.ma),
      maCa: chuoi(x.ma_ca),
      sbd: chuoi(x.sbd),
      hoTen: chuoi(x.ho_ten),
      loai: chuoi(x.loai) === 'baitap' ? 'baitap' : 'ketqua',
      soLanXem: Number(x.so_lan_xem) || 0,
      luuLuc: chuoi(x.luu_luc),
    })),
  }
}

/** MÃ PHIẾU CỦA CHÍNH EM trong một ca — cho link `/d/<mã ca>`. Không trả nội
 * dung phiếu, chỉ trả mã; máy em mở tiếp bằng `layPhieu` công khai. */
export async function phieuCuaEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const sbd = chuoi(b.sbd).trim()
  if (!maCa || !sbd) return { ok: false, error: 'Thiếu mã ca hoặc số báo danh' }

  const l = await env.DB.prepare(
    `SELECT l.*, COALESCE(NULLIF(l.ho_ten,''), d.ho_ten, '') AS ten_hien, COALESCE(c.lop, d.lop, '') AS lop_hien,
            COALESCE(c.ten_ca,'') AS ten_ca, c.thoi_gian_phut, c.giu_de_doc
       FROM luot l
       LEFT JOIN danh_sach d ON d.sbd = l.sbd
       LEFT JOIN ca c ON c.ma_ca = l.ma_ca
      WHERE l.ma_ca = ? AND l.sbd = ? ORDER BY l.lan_thu DESC LIMIT 1`,
  )
    .bind(maCa, sbd)
    .first<Record<string, unknown>>()
  if (!l) return { ok: false, error: 'Em chưa nộp bài ca này' }

  const rPhieu = await env.DB.prepare('SELECT ma, loai FROM phieu WHERE ma_ca = ? AND sbd = ? AND thu_hoi = 0 ORDER BY luu_luc DESC')
    .bind(maCa, sbd)
    .all<Record<string, unknown>>()
  const ds = rPhieu.results ?? []

  // NGÂN HÀNG CÓ ĐÁP ÁN — chỉ trả khi em ĐÃ NỘP. Đây là đường CÔNG KHAI (máy em
  // không có mã bí mật), nên cổng duy nhất là lượt thi có thật của chính em đã
  // nộp xong. Chưa nộp mà trả đáp án là phát đáp án giữa giờ.
  let bank: unknown = null
  const daNop = chuoi(l.trang_thai) === 'da_nop' || chuoi(l.trang_thai) === 'khoa' || chuoi(l.nop_luc) !== ''
  if (daNop && env.DE) {
    const o = await env.DE.get(`key/${maCa}.json`)
    if (o?.body) {
      try {
        bank = await new Response(o.body).json()
      } catch {
        bank = null
      }
    }
  }

  return {
    ok: true,
    ma: chuoi(ds.find((x) => chuoi(x.loai) !== 'baitap')?.ma),
    maBaiTap: chuoi(ds.find((x) => chuoi(x.loai) === 'baitap')?.ma),
    tong: soHoacNull(l.tong),
    hoTen: chuoi(l.ten_hien),
    lop: chuoi(l.lop_hien),
    tenCa: chuoi(l.ten_ca),
    thoiGianPhut: Number(l.thoi_gian_phut) || 0,
    giuDeDoc: Number(l.giu_de_doc ?? 0) === 1,
    luot: {
      lanThu: Number(l.lan_thu) || 1,
      vaoLuc: chuoi(l.vao_luc),
      nopLuc: chuoi(l.nop_luc),
      trangThai: chuoi(l.trang_thai),
      dapAn: doJson(l.dap_an_json),
      giayCau: doJson(l.giay_cau_json),
      integrity: doJson(l.integrity_json),
      soLanRoiMan: Number(l.so_lan_roi_man) || 0,
      tongGiayRoiMan: Number(l.tong_giay_roi_man) || 0,
    },
    bank,
  }
}

/** LỊCH SỬ CA CỦA EM — máy em xem lại điểm cũ. Không kèm mã bí mật, nên chỉ
 * trả đúng những gì em đã biết: ca của chính em. */
export async function lichSuEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  const r = await env.DB.prepare(
    `SELECT l.ma_ca, l.tong, l.nop_luc, COALESCE(c.ten_ca,'') AS ten_ca
       FROM luot l LEFT JOIN ca c ON c.ma_ca = l.ma_ca
      WHERE l.sbd = ? AND l.tong IS NOT NULL ORDER BY l.nop_luc DESC LIMIT 50`,
  )
    .bind(sbd)
    .all<Record<string, unknown>>()
  return {
    ok: true,
    items: (r.results ?? []).map((x) => ({
      maCa: chuoi(x.ma_ca),
      tenCa: chuoi(x.ten_ca),
      ngay: chuoi(x.nop_luc),
      tong: Number(x.tong) || 0,
    })),
  }
}

/** BÀI TẬP CỦA EM — phiếu loại `baitap` đã phát cho em. */
export async function baiTapCuaEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  const r = await env.DB.prepare(
    `SELECT p.ma, p.ma_ca, p.luu_luc, p.so_lan_xem, COALESCE(c.ten_ca,'') AS ten_ca
       FROM phieu p LEFT JOIN ca c ON c.ma_ca = p.ma_ca
      WHERE p.sbd = ? AND p.loai = 'baitap' AND p.thu_hoi = 0 ORDER BY p.luu_luc DESC LIMIT 50`,
  )
    .bind(sbd)
    .all<Record<string, unknown>>()
  return {
    ok: true,
    items: (r.results ?? []).map((x) => ({
      ma: chuoi(x.ma),
      maCa: chuoi(x.ma_ca),
      tenCa: chuoi(x.ten_ca),
      ngay: chuoi(x.luu_luc),
      soLanXem: Number(x.so_lan_xem) || 0,
    })),
  }
}

// ===========================================================================
// NỘP PHIẾU KHẮC PHỤC — máy chủ TỰ CHẤM, không tin con số máy em gửi lên.
// ===========================================================================

/** CHẤM VÀ GHI MỘT LƯỢT NỘP BÀI TẬP VỀ NHÀ.
 *
 * ĐÁP ÁN LẤY TỪ KHO, không lấy từ gói máy em gửi lên — máy em cầm bản đã xoá
 * đáp án. Đọc đúng những tờ đề của lượt giao ấy, lọc đúng phần thầy đã tick.
 *
 * QUÁ HẠN THÌ TỪ CHỐI Ở ĐÂY, không chỉ ẩn nút bên máy em: giờ máy em chỉnh được. */
async function nopBtvnQuaPhieu(
  env: Env,
  bt: Record<string, unknown>,
  sbd: string,
  lam: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const maBtvn = chuoi(bt.ma_btvn)
  const han = chuoi(bt.han_nop)
  const hanMs = han ? Date.parse(han) : NaN
  if (Number.isFinite(hanMs) && Date.now() > hanMs) {
    return { ok: false, lyDo: 'qua_han', error: 'Bạn đã quá hạn nộp BTVN' }
  }

  const dapAnDung: Record<string, string> = {}
  if (env.DE) {
    const daDoc = new Map<string, Record<string, unknown>[]>()
    for (const m of chuoi(bt.ma_de).split(',').map((x) => x.trim()).filter(Boolean)) {
      const { goc, phan } = goPhanMa(m)
      if (!daDoc.has(goc)) {
        const o = await env.DE.get(`kho/${goc}.json`)
        if (!o?.body) {
          daDoc.set(goc, [])
        } else {
          try {
            const g = (await new Response(o.body).json()) as Record<string, unknown>
            daDoc.set(goc, Array.isArray(g.cau) ? (g.cau as Record<string, unknown>[]) : [])
          } catch {
            daDoc.set(goc, [])
          }
        }
      }
      const cau = daDoc.get(goc) ?? []
      for (const c of phan ? cau.filter((x) => chuoi(x.phan) === phan) : cau) {
        const qid = `${goc}-${chuoi(c.phan)}-${chuoi(c.so)}`
        const da = c.dap_an ?? c.dapAn
        // Phần II có đáp án dạng đối tượng {a,b,c,d}; ép về chuỗi "DSDS" đúng
        // như máy em chấm, không đoán kiểu khác.
        dapAnDung[qid] = (typeof da === 'object' && da !== null
          ? ['a', 'b', 'c', 'd'].map((k) => chuoi((da as Record<string, unknown>)[k])).join('')
          : chuoi(da)
        )
          .trim()
          .toUpperCase()
      }
    }
  }

  const qidSai: string[] = []
  let soDung = 0
  let soCau = 0
  for (const [qid, dung] of Object.entries(dapAnDung)) {
    if (!dung) continue
    soCau++
    const chon = chuoi(lam[qid]).trim().toUpperCase()
    if (chon && chon === dung) soDung++
    else qidSai.push(qid)
  }

  const nay = NAY()
  const khoa = `${maBtvn}|${sbd}`
  const r = await env.DB.prepare(
    `UPDATE btvn_em SET nop_luc = ?, so_dung = ?, so_cau = ?, dap_an_json = ? WHERE khoa = ? AND nop_luc IS NULL`,
  )
    .bind(nay, soDung, soCau, JSON.stringify(lam), khoa)
    .run()
  if ((r.meta.changes ?? 0) === 0) {
    const da = await env.DB.prepare('SELECT nop_luc, so_dung, so_cau FROM btvn_em WHERE khoa = ?').bind(khoa).first<Record<string, unknown>>()
    // NỘP RỒI THÌ KHÔNG GHI ĐÈ. Trả lại đúng kết quả lần nộp đầu, và nói rõ là
    // đã nhận — báo lỗi lúc này là em tưởng mất bài rồi bấm nộp lại mãi.
    if (da?.nop_luc) {
      return { ok: true, daNhan: true, nopLuc: chuoi(da.nop_luc), soDung: Number(da.so_dung) || 0, soCau: Number(da.so_cau) || 0, qidSai: [], lanThu: 1 }
    }
    return { ok: false, lyDo: 'khong_duoc_giao', error: 'Em không có bài tập của lượt này' }
  }
  return { ok: true, lanThu: 1, soCau, soDung, qidSai, nopLuc: nay }
}

/** Gỡ hậu tố phần khỏi mã đề — bản dùng trong tệp này (xem `goPhanKhoiMaDe`
 * bên `index.ts`; hai nơi phải cùng một bảng hậu tố). */
function goPhanMa(ma: string): { goc: string; phan: 'I' | 'II' | 'III' | null } {
  const bang: [string, 'I' | 'II' | 'III'][] = [
    ['-TN', 'I'],
    ['-DS', 'II'],
    ['-TLN', 'III'],
  ]
  for (const [duoi, phan] of bang) {
    if (ma.endsWith(duoi)) return { goc: ma.slice(0, -duoi.length), phan }
  }
  return { goc: ma, phan: null }
}

export async function nopKhacPhuc(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ma = chuoi(b.ma).trim()
  const sbd = chuoi(b.sbd).trim()
  if (!ma || !sbd) return { ok: false, error: 'Thiếu mã phiếu hoặc số báo danh' }
  const lam = (b.dapAn ?? {}) as Record<string, unknown>

  // BÀI TẬP VỀ NHÀ ĐI CHUNG CỬA NÀY.
  //
  // Phiếu bài tập về nhà dựng bằng CHÍNH bộ phiếu khắc phục (thầy chốt 12/09:
  // "nộp được chọn đáp án được theo chuẩn của html rút câu hỏi khắc phục"), nên
  // nút Nộp của nó bắn ra đúng lệnh này với `ma` là MÃ LƯỢT GIAO. Viết một cửa
  // nộp thứ hai chỉ để đổi tên trường là hai chỗ phải sửa mỗi lần đổi luật.
  const bt = await env.DB.prepare('SELECT ma_btvn, ma_ca, ma_de, han_nop FROM btvn WHERE ma_btvn = ? AND da_xoa = 0')
    .bind(ma)
    .first<Record<string, unknown>>()
  if (bt) return nopBtvnQuaPhieu(env, bt, sbd, lam)

  // ĐÁP ÁN LẤY TỪ GÓI PHIẾU trên R2 — không lấy từ gói máy em gửi lên.
  let dapAnDung: Record<string, string> = {}
  let maCa = ''
  if (env.DE) {
    const o = await env.DE.get(`phieu/${ma}.json`)
    if (o) {
      try {
        const goi = (await new Response(o.body).json()) as Record<string, unknown>
        maCa = chuoi(goi.maCa)
        const ph = (goi.phieu ?? {}) as Record<string, unknown>
        const cau = Array.isArray(ph.cau) ? (ph.cau as Record<string, unknown>[]) : []
        for (const c of cau) {
          const qid = chuoi(c.id)
          if (qid) dapAnDung[qid] = chuoi(c.dapAn).trim().toUpperCase()
        }
      } catch {
        dapAnDung = {}
      }
    }
  }

  const qidSai: string[] = []
  let soDung = 0
  let soCau = 0
  for (const [qid, dung] of Object.entries(dapAnDung)) {
    if (!dung) continue
    soCau++
    const chon = chuoi(lam[qid]).trim().toUpperCase()
    if (chon && chon === dung) soDung++
    else qidSai.push(qid)
  }

  const nay = NAY()
  const khoa = `${ma}|${sbd}`
  const cu = await env.DB.prepare('SELECT so_cau FROM nop_khac_phuc WHERE khoa = ?').bind(khoa).first<{ so_cau: number }>()
  await env.DB.prepare(
    `INSERT INTO nop_khac_phuc (khoa, ma_phieu, sbd, ma_ca, dap_an_json, so_dung, so_cau, nop_luc)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(khoa) DO UPDATE SET dap_an_json = excluded.dap_an_json, so_dung = excluded.so_dung,
       so_cau = excluded.so_cau, nop_luc = excluded.nop_luc`,
  )
    .bind(khoa, ma, sbd, maCa, JSON.stringify(lam), soDung, soCau, nay)
    .run()
  return { ok: true, lanThu: cu ? 2 : 1, soCau, soDung, qidSai, nopLuc: nay }
}

export async function nopKhacPhucTheoCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const r = await env.DB.prepare('SELECT * FROM nop_khac_phuc WHERE ma_ca = ? ORDER BY nop_luc DESC LIMIT 300')
    .bind(maCa)
    .all<Record<string, unknown>>()
  return {
    ok: true,
    items: (r.results ?? []).map((x) => ({
      ma: chuoi(x.ma_phieu),
      sbd: chuoi(x.sbd),
      lanThu: 1,
      nopLuc: chuoi(x.nop_luc),
      soCau: Number(x.so_cau) || 0,
      soDung: Number(x.so_dung) || 0,
      qidSai: [],
    })),
  }
}

// ===========================================================================
// YÊU CẦU GIAO BÀI · ĐĂNG KÝ HỌC SINH · DANH SÁCH LỚP
// ===========================================================================

export async function danhSachYeuCau(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const tatCa = b.tatCa === true
  const r = tatCa
    ? await env.DB.prepare(
        `SELECT y.*, COALESCE(d.ho_ten,'') AS ho_ten FROM yeu_cau_giao_bai y LEFT JOIN danh_sach d ON d.sbd = y.sbd
          ORDER BY y.luc DESC LIMIT 300`,
      ).all<Record<string, unknown>>()
    : await env.DB.prepare(
        `SELECT y.*, COALESCE(d.ho_ten,'') AS ho_ten FROM yeu_cau_giao_bai y LEFT JOIN danh_sach d ON d.sbd = y.sbd
          WHERE y.trang_thai = 'cho' ORDER BY y.luc DESC LIMIT 300`,
      ).all<Record<string, unknown>>()
  return {
    ok: true,
    items: (r.results ?? []).map((x) => ({
      id: chuoi(x.id),
      sbd: chuoi(x.sbd),
      hoTen: chuoi(x.ho_ten),
      maCa: chuoi(x.ma_ca),
      trangThai: chuoi(x.trang_thai),
      luc: chuoi(x.luc),
    })),
  }
}

export async function danhDauYeuCau(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const id = chuoi(b.id).trim()
  if (!id) return { ok: false, error: 'Thiếu mã yêu cầu' }
  const tt = chuoi(b.trangThai) === 'huy' ? 'tu_choi' : 'dong_y'
  await env.DB.prepare('UPDATE yeu_cau_giao_bai SET trang_thai = ?, ma_ca = COALESCE(NULLIF(?,\'\'), ma_ca) WHERE id = ?')
    .bind(tt, chuoi(b.maCa), id)
    .run()
  return { ok: true }
}

export async function xinGiaoBai(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  await env.DB.prepare('INSERT INTO yeu_cau_giao_bai (sbd, ma_ca, trang_thai, luc) VALUES (?, ?, \'cho\', ?)')
    .bind(sbd, chuoi(b.maCa), NAY())
    .run()
  return { ok: true }
}

export async function themEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  const hoTen = chuoi(b.hoTen).trim()
  const namSinh = chuoi(b.namSinh).trim()
  const lop = chuoi(b.lop).trim()
  const nay = NAY()
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(sbd) DO UPDATE SET ho_ten = excluded.ho_ten, nam_sinh = excluded.nam_sinh,
         lop = COALESCE(NULLIF(excluded.lop,''), danh_sach.lop), cap_nhat_luc = excluded.cap_nhat_luc`,
    ).bind(sbd, hoTen, namSinh, lop, nay),
    env.DB.prepare(
      `INSERT INTO hoc_sinh (sbd, ho_ten, nam_sinh, lop, trang_thai, tao_luc, cap_nhat_luc)
       VALUES (?, ?, ?, ?, 'da_duyet', ?, ?)
       ON CONFLICT(sbd) DO UPDATE SET ho_ten = excluded.ho_ten, nam_sinh = excluded.nam_sinh,
         lop = COALESCE(NULLIF(excluded.lop,''), hoc_sinh.lop), cap_nhat_luc = excluded.cap_nhat_luc`,
    ).bind(sbd, hoTen, namSinh, lop, nay, nay),
  ])
  return { ok: true, sbd, hoTen, namSinh, lop, tenSheet: '' }
}

export async function xoaEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  // XOÁ ĐĂNG KÝ, KHÔNG XOÁ BÀI. Bảng `luot` giữ nguyên: bài em đã làm là dữ
  // liệu của thầy, không phải của hồ sơ đăng ký.
  await env.DB.prepare('DELETE FROM hoc_sinh WHERE sbd = ?').bind(sbd).run()
  return { ok: true }
}

export async function dsEmDangKy(env: Env): Promise<Record<string, unknown>> {
  const r = await env.DB.prepare('SELECT * FROM hoc_sinh ORDER BY cap_nhat_luc DESC LIMIT 500').all<Record<string, unknown>>()
  return {
    ok: true,
    items: (r.results ?? []).map((x) => ({
      sbd: chuoi(x.sbd),
      hoTen: chuoi(x.ho_ten),
      namSinh: chuoi(x.nam_sinh),
      lop: chuoi(x.lop),
      dangKyLuc: chuoi(x.tao_luc),
      trangThai: chuoi(x.trang_thai),
    })),
  }
}

// ===========================================================================
// LỆNH CA CỦA THẦY — khoá · mở · xoá · khôi phục · đổi tên · đồng bộ tên.
//
// Bên Apps Script mấy lệnh này sửa ô trên Sheet. Ở đây chúng sửa đúng một dòng
// `ca`, và khoá ca thì NỘP HỘ mọi em còn đang làm — giữ đúng hành vi cũ, vì
// thầy đã quen: bấm Khoá là cả lớp dừng bút.
// ===========================================================================

export async function khoaCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  const nay = NAY()
  const r = await env.DB.batch([
    env.DB.prepare("UPDATE luot SET trang_thai = 'da_nop', nop_luc = COALESCE(NULLIF(nop_luc,''), ?), cap_nhat_luc = ? WHERE ma_ca = ? AND trang_thai = 'dang_lam'").bind(nay, nay, maCa),
    env.DB.prepare("UPDATE ca SET trang_thai = 'dong', cap_nhat_luc = ? WHERE ma_ca = ?").bind(nay, maCa),
  ])
  return { ok: true, soEmBiNop: r[0]?.meta?.changes ?? 0, khoaLuc: nay, trangThai: 'dong' }
}

export async function moKhoaCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  const ca = await env.DB.prepare('SELECT het_han_vao FROM ca WHERE ma_ca = ?').bind(maCa).first<{ het_han_vao: string }>()
  // GỠ HẠN VÀO PHÒNG khi hạn đã trôi qua: mở lại ca mà cửa vào vẫn đóng thì em
  // bấm vào vẫn bị chặn, và thầy tưởng lệnh mở không ăn.
  const hanCu = chuoi(ca?.het_han_vao)
  const daQua = hanCu !== '' && Date.parse(hanCu) > 0 && Date.now() > Date.parse(hanCu)
  const nay = NAY()
  await env.DB.prepare(
    daQua
      ? "UPDATE ca SET trang_thai = 'mo', het_han_vao = '', cap_nhat_luc = ? WHERE ma_ca = ?"
      : "UPDATE ca SET trang_thai = 'mo', cap_nhat_luc = ? WHERE ma_ca = ?",
  )
    .bind(nay, maCa)
    .run()
  return { ok: true, trangThai: 'mo', goHanVao: daQua }
}

export async function xoaCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const xacNhan = chuoi(b.xacNhan).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  // CHỐT XÁC NHẬN giữ nguyên từ đường cũ: thầy phải gõ lại mã ca.
  if (xacNhan !== maCa) return { ok: false, error: 'Mã xác nhận không khớp' }
  const nay = NAY()
  await env.DB.prepare("UPDATE ca SET trang_thai = 'da_xoa', xoa_luc = ?, cap_nhat_luc = ? WHERE ma_ca = ?").bind(nay, nay, maCa).run()
  return { ok: true }
}

export async function khoiPhucCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  const nay = NAY()
  await env.DB.prepare("UPDATE ca SET trang_thai = 'mo', xoa_luc = '', cap_nhat_luc = ? WHERE ma_ca = ?").bind(nay, maCa).run()
  return { ok: true }
}

export async function doiTenCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const tenCa = chuoi(b.tenCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  await env.DB.prepare('UPDATE ca SET ten_ca = ?, cap_nhat_luc = ? WHERE ma_ca = ?').bind(tenCa, NAY(), maCa).run()
  return { ok: true, tenCa }
}

/** ĐIỀN HỌ TÊN CÒN TRỐNG trong lượt của một ca, lấy từ danh sách lớp.
 * Một câu UPDATE, không vòng lặp theo em. */
export async function dongBoTenCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  const truoc = await env.DB.prepare(
    `SELECT l.sbd, COALESCE(NULLIF(l.ho_ten,''),'') AS ten_luot, COALESCE(d.ho_ten,'') AS ten_ds
       FROM luot l LEFT JOIN danh_sach d ON d.sbd = l.sbd WHERE l.ma_ca = ?`,
  )
    .bind(maCa)
    .all<Record<string, unknown>>()
  const ds = truoc.results ?? []
  const daDien = ds.filter((x) => chuoi(x.ten_luot) === '' && chuoi(x.ten_ds) !== '').map((x) => ({ sbd: chuoi(x.sbd), hoTen: chuoi(x.ten_ds) }))
  const khongCo = ds.filter((x) => chuoi(x.ten_luot) === '' && chuoi(x.ten_ds) === '').map((x) => chuoi(x.sbd))
  const giuNguyen = ds.filter((x) => chuoi(x.ten_luot) !== '').length
  if (daDien.length > 0) {
    await env.DB.prepare(
      `UPDATE luot SET ho_ten = (SELECT d.ho_ten FROM danh_sach d WHERE d.sbd = luot.sbd), cap_nhat_luc = ?
        WHERE ma_ca = ? AND (ho_ten IS NULL OR ho_ten = '')
          AND EXISTS (SELECT 1 FROM danh_sach d2 WHERE d2.sbd = luot.sbd AND d2.ho_ten <> '')`,
    )
      .bind(NAY(), maCa)
      .run()
  }
  const ca = await env.DB.prepare('SELECT ten_ca FROM ca WHERE ma_ca = ?').bind(maCa).first<{ ten_ca: string }>()
  return { ok: true, maCa, tenCa: chuoi(ca?.ten_ca), daDien, daSua: [], khongCo, giuNguyen }
}

/** MỞ KHOÁ MỘT EM — em bị khoá vì rời màn quá ngưỡng, thầy cho làm tiếp. */
export async function moKhoaEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const sbd = chuoi(b.sbd).trim()
  if (!maCa || !sbd) return { ok: false, error: 'Thiếu mã ca hoặc số báo danh' }
  const r = await env.DB.prepare(
    `UPDATE luot SET trang_thai = 'dang_lam', ghi_chu = ?, cap_nhat_luc = ?
      WHERE ma_ca = ? AND sbd = ? AND trang_thai = 'khoa'`,
  )
    .bind(`mở khoá bởi ${chuoi(b.nguoiMo) || 'thầy'}`, NAY(), maCa, sbd)
    .run()
  return { ok: true, soDong: r.meta.changes ?? 0 }
}

/** THẦY DUYỆT CHO THI LẠI — tạo lượt MỚI, không sửa lượt cũ. */
export async function duyetThiLai(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const sbd = chuoi(b.sbd).trim()
  if (!maCa || !sbd) return { ok: false, error: 'Thiếu mã ca hoặc số báo danh' }
  const cu = await env.DB.prepare('SELECT MAX(lan_thu) AS n FROM luot WHERE ma_ca = ? AND sbd = ?').bind(maCa, sbd).first<{ n: number }>()
  const lanThu = (Number(cu?.n) || 0) + 1
  const nay = NAY()
  await env.DB.prepare(
    `INSERT INTO luot (khoa, ma_ca, sbd, lan_thu, vao_luc, trang_thai, duyet_boi, duyet_luc, cap_nhat_luc)
     VALUES (?, ?, ?, ?, ?, 'duoc_duyet_lai', ?, ?, ?)
     ON CONFLICT(khoa) DO NOTHING`,
  )
    .bind(`${maCa}|${sbd}|${lanThu}`, maCa, sbd, lanThu, nay, chuoi(b.nguoiDuyet) || 'thầy', nay, nay)
    .run()
  return { ok: true, lanThu }
}

/** CHO THI LẠI TỪ ĐẦU — xoá hẳn lượt của em trong ca để em vào lại như mới. */
export async function choThiLai(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const sbd = chuoi(b.sbd).trim()
  if (!maCa || !sbd) return { ok: false, error: 'Thiếu mã ca hoặc số báo danh' }
  const r = await env.DB.batch([
    env.DB.prepare('DELETE FROM luot WHERE ma_ca = ? AND sbd = ?').bind(maCa, sbd),
    env.DB.prepare('DELETE FROM chi_tiet_cau WHERE ma_ca = ? AND sbd = ?').bind(maCa, sbd),
    env.DB.prepare('DELETE FROM phong_cho WHERE ma_ca = ? AND sbd = ?').bind(maCa, sbd),
  ])
  return {
    ok: true,
    soLuotXoa: r[0]?.meta?.changes ?? 0,
    soCauXoa: r[1]?.meta?.changes ?? 0,
    khoaMay: b.lapMoi === true,
    daDoiDe: b.boCauMoi === true,
  }
}

// ===========================================================================
// BẢN ĐỒ SAI · TIẾN ĐỘ · LÊN BẢNG
// ===========================================================================

export async function banDoSaiCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ds = Array.isArray(b.dsMaCa) ? (b.dsMaCa as unknown[]).map((x) => chuoi(x).trim()).filter(Boolean).slice(0, 30) : []
  if (ds.length === 0) return { ok: true, ca: {} }
  const cho = ds.map(() => '?').join(',')
  const r = await env.DB.prepare(`SELECT ma_ca, sbd, qid FROM ban_do_sai WHERE ma_ca IN (${cho})`).bind(...ds).all<Record<string, unknown>>()
  const rLam = await env.DB.prepare(`SELECT ma_ca, sbd, qid FROM chi_tiet_cau WHERE ma_ca IN (${cho}) AND qid <> ''`).bind(...ds).all<Record<string, unknown>>()
  const ca: Record<string, { sai: Record<string, string[]>; lam: Record<string, string[]> }> = {}
  for (const m of ds) ca[m] = { sai: {}, lam: {} }
  for (const x of r.results ?? []) {
    const m = chuoi(x.ma_ca)
    const s = chuoi(x.sbd)
    if (!ca[m]) ca[m] = { sai: {}, lam: {} }
    ;(ca[m].sai[s] ??= []).push(chuoi(x.qid))
  }
  for (const x of rLam.results ?? []) {
    const m = chuoi(x.ma_ca)
    const s = chuoi(x.sbd)
    if (!ca[m]) ca[m] = { sai: {}, lam: {} }
    ;(ca[m].lam[s] ??= []).push(chuoi(x.qid))
  }
  return { ok: true, ca }
}

export async function qidDaLam(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  const r = await env.DB.prepare('SELECT qid FROM qid_da_lam WHERE sbd = ?').bind(sbd).all<Record<string, unknown>>()
  return { ok: true, qids: (r.results ?? []).map((x) => chuoi(x.qid)) }
}

export async function lichSuLenBang(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const soNgay = Number(b.soNgay) > 0 ? Number(b.soNgay) : 30
  const tu = new Date(Date.now() - soNgay * 86400000).toISOString()
  const r = await env.DB.prepare('SELECT sbd, qid, luc FROM len_bang WHERE luc >= ? ORDER BY luc DESC LIMIT 2000')
    .bind(tu)
    .all<Record<string, unknown>>()
  const theoEm: Record<string, { soLan: number; lanCuoi: string; qids: string[] }> = {}
  for (const x of r.results ?? []) {
    const s = chuoi(x.sbd)
    if (!s) continue
    const e = (theoEm[s] ??= { soLan: 0, lanCuoi: '', qids: [] })
    e.soLan++
    const luc = chuoi(x.luc)
    if (luc > e.lanCuoi) e.lanCuoi = luc
    const qid = chuoi(x.qid)
    if (qid) e.qids.push(qid)
  }
  return { ok: true, soNgay, theoEm }
}

// ===========================================================================
// NGÂN HÀNG CÓ ĐÁP ÁN · ĐỀ RIÊNG · CHỈ MỤC KHO
// ===========================================================================

export async function capNhatKeyBank(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  if (!env.DE) return { ok: false, error: 'Chưa nối R2' }
  await env.DE.put(`key/${maCa}.json`, JSON.stringify(b.keyBank ?? null))
  const ca = await env.DB.prepare('SELECT cong_bo FROM ca WHERE ma_ca = ?').bind(maCa).first<{ cong_bo: string }>()
  return { ok: true, congBo: chuoi(ca?.cong_bo) || 'khong' }
}

/** NỐI THÊM CÂU VÀO KHO CỦA MỘT CA — chỉ dùng cho đề riêng từng em. */
export async function noiKhoCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  const bank = Array.isArray(b.bank) ? (b.bank as Record<string, unknown>[]) : []
  const key = (b.keyBank ?? {}) as Record<string, unknown>
  const nay = NAY()
  const lenh = bank.slice(0, 400).map((c) => {
    const qid = chuoi(c.id) || chuoi(c.qid)
    return env.DB.prepare(
      `INSERT INTO kho_ca_them (khoa, ma_ca, qid, cau_json, dap_an, luc) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(khoa) DO UPDATE SET cau_json = excluded.cau_json, dap_an = excluded.dap_an, luc = excluded.luc`,
    ).bind(`${maCa}|${qid}`, maCa, qid, JSON.stringify(c), chuoi(key[qid]), nay)
  })
  for (let i = 0; i < lenh.length; i += 100) await env.DB.batch(lenh.slice(i, i + 100))
  return { ok: true, themBank: lenh.length, themKey: Object.keys(key).length }
}


// ===========================================================================
// LỆNH ĐỌC CỦA MÁY EM (trước là GET ?action=...)
// ===========================================================================

/** HỎI LẠI SAU KHI NỘP (chế độ `ca_lop_xong`, hoặc mở lại app sau khi đã nộp).
 *
 * Trả về ĐÚNG dáng `KetQuaCongBo` của đường cũ: `sanSang` là "đã được phép xem
 * đáp án chưa", và chỉ khi ấy mới kèm `keyBank`. Đếm bằng MỘT câu — không lặp
 * theo em, vì lệnh này cả lớp bắn cùng lúc lúc tan ca. */
export async function ketQuaCuaEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  const ca = await env.DB.prepare('SELECT cong_bo, trang_thai FROM ca WHERE ma_ca = ?').bind(maCa).first<Record<string, unknown>>()
  if (!ca) return { ok: false, error: 'Không tìm thấy ca kiểm tra' }
  const congBo = chuoi(ca.cong_bo) || 'khong'
  const dem = await env.DB.prepare(
    `SELECT COUNT(*) AS da_vao, SUM(CASE WHEN trang_thai = 'da_nop' THEN 1 ELSE 0 END) AS da_nop
       FROM luot WHERE ma_ca = ?`,
  )
    .bind(maCa)
    .first<{ da_vao: number; da_nop: number }>()
  const daVao = Number(dem?.da_vao) || 0
  const daNop = Number(dem?.da_nop) || 0

  // CẢ LỚP XONG nghĩa là không còn ai đang làm, HOẶC thầy đã khoá ca. Ca chưa
  // ai vào thì KHÔNG tính là xong — nếu không, em mở link sớm là thấy đáp án.
  const caXong = chuoi(ca.trang_thai) === 'dong' || (daVao > 0 && daNop >= daVao)
  const sanSang = congBo === 'ngay' || (congBo === 'ca_lop_xong' && caXong)

  let keyBank: unknown = null
  if (sanSang && env.DE) {
    const o = await env.DE.get(`key/${maCa}.json`)
    if (o?.body) {
      try {
        keyBank = await new Response(o.body).json()
      } catch {
        keyBank = null
      }
    }
  }
  return { ok: true, congBo, sanSang, daNop, daVao, keyBank }
}

/** CẤU HÌNH MỘT CA cho máy em (`SessionConfig`) — kèm luôn gói đề KHÔNG đáp án.
 *
 * Gói đề nằm ở R2, D1 chỉ giữ khoá đối tượng. Ca chưa phát đề thì trả `bank`
 * rỗng chứ không báo lỗi: màn của em tự hiểu là chưa tới giờ. */
export async function xemCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const c = await env.DB.prepare('SELECT * FROM ca WHERE ma_ca = ?').bind(maCa).first<Record<string, unknown>>()
  if (!c) return { ok: true, found: false }
  let bank: unknown = undefined
  const khoa = chuoi(c.bank_r2)
  if (khoa && env.DE) {
    const o = await env.DE.get(khoa)
    if (o?.body) {
      try {
        bank = await new Response(o.body).json()
      } catch {
        bank = undefined
      }
    }
  }
  return {
    ok: true,
    found: true,
    maCa,
    tenCa: chuoi(c.ten_ca),
    lop: chuoi(c.lop),
    trangThai: chuoi(c.trang_thai),
    batDau: chuoi(c.bat_dau),
    hetHanVao: chuoi(c.het_han_vao),
    thoiGianPhut: Number(c.thoi_gian_phut) || 45,
    congBo: chuoi(c.cong_bo) || 'khong',
    bank,
  }
}

export async function dsNopCuaCa(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const r = await env.DB.prepare(
    `SELECT l.sbd, l.lan_thu, l.trang_thai, l.nop_luc, l.tong, COALESCE(NULLIF(l.ho_ten,''), d.ho_ten, '') AS ho_ten
       FROM luot l LEFT JOIN danh_sach d ON d.sbd = l.sbd
      WHERE l.ma_ca = ? ORDER BY l.sbd, l.lan_thu`,
  )
    .bind(maCa)
    .all<Record<string, unknown>>()
  return {
    ok: true,
    items: (r.results ?? []).map((x) => ({
      sbd: chuoi(x.sbd),
      hoTen: chuoi(x.ho_ten),
      lanThu: Number(x.lan_thu) || 1,
      trangThai: chuoi(x.trang_thai),
      nopLuc: chuoi(x.nop_luc),
      tong: soHoacNull(x.tong),
    })),
  }
}

/** NHẬN XÉT GỬI PHỤ HUYNH — ghi điểm của lượt và lưu bản nhận xét.
 *
 * ĐẶT ĐIỂM PHẢI KHỚP LƯỢT: không có lượt thì không ghi gì, đúng luật cũ. */
export async function guiNhanXet(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const sbd = chuoi(b.sbd).trim()
  if (!maCa || !sbd) return { ok: false, error: 'Thiếu mã ca hoặc số báo danh' }
  const d = (b.diemPhan ?? {}) as Record<string, unknown>
  const nay = NAY()
  const r = await env.DB.prepare(
    `UPDATE luot SET tong = ?, diem_i = COALESCE(?, diem_i), diem_ii = COALESCE(?, diem_ii),
                     diem_iii = COALESCE(?, diem_iii), cap_nhat_luc = ?
      WHERE ma_ca = ? AND sbd = ? AND lan_thu = (SELECT MAX(lan_thu) FROM luot WHERE ma_ca = ? AND sbd = ?)`,
  )
    .bind(soHoacNull(b.diem), soHoacNull(d.I), soHoacNull(d.II), soHoacNull(d.III), nay, maCa, sbd, maCa, sbd)
    .run()
  if ((r.meta.changes ?? 0) === 0) return { ok: false, error: 'Không tìm thấy lượt của em trong ca này' }
  await env.DB.prepare('INSERT INTO nhan_xet (sbd, ma_ca, noi_dung, luc) VALUES (?, ?, ?, ?)')
    .bind(sbd, maCa, JSON.stringify({ xepLoai: chuoi(b.xepLoai), cauSai: b.cauSai ?? null, diem: soHoacNull(b.diem) }), nay)
    .run()
  return { ok: true }
}

/** TRA SỐ BÁO DANH — một câu, nối sang `ca` để lấy luôn tên ca.
 *
 * Đường cũ hỏi Apps Script và mất 1,5–2,9 giây chỉ để đọc một ô. Ở đây là một
 * lượt đọc chỉ mục. Bảng danh sách RỖNG thì KHÔNG chặn — giữ đúng luật cũ. */
export async function traSbd(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa).trim()
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, lyDo: 'thieu', error: 'Thiếu số báo danh' }
  const r = await env.DB.prepare(
    `SELECT d.ho_ten, d.nam_sinh, d.lop, (SELECT ten_ca FROM ca WHERE ma_ca = ?) AS ten_ca
       FROM danh_sach d WHERE d.sbd = ?`,
  )
    .bind(maCa, sbd)
    .first<Record<string, unknown>>()
  if (!r) {
    const co = await env.DB.prepare('SELECT COUNT(*) AS n FROM danh_sach').first<{ n: number }>()
    if ((Number(co?.n) || 0) === 0) return { ok: true, sbd, hoTen: '', lop: '', tenCa: '' }
    return { ok: false, lyDo: 'khong_co_sbd', error: 'Không có số báo danh này trong danh sách lớp' }
  }
  return { ok: true, sbd, hoTen: chuoi(r.ho_ten), namSinh: chuoi(r.nam_sinh), lop: chuoi(r.lop), tenCa: chuoi(r.ten_ca) }
}

/** GỬI NHẬN XÉT kèm ĐẶT ĐIỂM. Không phải thầy thì phải đúng máy đã làm bài —
 * giữ nguyên cổng `idThietBi` của đường cũ, không nới. */
export async function guiNhanXetCoQuyen(env: Env, b: Record<string, unknown>, laThay: boolean): Promise<Record<string, unknown>> {
  if (!laThay) {
    const maCa = chuoi(b.maCa).trim()
    const sbd = chuoi(b.sbd).trim()
    const idTb = chuoi(b.idThietBi).trim()
    if (!idTb) return { ok: false, error: 'Thiếu mã thiết bị' }
    const l = await env.DB.prepare('SELECT id_thiet_bi FROM luot WHERE ma_ca = ? AND sbd = ? ORDER BY lan_thu DESC LIMIT 1')
      .bind(maCa, sbd)
      .first<{ id_thiet_bi: string }>()
    if (!l || chuoi(l.id_thiet_bi) !== idTb) return { ok: false, error: 'Máy này không phải máy đã làm bài' }
  }
  return guiNhanXet(env, b)
}

/** CÂU KHẮC PHỤC CHO MỘT EM — trả về GÓI ĐỀ chứa câu, đúng dáng đường cũ.
 *
 * Máy em cần nội dung câu (đề, phương án, lời giải), mà nội dung nằm trong gói
 * đề trên R2 chứ không nằm ở D1. Nên thứ tự là: chọn qid ở D1 (rẻ, có chỉ mục)
 * → gom theo mã đề → tải ĐÚNG những gói đề ấy.
 *
 * TRẦN 8 GÓI ĐỀ một lượt: mỗi gói vài trăm KB, tải cả kho về máy em là đúng cái
 * đã làm đường cũ mất hơn 20 giây. */
export async function cauKhacPhucGoi(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  const soCau = Math.max(1, Math.min(60, Number(b.soCau) || 20))
  const loaiTru = new Set((Array.isArray(b.loaiTru) ? (b.loaiTru as unknown[]) : []).map((x) => chuoi(x)))
  let dsCd = (Array.isArray(b.chuyenDe) ? (b.chuyenDe as unknown[]) : []).map((x) => chuoi(x)).filter(Boolean)

  // Không nói chuyên đề thì lấy đúng chuyên đề em ĐANG SAI — đó là việc của
  // phiếu khắc phục. Không có bản đồ sai thì trả rỗng, KHÔNG rút bừa.
  if (dsCd.length === 0 && sbd) {
    const r = await env.DB.prepare('SELECT DISTINCT chuyen_de FROM ban_do_sai WHERE sbd = ? AND da_chua = 0 LIMIT 12')
      .bind(sbd)
      .all<Record<string, unknown>>()
    dsCd = (r.results ?? []).map((x) => chuoi(x.chuyen_de)).filter(Boolean)
  }
  if (dsCd.length === 0) return { ok: true, items: [], soCau: 0, soChon: 0, thuTu: [], catBotViNang: false }

  const oCd = dsCd.map(() => '?').join(',')
  const rCau = await env.DB.prepare(
    `SELECT c.qid, c.ma_de FROM cau_hoi c JOIN de_kho d ON d.ma_de = c.ma_de
      WHERE d.da_xoa = 0 AND c.chuyen_de IN (${oCd}) LIMIT 3000`,
  )
    .bind(...dsCd)
    .all<Record<string, unknown>>()

  const daLam = new Set<string>()
  if (sbd) {
    const rL = await env.DB.prepare('SELECT qid FROM qid_da_lam WHERE sbd = ?').bind(sbd).all<Record<string, unknown>>()
    for (const x of rL.results ?? []) daLam.add(chuoi(x.qid))
  }

  const con = (rCau.results ?? []).filter((x) => {
    const q = chuoi(x.qid)
    return q !== '' && !loaiTru.has(q) && !daLam.has(q)
  })

  // GOM THEO ĐỀ rồi chọn đề nhiều câu dùng được nhất: cùng một số câu, ít gói
  // đề hơn nghĩa là ít byte phải tải hơn.
  const theoDe = new Map<string, string[]>()
  for (const x of con) {
    const m = chuoi(x.ma_de)
    if (!theoDe.has(m)) theoDe.set(m, [])
    theoDe.get(m)!.push(chuoi(x.qid))
  }
  const xepDe = [...theoDe.entries()].sort((a, c) => c[1].length - a[1].length).slice(0, 8)

  const thuTu: string[] = []
  for (const [, qids] of xepDe) {
    for (const q of qids) {
      if (thuTu.length >= soCau) break
      thuTu.push(q)
    }
    if (thuTu.length >= soCau) break
  }

  const items: unknown[] = []
  if (env.DE) {
    for (const [maDe] of xepDe) {
      if (!thuTu.some((q) => (theoDe.get(maDe) ?? []).includes(q))) continue
      const o = await env.DE.get(`kho/${maDe}.json`)
      if (!o?.body) continue
      try {
        items.push(await new Response(o.body).json())
      } catch {
        // Gói hỏng thì BỎ QUA gói ấy, không làm chết cả lượt rút.
      }
    }
  }

  return {
    ok: true,
    items,
    soCau: thuTu.length,
    soChon: con.length,
    thuTu,
    catBotViNang: con.length > thuTu.length,
  }
}

/** GHI PHIẾU BÀI TẬP CỦA EM — sinh mã, cất gói lên R2, ghi sổ phiếu. */
export async function ghiPhieuKhacPhuc(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = chuoi(b.sbd).trim()
  if (!sbd) return { ok: false, error: 'Thiếu số báo danh' }
  const cau = Array.isArray(b.cau) ? (b.cau as unknown[]) : []
  if (cau.length === 0) return { ok: false, error: 'Phiếu không có câu nào' }
  const ma = maNgauNhien()
  const r = await luuPhieu(env, {
    ma,
    maCa: chuoi(b.maCa),
    sbd,
    hoTen: chuoi(b.hoTen),
    loai: 'baitap',
    phieu: { cau, tenChuyenDe: chuoi(b.tenChuyenDe), sbd, hoTen: chuoi(b.hoTen), maCa: chuoi(b.maCa) },
  })
  if (!r.ok) return r
  return { ok: true, ma }
}

/** MÃ PHIẾU — 10 ký tự từ nguồn ngẫu nhiên thật của trình chạy, không phải
 * `Math.random`: mã này là thứ duy nhất bảo vệ phiếu của một em. */
export function maNgauNhien(): string {
  const b = new Uint8Array(8)
  crypto.getRandomValues(b)
  let s = ''
  for (const x of b) s += 'abcdefghijkmnpqrstuvwxyz23456789'[x % 32]
  return s
}
