// @vitest-environment node
// Kiểm hợp đồng độc lập của PR #189. Chạy đúng migration, không vá lược đồ để test qua.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import { moDot, phatItem, nopItem, xinGoiY, thongKeKpi } from '../server/src/chua-cau-sai'
import { tinhNangBat } from '../server/src/chua-cau-sai-cau-hinh'
import worker from '../server/src/index'
import { coCaDangMo } from '../server/src/bi-a'

let lan = 0
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(Date.parse('2026-10-07T03:00:00Z') + (++lan * 61_000))
})
afterEach(() => vi.useRealTimers())

const probe = {
  qid: 'probe-m', phienBan: 'v1', phan: 'III', kyNang: ['tinh_M'], laTuongDuong: false,
  noiDungTrucTiep: { hoi: 'Tính M(NaOH), Na=23, O=16, H=1.', kieu: 'so', dapAn: '40', donVi: 'g/mol' },
}
const hocLieu = {
  schemaVersion: 1, contentVersion: 'v1', qidGoc: 'Q1',
  buoc: [{ id: 'm', thuTu: 0, tieuDe: 'Khối lượng mol', tienQuyet: [], viKyNang: ['tinh_M'],
    chanDoan: [probe], phanBiet: [], kiemLai: [probe],
    hoTro: [{ muc: 1, noiDung: 'Xét đủ các nguyên tố trong công thức.' }], loiThuongGap: [],
  }],
  banGhepBai: [{ ...probe, qid: 'ghep-moi', laTuongDuong: true,
    noiDungTrucTiep: { hoi: 'Tính M(KOH), K=39, O=16, H=1.', kieu: 'so', dapAn: '56' } }],
  banKiemChung: [{ ...probe, qid: 'kiem-moi', laTuongDuong: true,
    noiDungTrucTiep: { hoi: 'Tính M(LiOH), Li=7, O=16, H=1.', kieu: 'so', dapAn: '24' } }],
}

async function dung(coHocLieu = true) {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('HS1','Em Một','12','thu','x')").run()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('chua_cau_sai_v1',?, 'x')")
    .run(JSON.stringify({ bat: true, sbd: ['HS1'], lop: [] }))
  d.sql.prepare(`INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,visibility,purpose)
    VALUES('sai1','HS1','Q1','game','G1',1,0,'2026-09-29T01:00:00Z','2026-09-29','none','public','lam_cau')`).run()
  if (coHocLieu) d.sql.prepare(`INSERT INTO chua_loi_hoc_lieu(bam,content_version,qid_chuan,hoc_lieu_json,trang_thai,kiem_tra_luc,tao_luc,cap_nhat_luc)
    VALUES('b','v1','Q1',?,'du_dung',1,1,1)`).run(JSON.stringify(hocLieu))
  const token = await gameToken(d.env, 'HS1')
  return { ...d, token }
}

function dot(d: D1That, id = 'DOT1', qid = 'Q1', state = 'can_chan_doan', n = 1) {
  d.sql.prepare(`INSERT INTO chua_loi_dot(id,sbd,qid_chuan,cohort_id,mo_luc,trang_thai_day,lan_gap_lai,tao_luc,cap_nhat_luc)
    VALUES(?,'HS1',?,'pilot-chua-cau-sai-v1',?,?,?,1,1)`).run(id,qid,Date.parse('2026-09-29T01:00:00Z'),state,n)
}
function phien(d: D1That) {
  d.sql.prepare(`INSERT INTO chua_loi_phien(id,dot_id,sbd,qid_chuan,lan_gap_lai,tien_do_json,bat_dau_luc,tao_luc,cap_nhat_luc)
    VALUES('PH1','DOT1','HS1','Q1',1,?,1,1,1)`).run(JSON.stringify([{ buocId: 'm', thuTu: 0, tieuDe: 'Khối lượng mol', trangThai: 'chua_kiem', mucHoTroCaoNhat: 0, soVongHoTro: 0 }]))
}
function item(d: D1That, assisted = 0, answer = '40') {
  d.sql.prepare(`INSERT INTO chua_loi_item(id,phien_id,dot_id,sbd,thu_tu,loai,buoc_so,probe_ref,co_ho_tro,phat_luc,tao_luc)
    VALUES('IT1','PH1','DOT1','HS1',0,'chan_doan',0,?,?,1,1)`)
    .run(JSON.stringify({ ...probe.noiDungTrucTiep, dapAn: answer }), assisted)
}

describe('PR189 — hợp đồng API + migration thật trong SQLite', () => {
  it('Mở câu sai hợp lệ tạo đợt với đúng lược đồ migration', async () => {
    const d = await dung()
    const r = await moDot(d.env, { token: d.token, qid: 'Q1' })
    expect(r.status).toBe(200)
    expect((await r.json()).ok).toBe(true)
    expect(d.dem('chua_loi_dot')).toBe(1)
  })

  it('Phát chẩn đoán hợp lệ tạo item với đúng lược đồ migration', async () => {
    const d = await dung()
    dot(d); phien(d)
    const r = await phatItem(d.env, { token: d.token, dotId: 'DOT1' })
    const body = await r.json()
    expect(body.item.hoi).toContain('NaOH')
    expect(d.dem('chua_loi_item')).toBe(1)
  })

  it('Nộp đúng chẩn đoán phải lưu bằng chứng và tiến độ để sang bước tiếp', async () => {
    const d = await dung()
    dot(d); phien(d); item(d)
    const r = await nopItem(d.env, { token: d.token, dotId: 'DOT1', phienId: 'PH1', itemId: 'IT1', attemptId: 'A1', traLoi: '40' })
    expect((await r.json()).dung).toBe(true)
    const saved = d.sql.prepare("SELECT tien_do_json FROM chua_loi_phien WHERE id='PH1'").get() as { tien_do_json: string }
    expect(JSON.parse(saved.tien_do_json)[0].receiptChanDoan).toBeTruthy()
  })

  it('Xin gợi ý hợp lệ phải chạy được và lưu hỗ trợ vào item', async () => {
    const d = await dung()
    dot(d); phien(d); item(d)
    const r = await xinGoiY(d.env, { token: d.token, dotId: 'DOT1', itemId: 'IT1' })
    expect((await r.json()).noiDungGoiY).toContain('nguyên tố')
    const saved = d.sql.prepare("SELECT co_ho_tro FROM chua_loi_item WHERE id='IT1'").get() as { co_ho_tro: number }
    expect(saved.co_ho_tro).toBe(1)
  })

  it('Kết quả của item được giúp không được ghi thành tự làm', async () => {
    const d = await dung()
    dot(d); phien(d); item(d,1)
    await nopItem(d.env, { token: d.token, dotId: 'DOT1', phienId: 'PH1', itemId: 'IT1', attemptId: 'A1', traLoi: '40' })
    const saved = d.sql.prepare("SELECT co_ho_tro FROM chua_loi_nop WHERE attempt_id='A1'").get() as { co_ho_tro: number }
    expect(saved.co_ho_tro).toBe(1)
  })

  it('Số thập phân với dấu phẩy được chấm theo giá trị như dấu chấm', async () => {
    const d = await dung()
    dot(d); phien(d); item(d,0,'0.1')
    const r = await nopItem(d.env, { token: d.token, dotId: 'DOT1', phienId: 'PH1', itemId: 'IT1', attemptId: 'A1', traLoi: '0,10' })
    expect((await r.json()).dung).toBe(true)
  })

  it('Cờ bật thiếu phạm vi pilot phải đóng thay vì mở toàn trường', async () => {
    const d = await dung()
    d.sql.prepare("UPDATE cau_hinh SET gia_tri=? WHERE khoa='chua_cau_sai_v1'").run(JSON.stringify({ bat: true, cohort: 'pilot-chua-cau-sai-v1' }))
    expect(await tinhNangBat(d.env, { sbd: 'HS_KHONG_THUOC_PILOT' })).toBe(false)
  })

  it('Không nhận SBD query làm quyền xem tiến độ khi chưa có token', async () => {
    const d = await dung()
    dot(d)
    const r = await worker.fetch(new Request('https://test/hs/chua-cau-sai/tien-do?sbd=HS1&dotId=DOT1', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
    }), d.env)
    expect(r.status).toBe(401)
  })

  it('Ca kiểm tra đang mở chặn tiếp tục phát câu chữa', async () => {
    const d = await dung()
    dot(d); phien(d); item(d)
    const now = Date.now()
    d.sql.prepare(`INSERT INTO ca(ma_ca,ten_ca,lop,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc)
      VALUES('CA_MO','Ca mở','12','mo',?,?,60,'thi','khong','','x')`)
      .run(new Date(now - 60_000).toISOString(), new Date(now + 3_600_000).toISOString())
    expect(await coCaDangMo(d.env,'HS1',now)).toBe(true)
    const r = await phatItem(d.env,{ token: d.token,dotId: 'DOT1' })
    const body = await r.json()
    expect(body.item).toBeUndefined()
    expect(body.ok).toBe(false)
  })

  it('Đến hạn gặp lại 2 có đường phát bản kiểm độc lập', async () => {
    const d = await dung()
    dot(d,'DOT1','Q1','cho_gap_lai_2',1); phien(d)
    d.sql.prepare("UPDATE chua_loi_dot SET den_han='2026-10-06' WHERE id='DOT1'").run()
    const r = await phatItem(d.env,{ token: d.token,dotId: 'DOT1' })
    const body = await r.json()
    expect(body.trangThai).toBe('dang_kiem_chung')
    expect(body.item.loai).toBe('kiem_chung')
  })

  it('KPI giữ cả đợt trưởng thành bỏ dở và thiếu học liệu trong mẫu số', async () => {
    const d = await dung()
    dot(d,'DOT1','Q1','da_tu_sua',2); phien(d); item(d)
    dot(d,'DOT2','Q2','can_chan_doan',0)
    dot(d,'DOT3','Q3','thieu_hoc_lieu',1)
    d.sql.prepare(`INSERT INTO chua_loi_nop(id,attempt_id,item_id,phien_id,dot_id,sbd,dung,co_ho_tro,nop_luc,server_luc)
      VALUES('N1','A1','IT1','PH1','DOT1','HS1',1,0,1,1)`).run()
    const r = await thongKeKpi(d.env, new URLSearchParams())
    const body = await r.json()
    expect(body.mauSo).toBe(3)
    expect(body.tuSo).toBe(1)
    expect(body.kpiPhanTram).toBe(33.3)
  })

  it('KPI UI GET phải khớp hợp đồng Worker và nhận được dữ liệu', async () => {
    const d = await dung()
    const r = await worker.fetch(new Request('https://test/gv/chua-cau-sai/thong-ke'), d.env)
    expect(r.status).toBe(200)
    expect((await r.json()).ok).toBe(true)
  })
})
