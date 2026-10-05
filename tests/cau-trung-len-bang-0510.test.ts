// @vitest-environment node
// CÂU TRÙNG NỘI DUNG CHỈ HIỆN MỘT LẦN KHI GỌI LÊN BẢNG (thầy 05/10) — khoá `khoaCau` (thân đề + phương án/ý):
//   · máy chủ chiến dịch: `nhomCauTrung` nhóm qid cùng nội dung; `gopCauTrung` giữ bản đứng trước, mang `qidCung` cả nhóm;
//   · Gọi lên bảng: `boCauTrungNoiDung` bỏ câu thêm trùng nội dung, câu của ca luôn giữ;
//   · Dạy học: `cauTuDeChon` bỏ bản trùng (kho đầu giờ thì giữ đủ mọi bản); Kiểm tra đầu giờ: một lượt không chiếu hai câu trùng nội dung.
import { describe, expect, it } from 'vitest'
import { gopCauTrung, nhomCauTrung } from '../server/src/srs2-gv'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { boCauTrungNoiDung, boTrungTrongBanDe, type BanDeCa } from '../src/lib/du-lieu-len-bang'
import type { CauChua } from '../src/lib/phan-cong'
import { cauTuDeChon } from '../src/lib/day-hoc-len-bang'
import { cauTheoQid, khoaNoiDungTheoKho } from '../src/lib/dau-gio-kho'
import { chonLuotDauGio } from '../src/lib/dau-gio'
import { qidCuaDong } from '../src/components/chien-dich/api'
import type { TeacherExamSource } from '../src/data/examContent'

const CAU_A = { text: 'Loại hạt mang điện tích âm?', choices: ['Electron.', 'Neutron.', 'Proton.', 'Photon.'], correct: 'A' }
const CAU_B = { text: 'Loại hạt không mang điện?', choices: ['Electron.', 'Neutron.', 'Proton.', 'Photon.'], correct: 'B' }

describe('máy chủ chiến dịch: nhóm + gộp câu trùng nội dung', () => {
  it('hai đề chép cùng câu ⇒ một nhóm (giữ thứ tự chiến dịch); câu khác ⇒ nhóm riêng; câu không có trong kho ⇒ nhóm riêng', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    const them = (maDe: string, qid: string, q: Record<string, unknown>) =>
      d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(maDe, qid, 'v1', `g-${qid}`, 'D1', JSON.stringify({ qid, maDe, phan: 'I', ...q }))
    them('DE1', 'DE1-I-44', CAU_A)
    them('DE2', 'DE2-I-3', { ...CAU_A, text: '  Loại hạt   mang điện tích âm? ' }) // chỉ khác khoảng trắng ⇒ vẫn trùng
    them('DE2', 'DE2-I-4', CAU_B)
    const nhom = await nhomCauTrung(env, ['DE2-I-3', 'DE1-I-44', 'DE2-I-4', 'LA-1'])
    expect(nhom.get('DE1-I-44')).toEqual(['DE2-I-3', 'DE1-I-44'])
    expect(nhom.get('DE2-I-3')).toEqual(['DE2-I-3', 'DE1-I-44'])
    expect(nhom.get('DE2-I-4')).toEqual(['DE2-I-4'])
    expect(nhom.get('LA-1')).toEqual(['LA-1'])
    const gop = gopCauTrung([{ qid: 'DE1-I-44', soEm: 3 }, { qid: 'DE2-I-4', soEm: 2 }, { qid: 'DE2-I-3', soEm: 1 }], nhom)
    expect(gop).toEqual([
      { qid: 'DE1-I-44', soEm: 3, qidCung: ['DE2-I-3', 'DE1-I-44'] },
      { qid: 'DE2-I-4', soEm: 2, qidCung: ['DE2-I-4'] },
    ])
    expect(gop.flatMap(qidCuaDong)).toEqual(['DE2-I-3', 'DE1-I-44', 'DE2-I-4'])
    expect(qidCuaDong({ qid: 'X' })).toEqual(['X'])
  })
})

describe('Gọi lên bảng: bỏ câu thêm trùng nội dung', () => {
  const c = (id: string): CauChua => ({ id, phan: 'I', so: 1, viTri: 0, chuyenDe: '', mucDo: '', sao: 1, lyDoSao: '', tomTat: '' } as unknown as CauChua)
  it('câu của ca luôn giữ (kể cả trùng nhau); câu thêm trùng ca hoặc trùng câu thêm trước ⇒ bỏ', () => {
    const khoa = new Map([['ca1', 'A'], ['ca2', 'A'], ['t1', 'A'], ['t2', 'B'], ['t3', 'B']])
    expect(boCauTrungNoiDung([c('ca1'), c('ca2'), c('t1'), c('t2'), c('t3'), c('t4')], khoa, new Set(['ca1', 'ca2'])).map((x) => x.id)).toEqual(['ca1', 'ca2', 't2', 't4'])
  })
})

describe('Gọi lên bảng: bộ đề thêm bỏ câu trùng trong nó', () => {
  it('bản trùng nội dung (kể cả khác khoảng trắng) bị bỏ, giữ bản đầu; không trùng ⇒ trả đúng đối tượng cũ', () => {
    const bank = { phanI: [{ id: 'a', ...CAU_A }, { id: 'b', ...CAU_B }, { id: 'c', ...CAU_A, text: ' Loại hạt  mang điện tích âm? ' }], phanII: [], phanIII: [] } as unknown as BanDeCa
    expect(boTrungTrongBanDe(bank).phanI.map((q) => q.id)).toEqual(['a', 'b'])
    const sach = { phanI: [{ id: 'a', ...CAU_A }], phanII: [], phanIII: [] } as unknown as BanDeCa
    expect(boTrungTrongBanDe(sach)).toBe(sach)
  })
})

describe('Dạy học / Kiểm tra đầu giờ', () => {
  const src = (maDe: string, ds: { id: string; q: typeof CAU_A }[]) => ({ maDe, nguon: maDe, phanI: ds.map((x) => ({ id: x.id, ...x.q })), phanII: [], phanIII: [] }) as unknown as TeacherExamSource
  const kho = [src('DE1', [{ id: 'DE1-I-44', q: CAU_A }, { id: 'DE1-I-45', q: CAU_B }]), src('DE2', [{ id: 'DE2-I-3', q: CAU_A }])]
  it('Dạy học: bản trùng nội dung chỉ hiện một lần; kho đầu giờ giữ đủ mọi bản để tra theo qid', () => {
    expect(cauTuDeChon(kho, new Set(['DE1', 'DE2'])).map((x) => x.khoa)).toEqual(['DE1-I-44', 'DE1-I-45'])
    expect(cauTuDeChon(kho, new Set(['DE1', 'DE2']), false).map((x) => x.khoa)).toEqual(['DE1-I-44', 'DE1-I-45', 'DE2-I-3'])
  })
  it('đầu giờ: một lượt không chiếu hai câu trùng nội dung cho hai em; câu đã dùng trong buổi chặn cả bản trùng', () => {
    const k = cauTheoQid(kho)
    const nd = khoaNoiDungTheoKho(k)
    const qa = [...k.values()].filter((x) => x.q.text === CAU_A.text).map((x) => x.qid)
    expect(qa).toHaveLength(2)
    const em = [
      { sbd: 'S1', hoTen: 'Em 1', cau: [{ qid: qa[0]!, chuyenDe: '', soLanDung: 1, lanCuoi: '2026-10-01T00:00:00Z', thanhThaoAo: false }] },
      { sbd: 'S2', hoTen: 'Em 2', cau: [{ qid: qa[1]!, chuyenDe: '', soLanDung: 1, lanCuoi: '2026-10-01T00:00:00Z', thanhThaoAo: false }] },
    ] as never
    const chon = chonLuotDauGio(em, { rng: () => 0, khoaNoiDung: nd })
    expect(chon).toHaveLength(1)
    expect(chonLuotDauGio(em, { rng: () => 0 })).toHaveLength(2) // không truyền khoá ⇒ như cũ
    expect(chonLuotDauGio(em, { rng: () => 0, khoaNoiDung: nd, cauDaDung: new Set([qa[0]!]) })).toHaveLength(0)
  })
})
