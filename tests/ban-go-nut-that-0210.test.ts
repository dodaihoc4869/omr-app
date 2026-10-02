// @vitest-environment node
// BÀN GỠ NÚT THẮT — máy chủ (server/src/ban-go-nut-that.ts): gom thẻ theo (câu, bước) + thứ tự ưu tiên, gỡ ⇒ da_go + loi_go,
// kèm riêng sau 2 lần tự làm sai, lỗi đã đóng ⇒ xong, học sinh không gọi được lệnh thầy, /hs/loi-go.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { damBaoBangNutThat } from '../server/src/nut-that'
import { damBaoBangBoTro } from '../server/src/cau-bo-tro'
import { damBaoBangLoiGiai } from '../server/src/loi-giai'
import { danhDauKemRieng, diemUuTien } from '../server/src/ban-go-nut-that'
import type { Env } from '../server/src/kieu'

const GOC = path.resolve(__dirname, '..')
const MAU = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json'), 'utf8')) as Record<string, { cau: Record<string, unknown> }>
const DE = '12-THU-NT'
const Q1 = `${DE}-I-6`
const GOI = { cau: [{ ...MAU['12-KT-C1-D4-I-6'].cau, so: 6 }] }
const NAY = '2026-10-20T03:00:00.000Z'
const HOM_NAY = '2026-10-20'

const thay = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b, true)
const em = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b)

async function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  await damBaoBangLoiGiai(env); await damBaoBangBoTro(env); await damBaoBangNutThat(env)
  for (const [s, ten] of [['E1', 'An'], ['E2', 'Bình'], ['E3', 'Chi'], ['E4', 'Dũng'], ['E5', 'Giang']]) {
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12','mk','x')").run(s, ten)
  }
  d.objects.set(`kho/${DE}.json`, JSON.stringify(GOI))
  const lgc = d.sql.prepare("INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,cap_nhat_luc) VALUES(?,?,?,'tn','x')")
  lgc.run(Q1, 'BAM1', DE); lgc.run('Q2', 'BAM2', 'DE2'); lgc.run('Q3', 'BAM3', 'DE3')
  const bt = d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cau_kiem_json,nhan_nen_json,buoc_json,cap_nhat_luc) VALUES(?,?,'[]',?,?,?,'x')")
  bt.run('BAM1', Q1, JSON.stringify([{ buoc: 2, kieu: 'so', hoi: 'Số mol electron nhận là bao nhiêu?', dap_an: '0,4' }]), JSON.stringify([{ buoc: 2, nen: 'Bảo toàn electron' }]), JSON.stringify(['Viết phương trình', 'Bảo toàn electron: 3x = 0,4', 'Tính m']))
  bt.run('BAM2', 'Q2', '[]', JSON.stringify([{ buoc: 1, nen: 'Bảo toàn electron' }]), JSON.stringify(['Lập hệ']))
  return { d, env }
}
let soThe = 0
function the(d: D1That, sbd: string, qid: string, bam: string, buoc: number, guiLuc: string, viet = '', trangThai = 'cho') {
  d.sql.prepare('INSERT INTO nut_that(id,sbd,qid,bam,buoc,viet,bang_chung_json,gui_luc,ngay_vn,trang_thai,go_id,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,NULL,?)')
    .run(`T${++soThe}`, sbd, qid, bam, buoc, viet, '{}', guiLuc, guiLuc.slice(0, 10), trangThai, guiLuc)
}
function suKien(d: D1That, sbd: string, qid: string, kq: number | null, luc: string, them: { assistance?: string; purpose?: string; nguon?: string; chon?: string } = {}) {
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,purpose,raw_json) VALUES(?,?,?,?,?,1,?,?,?,?,?,?)')
    .run(`${sbd}|${qid}|${luc}|${Math.random()}`, sbd, qid, them.nguon ?? 'luyen', 'M', kq, luc, luc.slice(0, 10), them.assistance ?? 'none', them.purpose ?? null, them.chon ? JSON.stringify({ chon: them.chon }) : null)
}

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(NAY)) })
afterEach(() => { vi.useRealTimers() })

describe('/gv/nut-that/ds — gom thẻ + thứ tự ưu tiên', () => {
  it('gom theo (câu, bước), dữ liệu từng em, chiến dịch sắp hạn lên đầu, nhóm cùng kiến thức nền', async () => {
    const { d } = await dung()
    the(d, 'E1', Q1, 'BAM1', 2, '2026-10-18T02:00:00.000Z', 'Em không hiểu vì sao nhân 3')
    the(d, 'E1', Q1, 'BAM1', 2, '2026-10-19T02:00:00.000Z', 'Vẫn không hiểu')
    the(d, 'E2', `${Q1}~ss0`, 'BAM1', 2, '2026-10-18T03:00:00.000Z')
    the(d, 'E3', Q1, 'BAM1', 2, '2026-10-18T04:00:00.000Z')
    the(d, 'E4', Q1, 'BAM1', 3, '2026-10-17T01:00:00.000Z')
    the(d, 'E1', 'Q2', 'BAM2', 1, '2026-10-17T05:00:00.000Z')
    the(d, 'E5', 'Q3', 'BAM3', 1, '2026-10-19T05:00:00.000Z')
    suKien(d, 'E1', Q1, 0, '2026-10-16T02:00:00.000Z', { chon: 'A' })
    suKien(d, 'E1', `${Q1}~ss1`, 0, '2026-10-17T02:00:00.000Z', { chon: 'D' })
    suKien(d, 'E1', Q1, 0, '2026-10-17T09:00:00.000Z', { assistance: 'assisted', chon: 'C' }) // có hỗ trợ: không tính
    d.sql.prepare("INSERT INTO cau_kiem_lam(sbd,qid,bam,buoc,tra_loi,dung,giay,luc,ngay_vn) VALUES('E1',?,'BAM1',2,'0,3',0,20,'2026-10-18T01:00:00.000Z','2026-10-18')").run(Q1)
    d.sql.prepare("INSERT INTO chien_dich(id,ten,sbd_json,ma_de_json,qid_json,han_nop,tao_luc) VALUES('cd1','Ôn','[]','[]',?,?,'x')").run(JSON.stringify(['Q3']), HOM_NAY)

    const r = await thay(d, '/gv/nut-that/ds', {})
    expect(r.ok).toBe(true)
    const nhom = r.nhom as { khoa: string; soEm: number; diem: number; em: Record<string, unknown>[]; de: string; chuBuoc: string; nhanNen: string; cauKiemHoi: string; so: string; hanGanNhat: string | null }[]
    // BAM3 (1 em, hạn chiến dịch hôm nay ×4) > BAM1·bước 2 (3 em) > hai nhóm 1 em (thẻ gửi sớm trước).
    expect(nhom.map((n) => n.khoa)).toEqual(['BAM3|1', 'BAM1|2', 'BAM1|3', 'BAM2|1'])
    expect(nhom.map((n) => n.diem)).toEqual([4, 3, 1, 1])
    expect(nhom[0]!.hanGanNhat).toBe(HOM_NAY)
    const g = nhom[1]!
    expect(g).toMatchObject({ soEm: 3, so: 'Câu 6', nhanNen: 'Bảo toàn electron', cauKiemHoi: 'Số mol electron nhận là bao nhiêu?' })
    expect(g.chuBuoc).toContain('Bảo toàn electron: 3x = 0,4')
    expect(g.de).toContain('<p>')
    expect(g.em.map((e) => e.hoTen)).toEqual(['Bình', 'Chi', 'An']) // một em hai thẻ ⇒ giữ thẻ mới nhất
    expect(g.em.find((e) => e.sbd === 'E1')).toMatchObject({ dapAnChon: 'D', soLanThu: 2, viet: 'Vẫn không hiểu', kiem: [{ traLoi: '0,3', dung: false }] })
    expect(r.cungNen).toEqual([{ nen: 'Bảo toàn electron', soEm: 3, soCau: 2, khoa: ['BAM1|2', 'BAM2|1'] }])
    expect(r.tong).toMatchObject({ soThe: 7, soNhom: 4, quaTai: false })
    expect(nhom.every((n) => !('nhieuEmVuong' in n) || (n as unknown as { nhieuEmVuong: boolean }).nhieuEmVuong === false)).toBe(true)
  })

  it('công thức ưu tiên: số em × mức hay gặp × hạn', () => {
    expect(diemUuTien(3, 0, null)).toBe(3)
    expect(diemUuTien(2, 3, null)).toBe(6) // 1 + log2(4) = 3
    expect(diemUuTien(1, 0, 0)).toBe(4)
    expect(diemUuTien(1, 0, 1)).toBe(2.5)
  })

  it('quá 15 thẻ/ngày ⇒ nhóm ≥ 4 em gắn cờ "nhiều em vướng"', async () => {
    const { d } = await dung()
    for (const s of ['E1', 'E2', 'E3', 'E4']) the(d, s, Q1, 'BAM1', 2, '2026-10-19T02:00:00.000Z')
    for (let i = 1; i <= 12; i++) the(d, `F${i}`, `QF${i}`, `BF${i}`, 1, '2026-10-19T03:00:00.000Z')
    const r = await thay(d, '/gv/nut-that/ds', {})
    expect(r.tong).toMatchObject({ soThe: 16, theNgayDongNhat: 16, quaTai: true })
    const nhom = r.nhom as { khoa: string; nhieuEmVuong: boolean; em: { hoTen: string }[] }[]
    expect(nhom[0]).toMatchObject({ khoa: 'BAM1|2', nhieuEmVuong: true })
    expect(nhom.filter((n) => n.nhieuEmVuong)).toHaveLength(1)
    expect(nhom.find((n) => n.khoa === 'BF1|1')!.em[0]!.hoTen).toBe('F1') // em chưa có tên ⇒ SBD
  })
})

describe('/gv/nut-that/go', () => {
  it('gỡ ngắn ⇒ loi_go + mọi thẻ chờ của (câu, bước) sang da_go; bấm lại ⇒ báo đã gỡ', async () => {
    const { d } = await dung()
    the(d, 'E1', Q1, 'BAM1', 2, '2026-10-18T02:00:00.000Z')
    the(d, 'E2', Q1, 'BAM1', 2, '2026-10-18T03:00:00.000Z')
    the(d, 'E3', Q1, 'BAM1', 3, '2026-10-18T03:00:00.000Z')
    expect(await thay(d, '/gv/nut-that/go', { bam: 'BAM1', buoc: 2, kieu: 'ngan', noiDung: '' })).toMatchObject({ ok: false })
    const r = await thay(d, '/gv/nut-that/go', { bam: 'BAM1', buoc: 2, kieu: 'ngan', noiDung: 'Fe nhường 3 electron vì lên Fe3+.' })
    expect(r).toMatchObject({ ok: true, soThe: 2 })
    expect(d.dem('loi_go', `bam='BAM1' AND buoc=2 AND kieu='ngan' AND id='${r.goId}'`)).toBe(1)
    expect(d.dem('nut_that', `trang_thai='da_go' AND go_id='${r.goId}'`)).toBe(2)
    expect(d.dem('nut_that', "trang_thai='cho'")).toBe(1) // bước 3 chưa gỡ
    expect(await thay(d, '/gv/nut-that/go', { bam: 'BAM1', buoc: 2, kieu: 'ngan', noiDung: 'lần nữa' })).toMatchObject({ ok: false, error: 'Các thẻ của bước này đã được gỡ rồi.' })
    const ds = await thay(d, '/gv/nut-that/ds', {})
    expect((ds.nhom as { khoa: string }[]).map((n) => n.khoa)).toEqual(['BAM1|3'])
  })

  it('dạy trên lớp: ghi buổi học vào loi_go + trả em cần gọi; buổi không có ⇒ từ chối. Sửa lời giải: chỉ ghi, không đụng kho', async () => {
    const { d } = await dung()
    the(d, 'E1', Q1, 'BAM1', 2, '2026-10-18T02:00:00.000Z')
    the(d, 'E2', 'Q2', 'BAM2', 1, '2026-10-18T02:00:00.000Z')
    expect(await thay(d, '/gv/nut-that/go', { bam: 'BAM1', buoc: 2, kieu: 'lop', noiDung: '', buoiHoc: 'khong-co' })).toMatchObject({ ok: false, error: 'Không tìm thấy buổi học này.' })
    const mo = await thay(d, '/gv/buoi-hoc', { action: 'mo', lop: '', ten: 'Buổi tối thứ Ba' })
    const idBuoi = (mo.buoi as { id: string }).id
    const r = await thay(d, '/gv/nut-that/go', { bam: 'BAM1', buoc: 2, kieu: 'lop', noiDung: '', buoiHoc: idBuoi })
    expect(r).toMatchObject({ ok: true, soThe: 1, tenBuoi: 'Buổi tối thứ Ba', emCanGoi: [{ sbd: 'E1', hoTen: 'An' }] })
    expect(d.dem('loi_go', `kieu='lop' AND buoi_hoc='${idBuoi}'`)).toBe(1)
    expect(d.dem('buoi_hoc_diem_danh')).toBe(0) // không khai "có mặt" thay em
    const kho = d.objects.get(`kho/${DE}.json`)
    expect(await thay(d, '/gv/nut-that/go', { bam: 'BAM2', buoc: 1, kieu: 'sua', noiDung: 'Bước 1 thiếu hệ số' })).toMatchObject({ ok: true, soThe: 1 })
    expect(d.objects.get(`kho/${DE}.json`)).toBe(kho)
    expect(d.dem('loi_go', "kieu='sua' AND noi_dung='Bước 1 thiếu hệ số'")).toBe(1)
  })

  it('học sinh không gọi được lệnh thầy', async () => {
    const { d } = await dung()
    for (const duong of ['/gv/nut-that/ds', '/gv/nut-that/go']) expect(await em(d, duong, {})).toMatchObject({ ok: false, error: 'Sai mã bí mật' })
  })
})

describe('kèm riêng + xong (lười, khi thầy mở bàn)', () => {
  it('sau lời gỡ em còn ≥ 2 lần TỰ LÀM sai (kể cả song sinh, lượt game #n) ⇒ kèm riêng; lượt có hỗ trợ / đọc lời giải không tính', async () => {
    const { d, env } = await dung()
    for (const s of ['E1', 'E2', 'E3']) the(d, s, Q1, 'BAM1', 2, '2026-10-18T02:00:00.000Z')
    for (const s of ['E1', 'E2', 'E3']) suKien(d, s, Q1, 0, '2026-10-17T02:00:00.000Z')
    await thay(d, '/gv/nut-that/go', { bam: 'BAM1', buoc: 2, kieu: 'ngan', noiDung: 'Gỡ' })
    suKien(d, 'E1', Q1, 0, '2026-10-20T05:00:00.000Z')
    suKien(d, 'E1', Q1, 0, '2026-10-20T06:00:00.000Z')
    suKien(d, 'E2', Q1, 0, '2026-10-20T05:00:00.000Z', { assistance: 'assisted' })
    suKien(d, 'E2', Q1, 0, '2026-10-20T06:00:00.000Z', { purpose: 'xem_loi_giai', nguon: 'on_lai' })
    suKien(d, 'E3', `${Q1}~ss0`, 0, '2026-10-20T05:00:00.000Z', { nguon: 'game' })
    suKien(d, 'E3', `${Q1}#2`, 0, '2026-10-20T06:00:00.000Z', { nguon: 'game' })
    // Lời gỡ trước các lượt sai trên: lần sai TRƯỚC lời gỡ không tính.
    expect(await danhDauKemRieng(env, 'E2', Q1)).toBe(0)
    const r = await thay(d, '/gv/nut-that/ds', {})
    expect((r.kemRieng as { sbd: string; hoTen: string; buoc: number; so: string }[]).map((x) => [x.hoTen, x.buoc, x.so]).sort()).toEqual([['An', 2, 'Câu 6'], ['Chi', 2, 'Câu 6']])
    expect(d.dem('nut_that', "sbd='E2' AND trang_thai='da_go'")).toBe(1)
  })

  it('danhDauKemRieng cho một em × một câu (qid song sinh cũng được)', async () => {
    const { d, env } = await dung()
    the(d, 'E1', Q1, 'BAM1', 2, '2026-10-18T02:00:00.000Z')
    await thay(d, '/gv/nut-that/go', { bam: 'BAM1', buoc: 2, kieu: 'ngan', noiDung: 'Gỡ' })
    suKien(d, 'E1', Q1, 0, '2026-10-20T05:00:00.000Z')
    expect(await danhDauKemRieng(env, 'E1', `${Q1}~ss1`)).toBe(0)
    suKien(d, 'E1', `${Q1}~ss1`, 0, '2026-10-20T06:00:00.000Z')
    expect(await danhDauKemRieng(env, 'E1', `${Q1}~ss1`)).toBe(1)
    expect(d.dem('nut_that', "sbd='E1' AND trang_thai='kem_rieng'")).toBe(1)
  })

  it('lỗi đã đóng theo luật chung (2 ngày tự làm đúng sau lần sai cuối, cách ≥ 3 ngày) ⇒ xong, rời bàn', async () => {
    const { d } = await dung()
    the(d, 'E4', Q1, 'BAM1', 3, '2026-10-11T01:00:00.000Z')
    the(d, 'E5', Q1, 'BAM1', 3, '2026-10-11T01:00:00.000Z')
    for (const s of ['E4', 'E5']) suKien(d, s, Q1, 0, '2026-10-10T02:00:00.000Z')
    suKien(d, 'E4', Q1, 1, '2026-10-14T02:00:00.000Z')
    suKien(d, 'E4', Q1, 1, '2026-10-16T02:00:00.000Z')
    suKien(d, 'E5', Q1, 1, '2026-10-14T02:00:00.000Z') // mới một ngày đúng ⇒ chưa đóng
    const r = await thay(d, '/gv/nut-that/ds', {})
    expect(d.dem('nut_that', "sbd='E4' AND trang_thai='xong'")).toBe(1)
    expect(d.dem('nut_that', "sbd='E5' AND trang_thai='cho'")).toBe(1)
    expect((r.nhom as { soEm: number; em: { sbd: string }[] }[])[0]!.em.map((e) => e.sbd)).toEqual(['E5'])
  })
})

describe('/hs/loi-go', () => {
  it('em có thẻ đọc được lời gỡ (ngắn + trên lớp, không ghi chú sửa) và được ghi đã đọc; em chưa làm câu ⇒ từ chối', async () => {
    const { d } = await dung()
    the(d, 'E1', Q1, 'BAM1', 2, '2026-10-18T02:00:00.000Z')
    the(d, 'E1', Q1, 'BAM1', 3, '2026-10-18T02:00:00.000Z')
    await thay(d, '/gv/nut-that/go', { bam: 'BAM1', buoc: 2, kieu: 'ngan', noiDung: 'Fe lên Fe3+ nhường 3 electron.' })
    await thay(d, '/gv/nut-that/go', { bam: 'BAM1', buoc: 3, kieu: 'sua', noiDung: 'Sửa đáp số bước 3' })
    const token = await gameToken(d.env, 'E1')
    const r = await em(d, '/hs/loi-go', { token, qid: `${Q1}~ss0` })
    expect(r).toMatchObject({ ok: true, loiGo: [{ buoc: 2, kieu: 'ngan', noiDung: 'Fe lên Fe3+ nhường 3 electron.' }] })
    expect(d.dem('loi_go_doc', "sbd='E1'")).toBe(1)
    const r5 = await em(d, '/hs/loi-go', { token: await gameToken(d.env, 'E5'), qid: Q1 })
    expect(r5.ok).toBe(false)
    suKien(d, 'E5', Q1, 0, '2026-10-19T02:00:00.000Z')
    expect(await em(d, '/hs/loi-go', { token: await gameToken(d.env, 'E5'), qid: Q1 })).toMatchObject({ ok: true, loiGo: [{ buoc: 2 }] })
    expect(await em(d, '/hs/loi-go', { token: 'sai', qid: Q1 })).toMatchObject({ ok: false })
  })
})
