// MÔ PHỎNG TÁC ĐỘNG luật THÀNH THẠO LẦN ĐẦU (thầy 28/09, bản xem trước) — chạy ĐÚNG lõi server/src/srs2-loi.ts.
// Luật cũ = mọi câu coi như 2 sao (đúng tương đương: câu 2 sao vẫn giữ luật chuỗi "đúng 2 ngày khác nhau").
// Chạy: npx esbuild docs/thanh-thao-lan-dau-2809/mo-phong.ts --bundle --platform=node --outfile=<tmp>/mp.cjs && node <tmp>/mp.cjs
import {
  canGoiY, congNgay, lapKeHoachNgay, luotCauMoiTheoTiLe, phatLaiCau, tranHuyetChienTheo, TRAN_NGAY,
  type CauSrs, type LanLam, type Phan, type TrangThaiCau,
} from '../../server/src/srs2-loi'

const SO_EM = 30, TI_LE_2_SAO = 0.15, SO_LAN = 5
const BAT = '2026-10-01'
// Cấu hình chiến dịch — đổi theo từng bộ kịch bản (xem cuối tệp). Trần ngày và trần Huyết Chiến (2 × trần ngày) KHÔNG đổi công thức.
let SO_CAU = 120, SO_NGAY = 10, TRAN = TRAN_NGAY
let HAN = congNgay(BAT, SO_NGAY - 1)
function datCauHinh(soCau: number, soNgay: number, tran: number) { SO_CAU = soCau; SO_NGAY = soNgay; TRAN = tran; HAN = congNgay(BAT, soNgay - 1) }
/** Xác suất đoán mò đúng: Phần I 4 phương án; Phần II đủ 4 ý đúng/sai; Phần III trả lời ngắn. */
const DOAN: Record<Phan, number> = { I: 0.25, II: 1 / 16, III: 0 }

function rng(seed: number) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function chuan(r: () => number) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }
const kep = (x: number) => Math.min(0.98, Math.max(0.02, x))

interface Cau extends CauSrs { sao: number; lech: number }
function taoKho(r: () => number): Cau[] {
  const so2Sao = Math.round(SO_CAU * TI_LE_2_SAO)
  const muc = [...Array(so2Sao).fill('VDC'), ...Array.from({ length: SO_CAU - so2Sao }, (_, i) => (['NB', 'TH', 'TH', 'VD'] as const)[i % 4])]
  const LECH: Record<string, number> = { NB: 0.15, TH: 0.05, VD: -0.1, VDC: -0.2 }
  return muc.map((m, i) => {
    const x = r()
    const phan: Phan = x < 0.6 ? 'I' : x < 0.85 ? 'II' : 'III'
    return { qid: `c${String(i + 1).padStart(3, '0')}`, phan, mucDo: m, dang: `D${i % 12}`, sao: m === 'VDC' ? 2 : i % 3 === 0 ? 1 : 0, lech: LECH[m]! }
  })
}

/** Mức "biết" gốc của em i với câu q; chọn `goc` để tỉ lệ đúng lần đầu trung bình = `tiLe`. */
function hieuChinh(kho: Cau[], nangLuc: number[], tiLe: number): number {
  let lo = -1, hi = 1.5
  for (let k = 0; k < 40; k++) {
    const g = (lo + hi) / 2
    let s = 0
    for (const a of nangLuc) for (const c of kho) { const b = kep(g + a + c.lech); s += b + (1 - b) * DOAN[c.phan] }
    if (s / (nangLuc.length * kho.length) < tiLe) lo = g; else hi = g
  }
  return (lo + hi) / 2
}

type Luat = 'cu' | 'moiP1' | 'moiP2'
interface KetQuaEm {
  luotTheoNgay: number[]; moiTheoNgay: number[]; onTheoNgay: number[]; huyetTheoNgay: boolean[]; ngayXongMoi: number | null; tongLuot: number; thanhThaoHan: number; ngay100: number | null; ngay90: number | null
  ao: number; biet: number; dungLanDau: number; ttLanDau: string[]; conOn: { qid: string; lyDo: string }[]; catTia: number
}

function chayEm(kho: Cau[], biet0: number[], r: () => number, luat: Luat): KetQuaEm {
  const luatMoi = luat !== 'cu'
  const biet = [...biet0], lanCuoi: (number | null)[] = kho.map(() => null)
  const lich = new Map<string, LanLam[]>()
  const tuyChon = (c: Cau) => ({ sao: luatMoi ? c.sao : 2 })
  const tt = new Map<string, TrangThaiCau>(kho.map((c) => [c.qid, phatLaiCau(c.qid, [], HAN, [], tuyChon(c))]))
  const viTri = new Map(kho.map((c, i) => [c.qid, i]))
  const luotTheoNgay: number[] = [], moiTheoNgay: number[] = [], onTheoNgay: number[] = [], huyetTheoNgay: boolean[] = []
  let ngayXongMoi: number | null = null, soLanDauKhong2Sao = 0, dungLanDauKhong2Sao = 0
  const luotCauMoi = luat === 'moiP2' ? (qid: string) => luotCauMoiTheoTiLe(kho[viTri.get(qid)!]!.sao, dungLanDauKhong2Sao, soLanDauKhong2Sao) : undefined
  let ngay100: number | null = null, ngay90: number | null = null, dungLanDau = 0
  const lyDoLanDau = new Map<string, string>()
  for (let t = 0; t < SO_NGAY; t++) {
    const ngay = congNgay(BAT, t)
    let daLam = 0, soMoi = 0
    for (let buoi = 0; buoi < 2; buoi++) {
      const kh = lapKeHoachNgay(kho, tt, { homNay: ngay, hanNop: HAN, tranNgay: TRAN, tranHuyetChien: tranHuyetChienTheo(TRAN), luotCauMoi }, daLam)
      if (buoi === 0) huyetTheoNgay.push(kh.huyetChien)
      const ds = [...kh.doan, ...kh.dao]
      if (!ds.length) break
      for (const qid of ds) {
        const i = viTri.get(qid)!, c = kho[i]!, truoc = tt.get(qid)!
        if (lanCuoi[i] !== null) biet[i] = Math.max(biet0[i]!, biet[i]! - 0.01 * (t - lanCuoi[i]!))
        const goiY = canGoiY(truoc)
        const k = goiY ? biet[i]! + 0.2 * (1 - biet[i]!) : biet[i]!
        const doan = goiY && c.phan === 'I' ? 0.5 : DOAN[c.phan]
        const dung = r() < k || r() < doan
        biet[i] = dung ? biet[i]! + 0.08 * (1 - biet[i]!) : biet[i]! + 0.25 * (1 - biet[i]!)
        lanCuoi[i] = t
        if (truoc.laMoi) {
          soMoi++
          if (c.sao < 2) { soLanDauKhong2Sao++; if (dung && !goiY) dungLanDauKhong2Sao++ }
          if (dung) dungLanDau++
          lyDoLanDau.set(qid, !dung ? 'sai lần đầu' : goiY ? 'có gợi ý' : c.sao >= 2 ? 'câu 2 sao' : '')
        }
        const x: LanLam = { qid, ngay, luc: `${ngay}T${String(8 + buoi * 10).padStart(2, '0')}:${String(Math.floor(daLam / 60)).padStart(2, '0')}:${String(daLam % 60).padStart(2, '0')}Z`, dung, coGoiY: goiY }
        lich.set(qid, [...(lich.get(qid) ?? []), x])
        tt.set(qid, phatLaiCau(qid, lich.get(qid)!, HAN, [], tuyChon(c)))
        daLam++
      }
    }
    luotTheoNgay.push(daLam); moiTheoNgay.push(soMoi); onTheoNgay.push(daLam - soMoi)
    if (ngayXongMoi === null && [...tt.values()].every((x) => !x.laMoi)) ngayXongMoi = t + 1
    const soTT = [...tt.values()].filter((x) => x.thanhThao).length
    if (ngay100 === null && soTT === SO_CAU) ngay100 = t + 1
    if (ngay90 === null && soTT >= 0.9 * SO_CAU) ngay90 = t + 1
  }
  const ds = [...tt.values()]
  const ao = ds.filter((x) => x.thanhThao && biet[viTri.get(x.qid)!]! < 0.5).length
  return {
    luotTheoNgay, moiTheoNgay, onTheoNgay, huyetTheoNgay, ngayXongMoi, tongLuot: luotTheoNgay.reduce((s, x) => s + x, 0), thanhThaoHan: ds.filter((x) => x.thanhThao).length / SO_CAU,
    ngay100, ngay90, ao: ao / Math.max(1, ds.filter((x) => x.thanhThao).length), biet: biet.reduce((s, x) => s + x, 0) / SO_CAU,
    dungLanDau: dungLanDau / SO_CAU,
    ttLanDau: ds.filter((x) => x.thanhThaoLanDau).map((x) => x.qid),
    conOn: kho.filter((c) => !tt.get(c.qid)!.thanhThaoLanDau).map((c) => ({ qid: c.qid, lyDo: lyDoLanDau.get(c.qid) || (tt.get(c.qid)!.laMoi ? 'chưa làm' : 'sai khi làm lại') })),
    catTia: ds.filter((x) => x.catTia).length,
  }
}

const tb = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length)
const trungVi = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)]! : NaN }
const pt = (x: number) => `${(x * 100).toFixed(0)}%`

const LUAT: Luat[] = ['cu', 'moiP1', 'moiP2']
const TEN_LUAT: Record<Luat, string> = { cu: 'cũ', moiP1: 'mới P1', moiP2: 'mới P2' }

function chayKichBan(tiLe: number) {
  const ra: Record<Luat, KetQuaEm[]> = { cu: [], moiP1: [], moiP2: [] }
  let viDu: { kho: Cau[]; em: { ten: string; cu: KetQuaEm; moi: KetQuaEm }[] } | null = null
  for (let lan = 0; lan < SO_LAN; lan++) {
    const r0 = rng(7000 + lan)
    const kho = taoKho(r0)
    const nangLuc = Array.from({ length: SO_EM }, () => 0.12 * chuan(r0))
    const goc = hieuChinh(kho, nangLuc, tiLe)
    const cap: { a: number; cu: KetQuaEm; moi: KetQuaEm }[] = []
    nangLuc.forEach((a, i) => {
      const biet0 = kho.map((c) => kep(goc + a + c.lech))
      // Cùng hạt giống cho mọi luật ⇒ cùng một em, cùng may rủi ở lần làm đầu.
      const kq = Object.fromEntries(LUAT.map((l) => [l, chayEm(kho, biet0, rng(100_000 * lan + i), l)])) as Record<Luat, KetQuaEm>
      for (const l of LUAT) ra[l].push(kq[l])
      cap.push({ a, cu: kq.cu, moi: kq.moiP1 })
    })
    if (lan === 0) {
      const xep = [...cap].sort((x, y) => x.a - y.a)
      const chon = (q: number) => xep[Math.min(xep.length - 1, Math.floor(q * xep.length))]!
      viDu = { kho, em: ([['Em yếu', chon(0.08)], ['Em trung bình', chon(0.5)], ['Em khá', chon(0.9)]] as const).map(([ten, x]) => ({ ten, cu: x.cu, moi: x.moi })) }
    }
  }
  return { ra, viDu: viDu! }
}

const trungViNgay = (xs: (number | null)[], tong: number) => {
  const co = xs.filter((x): x is number => x !== null)
  if (!co.length) return 'chưa đạt'
  const tv = trungVi(co)
  return co.length < tong / 2 ? `ngày ${tv} (${pt(co.length / tong)} em)` : `ngày ${tv}`
}
/** Huyết Chiến của một em: ngày bật đầu tiên, số ngày bật, ngày tắt (ngày đầu tiên tắt sau khi đã bật). */
function huyet(e: KetQuaEm) {
  const bat = e.huyetTheoNgay.indexOf(true)
  if (bat < 0) return { bat: null, soNgay: 0, tat: null as number | null }
  const tat = e.huyetTheoNgay.findIndex((x, t) => t > bat && !x)
  return { bat: bat + 1, soNgay: e.huyetTheoNgay.filter(Boolean).length, tat: tat < 0 ? null : tat + 1 }
}

function inBo(tieuDe: string, soCau: number, soNgay: number, tran: number, dsTiLe: number[], coViDu: boolean) {
  datCauHinh(soCau, soNgay, tran)
  console.log(`\n## ${tieuDe} — ${SO_EM} em × ${soCau} câu × ${soNgay} ngày, trần ${tran}/ngày, Huyết Chiến ${tranHuyetChienTheo(tran)}; ngưỡng bật: lượt còn cần > 0,9 × số ngày còn lại × ${tran}\n`)
  const cot: string[] = []
  const hang: Record<string, string[]> = {}
  const them = (k: string, v: string) => { (hang[k] ??= []).push(v) }
  const dong: string[] = []
  let viDu: ReturnType<typeof chayKichBan>['viDu'] | null = null
  for (const tiLe of dsTiLe) {
    const { ra, viDu: vd } = chayKichBan(tiLe)
    if (tiLe === 0.6) viDu = vd
    for (const luat of LUAT) {
      const ds = ra[luat]
      cot.push(`${pt(tiLe)} ${TEN_LUAT[luat]}`)
      const theoNgay = Array.from({ length: SO_NGAY }, (_, t) => tb(ds.map((e) => e.luotTheoNgay[t]!)))
      const moiNgay = Array.from({ length: SO_NGAY }, (_, t) => tb(ds.map((e) => e.moiTheoNgay[t]!)))
      const onNgay = Array.from({ length: SO_NGAY }, (_, t) => tb(ds.map((e) => e.onTheoNgay[t]!)))
      const hc = ds.map(huyet)
      them('Đúng lần đầu đo được', pt(tb(ds.map((e) => e.dungLanDau))))
      them('Câu phải làm / ngày (TB)', tb(theoNgay).toFixed(0))
      them('Câu phải làm ngày nhiều nhất', Math.max(...theoNgay).toFixed(0))
      them('Tổng lượt làm tới hạn', tb(ds.map((e) => e.tongLuot)).toFixed(0))
      them('Ngày làm xong câu mới (trung vị)', trungViNgay(ds.map((e) => e.ngayXongMoi), ds.length))
      them('Em có Huyết Chiến', pt(hc.filter((x) => x.bat !== null).length / ds.length))
      them('Số ngày Huyết Chiến (TB / em)', tb(hc.map((x) => x.soNgay)).toFixed(1))
      them('Huyết Chiến bật từ (trung vị)', trungViNgay(hc.map((x) => x.bat), ds.length))
      them('Huyết Chiến tắt (trung vị, em có tắt trước hạn)', (() => { const x = hc.filter((h) => h.tat !== null).map((h) => h.tat!); return x.length ? `ngày ${trungVi(x)} (${pt(x.length / ds.length)} em)` : 'không tắt tới hạn' })())
      them('% thành thạo lúc hạn', pt(tb(ds.map((e) => e.thanhThaoHan))))
      them('Em đạt 100% trước hạn', pt(ds.filter((e) => e.ngay100 !== null).length / ds.length))
      them('Ngày đạt 100% (trung vị)', trungViNgay(ds.map((e) => e.ngay100), ds.length))
      them('Ngày đạt 90% (trung vị)', trungViNgay(ds.map((e) => e.ngay90), ds.length))
      them('Thành thạo "ảo" (biết < 50% lúc hạn)', pt(tb(ds.map((e) => e.ao))))
      them('Mức biết thật lúc hạn (mô hình)', pt(tb(ds.map((e) => e.biet))))
      them('Câu cần thầy dạy lại / em', tb(ds.map((e) => e.catTia)).toFixed(1))
      dong.push(`${pt(tiLe)} ${TEN_LUAT[luat]}: ${moiNgay.map((m, t) => `${m.toFixed(0)}+${onNgay[t]!.toFixed(0)}`).join(' · ')}`)
    }
  }
  console.log('| Chỉ số (TB / em) | ' + cot.join(' | ') + ' |')
  console.log('|---|' + '---:|'.repeat(cot.length))
  for (const [k, v] of Object.entries(hang)) console.log(`| ${k} | ${v.join(' | ')} |`)
  console.log(`\nCâu phát mỗi ngày = MỚI + ÔN (ngày 1 → ${SO_NGAY}; ôn duy trì = 0 vì chưa có câu cũ):`)
  console.log(dong.map((x) => `- ${x}`).join('\n'))
  if (!coViDu || !viDu) return
  const v = viDu
  console.log('\nVÍ DỤ 3 EM (kịch bản 60%, luật mới):')
  for (const e of v.em) {
    const cDe = (q: string) => v.kho.find((c) => c.qid === q)!
    const nhom = new Map<string, string[]>()
    for (const x of e.moi.conOn) nhom.set(x.lyDo, [...(nhom.get(x.lyDo) ?? []), x.qid])
    const mau = (ds: string[]) => [...ds].sort((a, b) => cDe(a).sao - cDe(b).sao || (a < b ? -1 : 1)).slice(0, 4).map((q) => `${q} (P${cDe(q).phan}, ${cDe(q).mucDo}${cDe(q).sao ? `, ${cDe(q).sao} sao` : ''})`).join(', ')
    console.log(`- ${e.ten}: đúng lần đầu ${pt(e.moi.dungLanDau)}; THÀNH THẠO NGAY ${e.moi.ttLanDau.length}/${SO_CAU} câu, ví dụ ${mau(e.moi.ttLanDau)}.`)
    for (const [ly, ds] of nhom) console.log(`    vẫn phải ôn — ${ly}: ${ds.length} câu, ví dụ ${mau(ds)}`)
    console.log(`    lượt làm cả chiến dịch: cũ ${e.cu.tongLuot} → mới ${e.moi.tongLuot}; thành thạo lúc hạn: cũ ${pt(e.cu.thanhThaoHan)} → mới ${pt(e.moi.thanhThaoHan)}`)
  }
}

inBo('Bộ A (đề bài thầy)', 120, 10, TRAN_NGAY, [0.4, 0.6, 0.8], true)
inBo('Bộ B (nặng, giống chiến dịch thật: 170 câu, 8 ngày, thể lực 60)', 170, 8, 60, [0.4, 0.6, 0.8], false)
inBo('Bộ C (giao quá sức: 260 câu, 8 ngày, thể lực 60 — Huyết Chiến bật từ ngày đầu với P1)', 260, 8, 60, [0.4, 0.6, 0.8], false)
