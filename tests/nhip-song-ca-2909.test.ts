// @vitest-environment node
// NHỊP SỐNG CỦA MÀN THEO DÕI CA (thầy 29/09: "phần trên cho đồng bộ trực tiếp thời gian thực luôn").
// Máy chủ: POST /ca/nhip — chỉ đọc, đòi mã bí mật, trả tiến độ từng em ĐỔI từ mốc `sau` + dấu vết (đổi khi em vào/nộp/bị khoá, thêm phút…), KHÔNG đáp án.
// Máy thầy: gộp theo SBD, phủ số câu/rời màn lên lượt đang làm, mốc hết giờ muộn nhất cho đồng hồ tự nhích.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { docNhipCa, gopTienDoSong, hetLucMuonNhat, phuTienDoSong, NHIP_SONG_CA_MS, CACH_TAI_DAY_MS, type TienDoSong } from '../src/lib/nhip-song-ca'
import { TUY_CHON_NHIP_THAY } from '../src/lib/nhip-may-thay'

function dung(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,thoi_gian_phut,cap_nhat_luc) VALUES('C1','Ca 1','mo','thi',45,'2026-09-29T01:00:00.000Z')").run()
  const luot = (sbd: string, tt: string) =>
    d.sql
      .prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,dap_an_json,cap_nhat_luc) VALUES(?,?,?,1,'2026-09-29T01:00:00.000Z',?,'{\"q1\":\"A\"}','2026-09-29T01:00:00.000Z')")
      .run(`C1|${sbd}|1`, 'C1', sbd, tt)
  luot('A', 'dang_lam')
  luot('B', 'dang_lam')
  const tt = (sbd: string, maCa: string, daLam: number, roi: number, luc: string) =>
    d.sql
      .prepare('INSERT INTO trang_thai(sbd,ma_ca,lop,dang_lam,bat_dau_luc,da_lam_cau_hoi,tong_cau_hoi,so_lan_roi_app,blocked,cap_nhat_luc) VALUES(?,?,?,1,?,?,14,?,0,?)')
      .run(sbd, maCa, '12A', '2026-09-29T01:00:00.000Z', daLam, roi, luc)
  tt('A', 'C1', 5, 0, '2026-09-29T01:05:00.000Z')
  tt('B', 'C1', 9, 1, '2026-09-29T01:06:00.000Z')
  tt('Z', 'C9', 3, 0, '2026-09-29T01:06:00.000Z') // em của ca khác — không được lẫn vào
  return d
}

describe('POST /ca/nhip (máy chủ)', () => {
  it('đòi mã bí mật', async () => {
    const r = await goiWorker(worker, dung().env, '/ca/nhip', { maCa: 'C1' })
    expect(r.ok).not.toBe(true)
  })

  it('lần đầu trả tiến độ mọi em CỦA CA NÀY + dấu vết + giờ máy chủ; không đáp án', async () => {
    const r = await goiWorker(worker, dung().env, '/ca/nhip', { maCa: 'C1', sau: '' }, true)
    expect(r.ok).toBe(true)
    expect(r.coCa).toBe(true)
    expect(typeof r.gioMayChu).toBe('number')
    expect(r.tt.map((x: TienDoSong) => [x.sbd, x.daLam, x.soLanRoiMan])).toEqual([
      ['A', 5, 0],
      ['B', 9, 1],
    ])
    expect(r.moc).toBe('2026-09-29T01:06:00.000Z')
    expect(typeof r.dauVet).toBe('string')
    expect(JSON.stringify(r)).not.toContain('"q1"')
  })

  it('có `sau` thì chỉ trả dòng đổi từ mốc đó; lưu tạm đáp án KHÔNG đổi dấu vết, em nộp thì đổi', async () => {
    const d = dung()
    const r1 = await goiWorker(worker, d.env, '/ca/nhip', { maCa: 'C1', sau: '' }, true)
    const r2 = await goiWorker(worker, d.env, '/ca/nhip', { maCa: 'C1', sau: r1.moc }, true)
    expect(r2.tt.map((x: TienDoSong) => x.sbd)).toEqual(['B']) // `>=` mốc: dòng ở đúng mốc được trả lại, máy thầy gộp trùng
    expect(r2.dauVet).toBe(r1.dauVet)
    d.sql.prepare("UPDATE luot SET dap_an_json='{\"q1\":\"B\"}', cap_nhat_luc='2026-09-29T01:07:00.000Z' WHERE sbd='A'").run()
    expect((await goiWorker(worker, d.env, '/ca/nhip', { maCa: 'C1', sau: r1.moc }, true)).dauVet).toBe(r1.dauVet)
    d.sql.prepare("UPDATE luot SET trang_thai='da_nop', nop_luc='2026-09-29T01:08:00.000Z' WHERE sbd='A'").run()
    expect((await goiWorker(worker, d.env, '/ca/nhip', { maCa: 'C1', sau: r1.moc }, true)).dauVet).not.toBe(r1.dauVet)
  })

  it('thêm phút / đóng ca đổi dấu vết; ca không có ⇒ coCa false; mốc lạ bị bỏ qua', async () => {
    const d = dung()
    const r1 = await goiWorker(worker, d.env, '/ca/nhip', { maCa: 'C1' }, true)
    d.sql.prepare("UPDATE ca SET them_phut_tong = 5 WHERE ma_ca='C1'").run()
    const r2 = await goiWorker(worker, d.env, '/ca/nhip', { maCa: 'C1' }, true)
    expect(r2.dauVet).not.toBe(r1.dauVet)
    d.sql.prepare("UPDATE ca SET trang_thai = 'dong' WHERE ma_ca='C1'").run()
    expect((await goiWorker(worker, d.env, '/ca/nhip', { maCa: 'C1' }, true)).dauVet).not.toBe(r2.dauVet)
    expect((await goiWorker(worker, d.env, '/ca/nhip', { maCa: 'KHONG' }, true)).coCa).toBe(false)
    const r3 = await goiWorker(worker, d.env, '/ca/nhip', { maCa: 'C1', sau: "' OR 1=1 --" }, true)
    expect(r3.tt).toHaveLength(2)
  })
})

describe('nhịp sống ở máy thầy', () => {
  const dong = (sbd: string, daLam: number, luc: string, roi = 0): TienDoSong => ({ sbd, dangLam: true, daLam, tongCau: 14, soLanRoiMan: roi, biChan: false, batDauLuc: '', capNhatLuc: luc })

  it('nhịp 3 s, giãn tối đa 6 s, lỗi lùi 10 → 20 s; tải đầy cách nhau ≥ 4 s', () => {
    expect(NHIP_SONG_CA_MS).toBe(3_000)
    expect(TUY_CHON_NHIP_THAY.songCa.tranMs).toBe(6_000)
    expect(TUY_CHON_NHIP_THAY.songCa.luiDanMs).toEqual([10_000, 20_000])
    expect(CACH_TAI_DAY_MS).toBeGreaterThanOrEqual(4_000)
  })

  it('docNhipCa: hình dạng lạ ⇒ null; dòng thiếu sbd bị bỏ', () => {
    expect(docNhipCa(null)).toBeNull()
    expect(docNhipCa({ ok: false })).toBeNull()
    const k = docNhipCa({ ok: true, coCa: true, gioMayChu: 5, dauVet: 'x', moc: 'm', tt: [{ sbd: 'A', dangLam: true, daLam: 3 }, { daLam: 1 }] })
    expect(k?.tt.map((x) => x.sbd)).toEqual(['A'])
    expect(k?.gioMayChu).toBe(5)
  })

  it('gộp giữ dòng mới hơn theo SBD', () => {
    const a = gopTienDoSong({}, [dong('A', 3, '2026-09-29T01:01:00Z')])
    const b = gopTienDoSong(a, [dong('A', 2, '2026-09-29T01:00:00Z'), dong('B', 1, '2026-09-29T01:02:00Z')])
    expect(b.A.daLam).toBe(3)
    expect(b.B.daLam).toBe(1)
  })

  it('phủ lên lượt ĐANG LÀM; bỏ qua dòng cũ hơn giờ vào (lượt trước) và lượt đã nộp', () => {
    const goc = { dangLam: true, vaoLuc: '2026-09-29T01:00:00Z', daLam: 2, soLanRoiMan: 0 }
    expect(phuTienDoSong(goc, dong('A', 7, '2026-09-29T01:03:00Z', 2))).toEqual({ daLam: 7, soLanRoiMan: 2 })
    expect(phuTienDoSong(goc, dong('A', 7, '2026-09-29T00:50:00Z', 2))).toEqual({ daLam: 2, soLanRoiMan: 0 })
    expect(phuTienDoSong({ ...goc, dangLam: false }, dong('A', 7, '2026-09-29T01:03:00Z', 2))).toEqual({ daLam: 2, soLanRoiMan: 0 })
    expect(phuTienDoSong({ ...goc, daLam: null }, dong('A', 4, '2026-09-29T01:03:00Z'))).toEqual({ daLam: 4, soLanRoiMan: 0 })
  })

  it('mốc hết giờ muộn nhất: ưu tiên hetGioLuc (đã gồm phút thêm), thiếu thì vào lúc + thời gian đề', () => {
    const t = Date.parse('2026-09-29T01:00:00Z')
    expect(hetLucMuonNhat([], 45)).toBeNull()
    expect(hetLucMuonNhat([{ dangLam: true, vaoLuc: '2026-09-29T01:00:00Z' }], 45)).toBe(t + 45 * 60_000)
    expect(
      hetLucMuonNhat(
        [
          { dangLam: true, vaoLuc: '2026-09-29T01:00:00Z', hetGioLuc: '2026-09-29T01:50:00Z' },
          { dangLam: false, vaoLuc: '2026-09-29T02:00:00Z' },
        ],
        45,
      ),
    ).toBe(t + 50 * 60_000)
  })

  it('nguồn: màn Theo dõi bật nhịp sống cho ca đang chạy; thẻ thông tin ca cũ đã gộp vào thẻ Thời gian', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf8')
    expect(src).toContain('NHIP_SONG_CA_MS,\n    caDangChay && !chieuMa,\n    TUY_CHON_NHIP_THAY.songCa,')
    expect(src).toContain('dongBoGioMayChu(kq.gioMayChu)')
    expect(src).not.toContain('Link gửi cho em')
    expect(src).not.toContain('<TheNoiDung className="gv-monitor-overview">')
    expect(src).toContain('</KhoiThoiGianCa>')
  })
})
