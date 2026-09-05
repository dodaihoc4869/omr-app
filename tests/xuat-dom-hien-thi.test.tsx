// XUẤT DOM THẬT của thẻ câu để chạy 13 PHÉP KIỂM HIỂN THỊ ở khổ 360px.
//
// Vì sao tách làm hai bước: jsdom KHÔNG tính bố cục (getBoundingClientRect trả
// 0, getComputedStyle không áp stylesheet ngoài), nên 13 phép kiểm không thể
// chạy ở đây. Bước này chỉ dựng DOM THẬT từ component thật rồi ghi ra file;
// scripts/kiem-13.mjs mở file đó bằng Chromium kèm CSS ĐÃ BUILD và chấm.
//
// Cấm chụp màn hình để kiểm tra — chấm bằng getComputedStyle và số đo, không
// bằng mắt nhìn ảnh.
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import TheCau from '../src/components/TheCau'

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Ảnh 1x1 trong suốt — đủ để dựng khung .cau-hinh, không cần ảnh thật.
const ANH_1PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

describe('xuất DOM cho phép kiểm hiển thị', () => {
  it('dựng thẻ câu Phần I đầy đủ (đề, bảng, hình, lời giải) và ghi ra file', () => {
    const { container } = render(
      <TheCau
        cheDo="xem_lai"
        phan="I"
        stt={13}
        tieuDe="Nhiệt hoá học"
        id="cau-13"
        text={
          'Phản ứng đốt cháy methane $\\ce{CH4}$ toả nhiệt lớn. Cho nhiệt tạo thành chuẩn ' +
          'của các chất theo bảng. Nhiệt lượng toả ra khi đốt cháy 1 kg $\\ce{CH4}$ tương ' +
          'đương k số điện (1 số điện = 3600 kJ). Giá trị của k là bao nhiêu?'
        }
        table={[
          ['Chất', '$\\ce{CH4(g)}$', '$\\ce{O2(g)}$', '$\\ce{CO2(g)}$', '$\\ce{H2O(g)}$'],
          ['$\\Delta_f H^{\\circ}_{298}$ (kJ/mol)', '−74,9', '0', '−393,5', '−241,8'],
        ]}
        hinhAnh={[{ src: ANH_1PX, viTri: 'sau_de', alt: 'Hình minh hoạ' }]}
        choices={['12.', '13.', '14.', '15.']}
        choicePerm={[0, 1, 2, 3]}
        selected="B"
        correct="C"
        loiGiai={{
          chot:
            'ΔrH° = (−393,5 − 2·241,8) − (−74,9) = −802,2 kJ/mol; 1 kg $\\ce{CH4}$ ứng với ' +
            '1000/16 = 62,5 mol.',
          tungPa: {
            A: { dung: false, viSao: '12 số điện chỉ là 43 200 kJ, nhỏ hơn nhiệt lượng 50 137,5 kJ tính được.' },
            B: { dung: false, viSao: '13 số điện là 46 800 kJ, vẫn nhỏ hơn 50 137,5 kJ.' },
            C: { dung: true, viSao: '62,5 · 802,2 = 50 137,5 kJ; chia 3600 được 13,93, làm tròn thành 14.' },
            D: { dung: false, viSao: '15 số điện là 54 000 kJ, lớn hơn nhiệt lượng thu được.' },
          },
        }}
        nhanLoiGiai="khop"
      />,
    )

    const html = container.innerHTML
    // Bốn mốc bắt buộc phải có mặt, nếu không phép kiểm sau sẽ "đạt" vì rỗng.
    for (const lop of ['cau-de', 'pa-hang', 'pa-ma', 'pa-noi-dung', 'lg-chot', 'lg-chu', 'cau-hinh', 'cau-bang', 'the-cau']) {
      expect(html).toContain(lop)
    }
    const ra = resolve(GOC, '.kiem-hien-thi/the-cau.html')
    mkdirSync(dirname(ra), { recursive: true })
    writeFileSync(ra, html, 'utf8')
  })
})
