import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {LoiGiaiCauSai} from '../src/components/KhoiCauSai'
// CHUẨN HIỂN THỊ LỜI GIẢI (docs/hop-dong-game-hoa-2.md:53, sửa có chủ ý 06/10): LoiGiaiCauSai = khối LỜI GIẢI chuẩn của TheCau
// (LỜI GIẢI → Kiến thức cốt lõi → từng phương án/ý ✓ ✗ → bước → kết quả), KHÔNG còn khung Tailwind amber tự vẽ.
describe('Lời giải game dùng khối LỜI GIẢI chuẩn',()=>{
 it('đọc JSON kho, đủ kiến thức và lý do, định dạng hoá học',()=>{
  const html=renderToStaticMarkup(<LoiGiaiCauSai hoaHoc c={{phan:'I',dapAnDung:'D',loiGiai:JSON.stringify({chot:'Cu(OH)2 màu xanh',tung_pa:{A:{dung:false,vi_sao:'Sai A'},B:{dung:false,vi_sao:'Sai B'},C:{dung:false,vi_sao:'Sai C'},D:{dung:true,vi_sao:'Đúng D'}}})}}/> )
  expect(html).toContain('class="loi-giai"');expect(html).not.toContain('bg-amber-50');expect(html).toContain('LỜI GIẢI');expect(html).toContain('Kiến thức cốt lõi');expect(html).toContain('Đúng D');expect(html).not.toContain('tung_pa');expect(html).toContain('<sub')
  expect(html.indexOf('LỜI GIẢI')).toBeLessThan(html.indexOf('Kiến thức cốt lõi'));expect(html.indexOf('Kiến thức cốt lõi')).toBeLessThan(html.indexOf('Sai A'))
 })
 it('phần II lấy dấu đúng sai theo đáp án, không coi SSDD là một phương án',()=>{
  const html=renderToStaticMarkup(<LoiGiaiCauSai hoaHoc c={{phan:'II',dapAnDung:'SSDD',loiGiai:{tung_y:{a:{vi_sao:'a'},b:{vi_sao:'b'},c:{vi_sao:'c'},d:{vi_sao:'d'}}}}}/>)
  expect(html.match(/✓/g)).toHaveLength(2);expect(html.match(/✗/g)).toHaveLength(2);expect(html).toContain('a)');expect(html).toContain('d)')
 })
 it('phần III giữ đầy đủ các bước và kết quả; lời giải thiếu không tự bịa',()=>{
  const html=renderToStaticMarkup(<LoiGiaiCauSai hoaHoc c={{phan:'III',dapAnDung:'0,5',loiGiai:{chot:'Bảo toàn khối lượng',buoc:['Tính số mol','Tính khối lượng']}}}/>)
  expect(html).toContain('Tính số mol');expect(html).toContain('Tính khối lượng');expect(html).toContain('lg-buoc');expect(html).toContain('lg-ket-qua');expect(html).toContain('0,5')
  const thieu=renderToStaticMarkup(<LoiGiaiCauSai hoaHoc c={{loiGiai:null}}/>)
  expect(thieu).toContain('Thầy chưa nhập lời giải cho câu này.');expect(thieu).not.toContain('Kiến thức cốt lõi')
 })
 it('lời giải dạng chữ (kho cũ) ⇒ hiện như một khối, có nhãn LỜI GIẢI',()=>{
  const html=renderToStaticMarkup(<LoiGiaiCauSai c={{phan:'I',dapAnDung:'A',loiGiai:'Este no đơn chức có công thức CnH2nO2.'}}/>)
  expect(html).toContain('LỜI GIẢI');expect(html).toContain('Este no')
 })
})
