// MÔ PHỎNG SỔ NỢ + ĐAN XEN (thầy chốt 29/09) — chạy ĐÚNG lõi server/src/srs2-loi.ts.
// Lớp 30 em, mỗi em còn 40 câu NỢ CŨ (chiến dịch trước đã đóng, sai 1–2 lần), thầy giao chiến dịch mới 120 câu × 10 ngày.
// Mô hình em giữ như docs/thanh-thao-lan-dau-2809/mo-phong.ts (mức biết từng câu, đoán mò theo phần, học lên sau mỗi lần làm).
// Chạy: npx esbuild docs/so-no-2909/mo-phong.ts --bundle --platform=node --outfile=<tmp>/mp.cjs && node <tmp>/mp.cjs
import {
  canGoiY, chiaLuot, congNgay, danXenLuot, khoiLuongCan, laNo, lapKeHoachNgay, phanLoaiDanXen, phatLaiCau, tranHuyetChienTheo,
  type CauDanXen, type CauSrs, type HangEm, type LanLam, type Phan, type TrangThaiCau,
} from '../../server/src/srs2-loi'

const SO_EM = 30, SO_LAN = 3, SO_CAU = 120, SO_NGAY = 10, SO_NO = 40
const BAT = '2026-10-01', HAN = congNgay(BAT, SO_NGAY - 1), HAN_CU = '2026-09-28'
const DOAN: Record<Phan, number> = { I: 0.25, II: 1 / 16, III: 0 }
function rng(seed: number) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function chuan(r: () => number) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }
const kep = (x: number) => Math.min(0.98, Math.max(0.02, x))

interface Cau extends CauSrs { sao: number; lech: number }
function taoKho(r: () => number, tien: string, so: number, nguon: CauSrs['nguon']): Cau[] {
  const so2Sao = Math.round(so * 0.15)
  const muc = [...Array(so2Sao).fill('VDC'), ...Array.from({ length: so - so2Sao }, (_, i) => (['NB', 'TH', 'TH', 'VD'] as const)[i % 4])]
  const LECH: Record<string, number> = { NB: 0.15, TH: 0.05, VD: -0.1, VDC: -0.2 }
  return muc.map((m, i) => {
    const x = r()
    const phan: Phan = x < 0.6 ? 'I' : x < 0.85 ? 'II' : 'III'
    return { qid: `${tien}${String(i + 1).padStart(3, '0')}`, phan, mucDo: m, dang: `D${i % 12}`, sao: m === 'VDC' ? 2 : 0, lech: LECH[m]!, nguon }
  })
}
const hangTu = (a: number): HangEm => (a < -0.1 ? 'L1' : a < 0.05 ? 'L2' : a < 0.15 ? 'L3' : 'L4')

type KichBan = 'khongNo' | 'no40' | 'noTuTinh'
interface KetQua { ngayHetNo: number | null; ttCd: number; ttNo: number; ngayHuyet: number; conNoHan: number; viDuNgay1?: { dao: CauDanXen[]; doan: CauDanXen[]; p: Map<string, number> }; ngay90No: number | null }

function chayEm(khoMoi: Cau[], khoNo: Cau[], biet0: Map<string, number>, a: number, r: () => number, tran: number): KetQua {
  const kho = [...khoMoi, ...khoNo]
  const biet = new Map(biet0)
  const lich = new Map<string, LanLam[]>()
  const han = (c: Cau) => (c.nguon === 'chien_dich' ? HAN : HAN_CU)
  const tt = new Map<string, TrangThaiCau>()
  for (const c of khoMoi) tt.set(c.qid, phatLaiCau(c.qid, [], HAN, [], c))
  // Nợ cũ: sai 1 lần (75%) hoặc 2 lần (25%) trong chiến dịch trước.
  khoNo.forEach((c, i) => {
    const ls: LanLam[] = [{ qid: c.qid, ngay: '2026-09-24', luc: '2026-09-24T03:00:00Z', dung: false, coGoiY: false }]
    if (i % 4 === 0) ls.push({ qid: c.qid, ngay: '2026-09-26', luc: '2026-09-26T03:00:00Z', dung: false, coGoiY: false })
    lich.set(c.qid, ls)
    tt.set(c.qid, phatLaiCau(c.qid, ls, HAN_CU, [], c))
  })
  const hang = hangTu(a)
  let ngayHetNo: number | null = khoNo.length ? null : 0, ngayHuyet = 0, ngay90No: number | null = khoNo.length ? null : 0
  let viDuNgay1: KetQua['viDuNgay1']
  for (let t = 0; t < SO_NGAY; t++) {
    const ngay = congNgay(BAT, t)
    let daLam = 0
    for (let buoi = 0; buoi < 2; buoi++) {
      // Nợ cũ ngoài chiến dịch đã thành thạo ⇒ nguồn ôn duy trì (như docHoSo2).
      const cau = kho.map((c) => (c.nguon === 'chien_dich' ? c : { ...c, nguon: tt.get(c.qid)!.thanhThao ? 'duy_tri' as const : 'no_cu' as const }))
      const kh = lapKeHoachNgay(cau, tt, { homNay: ngay, hanNop: HAN, tranNgay: tran, tranHuyetChien: tranHuyetChienTheo(tran), hangChung: hang }, daLam)
      if (buoi === 0 && kh.huyetChien) ngayHuyet++
      const ds = [...kh.doan, ...kh.dao]
      if (t === 0 && buoi === 0) {
        const p = new Map<string, number>()
        for (const q of ds) { const c = kho.find((x) => x.qid === q)!; p.set(q, biet.get(q)! + (1 - biet.get(q)!) * DOAN[c.phan]) }
        const loai = (q: string) => phanLoaiDanXen(q, tt.get(q), kho.find((x) => x.qid === q))
        viDuNgay1 = { dao: kh.dao.map(loai), doan: kh.doan.map(loai), p }
      }
      if (!ds.length) break
      for (const qid of ds) {
        const c = kho.find((x) => x.qid === qid)!, truoc = tt.get(qid)!
        const goiY = canGoiY(truoc)
        const b = biet.get(qid)!
        const k = goiY ? b + 0.2 * (1 - b) : b
        const dung = r() < k || r() < (goiY && c.phan === 'I' ? 0.5 : DOAN[c.phan])
        biet.set(qid, dung ? b + 0.08 * (1 - b) : b + 0.25 * (1 - b))
        const x: LanLam = { qid, ngay, luc: `${ngay}T${String(8 + buoi * 10).padStart(2, '0')}:${String(Math.floor(daLam / 60)).padStart(2, '0')}:${String(daLam % 60).padStart(2, '0')}Z`, dung, coGoiY: goiY }
        lich.set(qid, [...(lich.get(qid) ?? []), x])
        tt.set(qid, phatLaiCau(qid, lich.get(qid)!, han(c), [], c))
        daLam++
      }
    }
    if (ngayHetNo === null && khoNo.every((c) => !laNo(tt.get(c.qid)!))) ngayHetNo = t + 1
    if (ngay90No === null && khoNo.filter((c) => laNo(tt.get(c.qid)!)).length <= 0.1 * khoNo.length) ngay90No = t + 1
  }
  return {
    ngayHetNo, ngayHuyet, viDuNgay1, ngay90No,
    ttCd: khoMoi.filter((c) => tt.get(c.qid)!.thanhThao).length / khoMoi.length,
    ttNo: khoNo.length ? khoNo.filter((c) => tt.get(c.qid)!.thanhThao).length / khoNo.length : 1,
    conNoHan: khoNo.filter((c) => laNo(tt.get(c.qid)!)).length,
  }
}

const tb = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length)
const trungVi = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)]! : NaN }
const pt = (x: number) => `${(x * 100).toFixed(0)}%`

function tuTinh(): number {
  // "Tự tính" (theLucDeXuat) khi TÍNH CẢ nợ cũ: mỗi em 120 câu mới × 2 + 40 nợ × (2 − cc) lượt.
  const kl = khoiLuongCan([...Array(SO_CAU)].map((_, i) => phatLaiCau(`x${i}`, [], HAN))) + SO_NO * 2
  return Math.min(500, Math.max(10, Math.ceil(kl / (0.7 * SO_NGAY)), Math.ceil(kl / SO_NGAY)))
}

function chay(kb: KichBan) {
  const tran = kb === 'noTuTinh' ? tuTinh() : 40
  const ra: { a: number; kq: KetQua }[] = []
  for (let lan = 0; lan < SO_LAN; lan++) {
    const r0 = rng(9100 + lan)
    const khoMoi = taoKho(r0, 'c', SO_CAU, 'chien_dich')
    const khoNo = kb === 'khongNo' ? [] : taoKho(r0, 'o', SO_NO, 'no_cu')
    const nangLuc = Array.from({ length: SO_EM }, () => 0.12 * chuan(r0))
    const goc = 0.45 // tỉ lệ đúng lần đầu trung bình ≈ 60% (lớp trung bình)
    nangLuc.forEach((a, i) => {
      const biet0 = new Map<string, number>()
      for (const c of khoMoi) biet0.set(c.qid, kep(goc + a + c.lech))
      for (const c of khoNo) biet0.set(c.qid, kep(goc + a + c.lech - 0.1)) // câu em từng sai: biết kém hơn
      ra.push({ a, kq: chayEm(khoMoi, khoNo, biet0, a, rng(200_000 * lan + i), tran) })
    })
  }
  return { tran, ra }
}

const dong: string[] = []
const in_ = (s = '') => { dong.push(s); console.log(s) }
in_(`# Mô phỏng Sổ nợ — ${SO_EM} em × ${SO_LAN} lần, nợ cũ ${SO_NO} câu/em, chiến dịch mới ${SO_CAU} câu × ${SO_NGAY} ngày`)
in_()
in_('| Kịch bản | Lượt/ngày | Ngày nợ còn ≤ 10% (trung vị) | Ngày trả hết nợ (trung vị) | Em hết nợ trước hạn | Nợ còn lúc hạn (TB/em) | Thành thạo chiến dịch lúc hạn | Nợ cũ thành thạo lúc hạn | Ngày Quá tải (TB) |')
in_('|---|---|---|---|---|---|---|---|---|')
const ketQua: Record<KichBan, ReturnType<typeof chay>> = { khongNo: chay('khongNo'), no40: chay('no40'), noTuTinh: chay('noTuTinh') }
const TEN: Record<KichBan, string> = { khongNo: 'Không nợ cũ (đối chứng)', no40: 'Nợ cũ 40, thầy giữ 40 lượt/ngày', noTuTinh: 'Nợ cũ 40, "Tự tính" có tính nợ' }
for (const kb of ['khongNo', 'no40', 'noTuTinh'] as KichBan[]) {
  const { tran, ra } = ketQua[kb]
  const het = ra.map((x) => x.kq.ngayHetNo).filter((x): x is number => x !== null)
  const n90 = ra.map((x) => x.kq.ngay90No).filter((x): x is number => x !== null)
  in_(`| ${TEN[kb]} | ${tran} | ${kb === 'khongNo' ? '—' : n90.length ? `ngày ${trungVi(n90)} (${pt(n90.length / ra.length)} em)` : 'chưa'} | ${kb === 'khongNo' ? '—' : het.length ? `ngày ${trungVi(het)}` : 'chưa hết'} | ${kb === 'khongNo' ? '—' : pt(het.length / ra.length)} | ${tb(ra.map((x) => x.kq.conNoHan)).toFixed(1)} | ${pt(tb(ra.map((x) => x.kq.ttCd)))} | ${kb === 'khongNo' ? '—' : pt(tb(ra.map((x) => x.kq.ttNo)))} | ${tb(ra.map((x) => x.kq.ngayHuyet)).toFixed(1)} |`)
}

// ---------------------------------------------------------------- đan xen: em yếu (bách phân vị 10), ngày 1
const dsYeu = [...ketQua.no40.ra].sort((x, y) => x.a - y.a)
const yeu = dsYeu[Math.floor(0.1 * dsYeu.length)]!.kq.viDuNgay1!
function soSanh(ten: string, ds: CauDanXen[]) {
  in_()
  in_(`## Đan xen — em yếu (nhóm 10% thấp nhất lớp), ngày 1, ${ten}: ${ds.length} câu (${ds.filter((x) => x.no).length} nợ, ${ds.filter((x) => x.kho).length} khó)`)
  const trc = [...ds].sort((x, y) => Number(y.no) - Number(x.no)) // thứ tự CŨ: nợ trước, lượt đầy 6 câu theo thứ tự
  const luotCu: CauDanXen[][] = []
  for (let i = 0; i < trc.length; i += 6) luotCu.push(trc.slice(i, i + 6))
  const luotMoi = chiaLuot(ds, 'yeu', 6).map((l) => danXenLuot(l, 'yeu'))
  const bang = (tieuDe: string, ls: CauDanXen[][]) => {
    in_()
    in_(`**${tieuDe}**`)
    in_()
    in_('| Lượt | Số câu | Câu nợ | Câu khó | Cặp khó liền nhau | Cặp nợ liền nhau | Đúng câu đầu | Đúng câu cuối | Đúng cả lượt |')
    in_('|---|---|---|---|---|---|---|---|---|')
    ls.forEach((l, i) => {
      let lk = 0, ln = 0
      for (let k = 1; k < l.length; k++) { if (l[k - 1]!.kho && l[k]!.kho) lk++; if (l[k - 1]!.no && l[k]!.no) ln++ }
      in_(`| ${i + 1} | ${l.length} | ${l.filter((x) => x.no).length} | ${l.filter((x) => x.kho).length} | ${lk} | ${ln} | ${pt(yeu.p.get(l[0]!.qid)!)} | ${pt(yeu.p.get(l[l.length - 1]!.qid)!)} | ${pt(tb(l.map((x) => yeu.p.get(x.qid)!)))} |`)
    })
  }
  bang('Trước (nợ dồn đầu, lượt 6 câu theo thứ tự)', luotCu)
  bang('Sau (đan xen theo sức em)', luotMoi)
  const tom = (ls: CauDanXen[][]) => {
    const p = ls.map((l) => tb(l.map((x) => yeu.p.get(x.qid)!)))
    return { min: Math.min(...p), max: Math.max(...p), dau: tb(ls.map((l) => yeu.p.get(l[0]!.qid)!)), cuoi: tb(ls.map((l) => yeu.p.get(l[l.length - 1]!.qid)!)) }
  }
  const a = tom(luotCu), b = tom(luotMoi)
  in_()
  in_(`Tóm tắt: đúng theo lượt ${pt(a.min)}–${pt(a.max)} → ${pt(b.min)}–${pt(b.max)}; câu mở lượt ${pt(a.dau)} → ${pt(b.dau)}; câu kết lượt ${pt(a.cuoi)} → ${pt(b.cuoi)}.`)
}
soSanh('Bát Linh Đảo (nợ Đúng–sai + câu mới)', yeu.dao)
soSanh('Đoàn Hộ Tống (câu ôn Trắc nghiệm / Trả lời ngắn)', yeu.doan)
