// @vitest-environment node
// CHẶN CÂU KHÁC KHỐI — TỪNG KÊNH RÚT CÂU (luật A) + TỪNG DANH SÁCH CHỮA BÀI / CHIẾU LÊN BẢNG (luật B) trên D1 THẬT (điều phối 05/10/2026).
// Lệnh thầy 05/10 (nguyên văn):
//   1) "rất nhiều cấu thuộc lớp 10 nhưng bị rút nhầm sang lớp 11, bạn phải chặn chuẩn 100% không được rút nhầm kho khác khối cho tôi nhé"
//   2) "mục câu cần chữa của khối 11 khi chiếu lên bảng thì rất nhiều câu của lớp 10 bị chèn vào, bạn xem mọi chỗ chặn triệt để rút nhầm câu của kho khối khác"
// Kho (tests/_kho-3-khoi-0510.ts): tờ khối 10 / 11 / 12 + tờ KHÔNG RÕ khối + tờ MÂU THUẪN khối, CÙNG một mã dạng, cùng chuyên đề `CD1`. Em S1 lớp 11 có câu sai MỌI
// tờ ở MỌI nguồn sổ. Mỗi kênh/danh sách một `it`: mọi câu ra máy em / ra danh sách của lớp 11 phải thuộc tờ khối 11 (`laCauDung11`) và KHÔNG rỗng (không chặn nhầm).
// TÁI HIỆN (trước bản vá, cùng lệnh này trên mã 2f60e665): xem báo cáo — các kênh lọt câu khối 10 / không rõ / mâu thuẫn đều ĐỎ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { gvChienDich } from '../server/src/srs2-gv'
import { layKeHoachHomNay } from '../server/src/srs2-d1'
import { startDoan2 } from '../server/src/srs2-game'
import { biaAction } from '../server/src/bi-a'
import { loiDenHan } from '../server/src/rut-de-v2'
import { demChanKhoi, xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { daHocDang } from './_pham-vi-ca-nhan'
import { CAC_TO, DANG, TO_LA, cacQidCua, dungKho, ghiSai, laCauDung11, mauMoiTo, mauMoiToPhan } from './_kho-3-khoi-0510'
import type { D1That } from './_d1-that'

const NGAY = '2026-10-06'
const T0 = Date.parse(`${NGAY}T10:00:00+07:00`)
const MOT_NGAY = 86_400_000
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaDemCaBaoVe(); xoaDemChanKhoi(); vi.spyOn(console, 'log').mockImplementation(() => undefined) })
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); xoaDemCaBaoVe() })

/** Mọi câu thuộc tờ khối 11 và danh sách KHÔNG rỗng. */
function chiKhoi11(qids: readonly string[], ten: string) {
  expect(qids.length, `${ten}: phải có câu để kiểm (không được chặn nhầm cả câu khối 11)`).toBeGreaterThan(0)
  expect(qids.filter((q) => !laCauDung11(q)), `${ten}: câu khác khối / không rõ / mâu thuẫn lọt ra`).toEqual([])
}
/** Luật B (danh sách của lớp 11): KHÔNG câu khối khác, KHÔNG câu mâu thuẫn khối; câu KHÔNG RÕ khối được giữ (có đếm) — xem `B_GIU_KHONG_RO`. Danh sách không rỗng. */
function khongKhacKhoi11(qids: readonly string[], ten: string) {
  expect(qids.length, `${ten}: phải có câu để kiểm`).toBeGreaterThan(0)
  expect(qids.filter((q) => !laCauDung11(q) && !String(q).startsWith(`${TO_LA}-`)), `${ten}: câu KHÁC khối / mâu thuẫn lọt vào danh sách lớp 11`).toEqual([])
  expect(qids.some(laCauDung11), `${ten}: phải còn câu khối 11`).toBe(true)
}
const goiGame = async (d: D1That, lenh: string, b: Record<string, unknown> = {}, sbd = 'S1') => gameV2(d.env, lenh, { token: await gameToken(d.env, sbd), ...b }) as Promise<Record<string, any>>
const hoSoGame = (d: D1That, sbd: string) => d.sql.prepare('INSERT OR IGNORE INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,0,?,?)')
  .run(sbd, JSON.stringify({ pet: 'dat_quy', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2026-09-21T05:00:00.000Z', luatCap: 2 }), 'x')
const batHoa2 = (d: D1That) => { d.sql.exec(`INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["11","10",""]}','x')`); xoaDemCauHinh(d.env) }
/** Chiến dịch lớp 11 THẦY CHỌN cả 5 tờ (kể cả tờ khối 10/12/không rõ/mâu thuẫn — luật C: giữ đúng thầy chọn). */
async function giaoChienDich(d: D1That, nowMs = T0 - 2 * MOT_NGAY, hanNop = '2026-10-20') {
  const r = await gvChienDich(d.env, { action: 'tao', ten: 'Ôn tổng hợp', lop: '11', maDe: CAC_TO, hanNop, theLucNgay: 60, raiDeu: false }, nowMs)
  expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
  return String(r.id)
}

describe('Kho + sổ dựng đúng (đối chứng: kho có đủ 5 tờ, sổ của S1 có câu sai mọi tờ)', () => {
  it('chỉ mục game đủ câu mọi tờ; sổ S1 có câu sai khối 10/12/không rõ/mâu thuẫn', async () => {
    const d = await dungKho()
    for (const to of CAC_TO) expect(d.dem('game_v2_question', `ma_de = '${to}'`), to).toBe(cacQidCua(to).length)
    await ghiSai(d, 'S1', mauMoiTo(3), T0 - 3 * MOT_NGAY)
    expect(d.dem('su_kien_hoc', "sbd = 'S1' AND ket_qua = 0")).toBe(15)
    expect(d.dem('nam_kt_cau', "sbd = 'S1'")).toBe(15)
  })
})

describe('LUẬT C — nơi thầy TỰ CHỌN giữ đúng thầy chọn', () => {
  it('chiến dịch thầy chọn 5 tờ (kể cả khối 10/12/không rõ/mâu thuẫn) ⇒ chiến dịch GIỮ đủ câu mọi tờ thầy chọn', async () => {
    const d = await dungKho()
    const id = await giaoChienDich(d)
    const cd = d.sql.prepare('SELECT qid_json, ma_de_json FROM chien_dich WHERE id = ?').get(id) as { qid_json: string; ma_de_json: string }
    expect(JSON.parse(cd.ma_de_json)).toEqual(CAC_TO)
    const qids = JSON.parse(cd.qid_json) as string[]
    for (const to of CAC_TO) expect(qids.some((q) => cacQidCua(to).includes(q)), to).toBe(true)
  })
})

describe('LUẬT A — Hoá 2.0 (kế hoạch ngày Đảo / Đoàn / Bi-a và mọi nguồn: chiến dịch, ca đã công bố, Lên bảng, đầu giờ, nguồn thứ 4)', () => {
  it('kế hoạch ngày + Đảo: chiến dịch có tờ khác khối ⇒ kế hoạch và chuyến Đảo CHỈ câu khối 11', async () => {
    const d = await dungKho()
    batHoa2(d)
    hoSoGame(d, 'S1')
    await giaoChienDich(d)
    const { kh } = await layKeHoachHomNay(d.env, 'S1', T0)
    chiKhoi11([...kh.dao, ...kh.doan], 'kế hoạch ngày')
    const r = await goiGame(d, 'start', { mode: 'adventure' })
    chiKhoi11(((r.questions ?? []) as { qid: string }[]).map((x) => x.qid), 'Đảo (Hoá 2.0)')
  })
  it('Đoàn: nợ từ câu sai MỌI nguồn (ca, Lên bảng, đầu giờ, game nguồn thứ 4, BTVN, Luyện đề) ⇒ chặng Đoàn CHỈ câu khối 11', async () => {
    const d = await dungKho()
    batHoa2(d)
    hoSoGame(d, 'S1')
    await ghiSai(d, 'S1', [...mauMoiTo(6), ...mauMoiToPhan('III', 3)], T0 - 3 * MOT_NGAY)
    const { kh } = await layKeHoachHomNay(d.env, 'S1', T0)
    chiKhoi11([...kh.dao, ...kh.doan], 'kế hoạch ngày (nợ)')
    const r = await startDoan2(d.env, 'S1', T0)
    chiKhoi11(((r.questions ?? []) as { qid: string }[]).map((x) => x.qid), 'Đoàn (Hoá 2.0)')
  })
  it('Bi-a: bàn A.I xếp từ kế hoạch (nợ câu sai mọi tờ) ⇒ mọi bi + câu chốt CHỈ câu khối 11', async () => {
    const d = await dungKho()
    batHoa2(d)
    hoSoGame(d, 'S1')
    d.sql.exec(`INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bi_a','{"bat":true}','x')`)
    xoaDemCauHinh(d.env)
    await ghiSai(d, 'S1', [...mauMoiTo(3), ...mauMoiToPhan('II', 2), ...mauMoiToPhan('III', 2)], T0 - 3 * MOT_NGAY)
    const r = await biaAction(d.env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, T0) as Record<string, any>
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    const qids = [...((r.cau ?? []) as { qid: string }[]).map((c) => c.qid), ...(r.chot ? [String(r.chot.qid)] : [])]
    chiKhoi11(qids, 'Bi-a')
  })
  it('lỗi đến hạn cho ca (`/ca/loi-den-han`, máy thầy rút đề riêng) ⇒ CHỈ lỗi câu khối 11', async () => {
    const d = await dungKho()
    batHoa2(d)
    await ghiSai(d, 'S1', mauMoiTo(4), T0 - 6 * MOT_NGAY, { nguon: ['game'] })
    const r = await loiDenHan(d.env, { sbd: ['S1'], ngay: NGAY }) as Record<string, any>
    expect(r.ok).toBe(true)
    chiKhoi11(((r.em?.S1 ?? []) as { qid: string }[]).map((x) => x.qid), 'lỗi đến hạn')
  })
})

describe('LUẬT B — danh sách chữa bài / chiếu lên bảng của lớp 11', () => {
  async function lopSaiNhieu() {
    const d = await dungKho()
    batHoa2(d)
    const id = await giaoChienDich(d, T0 - 9 * MOT_NGAY)
    // ≥ 4 lần sai (cắt tỉa ⇒ "Cần thầy dạy lại") ở câu của MỌI tờ, cả 3 em lớp 11 — sau mốc giao chiến dịch.
    for (const s of ['S1', 'S2', 'S4']) await ghiSai(d, s, mauMoiTo(3), T0 - 5 * MOT_NGAY, { soLan: 5, nguon: ['game'] })
    return { d, id }
  }
  it('Bảng chiến dịch: "Cần thầy dạy lại" (nút "Chiếu cả N câu lên bảng") CHỈ câu khối 11', async () => {
    const { d, id } = await lopSaiNhieu()
    const r = await gvChienDich(d.env, { action: 'bang', id }, T0) as Record<string, any>
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    khongKhacKhoi11(((r.canDayLai ?? []) as { qid: string; qidCung?: string[] }[]).flatMap((x) => [x.qid, ...(x.qidCung ?? [])]), 'Cần thầy dạy lại')
    for (const x of r.canDayLai as { cau?: { id: string } }[]) if (x.cau) expect(x.cau.id.startsWith('DH-10') || x.cau.id.startsWith('DH-12')).toBe(false)
    expect(demChanKhoi()['lop:can_day_lai']?.khac_khoi ?? 0).toBeGreaterThan(0)
  })
  it('Buổi chữa của chiến dịch: CHỈ câu khối 11', async () => {
    const { d, id } = await lopSaiNhieu()
    const r = await gvChienDich(d.env, { action: 'buoi-chua', id }, T0) as Record<string, any>
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    khongKhacKhoi11(((r.cau ?? []) as { qid: string; qidCung?: string[] }[]).flatMap((x) => [x.qid, ...(x.qidCung ?? [])]), 'Buổi chữa')
  })
})

describe('LUẬT A — Game Thần thú đường không Hoá 2.0 (Đảo, gợi ý, Đoàn kho lớp, câu chung trùm Đoàn)', () => {
  async function dungGame() {
    const d = await dungKho()
    hoSoGame(d, 'S1')
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong',?,'x')").run(JSON.stringify({ toanBo: true }))
    daHocDang(d, 'S1', DANG) // bằng chứng dạng chung (câu ĐẦU theo qid = tờ khối 10 — đúng cảnh bằng chứng cũ khác khối)
    return d
  }
  it('Đảo: 6 câu của lượt CHỈ khối 11 (kể cả khi bằng chứng của em nằm ở tờ khối 10)', async () => {
    const d = await dungGame()
    const r = await goiGame(d, 'start', { mode: 'adventure' })
    chiKhoi11(((r.questions ?? []) as { qid: string }[]).map((x) => x.qid), 'Đảo')
  })
  it('gợi ý `recommendations`: nguồn (mã tờ) CHỈ tờ khối 11', async () => {
    const d = await dungGame()
    const r = await goiGame(d, 'recommendations', {})
    const nguon = ((r.suggestions ?? []) as { source: string }[]).map((x) => `${x.source}-I-1`)
    chiKhoi11(nguon, 'gợi ý')
  })
  it('Đoàn kho lớp: câu cá nhân của em CHỈ khối 11; câu chung (trùm) của đội cùng khối 11 CHỈ khối 11', async () => {
    const d = await dungGame()
    const mo = await goiGame(d, 'doan-mo')
    expect(mo.ok, JSON.stringify(mo).slice(0, 300)).toBe(true)
    const chang = JSON.parse((d.sql.prepare('SELECT json FROM doan_chang WHERE ma = ?').get(mo.doan.ma) as { json: string }).json)
    const cua = (chang.nguoi as { sbd: string; cau: { qid: string }[] }[]).find((x) => x.sbd === 'S1')!
    chiKhoi11(cua.cau.map((c) => c.qid), 'Đoàn — câu cá nhân')
    const trum = Object.values((chang.trum ?? {}) as Record<string, { qid: string } | null>).filter(Boolean).map((x) => x!.qid)
    expect(trum.filter((q) => !laCauDung11(q)), 'Đoàn — câu trùm').toEqual([])
  })
})

describe('LUẬT A — Tu luyện 4 chế độ', () => {
  async function dungTuLuyen() {
    const d = await dungKho()
    await ghiSai(d, 'S1', [...mauMoiTo(4), ...mauMoiToPhan('III', 2)], T0 - 4 * MOT_NGAY, { nguon: ['thi', 'game', 'luyen'] })
    // "Dạng bài" (chế độ 3): mỗi khối một tờ dạng bài CÙNG tên dạng.
    for (const k of [10, 11, 12] as const) {
      const ma = `DB-${k}-B1-D1`
      d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,?,3,?,0,'v1')").run(ma, `Dạng bài · ${k} · Bài 1. Chung · Dạng A`, String(k), `kho/${ma}.json`)
      d.objects.set(`kho/${ma}.json`, { ma_de: ma, cau: [1, 2, 3].map((so) => ({ phan: 'I', so, de: `Dạng bài ${k} câu ${so}.`, pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'A', dang: { ma: DANG, ten: 'Dạng A' }, chuyen_de: 'CD1', muc_do: 'biet', loi_giai: { chot: 'x', trang_thai: 'khop' } })) })
    }
    return d
  }
  for (const [cheDo, b] of [[1, { soCau: 30 }], [2, { soCau: 50 }], [4, { mucDo: ['ngau_nhien'], soCau: 30 }]] as const) {
    it(`chế độ ${cheDo}: câu rút CHỈ khối 11`, async () => {
      const { tuLuyenRut } = await import('../server/src/tu-luyen')
      const d = await dungTuLuyen()
      const r = await tuLuyenRut(d.env, 'S1', { cheDo, ...b }) as Record<string, any>
      expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
      chiKhoi11(((r.cau ?? []) as { qid: string }[]).map((c) => c.qid), `Tu luyện chế độ ${cheDo}`)
    })
  }
  it('chế độ 3 (Dạng bài): em lớp 11 chọn dạng của tờ khối 10, 11, 12 ⇒ chỉ tờ khối 11 được rút', async () => {
    const { tuLuyenRut } = await import('../server/src/tu-luyen')
    const d = await dungTuLuyen()
    const r = await tuLuyenRut(d.env, 'S1', { cheDo: 3, dsDang: ['DB-10-B1-D1', 'DB-11-B1-D1', 'DB-12-B1-D1'], soCau: 20 }) as Record<string, any>
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    const qids = ((r.cau ?? []) as { qid: string }[]).map((c) => c.qid)
    expect(qids.length).toBeGreaterThan(0)
    expect(qids.filter((q) => !q.startsWith('DB-11-')), 'Tu luyện chế độ 3').toEqual([])
  })
})

describe('LUẬT A — phụ huynh (bài hằng ngày, giao thêm), kế hoạch ngày cũ + `/hs/cau-theo-qid`, khắc phục, luyện đề', () => {
  it('bài hằng ngày của phụ huynh: CHỈ câu khối 11', async () => {
    const { chonCauBaiHangNgay } = await import('../server/src/parent-news-nguon-cau')
    const d = await dungKho()
    await ghiSai(d, 'S1', mauMoiTo(6), T0 - 5 * MOT_NGAY)
    const kq = await chonCauBaiHangNgay(d.env, 'S1', 9, T0)
    chiKhoi11((kq.cau as { id?: string; qid?: string }[]).map((c) => String(c.qid ?? c.id)), 'bài hằng ngày phụ huynh')
  })
  it('phụ huynh giao thêm: gói câu CHỈ khối 11', async () => {
    const { phGiaoThem } = await import('../server/src/ph-giao-them')
    const { parentPass } = await import('../server/src/game-v2-auth')
    const { lapVaLuuKeHoach } = await import('../server/src/ke-hoach-ngay-d1')
    const d = await dungKho()
    await ghiSai(d, 'S1', mauMoiTo(8), T0 - 5 * MOT_NGAY)
    await lapVaLuuKeHoach(d.env, ['S1'], T0 - 3 * 3_600_000)
    const r = await phGiaoThem(d.env, { pass: await parentPass(d.env, 'S1') }, T0) as Record<string, any>
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    const qids = (d.sql.prepare("SELECT qid_json FROM ph_giao_them WHERE sbd = 'S1'").all() as { qid_json: string }[]).flatMap((h) => JSON.parse(h.qid_json) as string[])
    chiKhoi11(qids, 'phụ huynh giao thêm')
  })
  it('kế hoạch ngày cũ (hàng ôn lại) + `/hs/cau-theo-qid` (đề câu ôn ra máy em): CHỈ câu khối 11', async () => {
    const { lapVaLuuKeHoach } = await import('../server/src/ke-hoach-ngay-d1')
    const { hsCauTheoQid } = await import('../server/src/cau-theo-qid')
    const d = await dungKho()
    await ghiSai(d, 'S1', mauMoiTo(6), T0 - 5 * MOT_NGAY)
    const kh = (await lapVaLuuKeHoach(d.env, ['S1'], T0, { luu: false })).get('S1')!
    const onLai = kh.viec.filter((v) => v.loai === 'on_lai').flatMap((v) => (v.chiTiet.qid ?? []) as string[])
    chiKhoi11(onLai, 'kế hoạch ngày cũ — ôn lại')
    const r = await hsCauTheoQid(d.env, { sbd: 'S1', qid: mauMoiTo(3) }) as Record<string, any>
    expect(r.ok).toBe(true)
    chiKhoi11(((r.cau ?? []) as { qid: string }[]).map((c) => c.qid), '/hs/cau-theo-qid')
  })
  it('khắc phục (`cauKhacPhucGoi`, chuyên đề CD1 trùng tên ở mọi khối): CHỈ câu khối 11; máy em không gửi SBD ⇒ không rõ khối ⇒ không câu nào', async () => {
    const { cauKhacPhucGoi } = await import('../server/src/goi-cu')
    const d = await dungKho()
    const r = await cauKhacPhucGoi(d.env, { sbd: 'S1', chuyenDe: ['CD1'], soCau: 40 }) as Record<string, any>
    chiKhoi11((r.thuTu ?? []) as string[], 'khắc phục')
    const k = await cauKhacPhucGoi(d.env, { chuyenDe: ['CD1'], soCau: 40 }) as Record<string, any>
    expect((k.thuTu ?? []) as string[]).toEqual([])
  })
  it('luyện đề cấu trúc (Bộ đề khối 12): em lớp 11 và em CHƯA RÕ khối đều bị chặn', async () => {
    const { luyenDe } = await import('../server/src/luyen-de')
    const d = await dungKho()
    await expect(luyenDe(d.env, 'start', { token: await gameToken(d.env, 'S1'), daHocXong: true })).rejects.toThrow(/khối 12/)
    await expect(luyenDe(d.env, 'start', { token: await gameToken(d.env, 'SX'), daHocXong: true })).rejects.toThrow(/khối 12/)
    expect(await luyenDe(d.env, 'dieu-kien', { token: await gameToken(d.env, 'SX') })).toMatchObject({ trangThai: 'khoa' })
  })
})

describe('LUẬT A cho từng em do MÁY gợi ý ở lớp — Kiểm tra đầu giờ, hồ sơ ôn cho đề riêng', () => {
  it('Kiểm tra đầu giờ: ứng viên của mỗi em lớp 11 CHỈ câu khối 11 (câu khác khối em từng làm đúng không được gọi)', async () => {
    const { gvDauGio } = await import('../server/src/dau-gio')
    const { ghiSuKien } = await import('../server/src/su-kien-hoc')
    const d = await dungKho()
    for (const s of ['S1', 'S2']) {
      const r = await ghiSuKien(d.env, mauMoiTo(4).map((qid, i) => ({ nguon: 'game' as const, maNguon: `p-${s}-${i}`, sbd: s, qid, lan: 1, ketQua: 1 as const, luc: new Date(T0 - 2 * MOT_NGAY + i * 1000).toISOString() })))
      expect(r.ok).toBe(true)
    }
    d.sql.exec("CREATE TABLE IF NOT EXISTS buoi_hoc (id TEXT PRIMARY KEY, ten TEXT NOT NULL, lop TEXT NOT NULL DEFAULT '', bi_mat TEXT NOT NULL, mo_luc TEXT NOT NULL, het_han TEXT NOT NULL, dong_luc TEXT, cap_nhat_luc TEXT NOT NULL)")
    d.sql.exec("CREATE TABLE IF NOT EXISTS buoi_hoc_diem_danh (buoi_id TEXT NOT NULL, sbd TEXT NOT NULL, luc TEXT NOT NULL, cach TEXT NOT NULL, trang_thai TEXT NOT NULL DEFAULT 'co_mat', cap_nhat_luc TEXT NOT NULL, PRIMARY KEY (buoi_id, sbd))")
    d.sql.prepare("INSERT INTO buoi_hoc VALUES('B1','Buổi 1','11','123456',?,?,NULL,'x')").run(new Date(T0 - 600_000).toISOString(), new Date(T0 + 3_600_000).toISOString())
    for (const s of ['S1', 'S2']) d.sql.prepare("INSERT INTO buoi_hoc_diem_danh VALUES('B1',?,?,'ma','co_mat','x')").run(s, new Date(T0 - 300_000).toISOString())
    const r = await gvDauGio(d.env, { action: 'ung-vien', buoiId: 'B1' }, T0) as Record<string, any>
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    for (const e of r.em as { sbd: string; cau: { qid: string }[] }[]) chiKhoi11(e.cau.map((c) => c.qid), `đầu giờ ${e.sbd}`)
  })
  it('hồ sơ ôn ca (`hoSoOnCa`, máy thầy rút đề riêng hỏi lại câu sai ca trước): CHỈ câu khối 11', async () => {
    const { hoSoOnCa } = await import('../server/src/ho-so-on-ca')
    const d = await dungKho()
    await ghiSai(d, 'S1', mauMoiTo(3), T0 - 4 * MOT_NGAY, { nguon: ['thi'] })
    d.sql.prepare("INSERT OR IGNORE INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,lop,cap_nhat_luc) VALUES('CA-TRUOC','Ca trước','dong',?,?,45,'thi','ngay','','11','x')").run(new Date(T0 - 4 * MOT_NGAY).toISOString(), new Date(T0 - 4 * MOT_NGAY).toISOString())
    mauMoiTo(3).forEach((qid, i) => {
      d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,dung_sai,cap_nhat_luc) VALUES(?,'CA-TRUOC','S1',1,'I',?,?,0,'x')").run(`CA-TRUOC|S1|1|I|${i}`, i + 1, qid)
      d.sql.prepare("INSERT INTO ban_do_sai(khoa,ma_ca,sbd,qid,cap_nhat_luc) VALUES(?,'CA-TRUOC','S1',?,'x')").run(`CA-TRUOC|S1|${qid}`, qid)
    })
    const r = await hoSoOnCa(d.env, { dsSbd: ['S1'], maCa: 'CA-MOI', ngayCa: NGAY }, T0) as Record<string, any>
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    chiKhoi11((r.em.S1.sai as { qid: string }[]).map((x) => x.qid), 'hồ sơ ôn ca')
  })
})

describe('LUẬT B — "Buổi chữa tối nay" (`/gv/buoi-chua-de-xuat`, lớp 11)', () => {
  it('câu nhiều em sai của lớp 11: KHÔNG câu khác khối / mâu thuẫn', async () => {
    const { gvBuoiChuaDeXuat } = await import('../server/src/gv-buoi-chua-de-xuat')
    const d = await dungKho()
    for (const s of ['S1', 'S2', 'S4']) await ghiSai(d, s, mauMoiTo(3), T0 - 1 * MOT_NGAY, { nguon: ['game'] })
    const r = await gvBuoiChuaDeXuat(d.env, { ngay: NGAY, lop: '11' }) as Record<string, any>
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    khongKhacKhoi11(((r.cauSaiNhieu ?? []) as { qid: string }[]).map((x) => x.qid), 'Buổi chữa tối nay')
  })
})

describe('Em CHƯA RÕ khối (chưa xếp lớp): kênh tự động không đưa câu nào ngoài nội dung thầy giao trực tiếp', () => {
  it('Đảo không Hoá 2.0, Tu luyện chế độ 4: không câu nào', async () => {
    const d = await dungKho()
    hoSoGame(d, 'SX')
    daHocDang(d, 'SX', DANG)
    const r = await goiGame(d, 'start', { mode: 'adventure' }, 'SX')
    expect(((r.questions ?? []) as unknown[]).length).toBe(0)
    const { tuLuyenRut } = await import('../server/src/tu-luyen')
    const t = await tuLuyenRut(d.env, 'SX', { cheDo: 4, mucDo: ['ngau_nhien'], soCau: 10 }) as Record<string, any>
    expect(((t.cau ?? []) as unknown[]).length).toBe(0)
  })
  it('Hoá 2.0: chiến dịch thầy giao trực tiếp cho em VẪN vào kế hoạch (tờ thầy chọn); nợ từ nguồn khác (Lên bảng, game…) KHÔNG vào', async () => {
    const d = await dungKho()
    batHoa2(d)
    const r = await gvChienDich(d.env, { action: 'tao', ten: 'Riêng em SX', maDe: [TO_LA], sbd: ['SX'], hanNop: '2026-10-20', theLucNgay: 60, raiDeu: false }, T0 - 2 * MOT_NGAY)
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    await ghiSai(d, 'SX', mauMoiTo(2).filter((q) => !q.startsWith(TO_LA)), T0 - 3 * MOT_NGAY, { nguon: ['len_bang', 'game'] })
    const { kh } = await layKeHoachHomNay(d.env, 'SX', T0)
    const tatCa = [...kh.dao, ...kh.doan]
    expect(tatCa.length).toBeGreaterThan(0)
    expect(tatCa.filter((q) => !q.startsWith(`${TO_LA}-`))).toEqual([])
  })
})
