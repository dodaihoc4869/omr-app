// @vitest-environment node
// LUẬT THẦY 05/10 ("chặn chuẩn 100% không được rút nhầm kho khác khối"): kênh tự động chặn câu KHÔNG RÕ khối ⇒ câu trong kho giả ghi khối `lop` (đúng khối em).
// GAME HÓA 2.0 · ĐOÀN HỘ TỐNG — thầy 28/09 "làm được 1 câu rồi máy tự đánh", "thời gian xem đáp án quá ngắn":
// phòng CHỈ MỘT người thật ⇒ hiệp kế CHỜ em bấm "ĐÁNH TIẾP" (lệnh `doan-tiep`), có hạn chờ an toàn; phòng ≥ 2 người thật giữ nhịp cũ.
// Chạy trên SQLITE THẬT (tests/_d1-that.ts). Cờ phòng `choEmBamTiep` do `doan-mo` đặt khi em ở chế độ Hóa 2.0 — ở đây bật thẳng trong JSON phòng.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { DEM_NGUOC_MS, NGHI_GIUA_HIEP_MS, HAN_CHO_TIEP_MS } from '../server/src/game-v2-doan'
import { taoD1That, type D1That } from './_d1-that'

const T0 = Date.parse('2026-09-28T12:00:00+07:00')
let bayGio = T0
const troi = (ms: number) => { bayGio += ms; vi.setSystemTime(bayGio) }
beforeEach(() => { bayGio = T0; vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())

const KHO = [
  ...Array.from({ length: 9 }, (_, i) => ({ qid: `X${i + 1}`, phan: 'I', dang: 'ES.A.X', correct: 'ABCD'[i % 4]! })),
  ...Array.from({ length: 9 }, (_, i) => ({ qid: `Y${i + 1}`, phan: 'I', dang: 'AN.B.Y', correct: 'DCBA'[i % 4]! })),
  { qid: 'TX1', phan: 'II', dang: 'ES.A.X', correct: 'DSDS' }, { qid: 'TY1', phan: 'II', dang: 'AN.B.Y', correct: 'DDSS' },
]
const dapAn = new Map(KHO.map(c => [c.qid, c.correct]))

function dungTruong(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong',?,'x')").run(JSON.stringify({ toanBo: true }))
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',?,?,0,'v1')").run(KHO.length, 'kho/DE1.json')
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  for (const c of KHO) {
    const q = { qid: c.qid, maDe: 'DE1', lop: '12', version: 'v1', group: `g-${c.qid}`, phan: c.phan, text: `Đề ${c.qid}`, choices: c.phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: c.phan === 'II' ? ['ý a', 'ý b', 'ý c', 'ý d'] : [],
      hinhAnh: [], dang: c.dang, tenDang: 'Dạng', mucDo: 'biet', sao: 1, kienThuc: ['K1'], correct: c.correct, solution: `LG-${c.qid}`, reviewed: true }
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', q.qid, 'v1', q.group, q.dang, JSON.stringify(q))
  }
  for (const [sbd, ten] of [['S1', 'Nguyễn Thu Hà'], ['S2', 'Trần Văn Nam']] as const) {
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12A','mk','x')").run(sbd, ten)
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run(sbd, JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  }
  return d
}
async function bangChung(d: D1That, sbd: string, qid: string) {
  const dang = KHO.find(c => c.qid === qid)!.dang
  await ghiSuKien(d.env, [{ nguon: 'btvn', maNguon: `BT-${sbd}`, sbd, qid, lan: 1, ketQua: 0, luc: new Date(T0 - 72 * 3_600_000).toISOString(), maDang: dang }])
  await dungLaiHoSo(d.env, [sbd], new Date(T0).toISOString())
}
type KN = { ok: boolean; doan: any; ketQuaCau?: any }
const goi = async (d: D1That, sbd: string, lenh: string, b: Record<string, unknown> = {}) => gameV2(d.env, `doan-${lenh}`, { token: await gameToken(d.env, sbd), ...b }) as Promise<KN>
/** Bật chế độ Hóa 2.0 cho phòng (đúng như `doan-mo` đặt khi `cheDo2` của em là true). */
const batHoa2 = (d: D1That, ma: string) => d.sql.prepare("UPDATE doan_chang SET json=json_set(json,'$.choEmBamTiep',json('true')) WHERE ma=?").run(ma)
async function lamHiep(d: D1That, sbd: string, ma: string) {
  const xem = await goi(d, sbd, 'xem', { ma }), qid = xem.doan.cau.qid as string
  return goi(d, sbd, 'nop', { ma, hiep: xem.doan.tran.hiep, answer: dapAn.get(qid), hanhDong: 'danh' })
}

describe('Hóa 2.0 · phòng MỘT người thật: hiệp kế chờ em bấm ĐÁNH TIẾP', () => {
  it('chốt xong: hiệp đã giải nhưng hiệp kế KHÔNG mở theo giờ nghỉ cũ; `doan-tiep` mới mở, đồng hồ tính từ lúc bấm', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1')
    const ma = (await goi(d, 'S1', 'mo')).doan.ma as string
    batHoa2(d, ma); troi(DEM_NGUOC_MS)
    const nop = await lamHiep(d, 'S1', ma)
    expect(nop.ketQuaCau).toMatchObject({ correct: true }) // luật chấm không đổi
    expect(nop.doan.hiepVuaXong.hiep).toBe(1)
    expect(nop.doan.tran).toMatchObject({ hiep: 2, choTiep: true, moSauMs: HAN_CHO_TIEP_MS })
    // Qua nhịp nghỉ cũ (6 s) và thêm 5 phút: hiệp 2 VẪN chưa mở, chưa có câu, chưa tính giờ.
    troi(NGHI_GIUA_HIEP_MS + 5 * 60_000)
    const cho = await goi(d, 'S1', 'xem', { ma })
    expect(cho.doan.tran).toMatchObject({ hiep: 2, choTiep: true }); expect(cho.doan.tran.moSauMs).toBeGreaterThan(0); expect(cho.doan.cau).toBeUndefined()
    const tiep = await goi(d, 'S1', 'tiep', { ma })
    expect(tiep.doan.tran.choTiep).toBeUndefined(); expect(tiep.doan.tran.moSauMs).toBe(0)
    expect(tiep.doan.tran.conMs).toBe(tiep.doan.tran.giay * 1000) // đồng hồ đầy: bắt đầu từ lúc em bấm
    expect(tiep.doan.cau.qid).toBeTruthy()
    // bấm lại / tới trễ: không lỗi, không đổi gì
    troi(10_000)
    const lai = await goi(d, 'S1', 'tiep', { ma })
    expect(lai.doan.tran.hiep).toBe(2); expect(lai.doan.tran.conMs).toBe(tiep.doan.tran.giay * 1000 - 10_000)
  })

  it('bỏ dở: quá hạn chờ an toàn thì hiệp tự mở như cũ (phòng không treo mãi)', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1')
    const ma = (await goi(d, 'S1', 'mo')).doan.ma as string
    batHoa2(d, ma); troi(DEM_NGUOC_MS)
    await lamHiep(d, 'S1', ma)
    troi(HAN_CHO_TIEP_MS)
    const xem = await goi(d, 'S1', 'xem', { ma })
    expect(xem.doan.tran).toMatchObject({ hiep: 2, moSauMs: 0 }); expect(xem.doan.tran.choTiep).toBeUndefined(); expect(xem.doan.cau.qid).toBeTruthy()
  })

  it('cờ tắt (phòng cũ): nhịp nghỉ cũ 6 s, không có `choTiep`; `doan-tiep` không làm gì', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1')
    const ma = (await goi(d, 'S1', 'mo')).doan.ma as string
    troi(DEM_NGUOC_MS)
    const nop = await lamHiep(d, 'S1', ma)
    expect(nop.doan.tran).toMatchObject({ hiep: 2, moSauMs: NGHI_GIUA_HIEP_MS }); expect(nop.doan.tran.choTiep).toBeUndefined()
    const tiep = await goi(d, 'S1', 'tiep', { ma })
    expect(tiep.doan.tran.moSauMs).toBe(NGHI_GIUA_HIEP_MS)
  })
})

describe('Hóa 2.0 · phòng HAI người thật: giữ nhịp cũ, không bắt bạn chờ', () => {
  it('cả hai chốt ⇒ hiệp kế mở sau 6 s như cũ; một bạn bấm `doan-tiep` cũng không đổi nhịp', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1'); await bangChung(d, 'S2', 'Y1')
    const ma = (await goi(d, 'S1', 'mo', { cheDo: 'phong' })).doan.ma as string
    await goi(d, 'S2', 'vao', { ma }); await goi(d, 'S1', 'bat-dau', { ma })
    batHoa2(d, ma); troi(DEM_NGUOC_MS)
    await lamHiep(d, 'S1', ma)
    const nop = await lamHiep(d, 'S2', ma)
    expect(nop.doan.tran).toMatchObject({ hiep: 2, moSauMs: NGHI_GIUA_HIEP_MS }); expect(nop.doan.tran.choTiep).toBeUndefined()
    expect((await goi(d, 'S1', 'tiep', { ma })).doan.tran.moSauMs).toBe(NGHI_GIUA_HIEP_MS)
    troi(NGHI_GIUA_HIEP_MS)
    expect((await goi(d, 'S2', 'xem', { ma })).doan.cau.qid).toBeTruthy()
  })
})
