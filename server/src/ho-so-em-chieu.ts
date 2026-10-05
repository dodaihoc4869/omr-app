// HỒ SƠ MỘT EM CHO TỜ CHIẾU "GỌI LÊN BẢNG" (thầy chốt bản vẽ LenBang-Moi 28/09/2026).
//
// `POST /gv/ho-so-len-bang {sbd, qid}` — LỆNH THẦY, CHỈ ĐỌC, nằm SAU cổng `laThay` như mọi `/gv/*`. Không ghi gì.
// Thầy bấm THẺ TÊN trên tờ chiếu ⇒ bảng chi tiết trượt từ phải, hiện trên máy chiếu. Mọi con số ở đây là SỐ THẬT từ sổ:
//   · `cauNay`  — các lần em làm CHÍNH câu đang chiếu (sổ `su_kien_hoc`, mọi nguồn, bỏ sự kiện CHE): giờ, đúng/sai, có gợi ý,
//                 nguồn (Đảo / Đoàn / ca kiểm tra / lên bảng…), số giây, đáp án em chọn (khi sổ có — xem `chonCuaLan`);
//   · `ngay14`  — số lần đúng / sai từng ngày trong 14 ngày (giờ VN);
//   · `saiGanNhat` — 5 câu sai gần nhất (khác nhau), kèm tên dạng;
//   · `lenBang` — lịch sử lên bảng (bảng `len_bang`, nơi `ghiLenBang` ghi Đạt / Chưa đạt từ tờ chiếu);
//   · `caGanNhat` — hai ca kiểm tra gần nhất đã nộp (điểm lần này + lần trước);
//   · `dang`    — sức học theo dạng 30 ngày (tỉ lệ đúng; hạng L1–L4 mốc 40/65/85, cùng mốc bản vẽ);
//   · `chienDich` — chiến dịch đang theo (% cọ xát / thành thạo, nhịp) — tái dùng `docHoSo2` + `tiLeChienDich` + `nhipEm`;
//   · `em`      — đầu thẻ: tên, lớp, thần thú + cấp, EXP, chuỗi ngày (tái dùng `gvEmToanCanh`).
//   · `tienDoCap` — (hoàn thiện bản vẽ 28/09) thanh tiến độ EXP của thần thú: `{cap, exp, moc, toiDa}` = cấp hiện tại, EXP đã có TRONG thanh
//                 cấp này (`game_v2_profile.exp`) / mốc lên cấp sau (`thanhExp(cap)`, cùng đường cấp của game); cấp 120 ⇒ `moc: null`, `toiDa: true`.
//                 Em chưa chọn thú / chưa có hồ sơ game ⇒ VẮNG khoá. CHỈ ĐỌC.
// Khối nào đọc lỗi thì VẮNG khoá (màn hiện "—"), không bịa số, không làm hỏng cả lệnh.
//
// ĐÁP ÁN EM CHỌN: sổ `su_kien_hoc` có cột `raw_json` (migration-2309-cnh1-su-kien-chuan.sql, "JSON đáp án máy em gửi") nhưng
// trước 28/09 chưa nơi nào ghi. Từ 28/09 lượt nộp câu game ghi `{chon}` vào đó (`game-v2.ts`). Với dữ liệu cũ: câu game tra
// `game_v2_attempt.json.traLoi` theo `attempt_id`; ca kiểm tra tra `chi_tiet_cau.dap_an_chon`. Không có ⇒ `chon: null`.
import type { Env } from './kieu'
import { gvEmToanCanh } from './gv-hom-nay-v2'
import { docHoSo2, ngayVnCua } from './srs2-d1'
import { tiLeChienDich, soNgayGiua } from './srs2-loi'
import { mocNhip, nhipEm } from './srs2-gv'
import { thanhExp } from '../../src/game/than-thu-hoa-hoc/kinh-nghiem'

/** Tiến độ EXP trong cấp hiện tại từ JSON hồ sơ game (`game_v2_profile.json`). Chưa chọn thú / JSON hỏng ⇒ null. */
export function tienDoCapTuHoSo(json: unknown): { cap: number; exp: number; moc: number | null; toiDa: boolean } | null {
  try {
    const p = JSON.parse(str(json)) as { pet?: string; cap?: unknown; exp?: unknown; choice?: boolean }
    if (!p || p.choice === true || !p.pet) return null
    const cap = Math.max(1, Math.min(120, Math.floor(num(p.cap)) || 1))
    const exp = Math.max(0, Math.floor(num(p.exp)))
    if (cap >= 120) return { cap, exp, moc: null, toiDa: true }
    return { cap, exp, moc: thanhExp(cap), toiDa: false }
  } catch {
    return null
  }
}

type Row = Record<string, unknown>
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x))
const num = (x: unknown): number => (Number.isFinite(Number(x)) ? Number(x) : 0)

/** Mốc hạng theo tỉ lệ đúng (bản vẽ): < 40% L1 · < 65% L2 · ≤ 85% L3 · > 85% L4. */
export function hangTuTiLeDung(p: number): 'L1' | 'L2' | 'L3' | 'L4' {
  return p < 0.4 ? 'L1' : p < 0.65 ? 'L2' : p <= 0.85 ? 'L3' : 'L4'
}

/** Tên nguồn cho thầy đọc. Game: Đoàn Hộ Tống nếu lượt thuộc Đoàn, Bi-a nếu phiên Bi-a (29/09), còn lại Đảo. */
export function tenNguon(nguon: string, loaiGame: boolean | 'doan' | 'bia' | 'dao'): string {
  if (nguon === 'game') return loaiGame === true || loaiGame === 'doan' ? 'Đoàn' : loaiGame === 'bia' ? 'Bi-a' : 'Đảo'
  return ({ thi: 'Ca kiểm tra', len_bang: 'Lên bảng', dau_gio: 'Đầu giờ', btvn: 'Bài về nhà', btvn_lo: 'Bài về nhà', on_lai: 'Ôn lại', mom: 'Bài riêng', khac_phuc: 'Khắc phục', luyen: 'Luyện đề', thu_thach_rieng: 'Thử thách' } as Record<string, string>)[nguon] ?? nguon
}

/** Đáp án em chọn đọc từ `raw_json` (`{chon}` hoặc `{traLoi}`). */
function chonTuRaw(raw: unknown): string | null {
  if (!raw) return null
  try {
    const j = JSON.parse(str(raw)) as Row
    const c = str(j.chon ?? j.traLoi).trim()
    return c ? c.slice(0, 40) : null
  } catch {
    return null
  }
}

async function hoi(env: Env, sql: string, ...bind: unknown[]): Promise<Row[] | null> {
  try {
    return (await env.DB.prepare(sql).bind(...bind).all<Row>()).results ?? []
  } catch {
    return null
  }
}

const themNgayVn = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)

export async function gvHoSoLenBang(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Record<string, unknown>> {
  const sbd = str(b.sbd).trim()
  const qid = str(b.qid).trim()
  if (!sbd || sbd.length > 40) return { ok: false, error: 'Thiếu số báo danh' }
  if (qid.length > 120) return { ok: false, error: 'Mã câu quá dài' }
  const homNay = ngayVnCua(nowMs)

  // 1 · đầu thẻ (tái dùng toàn cảnh em — đã có tên, lớp, thần thú, EXP, chuỗi, ca gần nhất)
  const tc = await gvEmToanCanh(env, { sbd, loai: ['ca'] }, nowMs).catch(() => null)
  if (tc && tc.ok === false && str(tc.error) === 'Không tìm thấy học sinh') return { ok: false, error: 'Không tìm thấy học sinh' }
  const em = (tc && tc.ok ? (tc.em as Row) : null) ?? { sbd }
  const rTenLop = await hoi(env, 'SELECT ten_lop FROM hoc_sinh WHERE sbd = ?', sbd)
  const tenLop = str(rTenLop?.[0]?.ten_lop).trim()

  // 2 · CÂU NÀY: mọi lần làm của em với câu đang chiếu (cột chuẩn CNH-1.0 nếu có, không thì cột gốc)
  let cauNay: Row | undefined
  if (qid) {
    const rLan =
      (await hoi(env, 'SELECT luc, ket_qua, giay, nguon, ma_nguon, assistance, visibility, attempt_id, raw_json FROM su_kien_hoc WHERE sbd = ? AND qid = ? ORDER BY luc', sbd, qid)) ??
      (await hoi(env, 'SELECT luc, ket_qua, giay, nguon, ma_nguon FROM su_kien_hoc WHERE sbd = ? AND qid = ? ORDER BY luc', sbd, qid))
    if (rLan) {
      const lan = rLan.filter((x) => str(x.visibility) !== 'embargoed' && x.ket_qua !== null && x.ket_qua !== undefined)
      const idGame = lan.filter((x) => str(x.nguon) === 'game').map((x) => str(x.attempt_id) || `${str(x.ma_nguon)}|${qid}`)
      const phien = [...new Set(lan.filter((x) => str(x.nguon) === 'game').map((x) => str(x.ma_nguon)))]
      // 05/10: lượt BẢN XÁO (cau-anh-em.ts) lưu thêm `traLoiGoc` = đáp án em chọn quy về khung gốc — tờ chiếu so với câu gốc nên đọc khoá ấy trước.
      const rAtt = idGame.length ? await hoi(env, "SELECT id, COALESCE(json_extract(json, '$.traLoiGoc'), json_extract(json, '$.traLoi')) AS tra_loi FROM game_v2_attempt WHERE sbd = ? AND id IN (SELECT value FROM json_each(?))", sbd, JSON.stringify(idGame)) : []
      const rPhien = phien.length ? await hoi(env, "SELECT id, json_extract(json, '$.doan') IS NOT NULL AS doan, COALESCE(json_extract(json, '$.bia'), 0) AS bia FROM game_v2_session WHERE sbd = ? AND id IN (SELECT value FROM json_each(?))", sbd, JSON.stringify(phien)) : []
      const caThi = [...new Set(lan.filter((x) => str(x.nguon) === 'thi').map((x) => str(x.ma_nguon)))]
      const rCt = caThi.length ? await hoi(env, 'SELECT ma_ca, lan_thu, dap_an_chon FROM chi_tiet_cau WHERE sbd = ? AND qid = ? AND ma_ca IN (SELECT value FROM json_each(?))', sbd, qid, JSON.stringify(caThi)) : []
      const traLoi = new Map((rAtt ?? []).map((x) => [str(x.id), str(x.tra_loi)]))
      const laDoan = new Map((rPhien ?? []).map((x) => [str(x.id), num(x.doan) === 1 ? ('doan' as const) : num(x.bia) === 1 ? ('bia' as const) : ('dao' as const)]))
      const chonCa = new Map((rCt ?? []).map((x) => [str(x.ma_ca), str(x.dap_an_chon)]))
      const ds = lan.map((x) => {
        const nguon = str(x.nguon)
        const chon =
          chonTuRaw(x.raw_json) ??
          (nguon === 'game' ? traLoi.get(str(x.attempt_id) || `${str(x.ma_nguon)}|${qid}`) || null : null) ??
          (nguon === 'thi' ? chonCa.get(str(x.ma_nguon)) || null : null)
        return {
          luc: str(x.luc),
          dung: num(x.ket_qua) === 1,
          coGoiY: str(x.assistance) === 'assisted',
          nguon: tenNguon(nguon, laDoan.get(str(x.ma_nguon)) ?? 'dao'),
          giay: x.giay === null || x.giay === undefined ? null : num(x.giay),
          chon,
        }
      })
      const soDung = ds.filter((x) => x.dung).length
      cauNay = { qid, soLan: ds.length, soDung, soSai: ds.length - soDung, lan: ds.slice(-12) }
    }
  }

  // 3 · đúng / sai 14 ngày
  const d13 = themNgayVn(homNay, -13)
  const r14 = await hoi(env, 'SELECT ngay_vn, SUM(CASE WHEN ket_qua = 1 THEN 1 ELSE 0 END) AS d, SUM(CASE WHEN ket_qua = 0 THEN 1 ELSE 0 END) AS s FROM su_kien_hoc WHERE sbd = ? AND ngay_vn >= ? AND ngay_vn <= ? GROUP BY ngay_vn', sbd, d13, homNay)
  const m14 = new Map((r14 ?? []).map((x) => [str(x.ngay_vn), { dung: num(x.d), sai: num(x.s) }]))
  const ngay14 = r14 ? Array.from({ length: 14 }, (_, i) => { const ngay = themNgayVn(d13, i); return { ngay, ...(m14.get(ngay) ?? { dung: 0, sai: 0 }) } }) : null

  // 4 · 5 câu sai gần nhất (khác nhau) + tên dạng
  const rSai = await hoi(env, 'SELECT qid, luc, nguon, ma_dang FROM su_kien_hoc WHERE sbd = ? AND ket_qua = 0 ORDER BY luc DESC LIMIT 60', sbd)
  const saiDs: Row[] = []
  for (const x of rSai ?? []) if (!saiDs.some((y) => y.qid === x.qid) && saiDs.length < 5) saiDs.push(x)

  // 5 · sức học theo dạng (30 ngày)
  const d29 = themNgayVn(homNay, -29)
  const rDang = await hoi(env, "SELECT ma_dang, COUNT(*) AS n, SUM(CASE WHEN ket_qua = 1 THEN 1 ELSE 0 END) AS d FROM su_kien_hoc WHERE sbd = ? AND ngay_vn >= ? AND ket_qua IS NOT NULL AND ma_dang IS NOT NULL AND ma_dang <> '' GROUP BY ma_dang ORDER BY n DESC LIMIT 6", sbd, d29)
  const maDang = [...new Set([...(rDang ?? []).map((x) => str(x.ma_dang)), ...saiDs.map((x) => str(x.ma_dang))].filter(Boolean))]
  const rTen = maDang.length ? await hoi(env, "SELECT dang AS ma, MIN(json_extract(json, '$.tenDang')) AS ten FROM game_v2_question WHERE dang IN (SELECT value FROM json_each(?)) GROUP BY dang", JSON.stringify(maDang)) : []
  const tenDang = new Map((rTen ?? []).filter((x) => str(x.ten)).map((x) => [str(x.ma), str(x.ten)]))
  const tenCua = (ma: string) => tenDang.get(ma) ?? ma.replace(/^CD:/, '')

  // 6 · lịch sử lên bảng + 7 · hai ca gần nhất
  const rLb = await hoi(env, 'SELECT qid, dat, luc FROM len_bang WHERE sbd = ? ORDER BY luc DESC LIMIT 8', sbd)
  const rCa = await hoi(env, "SELECT l.tong, l.ma_ca, l.nop_luc, COALESCE(c.ten_ca, '') AS ten_ca FROM luot l LEFT JOIN ca c ON c.ma_ca = l.ma_ca WHERE l.sbd = ? AND l.nop_luc IS NOT NULL AND l.tong IS NOT NULL AND l.ma_ca NOT LIKE 'BTVN%' ORDER BY l.nop_luc DESC LIMIT 2", sbd)

  // 7b · thanh tiến độ EXP của thần thú (cấp · EXP trong thanh / mốc cấp sau)
  const rHoSoGame = await hoi(env, 'SELECT json FROM game_v2_profile WHERE sbd = ?', sbd)
  const tienDoCap = rHoSoGame?.[0] ? tienDoCapTuHoSo(rHoSoGame[0].json) : null

  // 8 · chiến dịch đang theo
  let chienDich: Row | null = null
  try {
    const hs = await docHoSo2(env, sbd, homNay)
    const cd = hs.chienDich
    if (cd) {
      const tl = tiLeChienDich(hs.ttChienDich)
      const moc = mocNhip(cd.taoLuc, cd.hanNop, homNay)
      const ngayCuoi = hs.ttChienDich.flatMap((t) => t.lichSu.map((l) => l.ngay)).sort().pop() ?? null
      const tre = Math.max(0, soNgayGiua(ngayCuoi ?? moc.ngayGiao, homNay) - 1)
      const tong = Math.max(1, tl.tong)
      chienDich = { ten: cd.ten, hanNop: cd.hanNop, coXat: tl.coXat / tong, thanhThao: tl.thanhThao / tong, nhip: nhipEm(tre, tl.coXat / tong, moc.mucCanHomNay), soNgayTre: tre }
    }
  } catch {
    chienDich = null
  }

  return {
    ok: true,
    em: { ...em, ...(tenLop ? { tenLop } : {}) },
    ...(cauNay ? { cauNay } : {}),
    ...(ngay14 ? { ngay14 } : {}),
    ...(rSai ? { saiGanNhat: saiDs.map((x) => ({ qid: str(x.qid), luc: str(x.luc), nguon: tenNguon(str(x.nguon), false), dang: x.ma_dang ? tenCua(str(x.ma_dang)) : null })) } : {}),
    ...(rDang ? { dang: rDang.map((x) => { const n = num(x.n), p = n ? num(x.d) / n : 0; return { ten: tenCua(str(x.ma_dang)), soLan: n, tiLe: p, hang: hangTuTiLeDung(p) } }) } : {}),
    ...(rLb ? { lenBang: rLb.map((x) => ({ qid: str(x.qid), dat: num(x.dat) === 1, luc: str(x.luc) })) } : {}),
    ...(rCa && rCa[0] ? { caGanNhat: { diem: num(rCa[0].tong), tenCa: str(rCa[0].ten_ca) || `Ca ${str(rCa[0].ma_ca)}`, luc: str(rCa[0].nop_luc), ...(rCa[1] ? { diemTruoc: num(rCa[1].tong) } : {}) } } : {}),
    ...(tienDoCap ? { tienDoCap } : {}),
    chienDich,
  }
}
