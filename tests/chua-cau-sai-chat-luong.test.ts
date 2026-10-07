// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That, serialiseD1, goiWorker } from './_d1-that'
import { seedChua, Q, hocLieuMau } from './_chua-cau-sai-fixture'
import {
  moDot,
  phatItem,
  nopItem,
  xinGoiY,
  thongKeKpi,
} from '../server/src/chua-cau-sai'
import { kiemTinhDayDu } from '../server/src/chua-cau-sai-hoc-lieu'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { tinhNangBat, xoaDemChua } from '../server/src/chua-cau-sai-cau-hinh'
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
async function dung() {
  const d = taoD1That()
  const token = await seedChua(d.env)
  return { ...d, token }
}
async function mo(d: Awaited<ReturnType<typeof dung>>) {
  const r = await moDot(d.env, { token: d.token, qid: Q })
  expect(r.status).toBe(200)
  return (await r.json()).dotId as string
}
async function phat(
  d: Awaited<ReturnType<typeof dung>>,
  dotId: string,
  tiep = true,
) {
  const r = await phatItem(d.env, { token: d.token, dotId, tiep })
  expect(r.status).toBe(200)
  return await r.json()
}
async function nop(
  d: Awaited<ReturnType<typeof dung>>,
  dotId: string,
  it: any,
  traLoi: string,
  attemptId = crypto.randomUUID(),
) {
  return nopItem(d.env, {
    token: d.token,
    dotId,
    itemId: it.id,
    attemptId,
    traLoi,
  })
}
async function sua(d: Awaited<ReturnType<typeof dung>>, dotId: string) {
  for (const tra of ['40', 'B', '56', '58', '78']) {
    const r = await phat(d, dotId)
    expect((await (await nop(d, dotId, r.item, tra)).json()).dung).toBe(true)
  }
}
describe('Vòng chữa — API, SQL thật, quyền và bằng chứng', () => {
  it('học liệu đầy đủ, phát phiên và item không lộ đáp án', async () => {
    expect(kiemTinhDayDu(hocLieuMau())).toEqual([])
    const d = await dung(),
      id = await mo(d),
      r = await phat(d, id)
    expect(r.phienId).toBeTruthy()
    expect(r.item.loai).toBe('chan_doan')
    expect(JSON.stringify(r)).not.toMatch(
      /dapAn|probeXacNhan|correct|bí mật lời giải/,
    )
    expect(d.dem('chua_loi_phien')).toBe(1)
  })
  it('chạy xuyên suốt: lý do + kiểm lại + chuyển giao + ghép + nghỉ 24h + gặp 2', async () => {
    const d = await dung(),
      id = await mo(d)
    await sua(d, id)
    let r = await phat(d, id)
    expect(r.trangThai).toBe('cho_gap_lai_2')
    vi.setSystemTime(T + 24 * 3600000 + 1)
    r = await phat(d, id)
    expect(r.item.loai).toBe('kiem_chung')
    const rs = await (await nop(d, id, r.item, '171')).json()
    expect(rs.trangThaiMoi).toBe('da_tu_sua')
    expect(
      d.dem('su_kien_hoc', "nguon='chua_loi' AND purpose='chua_buoc'"),
    ).toBe(4)
    expect(d.dem('chua_loi_nop')).toBe(6)
    expect(
      d.sql.prepare('SELECT ket_qua_gap2 FROM chua_loi_dot').get(),
    ).toMatchObject({ ket_qua_gap2: 'dung_tu_lam' })
  })
  it('chẩn đoán sai đi tới câu phân biệt và chỉ xác nhận từ đáp án thật', async () => {
    const d = await dung(),
      id = await mo(d)
    let r = await phat(d, id)
    await nop(d, id, r.item, '23')
    r = await phat(d, id)
    expect(r.item.loai).toBe('phan_biet')
    const rs = await (await nop(d, id, r.item, 'A')).json()
    expect(rs.diemlech).toContain('bỏ O và H')
    const a = JSON.parse(
      (d.sql.prepare('SELECT snapshot_json FROM chua_loi_phien').get() as any)
        .snapshot_json,
    )
    expect(a.tienDo[0].maLoiDaXacNhan).toBe('chi_na')
  })
  it('không coi đúng chẩn đoán là hiểu sâu hoặc đóng lỗi', async () => {
    const d = await dung(),
      id = await mo(d),
      r = await phat(d, id)
    await nop(d, id, r.item, '40')
    const ph = await phat(d, id)
    expect(ph.tienDo.soBuocDaQua).toBe(0)
    expect(ph.item.loai).toBe('kiem_ly_do')
  })
  it('phản hồi còn nguyên khi mở lại, chỉ phát câu mới khi bấm tiếp', async () => {
    const d = await dung(),
      id = await mo(d),
      r = await phat(d, id)
    await nop(d, id, r.item, '23')
    const sau = await phat(d, id, false)
    expect(sau.item.id).toBe(r.item.id)
    expect(sau.phanHoiTruoc.dung).toBe(false)
    expect(d.dem('chua_loi_item')).toBe(1)
  })
  it('retry cùng payload trả receipt cũ; payload khác và lần nộp thứ hai bị chặn', async () => {
    const d = await dung(),
      id = await mo(d),
      r = await phat(d, id)
    const rs = await (await nop(d, id, r.item, '40', 'A1')).json()
    const lai = await (await nop(d, id, r.item, '40', 'A1')).json()
    expect(lai.receiptId).toBe(rs.receiptId)
    expect(lai.idempotent).toBe(true)
    expect((await nop(d, id, r.item, '23', 'A1')).status).toBe(409)
    expect((await nop(d, id, r.item, '23', 'A2')).status).toBe(409)
    expect(d.dem('chua_loi_nop')).toBe(1)
  })
  it('gợi ý lưu hỗ trợ; chuyển câu mới và không ghi được giúp thành tự làm', async () => {
    const d = await dung(),
      id = await mo(d),
      r = await phat(d, id)
    const gy = await xinGoiY(d.env, {
      token: d.token,
      dotId: id,
      itemId: r.item.id,
    })
    expect(gy.status).toBe(200)
    await nop(d, id, r.item, '40')
    expect(
      d.sql.prepare('SELECT co_ho_tro FROM chua_loi_nop').get(),
    ).toMatchObject({ co_ho_tro: 1 })
  })
  it('chấm số dùng luật chung: dấu phẩy và số không cuối', async () => {
    const d = await dung(),
      id = await mo(d),
      r = await phat(d, id)
    expect((await (await nop(d, id, r.item, '40,00')).json()).dung).toBe(true)
  })
  it('không mở pilot toàn trường khi danh sách rỗng', async () => {
    const d = await dung()
    d.sql
      .prepare(
        "UPDATE cau_hinh SET gia_tri='{" +
          '"bat":true' +
          "}' WHERE khoa='chua_cau_sai_v1'",
      )
      .run()
    xoaDemChua(d.env)
    expect(await tinhNangBat(d.env, { sbd: 'HS1' })).toBe(false)
  })
  it('SBD query không thay được token; giáo viên phải có secret', async () => {
    const d = await dung()
    expect(
      (
        await goiWorker(worker, d.env, '/hs/chua-cau-sai/tien-do?sbd=HS1', {
          dotId: 'x',
        })
      ).ma,
    ).toBe('CAN_DANG_NHAP')
    expect(
      (await goiWorker(worker, d.env, '/gv/chua-cau-sai/thong-ke', {})).ok,
    ).toBe(false)
    expect(
      (await goiWorker(worker, d.env, '/gv/chua-cau-sai/thong-ke', {}, true))
        .ok,
    ).toBe(true)
  })
  it('ca đang mở chặn phát, nộp và xin gợi ý', async () => {
    const d = await dung(),
      id = await mo(d),
      r = await phat(d, id)
    d.sql
      .prepare(
        "INSERT INTO ca(ma_ca,ten_ca,lop,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CA','Ca','12','mo',?,?,60,'thi','khong','','x')",
      )
      .run(
        new Date(T - 60000).toISOString(),
        new Date(T + 3600000).toISOString(),
      )
    for (const fn of [phatItem, nopItem, xinGoiY])
      expect(
        (
          await fn(d.env, {
            token: d.token,
            dotId: id,
            itemId: r.item.id,
            attemptId: 'A1',
            traLoi: '40',
          })
        ).status,
      ).toBe(403)
  })
  it('đổi phiên bản sau khi phát thu hồi, không ghi sai oan', async () => {
    const d = await dung(),
      id = await mo(d),
      r = await phat(d, id)
    const q = JSON.parse(
      (d.sql.prepare('SELECT json FROM game_v2_question').get() as any).json,
    )
    q.version = 'v2'
    d.sql.prepare('UPDATE game_v2_question SET json=?').run(JSON.stringify(q))
    expect((await nop(d, id, r.item, '40')).status).toBe(409)
    expect(d.dem('chua_loi_nop')).toBe(0)
  })
  it('lỗi ghi sổ rollback cả receipt, item và tiến độ; retry không mất lượt', async () => {
    const d = await dung(),
      id = await mo(d),
      r = await phat(d, id)
    d.sql.exec(
      "CREATE TRIGGER loi_so BEFORE INSERT ON su_kien_hoc BEGIN SELECT RAISE(ABORT,'mất kết nối'); END",
    )
    const truoc = d.chup('chua_loi_phien')
    expect((await nop(d, id, r.item, '40', 'A1')).status).toBe(503)
    expect(d.dem('chua_loi_nop')).toBe(0)
    expect(d.chup('chua_loi_phien')).toBe(truoc)
    d.sql.exec('DROP TRIGGER loi_so')
    expect((await nop(d, id, r.item, '40', 'A1')).status).toBe(200)
  })
  it('hai thiết bị phát và nộp không tạo hai item hay hai receipt', async () => {
    const d = await dung(),
      id = await mo(d)
    serialiseD1(d.env)
    const rs = await Promise.all([phat(d, id), phat(d, id)])
    expect(rs[0].item.id).toBe(rs[1].item.id)
    const ns = await Promise.all([
      nop(d, id, rs[0].item, '40', 'A1'),
      nop(d, id, rs[0].item, '23', 'A2'),
    ])
    expect(ns.map((r) => r.status).sort()).toEqual([200, 409])
    expect(d.dem('chua_loi_nop')).toBe(1)
  })
  it('KPI gồm bỏ dở và thiếu học liệu, không cần đã gặp lại 2', async () => {
    const d = await dung(),
      id = await mo(d)
    await sua(d, id)
    vi.setSystemTime(T + 86400001)
    const r = await phat(d, id)
    await nop(d, id, r.item, '171')
    d.sql
      .prepare(
        "INSERT INTO chua_loi_dot(id,sbd,qid_chuan,cohort_id,mo_luc,trang_thai_day,giao_luc,chot_do_luc,tao_luc,cap_nhat_luc) VALUES('D2','HS1','Q2','pilot-chua-cau-sai-v1',1,'can_chan_doan',?,?,1,1),('D3','HS1','Q3','pilot-chua-cau-sai-v1',1,'thieu_hoc_lieu',?,?,1,1)",
      )
      .run(T, T + 7 * 86400000, T, T + 7 * 86400000)
    vi.setSystemTime(T + 7 * 86400000 + 1)
    const k = await (await thongKeKpi(d.env, {})).json()
    expect(k.mauSo).toBe(3)
    expect(k.tuSo).toBe(1)
    expect(k.kpiPhanTram).toBe(33.3)
  })
  it('hết câu mới và thiếu kiểm lý do phải báo thiếu học liệu', () => {
    const h = hocLieuMau()
    h.buoc[0].hieuBuoc!.kiemLyDo = []
    expect(kiemTinhDayDu(h)).toContain('buoc_0_thieu_hieu_buoc')
    const h2 = hocLieuMau()
    h2.banKiemChung[0].noiDungTrucTiep = h2.banGhepBai[0].noiDungTrucTiep
    expect(kiemTinhDayDu(h2)).toContain('ban_kiem_trung_ban_ghep')
  })
})

describe('Phạm vi toàn trường và hàng giúp đỡ', () => {
  it('toàn trường phải được ghi rõ, danh sách rỗng không tự mở', async () => {
    const d = await dung()
    d.sql
      .prepare("UPDATE cau_hinh SET gia_tri=? WHERE khoa='chua_cau_sai_v1'")
      .run(JSON.stringify({ bat: true, phamVi: 'tat_ca' }))
    xoaDemChua(d.env)
    expect(await tinhNangBat(d.env, { sbd: 'HS1' })).toBe(true)
  })
  it('sai mới tự được giao khi em chưa mở màn chữa; micro không tạo đợt mới', async () => {
    const d = await dung()
    const n = d.dem('chua_loi_dot')
    d.sql
      .prepare(
        "INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,visibility,purpose) VALUES('sai2','HS1','Q2','game','G2',1,0,'2026-10-07T03:00:00Z','2026-10-07','none','released','repair'),('micro','HS1','Q3','chua_loi','G3',1,0,'2026-10-07T03:00:00Z','2026-10-07','none','released','chua_buoc')",
      )
      .run()
    expect(d.dem('chua_loi_dot')).toBe(n + 1)
    expect(d.dem('chua_loi_dot', "qid_chuan='Q2'")).toBe(1)
  })
  it('yêu cầu em gửi thật sự vào hàng thầy và giáo viên đọc được bằng quyền riêng', async () => {
    const d = await dung(),
      id = await mo(d)
    const r = await goiWorker(worker, d.env, '/hs/chua-cau-sai/gui-thay', {
      token: d.token,
      dotId: id,
    })
    expect(r.daLuu).toBe(true)
    expect(d.dem('chua_loi_thay')).toBe(1)
    const h = await goiWorker(
      worker,
      d.env,
      '/gv/chua-cau-sai/hang-thay',
      {},
      true,
    )
    expect(h.ds[0].sbd).toBe('HS1')
  })
  it('gợi ý được retry không nâng mức hoặc đổi thời điểm hỗ trợ', async () => {
    const d = await dung(),
      id = await mo(d),
      r = await phat(d, id)
    const b = { token: d.token, dotId: id, itemId: r.item.id, mucHoTro: 1 }
    await xinGoiY(d.env, b)
    const truoc = d.chup('chua_loi_item')
    vi.setSystemTime(T + 60000)
    const j = await (await xinGoiY(d.env, b)).json()
    expect(j.idempotent).toBe(true)
    expect(d.chup('chua_loi_item')).toBe(truoc)
  })
})

describe('Giúp em hiểu đến khi tự làm được', () => {
  it('hiểu lý do sai một lần được gỡ và thử câu mới, rồi vẫn hoàn thành bước', async () => {
    const d = await dung(),
      id = await mo(d)
    let r = await phat(d, id)
    await nop(d, id, r.item, '40')
    r = await phat(d, id)
    const cu = r.item.id
    await nop(d, id, r.item, 'A')
    r = await phat(d, id)
    expect(r.item.id).not.toBe(cu)
    expect(r.item.hoi).toContain('K2O')
    for (const tra of ['B', '56', '58', '78']) {
      await nop(d, id, r.item, tra)
      r = await phat(d, id)
    }
    expect(r.trangThai).toBe('cho_gap_lai_2')
  })
  it('sai ở chuyển giao giữ chẩn đoán và thử bộ mới; không lặp câu đã lộ', async () => {
    const d = await dung(),
      id = await mo(d)
    let r: any
    for (const tra of ['40', 'B', '56', '57']) {
      r = await phat(d, id)
      await nop(d, id, r.item, tra)
    }
    const cg = r.item.id
    r = await phat(d, id)
    await nop(d, id, r.item, 'B')
    r = await phat(d, id)
    expect(r.item.hoi).toContain('Li2O')
    await nop(d, id, r.item, '30')
    r = await phat(d, id)
    expect(r.item.id).not.toBe(cg)
    expect(r.item.hoi).toContain('Ca(OH)2')
    await nop(d, id, r.item, '74')
    r = await phat(d, id)
    expect(r.item.loai).toBe('ghep_bai')
  })
  it('gặp lại 2 sai khoá KPI thất bại, vẫn giữ các bước đã hiểu và chuyển thầy', async () => {
    const d = await dung(),
      id = await mo(d)
    await sua(d, id)
    vi.setSystemTime(T + 86400001)
    const r = await phat(d, id),
      j = await (await nop(d, id, r.item, '172')).json()
    expect(j.trangThaiMoi).toBe('can_thay')
    const a = JSON.parse(
      (
        d.sql
          .prepare(
            'SELECT snapshot_json FROM chua_loi_phien ORDER BY lan_gap_lai DESC LIMIT 1',
          )
          .get() as any
      ).snapshot_json,
    )
    expect(a.tienDo[0].trangThai).toBe('co_bang_chung_hieu_trong_phien')
    expect(
      d.sql.prepare('SELECT ket_qua_gap2 FROM chua_loi_dot').get(),
    ).toMatchObject({ ket_qua_gap2: 'chua_dat' })
    expect(d.dem('chua_loi_thay')).toBe(1)
  })
})

describe('Tu luyện dùng cùng sổ và luật đóng lỗi', () => {
  it('retry Tu luyện chỉ thêm một sự kiện đúng lần nộp đầu, không đổi giờ hoặc đáp án', async () => {
    const d = await dung()
    const { damBaoBangTuLuyen } = await import('../server/src/tu-luyen')
    const { dongBoTuLuyen } =
      await import('../server/src/chua-cau-sai-tu-luyen')
    await damBaoBangTuLuyen(d.env)
    d.sql
      .prepare(
        "INSERT INTO tu_luyen_luot(id,sbd,che_do,de_rieng_json,tao_luc) VALUES('tl_ab1234','HS1',3,?,?)",
      )
      .run(JSON.stringify([{ qid: Q, dangMa: 'M', phan: 'III' }]), T)
    d.sql
      .prepare(
        "INSERT INTO tu_luyen_cham_cau(luot_id,sbd,qid,tra_loi,dung,diem,luc) VALUES('tl_ab1234','HS1',?,'23',0,0,?)",
      )
      .run(Q, T)
    expect(await dongBoTuLuyen(d.env, 'HS1', 'tl_ab1234')).toBe(true)
    const cu = d.chup('su_kien_hoc')
    vi.setSystemTime(T + 60000)
    expect(await dongBoTuLuyen(d.env, 'HS1', 'tl_ab1234')).toBe(true)
    expect(d.chup('su_kien_hoc')).toBe(cu)
    expect(d.dem('su_kien_hoc', "nguon='tu_luyen'")).toBe(1)
  })
  it('bằng chứng micro không đóng lỗi; hai lần tự làm toàn bài khác ngày mới đủ', async () => {
    const d = await dung(),
      id = await mo(d)
    await sua(d, id)
    const { docTrangThaiLoiDau } =
      await import('../server/src/chua-cau-sai-adapter')
    expect(
      (await docTrangThaiLoiDau(d.env, 'HS1', Q, '2026-10-07'))?.loiHoc
        .ngayDung,
    ).toEqual([])
    vi.setSystemTime(T + 86400001)
    const r = await phat(d, id)
    await nop(d, id, r.item, '171')
    let state = await docTrangThaiLoiDau(d.env, 'HS1', Q, '2026-10-08')
    expect(state?.loiHoc.trangThai).not.toBe('dong')
    expect(state?.loiHoc.ngayDung).toHaveLength(1)
    d.sql
      .prepare(
        "INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,visibility,purpose) VALUES('on-lai','HS1',?,'tu_luyen','TU3',1,1,'2026-10-10T03:00:00Z','2026-10-10','none','released','repair')",
      )
      .run(Q)
    state = await docTrangThaiLoiDau(d.env, 'HS1', Q, '2026-10-10')
    expect(state?.loiHoc.trangThai).toBe('dong')
  })
})

describe('Ranh giới dữ liệu và phục hồi', () => {
  it('số chưa nhập xong không bị ghi thành sai và không mất lần nộp', async () => {
    const d = await dung(),
      id = await mo(d),
      r = await phat(d, id)
    expect((await nop(d, id, r.item, '-')).status).toBe(422)
    expect(d.dem('chua_loi_nop')).toBe(0)
    expect((await nop(d, id, r.item, '40')).status).toBe(200)
  })
  it('lời thầy không xuất hiện lại khi em đang tự kiểm độc lập', async () => {
    const d = await dung(),
      id = await mo(d)
    await sua(d, id)
    d.sql
      .prepare(
        "INSERT INTO chua_loi_thay(dot_id,sbd,qid,bang_chung_json,gui_luc,loi_go,doc_luc) VALUES(?,'HS1',?,'{}',?,'Đây là lời giúp trước đây',?)",
      )
      .run(id, Q, T, T)
    vi.setSystemTime(T + 86400001)
    const r = await phat(d, id)
    expect(r.item.loai).toBe('kiem_chung')
    expect(r.loiThay).toBeUndefined()
  })
  it('JSON hỏng trả lỗi học liệu, không ném lỗi hoặc duyệt nhầm', () => {
    for (const x of [
      null,
      {},
      { ...hocLieuMau(), buoc: [null] },
      { ...hocLieuMau(), banGhepBai: {} },
      { ...hocLieuMau(), buoc: [{ ...hocLieuMau().buoc[0], hoTro: 'sai' }] },
    ])
      expect(kiemTinhDayDu(x).length).toBeGreaterThan(0)
    const h = hocLieuMau()
    h.buoc[0].chanDoan[0].noiDungTrucTiep!.dapAn = 'không phải số'
    expect(kiemTinhDayDu(h)).toContain('probe_cd_dap_an_khong_cham_duoc')
  })
  it('không đọc được lịch thi thì dừng cấp câu, không coi là không có ca', async () => {
    const d = await dung(),
      id = await mo(d)
    const db = d.env.DB,
      prepare = db.prepare.bind(db)
    db.prepare = (sql: string) => {
      if (sql.includes('FROM ca c WHERE c.trang_thai'))
        throw new Error('D1 mất kết nối')
      return prepare(sql)
    }
    expect((await phatItem(d.env, { token: d.token, dotId: id })).status).toBe(
      503,
    )
    expect(d.dem('chua_loi_item')).toBe(0)
  })
  it('thầy gỡ tiếp sau gặp 2 sai, em hoàn thành gặp 3; KPI gặp 2 giữ thất bại', async () => {
    const d = await dung(),
      id = await mo(d)
    await sua(d, id)
    vi.setSystemTime(T + 86400001)
    let r = await phat(d, id)
    await nop(d, id, r.item, '172')
    const { hangThay } = await import('../server/src/chua-cau-sai-thay')
    expect(
      (
        await hangThay(d.env, {
          dotId: id,
          moLai: true,
          buocId: 'm',
          loiGo: 'Em giữ phép cộng đúng, kiểm kỹ chỉ số ngoài ngoặc.',
        })
      ).status,
    ).toBe(200)
    for (const tra of ['B', '30', '74', '107']) {
      r = await phat(d, id)
      expect((await (await nop(d, id, r.item, tra)).json()).dung).toBe(true)
    }
    vi.setSystemTime(T + 2 * 86400000 + 2)
    r = await phat(d, id)
    expect(r.lanGapLai).toBe(3)
    expect(r.item.hoi).toContain('Sr(OH)2')
    expect((await (await nop(d, id, r.item, '122')).json()).trangThaiMoi).toBe(
      'da_tu_sua',
    )
    expect(
      d.sql.prepare('SELECT ket_qua_gap2 FROM chua_loi_dot').get(),
    ).toMatchObject({ ket_qua_gap2: 'chua_dat' })
  })
  it('Tu luyện ghi lỗi giữa batch rollback trạng thái và câu; nộp lại đồng bộ đúng', async () => {
    const d = await dung()
    const { damBaoBangTuLuyen, tuLuyenNop } =
      await import('../server/src/tu-luyen')
    await damBaoBangTuLuyen(d.env)
    d.sql
      .prepare(
        "INSERT INTO tu_luyen_luot(id,sbd,che_do,de_rieng_json,tao_luc) VALUES('tl_atomic123','HS1',3,?,?)",
      )
      .run(
        JSON.stringify([
          {
            qid: Q,
            phan: 'III',
            dapAn: '24',
            text: 'Mol',
            chot: '',
            ketQua: '',
            dangMa: 'M',
            dangTen: 'Mol',
            bai: '1',
            lop: '12',
            sao: 1,
          },
        ]),
        T,
      )
    d.sql.exec(
      "CREATE TRIGGER tu_loi BEFORE INSERT ON tu_luyen_cau BEGIN SELECT RAISE(ABORT,'D1 hỏng'); END",
    )
    const b = { luotId: 'tl_atomic123', traLoi: { [Q]: '24' } }
    expect((await tuLuyenNop(d.env, 'HS1', b)).ok).toBe(false)
    expect(
      d.sql
        .prepare("SELECT trang_thai FROM tu_luyen_luot WHERE id='tl_atomic123'")
        .get(),
    ).toMatchObject({ trang_thai: 'dang_lam' })
    expect(d.dem('tu_luyen_cau')).toBe(0)
    d.sql.exec('DROP TRIGGER tu_loi')
    const r = await tuLuyenNop(d.env, 'HS1', b)
    expect(r.ok).toBe(true)
    expect(r.soDung).toBe(1)
    expect(d.dem('su_kien_hoc', "nguon='tu_luyen'")).toBe(1)
  })
})
