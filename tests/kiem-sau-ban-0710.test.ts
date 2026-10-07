// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { demBan, quetSauBan } from '../scripts/loi-giai/kiem-sau-ban-0710'
import { taoD1That } from './_d1-that'

const ban = (i: number) => ({ de: `Câu hỏi đủ dữ liệu số ${i}`, pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'A', kiem: { d2: 'A', chac: true, lyDo2: 'Giải độc lập và chọn A.' } })
describe('cổng quét sáu bản: phân biệt số lượng và bằng chứng', () => {
  it('không tính bản trùng hoặc sáu bản chưa được kiểm là hoàn thành', () => {
    expect(demBan('I', Array.from({ length: 6 }, () => ban(1)))).toEqual({ duDuLieu: 1, coBangChung: 1 })
    expect(demBan('I', Array.from({ length: 6 }, (_, i) => ({ ...ban(i), kiem: { d2: 'A' } })))).toEqual({ duDuLieu: 6, coBangChung: 0 })
    expect(demBan('I', Array.from({ length: 6 }, (_, i) => ban(i)))).toEqual({ duDuLieu: 6, coBangChung: 6 })
  })
  it('lý do trắng, không chắc chắn hoặc đáp án lệch đều thiếu bằng chứng', () => {
    for (const kiem of [{ d2: 'A', chac: true, lyDo2: ' ' }, { d2: 'A', chac: false, lyDo2: 'Giải' }, { d2: 'B', chac: true, lyDo2: 'Giải' }]) {
      expect(demBan('I', [{ ...ban(1), kiem }]).coBangChung).toBe(0)
    }
  })
  it('phần II cần 24 ý khác nhau được kiểm, không đếm lặp một ý', () => {
    const ys = Array.from({ length: 24 }, (_, i) => ({ noi_dung: `Mệnh đề riêng số ${i}`, gia_tri: 'D', ly_do: 'Đúng theo định luật.', kiem_json: JSON.stringify({ d2: 'D', chac: true, lyDo2: 'Đối chiếu định luật.' }) }))
    expect(demBan('II', null, ys)).toEqual({ duDuLieu: 6, coBangChung: 6 })
    expect(demBan('II', null, ys.map(y => ({ ...y, noi_dung: 'Một ý lặp lại' })))).toEqual({ duDuLieu: 0, coBangChung: 0 })
  })
  it('JSON hỏng và lỗi truy vấn phải dừng thay vì báo kho đạt', async () => {
    expect(() => demBan('I', '{')).toThrow()
    await expect(quetSauBan(async () => { throw new Error('D1 hỏng') })).rejects.toThrow('D1 hỏng')
  })
  it('SQL thật loại tự luận và tờ xóa, chặn hoàn thành khi có câu chưa ánh xạ', async () => {
    const d = taoD1That()
    try {
      d.sql.prepare("INSERT INTO de_kho(ma_de,lop,da_xoa,cap_nhat_luc) VALUES ('KHO','12',0,'x'),('XOA','12',1,'x')").run()
      const ins = d.sql.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,json) VALUES (?,?,'v','g',?)")
      ins.run('KHO','a',JSON.stringify({ phan:'I',text:'Câu hỏi',choices:['a','b','c','d'],correct:'A' }))
      ins.run('KHO','tl',JSON.stringify({ phan:'III',text:'Chứng minh',correct:'abc',tuLuan:true }))
      ins.run('XOA','x',JSON.stringify({ phan:'I',text:'Câu hỏi',choices:['a','b','c','d'],correct:'A' }))
      const query = async (sql: string, params: unknown[]) => d.sql.prepare(sql).all(...params as (string | number)[]) as Record<string, unknown>[]
      expect(await quetSauBan(query)).toMatchObject({ tong:1,tuLuan:1,chuaAnhXa:1,conThieu:1,datCongKiem:false })
      d.sql.prepare("INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,lop,bo,cap_nhat_luc) VALUES ('a','bam','KHO','tn','12','BO','x')").run()
      d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cau_kiem_json,nhan_nen_json,buoc_json,cap_nhat_luc) VALUES ('bam','a',?,'[]','[]','[]','x')").run(JSON.stringify(Array.from({length:6},(_,i)=>ban(i))))
      expect(await quetSauBan(query)).toMatchObject({ tong:1,tuLuan:1,chuaAnhXa:0,duSauBangChung:1,conThieu:0,datCongKiem:true })
    } finally { d.sql.close() }
  })
})
