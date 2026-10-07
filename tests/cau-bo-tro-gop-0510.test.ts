// @vitest-environment node
// HỌC LIỆU BỔ TRỢ — nạp lại gói đề KHÔNG xoá bản khác máy soạn đã nối (điều phối 05/10, sau khi làn máy soạn gộp: `/kho/may-soan/nop-bo-tro` NỐI bản
// khác vào `cau_bo_tro.song_sinh_json`, còn `ghiCauBoTro` lúc nạp gói từng GHI ĐÈ cả hàng). Luật gộp (`gopSongSinh`): giữ mọi chỗ cũ (qid ảo "~ssN"
// không đổi nghĩa), chỗ của gói nhận bản gói cùng vị trí, khử trùng theo nội dung, trần 6. Kèm: đọc 6 bản (locBoTro), qid ảo ~ss0..11 (tachSongSinh).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { gopSongSinh, khoaBanSongSinh, locBoTro, type SongSinh } from '../server/src/cau-bo-tro'
import { cacQidSongSinh, CHO_SONG_SINH, tachSongSinh, TRAN_SONG_SINH } from '../server/src/loi-hoc-luat'
import { bamCau, cauTrongGoi } from '../src/lib/loi-giai-kiem'

const ss = (ten: string, dapAn = 'B'): SongSinh => ({ de: `Bản ${ten}: tính khối lượng`, pa: { A: `${ten}1`, B: `${ten}2`, C: `${ten}3`, D: `${ten}4` }, dap_an: dapAn })
const noi = (ten: string) => ({ ...ss(ten), nguon: 'may_soan_2_luot', qid_mau: 'Q', ma_de: 'DH-12-X', lop: '12', luc: '2026-10-05T00:00:00.000Z' })
const ten = (ds: readonly Record<string, unknown>[]) => ds.map((x) => String(x.de).slice(4, String(x.de).indexOf(':')))

describe('gopSongSinh (thuần)', () => {
  it('gói nạp lại y hệt ⇒ giữ nguyên mọi chỗ, kể cả bản máy soạn đã nối', () => {
    expect(ten(gopSongSinh([ss('P0'), ss('P1'), noi('M2'), noi('M3')], [ss('P0'), ss('P1')]))).toEqual(['P0', 'P1', 'M2', 'M3'])
    expect(gopSongSinh([ss('P0'), noi('M1')], [ss('P0')])[1]).toMatchObject({ nguon: 'may_soan_2_luot', ma_de: 'DH-12-X' }) // giữ mọi trường của bản nối
  })
  it('gói sửa bản của chính nó ⇒ thay ĐÚNG chỗ của gói; bản máy soạn không bị thay', () => {
    expect(ten(gopSongSinh([ss('P0'), ss('P1'), noi('M2')], [ss('P0x'), ss('P1')]))).toEqual(['P0x', 'P1', 'M2'])
    expect(ten(gopSongSinh([noi('M0'), noi('M1')], [ss('P0'), ss('P1'), ss('P2')]))).toEqual(['M0', 'M1', 'P0', 'P1', 'P2']) // chỗ máy soạn giữ; gói nối sau, trần 6
  })
  it('khử trùng theo NỘI DUNG (đề + phương án, bỏ khoảng trắng / dấu / hoa thường / thẻ HTML); gói đổi thứ tự ⇒ chỗ cũ không đổi', () => {
    const giongM2 = { ...ss('M2'), de: '  <b>BẢN M2</b>: tính   khối lượng. ' }
    expect(khoaBanSongSinh(giongM2)).toBe(khoaBanSongSinh(ss('M2')))
    expect(ten(gopSongSinh([ss('P0'), noi('M2')], [ss('P0'), giongM2]))).toEqual(['P0', 'M2'])
    expect(ten(gopSongSinh([ss('P0'), ss('P1')], [ss('P1'), ss('P0')]))).toEqual(['P0', 'P1'])
  })
  it('trần 6: không nối thêm khi đã đủ; KHÔNG bỏ chỗ lịch sử dài hơn mục tiêu', () => {
    expect(ten(gopSongSinh([ss('P0'), ss('P1'), noi('M2'), noi('M3'), noi('M4'), noi('M5')], [ss('P0'), ss('P1'), ss('P2')]))).toEqual(['P0', 'P1', 'M2', 'M3', 'M4', 'M5'])
    const dai = [ss('H0'), ss('H1'), noi('M2'), noi('M3'), noi('M4'), noi('M5'), noi('M6'), noi('M7')]
    expect(ten(gopSongSinh(dai, [ss('H0')]))).toEqual(['H0', 'H1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'])
    expect(gopSongSinh([], [ss('A'), ss('B'), ss('C'), ss('D'), ss('E'), ss('F'), ss('G')]).length).toBe(TRAN_SONG_SINH)
  })
  it('đọc: locBoTro giữ 6 bản của gói; danh sách qid ảo phủ 12 chỗ', () => {
    expect(locBoTro({ song_sinh: ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((x) => ss(x)) }).songSinh.length).toBe(6)
    expect(CHO_SONG_SINH).toBe(12)
    expect(cacQidSongSinh('Q')).toEqual(['Q', ...Array.from({ length: 12 }, (_, i) => i).map((i) => `Q~ss${i}`)])
    expect(tachSongSinh('Q~ss7#2')).toEqual({ goc: 'Q', songSinh: 7 })
  })
})

// ───────────────────────── qua Worker thật: /kho/day (nạp gói) sau khi máy soạn đã nối ─────────────────────────
const GOC = path.resolve(__dirname, '..')
const MAU = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json'), 'utf8')) as Record<string, { cau: Record<string, unknown> }>
const DE = '12-THU-GOP'
const cauGoi = (them: Record<string, unknown>) => ({ ...MAU['12-KT-C1-D4-I-6']!.cau, so: 6, ...them })
const thay = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b, true)
const dong = (d: D1That, bam: string) => d.sql.prepare('SELECT song_sinh_json, cau_kiem_json FROM cau_bo_tro WHERE bam = ?').get(bam) as { song_sinh_json: string; cau_kiem_json: string }

describe('/kho/day nạp lại gói ⇒ GỘP, không ghi đè bản máy soạn đã nối', () => {
  it('gói y hệt / gói sửa bản / gói chỉ có câu kiểm / gói bổ sung bản khi còn thiếu', async () => {
    const d = taoD1That()
    const goi = (them: Record<string, unknown>) => ({ cau: [cauGoi(them)] })
    const bam = await bamCau(cauTrongGoi(DE, goi({}))[0]!)
    const nap = async (them: Record<string, unknown>) => expect((await thay(d, '/kho/day', { maDe: DE, lop: '12', de: goi(them), cau: [] })).ok).toBe(true)

    await nap({ song_sinh: [ss('P0'), ss('P1')] })
    expect(ten(JSON.parse(dong(d, bam).song_sinh_json))).toEqual(['P0', 'P1'])
    // Máy soạn nối 2 bản (như hoc-lieu-may-soan.ts nhanVaGhiBanKhac: giữ chỗ cũ, bản mới mang nguon).
    d.sql.prepare('UPDATE cau_bo_tro SET song_sinh_json = ? WHERE bam = ?').run(JSON.stringify([ss('P0'), ss('P1'), noi('M2'), noi('M3')]), bam)

    await nap({ song_sinh: [ss('P0'), ss('P1')] }) // nạp lại y hệt — trước 05/10 mất M2, M3
    expect(ten(JSON.parse(dong(d, bam).song_sinh_json))).toEqual(['P0', 'P1', 'M2', 'M3'])
    expect(JSON.parse(dong(d, bam).song_sinh_json)[2]).toMatchObject({ nguon: 'may_soan_2_luot' })

    await nap({ song_sinh: [ss('P0x'), ss('P1')] }) // gói sửa bản đầu của nó
    expect(ten(JSON.parse(dong(d, bam).song_sinh_json))).toEqual(['P0x', 'P1', 'M2', 'M3'])

    await nap({ cau_kiem: [{ buoc: 0, kieu: 'so', hoi: 'Số mol?', dap_an: '0,1' }] }) // gói không còn song sinh, chỉ câu kiểm
    const sau = dong(d, bam)
    expect(ten(JSON.parse(sau.song_sinh_json))).toEqual(['P0x', 'P1', 'M2', 'M3'])
    expect(JSON.parse(sau.cau_kiem_json)).toEqual([{ buoc: 0, kieu: 'so', hoi: 'Số mol?', dap_an: '0,1', sai_so: '0.01' }])

    await nap({ song_sinh: [ss('P0x'), ss('P1'), ss('P2')] }) // còn thiếu hai ⇒ nối bản P2, giữ chỗ máy soạn
    expect(ten(JSON.parse(dong(d, bam).song_sinh_json))).toEqual(['P0x', 'P1', 'M2', 'M3', 'P2'])
  })
})
