// SỬA LỖI 19/10 — em báo: "app tính câu này là em làm sai nhưng đáp án em (40) trùng đáp án đúng (40)" (màn "Sửa trên câu gốc").
// Nguyên nhân gốc (đọc dữ liệu thật, chỉ đọc): đợt tự sửa mở từ bài kiểm tra 01/10 — em ghi 5,88 (sai thật); 02/10 và 04/10 em làm lại trong game ĐÚNG 40.
// `hoa2-cau-chi-tiet` trả `emTraLoi` = lần làm game MỚI NHẤT ⇒ màn tự sửa ghi "Em đã trả lời lần trước: 40" cạnh "Đáp án đúng: 40".
// Khoá: (1) máy chủ, khi màn tự sửa xin `traLoiSai`, trả câu trả lời của lần SAI gần nhất (bài kiểm tra đọc `luot.dap_an_json`, game đọc lượt cùng phiên);
// không xin ⇒ y như cũ ("Câu đã làm", PDF không đổi); (2) app dùng lần sai; không có lần sai mà lần mới nhất lại đúng ⇒ không hiện như thể là lần sai.
// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import type { Env } from '../server/src/kieu'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))

import { taiCauGocDaLam, traLoiLanSai } from '../src/lib/chua-truc-tiep'
import type { ChiTietCau } from '../src/components/hoa2/api'

const NGAY = 86_400_000
const cau = (qid: string) => JSON.stringify({ qid, maDe: 'DE1', lop: '10', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'NB', sao: 1, kienThuc: ['k'], correct: 'B', reviewed: true, solution: { chot: `Cốt lõi ${qid}` } })

async function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','10A1','mk1','x')")
  d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Bảng tuần hoàn',20,0,'v1')")
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= 20; i++) st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, 'D1', cau(`Q${i}`))
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x')`)
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('lam_lai_khac','{"bat":false}','x')`)
  d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,cong_bo,thoi_gian_phut,cap_nhat_luc) VALUES('C1','KT','dong','thi','10A1','ngay',45,'x')")
  expect((await gvChienDich(env, { action: 'tao', ten: 'Bảng tuần hoàn', lop: '10A1', maDe: ['DE1'], hanNop: '2026-12-30', raiDeu: false }, Date.now() - 3 * NGAY)).ok).toBe(true)
  const token = await gameToken(env, 'S1')
  await gameV2(env, 'choose', { token, pet: 'dat_quy' })
  const r = await gameV2(env, 'hoc-tap-start', { token })
  const qs = (r.questions as { qid: string }[]).map((x) => x.qid).filter((q) => q.startsWith('Q'))
  return { d, env, token, session: r.id as string, qs }
}

/** Bài kiểm tra C1 (đã nộp, cách đây 2 ngày): em chọn `chon` ở câu `qid` và bị chấm sai. */
function saiTrongBai(d: ReturnType<typeof taoD1That>, qid: string, dapAnJson: Record<string, unknown>) {
  const luc = new Date(Date.now() - 2 * NGAY).toISOString()
  d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,dap_an_json,cap_nhat_luc) VALUES('C1|S1|1','C1','S1',1,?,?,'da_nop',?,?)").run(luc, luc, JSON.stringify(dapAnJson), luc)
  d.sql.prepare("INSERT INTO su_kien_hoc (khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,giay,luc,ngay_vn) VALUES (?,'S1',?,'thi','C1',1,0,30,?,?)").run(`thi|C1|S1|${qid}|1`, qid, luc, luc.slice(0, 10))
}

type CauTra = { de: { qid: string }; dapAn: string; emTraLoi: string | null; emTraLoiSai?: string | null }

describe('hoa2-cau-chi-tiet — câu trả lời của lần SAI cho màn tự sửa (sửa lỗi 19/10)', () => {
  it('sai ở bài kiểm tra rồi làm lại ĐÚNG trong game: xin `traLoiSai` ⇒ trả câu trả lời của bài kiểm tra; không xin ⇒ y như cũ', async () => {
    const { d, env, token, session, qs } = await dung()
    const q = qs[0]!
    saiTrongBai(d, q, { phanI: { [q]: 'C' }, phanII: {}, phanIII: {} })
    await gameV2(env, 'answer', { token, session, qid: q, answer: 'B' }) // lần làm mới nhất ĐÚNG
    const cu = (await gameV2(env, 'hoa2-cau-chi-tiet', { token, qid: q })).cau as CauTra[]
    expect(cu[0]).toMatchObject({ dapAn: 'B', emTraLoi: 'B' })
    expect(cu[0]).not.toHaveProperty('emTraLoiSai')
    const moi = (await gameV2(env, 'hoa2-cau-chi-tiet', { token, qid: q, traLoiSai: true })).cau as CauTra[]
    expect(moi[0]).toMatchObject({ dapAn: 'B', emTraLoi: 'B', emTraLoiSai: 'C' })
  })

  it('sai trong game ⇒ câu trả lời của lượt game sai; chưa sai lần nào ⇒ emTraLoiSai null', async () => {
    const { env, token, session, qs } = await dung()
    await gameV2(env, 'answer', { token, session, qid: qs[0], answer: 'A' })
    await gameV2(env, 'answer', { token, session, qid: qs[1], answer: 'B' })
    const a = (await gameV2(env, 'hoa2-cau-chi-tiet', { token, qid: qs[0], traLoiSai: true })).cau as CauTra[]
    expect(a[0]).toMatchObject({ emTraLoi: 'A', emTraLoiSai: 'A' })
    const b = (await gameV2(env, 'hoa2-cau-chi-tiet', { token, qid: qs[1], traLoiSai: true })).cau as CauTra[]
    expect(b[0]).toMatchObject({ emTraLoi: 'B', emTraLoiSai: null })
  })

  it('Phần II ở bài kiểm tra (mảng, ô trống) ⇒ chuỗi bốn ý, ô trống là "-"', async () => {
    const { d, env, token, session, qs } = await dung()
    const q = qs[0]!
    saiTrongBai(d, q, { phanI: {}, phanII: { [q]: ['S', null, 'D', 'D'] }, phanIII: {} })
    await gameV2(env, 'answer', { token, session, qid: q, answer: 'B' })
    const r = (await gameV2(env, 'hoa2-cau-chi-tiet', { token, qid: q, traLoiSai: true })).cau as CauTra[]
    expect(r[0]!.emTraLoiSai).toBe('S-DD')
  })
})

describe('màn tự sửa — "Em đã trả lời lần trước" là lần SAI', () => {
  const CT: ChiTietCau = { de: { qid: 'DH-10-C2-B7-III-14', phan: 'III', text: 'Phần trăm khối lượng của X trong oxide cao nhất?', hinhAnh: [], tenDang: '', mucDo: null, maDe: 'DH-10-C2-B7', sao: null }, dapAn: '40', loiGiai: null, emTraLoi: '40' }
  afterEach(() => { vi.unstubAllGlobals() })

  it('ca thật của em 10009: lần mới nhất 40 (đúng), lần sai 5,88 ⇒ màn hiện 5,88, không hiện 40', async () => {
    const cuoc: Record<string, unknown>[] = []
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init?: { body?: string }) => {
      cuoc.push(JSON.parse(init?.body || '{}'))
      return { ok: true, status: 200, json: async () => ({ ok: true, cau: [{ ...CT, emTraLoiSai: '5,88' }] }) }
    }))
    const r = await taiCauGocDaLam('tk', 'DH-10-C2-B7-III-14')
    expect(r.trangThai).toBe('co')
    expect(r.trangThai === 'co' && r.ct.emTraLoi).toBe('5,88')
    expect(cuoc[0]).toMatchObject({ qid: 'DH-10-C2-B7-III-14', traLoiSai: true })
  })

  it('không tìm được lần sai (máy chủ cũ / kênh chưa lưu) mà lần mới nhất ĐÚNG ⇒ không hiện câu trả lời đúng như thể là lần sai', () => {
    expect(traLoiLanSai(CT)).toBeNull()
    expect(traLoiLanSai({ ...CT, emTraLoiSai: null })).toBeNull()
    expect(traLoiLanSai({ ...CT, emTraLoi: '60' })).toBe('60') // lần mới nhất sai ⇒ vẫn hiện
    expect(traLoiLanSai({ ...CT, tuLuan: true })).toBe('40') // tự luận không chấm ⇒ giữ nguyên
  })
})
