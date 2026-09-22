// @vitest-environment node
// SESSIONS API cho lệnh /ph/* đọc nặng (Boss 22/09, lượt 2, theo yêu cầu riêng sau khi soát 92805d5):
// `sbdCuaPhuHuynh` + phTatCaVeCon/phChiTietCauVeCon/phKeHoach nhận `envDoc` (bản sao D1) cho MỌI lượt đọc, còn `ghiTruyCap`
// (đếm truy cập, việc GHI duy nhất của các lệnh này) tách qua `viecPhu` và LUÔN ghi vào `env` gốc (primary) — không bao giờ
// vào bản sao, không ghi trùng dù có `ctx` (hoãn) hay không (đồng bộ). Dựng HAI D1 giả ĐỘC LẬP (không chung sqlite) để
// phân biệt được: dữ liệu trả về phải đến từ bản sao (envDoc), dòng đếm truy cập phải chỉ nằm ở primary.
import { describe, it, expect } from 'vitest'
import { phTatCaVeCon } from '../server/src/ph-tat-ca-ve-con'
import { phKeHoach } from '../server/src/ph-truy-cap'
import { parentPass } from '../server/src/game-v2-auth'
import { taoD1That, type D1That } from './_d1-that'

const themEm = (d: D1That, sbd: string, hoTen: string, lop = '12A') =>
  d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES(?,?,?,?)').run(sbd, hoTen, lop, 'x')
const truyCap = (d: D1That) => d.sql.prepare('SELECT sbd,kieu,duong,so FROM ph_truy_cap ORDER BY sbd,kieu,duong').all() as { sbd: string; kieu: string; duong: string; so: number }[]
/** `ctx` giả gom mọi `waitUntil` — cùng ý tưởng với `goiWorker` của `_d1-that.ts` nhưng KHÔNG tự đợi, để test tự chọn lúc đợi. */
function ctxGomLai() {
  const choDoi: Promise<unknown>[] = []
  return { ctx: { waitUntil: (p: Promise<unknown>) => { choDoi.push(p) } }, doiHet: () => Promise.all(choDoi) }
}

describe('Sessions API /ph/*: đọc trên bản sao, ghi đếm truy cập trên primary', () => {
  it('phTatCaVeCon: dữ liệu trả về lấy từ envDoc (bản sao), KHÔNG phải env gốc', async () => {
    const goc = taoD1That(), sao = taoD1That()
    themEm(goc, 'S1', 'Tên Ở Primary'); themEm(sao, 'S1', 'Tên Ở Bản Sao')
    const r = (await phTatCaVeCon(goc.env, { sbd: 'S1' }, Date.now(), sao.env)) as Record<string, unknown>
    expect(r.hoTen).toBe('Tên Ở Bản Sao') // đọc đi qua envDoc, không phải env gốc
  })

  it('phTatCaVeCon không ctx: ghiTruyCap ghi ĐỒNG BỘ vào env gốc, envDoc không có dòng nào, không ghi trùng khi gọi hai lần', async () => {
    const goc = taoD1That(), sao = taoD1That()
    themEm(goc, 'S1', 'A'); themEm(sao, 'S1', 'A')
    await phTatCaVeCon(goc.env, { sbd: 'S1' }, Date.now(), sao.env)
    expect(truyCap(goc)).toEqual([{ sbd: 'S1', kieu: 'sbd_tran', duong: 'ph-tat-ca-ve-con', so: 1 }])
    expect(truyCap(sao)).toEqual([]) // KHÔNG lọt vào bản sao
    await phTatCaVeCon(goc.env, { sbd: 'S1' }, Date.now(), sao.env)
    expect(truyCap(goc)).toEqual([{ sbd: 'S1', kieu: 'sbd_tran', duong: 'ph-tat-ca-ve-con', so: 2 }]) // cộng dồn, không tạo dòng mới
    expect(truyCap(sao)).toEqual([])
  })

  it('phTatCaVeCon có ctx (hoãn qua waitUntil): việc đếm vẫn chỉ ghi env gốc đúng MỘT dòng sau khi đợi xong', async () => {
    const goc = taoD1That(), sao = taoD1That()
    themEm(goc, 'S1', 'A'); themEm(sao, 'S1', 'A')
    // D1 giả (node:sqlite trong bộ nhớ) chạy MỌI việc gần như đồng bộ nên không đo được "chưa ghi ngay khi hàm vừa trả lời"
    // (khác D1 thật qua mạng) — test này chỉ xác nhận: có ctx thì việc vẫn đăng ký qua waitUntil (không await tại chỗ ở
    // sbdCuaPhuHuynh) và sau khi đợi hết mọi việc đã đăng ký, trạng thái CUỐI vẫn đúng MỘT dòng, đúng primary.
    const { ctx, doiHet } = ctxGomLai()
    await phTatCaVeCon(goc.env, { sbd: 'S1' }, Date.now(), sao.env, ctx)
    await doiHet()
    expect(truyCap(goc)).toEqual([{ sbd: 'S1', kieu: 'sbd_tran', duong: 'ph-tat-ca-ve-con', so: 1 }])
    expect(truyCap(sao)).toEqual([])
  })

  it('phKeHoach: xác thực + tra tên/lớp đọc trên envDoc, nhưng lapVaLuuKeHoach (đọc-rồi-ghi) vẫn chạy trên env gốc', async () => {
    const goc = taoD1That(), sao = taoD1That()
    themEm(goc, 'S1', 'Tên Primary'); themEm(sao, 'S1', 'Tên Bản Sao')
    const pass = await parentPass(goc.env, 'S1') // MA_BI_MAT giống nhau giữa hai D1 giả ⇒ token goc verify được ở bản sao
    const r = (await phKeHoach(goc.env, { pass }, sao.env)) as Record<string, unknown>
    expect(r.ok).toBe(true)
    expect(r.hoTen).toBe('Tên Bản Sao') // tra tên/lớp đi qua envDoc
    expect(truyCap(goc).length).toBe(1) // đếm truy cập vẫn vào primary
    expect(truyCap(sao)).toEqual([])
    // Kế hoạch ngày là ĐỌC-RỒI-GHI thật (lapVaLuuKeHoach) — PHẢI nằm ở primary, không phải bản sao (tránh đọc lệch bản khi ghi).
    expect(goc.dem('ke_hoach_ngay', `sbd='S1'`)).toBeGreaterThan(0)
    expect(sao.dem('ke_hoach_ngay', `sbd='S1'`)).toBe(0)
  })

  it('KHÔNG truyền envDoc (đường cũ, mặc định = env): hành vi y hệt trước lượt 2 — đọc và ghi đều trên cùng một D1', async () => {
    const d = taoD1That()
    themEm(d, 'S1', 'Duy Nhất')
    const r = (await phTatCaVeCon(d.env, { sbd: 'S1' })) as Record<string, unknown>
    expect(r.hoTen).toBe('Duy Nhất')
    expect(truyCap(d)).toEqual([{ sbd: 'S1', kieu: 'sbd_tran', duong: 'ph-tat-ca-ve-con', so: 1 }])
  })
})
