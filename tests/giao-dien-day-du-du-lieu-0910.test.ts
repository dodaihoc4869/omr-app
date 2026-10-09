import { describe, expect, it } from 'vitest'
import { docHoc2 } from '../src/lib/ph-v3/du-lieu'
import { docTuyen } from '../src/components/ph-v3/tien-ich'
describe('Nguồn của giao diện đầy đủ', () => {
  it('chỉ đọc tầng máy chủ đã chốt, không suy tầng từ số câu đã làm', () => {
    expect(docHoc2({ok:true,cheDo2:true,homNay:{tong:36,daLam:36}})?.hanhTrinh).toBeUndefined()
    expect(docHoc2({ok:true,cheDo2:true,serverNow:1791504000000,hanhTrinh:{tang:2,toiThieu:30}})).toMatchObject({serverNow:1791504000000,hanhTrinh:{tang:2,toiThieu:30}})
    for (const hanhTrinh of [{tang:5,toiThieu:36},{tang:'2',toiThieu:30},{tang:2,toiThieu:0},{tang:2,toiThieu:Infinity}]) expect(docHoc2({ok:true,cheDo2:true,hanhTrinh})?.hanhTrinh).toBeUndefined()
  })
  it('liên kết lịch sử cũ và mới cùng nguồn; Lời thầy là màn riêng', () => {
    expect(docTuyen('#lich-su')).toEqual(docTuyen('#ca-kiem-tra'))
    expect(docTuyen('#diem')).toEqual(docTuyen('#ca-kiem-tra'))
    expect(docTuyen('#loi-thay')).toEqual({muc:'loi-thay',maCa:null})
    expect(docTuyen('#thong-tin')).toEqual({muc:'thong-tin',maCa:null})
  })
})
