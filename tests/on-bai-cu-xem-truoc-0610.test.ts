// @vitest-environment node
// DÒNG "ÔN BÀI CŨ" CỦA THẺ XÁC NHẬN (thầy 06/10: "chọn Bài 6 thì tổng số câu ôn của Bài 1–5 khi hết hạn khoảng bao nhiêu, có giúp học sinh ôn trọn vẹn không") —
// `POST /gv/bai-da-day` action `xem-truoc` trả thêm khối `onBaiCu` { toiDaMoiEm N, khoCau X, phuPhanTram Y, soBai, tiLe } (server/src/bai-da-day.ts), D1 thật node:sqlite:
//   N = Σ ngày 1..D ⌊thể lực × tỉ lệ ngày⌋ (D = hạn tự tính 7–14 hoặc hạn thầy đặt; tỉ lệ theo lớp), X = câu hợp lệ ĐÚNG KHỐI của các bài đứng trước (đã duyệt, không tự luận,
//   tờ DẠY HỌC, bỏ câu bài sắp giao + câu chiến dịch đang chạy; ĐẾM THẬT, không cắt 800), Y = min(100, làm tròn(N / X × 100)); kho 0 / lỗi ⇒ KHÔNG có trường.
// Số liệu tính tay (xem comment từng ca). Không mock: đi đường thật `gvBaiDaDay` + `docHoSo2` (đối chiếu kho đếm với tập ứng viên của em sau khi giao).
import { describe, expect, it, vi } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { gvBaiDaDay, HAN_KHO_ON_BAI_CU_MS } from '../server/src/bai-da-day'
import { gvChienDich } from '../server/src/srs2-gv'
import { docHoSo2, xoaDemChienDich } from '../server/src/srs2-d1'
import { themChienDich } from './omni-3-ke-hoach-chung'

const T0 = Date.parse('2026-10-05T09:00:00+07:00') // hôm nay (VN) 2026-10-05
const HOM_NAY = '2026-10-05'
const LOP = '12 - Tinh Hoa'
const LOP2 = '12 - Chuyên'
const B4 = 'DH-12-C2-B4', B5 = 'DH-12-C2-B5', B6 = 'DH-12-C2-B6'
const MA_B6 = [`${B6}-TN`, `${B6}-DS`, `${B6}-TLN`]
const TEN_B6 = 'Bài 6. Tinh bột và cellulose'
const BAI_TRUOC = [
  { khoaBai: 'B4', tenBai: 'Bài 4. Glucose và fructose', viTri: 4, maDe: [`${B4}-TN`, `${B4}-DS`] },
  { khoaBai: 'B5', tenBai: 'Bài 5. Saccharose và maltose', viTri: 5, maDe: [`${B5}-TN`, `${B5}-DS`] },
]

type Tho = Record<string, unknown>
const cau = (maDe: string, qid: string, phan: 'I' | 'II' | 'III', o: Tho = {}) => JSON.stringify({
  qid, maDe, version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
  hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'NB', sao: 1, kienThuc: ['k'], correct: phan === 'I' ? 'B' : phan === 'II' ? 'DSDS' : '4', reviewed: true, solution: { chot: 'c' }, ...o,
})
const TU_LUAN = { correct: 'vì khối lượng riêng nhỏ hơn nước nên nổi lên trên' } // Phần III đáp án là câu chữ ⇒ câu tự luận (cam-tu-luan.ts)

/**
 * Lớp "12 - Tinh Hoa": S1, S2, S3 (khối 12); lớp "12 - Chuyên": S4. Kho:
 *  · Bài 4 (DH-12-C2-B4): 60 câu hợp lệ + 5 chưa duyệt + 3 tự luận;  · Bài 5 (DH-12-C2-B5): 50 câu hợp lệ;
 *  · Bài 6 (bài sắp giao): 6 Phần I + 2 Phần II + 1 Phần III hợp lệ + 1 Phần III tự luận (⇒ 9 câu, luotCan 18 ⇒ D = 7);
 *  · tờ TU LUYỆN `KHO-A` (10 câu) và tờ khối 11 `DH-11-C2-B3` (7 câu) — app (cố tình) gửi lẫn vào phạm vi: phải bị bỏ.
 * Chiến dịch ĐANG CHẠY `CD-RUN` (S1, S2, S3; hạn 10/10) lấy 10 câu đầu của Bài 4 ⇒ những câu ấy KHÔNG phải câu ôn bài cũ.
 */
function dung(): { d: D1That; env: Env; qB4: string[]; qB5: string[] } {
  const d = taoD1That()
  const env = d.env as unknown as Env
  const hs = d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,trang_thai,cap_nhat_luc) VALUES(?,?,?,?,?,?)')
  for (const [s, ten, tl] of [['S1', 'An', LOP], ['S2', 'Bảo', LOP], ['S3', 'Chi', LOP], ['S4', 'Dũng', LOP2]] as const) hs.run(s, ten, '12', tl, null, 'x')
  const q = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  const them = (maDe: string, qid: string, phan: 'I' | 'II' | 'III', o: Tho = {}) => q.run(maDe, qid, 'v1', `g-${qid}`, 'D1', cau(maDe, qid, phan, o))
  const qB4: string[] = [], qB5: string[] = []
  for (let i = 1; i <= 60; i++) { them(B4, `${B4}-I-${i}`, 'I'); qB4.push(`${B4}-I-${i}`) }
  for (let i = 1; i <= 5; i++) them(B4, `${B4}-U-${i}`, 'I', { reviewed: false })
  for (let i = 1; i <= 3; i++) them(B4, `${B4}-III-${i}`, 'III', TU_LUAN)
  for (let i = 1; i <= 50; i++) { them(B5, `${B5}-I-${i}`, 'I'); qB5.push(`${B5}-I-${i}`) }
  for (let i = 1; i <= 6; i++) them(B6, `${B6}-I-${i}`, 'I')
  for (let i = 1; i <= 2; i++) them(B6, `${B6}-II-${i}`, 'II')
  them(B6, `${B6}-III-1`, 'III')
  them(B6, `${B6}-III-2`, 'III', TU_LUAN)
  for (let i = 1; i <= 10; i++) them('KHO-A', `KHO-A-${i}`, 'I')
  for (let i = 1; i <= 7; i++) them('DH-11-C2-B3', `DH-11-C2-B3-I-${i}`, 'I')
  themChienDich(d, { id: 'CD-RUN', maDe: [B4], qids: qB4.slice(0, 10), sbd: ['S1', 'S2', 'S3'], hanNop: '2026-10-10', taoLuc: '2026-10-03T01:00:00.000Z', theLuc: 40 })
  return { d, env, qB4, qB5 }
}
/** Phạm vi gửi kèm xem-truoc: Bài 4, Bài 5 và hai tờ "lẫn" (TU LUYỆN, khối 11). */
const PHAM_VI = [
  ...BAI_TRUOC,
  { khoaBai: 'KHO', tenBai: 'Đề ôn', viTri: 3, maDe: ['KHO-A'] },
  { khoaBai: 'B3-11', tenBai: 'Bài 3 khối 11', viTri: 2, maDe: ['DH-11-C2-B3-TN'] },
]
const xem = (env: Env, them: Tho = {}) => gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, khoaBai: 'B6', tenBai: TEN_B6, viTri: 6, maDe: MA_B6, phamVi: PHAM_VI, ...them }, T0)
const luuCauHinh = (d: D1That, env: Env, khoa: string, giaTri: unknown) => {
  d.sql.prepare('INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri').run(khoa, JSON.stringify(giaTri), 'x')
  xoaDemCauHinh(env)
}

describe('xem-truoc · khối `onBaiCu` — N, X, Y tính tay', () => {
  it('Bài 4 (60 hợp lệ − 10 của chiến dịch đang chạy) + Bài 5 (50) ⇒ X = 100; D = 7, thể lực 40 ⇒ N = 8 × 7 + 16 = 72 ⇒ Y = 72 %; tờ TU LUYỆN, tờ khối 11, câu chưa duyệt, câu tự luận KHÔNG tính', async () => {
    const { env } = dung()
    const r = await xem(env)
    expect(r).toMatchObject({ ok: true, D: 7, theLucNgay: 40, soCau: 9 })
    expect(r.onBaiCu).toEqual({ toiDaMoiEm: 72, khoCau: 100, phuPhanTram: 72, soBai: 2, tiLe: { thuong: 0.2, cuoi: 0.4 } })
  })
  it('hạn thầy đặt ⇒ D theo hạn ấy (D = 12 ⇒ N = 8 × 12 + 16 = 112 ⇒ Y kẹp 100); thể lực nhập tay 50, D = 7 ⇒ N = 5 × 10 + 2 × 20 = 90 ⇒ Y = 90', async () => {
    const { env } = dung()
    const a = await xem(env, { hanNop: '2026-10-16' })
    expect(a).toMatchObject({ D: 12 })
    expect(a.onBaiCu).toMatchObject({ toiDaMoiEm: 112, khoCau: 100, phuPhanTram: 100 })
    const b = await xem(env, { theLucNgay: 50, hanNop: '2026-10-11' })
    expect(b).toMatchObject({ D: 7, theLucNgay: 50 })
    expect(b.onBaiCu).toMatchObject({ toiDaMoiEm: 90, khoCau: 100, phuPhanTram: 90 })
  })
  it('thể lực mặc định của lớp (cau_hinh.the_luc_lop) đi vào N: thể lực 30 ⇒ N = 5 × 6 + 2 × 12 = 54 ⇒ Y = 54', async () => {
    const { d, env } = dung()
    luuCauHinh(d, env, 'the_luc_lop', { [LOP]: 30 })
    const r = await xem(env)
    expect(r).toMatchObject({ theLucNgay: 30, D: 7 })
    expect(r.onBaiCu).toMatchObject({ toiDaMoiEm: 54, khoCau: 100, phuPhanTram: 54 })
  })
  it('tỉ lệ theo lớp (cau_hinh.on_bai_cu_ti_le): 10 % / 20 % ⇒ N = 5 × 4 + 2 × 8 = 36 ⇒ Y = 36, `tiLe` trả đúng; lớp khác (12 - Chuyên, X = 110 vì em lớp ấy không thuộc chiến dịch đang chạy) dùng tỉ lệ riêng của nó', async () => {
    const { d, env } = dung()
    luuCauHinh(d, env, 'on_bai_cu_ti_le', { lop: { [LOP]: { thuong: 0.1, cuoi: 0.2 }, [LOP2]: { thuong: 0.5, cuoi: 0.6 } } })
    const a = await xem(env)
    expect(a.onBaiCu).toEqual({ toiDaMoiEm: 36, khoCau: 100, phuPhanTram: 36, soBai: 2, tiLe: { thuong: 0.1, cuoi: 0.2 } })
    // 12 - Chuyên: 50 % / 60 % ⇒ N = 5 × 20 + 2 × 24 = 148; kho 60 + 50 = 110 (CD-RUN không có S4) ⇒ Y kẹp 100
    const b = await xem(env, { lop: LOP2 })
    expect(b.onBaiCu).toEqual({ toiDaMoiEm: 148, khoCau: 110, phuPhanTram: 100, soBai: 2, tiLe: { thuong: 0.5, cuoi: 0.6 } })
  })
  it('tỉ lệ sai kiểu / ngoài [0; 0,6] ⇒ bỏ qua, dòng tính theo 20 % / 40 %', async () => {
    const { d, env } = dung()
    luuCauHinh(d, env, 'on_bai_cu_ti_le', { lop: { [LOP]: { thuong: 0.9, cuoi: 'x' } } })
    expect((await xem(env)).onBaiCu).toMatchObject({ toiDaMoiEm: 72, tiLe: { thuong: 0.2, cuoi: 0.4 } })
  })
  it('chọn em (sbd) vẫn tính đúng: chỉ S1 (thuộc chiến dịch đang chạy) ⇒ X = 100; chỉ S4 (không thuộc) ⇒ X = 110 theo lớp của S4 khi gọi bằng lớp ấy', async () => {
    const { env } = dung()
    expect((await xem(env, { sbd: ['S1'] })).onBaiCu).toMatchObject({ khoCau: 100 })
    expect((await xem(env, { lop: LOP2, sbd: ['S4'] })).onBaiCu).toMatchObject({ khoCau: 110 })
  })
  it('câu chung hai tờ chỉ đếm MỘT lần (bài gần nhất giữ)', async () => {
    const { d, env } = dung()
    // 4 câu của Bài 4 cũng nằm ở tờ Bài 5 (cùng qid, khác tờ) và không thuộc chiến dịch đang chạy (câu 11–14 của Bài 4)
    const q = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
    for (let i = 11; i <= 14; i++) q.run(B5, `${B4}-I-${i}`, 'v1', `g-${B4}-I-${i}`, 'D1', cau(B5, `${B4}-I-${i}`, 'I'))
    expect((await xem(env)).onBaiCu).toMatchObject({ khoCau: 100 }) // vẫn 100: 4 câu chung không tính hai lần
  })
  it('không đổi dữ liệu: xem-truoc chỉ ĐỌC (không chiến dịch / bảng phạm vi mới)', async () => {
    const { d, env } = dung()
    const truoc = [d.dem('chien_dich'), d.dem('bai_da_day'), d.dem('pham_vi_lop'), d.dem('cau_hinh')]
    await xem(env)
    expect([d.dem('chien_dich'), d.dem('bai_da_day'), d.dem('pham_vi_lop'), d.dem('cau_hinh')]).toEqual(truoc)
  })
})

describe('xem-truoc · khối `onBaiCu` VẮNG (không hiện dòng, màn y hệt cũ)', () => {
  it('app cũ không gửi phamVi và lớp chưa có phạm vi ⇒ không có trường (cả phản hồi y hệt trước)', async () => {
    const { env } = dung()
    const r = await gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, khoaBai: 'B6', tenBai: TEN_B6, viTri: 6, maDe: MA_B6 }, T0)
    expect('onBaiCu' in r).toBe(false)
    expect(r).toEqual({ ok: true, soCau: 9, soTuLuan: 1, hanNop: '2026-10-11', D: 7, luotCan: 18, sucChua: 280, soEmChon: 3, duLuot: 3, tongEm: 3, duDiem8: null, quaTai: [], theLucNgay: 40 })
  })
  it('kho 0 ⇒ không có trường: phạm vi chỉ gồm tờ TU LUYỆN / khối 11 / bài sắp giao; hoặc mọi câu thuộc chiến dịch đang chạy', async () => {
    const { env } = dung()
    const chiLan = [{ khoaBai: 'KHO', tenBai: 'Đề ôn', viTri: 3, maDe: ['KHO-A'] }, { khoaBai: 'B3-11', tenBai: 'Bài 3 khối 11', viTri: 2, maDe: ['DH-11-C2-B3-TN'] }]
    expect('onBaiCu' in (await xem(env, { phamVi: chiLan }))).toBe(false)
    expect('onBaiCu' in (await xem(env, { phamVi: [] }))).toBe(false)
    // tờ của chính bài sắp giao gửi nhầm vào phamVi ⇒ bị bỏ (sau khi giao nó là chiến dịch đang chạy)
    expect('onBaiCu' in (await xem(env, { phamVi: [{ khoaBai: 'B6', tenBai: TEN_B6, viTri: 5, maDe: [`${B6}-TN`] }] }))).toBe(false)
  })
  it('lỗi đọc thư mục tờ ⇒ luật lùi ("DH-" là DẠY HỌC) vẫn đếm được; lỗi đọc câu của các bài TRƯỚC ⇒ không có trường nhưng phần còn lại của phản hồi vẫn đủ', async () => {
    const { env } = dung()
    const goc = env.DB.prepare.bind(env.DB)
    env.DB.prepare = ((q: string) => { if (/FROM de_kho_thu_muc/.test(q)) throw new Error('D1 hỏng'); return goc(q) }) as typeof env.DB.prepare
    expect((await xem(env)).onBaiCu).toMatchObject({ khoCau: 100 })
    // chỉ câu đọc các tờ có Bài 4 hỏng (câu của CHÍNH bài sắp giao vẫn đọc được)
    const { env: env2 } = dung()
    const goc2 = env2.DB.prepare.bind(env2.DB)
    env2.DB.prepare = ((q: string) => {
      const st = goc2(q) as unknown as { bind: (...a: unknown[]) => unknown; all: () => Promise<unknown> }
      if (!/FROM game_v2_question WHERE ma_de IN/.test(q)) return st as never
      const bindGoc = st.bind.bind(st)
      st.bind = (...a: unknown[]) => { if (String(a[0]).includes(B4)) st.all = async () => { throw new Error('D1 hỏng') }; return bindGoc(...a) }
      return st as never
    }) as typeof env2.DB.prepare
    const r = await xem(env2)
    expect(r).toMatchObject({ ok: true, soCau: 9, D: 7, luotCan: 18 })
    expect('onBaiCu' in r).toBe(false)
  })
})

describe('xem-truoc · đếm kho quá chậm KHÔNG làm chậm thẻ xác nhận', () => {
  it('kho chưa đọc xong sau HAN_KHO_ON_BAI_CU_MS ⇒ phản hồi vẫn đủ, bỏ dòng (không trường); đọc vẫn chạy tiếp ⇒ lần sau có dòng ngay từ đệm', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const { env } = dung()
      const goc = env.DB.prepare.bind(env.DB)
      // làm CHẬM câu đọc các tờ có Bài 4 (kho ôn bài cũ) — câu đọc của chính bài sắp giao vẫn nhanh
      env.DB.prepare = ((q: string) => {
        const st = goc(q) as unknown as { bind: (...a: unknown[]) => unknown; all: () => Promise<unknown> }
        if (!/FROM game_v2_question WHERE ma_de IN/.test(q)) return st as never
        const bindGoc = st.bind.bind(st)
        const allGoc = st.all.bind(st)
        st.bind = (...a: unknown[]) => { if (String(a[0]).includes(B4)) st.all = async () => { await new Promise<void>((xong) => setTimeout(xong, HAN_KHO_ON_BAI_CU_MS * 3)); return allGoc() }; return bindGoc(...a) }
        return st as never
      }) as typeof env.DB.prepare
      const p = xem(env)
      await vi.advanceTimersByTimeAsync(HAN_KHO_ON_BAI_CU_MS + 200)
      const r = await p
      expect(r).toMatchObject({ ok: true, soCau: 9, D: 7, luotCan: 18 })
      expect('onBaiCu' in r).toBe(false)
      await vi.advanceTimersByTimeAsync(HAN_KHO_ON_BAI_CU_MS * 3) // việc đọc nền xong ⇒ đệm sẵn
      expect((await xem(env)).onBaiCu).toMatchObject({ khoCau: 100 })
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('xem-truoc · kho = phạm vi hiện có của lớp ∪ phamVi gửi kèm; chiến dịch đang chạy bị bỏ; X khớp tập ứng viên của em sau khi giao', () => {
  it('Bài 5 đã giao (đang chạy) ⇒ câu Bài 5 không phải bài cũ; đóng chiến dịch Bài 5 ⇒ vào kho; không gửi phamVi vẫn đếm theo phạm vi D1 của lớp', async () => {
    const { d, env } = dung()
    const t5 = await gvBaiDaDay(env, { action: 'tick', lop: LOP, khoaBai: 'B5', tenBai: BAI_TRUOC[1]!.tenBai, viTri: 5, maDe: [`${B5}-TN`], phamVi: [BAI_TRUOC[0]] }, T0)
    expect(t5.ok).toBe(true)
    const khongPhamVi = () => gvBaiDaDay(env, { action: 'xem-truoc', lop: LOP, khoaBai: 'B6', tenBai: TEN_B6, viTri: 6, maDe: MA_B6 }, T0)
    // phạm vi D1: Bài 5 (tick) + Bài 4 (trước) ; Bài 5 đang chạy ⇒ chỉ Bài 4 (60 − 10 của CD-RUN) = 50
    expect((await khongPhamVi()).onBaiCu).toMatchObject({ khoCau: 50, soBai: 1 })
    // đóng chiến dịch Bài 5 ⇒ câu Bài 5 thành bài cũ: 50 + 50
    await gvChienDich(env, { action: 'dong', id: String(t5.chienDichId) }, T0)
    xoaDemChienDich()
    expect((await khongPhamVi()).onBaiCu).toMatchObject({ khoCau: 100, soBai: 2 })
    expect(d.dem('chien_dich', "trang_thai = 'da_dong'")).toBe(1)
  })
  it('ĐỐI CHIẾU: X (xem trước) = số câu ôn bài cũ trong hồ sơ của em chưa làm gì sau khi giao Bài 6 với đúng phamVi ấy', async () => {
    const { d, env } = dung()
    const r = await xem(env)
    const X = Number((r.onBaiCu as { khoCau: number }).khoCau)
    expect(X).toBe(100)
    // OMNI chỉ áp cho em khi Hoá 2.0 áp cho em (omniBat = cheDo2 ∧ cờ omni): bật cả hai cho toàn trung tâm
    d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x'),('omni','{"bat":true,"lop":[],"sbd":[]}','x')`)
    xoaDemCauHinh(env)
    const t = await gvBaiDaDay(env, { action: 'tick', lop: LOP, khoaBai: 'B6', tenBai: TEN_B6, viTri: 6, maDe: MA_B6, phamVi: PHAM_VI }, T0)
    expect(t.ok).toBe(true)
    const hs = await docHoSo2(env, 'S2', HOM_NAY)
    expect(hs.omni?.bat).toBe(true)
    expect(hs.onBaiCu).toHaveLength(X) // 50 câu Bài 4 + 50 câu Bài 5 (không có câu TU LUYỆN, khối 11, chưa duyệt, tự luận, chiến dịch đang chạy)
    expect(new Set(hs.onBaiCu!.map((c) => c.qid.split('-I-')[0])).size).toBe(2)
  })
})
