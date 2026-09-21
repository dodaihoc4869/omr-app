// @vitest-environment node
// LÕI ĐÚNG BẬC · MÁY CHỦ (thầy chốt 11:31; Code 1: docs/loi-dung-bac-cac-lan-2109.md). `BoCuaEm.loi` nay là lõi CỦA EM; khi khác lõi của bài, `tomTat.loiCuaEm` nằm sẵn
// trong `btvn_em.tom_tat_json` (KHÔNG đổi lược đồ). Hai chỗ máy chủ phải đọc lõi CỦA EM: `thichNghiSauChang` (không để câu lõi đã thay bị coi là câu riêng rồi đổi mất) và
// `thongKeTheoDoiCaNhan` (điểm lõi ở /btvn/theo-doi). Em không có trường ⇒ Y HỆT cũ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loiCuaEm, thichNghiSauChang, thongKeTheoDoiCaNhan } from '../server/src/btvn-nang-do-d1'
import { BAY_GIO, DAP_AN_DUNG, boCuaEm, dung, giao, gio, mo } from './_btvn-nang-do-mau'
import type { D1That } from './_d1-that'

// Bắt ĐẦU VÀO của lõi thích nghi (bộ mà máy chủ dựng lại) — hàm thật vẫn chạy.
const bat = { vao: [] as { loi: string[]; rieng: string[]; thuThach: string[] }[] }
vi.mock('../src/lib/btvn-nang-do', async (goc) => {
  const m = await goc<typeof import('../src/lib/btvn-nang-do')>()
  return {
    ...m,
    thichNghiChangSau: (...a: Parameters<typeof m.thichNghiChangSau>) => {
      bat.vao.push({ loi: [...a[0].loi], rieng: [...a[0].rieng], thuThach: [...a[0].thuThach] })
      return m.thichNghiChangSau(...a)
    },
  }
})
afterEach(() => { vi.useRealTimers(); bat.vao = [] })

const HOSO_MANH = (d: D1That, sbd = 'S1') => {
  for (const ma of ['DA-1', 'DA-2', 'DA-3', 'DA-4']) d.sql.prepare('INSERT OR REPLACE INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?)').run(`${sbd}|${ma}`, sbd, ma, 10, 1, 1, 0, 9, 2, 'x')
}
const DC = { ngay: '2026-09-21', hetHan: '2026-09-24', doTin: 0.9, dieuChinh: {}, onSom: [], nhip: 0 }
const loiBai = (d: D1That) => (d.sql.prepare('SELECT qid FROM btvn_cau WHERE loi = 1').all() as { qid: string }[]).map((x) => x.qid)
const tomTat = (d: D1That, sbd = 'S1') => JSON.parse((d.sql.prepare('SELECT tom_tat_json FROM btvn_em WHERE sbd = ?').get(sbd) as { tom_tat_json: string }).tom_tat_json) as { loiCuaEm?: string[]; tong: number }
const emVaBai = (d: D1That, sbd = 'S1') => ({
  bt: d.sql.prepare('SELECT * FROM btvn').get() as Record<string, unknown>,
  em: d.sql.prepare('SELECT * FROM btvn_em WHERE sbd = ?').get(sbd) as Record<string, unknown>,
})
const tapHop = (a: string[]) => [...a].sort()

/** Bài có em S1 MẠNH (mọi dạng ổn định ⇒ máy chủ chốt lõi đúng bậc: `loiCuaEm` KHÁC lõi của bài) và em S2 KHÔNG có hồ sơ (lõi của em = lõi của bài). */
async function baiHaiEm() {
  gio(BAY_GIO)
  const d = dung(2)
  HOSO_MANH(d, 'S1')
  await giao(d)
  await mo(d, 'S1')
  await mo(d, 'S2')
  return d
}

describe('loiCuaEm(): đọc lõi CỦA EM từ tóm tắt bộ', () => {
  const BAI = ['A', 'B', 'C']
  it('có `loiCuaEm` hợp lệ ⇒ dùng nó (bản sao, không đổi mảng gốc)', () => {
    const goc = ['X', 'Y', 'Z']
    const r = loiCuaEm({ loiCuaEm: goc } as never, BAI)
    expect(r).toEqual(['X', 'Y', 'Z'])
    r.push('W')
    expect(goc).toEqual(['X', 'Y', 'Z'])
  })
  it('vắng / null / rỗng / sai kiểu ⇒ lõi của bài (Y HỆT bộ đã chốt trước bản này), trả bản sao', () => {
    for (const t of [null, undefined, {}, { loiCuaEm: [] }, { loiCuaEm: 'X' }, { loiCuaEm: [1, 2] }, { loiCuaEm: ['X', 2] }, { loiCuaEm: { 0: 'X' } }]) {
      const bai = [...BAI]
      const r = loiCuaEm(t as never, bai)
      expect(r, JSON.stringify(t)).toEqual(['A', 'B', 'C'])
      r.push('W')
      expect(bai).toEqual(['A', 'B', 'C'])
    }
  })
})

describe('THẬT: thích nghi sau chặng đọc lõi CỦA EM', () => {
  it('em có `loiCuaEm`: bộ dựng lại cho lõi thích nghi có lõi = lõi của em (câu đã thay KHÔNG nằm trong câu riêng), lõi của em còn nguyên sau khi thích nghi', async () => {
    const d = await baiHaiEm()
    const cuaEm = tomTat(d).loiCuaEm!
    const cuaBai = loiBai(d)
    const thay = cuaEm.filter((q) => !cuaBai.includes(q))
    expect(thay.length).toBeGreaterThan(0) // phép thử có nghĩa: có câu lõi ĐÃ THAY (không thuộc lõi của bài)
    const truoc = boCuaEm(d)
    const c0 = truoc.filter((x) => x.chang === 0).map((x) => x.qid)
    const { bt, em } = emVaBai(d)
    await thichNghiSauChang(d.env, bt, em, 'S1', 0, 1, Object.fromEntries(c0.map((q) => [q, false])), DC, BAY_GIO.getTime())
    expect(bat.vao).toHaveLength(1)
    expect(tapHop(bat.vao[0].loi)).toEqual(tapHop(cuaEm))
    for (const q of thay) expect(bat.vao[0].rieng, q).not.toContain(q) // trước sửa: câu lõi đã thay bị xếp vào "riêng" ⇒ bị đổi mất
    const sau = boCuaEm(d).map((x) => x.qid)
    for (const q of cuaEm) expect(sau, q).toContain(q) // lõi của em còn đủ sau thích nghi
    expect(new Set(sau).size).toBe(sau.length)
    expect(tomTat(d).loiCuaEm).toEqual(cuaEm) // `loiCuaEm` đi theo em qua lần lưu tóm tắt mới
  })

  it('em KHÔNG có `loiCuaEm` (hồ sơ chưa có dạng ổn định): lõi dựng lại = lõi của bài — Y HỆT trước bản này', async () => {
    const d = await baiHaiEm()
    expect(tomTat(d, 'S2').loiCuaEm).toBeUndefined()
    const truoc = boCuaEm(d, 'S2')
    const c0 = truoc.filter((x) => x.chang === 0).map((x) => x.qid)
    const { bt, em } = emVaBai(d, 'S2')
    await thichNghiSauChang(d.env, bt, em, 'S2', 0, 1, Object.fromEntries(c0.map((q) => [q, false])), DC, BAY_GIO.getTime())
    expect(bat.vao).toHaveLength(1)
    expect(tapHop(bat.vao[0].loi)).toEqual(tapHop(loiBai(d)))
    const sau = boCuaEm(d, 'S2').map((x) => x.qid)
    for (const q of loiBai(d)) expect(sau, q).toContain(q)
  })

  it('`loiCuaEm` hỏng (rỗng / sai kiểu) trong tom_tat_json ⇒ rơi về lõi của bài, không văng lỗi', async () => {
    const d = await baiHaiEm()
    const goc = tomTat(d)
    d.sql.prepare("UPDATE btvn_em SET tom_tat_json = ? WHERE sbd = 'S1'").run(JSON.stringify({ ...goc, loiCuaEm: 'hỏng' }))
    const { bt, em } = emVaBai(d)
    const c0 = boCuaEm(d).filter((x) => x.chang === 0).map((x) => x.qid)
    await expect(thichNghiSauChang(d.env, bt, em, 'S1', 0, 1, Object.fromEntries(c0.map((q) => [q, false])), DC, BAY_GIO.getTime())).resolves.toBeTypeOf('number')
    expect(tapHop(bat.vao[0].loi)).toEqual(tapHop(loiBai(d).filter((q) => boCuaEm(d).some((x) => x.qid === q))))
  })
})

describe('THẬT: điểm lõi ở /btvn/theo-doi (thongKeTheoDoiCaNhan) tính trên lõi CỦA EM', () => {
  const dapAnDay = (sai: string[]) => JSON.stringify(Object.fromEntries(boQid.map((q) => [q, sai.includes(q) ? (/-II-/.test(q) ? 'SSSS' : /-III-/.test(q) ? '9.99' : 'B') : DAP_AN_DUNG(q)])))
  const boQid: string[] = []

  it('em có `loiCuaEm`: số câu lõi = số câu lõi của em; sai MỘT câu lõi đã thay ⇒ đúng-lõi bớt 1 (không bị bỏ sót); em không có trường vẫn tính như cũ', async () => {
    const d = await baiHaiEm()
    const cuaEm = tomTat(d).loiCuaEm!
    const cuaBai = loiBai(d)
    const thay = cuaEm.filter((q) => !cuaBai.includes(q))
    boQid.length = 0
    boQid.push(...TAT_CA)
    const { bt } = emVaBai(d)
    const dsEm = [
      { sbd: 'S1', dap_an_json: dapAnDay([thay[0]]), nop_luc: '2026-09-22T05:00:00.000Z' },
      { sbd: 'S2', dap_an_json: dapAnDay([]), nop_luc: '2026-09-22T05:00:00.000Z' },
    ]
    const r = await thongKeTheoDoiCaNhan(d.env, bt, dsEm)
    const s1 = r.theoEm.get('S1')!
    const nhanS1 = new Set(boCuaEm(d, 'S1').filter((x) => x.chang >= 0).map((x) => x.qid))
    const soLoiS1 = cuaEm.filter((q) => nhanS1.has(q)).length
    expect(soLoiS1).toBe(7) // 7 câu lõi của em, đều là câu bắt buộc
    expect(s1.soCauLoi).toBe(7)
    expect(s1.soDungLoi).toBe(6)
    expect(s1.diemLoi).toBe(Math.round((6 / 7) * 1000) / 100)
    // em không có `loiCuaEm`: lõi = lõi của bài ∩ bộ của em, đúng hết
    const s2 = r.theoEm.get('S2')!
    const nhanS2 = new Set(boCuaEm(d, 'S2').filter((x) => x.chang >= 0).map((x) => x.qid))
    expect(s2.soCauLoi).toBe(cuaBai.filter((q) => nhanS2.has(q)).length)
    expect(s2.soDungLoi).toBe(s2.soCauLoi)
    expect(s2.diemLoi).toBe(10)
    expect(r.soLoi).toBe(cuaBai.length) // số câu lõi của bài giữ nguyên (thay 1–1)
    expect(tapHop([...r.loi])).toEqual(tapHop(cuaBai)) // tập lõi chống chép bài vẫn là lõi của bài
  })

  it('câu lõi của em nằm ở nhóm "thử sức thêm" (chang = -1, không bắt buộc) KHÔNG tính vào điểm lõi', async () => {
    const d = await baiHaiEm()
    const cuaEm = tomTat(d).loiCuaEm!
    const ma = (d.sql.prepare('SELECT ma_btvn FROM btvn').get() as { ma_btvn: string }).ma_btvn
    const thuSuc = 'DE1-I-1' // lõi của bài, KHÔNG có trong bộ bắt buộc của S1
    expect(boCuaEm(d).some((x) => x.qid === thuSuc)).toBe(false)
    d.sql.prepare("INSERT INTO btvn_em_cau (khoa, ma_btvn, sbd, qid, chang, nhan, thu_tu) VALUES (?, ?, 'S1', ?, -1, 'thu_suc_them', 99)").run(`${ma}|S1|${thuSuc}`, ma, thuSuc)
    d.sql.prepare("UPDATE btvn_em SET tom_tat_json = ? WHERE sbd = 'S1'").run(JSON.stringify({ ...tomTat(d), loiCuaEm: [...cuaEm, thuSuc] }))
    boQid.length = 0
    boQid.push(...TAT_CA)
    const { bt } = emVaBai(d)
    const r = await thongKeTheoDoiCaNhan(d.env, bt, [{ sbd: 'S1', dap_an_json: dapAnDay([thuSuc]), nop_luc: '2026-09-22T05:00:00.000Z' }])
    expect(r.theoEm.get('S1')!.soCauLoi).toBe(7) // không thành 8
    expect(r.theoEm.get('S1')!.soDungLoi).toBe(7) // sai câu thử sức thêm không làm hụt điểm lõi
    expect(r.theoEm.get('S1')!.diemLoi).toBe(10)
  })

  it('chưa nộp / chưa chốt: vẫn không có điểm lõi (null / 0) dù có loiCuaEm', async () => {
    const d = await baiHaiEm()
    const { bt } = emVaBai(d)
    const r = await thongKeTheoDoiCaNhan(d.env, bt, [{ sbd: 'S1', dap_an_json: null, nop_luc: null }])
    expect(r.theoEm.get('S1')!.diemLoi).toBeNull()
    expect(r.theoEm.get('S1')!.soDungLoi).toBe(0)
    expect(r.theoEm.get('S1')!.soCauLoi).toBe(7)
  })
})

const TAT_CA = ['DE1-I-1', 'DE1-I-2', 'DE1-I-3', 'DE1-I-4', 'DE1-I-5', 'DE1-I-6', 'DE1-I-7', 'DE1-I-8', 'DE1-I-9', 'DE1-I-10', 'DE1-I-11', 'DE1-I-12', 'DE1-I-13', 'DE1-I-14', 'DE1-I-15', 'DE1-I-16', 'DE1-II-1', 'DE1-II-2', 'DE1-II-3', 'DE1-II-4', 'DE1-III-1', 'DE1-III-2', 'DE1-III-3', 'DE1-III-4']
