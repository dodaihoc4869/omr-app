// ĐỔI SỐ BÁO DANH MỘT EM (thầy 05/10: "Đỗ Duy Phong 100042 → 10048"). Chỉ thầy.
// Dữ liệu của em gắn SBD ở rất nhiều bảng (đăng ký, lượt thi, sổ học, game, học phí, mật khẩu…) và đôi khi nằm TRONG chuỗi
// (khoá ghép "ca|sbd|lần", JSON danh sách / bản đồ theo em) ⇒ quét MỌI bảng, MỌI cột chữ:
//   · ô đúng bằng SBD cũ ⇒ đổi thẳng;
//   · ô chứa SBD cũ như một "số riêng" (trước/sau không phải chữ số) ⇒ thay đúng chỗ đó — "1000420" hay "2100042" không bị đụng.
// An toàn: `chayThat` vắng ⇒ CHỈ ĐẾM (chạy thử); từ chối khi SBD mới đã có dữ liệu ở bất kỳ đâu, hoặc đang có ca thi mở.
// Dữ liệu thật lớn (một lượt quét mọi cột > 120 giây) ⇒ `lietKeCot: true` trả danh sách bảng.cột; `cot: "bang.cot"` chỉ làm MỘT cột.
// Nơi gọi phải chạy thử ĐỦ mọi cột (không cột nào vướng) rồi mới chạy thật từng cột.
import type { Env } from './kieu'

type Obj = Record<string, unknown>
const SBD_HOP_LE = /^\d{4,8}$/
const LO_GHI = 50

export interface DongDoiSbd { bang: string; cot: string; dung: number; nhung: number }

const tenAnToan = (s: string) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(s)
const cotChu = (kieu: string) => { const k = kieu.toUpperCase(); return k === '' || k.includes('CHAR') || k.includes('TEXT') || k.includes('CLOB') }

/** Thay SBD cũ khi nó đứng riêng (không dính chữ số hai bên). */
export function thayTrongChuoi(s: string, cu: string, moi: string): string {
  return s.replace(new RegExp(`(?<![0-9])${cu}(?![0-9])`, 'g'), moi)
}

async function cacCot(env: Env, chiBang?: string): Promise<{ bang: string; cot: string }[]> {
  // MỘT câu cho cả kho (dữ liệu thật ~250 bảng / 845 cột: gọi pragma từng bảng mất 2–3 phút); hỏng ⇒ lùi về từng bảng.
  const loc = "m.type = 'table' AND m.name NOT LIKE 'sqlite_%' AND m.name NOT LIKE '_cf_%' AND m.name NOT LIKE 'd1_%'" + (chiBang ? ' AND m.name = ?' : '')
  const ra: { bang: string; cot: string }[] = []
  const nhan = (rows: Obj[]) => { for (const r of rows) { const t = String(r.bang ?? ''), n = String(r.cot ?? ''); if (tenAnToan(t) && tenAnToan(n) && cotChu(String(r.kieu ?? ''))) ra.push({ bang: t, cot: n }) } }
  try {
    const q = env.DB.prepare(`SELECT m.name AS bang, p.name AS cot, p.type AS kieu FROM sqlite_master m JOIN pragma_table_info(m.name) p WHERE ${loc} ORDER BY m.name, p.cid`)
    nhan((await (chiBang ? q.bind(chiBang) : q).all<Obj>()).results ?? [])
    return ra
  } catch { /* lùi về từng bảng */ }
  const q = env.DB.prepare(`SELECT m.name AS name FROM sqlite_master m WHERE ${loc}`)
  const bang = (await (chiBang ? q.bind(chiBang) : q).all<Obj>()).results ?? []
  for (const b of bang) {
    const t = String(b.name ?? '')
    if (!tenAnToan(t)) continue
    const cot = (await env.DB.prepare(`SELECT name, type FROM pragma_table_info('${t}')`).all<Obj>()).results ?? []
    nhan(cot.map((c) => ({ bang: t, cot: c.name, kieu: c.type })))
  }
  return ra
}

export async function doiSbd(env: Env, b: Obj): Promise<Obj> {
  const cu = String(b.cu ?? '').trim(), moi = String(b.moi ?? '').trim()
  if (!SBD_HOP_LE.test(cu) || !SBD_HOP_LE.test(moi)) return { ok: false, error: 'Số báo danh phải là 4–8 chữ số' }
  if (cu === moi) return { ok: false, error: 'Số báo danh mới trùng số cũ' }
  const caMo = await env.DB.prepare("SELECT ma_ca FROM ca WHERE trang_thai = 'mo' LIMIT 1").first<Obj>().catch(() => null)
  if (caMo) return { ok: false, error: `Đang có ca thi mở (${String(caMo.ma_ca)}) — đổi số báo danh sau khi đóng ca` }
  const chon = String(b.cot ?? '').trim()
  const tatCa = await cacCot(env, chon && b.lietKeCot !== true ? chon.split('.')[0] : undefined)
  if (b.lietKeCot === true) return { ok: true, cot: tatCa.map((x) => `${x.bang}.${x.cot}`) }
  const cot = chon ? tatCa.filter((x) => `${x.bang}.${x.cot}` === chon) : tatCa
  if (chon && cot.length === 0) return { ok: false, error: `Không có cột ${chon}` }
  const bang: DongDoiSbd[] = []
  const vuong: string[] = []
  for (const { bang: t, cot: c } of cot) {
    const e = `CAST("${c}" AS TEXT)`
    const r = await env.DB.prepare(
      `SELECT SUM(CASE WHEN ${e} = ?1 THEN 1 ELSE 0 END) AS dung, SUM(CASE WHEN ${e} <> ?1 AND instr(${e}, ?1) > 0 THEN 1 ELSE 0 END) AS chua,
              SUM(CASE WHEN ${e} = ?2 THEN 1 ELSE 0 END) AS moi FROM "${t}" WHERE instr(${e}, ?1) > 0 OR ${e} = ?2`,
    ).bind(cu, moi).first<Obj>()
    if (Number(r?.moi ?? 0) > 0) vuong.push(`${t}.${c}`)
    const dung = Number(r?.dung ?? 0)
    let nhung = 0
    if (Number(r?.chua ?? 0) > 0) {
      const ds = (await env.DB.prepare(`SELECT ${e} AS v FROM "${t}" WHERE ${e} <> ? AND instr(${e}, ?) > 0`).bind(cu, cu).all<Obj>()).results ?? []
      nhung = ds.filter((x) => thayTrongChuoi(String(x.v), cu, moi) !== String(x.v)).length
    }
    if (dung + nhung > 0) bang.push({ bang: t, cot: c, dung, nhung })
  }
  if (vuong.length) return { ok: false, error: `Số báo danh ${moi} đã có dữ liệu — không đổi để tránh trộn hai em`, vuong, bang }
  if (b.chayThat !== true) return { ok: true, chayThu: true, bang }
  let soO = 0
  for (const d of bang) {
    const e = `CAST("${d.cot}" AS TEXT)`
    if (d.dung > 0) {
      const r = await env.DB.prepare(`UPDATE "${d.bang}" SET "${d.cot}" = ? WHERE ${e} = ?`).bind(moi, cu).run()
      soO += Number(r.meta?.changes ?? 0)
    }
    if (d.nhung > 0) {
      const ds = (await env.DB.prepare(`SELECT rowid AS id, ${e} AS v FROM "${d.bang}" WHERE ${e} <> ? AND instr(${e}, ?) > 0`).bind(moi, cu).all<Obj>()).results ?? []
      const lenh = ds
        .map((x) => ({ id: x.id, v: String(x.v), m: thayTrongChuoi(String(x.v), cu, moi) }))
        .filter((x) => x.m !== x.v)
        .map((x) => env.DB.prepare(`UPDATE "${d.bang}" SET "${d.cot}" = ? WHERE rowid = ?`).bind(x.m, x.id))
      for (let i = 0; i < lenh.length; i += LO_GHI) {
        const kq = await env.DB.batch(lenh.slice(i, i + LO_GHI))
        for (const k of kq) soO += Number(k.meta?.changes ?? 0)
      }
    }
  }
  return { ok: true, chayThu: false, bang, soO }
}
