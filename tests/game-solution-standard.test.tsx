import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {LoiGiaiCauSai} from '../src/components/KhoiCauSai'
describe('Lời giải game dùng khung vàng chung',()=>{
 it('đọc JSON kho, đủ kiến thức và lý do, định dạng hoá học',()=>{
  const html=renderToStaticMarkup(<LoiGiaiCauSai hoaHoc c={{phan:'I',dapAnDung:'D',loiGiai:JSON.stringify({chot:'Cu(OH)2 màu xanh',tung_pa:{A:{dung:false,vi_sao:'Sai A'},B:{dung:false,vi_sao:'Sai B'},C:{dung:false,vi_sao:'Sai C'},D:{dung:true,vi_sao:'Đúng D'}}})}}/> )
  expect(html).toContain('bg-amber-50');expect(html).toContain('KIẾN THỨC CỐT LÕI');expect(html).toContain('Đúng D');expect(html).not.toContain('tung_pa');expect(html).toContain('<sub')
 })
 it('phần II lấy dấu đúng sai theo đáp án, không coi SSDD là một phương án',()=>{
  const html=renderToStaticMarkup(<LoiGiaiCauSai hoaHoc c={{phan:'II',dapAnDung:'SSDD',loiGiai:{tung_y:{a:{vi_sao:'a'},b:{vi_sao:'b'},c:{vi_sao:'c'},d:{vi_sao:'d'}}}}}/>)
  expect(html).toContain('VÌ SAO ĐÚNG / SAI TỪNG Ý');expect(html.match(/✓/g)).toHaveLength(2);expect(html.match(/✗/g)).toHaveLength(2)
 })
 it('phần III giữ đầy đủ các bước; lời giải thiếu không tự bịa',()=>{
  const html=renderToStaticMarkup(<LoiGiaiCauSai hoaHoc c={{phan:'III',dapAnDung:'0,5',loiGiai:{chot:'Bảo toàn khối lượng',buoc:['Tính số mol','Tính khối lượng']}}}/>)
  expect(html).toContain('LÀM TỪNG BƯỚC');expect(html).toContain('Tính số mol');expect(html).toContain('Tính khối lượng')
  expect(renderToStaticMarkup(<LoiGiaiCauSai hoaHoc c={{loiGiai:null}}/>)).toContain('trong kho chưa có lời giải')
 })
})
