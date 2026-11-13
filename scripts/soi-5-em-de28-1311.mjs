// SOI 5 EM ĐỀ 28 THIẾU CÂU TRẢ LỜI NGẮN — ngày Sửa 11/11 (CHỈ ĐỌC, 13/11; thầy 12/11 «Làm luôn 5 em còn lại»). Chỉ SELECT qua D1 API, KHÔNG ghi, KHÔNG export.
// KHÔNG in mã / tên em: em đánh số 1..n theo thứ tự ngẫu nhiên ổn định của lượt chạy; mã câu chỉ in phần + vai.
// Nhóm soi: em có loại ngày 'sua' ngày 11/11, đề Gói 7 đã giao (bỏ câu làm lại cuối chặng) ≥ 28 câu gốc, trong 28 câu đầu có < 6 câu phần III,
// và KHÔNG có câu làm lại cuối chặng / tự luyện nào trong ngày.
const token = process.env.CLOUDFLARE_API_TOKEN, account = process.env.CLOUDFLARE_ACCOUNT_ID
if (!token || !account) throw new Error('Thiếu cấu hình Cloudflare.')
const NGAY = process.env.NGAY || '2026-11-11'
const TU = new Date(Date.parse(`${NGAY}T00:00:00+07:00`)).toISOString().slice(0, 19), DEN = new Date(Date.parse(`${NGAY}T00:00:00+07:00`) + 86400e3).toISOString().slice(0, 19)
async function q(sql) {
  for (let lan = 0; ; lan++) {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`, {
      method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ sql }), signal: AbortSignal.timeout(60000) })
    const j = await r.json().catch(() => ({}))
    if (r.ok && j.success) { await new Promise((ok) => setTimeout(ok, 1500)); return j.result.flatMap((x) => x.results ?? []) }
    if (lan >= 5) throw new Error(`D1 lỗi (${r.status}) ${JSON.stringify(j.errors ?? '').slice(0, 200)}`)
    await new Promise((ok) => setTimeout(ok, 3000 * 2 ** lan))
  }
}
const esc = (s) => String(s).replace(/'/g, "''")
const ds = (a) => a.map((x) => `'${esc(x)}'`).join(',')
const goc = (qid) => (qid.includes('~') ? qid.slice(0, qid.indexOf('~')) : qid)

const em = (await q(`SELECT sbd FROM goi_bai_7_loai_ngay WHERE ngay='${NGAY}' AND loai='sua' ORDER BY sbd`)).map((x) => x.sbd)
console.log(JSON.stringify({ emNgaySua: em.length }))
const phien = new Map(), so = new Map()
for (let i = 0; i < em.length; i += 30) {
  const lo = em.slice(i, i + 30)
  for (const x of await q(`SELECT sbd,created_at c,json FROM game_v2_session WHERE sbd IN (${ds(lo)}) AND created_at>='${TU}' AND created_at<'${DEN}' AND json_extract(json,'$.goi7')=1 ORDER BY created_at`)) {
    const a = phien.get(x.sbd) ?? []; let j = {}; try { j = JSON.parse(x.json) } catch {} a.push({ c: x.c, j }); phien.set(x.sbd, a)
  }
  for (const x of await q(`SELECT sbd,qid,nguon,substr(ma_nguon,1,8) mn,luc FROM su_kien_hoc WHERE sbd IN (${ds(lo)}) AND ngay_vn='${NGAY}'`)) {
    const a = so.get(x.sbd) ?? []; a.push(x); so.set(x.sbd, a)
  }
}
// phần của mọi câu gốc đã giao
const tatCa = new Set()
for (const a of phien.values()) for (const p of a) for (const r of p.j.questions ?? []) if (r?.qid) tatCa.add(goc(r.qid))
const phan = new Map()
const dsQ = [...tatCa]
for (let i = 0; i < dsQ.length; i += 200) for (const x of await q(`SELECT qid,json_extract(json,'$.phan') p FROM game_v2_question WHERE qid IN (${ds(dsQ.slice(i, i + 200))})`)) phan.set(x.qid, x.p)

const nhom = { du28: 0, thieuIII: 0, thieuIII_khongLamLai: 0 }
const gop = []
const soi = []
for (const s of em) {
  const ps = phien.get(s) ?? []
  const giao = [], thay = new Set()
  let lamLai = 0
  for (const p of ps) for (const r of p.j.questions ?? []) {
    if (!r?.qid) continue
    if (r.lamLaiCuoi) { lamLai++; continue }
    const g = goc(r.qid); if (thay.has(g)) continue
    thay.add(g); giao.push({ g, vai: r.vai ?? r.role ?? '?', p: phan.get(g) ?? '?', goiNgay: p.j.goiNgay === 1 })
  }
  if (giao.length < 28) continue
  nhom.du28++
  const dau = giao.slice(0, 28), iii = dau.filter((x) => x.p === 'III').length
  if (iii >= 6) continue
  nhom.thieuIII++
  // 13/11: gộp cho CẢ nhóm thiếu III (kể cả em có câu làm lại): tổng câu giao, III trong 28 / sau 28 / cả ngày, số câu làm lại.
  const iiiTong = giao.filter((x) => x.p === 'III').length
  gop.push({ n: giao.length, iii28: iii, iiiTong, lamLai, coGoiNgay: ps.some((p) => p.j.goiNgay === 1) })
  const sk = so.get(s) ?? []
  const tuLuyen = sk.filter((x) => x.nguon === 'tu_luyen' || x.nguon === 'luyen').length
  if (lamLai || tuLuyen) continue
  nhom.thieuIII_khongLamLai++
  soi.push({ s, ps, giao, dau, sk })
}
console.log(JSON.stringify(nhom))
{ const dem = (f) => gop.filter(f).length
  console.log(JSON.stringify({ nhomThieuIII: gop.length, giao_dung28: dem((x) => x.n === 28), giao_29_30: dem((x) => x.n >= 29 && x.n <= 30), giao_hon30: dem((x) => x.n > 30),
    caNgayDu6III: dem((x) => x.iiiTong >= 6), caNgayDu6III_maTrong28Thieu: dem((x) => x.iiiTong >= 6 && x.iii28 < 6), caNgayThieuIII: dem((x) => x.iiiTong < 6),
    coLamLai: dem((x) => x.lamLai > 0), coGoiNgay: dem((x) => x.coGoiNgay), tbIII28: +(gop.reduce((t, x) => t + x.iii28, 0) / Math.max(1, gop.length)).toFixed(2), tbIIITong: +(gop.reduce((t, x) => t + x.iiiTong, 0) / Math.max(1, gop.length)).toFixed(2) }))
  const hist = {}; for (const x of gop) { const k = `n${x.n}|III28=${x.iii28}|IIIca=${x.iiiTong}`; hist[k] = (hist[k] ?? 0) + 1 }
  console.log(JSON.stringify(Object.entries(hist).sort((a, b) => b[1] - a[1]).slice(0, 15))) }
const lam = (sk) => new Set(sk.map((x) => goc(x.qid)))
soi.sort((a, b) => (a.s < b.s ? -1 : 1))
for (const [i, x] of soi.entries()) {
  const daLam = lam(x.sk)
  const demPhan = (a) => ({ I: a.filter((y) => y.p === 'I').length, II: a.filter((y) => y.p === 'II').length, III: a.filter((y) => y.p === 'III').length, khac: a.filter((y) => !['I', 'II', 'III'].includes(y.p)).length })
  console.log(JSON.stringify({
    em: i + 1,
    soPhien: x.ps.length, phienGoiNgay: x.ps.filter((p) => p.j.goiNgay === 1).length,
    cauMoiPhien: x.ps.map((p) => ({ goiNgay: p.j.goiNgay === 1 ? 1 : 0, n: (p.j.questions ?? []).length, III: (p.j.questions ?? []).filter((r) => phan.get(goc(r.qid ?? '')) === 'III').length })),
    tongGiao: x.giao.length, phan28: demPhan(x.dau), phanSau28: demPhan(x.giao.slice(28)),
    vai28: x.dau.map((y) => `${y.p}:${y.vai}${y.goiNgay ? '*' : ''}`).join(' '),
    giaoMaKhongLam: x.giao.filter((y) => !daLam.has(y.g)).length,
    soNguon: Object.entries(x.sk.reduce((o, y) => ((o[`${y.nguon}/${y.mn.replace(/[0-9a-f-]{6,}/g, '#')}`] = (o[`${y.nguon}/${y.mn.replace(/[0-9a-f-]{6,}/g, '#')}`] ?? 0) + 1), o), {})),
    tomTat7: Object.fromEntries(Object.entries(x.ps.at(-1)?.j?.tomTat7 ?? {}).filter(([k]) => /loai|muc|toi|tang|ngay|sua|moi|on/i.test(k)).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v).slice(0, 80) : v])),
  }))
}
