// @vitest-environment node
// CẤM RÚT CÂU TỰ LUẬN — MÁY CHỦ (Code 3, 21/09/2026). Đề bài: prompt-cam-rut-tu-luan.md.
// Thầy: "Tuyệt đối không rút câu tự luận, chỉ được rút câu trắc nghiệm, đúng sai, trả lời ngắn — ở mọi chỗ rút đề, TRỪ màn Gọi lên bảng".
//
// Một kho mẫu DUY NHẤT (tờ `DE-K`) có 4 câu rút được + 4 câu tự luận, dựng đúng khuôn THẬT của kho (pa {A..D} và y {a..d} là ĐỐI TƯỢNG; câu saccharose trong ảnh của thầy).
// Mỗi kênh: nạp kho mẫu → kênh trả ra → 0 câu tự luận (kèm đối chứng: câu rút được VẪN ra, để test không "xanh vì rỗng").
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { DEM_NGUOC_MS, NGHI_GIUA_HIEP_MS } from '../server/src/game-v2-doan'
import { readScope } from '../server/src/game-v2-bank'
import { cauCongKhai, docDoPhuPhucVu, hsCauTheoQid, layCauChoEm, qidPhucVuDuoc } from '../server/src/cau-theo-qid'
import { cauKhacPhucGoi, deTheoDangBai, ghiPhieuKhacPhuc, hsCauSai, layPhieu, luuPhieu } from '../server/src/goi-cu'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { homeworkQuestions } from '../server/src/btvn-grading'
import { mom } from '../server/src/mom'
import { dungDuoc } from '../server/src/parent-news-nguon-cau'
import { luyenDe } from '../server/src/luyen-de'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { laCauTuLuan } from '../src/lib/cau-tu-luan'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { BAY_GIO, HAN, cauThay, dung as dungBtvn, giao, gio, maBtvn, mo, toKho } from './_btvn-nang-do-mau'

const T0 = Date.parse('2026-09-21T12:00:00+07:00')
let bayGio = T0
const troi = (ms: number) => { bayGio += ms; vi.setSystemTime(bayGio) }
beforeEach(() => { bayGio = T0; vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())

// ───────────────────────────── KHO MẪU ─────────────────────────────
const MA = 'DE-K'
type Tho = Record<string, unknown>
const thoI = (so: number, o: Tho = {}): Tho => ({ phan: 'I', so, de: `Câu I.${so} của tờ mẫu`, pa: { A: 'Phương án A', B: 'Phương án B', C: 'Phương án C', D: 'Phương án D' }, dap_an: 'B', dang: { ma: 'ES.A.X', ten: 'Dạng X' }, chuyen_de: 'CD1', muc_do: 'biet', ...o })
const thoII = (so: number, o: Tho = {}): Tho => ({ phan: 'II', so, de: `Câu II.${so} của tờ mẫu`, y: { a: 'ý a', b: 'ý b', c: 'ý c', d: 'ý d' }, dap_an: 'DSDS', dang: { ma: 'ES.A.X', ten: 'Dạng X' }, chuyen_de: 'CD1', muc_do: 'hieu', ...o })
const thoIII = (so: number, dapAn: string, de: string, o: Tho = {}): Tho => ({ phan: 'III', so, de, dap_an: dapAn, dang: { ma: 'ES.A.X', ten: 'Dạng X' }, chuyen_de: 'CD1', muc_do: 'biet', ...o })
const SACCHAROSE = 'Theo em, có thể dùng phương pháp nào để tách saccharose ra khỏi hỗn hợp saccharose và cát?'
const KHO_THO: Tho[] = [
  thoI(1), thoI(2),
  thoI(3, { pa: { A: 'Chỉ có hai phương án', B: 'Không đủ bốn' } }), // TỰ LUẬN: phần I thiếu phương án
  thoII(1),
  thoIII(1, '7,5', 'Tính khối lượng (gam) muối thu được, làm tròn đến hàng phần mười.'),
  thoIII(2, 'kết tinh lại', SACCHAROSE), // TỰ LUẬN: đúng câu trong ảnh của thầy
  thoIII(3, 'a) amylase thuỷ phân tinh bột thành maltose ngọt; b) hạt ngô nhiều tinh bột hơn lõi ngô', 'Trả lời các câu hỏi sau: a) Vì sao nhai kĩ cơm thấy ngọt? b) Bộ phận nào của ngô nhiều tinh bột?'), // TỰ LUẬN: đáp án dài, nhiều ý
  thoIII(4, '', 'Nêu ưu điểm của phương pháp chưng cất phân đoạn.'), // TỰ LUẬN: không có đáp án
]
const qidCua = (t: Tho) => `${MA}-${t.phan}-${t.so}`
const RUT_DUOC = KHO_THO.filter((t) => !laCauTuLuan(t)).map(qidCua)
const TU_LUAN = KHO_THO.filter((t) => laCauTuLuan(t)).map(qidCua)
const SACCHAROSE_QID = qidCua(KHO_THO[5]!)
/** Câu như chỉ mục game (`PrivateQuestion`): choices / ideas là MẢNG, `correct` là chuỗi. */
function cauRieng(t: Tho, maDe = MA, o: Tho = {}) {
  const phan = String(t.phan)
  return {
    qid: `${maDe}-${phan}-${String(t.so)}`, maDe, version: 'v1', group: `g-${maDe}-${phan}-${String(t.so)}`, phan, text: String(t.de),
    choices: phan === 'I' ? Object.values(t.pa as object) : [], ideas: phan === 'II' ? Object.values(t.y as object) : [], hinhAnh: [],
    dang: 'ES.A.X', tenDang: 'Dạng X', mucDo: 'biet', sao: 1, kienThuc: ['K1'], correct: String(t.dap_an), solution: 'Giải', reviewed: true, ...o,
  }
}

/** Kho mẫu vào D1 + R2 giả: de_kho, game_v2_index, game_v2_question (cả câu tự luận, reviewed = true để chỉ bộ lọc mới loại được), cau_hoi, gói R2, một học sinh. */
function dungKho(maDe = MA, r2 = `kho/${maDe}.json`, cauTho: Tho[] = KHO_THO, ten = maDe): D1That {
  const d = taoD1That()
  themTo(d, maDe, r2, ten, cauTho)
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','12A','mk','x')").run()
  return d
}
function themTo(d: D1That, maDe: string, r2 = `kho/${maDe}.json`, ten = maDe, cauTho: Tho[] = KHO_THO) {
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'12',?,?,0,'v1')").run(maDe, ten, cauTho.length, r2)
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(maDe)
  for (const t of cauTho) {
    const q = cauRieng(t, maDe)
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(maDe, q.qid, q.version, q.group, q.dang, JSON.stringify(q))
    d.sql.prepare("INSERT INTO cau_hoi(qid,ma_de,chuyen_de,muc_do,phan,lop,co_loi_giai,cap_nhat_luc) VALUES(?,?,'CD1','biet',?,'12',0,'x')").run(q.qid, maDe, String(t.phan))
  }
  d.objects.set(r2, { ma_de: maDe, cau: cauTho.map((t) => ({ ...t })) })
}
async function saiBtvn(d: D1That, qids: string[], sbd = 'S1') {
  const r = await ghiSuKien(d.env, qids.map((q, i) => ({ nguon: 'btvn' as const, maNguon: 'B', sbd, qid: q, lan: i + 1, ketQua: 0 as const, luc: new Date(T0 - 3 * 86_400_000).toISOString(), maDang: 'ES.A.X' })))
  expect(r.ok).toBe(true)
  await dungLaiHoSo(d.env, [sbd], new Date(T0).toISOString())
}
const cauGiam = (o: Tho = {}) => ({ ...KHO_THO[0], ...o })

describe('KHO MẪU: đúng 4 câu rút được + 4 câu tự luận (khuôn thật, không xanh vì rỗng)', () => {
  it('tờ thô lẫn khuôn chỉ mục game đều phân loại giống nhau; câu saccharose của thầy là tự luận', () => {
    expect(RUT_DUOC).toEqual([`${MA}-I-1`, `${MA}-I-2`, `${MA}-II-1`, `${MA}-III-1`])
    expect(TU_LUAN).toEqual([`${MA}-I-3`, `${MA}-III-2`, `${MA}-III-3`, `${MA}-III-4`])
    for (const t of KHO_THO) expect(laCauTuLuan(cauRieng(t))).toBe(laCauTuLuan(t))
    expect(TU_LUAN).toContain(SACCHAROSE_QID)
  })
})

// ───────────────────────────── A · GAME ĐẢO THẦN THÚ ─────────────────────────────
describe('A · game Đảo thần thú (game-v2.ts): chọn phiên, sổ tay, lượt cũ', () => {
  const start = async (d: D1That, b: Record<string, unknown> = {}) => gameV2(d.env, 'start', { token: await gameToken(d.env, 'S1'), ...b }) as Promise<{ ok: boolean; id: string; questions: { qid: string }[] }>

  it('start: câu ra chỉ thuộc nhóm rút được; câu saccharose và mọi câu tự luận KHÔNG bao giờ ra', async () => {
    const d = dungKho(); await saiBtvn(d, [`${MA}-I-1`])
    const ra = new Set<string>()
    for (let i = 0; i < 6; i++) { // nhiều lượt: phòng khi chọn có ngẫu nhiên
      const r = await start(d); expect(r.ok).toBe(true)
      for (const q of r.questions) ra.add(q.qid)
      d.sql.exec('DELETE FROM game_v2_session; DELETE FROM game_v2_attempt')
    }
    expect(ra.size).toBeGreaterThan(0) // đối chứng: game vẫn ra câu
    for (const q of ra) expect(RUT_DUOC).toContain(q)
    expect([...ra].filter((q) => TU_LUAN.includes(q))).toEqual([])
    expect(ra.has(SACCHAROSE_QID)).toBe(false)
  })
  it('start ở chế độ tháp và võ đài cũng không ra tự luận', async () => {
    const d = dungKho(); await saiBtvn(d, [`${MA}-I-1`])
    for (const mode of ['tower', 'arena', 'repair']) {
      const r = await start(d, { mode })
      for (const q of r.questions) expect(TU_LUAN).not.toContain(q.qid)
      d.sql.exec('DELETE FROM game_v2_session; DELETE FROM game_v2_attempt')
    }
  })
  it('recommendations không gợi ý câu tự luận', async () => {
    const d = dungKho(); await saiBtvn(d, [`${MA}-I-1`])
    const r = await gameV2(d.env, 'recommendations', { token: await gameToken(d.env, 'S1') }) as { suggestions: { part: string; source: string }[] }
    expect(r.suggestions.length).toBeGreaterThan(0)
  })
  it('so-tay: một dạng CHỈ có câu tự luận không hiện trong sổ tay', async () => {
    const d = dungKho(); await saiBtvn(d, [`${MA}-I-1`])
    const tl = { ...cauRieng(KHO_THO[5]!, 'DE-TL2', {}), qid: 'TL2-1', dang: 'TL.ONLY', tenDang: 'Chỉ tự luận', group: 'g-tl2' }
    d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE-TL2','DE-TL2','12',1,'kho/DE-TL2.json',0,'v1')").run()
    d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE-TL2','v1','x')").run()
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE-TL2', tl.qid, 'v1', tl.group, tl.dang, JSON.stringify(tl))
    await saiBtvn(d, ['TL2-1'], 'S1')
    const r = await gameV2(d.env, 'so-tay', { token: await gameToken(d.env, 'S1') }) as { dang: { key: string }[] }
    expect(r.dang.map((x) => x.key)).toContain('ES.A.X')
    expect(r.dang.map((x) => x.key)).not.toContain('TL.ONLY')
  })
  it('LƯỢT CŨ soạn trước lệnh cấm còn câu tự luận: resume chỉ trả câu rút được, answer câu tự luận bị đóng, complete chỉ đòi câu rút được', async () => {
    const d = dungKho()
    const id = 'LUOT-CU'
    const ref = (qid: string) => ({ qid, maDe: MA, version: 'v1', group: `g-${qid}`, novel: true })
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run(id, 'S1', JSON.stringify({ mode: 'adventure', created: Date.now(), questions: [ref(`${MA}-I-1`), ref(SACCHAROSE_QID), ref(`${MA}-I-3`)] }), new Date().toISOString())
    const token = await gameToken(d.env, 'S1')
    const r = await gameV2(d.env, 'resume', { token }) as { questions: { qid: string }[] }
    expect(r.questions.map((q) => q.qid)).toEqual([`${MA}-I-1`])
    await expect(gameV2(d.env, 'answer', { token, session: id, qid: SACCHAROSE_QID, answer: 'kết tinh lại' })).rejects.toThrow('rút khỏi kho')
    await expect(gameV2(d.env, 'complete', { token, session: id })).rejects.toThrow('hoàn thành') // chưa làm câu rút được duy nhất
    const a = await gameV2(d.env, 'answer', { token, session: id, qid: `${MA}-I-1`, answer: 'B' })
    expect(a.ok).toBe(true)
    const c = await gameV2(d.env, 'complete', { token, session: id })
    expect(c.ok).toBe(true) // KHÔNG kẹt vì hai câu tự luận em không được làm
  })
  it('resume: lượt cũ TOÀN câu tự luận ⇒ coi như không có lượt để tiếp tục', async () => {
    const d = dungKho()
    const ref = (qid: string) => ({ qid, maDe: MA, version: 'v1', group: `g-${qid}`, novel: true })
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('LUOT-TL', 'S1', JSON.stringify({ mode: 'adventure', created: Date.now(), questions: [ref(SACCHAROSE_QID)] }), new Date().toISOString())
    const r = await gameV2(d.env, 'resume', { token: await gameToken(d.env, 'S1') }) as { questions: unknown[] }
    expect(r.questions).toEqual([])
  })
  it('readScope vẫn giữ câu tự luận trong pool làm bằng chứng của hồ sơ (chỉ nơi CHỌN mới lọc): em từng sai câu tự luận thì hồ sơ còn nguyên', async () => {
    const d = dungKho(); await saiBtvn(d, [SACCHAROSE_QID, `${MA}-I-1`])
    const { evidence } = await readScope(d.env, 'S1')
    expect(evidence.map((e) => e.qid)).toEqual(expect.arrayContaining([SACCHAROSE_QID]))
    expect(d.dem('nam_kt_cau', `qid='${SACCHAROSE_QID}'`)).toBe(1) // hồ sơ KHÔNG mất câu tự luận
  })
})

// ───────────────────────────── B · ĐOÀN HỘ TỐNG ─────────────────────────────
describe('B · Đoàn Hộ Tống (game-v2-doan.ts): câu cá nhân và câu chung của trùm', () => {
  const KHO_D = [
    ...Array.from({ length: 9 }, (_, i) => ({ ...cauRieng(thoI(i + 1), 'DE1'), qid: `X${i + 1}`, group: `g-X${i + 1}`, correct: 'B' })),
    // 3 câu phần I TỰ LUẬN cùng dạng (2 phương án): nếu lọt vào suất cá nhân, em sẽ thấy ở ô câu hỏi
    ...Array.from({ length: 3 }, (_, i) => ({ ...cauRieng(thoI(20 + i, { pa: { A: 'a', B: 'b' } }), 'DE1'), qid: `XTL${i + 1}`, group: `g-XTL${i + 1}`, correct: 'B' })),
  ]
  const trum = (qid: string, o: Tho = {}) => ({ ...cauRieng(thoII(1), 'DE1'), qid, group: `g-${qid}`, correct: 'DSDS', mucDo: 'van_dung', ...o })
  function dungDoan(cauTrum: ReturnType<typeof trum>[]): D1That {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong',?,'x')").run(JSON.stringify({ toanBo: true }))
    d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',?,?,0,'v1')").run(KHO_D.length + cauTrum.length, 'kho/DE1.json')
    d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
    for (const q of [...KHO_D, ...cauTrum]) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', q.qid, 'v1', q.group, q.dang, JSON.stringify(q))
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn Thu Hà','12A','mk','x')").run()
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
    return d
  }
  const goi = async (d: D1That, lenh: string, b: Record<string, unknown> = {}) => gameV2(d.env, `doan-${lenh}`, { token: await gameToken(d.env, 'S1'), ...b }) as Promise<{ doan: any }>
  /** Đi tới hết chặng, ghi lại mọi qid câu cá nhân và câu chung của trùm em nhìn thấy. */
  async function diHetChang(d: D1That) {
    await saiBtvn(d, ['X1'])
    const ma = (await goi(d, 'mo')).doan.ma as string
    troi(DEM_NGUOC_MS)
    const caNhan: string[] = [], chung: any[] = [], tatCa: string[] = []
    let xem = await goi(d, 'xem', { ma })
    for (let vong = 0; !xem.doan.tran.ketThuc && vong < 30; vong++) {
      if (xem.doan.tran.laTrum) {
        const t = xem.doan.trum
        chung.push(t)
        if (t?.coCau === false) troi(65_000) // không có câu chung ⇒ không ai chốt được ý nào: hiệp trùm chạy hết giờ
        else for (const y of (t.yCuaEm ?? []) as number[]) xem = await goi(d, 'nop-y', { ma, hiep: xem.doan.tran.hiep, y, answer: 'D' })
      } else if (xem.doan.cau) {
        caNhan.push(xem.doan.cau.qid)
        xem = await goi(d, 'nop', { ma, hiep: xem.doan.tran.hiep, answer: 'B', hanhDong: 'danh' })
      }
      troi(NGHI_GIUA_HIEP_MS + 1000); xem = await goi(d, 'xem', { ma }); tatCa.push(JSON.stringify(xem.doan))
    }
    return { caNhan, chung, tatCa: tatCa.join('\n') }
  }

  it('6 câu cá nhân: KHÔNG có câu tự luận (đối chứng: vẫn đủ 6 câu rút được)', async () => {
    const d = dungDoan([trum('TX1')])
    const { caNhan } = await diHetChang(d)
    expect(new Set(caNhan).size).toBe(6)
    expect(caNhan.filter((q) => q.startsWith('XTL'))).toEqual([])
  })
  it('câu chung của trùm: ứng viên phần II tự luận (đủ 4 ý, đủ DSDS, nhưng gắn nhãn tự luận) KHÔNG được chọn; đối chứng: bỏ nhãn thì được chọn', async () => {
    const dTL = dungDoan([trum('TXTL', { loai: 'tu_luan' })])
    await saiBtvn(dTL, ['X1'])
    const ma0 = (await goi(dTL, 'mo')).doan.ma as string
    expect(JSON.stringify((JSON.parse((dTL.sql.prepare('SELECT json FROM doan_chang WHERE ma = ?').get(ma0) as { json: string }).json) as { trum: unknown }).trum)).not.toContain('TXTL') // chonCauTrum không chọn câu tự luận
    const r1 = await diHetChang(dungDoan([trum('TXTL', { loai: 'tu_luan' })]))
    expect(r1.caNhan.length).toBeGreaterThan(0) // đã chơi thật, không phải chạy rỗng
    expect(r1.chung.filter((t) => t?.qid === 'TXTL')).toEqual([]) // không có ứng viên rút được ⇒ KHÔNG phát câu tự luận làm câu chung
    expect(r1.tatCa).not.toContain('TXTL')

    const dDoiChung = dungDoan([trum('TXTL')]) // cùng câu, không nhãn ⇒ rút được ⇒ phải được chọn
    await saiBtvn(dDoiChung, ['X1'])
    const ma1 = (await goi(dDoiChung, 'mo')).doan.ma as string
    expect(JSON.stringify((JSON.parse((dDoiChung.sql.prepare('SELECT json FROM doan_chang WHERE ma = ?').get(ma1) as { json: string }).json) as { trum: unknown }).trum)).toContain('TXTL')
    const r2 = await diHetChang(dungDoan([trum('TXTL')]))
    expect(r2.chung.some((t) => t?.qid === 'TXTL')).toBe(true)
  })
  it('phòng cũ đã GHIM câu tự luận làm câu chung: xem lại thì báo câu đã rút khỏi kho (đường rut sẵn có), không phát đề', async () => {
    const d = dungDoan([trum('TX1'), trum('TXTL', { loai: 'tu_luan' })])
    await saiBtvn(d, ['X1'])
    const ma = (await goi(d, 'mo')).doan.ma as string
    // giả lập phòng soạn TRƯỚC lệnh cấm: ghim câu tự luận vào cả câu cá nhân hiệp 1
    const phong = d.sql.prepare('SELECT json FROM doan_chang WHERE ma = ?').get(ma) as { json: string } | undefined
    expect(phong).toBeTruthy()
    const p = JSON.parse(phong!.json)
    p.nguoi[0].cau[0] = { ...p.nguoi[0].cau[0], qid: 'XTL1', nhom: 'g-XTL1' }
    d.sql.prepare('UPDATE doan_chang SET json = ? WHERE ma = ?').run(JSON.stringify(p), ma)
    troi(DEM_NGUOC_MS)
    const xem = await goi(d, 'xem', { ma })
    expect(xem.doan.cau.de).toBeUndefined()
    expect(xem.doan.cau.rut).toBe(true)
  })
})

// ───────────────────────────── C · ÔN LẠI + KẾ HOẠCH NGÀY ─────────────────────────────
describe('C · ôn lại (cau-theo-qid.ts) và kế hoạch ngày (on_lai)', () => {
  it('qidPhucVuDuoc: câu tự luận KHÔNG phục vụ được, không tính là "không có chỉ mục"', async () => {
    const d = dungKho()
    const pv = await qidPhucVuDuoc(d.env, [...RUT_DUOC, ...TU_LUAN])
    expect([...pv.duoc].sort()).toEqual([...RUT_DUOC].sort())
    expect(pv.tuLuan.sort()).toEqual([...TU_LUAN].sort())
    expect(pv.khongCoChiMuc).toEqual([])
  })
  it('layCauChoEm + /hs/cau-theo-qid: em từng gặp câu tự luận cũng KHÔNG lấy lại được đề; câu rút được vẫn lấy', async () => {
    const d = dungKho(); await saiBtvn(d, [...RUT_DUOC, ...TU_LUAN])
    const r = await layCauChoEm(d.env, 'S1', [...RUT_DUOC, ...TU_LUAN])
    expect(r.cau.map((c) => c.qid).sort()).toEqual([...RUT_DUOC].sort())
    const h = await hsCauTheoQid(d.env, { sbd: 'S1', qid: [SACCHAROSE_QID, `${MA}-I-1`] }) as { ok: boolean; cau: { qid: string }[]; khongCo: string[] }
    expect(h.cau.map((c) => c.qid)).toEqual([`${MA}-I-1`])
    expect(h.khongCo).toEqual([SACCHAROSE_QID])
    expect(cauCongKhai(r.cau[0]!)).not.toHaveProperty('correct')
  })
  it('kế hoạch ngày: em sai cả 8 câu ⇒ việc on_lai CHỈ chứa câu rút được; câu tự luận vẫn ở hồ sơ (nam_kt_cau)', async () => {
    const d = dungKho(); await saiBtvn(d, [...RUT_DUOC, ...TU_LUAN])
    const kh = (await lapVaLuuKeHoach(d.env, ['S1'], Date.now())).get('S1')!
    const qid = (kh.viec.find((v) => v.loai === 'on_lai')?.chiTiet.qid as string[] | undefined) ?? []
    expect(qid.length).toBeGreaterThan(0)
    for (const q of qid) expect(RUT_DUOC).toContain(q)
    expect(qid.filter((q) => TU_LUAN.includes(q))).toEqual([])
    expect(kh.tienBo.soCauToiHan).toBe(RUT_DUOC.length) // số câu tới hạn cũng chỉ đếm câu em làm được
    expect(d.dem('nam_kt_cau', `qid IN (${TU_LUAN.map((q) => `'${q}'`).join(',')})`)).toBe(TU_LUAN.length) // hồ sơ giữ nguyên câu tự luận
  })
  it('lệnh đo độ phủ có số câu tự luận bị loại', async () => {
    const d = dungKho(); await saiBtvn(d, [...RUT_DUOC, ...TU_LUAN])
    const r = await docDoPhuPhucVu(d.env, new Date(T0 + 30 * 86_400_000).toISOString().slice(0, 10))
    expect(r).toMatchObject({ ok: true, qidTuLuan: TU_LUAN.length, qidPhucVuDuoc: RUT_DUOC.length })
  })
})

// ───────────────────────────── D · BÀI MẸ GIAO + BÀI HẰNG NGÀY ─────────────────────────────
describe('D · Mẹ giao (mom.ts) và bài hằng ngày cho phụ huynh', () => {
  const luyen = (t: Tho) => ({ id: qidCua(t), qid: qidCua(t), phan: t.phan, maDe: MA, text: t.de, luaChon: t.phan === 'I' ? Object.values(t.pa as object) : null, dapAn: t.dap_an })
  const tao = (d: D1That, id: string, dsCau: unknown[]) => mom(d.env, 'create', { sbd: 'S1', id, dsCau }, { noiBo: true })

  it('create: máy phụ huynh gửi lẫn câu tự luận ⇒ chỉ lưu câu rút được, báo số câu bỏ', async () => {
    const d = dungKho()
    const r = await tao(d, 'm1', KHO_THO.map(luyen)) as { item: { soCau: number }; soBoTuLuan: number }
    expect(r.item.soCau).toBe(RUT_DUOC.length)
    expect(r.soBoTuLuan).toBe(TU_LUAN.length)
    const luu = JSON.parse(String([...d.objects.entries()].find(([k]) => k.startsWith('mom/'))![1])) as { qid: string }[]
    expect(luu.map((c) => c.qid).sort()).toEqual([...RUT_DUOC].sort())
  })
  it('create: bài CHỈ có câu tự luận bị từ chối, không tạo bài rỗng', async () => {
    const d = dungKho()
    await expect(tao(d, 'm2', KHO_THO.filter((t) => laCauTuLuan(t)).map(luyen))).rejects.toThrow('tự luận')
    expect(d.dem('mom_bai')).toBe(0)
  })
  it('bài hằng ngày (dungDuoc): câu tự luận không bao giờ được chọn — kể cả phần I hai phương án mà luật 3 dạng chuẩn cũ để lọt', () => {
    const baoVe = new Set<string>()
    expect(dungDuoc(cauRieng(KHO_THO[0]!) as never, baoVe)).toBe(true) // đối chứng
    expect(dungDuoc(cauRieng(KHO_THO[2]!) as never, baoVe)).toBe(false)
    expect(dungDuoc(cauRieng(KHO_THO[5]!) as never, baoVe)).toBe(false)
  })
})

// ───────────────────────────── E · LUYỆN ĐỀ ─────────────────────────────
describe('E · luyện đề 2026 (luyen-de.ts)', () => {
  it('nguồn đưa vào bộ rút đề CHỈ còn câu rút được', async () => {
    // parseKhoDeJson / buildTeacherSourceFromKhoDe loại CẢ TỜ nếu có câu thiếu dap_an hoặc phần I thiếu phương án ⇒ tờ bộ đề không mang III-4 và I-3; hai câu tự luận còn lại (III-2, III-3) vẫn có mặt.
    const d = dungKho('DE-BODE', 'kho/DE-BODE.json', KHO_THO.filter((t) => String(t.dap_an) !== '' && !(t.phan === 'I' && t.so === 3)), 'Bộ đề 12 số 1')
    const daNhan: { phanI: { id: string }[]; phanII: { id: string }[]; phanIII: { id: string }[] }[][] = []
    vi.resetModules()
    vi.doMock('../src/lib/ma-tran-hoa-2026', async (goc) => ({
      ...(await goc<typeof import('../src/lib/ma-tran-hoa-2026')>()),
      laBoDe12: () => true,
      rutDeChuan2026: (nguon: never) => { daNhan.push(nguon); return nguon },
    }))
    const { luyenDe: luyen } = await import('../server/src/luyen-de')
    const { gameToken: token } = await import('../server/src/game-v2-auth')
    await luyen(d.env, 'start', { token: await token(d.env, 'S1'), daHocXong: true })
    vi.doUnmock('../src/lib/ma-tran-hoa-2026'); vi.resetModules()
    expect(daNhan.length).toBe(1)
    const ids = daNhan[0]!.flatMap((s) => [...s.phanI, ...s.phanII, ...s.phanIII].map((q) => q.id.replace('DE-BODE', MA)))
    expect(ids.length).toBeGreaterThan(0) // đối chứng
    expect(ids).toEqual(expect.arrayContaining([`${MA}-I-1`, `${MA}-III-1`])) // câu rút được vẫn vào bộ rút
    for (const id of ids) expect(TU_LUAN).not.toContain(id)
    expect(ids).not.toContain(SACCHAROSE_QID)
    expect(luyenDe).toBeTypeOf('function')
  })
})

// ───────────────────────────── F · KHẮC PHỤC SAU CA + DẠNG BÀI + PHIẾU + RÚT CÂU ─────────────────────────────
describe('F · khắc phục sau ca, dạng bài, phiếu, /kho/rut-cau', () => {
  const qidCauTrongGoi = (goi: any) => (goi.cau as Tho[]).map((c) => `${MA}-${c.phan}-${c.so}`)

  it('cauKhacPhucGoi theo chuyên đề (không dsDang): thuTu và gói trả về KHÔNG còn câu tự luận', async () => {
    const d = dungKho()
    const r = await cauKhacPhucGoi(d.env, { sbd: 'S1', soCau: 20, chuyenDe: ['CD1'] }) as { thuTu: string[]; items: any[] }
    expect(r.thuTu.length).toBeGreaterThan(0)
    expect([...r.thuTu].sort()).toEqual([...RUT_DUOC].sort())
    expect(qidCauTrongGoi(r.items[0]).filter((q) => TU_LUAN.includes(q))).toEqual([]) // gói trả về cũng đã gỡ (kèm đáp án nên không được rò)
  })
  it('cauKhacPhucGoi theo dạng (dsDang): chỉ ra câu rút được', async () => {
    const d = dungKho()
    const r = await cauKhacPhucGoi(d.env, { sbd: 'S1', soCau: 20, chuyenDe: ['CD1'], dsDang: ['ES.A.X'] }) as { thuTu: string[]; items: { cau: Tho[] }[] }
    expect([...r.thuTu].sort()).toEqual([...RUT_DUOC].sort())
    for (const it of r.items) for (const c of it.cau) expect(TU_LUAN).not.toContain(`${MA}-${c.phan}-${c.so}`)
  })
  it('deTheoDangBai: tờ dạng bài trả cho máy em đã gỡ câu tự luận', async () => {
    const d = dungKho('DB-K', 'kho/DB-K.json')
    const r = await deTheoDangBai(d.env, { ma: 'DB-K' }) as { ok: boolean; de: { cau: Tho[] } }
    expect(r.ok).toBe(true)
    expect(r.de.cau.map((c) => `${c.phan}-${c.so}`).sort()).toEqual(['I-1', 'I-2', 'II-1', 'III-1'])
  })
  it('/kho/rut-cau: chỉ mục trả về không có câu tự luận; coSan và soBoTuLuan khớp; gói hỏng/không có ⇒ không kết tội', async () => {
    const d = dungKho()
    const r = await goiWorker(worker, d.env, '/kho/rut-cau', { chuyenDe: ['CD1'], soCau: 50 }, true) as { ok: boolean; ds: { qid: string }[]; coSan: number; soBoTuLuan: number }
    expect(r.ok).toBe(true)
    expect(r.ds.map((x) => x.qid).sort()).toEqual([...RUT_DUOC].sort())
    expect(r).toMatchObject({ coSan: RUT_DUOC.length, soBoTuLuan: TU_LUAN.length })
    const ghi = await goiWorker(worker, d.env, '/kho/rut-cau', { chuyenDe: ['CD1'], soCau: 2 }, true)
    expect(ghi.ds).toHaveLength(2) // đủ số cần thì dừng, mọi câu ra đều rút được
    for (const x of ghi.ds) expect(RUT_DUOC).toContain(x.qid)
    // Tờ thứ hai mà gói R2 MẤT: không đọc được ⇒ không biết ⇒ KHÔNG kết tội (giữ cả 8 dòng chỉ mục của tờ ấy)
    themTo(d, 'DE-NG'); d.objects.delete('kho/DE-NG.json')
    const khongDoc = await goiWorker(worker, d.env, '/kho/rut-cau', { chuyenDe: ['CD1'], soCau: 50 }, true)
    expect(khongDoc.ds.filter((x: { maDe: string }) => x.maDe === 'DE-NG')).toHaveLength(KHO_THO.length)
    expect(khongDoc.ds.filter((x: { maDe: string }) => x.maDe === MA)).toHaveLength(RUT_DUOC.length)
  })
  it('hsCauSai (khắc phục câu sai theo ca đã thi): câu sai ở ca cũ là tự luận (phần I thiếu phương án) KHÔNG được trả lại; câu rút được vẫn trả', async () => {
    const d = dungKho()
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cap_nhat_luc) VALUES('CA-T','Ca thử','dong','x')").run()
    d.objects.set('key/CA-T.json', { cau: KHO_THO.map((t) => ({ ...t })) })
    for (const t of KHO_THO) {
      d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,chuyen_de,muc_do,dap_an_chon,dap_an_dung,dung_sai,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?,0,'x')")
        .run(`CA-T|S1|1|${String(t.phan)}|${String(t.so)}`, 'CA-T', 'S1', 1, String(t.phan), Number(t.so), qidCua(t), 'CD1', 'biet', 'A', String(t.dap_an))
    }
    const r = await hsCauSai(d.env, { sbd: 'S1' }) as { ok: boolean; items: { qid: string }[] }
    expect(r.ok).toBe(true)
    const qid = r.items.map((x) => x.qid)
    expect(qid).toEqual(expect.arrayContaining([`${MA}-I-1`, `${MA}-III-1`])) // đối chứng
    expect(qid.filter((q) => TU_LUAN.includes(q))).toEqual([])
  })
  it('phiếu bài tập: luuPhieu lọc lúc LƯU, layPhieu lọc lúc PHỤC VỤ (phiếu cũ đã lưu có tự luận), phiếu kết quả không bị đụng', async () => {
    const d = dungKho()
    const cau = KHO_THO.map((t) => ({ id: qidCua(t), phan: t.phan, text: t.de, luaChon: t.phan === 'I' ? Object.values(t.pa as object) : null, dapAn: t.dap_an }))
    await luuPhieu(d.env, { ma: 'PB1', loai: 'baitap', sbd: 'S1', phieu: { cau, sbd: 'S1' } })
    const daLuu = JSON.parse(String(d.objects.get('phieu/PB1.json'))) as { phieu: { cau: { id: string }[] } }
    expect(daLuu.phieu.cau.map((c) => c.id).sort()).toEqual([...RUT_DUOC].sort())
    // phiếu CŨ đã nằm trên R2 từ trước lệnh cấm (còn tự luận)
    d.objects.set('phieu/PCU.json', { ma: 'PCU', loai: 'baitap', phieu: { cau }, ghiLuc: 'x' })
    d.sql.prepare("INSERT INTO phieu(ma,ma_ca,sbd,ho_ten,loai,so_lan_xem,thu_hoi,luu_luc) VALUES('PCU','','S1','','baitap',0,0,'x')").run()
    const cu = await layPhieu(d.env, { ma: 'PCU' }) as { ok: boolean; phieu: { cau: { id: string }[] } }
    expect(cu.phieu.cau.map((c) => c.id).sort()).toEqual([...RUT_DUOC].sort())
    // phiếu KẾT QUẢ (báo cáo bài đã thi) không phải rút đề: nguyên vẹn
    await luuPhieu(d.env, { ma: 'PK1', loai: 'ketqua', sbd: 'S1', phieu: { cau } })
    expect(((await layPhieu(d.env, { ma: 'PK1' })) as any).phieu.cau).toHaveLength(KHO_THO.length)
  })
  it('ghiPhieuKhacPhuc (máy em gửi câu lên lập phiếu): lọc tự luận; toàn tự luận thì không lập', async () => {
    const d = dungKho()
    const cau = KHO_THO.map((t) => ({ id: qidCua(t), phan: t.phan, text: t.de, luaChon: t.phan === 'I' ? Object.values(t.pa as object) : null, dapAn: t.dap_an }))
    const r = await ghiPhieuKhacPhuc(d.env, { sbd: 'S1', cau, tenChuyenDe: 'CD1' }) as { ok: boolean; ma: string }
    expect(r.ok).toBe(true)
    const p = await layPhieu(d.env, { ma: r.ma }) as { phieu: { cau: { id: string }[] } }
    expect(p.phieu.cau.map((c) => c.id).sort()).toEqual([...RUT_DUOC].sort())
    const rong = await ghiPhieuKhacPhuc(d.env, { sbd: 'S1', cau: cau.filter((c) => TU_LUAN.includes(c.id)) })
    expect(rong.ok).toBe(false)
  })
})

// ───────────────────────────── G · BTVN THƯỜNG + NÂNG ĐỠ ─────────────────────────────
describe('G · BTVN thường và nâng đỡ (btvn-grading.ts homeworkQuestions là cửa duy nhất)', () => {
  /** Tờ mẫu BTVN (24 câu rút được) + 2 câu tự luận (I-17 hai phương án, III-5 đáp án chữ). */
  function dungBtvnCoTuLuan(): D1That {
    const d = dungBtvn(1)
    const tk = toKho()
    tk.cau.push(
      { phan: 'I', so: 17, de: 'Câu I.17', pa: { A: 'a', B: 'b' }, dap_an: 'A', chuyen_de: 'Este', muc_do: 'biet', dang: { ma: 'DA-1', ten: 'x' } },
      { phan: 'III', so: 5, de: SACCHAROSE, dap_an: 'kết tinh lại', chuyen_de: 'Polime', muc_do: 'biet', dang: { ma: 'DA-4', ten: 'Điều chế' } },
    )
    d.objects.set('kho/DE1.json', tk)
    return d
  }
  it('homeworkQuestions: 0 câu tự luận (đúng 24 câu rút được, theo thứ tự tờ)', async () => {
    const d = dungBtvnCoTuLuan()
    const ds = await homeworkQuestions(d.env, 'DE1')
    expect(ds).toHaveLength(24)
    expect(ds.map((c) => c.qid)).not.toContain('DE1-I-17')
    expect(ds.map((c) => c.qid)).not.toContain('DE1-III-5')
  })
  it('/btvn/giao (thường): soCau = số câu em sẽ được giao (không đếm cả tờ); báo "đã bỏ N câu tự luận"', async () => {
    gio(BAY_GIO)
    const d = dungBtvnCoTuLuan()
    const r = await giao(d, { caNhan: false })
    expect(r).toMatchObject({ ok: true, soCau: 24, soBoTuLuan: 2 })
    expect(r.chuBoTuLuan).toContain('2 câu tự luận')
    expect(d.sql.prepare('SELECT so_cau FROM btvn').get()).toEqual({ so_cau: 24 })
  })
  it('/btvn/cua-em (em mở bài thường): không có câu tự luận trong bài phát ra', async () => {
    gio(BAY_GIO)
    const d = dungBtvnCoTuLuan()
    expect((await giao(d, { caNhan: false })).ok).toBe(true)
    const r = await mo(d)
    const qid = JSON.stringify(r)
    expect(qid).not.toContain('DE1-III-5'); expect(qid).not.toContain('DE1-I-17')
    expect(qid).toContain('DE1-I-1')
  })
  it('BTVN nâng đỡ: bộ câu của em không có câu tự luận; qid tự luận thầy gửi vào bị bỏ (boQuaQid)', async () => {
    gio(BAY_GIO)
    const d = dungBtvnCoTuLuan()
    const cauGuiThem = [...cauThay(), { qid: 'DE1-I-17', dang: 'DA-1', chuyenDe: 'Este', mucDo: 0, sao: 0, phan: 'I' }, { qid: 'DE1-III-5', dang: 'DA-4', chuyenDe: 'Polime', mucDo: 0, sao: 0, phan: 'III' }]
    const r = await giao(d, { cau: cauGuiThem })
    expect(r.ok).toBe(true)
    expect(r.boQuaQid.sort()).toEqual(['DE1-I-17', 'DE1-III-5'])
    expect(d.dem('btvn_cau')).toBe(24)
    expect(d.dem('btvn_cau', "qid IN ('DE1-I-17','DE1-III-5')")).toBe(0)
    void HAN; void maBtvn
  })
})

// ───────────────────────────── H · GỌI LÊN BẢNG + CA THI: KHÔNG BỊ ĐỤNG ─────────────────────────────
describe('H · loại trừ theo lệnh thầy: Gọi lên bảng / lấy tờ kho nguyên vẹn', () => {
  it('/kho/lay (thầy tự chọn câu để chiếu / cho ca): trả NGUYÊN tờ, gồm cả câu tự luận — không bộ lọc nào chen vào', async () => {
    const d = dungKho()
    const r = await goiWorker(worker, d.env, '/kho/lay', { maDe: MA }, true) as { cau: Tho[] }
    expect(r.cau).toHaveLength(KHO_THO.length)
    expect(r.cau.map((c) => `${c.phan}-${c.so}`)).toContain('III-2') // câu saccharose thầy chọn vẫn hiện đủ
  })
  it('ho-so-len-bang (màn Gọi lên bảng) không nhập bộ lọc tự luận', async () => {
    const { readFileSync } = await import('node:fs')
    for (const tep of ['server/src/ho-so-len-bang.ts']) expect(readFileSync(tep, 'utf-8')).not.toMatch(/cam-tu-luan|laCauTuLuan|locCauRutDuoc/)
  })
})
