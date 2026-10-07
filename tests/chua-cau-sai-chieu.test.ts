// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That, goiWorker } from './_d1-that'
import { seedChua, Q, probe } from './_chua-cau-sai-fixture'
import { gameToken } from '../server/src/game-v2-auth'
import { moDot, phatItem, nopItem, guiThay } from '../server/src/chua-cau-sai'
import { daChuaTrenLop, hangChieu } from '../server/src/chua-cau-sai-chieu'
import { xoaDemChua } from '../server/src/chua-cau-sai-cau-hinh'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import worker from '../server/src/index'
const T = Date.parse('2026-10-07T03:00:00Z')
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(T)
  xoaDemCaBaoVe()
})
afterEach(() => {
  vi.useRealTimers()
  xoaDemCaBaoVe()
})
async function dung(soEm = 1) {
  const d = taoD1That(),
    token = await seedChua(d.env)
  d.sql.prepare("UPDATE hoc_sinh SET lop='12A1' WHERE sbd='HS1'").run()
  d.sql
    .prepare("UPDATE cau_hinh SET gia_tri=? WHERE khoa='chua_cau_sai_v1'")
    .run(JSON.stringify({ bat: true, phamVi: 'tat_ca' }))
  xoaDemChua(d.env)
  const em = []
  for (let i = 1; i <= soEm; i++) {
    const sbd = `HS${i}`
    if (i > 1) {
      d.sql
        .prepare(
          "INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,'x','x')",
        )
        .run(sbd, `Em ${i}`, i === 3 ? '12A2' : '12A1')
      d.sql
        .prepare(
          "INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,visibility,purpose) VALUES(?,?,?,'game','g',1,0,'2026-10-07T03:00:00Z','2026-10-07','none','released','repair')",
        )
        .run(`sai-${i}`, sbd, Q)
    }
    const tk = i === 1 ? token : await gameToken(d.env, sbd),
      id = (await (await moDot(d.env, { token: tk, qid: Q })).json()).dotId
    for (const tra of ['40', 'B', '56', '58', '78']) {
      const p = await (
        await phatItem(d.env, { token: tk, dotId: id, tiep: true })
      ).json()
      const r = await nopItem(d.env, {
        token: tk,
        dotId: id,
        itemId: p.item.id,
        traLoi: tra,
        attemptId: crypto.randomUUID(),
      })
      expect(r.status).toBe(200)
    }
    em.push({ sbd, token: tk, id })
  }
  vi.setSystemTime(T + 86400001)
  for (const e of em) {
    const p = await (
      await phatItem(d.env, { token: e.token, dotId: e.id, tiep: true })
    ).json()
    const r = await (
      await nopItem(d.env, {
        token: e.token,
        dotId: e.id,
        itemId: p.item.id,
        traLoi: '999',
        attemptId: crypto.randomUUID(),
      })
    ).json()
    expect(r.trangThaiMoi).toBe('can_thay')
  }
  d.sql
    .prepare(
      "INSERT INTO buoi_hoc(id,ten,lop,bi_mat,mo_luc,het_han,cap_nhat_luc) VALUES('buoi','Buổi chữa','12A1','x',?,?,?)",
    )
    .run(
      new Date(T).toISOString(),
      new Date(T + 3 * 86400000).toISOString(),
      new Date(T).toISOString(),
    )
  return { ...d, em }
}
function diemDanh(d: Awaited<ReturnType<typeof dung>>, sbd = 'HS1') {
  d.sql
    .prepare(
      "INSERT INTO buoi_hoc_diem_danh(buoi_id,sbd,luc,cach,trang_thai,cap_nhat_luc) VALUES('buoi',?,'x','thay','co_mat','x')",
    )
    .run(sbd)
}
async function body(d: Awaited<ReturnType<typeof dung>>) {
  const g = (await (await hangChieu(d.env, { lop: '12A1' })).json()).ds[0]
  return {
    requestId: crypto.randomUUID(),
    buoiId: 'buoi',
    nhomId: g.id,
    buocId: 'm',
    dot: g.em.map((e: any) => ({ dotId: e.dotId, revision: e.revision })),
  }
}
describe('Chữa cuối trên lớp — Worker và SQLite thật', () => {
  it('không gửi thầy ở giữa vòng tự chữa; route danh sách/ghi chỉ thầy truy cập', async () => {
    const d = taoD1That(),
      token = await seedChua(d.env),
      id = (await (await moDot(d.env, { token, qid: Q })).json()).dotId
    expect((await guiThay(d.env, { token, dotId: id })).status).toBe(409)
    expect(d.dem('chua_loi_thay')).toBe(0)
    expect(
      (await goiWorker(worker, d.env, '/gv/chua-cau-sai/hang-chieu', { token }))
        .ok,
    ).toBe(false)
    expect(
      (
        await goiWorker(worker, d.env, '/gv/chua-cau-sai/da-chua-tren-lop', {
          token,
        })
      ).ok,
    ).toBe(false)
    expect(
      (await goiWorker(worker, d.env, '/gv/chua-cau-sai/hang-chieu', {}, true))
        .ds,
    ).toEqual([])
  })
  it('gom cùng lớp, câu, bước; lớp khác vẫn có nhóm riêng', async () => {
    const d = await dung(3),
      r = await (await hangChieu(d.env, {})).json()
    expect(r.ds.map((g: any) => [g.lop, g.em.length])).toEqual([
      ['12A1', 2],
      ['12A2', 1],
    ])
    expect(r.ds[0].em[0].daHieu).toEqual(['Khối lượng mol'])
    expect(r.ds[0].buocId).toBe('__ghep_bai__')
    expect(r.ds[0].em[0].traLoi).toBe('999')
  })
  it('chỉ em có mặt tiếp tục tự kiểm; nghe chữa không biến thành đã hiểu hoặc đạt KPI', async () => {
    const d = await dung(2)
    diemDanh(d)
    const b = await body(d),
      hs1 = d.em[0]!
    b.dot = b.dot.filter((x: any) => x.dotId === hs1.id)
    expect((await daChuaTrenLop(d.env, b)).status).toBe(200)
    const p = await (
      await phatItem(d.env, { token: hs1.token, dotId: hs1.id })
    ).json()
    expect(p.item.loai).toBe('kiem_ly_do')
    expect(p.item.hoi).toContain('K2O')
    expect(p.tienDo.soBuocDaQua).toBe(0)
    expect(
      d.sql
        .prepare('SELECT ket_qua_gap2 FROM chua_loi_dot WHERE id=?')
        .get(hs1.id),
    ).toMatchObject({ ket_qua_gap2: 'chua_dat' })
    const g = (await (await hangChieu(d.env, { lop: '12A1' })).json()).ds[0]
    expect(g.em.map((e: any) => e.sbd)).toEqual(['HS2'])
  })
  it('retry giữ receipt và mốc giúp; thay payload cùng mã bị từ chối', async () => {
    const d = await dung()
    diemDanh(d)
    const b = await body(d)
    const mot = await (await daChuaTrenLop(d.env, b)).json(),
      truoc = d.chup('chua_loi_dot')
    vi.setSystemTime(T + 86400001 + 60000)
    expect(await (await daChuaTrenLop(d.env, b)).json()).toEqual(mot)
    expect(d.chup('chua_loi_dot')).toEqual(truoc)
    expect(d.dem('chua_loi_chua_lop')).toBe(1)
    expect((await daChuaTrenLop(d.env, { ...b, buocId: 'khac' })).status).toBe(
      409,
    )
  })
  it('em vắng hoặc revision đổi làm cả batch bị từ chối, không chấm đã chữa giả', async () => {
    const d = await dung(2)
    diemDanh(d)
    const b = await body(d)
    expect((await daChuaTrenLop(d.env, b)).status).toBe(422)
    expect(d.dem('chua_loi_chua_lop')).toBe(0)
    diemDanh(d, 'HS2')
    d.sql
      .prepare('UPDATE chua_loi_dot SET revision=revision+1 WHERE id=?')
      .run(d.em[1]!.id)
    expect((await daChuaTrenLop(d.env, b)).status).toBe(409)
    expect(d.dem('chua_loi_dot', "trang_thai_day='can_thay'")).toBe(2)
  })
  it('lỗi giữa batch rollback mọi em, receipt và hàng chữa', async () => {
    const d = await dung(2)
    diemDanh(d)
    diemDanh(d, 'HS2')
    const b = await body(d)
    d.sql.exec(
      "CREATE TRIGGER chan_chua_lop BEFORE UPDATE ON chua_loi_thay WHEN NEW.trang_thai='da_chua_tren_lop' AND NEW.sbd='HS2' BEGIN SELECT RAISE(ABORT,'thử lỗi ghi'); END;",
    )
    await expect(daChuaTrenLop(d.env, b)).rejects.toThrow()
    expect(d.dem('chua_loi_chua_lop')).toBe(0)
    expect(d.dem('chua_loi_dot', "trang_thai_day='can_thay'")).toBe(2)
  })
  it('hết câu mới sau buổi chữa giữ tiến độ và chờ học liệu, không lặp câu đã lộ', async () => {
    const d = await dung()
    diemDanh(d)
    const b = await body(d)
    const row = d.sql
      .prepare(
        'SELECT id,snapshot_json FROM chua_loi_phien ORDER BY lan_gap_lai DESC LIMIT 1',
      )
      .get() as any
    const a = JSON.parse(row.snapshot_json),
      { dauNoiDung } = await import('../server/src/chua-cau-sai-phien')
    a.daDung.push(...a.hocLieu.buoc[0].hieuBuoc.kiemLyDo.map(dauNoiDung))
    d.sql
      .prepare('UPDATE chua_loi_phien SET snapshot_json=? WHERE id=?')
      .run(JSON.stringify(a), row.id)
    expect(await (await daChuaTrenLop(d.env, b)).json()).toMatchObject({
      ok: true,
      choHocLieu: 1,
    })
    expect(
      d.dem(
        'chua_loi_dot',
        "trang_thai_day='thieu_hoc_lieu' AND ly_do_thieu='het_cau_moi_sau_chua_lop'",
      ),
    ).toBe(1)
    const h = JSON.parse(
      (
        d.sql
          .prepare('SELECT hoc_lieu_json FROM chua_loi_hoc_lieu')
          .get() as any
      ).hoc_lieu_json,
    )
    h.buoc[0].hieuBuoc.kiemLyDo.push(
      probe('sau-lop', 'Vì sao Ca(OH)2 có hai nguyên tử O và hai H?', 'B', {
        phan: 'I',
        noiDungTrucTiep: {
          hoi: 'Vì sao Ca(OH)2 có hai nguyên tử O và hai H?',
          kieu: 'chon_ly_do',
          dapAn: 'B',
          luaChon: [
            { ky: 'A', noi: 'Vì Ca luôn có chỉ số 2.' },
            { ky: 'B', noi: 'Chỉ số ngoài ngoặc nhân cả nhóm OH.' },
          ],
        },
      }),
    )
    d.sql
      .prepare('UPDATE chua_loi_hoc_lieu SET hoc_lieu_json=?')
      .run(JSON.stringify(h))
    const p = await (
      await phatItem(d.env, { token: d.em[0]!.token, dotId: d.em[0]!.id })
    ).json()
    expect(p.item.hoi).toContain('hai nguyên tử O')
    expect(p.tienDo.soBuocDaQua).toBe(0)
    expect(d.dem('chua_loi_chua_lop')).toBe(1)
  })
  it('buổi đã kết thúc không mở lại bước của học sinh', async () => {
    const d = await dung()
    diemDanh(d)
    const b = await body(d)
    d.sql.prepare("UPDATE buoi_hoc SET dong_luc='2026-10-08T03:00:00Z'").run()
    expect((await daChuaTrenLop(d.env, b)).status).toBe(409)
    expect(d.dem('chua_loi_chua_lop')).toBe(0)
  })
})
