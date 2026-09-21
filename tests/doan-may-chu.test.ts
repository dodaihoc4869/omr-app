// @vitest-environment node
// ĐOÀN HỘ TỐNG — bước 2: máy chủ (mở chặng / vào chặng / nộp hiệp / kết chặng) chạy trên SQLITE THẬT với lược đồ thật.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { DEM_NGUOC_MS, NGHI_GIUA_HIEP_MS, AN_HAN_MS, chiSoCau, tenGoi } from '../server/src/game-v2-doan'
import { taoD1That, type D1That } from './_d1-that'

const T0 = Date.parse('2026-09-21T12:00:00+07:00')
let bayGio = T0
const troi = (ms: number) => { bayGio += ms; vi.setSystemTime(bayGio) }
beforeEach(() => { bayGio = T0; vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())

const BI_MAT = 'LOI-GIAI-BI-MAT'
type CauKho = { qid: string; phan: 'I' | 'II'; dang: string; correct: string; mucDo: string; kt?: string[] }
const KHO: CauKho[] = [
  ...Array.from({ length: 9 }, (_, i): CauKho => ({ qid: `X${i + 1}`, phan: 'I', dang: 'ES.A.X', correct: 'ABCD'[i % 4]!, mucDo: 'biet' })),
  ...Array.from({ length: 9 }, (_, i): CauKho => ({ qid: `Y${i + 1}`, phan: 'I', dang: 'AN.B.Y', correct: 'DCBA'[i % 4]!, mucDo: 'biet' })),
  // Phần II bậc vận dụng: không bao giờ vào suất câu cá nhân của em đang ở bậc "biết" → luôn còn cho câu chung của trùm.
  { qid: 'TX1', phan: 'II', dang: 'ES.A.X', correct: 'DSDS', mucDo: 'van_dung' }, { qid: 'TX2', phan: 'II', dang: 'ES.A.X', correct: 'SSDD', mucDo: 'van_dung' },
  { qid: 'TY1', phan: 'II', dang: 'AN.B.Y', correct: 'DDSS', mucDo: 'van_dung' },
  // Cùng dạng Ester nhưng cần kiến thức nền K-LA mà CHƯA bạn nào có bằng chứng → không bao giờ được thành câu chung (không đoán phạm vi từ tên dạng).
  { qid: 'TX-LA', phan: 'II', dang: 'ES.A.X', correct: 'DDDD', mucDo: 'biet', kt: ['K1', 'K-LA'] },
]
const dapAn = new Map(KHO.map(c => [c.qid, c.correct]))
const saiCua = (qid: string) => (dapAn.get(qid) === 'A' ? 'B' : 'A')

function dungTruong(hs: [string, string, string][] = [['S1', 'Nguyễn Thu Hà', '12A'], ['S2', 'Trần Văn Nam', '12A']], moCo: unknown = { toanBo: true }): D1That {
  const d = taoD1That()
  if (moCo) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong',?,'x')").run(JSON.stringify(moCo))
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',?,?,0,'v1')").run(KHO.length, 'kho/DE1.json')
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  for (const c of KHO) {
    const q = { qid: c.qid, maDe: 'DE1', version: 'v1', group: `g-${c.qid}`, phan: c.phan, text: `Đề ${c.qid}`, choices: c.phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: c.phan === 'II' ? ['ý a', 'ý b', 'ý c', 'ý d'] : [],
      hinhAnh: [{ src: `${BI_MAT}-anh`, viTri: 'sau_loi_giai' }], dang: c.dang, tenDang: c.dang === 'ES.A.X' ? 'Ester' : 'Ancol', mucDo: c.mucDo, sao: 1, kienThuc: c.kt ?? ['K1'], correct: c.correct, solution: `${BI_MAT}-${c.qid}`, reviewed: true }
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', q.qid, 'v1', q.group, q.dang, JSON.stringify(q))
  }
  for (const [sbd, ten, lop] of hs) {
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,'mk','x')").run(sbd, ten, lop)
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run(sbd, JSON.stringify({ pet: sbd === 'S1' ? 'lua_phuong' : 'nuoc_long', choice: false, legacy: null, cap: sbd === 'S1' ? 1 : 100, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  }
  return d
}
/** Bằng chứng từ BTVN 3 ngày trước: em `sbd` từng SAI câu `qid` → dạng của câu ấy mở cho em trong game. */
async function bangChung(d: D1That, sbd: string, qid: string) {
  const dang = KHO.find(c => c.qid === qid)!.dang
  await ghiSuKien(d.env, [{ nguon: 'btvn', maNguon: `BT-${sbd}`, sbd, qid, lan: 1, ketQua: 0, luc: new Date(T0 - 72 * 3_600_000).toISOString(), maDang: dang }])
  await dungLaiHoSo(d.env, [sbd], new Date(T0).toISOString())
}
type KN = { ok: boolean; doan: any; ketQuaCau?: any; loiGiaiTrum?: any; daRoi?: boolean }
const goi = async (d: D1That, sbd: string, lenh: string, b: Record<string, unknown> = {}) => gameV2(d.env, `doan-${lenh}`, { token: await gameToken(d.env, sbd), ...b }) as Promise<KN>
const dem = (d: D1That, sql: string, ...a: unknown[]) => Number((d.sql.prepare(sql).get(...(a as never[])) as { n: number }).n)
/** Soi toàn bộ gói tin: không được có khoá mang đáp án / lời giải, không có chuỗi lời giải, không có SBD của bạn. */
function khongLo(goiTin: unknown, sbdBan: string[] = []) {
  const chuoi = JSON.stringify(goiTin)
  expect(chuoi).not.toContain(BI_MAT)
  expect(chuoi).not.toMatch(/"(correct|solution|answer|reviewed|solutionImages)"/)
  for (const s of sbdBan) expect(chuoi).not.toContain(`"${s}"`)
}
/** Em `sbd` làm câu hiệp hiện tại (đúng hoặc cố ý sai) rồi chốt. */
async function lamHiep(d: D1That, sbd: string, ma: string, dung = true, hanhDong = 'danh') {
  const xem = await goi(d, sbd, 'xem', { ma }), qid = xem.doan.cau.qid as string
  return goi(d, sbd, 'nop', { ma, hiep: xem.doan.tran.hiep, answer: dung ? dapAn.get(qid) : saiCua(qid), hanhDong })
}
async function chotYTrum(d: D1That, sbd: string, ma: string, dung = true) {
  let xem = await goi(d, sbd, 'xem', { ma })
  for (const y of xem.doan.trum.yCuaEm as number[]) {
    const dapAnY = dapAn.get(xem.doan.trum.qid)![y]!
    xem = await goi(d, sbd, 'nop-y', { ma, hiep: xem.doan.tran.hiep, y, answer: dung ? dapAnY : dapAnY === 'D' ? 'S' : 'D' })
  }
  return xem
}

describe('Đoàn Hộ Tống · máy chủ · đi một mình trọn chặng', () => {
  it('mở chặng: có bạn máy, đếm ngược rồi mới phát câu; câu xuống máy KHÔNG kèm đáp án/lời giải; chốt xong mới thấy', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1')
    const mo = await goi(d, 'S1', 'mo')
    expect(mo.doan.batDau).toBe(true); expect(mo.doan.ghe.map((g: any) => [g.laMay, g.laEm])).toEqual([[false, true], [true, false]])
    expect(mo.doan.ghe[0].ten).toBe('Thu Hà'); expect(mo.doan.tran).toMatchObject({ hiep: 1, soHiep: 8, laTrum: false, linhTam: { hp: 80, toiDa: 80 }, moSauMs: DEM_NGUOC_MS })
    expect(mo.doan.cau).toBeUndefined(); khongLo(mo) // đang đếm ngược: chưa có câu
    troi(DEM_NGUOC_MS)
    const xem = await goi(d, 'S1', 'xem', { ma: mo.doan.ma })
    // SỬA CÓ CHỦ Ý 21/09 (thầy lệnh ~19:35, Đoàn rút bằng luật Đảo Đợt 2, KHÔNG lặp câu em đã làm ở BẤT KỲ nguồn/ngày nào): câu em ĐÃ LÀM (X1, sai 3 ngày trước) không còn ra đầu tiên — câu MỚI cùng dạng ra trước.
    const q1 = xem.doan.cau.qid as string
    expect(q1).toMatch(/^X[2-9]$/); expect(q1).not.toBe('X1') // dạng Ester (mở bởi câu sai), câu MỚI — không phải X1 đã làm
    expect(xem.doan.cau).toMatchObject({ qid: q1, de: { qid: q1, text: `Đề ${q1}` } }); khongLo(xem)
    expect(xem.doan.tran.conMs).toBe(40_000)
    const nop = await goi(d, 'S1', 'nop', { ma: mo.doan.ma, hiep: 1, answer: dapAn.get(q1), hanhDong: 'danh' })
    expect(nop.ketQuaCau).toMatchObject({ correct: true, answer: dapAn.get(q1), solution: `${BI_MAT}-${q1}` })
    // Đi một mình: em chốt là đủ bài → hiệp giải ngay, sang hiệp 2 sau quãng nghỉ
    expect(nop.doan.tran).toMatchObject({ hiep: 2, moSauMs: NGHI_GIUA_HIEP_MS }); expect(nop.doan.hiepVuaXong.cuaEm).toMatchObject({ dung: true, satThuong: 24, tuLam: true })
  })

  it('đi trọn 8 hiệp: 6 câu cá nhân đều KHÁC nhau, ghi 6 lượt làm + 6 dòng sổ nguồn game; trùm không tạo bằng chứng; sổ lượt chốt đúng MỘT lần', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1')
    const ma = (await goi(d, 'S1', 'mo')).doan.ma as string, daLam: string[] = []
    troi(DEM_NGUOC_MS)
    let xem = await goi(d, 'S1', 'xem', { ma })
    const hocTapTruoc = dem(d, 'SELECT (SELECT COUNT(*) FROM luot)+(SELECT COUNT(*) FROM chi_tiet_cau)+(SELECT COUNT(*) FROM tien_do_hs) n')
    while (!xem.doan.tran.ketThuc) {
      khongLo(xem)
      if (xem.doan.tran.laTrum) { expect(xem.doan.trum.coCau).toBe(true); expect(xem.doan.trum.de.ideas).toHaveLength(4); xem = await chotYTrum(d, 'S1', ma) }
      else { daLam.push(xem.doan.cau.qid); xem = await lamHiep(d, 'S1', ma) }
      troi(NGHI_GIUA_HIEP_MS); xem = await goi(d, 'S1', 'xem', { ma })
    }
    expect(new Set(daLam).size).toBe(6); expect(daLam.every(q => q.startsWith('X'))).toBe(true)
    expect(dem(d, "SELECT COUNT(*) n FROM game_v2_attempt WHERE sbd='S1'")).toBe(6)
    expect(dem(d, "SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd='S1' AND nguon='game'")).toBe(6)
    expect(dem(d, "SELECT COUNT(*) n FROM su_kien_hoc WHERE qid LIKE 'T%'") + dem(d, "SELECT COUNT(*) n FROM game_v2_attempt WHERE qid LIKE 'T%'")).toBe(0)
    expect(dem(d, 'SELECT (SELECT COUNT(*) FROM luot)+(SELECT COUNT(*) FROM chi_tiet_cau)+(SELECT COUNT(*) FROM tien_do_hs) n')).toBe(hocTapTruoc) // game không sửa bảng học tập
    expect(xem.doan.ketChang).toMatchObject({ thang: true, cuaEm: { soCau: 6, soDung: 6, soTuLamDung: 6 }, tienBo: { soCau: 6, tuLamDung: 6, lenBac: 0, giup: 0 } })
    expect(xem.doan.ketChang.ban).toEqual([{ ghe: 1, laMay: true, soLanGiupThanhCong: 0 }]) // về bạn: không có số đúng/sai
    const luot = d.sql.prepare("SELECT * FROM doan_luot WHERE sbd='S1'").all() as any[]
    expect(luot).toHaveLength(1); expect(luot[0]).toMatchObject({ ma_chang: ma, ngay_vn: '2026-09-21', lop: '12A', thang: 1, so_cau: 6, so_dung: 6, so_tu_lam_dung: 6 }); expect(luot[0].ket_luc).toBeTruthy()
    expect((d.sql.prepare('SELECT trang_thai FROM doan_chang WHERE ma=?').get(ma) as any).trang_thai).toBe('xong')
    const ketLuc = luot[0].ket_luc; await goi(d, 'S1', 'xem', { ma }); await goi(d, 'S1', 'xem', { ma })
    expect((d.sql.prepare("SELECT ket_luc FROM doan_luot WHERE sbd='S1'").get() as any).ket_luc).toBe(ketLuc) // xem lại không chốt sổ lần hai
    // Chặng đã xong → lần "mở" kế tiếp là CHẶNG MỚI (không kéo lại chặng cũ) — và vì là chặng thứ hai trong ngày nên cần vé (bước 5; test riêng ở doan-mua)
    await expect(goi(d, 'S1', 'mo')).rejects.toThrow('chưa có vé')
  })

  it('"lên bậc ôn" đo từ sổ: câu từng ĐÚNG ở một ngày VN trước, hôm nay tự làm đúng lại → tính 1', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1')
    await ghiSuKien(d.env, [{ nguon: 'btvn', maNguon: 'BT2', sbd: 'S1', qid: 'X1', lan: 2, ketQua: 1, luc: new Date(T0 - 48 * 3_600_000).toISOString(), maDang: 'ES.A.X' }])
    // SỬA CÓ CHỦ Ý 21/09 (thầy lệnh ~19:35, Đoàn rút bằng luật Đảo Đợt 2, KHÔNG lặp câu em đã làm ở BẤT KỲ nguồn/ngày nào): câu em ĐÃ LÀM (X1) không ra trước câu MỚI. Muốn X1 vào chặng thì kho hết câu mới:
    // em đã chơi X2…X6 ở game hôm qua (lượt CÓ TRỢ GIÚP — không vào sổ học ⇒ không tính "lên bậc"), thầy chặn X7…X9 ⇒ chặng lấy đúng 6 câu CŨ (lâu nhất chưa gặp), gồm X1.
    const hqua = T0 - 48 * 3_600_000, insA = d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
    for (const qid of ['X2', 'X3', 'X4', 'X5', 'X6']) insA.run(`h-${qid}`, 'S1', 'hqua', qid, `g-${qid}`, JSON.stringify({ attempt: { id: `h-${qid}`, session: 'hqua', qid, group: `g-${qid}`, dang: 'ES.A.X', mucDo: 'biet', correct: false, assisted: true, at: hqua, novel: true } }), new Date(hqua).toISOString())
    d.sql.prepare("INSERT INTO game_v2_scope(sbd,json,updated_at) VALUES('S1',?,'x')").run(JSON.stringify({ enabled: true, types: [], blocked: ['X7', 'X8', 'X9'] }))
    await dungLaiHoSo(d.env, ['S1'], new Date(T0).toISOString())
    const ma = (await goi(d, 'S1', 'mo')).doan.ma as string
    troi(DEM_NGUOC_MS); let xem = await goi(d, 'S1', 'xem', { ma })
    while (!xem.doan.tran.ketThuc) { xem = xem.doan.tran.laTrum ? await chotYTrum(d, 'S1', ma) : await lamHiep(d, 'S1', ma); troi(NGHI_GIUA_HIEP_MS); xem = await goi(d, 'S1', 'xem', { ma }) }
    expect(xem.doan.ketChang.tienBo).toMatchObject({ soCau: 6, tuLamDung: 6, lenBac: 1 }) // chỉ X1 từng đúng ở ngày trước; 5 câu kia đúng lần đầu nên chưa "lên bậc"
    expect(JSON.stringify(xem)).not.toMatch(/nắm chắc/i)
  })

  it('tải lại trang giữa hiệp: mở lại đúng chặng đang dở; đã chốt thì thấy lại kết quả câu CỦA MÌNH; máy em đã có đề thì không gửi lại', async () => {
    const d = dungTruong([['S1', 'Nguyễn Thu Hà', '12A'], ['S2', 'Trần Văn Nam', '12A']]); await bangChung(d, 'S1', 'X1'); await bangChung(d, 'S2', 'Y1')
    const ma = (await goi(d, 'S1', 'mo', { cheDo: 'phong' })).doan.ma as string
    await goi(d, 'S2', 'vao', { ma }); await goi(d, 'S1', 'bat-dau', { ma }); troi(DEM_NGUOC_MS)
    expect((await goi(d, 'S1', 'mo')).doan.ma).toBe(ma)
    // SỬA CÓ CHỦ Ý 21/09 (thầy lệnh ~19:35, Đoàn rút bằng luật Đảo Đợt 2, KHÔNG lặp câu em đã làm ở BẤT KỲ nguồn/ngày nào): câu em ĐÃ LÀM (X1, sai 3 ngày trước) không còn ra đầu tiên — câu MỚI cùng dạng ra trước.
    const q1 = (await goi(d, 'S1', 'xem', { ma })).doan.cau.qid as string
    expect(q1).toMatch(/^X[2-9]$/)
    const giu = (await goi(d, 'S1', 'xem', { ma, coCau: q1 })).doan.cau
    expect(giu).toMatchObject({ qid: q1, giuNguyen: true, an: false }); expect(typeof giu.nhan).toBe('string')
    await lamHiep(d, 'S1', ma) // S2 chưa chốt → hiệp chưa giải
    const lai = await goi(d, 'S1', 'xem', { ma })
    expect(lai.doan.tran.hiep).toBe(1); expect(lai.doan.cau).toMatchObject({ qid: q1, daChot: true, hanhDong: 'danh', ketQua: { correct: true, solution: `${BI_MAT}-${q1}` } })
    expect(lai.doan.cau.de).toMatchObject({ qid: q1, text: `Đề ${q1}` }); expect(JSON.stringify(lai.doan.cau.de)).not.toMatch(/"(correct|solution|reviewed)"/) // máy em mất đề sau khi tải lại → gửi lại BẢN CÔNG KHAI
    expect((await goi(d, 'S1', 'xem', { ma, coCau: q1 })).doan.cau.de).toBeUndefined()
  })
})

describe('Đoàn Hộ Tống · máy chủ · hai tài khoản cùng chặng', () => {
  async function haiBan() {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1'); await bangChung(d, 'S2', 'Y1')
    const ma = (await goi(d, 'S1', 'mo', { cheDo: 'phong' })).doan.ma as string
    await goi(d, 'S2', 'vao', { ma }); await goi(d, 'S1', 'bat-dau', { ma }); troi(DEM_NGUOC_MS)
    return { d, ma }
  }
  it('sảnh: chủ đoàn mới cho lên đường; vào hai lần không thêm ghế; lên đường rồi thì không vào được; không lộ SBD', async () => {
    const d = dungTruong([['S1', 'Nguyễn Thu Hà', '12A'], ['S2', 'Trần Văn Nam', '12A'], ['S3', 'Lê Lan', '12A']])
    for (const [s, q] of [['S1', 'X1'], ['S2', 'Y1'], ['S3', 'X2']] as const) await bangChung(d, s, q)
    const mo = await goi(d, 'S1', 'mo', { cheDo: 'phong' }), ma = mo.doan.ma as string
    expect(mo.doan).toMatchObject({ batDau: false, laChu: true }); expect(mo.doan.tran).toBeUndefined()
    const vao = await goi(d, 'S2', 'vao', { ma }); await goi(d, 'S2', 'vao', { ma })
    expect(vao.doan.ghe.map((g: any) => g.ten)).toEqual(['Thu Hà', 'Văn Nam']); expect(vao.doan.laChu).toBe(false); khongLo(vao, ['S1'])
    await expect(goi(d, 'S2', 'bat-dau', { ma })).rejects.toThrow('bạn mở đoàn'); await expect(goi(d, 'S3', 'xem', { ma })).rejects.toThrow('chưa ở trong đoàn')
    const di = await goi(d, 'S1', 'bat-dau', { ma })
    expect(di.doan.ghe).toHaveLength(2); expect(di.doan.ghe.every((g: any) => !g.laMay)).toBe(true); expect(di.doan.tran.linhTam.toiDa).toBe(80)
    await expect(goi(d, 'S3', 'vao', { ma })).rejects.toThrow('đã lên đường'); await expect(goi(d, 'S3', 'vao', { ma: 'DHKHONGCO' })).rejects.toThrow('Không tìm thấy')
    expect(dem(d, 'SELECT COUNT(*) n FROM doan_luot WHERE ma_chang=?', ma)).toBe(2)
  })
  it('đoàn tối đa bốn bạn; rời sảnh thì trả ghế, chủ đoàn rời thì bạn kế làm chủ', async () => {
    const hs: [string, string, string][] = ['S1', 'S2', 'S3', 'S4', 'S5'].map(s => [s, `Em ${s}`, '12A'])
    const d = dungTruong(hs); for (const [s] of hs) await bangChung(d, s, 'X1')
    const ma = (await goi(d, 'S1', 'mo', { cheDo: 'phong' })).doan.ma as string
    for (const s of ['S2', 'S3', 'S4']) await goi(d, s, 'vao', { ma })
    await expect(goi(d, 'S5', 'vao', { ma })).rejects.toThrow('đủ bốn bạn')
    expect((await goi(d, 'S1', 'roi', { ma })).daRoi).toBe(true)
    const sau = await goi(d, 'S2', 'xem', { ma }); expect(sau.doan.ghe).toHaveLength(3); expect(sau.doan.laChu).toBe(true)
    expect(dem(d, "SELECT COUNT(*) n FROM doan_luot WHERE ma_chang=? AND sbd='S1'", ma)).toBe(0)
    expect((await goi(d, 'S5', 'vao', { ma })).doan.ghe).toHaveLength(4)
  })
  it('mỗi em nhận câu KHÁC nhau từ hồ sơ của chính mình; không gói tin nào của em này chứa câu, đáp án hay SBD của em kia', async () => {
    const { d, ma } = await haiBan()
    const a = await goi(d, 'S1', 'xem', { ma }), b = await goi(d, 'S2', 'xem', { ma })
    // SỬA CÓ CHỦ Ý 21/09 (thầy lệnh ~19:35, Đoàn rút bằng luật Đảo Đợt 2, KHÔNG lặp câu em đã làm ở BẤT KỲ nguồn/ngày nào): câu em ĐÃ LÀM (X1, sai 3 ngày trước) không còn ra đầu tiên — câu MỚI cùng dạng ra trước.
    expect(a.doan.cau.qid).toMatch(/^X[2-9]$/); expect(b.doan.cau.qid).toMatch(/^Y[2-9]$/); expect(a.doan.cau.de.tenDang).toBe('Ester'); expect(b.doan.cau.de.tenDang).toBe('Ancol')
    khongLo(a, ['S2']); khongLo(b, ['S1']); expect(JSON.stringify(a)).not.toMatch(/"Y\d/); expect(JSON.stringify(b)).not.toMatch(/"X\d/)
    const moi = (s: string) => (d.sql.prepare('SELECT json FROM doan_chang WHERE ma=?').get(ma) as any).json as string
    const cau = JSON.parse(moi('')).nguoi.map((n: any) => n.cau.map((c: any) => c.qid))
    expect(cau[0].every((q: string) => q.startsWith('X'))).toBe(true); expect(cau[1].every((q: string) => q.startsWith('Y'))).toBe(true)
  })
  it('bạn chốt trước chỉ hiện "đã chốt" — không hiện đúng/sai, không hiện đòn; đủ hai bạn chốt mới giải hiệp; cấp 1 và cấp 100 cùng 24 sát thương', async () => {
    const { d, ma } = await haiBan()
    const s1 = await lamHiep(d, 'S1', ma, false) // S1 (cấp 1) cố ý SAI
    expect(s1.doan.tran.hiep).toBe(1); expect(s1.ketQuaCau.correct).toBe(false)
    const nhin = await goi(d, 'S2', 'xem', { ma })
    expect(nhin.doan.ghe.map((g: any) => g.trangThai)).toEqual(['da_chot', 'dang_lam']); khongLo(nhin, ['S1']); expect(nhin.doan.hiepVuaXong).toBeUndefined()
    expect(JSON.stringify(nhin)).not.toMatch(/"dung"|"hanhDong"/)
    const s2 = await lamHiep(d, 'S2', ma, true) // S2 (cấp 100) đúng
    expect(s2.doan.tran.hiep).toBe(2); expect(s2.doan.hiepVuaXong.cuaEm.satThuong).toBe(24)
    expect(s2.doan.hiepVuaXong.ban).toEqual([{ ghe: 0, ra: 'chan', tenChieu: '', satThuong: 0, haGuc: 0, lienKich: false }]) // bạn sai → tự chắn; trông y hệt bạn đúng-rồi-chắn
    expect(s2.doan.hiepVuaXong).toMatchObject({ quaiConLai: 1, tongChan: 8, linhTamMat: 0, linhTamSau: 80 })
    expect(Object.keys(s2.doan.hiepVuaXong)).not.toContain('ghe'); expect(JSON.stringify(s2.doan.hiepVuaXong.ban)).not.toMatch(/"dung"|"tuLam"|"heSo"|"hanhDong"/) // kết quả thô từng ghế không bao giờ xuống máy
    // hiệp 2: đổi vai — em cấp 1 đúng cũng gây đúng 24
    troi(NGHI_GIUA_HIEP_MS); await lamHiep(d, 'S2', ma, false); const r = await lamHiep(d, 'S1', ma, true)
    expect(r.doan.hiepVuaXong.cuaEm.satThuong).toBe(24)
  })
  it('chốt rồi không chốt lại; nộp cho hiệp cũ bị từ chối; Kỹ năng thiếu năng lượng bị từ chối TRƯỚC khi chấm (không tốn lượt làm)', async () => {
    const { d, ma } = await haiBan()
    await expect(goi(d, 'S1', 'nop', { ma, hiep: 1, answer: 'A', hanhDong: 'ky_nang' })).rejects.toThrow('2 năng lượng')
    await expect(goi(d, 'S1', 'nop', { ma, hiep: 1, answer: '', hanhDong: 'danh' })).rejects.toThrow('điền đủ đáp án')
    expect(dem(d, "SELECT COUNT(*) n FROM game_v2_attempt WHERE sbd='S1'")).toBe(0)
    await lamHiep(d, 'S1', ma); await expect(goi(d, 'S1', 'nop', { ma, hiep: 1, answer: 'A', hanhDong: 'danh' })).rejects.toThrow('đã chốt')
    await lamHiep(d, 'S2', ma); troi(NGHI_GIUA_HIEP_MS)
    await expect(goi(d, 'S1', 'nop', { ma, hiep: 1, answer: 'A', hanhDong: 'danh' })).rejects.toThrow('Hiệp vừa kết thúc')
  })
  it('bỏ trống: chỉ Chắn được, không chấm, không ghi lượt làm, không ghi sổ', async () => {
    const { d, ma } = await haiBan()
    await expect(goi(d, 'S1', 'nop', { ma, hiep: 1, boTrong: true, hanhDong: 'danh' })).rejects.toThrow('chỉ Chắn')
    const r = await goi(d, 'S1', 'nop', { ma, hiep: 1, boTrong: true, hanhDong: 'chan' })
    expect(r.ketQuaCau).toBeUndefined(); expect(r.doan.cau).toMatchObject({ daChot: true, boTrong: true, ketQua: null })
    expect(dem(d, "SELECT COUNT(*) n FROM game_v2_attempt WHERE sbd='S1'") + dem(d, "SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd='S1' AND nguon='game'")).toBe(0)
    const xong = await lamHiep(d, 'S2', ma); expect(xong.doan.hiepVuaXong).toMatchObject({ tongChan: 8, quaiConLai: 1, linhTamMat: 0 })
  })
  it('hết 40 giây (+ ân hạn mạng) thì hiệp tự giải với bài đã có; bài tới trong ân hạn vẫn được nhận', async () => {
    const { d, ma } = await haiBan()
    await lamHiep(d, 'S1', ma); troi(40_000 + AN_HAN_MS - 1)
    expect((await goi(d, 'S2', 'xem', { ma })).doan.tran).toMatchObject({ hiep: 1, conMs: 0 })
    const tre = await lamHiep(d, 'S2', ma); expect(tre.doan.tran.hiep).toBe(2); expect(tre.doan.hiepVuaXong.tongSatThuong).toBe(48)
    troi(NGHI_GIUA_HIEP_MS + 40_000 + AN_HAN_MS) // hiệp 2: không ai làm gì
    const sau = await goi(d, 'S1', 'xem', { ma }); expect(sau.doan.tran.hiep).toBe(3); expect(sau.doan.hiepVuaXong).toMatchObject({ hiep: 2, tongSatThuong: 0, linhTamMat: 8 })
    expect(sau.doan.hiepVuaXong.cuaEm).toMatchObject({ nop: false })
  })
  it('rời trận: máy đỡ thay, bạn ở lại đi tiếp một mình không phải chờ; cả đội rời thì đóng chặng', async () => {
    const { d, ma } = await haiBan()
    await lamHiep(d, 'S1', ma)
    expect((await goi(d, 'S2', 'roi', { ma })).daRoi).toBe(true)
    const sau = await goi(d, 'S1', 'xem', { ma }) // S2 rời → đủ bài → hiệp 1 giải ngay
    expect(sau.doan.tran.hiep).toBe(2); expect(sau.doan.ghe[1]).toMatchObject({ roi: true, trangThai: 'may' }); expect(sau.doan.tran.linhTam.toiDa).toBe(80)
    troi(NGHI_GIUA_HIEP_MS); expect((await lamHiep(d, 'S1', ma)).doan.tran.hiep).toBe(3)
    await expect(goi(d, 'S2', 'nop', { ma, hiep: 3, answer: 'A', hanhDong: 'danh' })).rejects.toThrow()
    await goi(d, 'S1', 'roi', { ma }); troi(NGHI_GIUA_HIEP_MS)
    expect((d.sql.prepare('SELECT trang_thai FROM doan_chang WHERE ma=?').get(ma) as any).trang_thai).not.toBe('sanh')
    expect(dem(d, 'SELECT COUNT(*) n FROM doan_luot WHERE ma_chang=? AND ket_luc IS NOT NULL', ma)).toBe(2)
  })
  it('tín hiệu chỉ là mẫu có sẵn; "cần tiếp sức" hiện cho bạn, chốt xong thì tắt', async () => {
    const { d, ma } = await haiBan()
    await expect(goi(d, 'S2', 'tin-hieu', { ma, tinHieu: 'đáp án là B nhé' })).rejects.toThrow('tín hiệu có sẵn')
    await goi(d, 'S2', 'tin-hieu', { ma, tinHieu: 'can_tiep_suc' })
    expect((await goi(d, 'S1', 'xem', { ma })).doan.ghe[1].trangThai).toBe('can_tiep_suc')
    await lamHiep(d, 'S2', ma); expect((await goi(d, 'S1', 'xem', { ma })).doan.ghe[1].trangThai).toBe('da_chot')
  })
})

describe('Đoàn Hộ Tống · máy chủ · trùm câu chung', () => {
  async function toiTrum(hs?: [string, string, string][]) {
    const d = dungTruong(hs); await bangChung(d, 'S1', 'X1'); await bangChung(d, 'S2', 'Y1')
    const ma = (await goi(d, 'S1', 'mo', { cheDo: 'phong' })).doan.ma as string
    await goi(d, 'S2', 'vao', { ma }); await goi(d, 'S1', 'bat-dau', { ma }); troi(DEM_NGUOC_MS)
    for (let h = 1; h <= 3; h++) { await lamHiep(d, 'S1', ma); await lamHiep(d, 'S2', ma); troi(NGHI_GIUA_HIEP_MS) }
    return { d, ma }
  }
  it('RÒ ĐÁP ÁN (Code 1 rà chéo W2c): câu CHUNG của trùm KHÔNG nằm trong bài tập về nhà CHƯA nộp của BẤT KỲ bạn nào trong đội — mọi câu trùm hợp lệ đang nằm trong bài chưa nộp của S2 ⇒ trùm không có câu chung (giáp vỡ theo phong độ)', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1'); await bangChung(d, 'S2', 'Y1')
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BTX','CA1','DE1',3,'2026-09-20T00:00:00.000Z','2099-01-01T00:00:00.000Z',0,'x',1)").run()
    d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES('BTX|S2','BTX','S2','x')").run()
    for (const [i, qid] of ['TX1', 'TX2', 'TY1'].entries()) d.sql.prepare("INSERT INTO btvn_em_cau(khoa,ma_btvn,sbd,qid,chang,nhan,thu_tu) VALUES(?,?,?,?,0,'loi',?)").run(`BTX|S2|${qid}`, 'BTX', 'S2', qid, i + 1)
    const ma = (await goi(d, 'S1', 'mo', { cheDo: 'phong' })).doan.ma as string
    await goi(d, 'S2', 'vao', { ma }); await goi(d, 'S1', 'bat-dau', { ma }); troi(DEM_NGUOC_MS)
    for (let h = 1; h <= 3; h++) { await lamHiep(d, 'S1', ma); await lamHiep(d, 'S2', ma); troi(NGHI_GIUA_HIEP_MS) }
    const a = await goi(d, 'S1', 'xem', { ma })
    // Không có câu chung hợp lệ ⇒ hiệp trùm bị bỏ qua (giáp vỡ theo phong độ 3 hiệp vừa rồi): đã sang hiệp 5, không có câu trùm nào được phát.
    expect(a.doan.tran).toMatchObject({ hiep: 5, laTrum: false, trumVoGiap: [true] })
    expect(a.doan.trum?.qid).toBeUndefined()
  })
  it('một câu Phần II chung, 60 giây; mỗi bạn giữ 2 ý; chỉ người giữ mới chốt được; ý của bạn chỉ hiện đã chốt / chưa', async () => {
    const { d, ma } = await toiTrum()
    const a = await goi(d, 'S1', 'xem', { ma }), b = await goi(d, 'S2', 'xem', { ma })
    expect(a.doan.tran).toMatchObject({ hiep: 4, laTrum: true, giay: 60, conMs: 60_000 }); expect(a.doan.trum.qid).toBe(b.doan.trum.qid); expect(a.doan.trum.qid).toMatch(/^T/)
    expect([...a.doan.trum.yCuaEm, ...b.doan.trum.yCuaEm].sort()).toEqual([0, 1, 2, 3]); expect(a.doan.trum.yCuaEm).toHaveLength(2); khongLo(a, ['S2']); khongLo(b, ['S1'])
    const yBan = b.doan.trum.yCuaEm[0] as number
    await expect(goi(d, 'S1', 'nop-y', { ma, hiep: 4, y: yBan, answer: 'D' })).rejects.toThrow('bạn khác giữ')
    await expect(goi(d, 'S1', 'nop-y', { ma, hiep: 4, y: a.doan.trum.yCuaEm[0], answer: 'B' })).rejects.toThrow('Đúng hoặc Sai')
    await expect(goi(d, 'S1', 'nop', { ma, hiep: 4, answer: 'A', hanhDong: 'danh' })).rejects.toThrow('Hiệp trùm')
    await expect(goi(d, 'S1', 'loi-giai-trum', { ma, hiep: 4 })).rejects.toThrow('chưa kết thúc') // lời giải câu chung KHÔNG mở khi còn bạn chưa chốt
    const sau = await chotYTrum(d, 'S1', ma, false) // S1 chốt SAI cả hai ý
    expect(sau.doan.tran.hiep).toBe(4); khongLo(sau, ['S2'])
    const nhin = await goi(d, 'S2', 'xem', { ma })
    expect(nhin.doan.trum.yDaChot.filter(Boolean)).toHaveLength(2); expect(nhin.doan.ghe[0].trangThai).toBe('da_chot'); expect(JSON.stringify(nhin.doan.trum)).not.toMatch(/"dung"|nopY/)
    await expect(goi(d, 'S1', 'nop-y', { ma, hiep: 4, y: a.doan.trum.yCuaEm[0], answer: 'D' })).rejects.toThrow('đã chốt')
    const xong = await chotYTrum(d, 'S2', ma, true) // đủ 4 ý → giải: 2/4 → không vỡ giáp, trùm đánh 16
    expect(xong.doan.tran.hiep).toBe(5); expect(xong.doan.hiepVuaXong.trum).toMatchObject({ yDung: 2, voGiap: false, giapConLai: 2 }); expect(xong.doan.hiepVuaXong.linhTamMat).toBe(16)
    expect(xong.doan.hiepVuaXong.cuaEm.yDung).toHaveLength(2); expect(JSON.stringify(xong.doan.hiepVuaXong.ban)).not.toMatch(/yDung|yGiu/)
    const lg = await goi(d, 'S1', 'loi-giai-trum', { ma, hiep: 4 }); expect(lg.loiGiaiTrum).toMatchObject({ hiep: 4, answer: dapAn.get(a.doan.trum.qid), solution: `${BI_MAT}-${a.doan.trum.qid}` })
    expect(dem(d, "SELECT COUNT(*) n FROM game_v2_attempt WHERE qid LIKE 'T%'") + dem(d, "SELECT COUNT(*) n FROM su_kien_hoc WHERE qid LIKE 'T%'")).toBe(0) // câu chung không tạo bằng chứng cá nhân
  })
  it('ý chia theo bậc ở dạng của câu chung: ý đầu cho bạn bậc thấp hơn', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1'); await bangChung(d, 'S2', 'Y1')
    d.sql.prepare("UPDATE nam_kt_dang SET bac=2 WHERE sbd='S1'").run()
    const ma = (await goi(d, 'S1', 'mo', { cheDo: 'phong' })).doan.ma as string
    await goi(d, 'S2', 'vao', { ma }); await goi(d, 'S1', 'bat-dau', { ma })
    const phong = JSON.parse((d.sql.prepare('SELECT json FROM doan_chang WHERE ma=?').get(ma) as any).json)
    const dangTrum4 = phong.trum[4].dang as string
    // S1 chỉ có hồ sơ ở dạng Ester (bậc 2), S2 chỉ ở Ancol (bậc 0): câu chung dạng Ester → S2 (bậc 0 ở Ester) nhận ý a, b
    expect(phong.giaoY[4]).toEqual(dangTrum4 === 'ES.A.X' ? [1, 1, 0, 0] : [0, 0, 1, 1])
  })
  it('câu đang dùng cho ca thi chưa công bố, câu thầy chặn riêng một bạn KHÔNG BAO GIỜ thành câu chung; hết câu hợp lệ → giáp vỡ theo phong độ, hiệp trùm tự giải', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1'); await bangChung(d, 'S2', 'Y1')
    d.objects.set('de/CA.json', { phanI: [], phanII: [{ id: 'TX1', text: 'Đề TX1', ideas: ['ý a', 'ý b', 'ý c', 'ý d'], correct: ['D', 'S', 'D', 'S'] }], phanIII: [] })
    d.sql.prepare("INSERT INTO ca(ma_ca,trang_thai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CA','mo','khong','de/CA.json','x')").run()
    d.sql.prepare("INSERT INTO game_v2_scope(sbd,json,updated_at) VALUES('S2',?,'x')").run(JSON.stringify({ enabled: true, types: [], blocked: ['TX2', 'TY1'] }))
    const ma = (await goi(d, 'S1', 'mo', { cheDo: 'phong' })).doan.ma as string
    await goi(d, 'S2', 'vao', { ma }); await goi(d, 'S1', 'bat-dau', { ma }); troi(DEM_NGUOC_MS)
    // TX1 đang bảo vệ, TX2 + TY1 thầy chặn riêng S2, TX-LA đòi kiến thức nền chưa ai có → không còn câu chung hợp lệ
    expect(JSON.parse((d.sql.prepare('SELECT json FROM doan_chang WHERE ma=?').get(ma) as any).json).trum).toEqual({ 4: null, 8: null })
    for (let h = 1; h <= 3; h++) { await lamHiep(d, 'S1', ma); await lamHiep(d, 'S2', ma, h === 1); troi(NGHI_GIUA_HIEP_MS) }
    // Phong độ: S1 tự làm đúng 3/3 → 2 ý của S1 đúng; S2 đúng 1/3 → 2 ý của S2 sai → 2/4, không vỡ giáp. Không ai phải bấm gì.
    const sau = await goi(d, 'S1', 'xem', { ma })
    expect(sau.doan.tran.hiep).toBe(5); expect(sau.doan.hiepVuaXong).toMatchObject({ hiep: 4, laTrum: true, trum: { yDung: 2, voGiap: false } })
  })
})

describe('Đoàn Hộ Tống · máy chủ · Tiếp sức', () => {
  async function haiBan(bat = true) {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1'); await bangChung(d, 'S2', 'Y1')
    if (bat) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: new Date(T0 - 86_400_000).toISOString(), dsSbd: [], toanBo: true }))
    const ma = (await goi(d, 'S1', 'mo', { cheDo: 'phong' })).doan.ma as string
    await goi(d, 'S2', 'vao', { ma }); await goi(d, 'S1', 'bat-dau', { ma }); troi(DEM_NGUOC_MS)
    return { d, ma }
  }
  it('trọn luồng: bạn bật "cần tiếp sức" → em (đã chốt) chọn THẺ → bạn nhận nội dung thẻ, làm lại đúng → Liên Kích ×2 cho cả hai; câu được giúp KHÔNG thành bằng chứng', async () => {
    const { d, ma } = await haiBan()
    await goi(d, 'S2', 'tin-hieu', { ma, tinHieu: 'can_tiep_suc' })
    const yq = (await goi(d, 'S2', 'xem', { ma })).doan.cau.qid as string // SỬA CÓ CHỦ Ý 21/09 (Đoàn rút bằng luật Đảo Đợt 2, không lặp câu đã làm): câu hiệp 1 của S2 là câu MỚI cùng dạng Ancol (không còn cố định Y1)
    expect(yq).toMatch(/^Y[2-9]$/)
    // S1 chưa chốt thì chưa giúp được
    await expect(goi(d, 'S1', 'the-goi-y', { ma, den: 1 })).rejects.toThrow('chốt câu của mình trước')
    const s1 = await lamHiep(d, 'S1', ma)
    expect(s1.doan.tiepSuc).toMatchObject({ banCan: [1], daGiup: false }); expect(s1.doan.tran.hiep).toBe(1)
    const xemThe = await goi(d, 'S1', 'the-goi-y', { ma, den: 1 }) as any
    expect(xemThe.goiY).toMatchObject({ den: 1, ten: 'Văn Nam', tenDang: 'Ancol', de: `Đề ${yq}` }); expect(xemThe.goiY.the.map((t: any) => t.loai)).toEqual(['nhac_cong_thuc', 'loai_phuong_an'])
    // Người tiếp sức KHÔNG thấy: phương án của bạn, đáp án, nội dung thẻ, SBD bạn
    khongLo(xemThe.goiY, ['S2']); expect(JSON.stringify(xemThe)).not.toContain(`${BI_MAT}-${yq}`); expect(JSON.stringify(xemThe.goiY)).not.toMatch(/noiDung|choices|Kiến thức gốc|Phương án [ABCD] không/)
    await expect(goi(d, 'S1', 'tiep-suc', { ma, hiep: 1, den: 1, the: 'buoc_dau' })).rejects.toThrow('không dùng được')
    const gui = await goi(d, 'S1', 'tiep-suc', { ma, hiep: 1, den: 1, the: 'loai_phuong_an' }) as any
    expect(gui.expTiepSuc).toEqual({ bat: true, exp: 5, conLai: 4 }); expect(gui.doan.tiepSuc).toMatchObject({ banCan: [], daGiup: true, lienKichSanSang: true }); expect(JSON.stringify(gui)).not.toContain(`${BI_MAT}-${yq}`); expect(JSON.stringify(gui)).not.toContain('"S2"')
    expect(JSON.stringify(gui)).not.toContain('không đúng — em gạch') // nội dung thẻ không về máy người giúp
    const b = await goi(d, 'S2', 'xem', { ma })
    expect(b.doan.tiepSuc).toMatchObject({ conLuotNhan: 1, daXin: false, lienKichSanSang: true, theNhan: { tuTen: 'Thu Hà', tuLaMay: false, loai: 'loai_phuong_an', tieuDe: 'Loại 1 phương án' } })
    const gach = (b.doan.tiepSuc.theNhan.noiDung as string).match(/^Phương án ([ABCD]) không đúng/)![1]; expect(gach).not.toBe(dapAn.get(yq)); khongLo(b, ['S1'])
    const xong = await lamHiep(d, 'S2', ma, true)
    expect(xong.doan.hiepVuaXong).toMatchObject({ hiep: 1, tongSatThuong: 96 }); expect(xong.doan.hiepVuaXong.cuaEm).toMatchObject({ satThuong: 48, lienKich: true, tuLam: false, duocGiupBoi: 0 })
    expect((await goi(d, 'S1', 'xem', { ma })).doan.hiepVuaXong.cuaEm).toMatchObject({ satThuong: 48, lienKich: true, giup: 1, giupThanhCong: true })
    // LUẬT CŨ GIỮ NGUYÊN: có trợ giúp = không ghi bằng chứng, không thưởng mastery
    const lan = JSON.parse((d.sql.prepare("SELECT json FROM game_v2_attempt WHERE sbd='S2'").get() as any).json)
    expect(lan.attempt).toMatchObject({ qid: yq, correct: true, assisted: true }); expect(lan.reward).toBe(0)
    expect(dem(d, "SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd='S2' AND nguon='game'")).toBe(0); expect(dem(d, "SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd='S1' AND nguon='game'")).toBe(1)
    expect(d.sql.prepare('SELECT hiep,den_sbd,tu_sbd,the,thanh_cong FROM doan_tiep_suc WHERE ma_chang=?').all(ma)).toEqual([{ hiep: 1, den_sbd: 'S2', tu_sbd: 'S1', the: 'loai_phuong_an', thanh_cong: 1 }])
    expect(d.sql.prepare("SELECT loai,exp,ma_nguon FROM exp_so WHERE sbd='S1' AND loai='tiepsuc'").all()).toEqual([{ loai: 'tiepsuc', exp: 5, ma_nguon: `${ma}|1|1` }])
    expect(dem(d, "SELECT COUNT(*) n FROM exp_so WHERE sbd='S2'")).toBe(0) // người ĐƯỢC giúp không có EXP tiếp sức
  })
  it('bạn làm lại vẫn SAI → không Liên Kích, sổ tiếp sức ghi thanh_cong=0; mỗi hiệp em giúp MỘT bạn; thẻ chỉ tới khi bạn đã bật tín hiệu', async () => {
    const { d, ma } = await haiBan(false)
    await lamHiep(d, 'S1', ma)
    await expect(goi(d, 'S1', 'tiep-suc', { ma, hiep: 1, den: 1, the: 'loai_phuong_an' })).rejects.toThrow('chưa bật tín hiệu')
    await goi(d, 'S2', 'tin-hieu', { ma, tinHieu: 'can_tiep_suc' })
    const gui = await goi(d, 'S1', 'tiep-suc', { ma, hiep: 1, den: 1, the: 'nhac_cong_thuc' }) as any
    expect(gui.expTiepSuc).toEqual({ bat: false, exp: 0, conLai: 0 }) // cờ EXP mới chưa bật cho em: game không tự cộng gì
    await expect(goi(d, 'S1', 'tiep-suc', { ma, hiep: 1, den: 1, the: 'loai_phuong_an' })).rejects.toThrow()
    expect((await goi(d, 'S2', 'xem', { ma })).doan.tiepSuc.theNhan.noiDung).toBe('Kiến thức gốc của câu này: K1.')
    const xong = await lamHiep(d, 'S2', ma, false)
    expect(xong.doan.hiepVuaXong.cuaEm).toMatchObject({ lienKich: false, satThuong: 0, chan: 8, tuLam: false }); expect(xong.doan.hiepVuaXong.tongSatThuong).toBe(24)
    expect((d.sql.prepare('SELECT thanh_cong FROM doan_tiep_suc WHERE ma_chang=?').get(ma) as any).thanh_cong).toBe(0)
    expect(dem(d, "SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd='S2' AND nguon='game'")).toBe(0) // sai mà có trợ giúp cũng không ghi sổ
  })
  it(`mỗi chặng chỉ NHẬN ${2} lần: lần thứ ba bị từ chối bằng lời, khung nhìn báo còn mấy lần; đã chốt / hiệp trùm thì không xin được`, async () => {
    const { d, ma } = await haiBan(false)
    for (let h = 1; h <= 2; h++) {
      expect((await goi(d, 'S2', 'xem', { ma })).doan.tiepSuc.conLuotNhan).toBe(3 - h)
      await lamHiep(d, 'S1', ma); await goi(d, 'S2', 'tin-hieu', { ma, tinHieu: 'can_tiep_suc' }); await goi(d, 'S1', 'tiep-suc', { ma, hiep: h, den: 1, the: 'loai_phuong_an' }); await lamHiep(d, 'S2', ma); troi(NGHI_GIUA_HIEP_MS)
    }
    expect((await goi(d, 'S2', 'xem', { ma })).doan.tiepSuc.conLuotNhan).toBe(0)
    await expect(goi(d, 'S2', 'tin-hieu', { ma, tinHieu: 'can_tiep_suc' })).rejects.toThrow('dùng hết 2 lần')
    await lamHiep(d, 'S2', ma); await expect(goi(d, 'S2', 'tin-hieu', { ma, tinHieu: 'can_tiep_suc' })).rejects.toThrow('đã chốt')
    await lamHiep(d, 'S1', ma); troi(NGHI_GIUA_HIEP_MS)
    await expect(goi(d, 'S1', 'tin-hieu', { ma, tinHieu: 'can_tiep_suc' })).rejects.toThrow('Hiệp trùm')
  })
  it('đi MỘT MÌNH: bật "cần tiếp sức" là bạn máy gửi thẻ ngay (tất định); làm lại đúng → Liên Kích; bạn máy không có EXP, không có dòng sổ lượt', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1')
    const ma = (await goi(d, 'S1', 'mo')).doan.ma as string; troi(DEM_NGUOC_MS)
    const xin = await goi(d, 'S1', 'tin-hieu', { ma, tinHieu: 'can_tiep_suc' })
    expect(xin.doan.tiepSuc).toMatchObject({ daXin: false, conLuotNhan: 1, lienKichSanSang: true, theNhan: { tuTen: 'Bạn máy', tuLaMay: true } }); khongLo(xin)
    const xong = await lamHiep(d, 'S1', ma, true)
    expect(xong.doan.hiepVuaXong.cuaEm).toMatchObject({ satThuong: 48, lienKich: true, tuLam: false })
    expect(JSON.parse((d.sql.prepare("SELECT json FROM game_v2_attempt WHERE sbd='S1'").get() as any).json).attempt.assisted).toBe(true)
    expect(d.sql.prepare('SELECT tu_sbd,thanh_cong FROM doan_tiep_suc WHERE ma_chang=?').all(ma)).toEqual([{ tu_sbd: 'may', thanh_cong: 1 }]); expect(dem(d, 'SELECT COUNT(*) n FROM exp_so')).toBe(0)
  })
  it('câu không có thẻ nào gửi được (Phần I hỏng đáp án / không kiến thức, không lời giải nhiều bước ở Phần II, III) → từ chối ngay từ lúc xin, không treo tín hiệu', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1')
    // SỬA CÓ CHỦ Ý 21/09 (Đoàn rút bằng luật Đảo Đợt 2, không lặp câu đã làm): X1 (đã làm) không còn ra đầu ⇒ biến MỌI câu dạng X thành Phần III không lời giải (câu nào ra trước cũng đúng kịch bản)
    d.sql.prepare("UPDATE game_v2_question SET json=json_set(json,'$.kienThuc',json('[\"K1\"]'),'$.phan','III','$.correct','12,5','$.choices',json('[]')) WHERE qid LIKE 'X%'").run()
    d.sql.prepare("UPDATE game_v2_question SET json=json_remove(json_set(json,'$.solution',json('null')),'$.x') WHERE qid LIKE 'X%'").run()
    const ma = (await goi(d, 'S1', 'mo')).doan.ma as string; troi(DEM_NGUOC_MS)
    const xem = await goi(d, 'S1', 'xem', { ma })
    expect(xem.doan.cau.qid).toMatch(/^X/) // câu ra là Phần III, không lời giải, nhưng có kiến thức K1 → vẫn có đúng MỘT thẻ "Nhắc công thức"
    expect((await goi(d, 'S1', 'tin-hieu', { ma, tinHieu: 'can_tiep_suc' })).doan.tiepSuc.theNhan.loai).toBe('nhac_cong_thuc')
    d.sql.prepare("UPDATE game_v2_question SET json=json_set(json,'$.kienThuc',json('[]'),'$.phan','III','$.correct','7','$.choices',json('[]'),'$.solution',json('null'))").run()
    troi(40_000 + AN_HAN_MS); await goi(d, 'S1', 'xem', { ma }); troi(NGHI_GIUA_HIEP_MS); await goi(d, 'S1', 'xem', { ma })
    await expect(goi(d, 'S1', 'tin-hieu', { ma, tinHieu: 'can_tiep_suc' })).rejects.toThrow('chưa có thẻ gợi ý')
    expect((await goi(d, 'S1', 'xem', { ma })).doan.tiepSuc).toMatchObject({ daXin: false, theNhan: null })
  })
})

describe('Đoàn Hộ Tống · máy chủ · luật cũ vẫn khoá', () => {
  it('phiên câu của Đoàn KHÔNG chấm được qua lệnh answer thường (cờ trợ giúp do máy chủ quyết) và không hiện ở resume', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1')
    const ma = (await goi(d, 'S1', 'mo')).doan.ma as string
    const phien = JSON.parse((d.sql.prepare('SELECT json FROM doan_chang WHERE ma=?').get(ma) as any).json).nguoi[0].phien as string
    const token = await gameToken(d.env, 'S1')
    await expect(gameV2(d.env, 'answer', { token, session: phien, qid: 'X1', answer: dapAn.get('X1'), assisted: false })).rejects.toThrow('Đoàn Hộ Tống')
    expect(dem(d, "SELECT COUNT(*) n FROM game_v2_attempt WHERE sbd='S1'")).toBe(0)
    expect(await gameV2(d.env, 'resume', { token })).toMatchObject({ ok: true, questions: [] })
    // Lượt luyện thường vẫn chạy như cũ
    const thuong = await gameV2(d.env, 'start', { token, mode: 'adventure' }) as any
    expect((await gameV2(d.env, 'resume', { token }) as any).id).toBe(thuong.id)
    const q = thuong.questions[0].qid as string
    expect(await gameV2(d.env, 'answer', { token, session: thuong.id, qid: q, answer: dapAn.get(q) })).toMatchObject({ ok: true, correct: true })
  })
  it('trần ĐOÀN 60 câu/ngày (tính RIÊNG, sửa CÓ CHỦ Ý 21/09: 200 ⇒ 60 gộp ⇒ Đoàn 60 riêng): đã đủ 60 lượt của Đoàn thì không lên đường được; em chưa có bằng chứng học thì được báo bằng lời, không mở chặng rỗng', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1')
    await expect(goi(d, 'S2', 'mo')).rejects.toThrow('Chưa có câu')
    expect(dem(d, 'SELECT COUNT(*) n FROM doan_chang')).toBe(0)
    // SỬA CÓ CHỦ Ý 21/09 (thầy lệnh 19:30 "trần hộ tống đoàn là 60 câu, tính riêng hẳn"): 60 lượt phải thuộc PHIÊN CỦA ĐOÀN (json $.doan = 1) mới chạm trần Đoàn
    d.sql.prepare("INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES('sd','S1',?,'x')").run(JSON.stringify({ doan: 1, mode: 'adventure', questions: [], created: 1 }))
    const ins = d.sql.prepare("INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,'S1','sd',?,?,?,?)")
    for (let i = 0; i < 60; i++) ins.run(`a${i}`, `cu${i}`, `g-cu${i}`, JSON.stringify({ attempt: { id: `a${i}`, session: 'sd', qid: `cu${i}`, group: `g-cu${i}`, dang: 'ES.A.X', mucDo: 'biet', correct: true, assisted: false, at: T0 - 60_000, novel: true } }), new Date(T0 - 60_000).toISOString())
    await expect(goi(d, 'S1', 'mo')).rejects.toThrow('60 câu')
  })
  it('chưa chọn thần thú thì chưa lên đường; thầy tạm dừng game của em thì Đoàn cũng dừng', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1')
    d.sql.prepare("UPDATE game_v2_profile SET json=json_set(json,'$.choice',json('true')) WHERE sbd='S1'").run()
    await expect(goi(d, 'S1', 'mo')).rejects.toThrow('chọn thần thú')
    d.sql.prepare("UPDATE game_v2_profile SET json=json_set(json,'$.choice',json('false')) WHERE sbd='S1'").run()
    d.sql.prepare("INSERT INTO game_v2_scope(sbd,json,updated_at) VALUES('S1',?,'x')").run(JSON.stringify({ enabled: false, types: [], blocked: [] }))
    await expect(goi(d, 'S1', 'mo')).rejects.toThrow('tạm dừng')
  })
  it('chưa chạy migration của Đoàn: báo bằng lời tiếng Việt, phần còn lại của game không hề hấn', async () => {
    const d = dungTruong(); await bangChung(d, 'S1', 'X1')
    for (const t of ['doan_tiep_suc', 'doan_luot', 'doan_chang']) d.sql.exec(`DROP TABLE ${t}`)
    await expect(goi(d, 'S1', 'mo')).rejects.toThrow('chưa mở trên máy chủ'); await expect(goi(d, 'S1', 'xem', { ma: 'DH1' })).rejects.toThrow('chưa mở trên máy chủ')
    expect(await gameV2(d.env, 'start', { token: await gameToken(d.env, 'S1'), mode: 'adventure' })).toMatchObject({ ok: true })
  })
  it('CỜ MỞ GAME: không có dòng cấu hình = TẮT với mọi em — mọi lệnh doan-* từ chối tử tế, không ghi gì, profile báo doanMo:false, game cũ chạy như cũ', async () => {
    const d = dungTruong(undefined, null); await bangChung(d, 'S1', 'X1')
    for (const lenh of ['mo', 'xem', 'vao', 'nop', 'nop-y', 'bat-dau', 'tin-hieu', 'roi', 'loi-giai-trum']) await expect(goi(d, 'S1', lenh, { ma: 'DH1' })).rejects.toThrow('sắp ra mắt')
    expect(dem(d, 'SELECT (SELECT COUNT(*) FROM doan_chang)+(SELECT COUNT(*) FROM doan_luot)+(SELECT COUNT(*) FROM game_v2_session) n')).toBe(0)
    const token = await gameToken(d.env, 'S1')
    expect(await gameV2(d.env, 'profile', { token })).toMatchObject({ ok: true, doanMo: false })
    expect(await gameV2(d.env, 'start', { token, mode: 'adventure' })).toMatchObject({ ok: true })
  })
  it('CỜ MỞ GAME: bật theo danh sách thì chỉ em trong danh sách chơi được; toanBo mở cho mọi em; JSON hỏng = TẮT', async () => {
    const d = dungTruong(undefined, { dsSbd: ['S1'], toanBo: false }); await bangChung(d, 'S1', 'X1'); await bangChung(d, 'S2', 'Y1')
    expect(await gameV2(d.env, 'profile', { token: await gameToken(d.env, 'S1') })).toMatchObject({ doanMo: true })
    expect(await gameV2(d.env, 'profile', { token: await gameToken(d.env, 'S2') })).toMatchObject({ doanMo: false })
    const ma = (await goi(d, 'S1', 'mo', { cheDo: 'phong' })).doan.ma as string
    await expect(goi(d, 'S2', 'vao', { ma })).rejects.toThrow('sắp ra mắt')
    d.sql.prepare("UPDATE cau_hinh SET gia_tri=? WHERE khoa='doan_ho_tong'").run(JSON.stringify({ dsSbd: [], toanBo: true }))
    expect((await goi(d, 'S2', 'vao', { ma })).doan.ghe).toHaveLength(2)
    d.sql.prepare("UPDATE cau_hinh SET gia_tri='{hỏng' WHERE khoa='doan_ho_tong'").run()
    await expect(goi(d, 'S1', 'xem', { ma })).rejects.toThrow('sắp ra mắt')
  })
  it('hàm nhỏ: hiệp → câu cá nhân thứ mấy; tên gọi không bao giờ là SBD', () => {
    expect([1, 2, 3, 5, 6, 7].map(chiSoCau)).toEqual([0, 1, 2, 3, 4, 5])
    expect([tenGoi('Nguyễn Thu Hà', 'x'), tenGoi('Lan', 'x'), tenGoi('  ', 'Viêm Sư')]).toEqual(['Thu Hà', 'Lan', 'Viêm Sư'])
  })
})
