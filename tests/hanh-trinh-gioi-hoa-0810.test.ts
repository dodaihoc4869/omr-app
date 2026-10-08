// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { hopNhatChienDichDangMo, hopNhatChienDichDangMoMotLan } from '../server/src/hanh-trinh-gioi-hoa'
import { chonVuaNganSachPhut, lapKeHoachNgay, type CauSrs, type TrangThaiCau } from '../server/src/srs2-loi'

const T0 = Date.parse('2026-10-08T08:00:00+07:00')
const row = (d: ReturnType<typeof taoD1That>, id: string, lop: string, sbd: string[], qids: string[], maDe: string[], tao: string) =>
  d.sql.prepare(`INSERT INTO chien_dich(id,ten,lop,sbd_json,ma_de_json,qid_json,han_nop,the_luc_ngay,huyet_chien,tao_luc,trang_thai)
    VALUES(?,?,?,?,?,?,?,40,1,?,'dang_chay')`).run(id, id, lop, JSON.stringify(sbd), JSON.stringify(maDe), JSON.stringify(qids), '2026-10-20', tao)

describe('Hành trình giỏi Hóa theo khối', () => {
  it('gộp toàn bộ chiến dịch đang mở, giữ dòng cũ, bật kế hoạch phút và đánh dấu phân lại hôm nay', async () => {
    const d = taoD1That(), env = d.env as unknown as Env
    const hs = d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,trang_thai,cap_nhat_luc) VALUES(?,?,?,?,?,?)')
    hs.run('11010', 'Em 11010', '12', '12A1', 'dang_hoc', 'x')
    hs.run('12002', 'Em 12002', '12', '12A2', 'dang_hoc', 'x')
    row(d, 'cd-a', '12A1', ['11010'], ['q1', 'q2'], ['DH-12-C1-B1'], '2026-10-01T00:00:00.000Z')
    row(d, 'cd-b', 'Khối 12', ['12002'], ['q2', 'q3'], ['DH-12-C1-B2'], '2026-10-03T00:00:00.000Z')
    d.sql.prepare("INSERT INTO srs2_ke_hoach_omni(sbd,ngay,chien_dich_json,on_bai_cu_json,cap_nhat_luc) VALUES('11010','2026-10-08','[\"cd-a\"]','[]','x')").run()

    const kq = await hopNhatChienDichDangMo(env, T0)
    expect(kq.boQua).toEqual([])
    expect(kq.khoi).toEqual([{ khoi: 12, id: 'hanh-trinh-gioi-hoa-khoi-12', soChienDich: 2, soCau: 3, soEm: 2 }])
    const ht = d.sql.prepare("SELECT * FROM chien_dich WHERE id='hanh-trinh-gioi-hoa-khoi-12'").get() as Record<string, unknown>
    expect(ht).toMatchObject({ ten: 'Hành trình giỏi Hóa · Khối 12', lop: 'Khối 12', han_nop: '9999-12-31', trang_thai: 'dang_chay', huyet_chien: 0 })
    expect(JSON.parse(String(ht.qid_json))).toEqual(['q1', 'q2', 'q3'])
    expect(JSON.parse(String(ht.sbd_json))).toEqual(['11010', '12002'])
    expect((d.sql.prepare("SELECT COUNT(*) n FROM chien_dich WHERE id IN ('cd-a','cd-b') AND trang_thai='da_dong'").get() as { n: number }).n).toBe(2)
    expect((d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='chien_dich_phut_v1'").get() as { gia_tri: string }).gia_tri).toContain('active')
    expect((d.sql.prepare("SELECT chien_dich_json FROM srs2_ke_hoach_omni WHERE sbd='11010' AND ngay='2026-10-08'").get() as { chien_dich_json: string }).chien_dich_json).toBe('[]')

    const lai = await hopNhatChienDichDangMo(env, T0 + 1_000)
    expect(lai.khoi[0]).toMatchObject({ khoi: 12, id: 'hanh-trinh-gioi-hoa-khoi-12', soChienDich: 0, soCau: 3, soEm: 2 })
    expect((d.sql.prepare("SELECT COUNT(*) n FROM hanh_trinh_gioi_hoa WHERE khoi='12'").get() as { n: number }).n).toBe(1)
  })

  it('cron phát hành tự gộp đúng một lần và để lại biên nhận', async () => {
    const d = taoD1That(), env = d.env as unknown as Env
    row(d, 'cd-10', '10A1', ['10001'], ['q10'], ['DH-10-C1-B1'], '2026-10-02T00:00:00.000Z')
    const dau = await hopNhatChienDichDangMoMotLan(env, T0)
    const lai = await hopNhatChienDichDangMoMotLan(env, T0 + 60_000)
    expect(dau.chay).toBe(true)
    expect(lai).toEqual({ chay: false })
    expect((d.sql.prepare("SELECT trang_thai FROM chien_dich WHERE id='cd-10'").get() as { trang_thai: string }).trang_thai).toBe('da_dong')
    expect((d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='hanh_trinh_gioi_hoa_hop_nhat_0810_v1'").get() as { gia_tri: string }).gia_tri).toContain('"trangThai":"xong"')
  })
})

describe('ngân sách phút của kế hoạch cá nhân', () => {
  it('ưu tiên nợ, chọn vừa đúng ngân sách và không để học sinh kẹt khi một câu quá dài', () => {
    const ns = { phienBan: 't', giayToiDa: 300, giayMacDinh: 120, giayTheoQid: { no: 180, moi: 120, ngan: 60 } }
    expect(chonVuaNganSachPhut([{ qid: 'no', giaTri: 1 }, { qid: 'moi', giaTri: 2 }, { qid: 'ngan', giaTri: 3 }], ns)).toMatchObject({
      chon: [{ qid: 'no', giaTri: 1 }, { qid: 'moi', giaTri: 2 }], duKienGiay: 300, hoanCau: 1, quaTaiGiay: 0,
    })
    expect(chonVuaNganSachPhut([{ qid: 'no', giaTri: 1 }], { ...ns, giayToiDa: 60 })).toMatchObject({ duKienGiay: 180, quaTaiGiay: 120 })
  })

  it('Hành trình dùng cửa sổ cuốn, không chia quota trên hàng triệu ngày', () => {
    const cau: CauSrs[] = Array.from({ length: 14 }, (_, i) => ({ qid: `q${i}`, phan: 'I', mucDo: 'NB', dang: 'd', nguon: 'chien_dich', cd: 'ht' }))
    const tt = new Map<string, TrangThaiCau>(cau.map((c) => [c.qid, { laMoi: true, thanhThao: false, catTia: false, lichSu: [], henOn: null, ngayChua: null }]))
    const k = lapKeHoachNgay(cau, tt, { homNay: '2026-10-08', hanNop: null, chienDich: [{ id: 'ht', hanNop: '9999-12-31', theLucNgay: 40, raiDeu: true, hanhTrinh: true }] })
    expect(k.D).toBe(7)
    expect(k.dao.length + k.doan.length).toBeGreaterThanOrEqual(4) // ceil(14 / (7 - 3))
  })
})
