// DÙNG CHUNG cho các test đã CHUYỂN LUẬT từ báo cáo cũ `BaoCaoCaThiHocSinhModal` (xoá 28/09, thầy cho phép) sang báo cáo BẢN MỚI
// phía học sinh: `ca-thi/BaoCaoCaCuaEm` (nạp) → `ca-thi/BaoCaoChiTiet` chế độ `hs` (vẽ), số liệu dựng bằng `lib/bao-cao-cua-em`.
// Không phải tệp test (không đuôi .test) — chỉ gom nguồn + một hàm vẽ để các luật cũ kiểm đúng một bản.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render } from '@testing-library/react'
import BaoCaoChiTiet, { type BaoCaoChiTietProps } from '../src/components/ca-thi/BaoCaoChiTiet'
import { baoCaoCuaEm, type DongCaCuaEm } from '../src/lib/bao-cao-cua-em'

export const TEP_BAO_CAO_EM_MOI = ['src/components/ca-thi/BaoCaoCaCuaEm.tsx', 'src/components/ca-thi/BaoCaoChiTiet.tsx', 'src/lib/bao-cao-cua-em.ts'] as const

const doc = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')
export const boChuThich = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/** Nguồn báo cáo bản mới phía em (đã bỏ chú thích — chú thích được phép NHẮC luật). */
export const nguonBaoCaoEmMoi = (): string => TEP_BAO_CAO_EM_MOI.map((f) => boChuThich(doc(f))).join('\n')

/** Một dòng `/hs/lich-su` đã công bố + các câu `/hs/cau-da-thi` của đúng ca ấy. */
export const CA_MAU: DongCaCuaEm = { maCa: 'CA-MAU', tenCa: 'Kiểm tra 45 phút', tong: 7.25, diemI: 3.75, diemII: 2.5, diemIII: 1, soCauDung: 2, tongCau: 4, soCauDungMotPhan: 1 }
export const CAU_MAU = [
  { maCa: 'CA-MAU', qid: 'q1', phan: 'I', soCau: 1, dungSai: true, dapAnChon: 'A', dapAnDung: 'A', chuyenDe: 'Ester', mucDo: 'NB', text: 'Câu một', choices: ['a', 'b', 'c', 'd'] },
  { maCa: 'CA-MAU', qid: 'q2', phan: 'I', soCau: 2, dungSai: false, dapAnChon: 'B', dapAnDung: 'C', chuyenDe: 'Ester', mucDo: 'TH', text: 'Câu hai', choices: ['a', 'b', 'c', 'd'] },
  { maCa: 'CA-MAU', qid: 'q3', phan: 'II', soCau: 1, dungSai: false, dapAnChon: 'DDSD', dapAnDung: 'DDSS', chuyenDe: 'Amine', mucDo: 'VD', text: 'Câu ba', ideas: ['a', 'b', 'c', 'd'] },
  { maCa: 'CA-MAU', qid: 'q4', phan: 'III', soCau: 1, dungSai: true, dapAnChon: '12', dapAnDung: '12', chuyenDe: 'Amine', mucDo: 'VD', text: 'Câu bốn' },
]

/** Vẽ báo cáo bản mới đúng như `BaoCaoCaCuaEm` vẽ cho em (không cổng, không mạng). */
export function veBaoCaoEmMoi(ca: DongCaCuaEm = CA_MAU, cau: unknown[] | null = CAU_MAU, them: Partial<BaoCaoChiTietProps> = {}) {
  return render(
    <BaoCaoChiTiet
      cheDo="hs"
      khongCong
      maCa={ca.maCa}
      tenCa="Kiểm tra 45 phút"
      lopCa=""
      ngay="26/09/2026"
      gioNop="09:42 · Thứ Bảy 26/09/2026"
      thoiGianPhut={null}
      siSo={0}
      lop={null}
      them={null}
      dangTai={false}
      dsEm={[]}
      tab="em"
      onTab={() => {}}
      sbdEm="12001"
      onChonEm={() => {}}
      emBc={baoCaoCuaEm(ca, cau)}
      xuHuongEm={null}
      mucDo={[]}
      onDong={() => {}}
      {...them}
    />,
  )
}
