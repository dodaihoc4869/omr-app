// `POST /gv/buoi-chua-de-xuat {ngay?, lop?}` — SỐ LIỆU THÔ cho "Buổi chữa tối nay (đã xếp sẵn)" (B6). Hợp đồng: docs/hop-dong-buoi-chua-de-xuat-2109.md (Code 3 ↔ Code 1, 21/09/2026).
// ĐỌC-CHỈ (không ghi, không bảng mới, không cron — giai đoạn 1: tính khi thầy mở màn), ≤ 12 truy vấn D1. Máy chủ chỉ GOM số liệu; ngưỡng, xếp câu, ước phút, lý do bằng số là của hàm thuần
// `src/lib/buoi-chua-de-xuat.ts` (Code 1). Không nhãn năng lực; tên em chỉ ở lệnh thầy (sau cổng `laThay`).
//   · `dangCaLopYeu`  dạng cả lớp yếu THEO HỒ SƠ (`dangYeu` của `nam_kt_dang`): mỗi lớp ≤ 8 dạng có ≥ 3 em yếu; `lop` = TÊN LỚP hiệu lực (docs/hop-dong-ten-lop-2109.md), kèm `khoi` và `siSo`;
//   · `dangBoNao`     dòng `ca_lop` của bản tin Bộ não gần nhất tới `ngay` (dạng cả lớp yếu theo Bộ não; chưa có số riêng);
//   · `cauSaiNhieu`   câu nhiều em sai trong 3 ngày tới `ngay`, MỌI nguồn sổ, chỉ tính lượt ĐÃ CHẤM (`ket_qua` có giá trị) — ≥ 3 em sai VÀ ≥ 30 % em làm sai, ≤ 40 câu — ĐÃ LỌC câu tự luận (cấm rút tự luận — kênh tự động) và câu thuộc đề thi ĐANG BẢO VỆ;
//     `loi` = câu cốt lõi của một bài tập về nhà đang có (`btvn_cau.loi = 1`);
//   · `dongBoNao`     dòng bản tin có `hanhDong` = `goi_len_bang` | `dua_vao_buoi_chua` (em + dạng do Bộ não gợi ý);
//   · `soEmCoSo3Ngay` số em có sổ học trong 3 ngày (dưới 5 ⇒ hàm thuần ẩn thẻ, không bịa).
// `lop` trong thân yêu cầu: khớp TÊN LỚP hoặc KHỐI của em (vd "12 - Tinh Hoa" hay "12"). Thiếu khối nào ⇒ khối đó vắng + `lyDoThieu` (không bịa).
import type { Env } from './kieu'
import { dangYeu, themNgay, type NamKtDang } from './ho-so-nam-kt'
import { protectedQuestions } from './game-v2-bank'
import { jsonLaTuLuan } from './cam-tu-luan'
import { tenCuaCacDang } from './ten-dang-bo-nao'
import { docBangTenLop, tenLopCuaEm } from './ten-lop'

type Dong = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
const so = (v: unknown): number => Number(v) || 0
const json = (v: unknown): string => JSON.stringify(v)
const DANG_NGAY = /^\d{4}-\d{2}-\d{2}$/
const GIO_VN_MS = 7 * 3_600_000

export const SO_NGAY_CAU_SAI = 3
export const SAN_SO_EM_SAI = 3
/** ≥ 30 % em làm câu ấy làm sai: so_sai × 10 ≥ so_em × 3. */
export const SAN_TI_LE_SAI_CHUC = 3
export const TOI_DA_CAU = 40
export const TOI_DA_DANG_MOI_LOP = 8
export const SAN_SO_EM_YEU_DANG = 3
export const HANH_DONG_BUOI_CHUA = ['goi_len_bang', 'dua_vao_buoi_chua'] as const

function boDem(env: Env) {
  let n = 0
  return {
    dem: () => n,
    /** Một lệnh bên ngoài (đọc đề bảo vệ, đọc tên lớp) cũng tính vào ngân sách truy vấn. */
    tinh: () => { n++ },
    async hoi(sql: string, ...bind: unknown[]): Promise<Dong[] | null> {
      n++
      try {
        return ((await env.DB.prepare(sql).bind(...bind).all<Dong>()).results ?? []) as Dong[]
      } catch (e) {
        console.error('[buoi-chua-de-xuat] truy vấn lỗi (khối liên quan vắng):', e instanceof Error ? e.message : e, sql.replace(/\s+/g, ' ').slice(0, 70))
        return null
      }
    },
  }
}

export async function gvBuoiChuaDeXuat(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Dong> {
  const ngayXin = chuoi(b.ngay)
  if (ngayXin && !DANG_NGAY.test(ngayXin)) return { ok: false, error: 'Ngày phải có dạng YYYY-MM-DD.' }
  const ngay = ngayXin || new Date(nowMs + GIO_VN_MS).toISOString().slice(0, 10)
  const lopLoc = chuoi(b.lop)
  const d3 = themNgay(ngay, -(SO_NGAY_CAU_SAI - 1))
  const Q = boDem(env)
  const lyDoThieu: Record<string, string> = {}

  // 1 · em (hoc_sinh ưu tiên, danh_sach bổ sung) + tên lớp
  const rEm = await Q.hoi("SELECT sbd, ho_ten, lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, 0 AS uu FROM danh_sach")
  if (!rEm) return { ok: false, error: 'Không đọc được danh sách học sinh', soTruyVan: Q.dem() }
  Q.tinh()
  const tenLop = await docBangTenLop(env)
  const em = new Map<string, { hoTen: string; khoi: string; lop: string }>()
  for (const x of [...rEm].sort((a, c) => so(c.uu) - so(a.uu))) {
    const sbd = chuoi(x.sbd)
    if (!sbd) continue
    if (em.get(sbd)?.hoTen) continue // hồ sơ (đã xếp trước) thắng danh sách cổng
    const khoi = chuoi(x.lop)
    em.set(sbd, { hoTen: chuoi(x.ho_ten), khoi, lop: tenLopCuaEm(khoi, tenLop?.get(sbd)) })
  }
  const trongLop = (e: { khoi: string; lop: string }): boolean => !lopLoc || e.lop === lopLoc || e.khoi === lopLoc
  const dsSbd = [...em].filter(([, e]) => trongLop(e)).map(([s]) => s)
  const siSoLop = new Map<string, number>()
  const khoiCuaLop = new Map<string, string>()
  for (const [, e] of em) {
    if (!trongLop(e)) continue
    siSoLop.set(e.lop, (siSoLop.get(e.lop) ?? 0) + 1)
    if (!khoiCuaLop.has(e.lop)) khoiCuaLop.set(e.lop, e.khoi)
  }

  // 2 · dạng cả lớp yếu theo hồ sơ
  const rDang = await Q.hoi('SELECT sbd, ma_dang, so_gap, so_sai, so_da_khac_phuc, so_moi_sai, so_chua_thay_sai, bac, moc_on_ke, moc_moi_sai FROM nam_kt_dang')
  if (!rDang) lyDoThieu.dangCaLopYeu = 'Không đọc được hồ sơ dạng'
  const yeuTheoLop = new Map<string, Map<string, number>>() // lớp → mã dạng → số em yếu
  for (const x of rDang ?? []) {
    const sbd = chuoi(x.sbd)
    const e = em.get(sbd)
    if (!e || !trongLop(e)) continue
    const d = {
      sbd, maDang: chuoi(x.ma_dang), soGap: so(x.so_gap), soSai: so(x.so_sai), soDaKhacPhuc: so(x.so_da_khac_phuc), soMoiSai: so(x.so_moi_sai), soChuaThaySai: so(x.so_chua_thay_sai), bac: so(x.bac),
      mocOnKe: x.moc_on_ke ? chuoi(x.moc_on_ke) : null, mocMoiSai: x.moc_moi_sai ? chuoi(x.moc_moi_sai) : null,
    } as NamKtDang
    if (!dangYeu(d, ngay)) continue
    const m = yeuTheoLop.get(e.lop) ?? new Map<string, number>()
    m.set(d.maDang, (m.get(d.maDang) ?? 0) + 1)
    yeuTheoLop.set(e.lop, m)
  }

  // 3 · bản tin Bộ não gần nhất (tới `ngay`)
  const rBt = await Q.hoi('SELECT ngay, json FROM ai_ban_tin WHERE ngay <= ? ORDER BY ngay DESC LIMIT 1', ngay)
  let cacDong: Dong[] = []
  try {
    const o = rBt?.[0] ? (JSON.parse(chuoi(rBt[0].json)) as { cacDong?: Dong[] }) : {}
    cacDong = Array.isArray(o.cacDong) ? o.cacDong : []
  } catch {
    cacDong = []
  }

  // 4 · số em có sổ 3 ngày + câu nhiều em sai (GROUP BY qid)
  const rSo = dsSbd.length > 0
    ? await Q.hoi('SELECT COUNT(DISTINCT sbd) AS n FROM su_kien_hoc WHERE ngay_vn >= ? AND ngay_vn <= ? AND sbd IN (SELECT value FROM json_each(?))', d3, ngay, json(dsSbd))
    : []
  const rCau = dsSbd.length > 0
    ? await Q.hoi(
      `SELECT qid, MIN(ma_dang) AS dang, COUNT(DISTINCT CASE WHEN ket_qua IS NOT NULL THEN sbd END) AS so_em, COUNT(DISTINCT CASE WHEN ket_qua = 0 THEN sbd END) AS so_sai
         FROM su_kien_hoc WHERE ngay_vn >= ? AND ngay_vn <= ? AND sbd IN (SELECT value FROM json_each(?))
        GROUP BY qid HAVING so_sai >= ? AND so_sai * 10 >= so_em * ? ORDER BY so_sai DESC, qid LIMIT ${TOI_DA_CAU * 2}`,
      d3, ngay, json(dsSbd), SAN_SO_EM_SAI, SAN_TI_LE_SAI_CHUC,
    )
    : []
  if (!rCau) lyDoThieu.cauSaiNhieu = 'Không đọc được sổ học'

  // 5 · nội dung câu (mã đề, dạng, nhóm nội dung) để LỌC tự luận / đề đang bảo vệ
  const qids = (rCau ?? []).map((x) => chuoi(x.qid))
  const rNoiDung = qids.length > 0
    ? await Q.hoi('SELECT q.qid, q.ma_de, q.content_group, q.dang, q.json FROM game_v2_question q WHERE q.qid IN (SELECT value FROM json_each(?))', json(qids))
    : []
  const noiDung = new Map<string, Dong>()
  for (const x of rNoiDung ?? []) if (!noiDung.has(chuoi(x.qid))) noiDung.set(chuoi(x.qid), x)
  let baoVe: Set<string> | null = null
  if (qids.length > 0) {
    Q.tinh()
    try {
      baoVe = await protectedQuestions(env)
    } catch {
      lyDoThieu.cauSaiNhieu = 'Không kiểm được đề thi đang bảo vệ'
    }
  } else {
    baoVe = new Set()
  }
  if (!rNoiDung) lyDoThieu.cauSaiNhieu = 'Không đọc được kho câu'

  const giu = baoVe === null || !rNoiDung ? [] : (rCau ?? []).filter((x) => {
    const q = chuoi(x.qid)
    const nd = noiDung.get(q)
    if (!nd) return false // không tra được nội dung câu ⇒ không đề xuất (không bịa)
    if (baoVe!.has(q) || baoVe!.has(chuoi(nd.content_group))) return false // đề thi đang bảo vệ
    if (jsonLaTuLuan(nd.json)) return false // CẤM RÚT TỰ LUẬN (kênh tự động)
    return true
  }).slice(0, TOI_DA_CAU)

  // 6 · em sai từng câu đã giữ + câu cốt lõi của bài tập về nhà
  const dsQidGiu = giu.map((x) => chuoi(x.qid))
  const rSai = giu.length > 0
    ? await Q.hoi("SELECT qid, sbd FROM su_kien_hoc WHERE ket_qua = 0 AND ngay_vn >= ? AND ngay_vn <= ? AND qid IN (SELECT value FROM json_each(?)) AND sbd IN (SELECT value FROM json_each(?)) GROUP BY qid, sbd",
      d3, ngay, json(dsQidGiu), json(dsSbd))
    : []
  const emSaiTheoCau = new Map<string, string[]>()
  for (const x of rSai ?? []) emSaiTheoCau.set(chuoi(x.qid), [...(emSaiTheoCau.get(chuoi(x.qid)) ?? []), chuoi(x.sbd)])
  const rLoi = giu.length > 0
    ? await Q.hoi('SELECT DISTINCT c.qid FROM btvn_cau c JOIN btvn b ON b.ma_btvn = c.ma_btvn WHERE c.loi = 1 AND b.da_xoa = 0 AND c.qid IN (SELECT value FROM json_each(?))', json(dsQidGiu))
    : []
  const loi = new Set((rLoi ?? []).map((x) => chuoi(x.qid)))

  // 7 · tên dạng
  const dongBoNao = cacDong.filter((d) => (HANH_DONG_BUOI_CHUA as readonly string[]).includes(chuoi(d.hanhDong)) && em.has(chuoi(d.sbd)) && trongLop(em.get(chuoi(d.sbd))!))
  const dangBoNao = cacDong.filter((d) => chuoi(d.loai) === 'ca_lop')
  const maDang = [
    ...[...yeuTheoLop.values()].flatMap((m) => [...m.keys()]),
    ...giu.map((x) => chuoi(noiDung.get(chuoi(x.qid))?.dang) || chuoi(x.dang)),
    ...dongBoNao.map((d) => chuoi(d.dang)), ...dangBoNao.map((d) => chuoi(d.dang)),
  ].filter(Boolean)
  Q.tinh()
  const ten = await tenCuaCacDang(env, maDang)
  const cotTen = (ma: string) => (ten.has(ma) ? { tenDang: ten.get(ma) } : {})

  const cauSaiNhieu = giu.map((x) => {
    const q = chuoi(x.qid)
    const nd = noiDung.get(q)
    const dang = chuoi(nd?.dang) || chuoi(x.dang)
    const soEmLam = so(x.so_em)
    const soEmSai = so(x.so_sai)
    const phan = q.match(/-(III|II|I)-\d+$/)?.[1] ?? ''
    return {
      qid: q, maDe: chuoi(nd?.ma_de) || q.replace(/-(III|II|I)-\d+$/, ''), phan, ...(dang ? { dang, ...cotTen(dang) } : {}),
      soEmLam, soEmSai, tiLeSai: soEmLam > 0 ? Math.round((soEmSai / soEmLam) * 1000) / 1000 : 0, loi: loi.has(q),
      emSai: (emSaiTheoCau.get(q) ?? []).sort().map((s) => ({ sbd: s, hoTen: em.get(s)?.hoTen ?? '', lop: em.get(s)?.lop ?? '' })),
    }
  })
  const dangCaLopYeu = [...yeuTheoLop].sort((a, c) => (a[0] < c[0] ? -1 : 1)).map(([lop, m]) => ({
    lop, khoi: khoiCuaLop.get(lop) ?? '', siSo: siSoLop.get(lop) ?? 0,
    dang: [...m].filter(([, n]) => n >= SAN_SO_EM_YEU_DANG).sort((a, c) => c[1] - a[1] || (a[0] < c[0] ? -1 : 1)).slice(0, TOI_DA_DANG_MOI_LOP)
      .map(([ma, n]) => ({ ma, ten: ten.get(ma) ?? ma.replace(/^CD:/, ''), soEmYeu: n })),
  })).filter((l) => l.dang.length > 0)

  return {
    ok: true, ngay, ...(lopLoc ? { lop: lopLoc } : {}),
    soEmCoSo3Ngay: so(rSo?.[0]?.n),
    dangCaLopYeu,
    dangBoNao: dangBoNao.map((d) => ({ dang: chuoi(d.dang), ...(chuoi(d.dang) ? cotTen(chuoi(d.dang)) : {}), chu: chuoi(d.chu) })),
    cauSaiNhieu,
    dongBoNao: dongBoNao.map((d) => ({
      sbd: chuoi(d.sbd), hoTen: em.get(chuoi(d.sbd))?.hoTen ?? '', lop: em.get(chuoi(d.sbd))?.lop ?? '', hanhDong: chuoi(d.hanhDong),
      ...(chuoi(d.dang) ? { dang: chuoi(d.dang), ...cotTen(chuoi(d.dang)) } : {}), chu: chuoi(d.chu),
    })),
    ...(Object.keys(lyDoThieu).length > 0 ? { lyDoThieu } : {}),
    soTruyVan: Q.dem(),
  }
}
