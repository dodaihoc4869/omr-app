// LÀN BÀI MỚI 7 NGÀY 12/10 — lệnh `/gv/goi-bai-7` GIẢ cho bản build chụp ảnh (Hành trình › Bài mới trong 7 ngày). Tên học sinh là tên GIẢ.
// Dữ liệu dày như lớp thật: 3 bài (12A1 · 12A2 · 11A1), mỗi bài ≈ 60 em × 40 câu gốc (18 Trắc nghiệm · 10 Đúng–sai · 12 Trả lời ngắn).
// Số được SINH NHẤT QUÁN từ từng cặp em × câu (gặp → tự làm → đúng/sai lần đầu → lần gần nhất), rồi cộng/xếp đúng như máy chủ
// (`server/src/goi-bai-7-thay.ts`: lyDoChua7, thứ tự ưu tiên, canChua) ⇒ ô số, dải tiến độ, danh sách chữa và bảng em khớp nhau.
// `?g7=trong` ⇒ chưa có bài · `?g7=loi` ⇒ máy chủ lỗi · `?g7=thieu-nguon` ⇒ cảnh báo thiếu nguồn.
import { lyDoChua7, type CauGoi7 } from '../../../server/src/goi-bai-7-loi'

const thamSo = () => new URLSearchParams(typeof location === 'undefined' ? '' : location.search)
/** Bộ sinh số giả cố định (mulberry32) — ảnh chụp lần nào cũng như nhau. */
function ngauNhien(hat: number) {
  let a = hat >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô', 'Phan', 'Trịnh']
const DEM = ['Minh', 'Thu', 'Đức', 'Phương', 'Quang', 'Khánh', 'Gia', 'Hải', 'Bảo', 'Ngọc', 'Thanh', 'Hoàng']
const TEN = ['Anh', 'Huy', 'Linh', 'Trang', 'Khôi', 'Ngân', 'Bảo', 'Yến', 'Việt', 'Chi', 'Long', 'Hà', 'My', 'Phúc', 'Tâm', 'Quân']
const GOI = [
  { id: 'g7:12A1-b6', ten: 'Bài 6 · Ester – Lipid', lop: '12A1', bat_dau: '2026-10-10', han: '2026-10-16', khoi: '12', soEm: 62, hat: 7 },
  { id: 'g7:12A2-b6', ten: 'Bài 6 · Ester – Lipid', lop: '12A2', bat_dau: '2026-10-11', han: '2026-10-17', khoi: '12', soEm: 58, hat: 11 },
  { id: 'g7:11A1-b3', ten: 'Bài 3 · Cân bằng hoá học', lop: '11A1', bat_dau: '2026-10-07', han: '2026-10-13', khoi: '11', soEm: 44, hat: 23 },
]
type Ten = { sbd: string; ten: string }

function lapGoi(g: (typeof GOI)[number]) {
  const r = ngauNhien(g.hat)
  const ma = `DH-${g.khoi}-C1-B${g.ten.match(/Bài (\d+)/)?.[1] ?? '1'}`
  const to: [string, 'I' | 'II' | 'III', number][] = [[`${ma}-TN`, 'I', 18], [`${ma}-DS`, 'II', 10], [`${ma}-TLN`, 'III', 12]]
  const cau: CauGoi7[] = to.flatMap(([maTo, phan, n]) => Array.from({ length: n }, (_, i) => ({
    qid: `${maTo}-${i + 1}`, maDe: ma, maTo, soCau: i + 1, version: 'v1', group: `${maTo}-${i + 1}`, phan, hopLe: !(phan === 'II' && i === 7),
    kho: phan !== 'I' ? r() < 0.45 : r() < 0.15, tinhToan: phan === 'III' || (phan === 'I' && i % 5 === 3), kyNang: [`k${(i % 7) + 1}`],
  })))
  const em = Array.from({ length: g.soEm }, (_, i) => ({
    sbd: String(Number(g.khoi) * 1000 + (g.hat % 10) * 100 + i + 1).padStart(5, '1'),
    ten: `${HO[(i + g.hat) % HO.length]} ${DEM[(i * 5 + Math.floor(i / 12) + g.hat) % DEM.length]} ${TEN[(i * 7 + Math.floor(i / 12) * 3 + g.hat) % TEN.length]}`,
    nhip: Math.min(1.1, 0.15 + 1.05 * r()), suc: 0.35 + 0.6 * r(),
  }))
  // trạng thái từng cặp em × câu
  const gap = new Map<string, Set<string>>(), tuLam = new Map<string, Set<string>>(), dau = new Map<string, boolean>(), cuoi = new Map<string, boolean>(), cho = new Map<string, Set<string>>()
  for (const e of em) {
    const g1 = new Set<string>(), t1 = new Set<string>(), c1 = new Set<string>()
    cau.forEach((q, j) => {
      if (j / cau.length > e.nhip + 0.15 * (r() - 0.5)) return
      g1.add(q.qid)
      if (r() < 0.12 && !q.kho) { if (r() < 0.35) c1.add(q.qid); return } // gặp có hỗ trợ / nhờ thầy chữa
      if (r() < 0.78) {
        t1.add(q.qid)
        const kho = (q.kho ? 0.22 : 0) + (q.tinhToan ? 0.12 : 0) + (q.phan === 'II' ? 0.08 : 0)
        const dung = r() < e.suc - kho
        dau.set(`${e.sbd}|${q.qid}`, dung)
        cuoi.set(`${e.sbd}|${q.qid}`, dung || r() < 0.45)
      }
    })
    gap.set(e.sbd, g1); tuLam.set(e.sbd, t1); cho.set(e.sbd, c1)
  }
  const ten = (e: (typeof em)[number]): Ten => ({ sbd: e.sbd, ten: e.ten })
  const daChua = new Set(cau.filter((_, j) => j % 9 === 4).map((q) => q.qid))
  const dsCau = cau.map((q) => {
    const doan = em.filter((e) => tuLam.get(e.sbd)!.has(q.qid)), sai = doan.filter((e) => !dau.get(`${e.sbd}|${q.qid}`)).length
    const choChua = em.filter((e) => cho.get(e.sbd)!.has(q.qid)).map(ten)
    const chua = daChua.has(q.qid)
    return {
      ...q, lyDo: lyDoChua7(q, doan.length, sai), daDo: doan.length, sai, daChua: chua,
      loiGo: chua ? (q.phan === 'II' ? '@loi-giai-goc' : 'Viết phương trình thuỷ phân trước, rồi lập tỉ lệ mol ester : NaOH = 1 : 1 để tìm số mol muối.') : '',
      chuaGap: em.filter((e) => !gap.get(e.sbd)!.has(q.qid)).map(ten),
      canKiem: em.filter((e) => cuoi.get(`${e.sbd}|${q.qid}`) !== true).map(ten),
      choChua: chua ? [] : choChua,
    }
  }).sort((a, b) => Number(b.choChua.length > 0 && !b.daChua) - Number(a.choChua.length > 0 && !a.daChua) || Number(b.lyDo.length > 0) - Number(a.lyDo.length > 0) ||
    Number(a.daChua) - Number(b.daChua) || b.sai - a.sai || a.qid.localeCompare(b.qid))
  const kyNang = 14
  const dsEm = em.map((e, i) => {
    const daGap = gap.get(e.sbd)!.size
    const dat = Math.round(kyNang * Math.min(1, e.suc * e.nhip * 1.2))
    return {
      sbd: e.sbd, ten: e.ten, han: g.han, tong: cau.length, daGap, tuLam: tuLam.get(e.sbd)!.size, con: cau.length - daGap,
      kyNang: i % 11 === 6 ? { tong: 0, dat: 0, tyLe: null } : { tong: kyNang, dat, tyLe: Math.round((1000 * dat) / kyNang) / 10 },
      diem: e.nhip > 0.55 ? to.slice(0, e.nhip > 0.8 ? 2 : 1).map(([maTo], k) => ({ maDe: maTo, diem: Math.round(100 * Math.min(10, 10 * (e.suc - 0.08 * k) + 0.6)) / 100, luc: '2026-10-11T13:20:00Z' })) : [],
    }
  })
  return {
    ok: true, bat: true, nguonDayDu: thamSo().get('g7') !== 'thieu-nguon', goiId: g.id, cau: dsCau, em: dsEm,
    canChua: dsCau.filter((c) => (c.lyDo.length || c.choChua.length) && !c.daChua).length, canGap: dsEm.filter((e) => e.con > 0).length, soCau: cau.length, soEm: dsEm.length,
  }
}

/** Câu đầy đủ (đề + đáp án + lời giải) cho tấm soạn phần chữa — chỉ app thầy thấy. */
function cauChiTiet(qid: string) {
  const phan = /-DS-/.test(qid) ? 'II' : /-TLN-/.test(qid) ? 'III' : 'I'
  const chung = { qid, maDe: qid.replace(/-(TN|DS|TLN)-\d+$/, ''), version: 'v1', group: qid, phan, hinhAnh: [], dang: null, tenDang: 'Thuỷ phân ester', mucDo: 'hieu', sao: 0, kienThuc: [], reviewed: true }
  if (phan === 'II') {
    return {
      ...chung, text: 'Cho các phát biểu về ethyl acetate (CH₃COOC₂H₅):', choices: [],
      ideas: ['Thuỷ phân trong môi trường kiềm là phản ứng một chiều.', 'Có nhiệt độ sôi cao hơn acetic acid.', 'Là đồng phân của butanoic acid.', 'Tan tốt trong nước ở nhiệt độ thường.'],
      correct: 'DSDS', solution: 'a) Đúng — phản ứng xà phòng hoá không thuận nghịch. b) Sai — ester không có liên kết hydrogen liên phân tử nên sôi thấp hơn acid. c) Đúng — cùng công thức C₄H₈O₂. d) Sai — ester ít tan trong nước.',
    }
  }
  if (phan === 'III') {
    return {
      ...chung, text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là bao nhiêu gam?', choices: [], ideas: [],
      correct: '8,2', solution: 'n(ester) = 8,8 : 88 = 0,1 mol ⇒ n(CH₃COONa) = 0,1 mol ⇒ m = 0,1 × 82 = 8,2 gam.',
    }
  }
  return {
    ...chung, text: 'Chất nào sau đây là ester?', choices: ['CH₃COOH', 'CH₃COOCH₃', 'C₂H₅OH', 'HCOONa'], ideas: [],
    correct: 'B', solution: 'Ester có nhóm –COO– nối hai gốc hydrocarbon: CH₃COOCH₃ (methyl acetate).',
  }
}

/** Trả lời lệnh `/gv/goi-bai-7` (thân lệnh như app thầy gửi). */
export function goi7Du(b: Record<string, unknown>): Record<string, unknown> {
  if (b.action === 'chi_tiet') return { ok: true, cau: cauChiTiet(String(b.qid ?? '')) }
  if (b.action === 'chua') return { ok: true, daLuu: true }
  if (thamSo().get('g7') === 'trong') return { ok: true, bat: true, goi: [], cau: [], em: [] }
  const goi = GOI.filter((g) => !b.lop || g.lop === b.lop)
  const g = goi.find((x) => x.id === b.goiId) ?? goi[0]
  if (!g) return { ok: true, bat: true, goi: [], cau: [], em: [] }
  return { ...lapGoi(g), goi: goi.map(({ id, ten, lop, bat_dau, han }) => ({ id, ten, lop, bat_dau, han, tick_id: id, tao_luc: `${bat_dau}T07:00:00Z` })) }
}

/** Cùng dạng `goiLenh` (KetQuaLenh): `?g7=loi` ⇒ lỗi mạng nói thật. */
export function goi7Gia(b: Record<string, unknown>) {
  if (thamSo().get('g7') === 'loi' && !b.action) return { ok: false as const, loai: 'mang' as const, chu: 'Không nối được máy chủ. Thầy kiểm tra mạng rồi bấm Cập nhật.' }
  return { ok: true as const, du: goi7Du(b) }
}
