// MÁY CHỦ MỚI — bốn lệnh nóng lúc thi (MAY-CHU-MOI.md).
//
// BA LUẬT KHÔNG ĐƯỢC PHÁ:
//   1. Mỗi endpoint dùng 1–3 câu truy vấn. Trần D1 miễn phí là 50 câu một lượt
//      gọi Worker, và vòng lặp truy vấn theo số em là đường chắc chắn chạm trần.
//   2. Gói đề KHÔNG nằm trong D1 (trần 2 MB một dòng, kho thầy đã 2,1 MB) —
//      nằm ở R2, D1 chỉ giữ khoá đối tượng.
//   3. Lệnh của HỌC SINH không đòi mã bí mật (giống Apps Script hiện nay);
//      lệnh của THẦY thì đòi. Không nới luật này ở bất kỳ đâu.
import type { DongCa, DongLuot, Env } from './kieu'
import { khoaLuot, mocHetGio, quyetDinhVaoThi } from './luat-vao-thi'

// CORS — app chạy ở `dodaihoc4869.github.io`, Worker ở `workers.dev`, nên MỌI
// lượt gọi đều là chéo nguồn. Thiếu mấy dòng này là trình duyệt chặn sạch và
// máy em chỉ thấy "lỗi mạng" — không có cách nào đoán ra từ phía em.
//
// Mở cho mọi nguồn, đúng như Apps Script đang làm: lệnh của học sinh vốn không
// đòi mã bí mật, khoá theo nguồn không thêm an toàn mà chỉ thêm chỗ hỏng.
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, x-ma-bi-mat',
  'access-control-max-age': '86400',
}
const JSON_HEADERS = { 'content-type': 'application/json;charset=utf-8', ...CORS }

function ra(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ ...(data as object), serverNow: Date.now() }), { status, headers: JSON_HEADERS })
}

function laThay(req: Request, env: Env, body: Record<string, unknown>): boolean {
  const gui = String(body.secret ?? req.headers.get('x-ma-bi-mat') ?? '').trim()
  return gui.length > 0 && gui === String(env.MA_BI_MAT ?? '').trim()
}

async function docCa(env: Env, maCa: string): Promise<DongCa | null> {
  return await env.DB.prepare('SELECT * FROM ca WHERE ma_ca = ?').bind(maCa).first<DongCa>()
}

/** Lượt MỚI NHẤT của một em trong ca — một câu, có chỉ mục, không quét bảng. */
async function docLuotMoiNhat(env: Env, maCa: string, sbd: string): Promise<DongLuot | null> {
  return await env.DB.prepare('SELECT * FROM luot WHERE ma_ca = ? AND sbd = ? ORDER BY lan_thu DESC LIMIT 1')
    .bind(maCa, sbd)
    .first<DongLuot>()
}

// ---------------------------------------------------------------- HỌC SINH

async function vaoThi(env: Env, b: Record<string, unknown>): Promise<Response> {
  const maCa = String(b.maCa ?? '').trim()
  const sbd = String(b.sbd ?? '').trim()
  const idThietBi = String(b.idThietBi ?? '').trim()
  if (!maCa || !sbd) return ra({ ok: false, lyDo: 'thieu', error: 'Thiếu mã ca hoặc số báo danh' })

  const ca = await docCa(env, maCa)
  const cu = await docLuotMoiNhat(env, maCa, sbd)
  const now = Date.now()
  const qd = quyetDinhVaoThi(ca, cu, idThietBi, now)
  if (!qd.ok || !ca) return ra({ ok: false, lyDo: qd.lyDo, lanThu: qd.lanThu, thoiGianPhut: ca?.thoi_gian_phut ?? 45 })

  const lanThu = qd.lanThu ?? 1
  const khoa = khoaLuot(maCa, sbd, lanThu)
  const vaoLuc = qd.cach === 'khoi_phuc' && cu ? cu.vao_luc : new Date(now).toISOString()
  const hetGio = qd.cach === 'khoi_phuc' && cu ? cu.het_gio_luc || '' : mocHetGio(ca, now)

  // MỘT câu ghi, nguyên tử theo dòng. Không khoá toàn cục, nên 50 em vào cùng
  // lúc là 50 dòng khác nhau, không ai chờ ai.
  await env.DB.prepare(
    `INSERT INTO luot (khoa, ma_ca, sbd, lan_thu, id_thiet_bi, vao_luc, het_gio_luc, trang_thai, cap_nhat_luc)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'dang_lam', ?)
     ON CONFLICT(khoa) DO UPDATE SET id_thiet_bi = excluded.id_thiet_bi, cap_nhat_luc = excluded.cap_nhat_luc`,
  )
    .bind(khoa, maCa, sbd, lanThu, idThietBi, vaoLuc, hetGio, new Date(now).toISOString())
    .run()

  return ra({
    ok: true,
    cach: qd.cach,
    khoaLuot: khoa,
    lanThu,
    vaoLuc,
    hetGioLuc: hetGio,
    thoiGianPhut: ca.thoi_gian_phut ?? 45,
    congBo: ca.cong_bo ?? 'khong',
    loai: ca.loai === 'baitap' ? 'baitap' : 'thi',
    hanNop: ca.han_nop ?? '',
    tenCa: ca.ten_ca ?? '',
    nguongLan: ca.nguong_lan ?? 3,
    nguongGiay: ca.nguong_giay ?? 10,
    soCau: ca.so_cau_json ? JSON.parse(ca.so_cau_json) : undefined,
    boTheoEm: ca.bo_theo_em_json ? JSON.parse(ca.bo_theo_em_json) : undefined,
    // KHÔNG trả gói đề trong thân: máy em tải riêng từ /de/:maCa, qua bộ đệm biên.
    deUrl: ca.bank_r2 ? `/de/${encodeURIComponent(maCa)}` : null,
  })
}

async function luuTam(env: Env, b: Record<string, unknown>): Promise<Response> {
  const khoa = String(b.khoaLuot ?? '').trim()
  if (!khoa) return ra({ ok: false, lyDo: 'thieu' })
  const r = await env.DB.prepare(
    `UPDATE luot SET dap_an_json = ?, giay_cau_json = ?, cap_nhat_luc = ?
     WHERE khoa = ? AND trang_thai = 'dang_lam'`,
  )
    .bind(JSON.stringify(b.dapAn ?? {}), b.giayCau ? JSON.stringify(b.giayCau) : null, new Date().toISOString(), khoa)
    .run()
  if (r.meta.changes === 0) return ra({ ok: false, lyDo: 'khong_dang_lam' })
  return ra({ ok: true })
}

async function nop(env: Env, b: Record<string, unknown>): Promise<Response> {
  const khoa = String(b.khoaLuot ?? '').trim()
  if (!khoa) return ra({ ok: false, lyDo: 'thieu' })
  const integrity = (b.integrity ?? {}) as { leaveCount?: number; totalHiddenMs?: number; blocked?: boolean }
  const nopLuc = new Date().toISOString()
  const trangThai = integrity.blocked ? 'khoa' : 'da_nop'

  // KHOÁ CHỐNG TRÙNG nằm ngay trong mệnh đề WHERE: lượt đã nộp thì câu này
  // không đổi dòng nào, nên máy em thử lại bao nhiêu lần cũng an toàn.
  const r = await env.DB.prepare(
    `UPDATE luot SET nop_luc = ?, trang_thai = ?, dap_an_json = ?, giay_cau_json = ?,
            integrity_json = ?, so_lan_roi_man = ?, tong_giay_roi_man = ?, cap_nhat_luc = ?, da_day_sheet = 0
     WHERE khoa = ? AND trang_thai = 'dang_lam'`,
  )
    .bind(
      nopLuc,
      trangThai,
      JSON.stringify(b.dapAn ?? {}),
      b.giayCau ? JSON.stringify(b.giayCau) : null,
      JSON.stringify(integrity),
      Number(integrity.leaveCount ?? 0),
      Math.round(Number(integrity.totalHiddenMs ?? 0) / 1000),
      nopLuc,
      khoa,
    )
    .run()

  if (r.meta.changes === 0) {
    const da = await env.DB.prepare('SELECT trang_thai, nop_luc FROM luot WHERE khoa = ?').bind(khoa).first<DongLuot>()
    if (da && (da.trang_thai === 'da_nop' || da.trang_thai === 'khoa')) {
      return ra({ ok: true, daNhan: true, nopLuc: da.nop_luc })
    }
    return ra({ ok: false, lyDo: 'khong_tim_thay' })
  }
  return ra({ ok: true, nopLuc })
}

async function layDe(env: Env, maCa: string): Promise<Response> {
  const ca = await docCa(env, maCa)
  if (!ca?.bank_r2) return ra({ ok: false, lyDo: 'chua_co_de' }, 404)
  if (!env.DE) return ra({ ok: false, lyDo: 'chua_noi_r2' }, 500)
  const o = await env.DE.get(ca.bank_r2)
  if (!o) return ra({ ok: false, lyDo: 'mat_goi_de' }, 404)
  // Gói đề của một ca không đổi sau khi phát ⇒ cho bộ đệm biên giữ lâu.
  return new Response(o.body, {
    headers: { ...JSON_HEADERS, 'cache-control': 'public, max-age=86400', etag: o.httpEtag },
  })
}

// ------------------------------------------------------------------- THẦY

async function dayCa(env: Env, b: Record<string, unknown>): Promise<Response> {
  const ca = b.ca as Record<string, unknown>
  const maCa = String(ca?.maCa ?? '').trim()
  if (!maCa) return ra({ ok: false, error: 'Thiếu mã ca' })

  let bankKey: string | null = null
  if (b.bank) {
    if (!env.DE) return ra({ ok: false, error: 'Chưa nối R2 — chưa đẩy gói đề được' }, 500)
    bankKey = `de/${maCa}.json`
    await env.DE.put(bankKey, JSON.stringify(b.bank))
  }
  await env.DB.prepare(
    `INSERT INTO ca (ma_ca, ten_ca, trang_thai, bat_dau, het_han_vao, thoi_gian_phut, loai, han_nop,
                     cong_bo, nguong_lan, nguong_giay, bank_r2, so_cau_json, bo_theo_em_json, cap_nhat_luc)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(ma_ca) DO UPDATE SET
       ten_ca=excluded.ten_ca, trang_thai=excluded.trang_thai, bat_dau=excluded.bat_dau,
       het_han_vao=excluded.het_han_vao, thoi_gian_phut=excluded.thoi_gian_phut, loai=excluded.loai,
       han_nop=excluded.han_nop, cong_bo=excluded.cong_bo, nguong_lan=excluded.nguong_lan,
       nguong_giay=excluded.nguong_giay, so_cau_json=excluded.so_cau_json,
       bo_theo_em_json=excluded.bo_theo_em_json, cap_nhat_luc=excluded.cap_nhat_luc,
       bank_r2=COALESCE(excluded.bank_r2, ca.bank_r2)`,
  )
    .bind(
      maCa, String(ca.tenCa ?? ''), String(ca.trangThai ?? 'mo'), String(ca.batDau ?? ''),
      String(ca.hetHanVao ?? ''), Number(ca.thoiGianPhut) || 45, String(ca.loai ?? 'thi'),
      String(ca.hanNop ?? ''), String(ca.congBo ?? 'khong'), Number(ca.nguongLan) || 3,
      Number(ca.nguongGiay) || 10, bankKey, ca.soCau ? JSON.stringify(ca.soCau) : null,
      ca.boTheoEm ? JSON.stringify(ca.boTheoEm) : null, new Date().toISOString(),
    )
    .run()
  return ra({ ok: true, maCa, coDe: !!bankKey })
}

/** Lượt CHƯA đẩy về Sheet. Máy thầy kéo về rồi tự phát lại lên Apps Script —
 *  Worker KHÔNG giữ mã bí mật Google, nên không tự gọi sang đó. */
async function chuaDay(env: Env, maCa: string): Promise<Response> {
  const r = await env.DB.prepare('SELECT * FROM luot WHERE ma_ca = ? AND da_day_sheet = 0 ORDER BY sbd')
    .bind(maCa)
    .all<DongLuot>()
  return ra({ ok: true, luot: r.results, con: r.results.length })
}

async function danhDauDaDay(env: Env, b: Record<string, unknown>): Promise<Response> {
  const ds = Array.isArray(b.khoa) ? (b.khoa as string[]) : []
  if (ds.length === 0) return ra({ ok: true, danhDau: 0 })
  if (ds.length > 500) return ra({ ok: false, error: 'Quá 500 khoá một lượt' })
  const cho = ds.map(() => '?').join(',')
  const r = await env.DB.prepare(`UPDATE luot SET da_day_sheet = 1 WHERE khoa IN (${cho})`).bind(...ds).run()
  return ra({ ok: true, danhDau: r.meta.changes })
}

// ------------------------------------------------------------------ ĐỊNH TUYẾN

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    const p = url.pathname

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
    if (req.method === 'GET' && p === '/khoe') {
      return ra({ ok: true, ten: 'may-chu-moi', coDB: !!env.DB, coR2: !!env.DE, coMat: !!env.MA_BI_MAT })
    }
    if (req.method === 'GET' && p.startsWith('/de/')) return layDe(env, decodeURIComponent(p.slice(4)))
    if (req.method !== 'POST') return ra({ ok: false, error: 'Chỉ nhận POST' }, 405)

    let b: Record<string, unknown>
    try {
      b = (await req.json()) as Record<string, unknown>
    } catch {
      return ra({ ok: false, error: 'Thân gói không phải JSON' }, 400)
    }

    // Lệnh của HỌC SINH — không đòi mã bí mật, giống Apps Script hiện nay.
    if (p === '/vao-thi') return vaoThi(env, b)
    if (p === '/luu-tam') return luuTam(env, b)
    if (p === '/nop') return nop(env, b)

    // Lệnh của THẦY — đòi mã bí mật.
    if (!laThay(req, env, b)) return ra({ ok: false, error: 'Sai mã bí mật' }, 403)
    if (p === '/ca/day') return dayCa(env, b)
    if (p === '/chua-day') return chuaDay(env, String(b.maCa ?? ''))
    if (p === '/da-day') return danhDauDaDay(env, b)

    return ra({ ok: false, error: 'Không có đường này' }, 404)
  },
}
