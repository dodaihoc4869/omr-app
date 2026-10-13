// Chỉ đọc D1 thật, chỉ xuất số tổng hợp theo lớp/bài; không xuất danh tính hoặc đáp án.
import { laCauTuLuan, laMaDeTuLuan } from '../src/lib/cau-tu-luan'
import { khoiCuaLop, cauHopKhoi } from '../src/lib/khoi-cau'

const token = process.env.CLOUDFLARE_API_TOKEN?.trim()
const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim()
if (!token || !account) throw new Error('Thiếu cấu hình Cloudflare.')
type Row = Record<string, any>
async function doc(sql: string, params: unknown[] = []): Promise<Row[]> {
  if (!/^\s*(SELECT|WITH)\b/i.test(sql) || /\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|REPLACE|TRUNCATE)\b/i.test(sql)) throw new Error('Phép đo chỉ đọc.')
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ sql, params }), signal: AbortSignal.timeout(30000),
  })
  const j = await r.json() as { success?: boolean; result?: { success: boolean; results: Row[] }[] }
  if (!r.ok || !j.success || !j.result?.[0]?.success) throw new Error(`Không đọc được số liệu (${r.status}).`)
  return j.result[0].results
}
const mang = (x: unknown): string[] => { const a = typeof x === 'string' ? JSON.parse(x) : x; if (!Array.isArray(a)) throw new Error('Phạm vi bài không hợp lệ.'); return a.map(String) }
const goc = (m: string) => m.trim().replace(/-(TN|DS|TLN)$/, '')
const coTheGiao = (m: string) => !laMaDeTuLuan(m) && !/(?:^|-)(?:VDMH|DTTT)(?:-|$)/i.test(m)
async function phamVi() {
  const [tick, truoc] = await Promise.all([
    doc('SELECT lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc FROM bai_da_day WHERE bo_tick_luc IS NULL ORDER BY lop,vi_tri,tick_luc'),
    doc('SELECT lop,khoa_bai,ten_bai,vi_tri,ma_de_json FROM pham_vi_lop ORDER BY lop,vi_tri,khoa_bai'),
  ])
  return { tick, truoc }
}
console.log(JSON.stringify({ kiemCaTruocPhatHanh: true, chiDoc: true, luc: new Date().toISOString(), ...(await doc("SELECT COUNT(*) soCaMo FROM ca WHERE trang_thai='mo'"))[0] }))
const dau = await phamVi()
const lop = [...new Set(dau.tick.map(r => String(r.lop)))].sort()
const phamViLop = lop.map(l => {
  const tick = dau.tick.filter(r => r.lop === l), xa = Math.max(...tick.map(r => Number(r.vi_tri)))
  const daTick = new Set(tick.map(r => r.khoa_bai))
  const bai = [...tick.map(r => ({ ...r, mas: mang(r.ma_to_json) })), ...dau.truoc.filter(r => r.lop === l && Number(r.vi_tri) < xa && !daTick.has(r.khoa_bai)).map(r => ({ ...r, mas: mang(r.ma_de_json) }))]
    .sort((a, b) => Number(a.vi_tri) - Number(b.vi_tri) || String(a.khoa_bai).localeCompare(String(b.khoa_bai)))
  const moi = [...tick].sort((a, b) => String(b.tick_luc).localeCompare(String(a.tick_luc)) || Number(b.vi_tri) - Number(a.vi_tri))[0]!
  const toBai = new Map<string, string>()
  for (const b of bai) for (const m of b.mas) if (coTheGiao(m)) { const ma = goc(m); if (ma && !toBai.has(ma)) toBai.set(ma, b.khoa_bai) }
  return { lop: l, bai, moi, toBai, toMoi: new Set(mang(moi.ma_to_json).filter(coTheGiao).map(goc)) }
})
const to = [...new Set(phamViLop.flatMap(p => [...p.toBai.keys()]))].sort(), khoaTo = JSON.stringify(to)
const soRaw = Number((await doc('SELECT COUNT(*) n FROM game_v2_question WHERE ma_de IN(SELECT value FROM json_each(?))', [khoaTo]))[0]?.n ?? 0)
const qs: Row[] = []
// Lô nhỏ để không tải toàn bộ kho lên D1/Worker trong một lần; chỉ hai lượt đọc song song.
for (let i = 0; i < soRaw; i += 800) {
  const rs = await Promise.all([i, i + 400].filter(n => n < soRaw).map(n => doc(`SELECT q.qid,q.ma_de,q.version,q.dang,q.json,d.lop lop_to,
    COALESCE(d.da_xoa,0) da_xoa,EXISTS(SELECT 1 FROM game_v2_index gi WHERE gi.ma_de=q.ma_de AND gi.source_version=d.cap_nhat_luc) dung_chi_muc
    FROM game_v2_question q LEFT JOIN de_kho d ON d.ma_de=q.ma_de
    WHERE q.ma_de IN(SELECT value FROM json_each(?)) ORDER BY q.qid LIMIT 400 OFFSET ?`, [khoaTo, n])))
  qs.push(...rs.flat())
}
const nghi = new Set((await doc("SELECT qid FROM cau_nghi_dap_an WHERE trang_thai='nghi' AND qid IN(SELECT qid FROM game_v2_question WHERE ma_de IN(SELECT value FROM json_each(?)))", [khoaTo])).map(r => String(r.qid)))
const cau = qs.map(r => ({ ...r, q: JSON.parse(r.json) }))
const doi = await phamVi()
if (JSON.stringify(dau) !== JSON.stringify(doi)) throw new Error('Thầy vừa đổi bài trong lúc đo; cần đo lại.')
console.log(JSON.stringify({ doPhuBaiChon: true, chiDoc: true, luc: new Date().toISOString(), soTo: to.length, soDongCau: qs.length }))
for (const p of phamViLop) {
  const ds = cau.filter(r => p.toBai.has(r.ma_de)), khoi = khoiCuaLop(p.lop)
  const hop = ds.filter(r => r.q.reviewed && !laCauTuLuan(r.q) && !r.da_xoa && r.dung_chi_muc && cauHopKhoi(khoi, { ...r.q, maDe: r.ma_de, dang: r.dang, lopTo: r.lop_to }))
  const ids = new Set(hop.map(r => String(r.qid))), moi = new Set(hop.filter(r => p.toMoi.has(r.ma_de)).map(r => String(r.qid)))
  const cu = new Set([...ids].filter(id => !moi.has(id))), cuNghi = [...cu].filter(id => nghi.has(id)).length
  const tongMoi = ds.filter(r => p.toMoi.has(r.ma_de)).length
  const duBao = [24, 30, 36].map(d => {
    const tongLuot = 5 * d + 2 * (12 + 28), con = Math.max(0, tongLuot - moi.size - 20)
    const tuan = Math.min(cu.size - cuNghi, con), bonTuan = Math.min(cu.size - cuNghi, Math.max(0, 4 * tongLuot - moi.size - 80)), bonTuanCoBaiMoiHangTuan = Math.min(cu.size - cuNghi, con * 4)
    return { mucNgay: d, tongLuotTuan: tongLuot, giaDinh: '2 kiểm tra/tuần;20 lượt lặp bổ sung/tuần;4 tuần ngân hàng giữ nguyên và không tick thêm bài mới', cauCuTuan: tuan, cauCuBonTuan: bonTuan, cauCuBonTuanCoBaiMoiHangTuan: bonTuanCoBaiMoiHangTuan,
      phanTramTuan: cu.size ? +(100 * tuan / cu.size).toFixed(2) : null,
      phanTramBonTuan: cu.size ? +(100 * bonTuan / cu.size).toFixed(2) : null }
  })
  console.log(JSON.stringify({ lop: p.lop, soBai: p.bai.length, baiMoi: p.moi.ten_bai,
    cauMoi: moi.size, cauMoiTho: tongMoi, cauCu: cu.size, cauCuDangNghi: cuNghi, tongCau: ids.size,
    chuaDuyet: ds.filter(r => !r.q.reviewed).length, tuLuan: ds.filter(r => laCauTuLuan(r.q)).length,
    chiMucCu: ds.filter(r => !r.dung_chi_muc || r.da_xoa).length, duBao,
    theoBai: p.bai.map(b => { const bds = hop.filter(r => p.toBai.get(r.ma_de) === b.khoa_bai); return { ten: b.ten_bai, moi: b.khoa_bai === p.moi.khoa_bai, cau: new Set(bds.map(r => r.qid)).size,
      I: bds.filter(r => r.q.phan === 'I').length, II: bds.filter(r => r.q.phan === 'II').length, III: bds.filter(r => r.q.phan === 'III').length } }),
  }))
}
