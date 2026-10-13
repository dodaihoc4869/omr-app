// @vitest-environment node
// ĐỢT 18 (13/10) — ĐỘ TIN CẬY CỦA NHÓM trên Nhịp học của thầy (`/gv/nhip-hoc`). Máy chủ CHỈ THÊM `doTinCay` / `canThem` mỗi dòng em, tính bằng
// `tinCayNhomNhip` (server/src/nhip-hoc.ts) — CÙNG hàm `/hs/nhip-hoc` (`nhipHocCuaEm`) dùng ⇒ thầy và em thấy một số. Không truy vấn D1 thêm, KHÔNG đổi
// nhóm (luật thầy duyệt `nhomNhipTheoLuat`, nhip-hoc-luat.ts). Kiểm:
//   (1) D1 thật (SQLite, lược đồ repo): cùng dữ liệu ⇒ `doTinCay` / `canThem` của em ở `/gv/nhip-hoc` (cả qua tuyến Worker) TRÙNG `/hs/nhip-hoc`;
//   (2) ẢNH CHỤP NHÓM: 720 em mẫu (3 hạt × 120 em × 2 "hôm nay") — nhóm app tính TRÙNG ảnh chụp lấy bằng mã TRƯỚC đợt 18 (commit 77c02b71); gắn
//       thêm độ tin cậy không đổi nhóm; độ tin cậy máy chủ thuộc ĐÚNG nhóm app hiện; 'chua-du' ⇒ không có độ tin cậy;
//   (3) app đọc trả lời (kẹp 0–99, máy chủ cũ không gửi ⇒ không chip) + chữ chip ("Độ tin cậy N%" · "đang theo dõi" dưới 90%).
// Tên em là tên giả.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import type { EmNhipHoc, KetQuaNhipHoc, KetQuaNhipHocEm, NgayNhipEm } from '../server/src/nhip-hoc-kieu'
import { ngayVnCua } from '../server/src/bai-hang-ngay'
import { gvNhipHoc, tinCayNhomNhip } from '../server/src/nhip-hoc'
import { hsNhipHoc } from '../server/src/nhip-hoc-em'
import { tomTatNhip } from '../server/src/nhip-hoc-luat'
import { NGUONG_CHAC } from '../server/src/thai-do-tin-cay'
import { gameToken } from '../server/src/game-v2-auth'
import { chipTinCay, docNhipHoc, NGUONG_TIN_CAY, phanNhomEm } from '../src/lib/nhip-hoc-thay'

type D = ReturnType<typeof taoD1That>
const NOW = Date.parse('2026-10-14T05:00:00Z') // 12:00 Thứ Tư 14/10 giờ Việt Nam
afterEach(() => vi.useRealTimers())
const NGAY = Array.from({ length: 14 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)

// ------------------------------------------------------------------ (1) D1 thật: thầy = em

const themEm = (d: D, sbd: string, ten: string, taoLuc: string | null = null) => {
  d.sql.prepare('INSERT INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc) VALUES (?,?,?,?,?)').run(sbd, ten, '2009', '12', 'x')
  d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, mat_khau, tao_luc, cap_nhat_luc) VALUES (?,?,?,?,?,?,?)').run(sbd, ten, '12', '12 - Tinh Hoa', `mk-${sbd}`, taoLuc, 'x')
}
let k = 0
const luc = (ngay: string, gioVn = 10, phut = 0) => new Date(Date.parse(`${ngay}T00:00:00+07:00`) + (gioVn * 60 + phut) * 60_000).toISOString()
/** Mỗi ngày mức 2 câu (đã chốt), kế hoạch 2 câu; `lam[i]` = số câu kế hoạch đã làm ngày i (từ 01/10 + `tu`). */
function ngayEm(d: D, sbd: string, lam: readonly number[], tu = 0) {
  lam.forEach((n, j) => {
    const ng = NGAY[tu + j]!
    d.sql.prepare('INSERT INTO hanh_trinh_v3_ngay (sbd, ngay, tang, toi_thieu) VALUES (?,?,?,?)').run(sbd, ng, 1, 2)
    d.sql.prepare('INSERT INTO srs2_ke_hoach (sbd, ngay, chien_dich_id, dao_json, doan_json, tong, tao_luc) VALUES (?,?,?,?,?,?,?)')
      .run(sbd, ng, 'hanh-trinh-v3-khoi-12', JSON.stringify([`${sbd}${ng}a`, `${sbd}${ng}b`]), '[]', 2, 'x')
    for (let i = 0; i < n; i++) {
      const l = luc(ng, 8, i)
      d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES (?,?,?,?,?,?,?,?,?,?)')
        .run(`k${String(++k).padStart(5, '0')}`, sbd, `${sbd}${ng}${'ab'[i]}`, 'game', 'P', 1, 1, 40, l, ngayVnCua(Date.parse(l)))
    }
  })
}
/**
 * L (Lười, có 6 ngày liền bỏ ⇒ sự việc, chắc) · C (Chăm 13/13) · M (vào muộn 10/10, Chăm 4/4 ⇒ ít ngày, đang theo dõi) ·
 * U (Chưa đều 9/13, sát ngưỡng) · X (vào 13/10 ⇒ dưới 3 ngày đã qua, chưa đủ dữ liệu).
 */
function boDuLieu() {
  const d = taoD1That()
  for (const q of [...SQL_BANG_HANH_TRINH, ...SQL_GOI7]) d.sql.exec(q)
  themEm(d, 'L', 'Ngô Lười Giả')
  themEm(d, 'C', 'Trần Chăm Giả')
  themEm(d, 'M', 'Lý Muộn Giả', '2026-10-10T02:00:00Z')
  themEm(d, 'U', 'Đỗ Đều Giả')
  themEm(d, 'X', 'Hà Mới Giả', '2026-10-13T02:00:00Z')
  d.sql.prepare("INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, tao_luc, trang_thai) VALUES (?,?,?,?,?,?,?,?, 'dang_chay')")
    .run('hanh-trinh-v3-khoi-12', 'Hành trình · Khối 12', 'Khối 12', JSON.stringify(['L', 'C', 'M', 'U', 'X']), '[]', '[]', '9999-12-31', '2026-10-01T00:00:00Z')
  ngayEm(d, 'L', [2, 2, 2, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 1])
  ngayEm(d, 'C', [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0])
  ngayEm(d, 'M', [2, 2, 2, 2, 2], 9)
  ngayEm(d, 'U', [2, 1, 2, 2, 0, 2, 2, 1, 2, 2, 1, 2, 2, 0])
  ngayEm(d, 'X', [2, 2], 12)
  return d
}

describe('(1) /gv/nhip-hoc mỗi dòng em ⇒ CÙNG độ tin cậy với /hs/nhip-hoc (cùng dữ liệu)', () => {
  it('L · C · M · U: doTinCay / canThem TRÙNG bảng của em; nhóm app từ dòng thầy = nhóm của em; X chưa đủ dữ liệu ⇒ cả hai không có', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    const d = boDuLieu()
    const env = d.env as unknown as Env
    const thay = (await gvNhipHoc(env, {}, NOW)) as KetQuaNhipHoc
    expect(thay.ok).toBe(true)
    const qua = (await goiWorker(worker, env, '/gv/nhip-hoc', {}, true)) as KetQuaNhipHoc // tuyến Worker thật của thầy
    const ca: Record<string, { nhom: string; tin?: number; them?: string }> = {}
    for (const sbd of ['L', 'C', 'M', 'U', 'X']) {
      const e = thay.em.find((x) => x.sbd === sbd)!
      const em = (await hsNhipHoc(env, { token: await gameToken(env, sbd) }, NOW)) as KetQuaNhipHocEm
      expect(em.ok).toBe(true)
      expect([e.doTinCay, e.canThem]).toEqual([em.doTinCay, em.canThem])
      const viaWorker = qua.em.find((x) => x.sbd === sbd)!
      expect([viaWorker.doTinCay, viaWorker.canThem]).toEqual([em.doTinCay, em.canThem])
      const dong = phanNhomEm(docNhipHoc(qua as unknown as Record<string, unknown>)!.em.find((x) => x.sbd === sbd)!, qua.ngay, qua.homNay)
      expect(dong.nhom).toBe(em.nhom)
      expect([dong.doTinCay, dong.canThem]).toEqual([em.doTinCay, em.canThem])
      ca[sbd] = { nhom: em.nhom, tin: em.doTinCay, them: em.canThem }
    }
    // Số cụ thể (Jeffreys — thai-do-tin-cay.ts): 6 ngày liền bỏ là SỰ VIỆC ⇒ Lười chắc (trần 99); 13/13 ngày ⇒ Chăm chắc; 4/4 ngày ⇒ còn tạm.
    expect(ca.L).toMatchObject({ nhom: 'luoi', tin: 99 })
    expect(ca.L!.them).toBeUndefined()
    expect(ca.C!.nhom).toBe('cham')
    expect(ca.C!.tin).toBeGreaterThanOrEqual(NGUONG_CHAC)
    expect(ca.C!.them).toBeUndefined()
    expect(ca.M!.nhom).toBe('cham')
    expect(ca.M!.tin).toBeLessThan(NGUONG_CHAC)
    expect(ca.M!.them).toMatch(/ngày/)
    expect(ca.U!.nhom).toBe('chua-deu')
    expect(ca.U!.tin).toBeLessThan(NGUONG_CHAC)
    expect(typeof ca.U!.them).toBe('string')
    expect(ca.X).toEqual({ nhom: 'chua-du', tin: undefined, them: undefined })
  })
})

// ------------------------------------------------------------------ (2) ảnh chụp nhóm — không đổi so với trước đợt 18

/** Bộ em mẫu tất định (LCG): 70% vào từ 01/10, còn lại vào muộn ngẫu nhiên; mức 2–36 câu; mỗi em một "độ chăm". */
function boMau(hat: number, so: number): EmNhipHoc[] {
  let x = hat >>> 0
  const nn = () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 2 ** 32
  return Array.from({ length: so }, (_, i) => {
    const vao = nn() < 0.7 ? 0 : Math.floor(nn() * NGAY.length)
    const cham = nn()
    const muc = NGAY.map(() => 2 + Math.floor(nn() * 35))
    const lam = muc.map((m) => (nn() < cham ? m + Math.floor(nn() * 3) : nn() < 0.5 ? 0 : Math.floor(nn() * m)))
    return { sbd: `E${i}`, hoTen: `Em ${i}`, lop: '12A1', khoi: '12', ngayVao: NGAY[vao]!, muc, lam, doiPho: null }
  })
}
const MA = { cham: 'c', 'chua-deu': 'd', luoi: 'l', 'chua-du': 'x' } as const
/** ẢNH CHỤP lấy bằng `phanNhomEm` của commit 77c02b71 (TRƯỚC đợt 18) trên đúng `boMau` — thứ tự: hạt 1310, 2026, 7 × hôm nay 14/10, 10/10. */
const ANH_CHUP_TRUOC = [
  'dldcllllldlclldddlclllddcdddldldlcldcllcdldlddllxdldlllxxdxlcldclcdlllddcdllldxlccclxcdxdxldllcldlldlddldcdddcdxcllddlll',
  'dldcllldldlcldxddlclllddcxldlcldlcddcdlcdldxdlllxdldlllxxdxldlcclcdlxlldddxlxdxlccclxxdxdxldllcldlxllldldcxddddxclxddlll',
  'llddllllxcllccddddccllldxllldldcldlldllddllddlllldllddldlcdddclcldlxcddllldddllxllllcdllcdclcclllllldlddldxclccdldcdldll',
  'lxddllllxcxlccddddxcllddxlxddldcldlldxlddllddllllxdlxdlddcdddxlclxlxclddlldldllxllllcdllcdclcdxllllldxxdlcxclccdldcdldlx',
  'cldllcldllllccldldxldccldlccllcdddddddddddxcdccdlldlxdcclldlllclllllclcldclllclclclllldxdclddlxddccllccdlllddlcdlllcdlll',
  'cldllcddllllccldlcxldcdldddcllcdxddxdcldddxcdcxdlldlxdxcdldxddclllllclxldclllcldxclxlllxdclddlxxdcxldccdlllddlccldldddll',
]
/** Độ tin cậy máy chủ gửi cho một em — đúng đường `gvNhipHoc`: ngày từ ngày vào (gồm hôm nay) ⇒ `tomTatNhip` ⇒ `tinCayNhomNhip`. */
function tinMayChu(e: EmNhipHoc, homNay: string) {
  const dai: NgayNhipEm[] = NGAY.map((ngay, i) => ({ ngay, muc: e.muc[i]!, lam: e.lam[i]! })).filter((n) => n.ngay >= e.ngayVao && n.ngay <= homNay)
  const t = tomTatNhip(dai, homNay)
  return { nhom: t.nhom, ...tinCayNhomNhip(t) }
}

describe('(2) nhóm KHÔNG đổi (ảnh chụp trước đợt 18) và độ tin cậy thuộc đúng nhóm app hiện', () => {
  it('720 em mẫu: nhóm app = ảnh chụp; gắn độ tin cậy vẫn y nhóm; nhóm máy chủ dùng để tính độ tin cậy = nhóm app; chua-du ⇒ không có', () => {
    const ra: string[] = []
    let co = 0, tam = 0
    for (const hat of [1310, 2026, 7]) {
      for (const homNay of [NGAY[13]!, NGAY[9]!]) {
        const ngay = NGAY.filter((n) => n <= homNay)
        const ma: string[] = []
        for (const e0 of boMau(hat, 120)) {
          const anh = phanNhomEm(e0, NGAY, homNay) // ĐÚNG lời gọi đã dùng để lấy ảnh chụp
          // trả lời thật của máy chủ chỉ có các ngày tới hôm nay ⇒ dải cắt tới hôm nay (ngày sau hôm nay vốn không được tính)
          const e = { ...e0, muc: e0.muc.slice(0, ngay.length), lam: e0.lam.slice(0, ngay.length) }
          const truoc = phanNhomEm(e, ngay, homNay)
          expect(truoc.nhom).toBe(anh.nhom)
          const mc = tinMayChu(e0, homNay)
          const sau = phanNhomEm({ ...e, ...(mc.doTinCay !== undefined ? { doTinCay: mc.doTinCay } : {}), ...(mc.canThem ? { canThem: mc.canThem } : {}) }, ngay, homNay)
          expect(sau.nhom).toBe(truoc.nhom)
          expect(mc.nhom).toBe(truoc.nhom)
          if (truoc.nhom === 'chua-du') expect(mc.doTinCay).toBeUndefined()
          else {
            expect(mc.doTinCay).toBeGreaterThanOrEqual(0)
            expect(mc.doTinCay).toBeLessThanOrEqual(99)
            expect(sau.doTinCay).toBe(mc.doTinCay)
            expect(mc.canThem === undefined).toBe(mc.doTinCay! >= NGUONG_CHAC)
            co++
            if (mc.doTinCay! < NGUONG_CHAC) tam++
          }
          ma.push(MA[anh.nhom])
        }
        ra.push(ma.join(''))
      }
    }
    expect(ra).toEqual(ANH_CHUP_TRUOC)
    expect(co).toBeGreaterThan(600) // bộ mẫu thật sự phủ cả ba nhóm có độ tin cậy
    expect(tam).toBeGreaterThan(50) // … và cả trường hợp "đang theo dõi"
  })
})

// ------------------------------------------------------------------ (3) app đọc trả lời + chữ chip

const khung = (em: Record<string, unknown>) => ({ ok: true, tu: NGAY[0], den: NGAY[13], homNay: NGAY[13], ngay: NGAY, em: [em], lop: [], doiPhoDaTinh: { quaNhanh: true, chonLap: true }, canhBao: [] })
const emGoc = { sbd: 'A', hoTen: 'Em A', lop: '12A1', khoi: '12', ngayVao: NGAY[0], muc: NGAY.map(() => 2), lam: NGAY.map(() => 2), doiPho: null }

describe('(3) app thầy đọc độ tin cậy và dựng chữ chip', () => {
  it('kẹp 0–99 · máy chủ cũ không gửi ⇒ không có · "cần thêm" chỉ đi kèm độ tin cậy · chữ không phải số ⇒ bỏ', () => {
    expect(docNhipHoc(khung({ ...emGoc, doTinCay: 99.7 }))!.em[0]!.doTinCay).toBe(99)
    expect(docNhipHoc(khung({ ...emGoc, doTinCay: -3 }))!.em[0]!.doTinCay).toBe(0)
    const cu = docNhipHoc(khung(emGoc))!.em[0]!
    expect('doTinCay' in cu || 'canThem' in cu).toBe(false)
    expect('canThem' in docNhipHoc(khung({ ...emGoc, canThem: 'Cần thêm khoảng 3 ngày' }))!.em[0]!).toBe(false)
    expect(docNhipHoc(khung({ ...emGoc, doTinCay: '80' }))!.em[0]!.doTinCay).toBeUndefined()
    const co = docNhipHoc(khung({ ...emGoc, doTinCay: 72, canThem: '  Cần thêm khoảng 5 ngày có số liệu (giữ nhịp như hiện nay) để độ tin cậy đạt 90%.  ' }))!.em[0]!
    expect(co).toMatchObject({ doTinCay: 72, canThem: 'Cần thêm khoảng 5 ngày có số liệu (giữ nhịp như hiện nay) để độ tin cậy đạt 90%.' })
    // nhóm 'chua-du' (dưới 3 ngày đã qua) ⇒ dòng không mang độ tin cậy dù trả lời có
    expect(phanNhomEm(co, NGAY.slice(0, 3), NGAY[2]!).doTinCay).toBeUndefined()
    expect(phanNhomEm(co, NGAY, NGAY[13]!)).toMatchObject({ nhom: 'cham', doTinCay: 72 })
  })

  it('chip: từ 90% "Độ tin cậy N%" (chắc); dưới 90% "Độ tin cậy N% · đang theo dõi" + câu cần thêm; không có ⇒ null', () => {
    expect(NGUONG_TIN_CAY).toBe(NGUONG_CHAC)
    expect(chipTinCay({})).toBeNull()
    expect(chipTinCay({ doTinCay: 94 })).toEqual({ chu: 'Độ tin cậy 94%', tam: false, giaiThich: 'Kết luận chắc khi độ tin cậy từ 90%.' })
    expect(chipTinCay({ doTinCay: 90 })!.tam).toBe(false)
    expect(chipTinCay({ doTinCay: 89, canThem: 'cần thêm khoảng 2 ngày có số liệu' })).toEqual({ chu: 'Độ tin cậy 89% · đang theo dõi', tam: true, giaiThich: 'Cần thêm khoảng 2 ngày có số liệu' })
    expect(chipTinCay({ doTinCay: 60 })!.giaiThich).toBe('Độ tin cậy dưới 90%: cần thêm ngày làm bài để chắc.')
  })
})
