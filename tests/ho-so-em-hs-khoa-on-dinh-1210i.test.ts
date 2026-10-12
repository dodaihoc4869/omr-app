// @vitest-environment node
// ĐỢT 16 (12/10 — thầy: "số giây hiển thị cho cả việc làm câu dễ khó, chỗ các câu học sinh chưa chữa đc bấm vào phải nảy vào đúng chỗ tự sửa"):
//  · khoá câu bản học sinh / phụ huynh CỐ ĐỊNH theo mã (hai lệnh hồ sơ thái độ + lịch sử cùng khoá ⇒ ghép được số giây "Câu đúng" / "Câu đã ôn");
//  · câu sai mang `moChua` = khoá "g<số>" băm mã GỐC; màn Tự chữa băm danh sách của nó bằng cùng hàm ⇒ mở đúng câu; không mã nội bộ xuống máy.
import { expect, it } from 'vitest'
import { banHocSinhHoSoThaiDo, banHocSinhLichSu, khoaMoChua, taoKhoaCau } from '../server/src/ho-so-em-hs-loc'
import { timMucChua } from '../src/components/hoc-tap/ManTuChua'
import type { MucChua } from '../src/lib/chua-cau-sai-api'
import type { KetQuaLichSuLamCau } from '../server/src/lich-su-lam-cau-kieu'
import type { KetQuaHoSoThaiDo } from '../server/src/bai-hang-ngay-kieu'

it('cùng mã ⇒ cùng khoá ở hai lần tạo bộ khoá; mã khác ⇒ khoá khác; dạng c<số>', () => {
  const a = taoKhoaCau(), b = taoKhoaCau()
  const ma = Array.from({ length: 3000 }, (_, i) => `DH-B${i % 40}-${['I', 'II', 'III'][i % 3]}-${i}`)
  const ka = ma.map(a), kb = [...ma].reverse().map(b).reverse()
  expect(ka).toEqual(kb)
  expect(new Set(ka).size).toBe(ma.length)
  expect(ka.every((k) => /^c\d+$/.test(k))).toBe(true)
  expect(ka.some((k, i) => k.includes(ma[i]!))).toBe(false)
})

it('lịch sử bản em: câu sai có moChua (khoá băm mã gốc, không mã thật); khoá câu khớp khoá của hồ sơ thái độ', () => {
  const ls = { lan: [{ qid: 'DH-B8-I-3', tieuDe: '', chon: 'B', luc: '2026-10-12T02:00:00Z', dung: false, giay: 21 }], cauSai: [{ qid: 'DH-B8-I-3', tieuDe: 'Amine', mucDo: 'hieu', soLan: 1, soSai: 1, soDung: 0, lanCuoiDung: false, lanCuoi: '2026-10-12T02:00:00Z', giaySai: [21] }] } as unknown as KetQuaLichSuLamCau
  const td = { cauDung: [{ qid: 'DH-B8-I-3', tieuDe: '', soLan: 2 }], cauDaOn: [], canhBao: [] } as unknown as KetQuaHoSoThaiDo
  const hsLs = banHocSinhLichSu(ls), hsTd = banHocSinhHoSoThaiDo(td)
  expect(hsLs.cauSai[0]!.moChua).toBe(khoaMoChua('DH-B8-I-3'))
  expect(hsLs.cauSai[0]!.moChua).toMatch(/^g\d+$/)
  expect(JSON.stringify(hsLs)).not.toMatch(/DH-B8/)
  expect(hsLs.cauSai[0]!.qid).toMatch(/^c\d+$/)
  expect(hsLs.lan[0]!.qid).toBe(hsLs.cauSai[0]!.qid)
  expect(hsTd.cauDung[0]!.qid).toBe(hsLs.cauSai[0]!.qid)
  expect(hsLs.lan[0]!.chon).toBeNull()
})

it('màn Tự chữa khớp khoá từ Hồ sơ với danh sách của nó (cả bản lượt "#n" / song sinh "~ssn" / "tc:"), không có ⇒ không khớp', () => {
  const m = (qid: string, trangThai = 'can_chua') => ({ qid, trangThai }) as unknown as MucChua
  const ds = [m('DH-B1-I-2'), m('tc:DH-B8-II-5'), m('DH-B8-I-3', 'da_tu_sua'), m('DH-B8-I-3#2')]
  expect(timMucChua(ds, khoaMoChua('DH-B8-II-5~ss1'))?.qid).toBe('tc:DH-B8-II-5')
  expect(timMucChua(ds, khoaMoChua('DH-B8-I-3'))?.qid).toBe('DH-B8-I-3#2') // đợt đang mở trước đợt đã sửa xong
  expect(timMucChua(ds, khoaMoChua('DH-B9-I-1'))).toBeUndefined()
  expect(timMucChua(ds, 'DH-B1-I-2')?.qid).toBe('DH-B1-I-2') // mã thường (Tự chữa câu này) như cũ
})
