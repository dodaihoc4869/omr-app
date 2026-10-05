// ĐỘ PHỦ "LÀM LẠI CÂU SAI BẰNG BẢN KHÁC" (thầy 05/10) — CHỈ ĐỌC kho. Theo chương (chuyên đề của tờ; thiếu ⇒ mã chương trong mã tờ "DH-12-C2"):
// % câu có SONG SINH dùng được · có CÂU ANH EM (cùng dạng, cùng phần, khác nhóm nội dung, mức cách ≤ 1, ĐÚNG KHỐI — mọi nguồn khối đọc ra của
// hai câu trùng nhau —, tờ DẠY HỌC, đã duyệt, không tự luận) · KHÔNG CÓ GÌ (chỉ còn bản xáo / nguyên văn). Kèm số lượt sổ từ 05/10: `nv`
// (lặp nguyên văn — chỗ cần soạn thêm song sinh), `tc` (câu anh em), `xt` (bản xáo).
// Nhật ký chỉ có số lượng và mã câu — không đề, đáp án, lời giải, thông tin học sinh. Không ghi D1/R2.
//
// CHẠY TRÊN KHO THẬT (cần token Cloudflare của thầy — phiên 05/10 KHÔNG chạy ở đây):
//   CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… node scripts/do-phu-lam-lai.mjs            # in JSON tóm tắt
//   CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… node scripts/do-phu-lam-lai.mjs --ra ket-qua.json
// Trên D1 test (node:sqlite): tests/lam-lai-cau-sai-0510-do-phu.test.ts gọi `docDoPhu(query)` với `query` chạy trên lược đồ thật.
// LƯU Ý: "có anh em" đếm TOÀN KHO (cận trên) — lúc phát câu còn lọc theo phạm vi từng em, câu bảo vệ ca thi, BTVN chưa nộp, câu em đã gặp.
import { pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'

const DATABASE = 'd2e6d322-374a-45d7-83a3-9fac486b23f1'
/** Bậc mức độ — chép đúng HANG_MUC_DO của server/src/srs2-loi.ts (test đối chiếu). */
export const HANG_MUC_DO = { NB: 0, 'Nhận biết': 0, biet: 0, TH: 1, 'Thông hiểu': 1, hieu: 1, VD: 2, 'Vận dụng': 2, van_dung: 2, VDC: 3, 'Vận dụng cao': 3, van_dung_cao: 3 }
export const bacMuc = (m) => (m != null && m in HANG_MUC_DO ? HANG_MUC_DO[m] : null)
const chuoi = (v) => (v == null ? '' : String(v))
/** Khối từ mã tờ / mã câu — chép đúng `khoiCuaMaDe` của src/lib/khoi-cau.ts (test đối chiếu); danh sách mã ⇒ khối cao nhất. */
export function khoiCuaMaDe(ma) {
  let cao = null
  for (const p of chuoi(ma).normalize('NFC').trim().split(/[\s,;|]+/)) {
    const m = /^[A-Za-zĐđ]{1,6}-(10|11|12)(?![0-9])(?:-|$)/.exec(p) ?? /^(10|11|12)-/.exec(p)
    if (m) { const k = Number(m[1]); if (cao === null || k > cao) cao = k }
  }
  return cao
}
/** Khối ở đầu tên lớp / cột `lop` — chép đúng `khoiCuaLop`. */
export const khoiCuaLop = (v) => { const m = /^(?:lớp\s*|khối\s*)?(10|11|12)(?![0-9])/i.exec(chuoi(v).normalize('NFC').trim()); return m ? Number(m[1]) : null }
/** Khối của câu theo luật câu anh em (`dungKhoi`, lam-lai-so.ts): mọi nguồn đọc ra (mã tờ, qid, cột lop của tờ) phải trùng; không rõ / mâu thuẫn ⇒ null. */
export function khoiChac(c) {
  const ds = [khoiCuaMaDe(c.maDe), khoiCuaMaDe(c.qid), khoiCuaLop(c.lop)].filter((k) => k !== null)
  return ds.length && ds.every((k) => k === ds[0]) ? ds[0] : null
}
/** Mã chương trong mã tờ ("DH-12-C2-B6-TN" ⇒ "DH-12-C2", "12-C1-B2-D1" ⇒ "12-C1") khi tờ không ghi chuyên đề. */
export const chuongTuMa = (ma) => /^([A-Za-zĐđ]{1,6}-(?:10|11|12)-C\d+|(?:10|11|12)-C\d+)(?![0-9])/.exec(chuoi(ma).trim())?.[1] ?? ''
const parsed = (s) => { try { return JSON.parse(s ?? 'null') } catch { return null } }

/** Bảng của biến thể đủ hàng cột (chép `docBangSongSinh`). */
const bangDu = (v) => Array.isArray(v) && v.length >= 2 && Array.isArray(v[0]) && v[0].length >= 2 && v.every((r) => Array.isArray(r) && r.length === v[0].length && r.every((c) => typeof c === 'string' || (typeof c === 'number' && Number.isFinite(c))))
/** Biến thể nói tới bảng mà không tự mang bảng/ảnh/bảng chữ ⇒ thiếu dữ kiện (chép `thieuBangSongSinh`). */
const thieuBang = (ss) => {
  const de = chuoi(ss.de)
  const nhacBang = /bảng\s*(?:(?:số liệu|dữ liệu|thành phần|giá trị|kết quả)\s*)?(?:sau|dưới|trên|bên|kèm|này|cho|\d|:)/iu.test(de)
  const bangTrongChu = /[^\n|]+\|[^\n|]+\|[^\n|]+/.test(de) && /\d/.test(de)
  const anhDe = Array.isArray(ss.hinh) && ss.hinh.some((h) => h && h.du_lieu && (h.vi_tri === 'sau_de' || h.vi_tri === 'cuoi_cau'))
  return nhacBang && !bangDu(ss.bang) && !anhDe && !bangTrongChu
}
/** Song sinh DÙNG ĐƯỢC cho phần của câu gốc — chép đúng `songSinhDuDuLieu` (server/src/cau-bo-tro.ts); test đối chiếu hai bên. */
export function songSinhDungDuoc(phan, ss) {
  if (!ss || typeof ss !== 'object' || !chuoi(ss.de).trim() || thieuBang(ss)) return false
  const dapAn = chuoi(ss.dap_an).trim()
  if (phan === 'I') return ['A', 'B', 'C', 'D'].every((k) => ss.pa && typeof ss.pa[k] === 'string' && ss.pa[k].trim()) && /^[ABCD]$/.test(dapAn)
  return phan === 'III' && /^-?\d+(,\d+)?$/.test(dapAn)
}

/**
 * Tính độ phủ (THUẦN). `cau`: {qid, maDe, group, dang, phan, mucDo, reviewed, tuLuan, chuong, lop} — câu của tờ còn trong kho, JSON hợp lệ.
 * `soSongSinh`: Map qid → số song sinh dùng được. `thuMuc`: Map mã tờ → 'DAY_HOC'|'TU_LUYEN' (vắng ⇒ luật mã "DH-").
 */
export function tinhDoPhu(cau, soSongSinh, thuMuc = new Map()) {
  const dayHoc = (maDe) => (thuMuc.get(maDe) ?? (chuoi(maDe).trim().toUpperCase().startsWith('DH-') ? 'DAY_HOC' : 'TU_LUYEN')) === 'DAY_HOC'
  // Ứng viên anh em: câu đã duyệt, không tự luận, tờ DẠY HỌC — nhóm theo dạng|phần.
  const theoDangPhan = new Map()
  for (const c of cau) {
    if (!c.reviewed || c.tuLuan || !c.dang || !dayHoc(c.maDe)) continue
    const k = `${c.dang}|${c.phan}`
    if (!theoDangPhan.has(k)) theoDangPhan.set(k, [])
    theoDangPhan.get(k).push(c)
  }
  const coAnhEm = (c) => {
    const k = khoiChac(c)
    if (!c.dang || k === null) return false
    const b = bacMuc(c.mucDo)
    return (theoDangPhan.get(`${c.dang}|${c.phan}`) ?? []).some((x) => x.qid !== c.qid && x.group !== c.group && khoiChac(x) === k
      && (b == null || (bacMuc(x.mucDo) != null && Math.abs(bacMuc(x.mucDo) - b) <= 1)))
  }
  const theoChuong = new Map()
  const tong = { tong: 0, coSongSinh: 0, coAnhEm: 0, chiAnhEm: 0, chiXaoHoacNguyenVan: 0, phanIII_khongGi: 0 }
  const cong = (o, c, ss, ae) => {
    o.tong++
    if (ss) o.coSongSinh++
    if (ae) o.coAnhEm++
    if (!ss && ae) o.chiAnhEm++
    if (!ss && !ae) { o.chiXaoHoacNguyenVan++; if (c.phan === 'III') o.phanIII_khongGi++ }
  }
  const daDem = new Set()
  for (const c of cau) {
    if (c.tuLuan || daDem.has(c.qid)) continue // bản trùng ở nhiều tờ: một qid một lần
    daDem.add(c.qid)
    const ss = (soSongSinh.get(c.qid) ?? 0) > 0, ae = coAnhEm(c)
    const k = c.chuong || chuongTuMa(c.maDe) || '(không ghi chuyên đề)'
    if (!theoChuong.has(k)) theoChuong.set(k, { chuong: k, tong: 0, coSongSinh: 0, coAnhEm: 0, chiAnhEm: 0, chiXaoHoacNguyenVan: 0, phanIII_khongGi: 0 })
    cong(theoChuong.get(k), c, ss, ae)
    cong(tong, c, ss, ae)
  }
  const pct = (o) => ({ ...o, pctSongSinh: o.tong ? Math.round((1000 * o.coSongSinh) / o.tong) / 10 : 0, pctAnhEm: o.tong ? Math.round((1000 * o.coAnhEm) / o.tong) / 10 : 0, pctKhongGi: o.tong ? Math.round((1000 * o.chiXaoHoacNguyenVan) / o.tong) / 10 : 0 })
  return { tong: pct(tong), theoChuong: [...theoChuong.values()].sort((a, b) => b.tong - a.tong).map(pct) }
}

/** Đọc kho qua `query(sql, params) → rows` (REST D1 thật hoặc node:sqlite trong test) rồi tính. Chỉ SELECT. */
export async function docDoPhu(query, tuNgay = '2026-10-05') {
  const cau = []
  for (let offset = 0; ; offset += 500) {
    const rows = await query(`SELECT q.qid, q.ma_de AS maDe, q.content_group AS grp, q.dang, json_extract(q.json,'$.phan') AS phan, json_extract(q.json,'$.mucDo') AS mucDo,
        json_extract(q.json,'$.reviewed') AS rv, json_extract(q.json,'$.tuLuan') AS tl, d.chuyen_de AS chuong, d.lop AS lop
      FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de WHERE COALESCE(d.da_xoa,0) = 0 AND json_valid(q.json) ORDER BY q.ma_de, q.qid LIMIT 500 OFFSET ?`, [offset])
    for (const r of rows) cau.push({ qid: chuoi(r.qid), maDe: chuoi(r.maDe), group: chuoi(r.grp), dang: r.dang == null ? null : chuoi(r.dang), phan: ['I', 'II', 'III'].includes(chuoi(r.phan)) ? chuoi(r.phan) : 'I', mucDo: r.mucDo == null ? null : chuoi(r.mucDo), reviewed: r.rv === 1 || r.rv === true || r.rv === '1' || r.rv === 'true', tuLuan: r.tl === 1 || r.tl === true || r.tl === '1' || r.tl === 'true', chuong: chuoi(r.chuong).trim(), lop: r.lop == null ? null : chuoi(r.lop) })
    if (rows.length < 500) break
  }
  const phanCua = new Map(cau.map((c) => [c.qid, c.phan]))
  const soSongSinh = new Map()
  try {
    for (let offset = 0; ; offset += 500) {
      const rows = await query('SELECT lc.qid, b.song_sinh_json AS ss FROM loi_giai_cau lc JOIN cau_bo_tro b ON b.bam = lc.bam ORDER BY lc.qid LIMIT 500 OFFSET ?', [offset])
      for (const r of rows) {
        const ds = parsed(r.ss)
        const phan = phanCua.get(chuoi(r.qid)) ?? 'I'
        soSongSinh.set(chuoi(r.qid), Array.isArray(ds) ? ds.filter((ss) => songSinhDungDuoc(phan, ss)).length : 0)
      }
      if (rows.length < 500) break
    }
  } catch { /* chưa có bảng học liệu bổ trợ ⇒ không câu nào có song sinh */ }
  const thuMuc = new Map()
  try { for (const r of await query('SELECT ma_de, thu_muc FROM de_kho_thu_muc', [])) thuMuc.set(chuoi(r.ma_de), chuoi(r.thu_muc)) } catch { /* chưa có bảng ⇒ luật DH- */ }
  const suKien = { nv: 0, tc: 0, xt: 0, nvTheoCau: [] }
  try {
    const so = await query(`SELECT SUM(json_extract(raw_json,'$.nv') = 1) AS nv, SUM(json_extract(raw_json,'$.tc') IS NOT NULL) AS tc, SUM(json_extract(raw_json,'$.xt') = 1) AS xt
      FROM su_kien_hoc WHERE ngay_vn >= ? AND raw_json IS NOT NULL`, [tuNgay])
    suKien.nv = Number(so[0]?.nv) || 0; suKien.tc = Number(so[0]?.tc) || 0; suKien.xt = Number(so[0]?.xt) || 0
    suKien.nvTheoCau = (await query(`SELECT qid, COUNT(*) AS n FROM su_kien_hoc WHERE ngay_vn >= ? AND raw_json IS NOT NULL AND json_extract(raw_json,'$.nv') = 1 GROUP BY qid ORDER BY n DESC, qid LIMIT 30`, [tuNgay]))
      .map((r) => ({ qid: chuoi(r.qid), n: Number(r.n) || 0 }))
  } catch { /* sổ cũ chưa có raw_json */ }
  return { luc: new Date().toISOString(), chiDoc: true, tuNgay, soCauDaQuet: cau.length, ...tinhDoPhu(cau, soSongSinh, thuMuc), suKien }
}

async function chayTrenKhoThat() {
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim()
  const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim()
  if (!token || !account) throw new Error('Thiếu CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID (token chỉ cần quyền đọc D1)')
  if (/\s/.test(token) || !/^[0-9a-f]{32}$/i.test(account)) throw new Error('Cấu hình Cloudflare chưa được chuẩn hoá')
  const query = async (sql, params = []) => {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${DATABASE}/query`, {
      method: 'POST', signal: AbortSignal.timeout(30_000), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql, params }),
    })
    const j = await r.json()
    if (!r.ok || !j.success) throw new Error(`Không đọc được D1: HTTP ${r.status}; mã ${(j.errors ?? []).map((x) => x.code).join(',')}`)
    return j.result.flatMap((x) => x.results ?? [])
  }
  const kq = await docDoPhu(query)
  const i = process.argv.indexOf('--ra')
  if (i > 0 && process.argv[i + 1]) writeFileSync(process.argv[i + 1], JSON.stringify(kq, null, 2))
  console.log(JSON.stringify({ luc: kq.luc, soCauDaQuet: kq.soCauDaQuet, tong: kq.tong, suKien: { nv: kq.suKien.nv, tc: kq.suKien.tc, xt: kq.suKien.xt }, soChuong: kq.theoChuong.length }))
  for (const c of kq.theoChuong) console.log(`${c.chuong}\t${c.tong} câu\tsong sinh ${c.pctSongSinh}%\tanh em ${c.pctAnhEm}%\tkhông gì ${c.pctKhongGi}% (Phần III ${c.phanIII_khongGi})`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  chayTrenKhoThat().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1 })
}
