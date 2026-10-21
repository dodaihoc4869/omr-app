import { afterEach, expect, it, vi } from 'vitest'
import { xepThuTuChua } from '../src/lib/thay-tu-chua'
import { layEmChieu, nhanEmChieu } from '../src/lib/ung-vien-chieu'
import { dungToChieuDayHoc, type CauDayHoc } from '../src/lib/day-hoc-len-bang'
const api=vi.hoisted(()=>vi.fn())
vi.mock('../src/lib/goi-lenh-thay',()=>({goiLenh:api}))
afterEach(()=>api.mockReset())
it('trộn ba nhóm chung: đủ câu, không trùng, không lần lượt nhóm; cùng buổi ổn định kể cả mảng vào đổi thứ tự',()=>{
 const ds=Array.from({length:9},(_,i)=>({qid:`q${i}`,phan:'I' as const,tinhToan:i<3,thuTuDe:i,q:{sao:i>=3&&i<6?3:0}}))
 const soLop=new Map(['q6','q7'].map(q=>[q,{sai:6,lam:10}]))
 const orders=Array.from({length:30},(_,i)=>xepThuTuChua([...ds,ds[3]!],soLop,`buoi${i}`).map(q=>q.qid))
 for(const r of orders){expect(new Set(r).size).toBe(9);expect(r.at(-1)).toBe('q8');expect(new Set(r.slice(0,8))).toEqual(new Set(ds.slice(0,8).map(q=>q.qid)))}
 expect(new Set(orders.map(r=>r.join())).size).toBeGreaterThan(15)
 expect(orders.some(r=>Number(r[0]?.slice(1))>=6&&Number(r[1]?.slice(1))<3)).toBe(true)
 expect(xepThuTuChua([...ds].reverse(),soLop,'buoi0').map(q=>q.qid)).toEqual(orders[0])
})
it('có mặt là cổng cứng; chọn đã đúng trước rồi mới năng lực cao nhất; rải em đã đúng trong nhiều câu',async()=>{
 api.mockResolvedValue({ok:true,du:{cau:{q1:[{sbd:'absent',ten:'Vắng',loai:'da_dung',p:0.99},{sbd:'A',ten:'An',loai:'da_dung',p:0.5},{sbd:'B',ten:'Bình',loai:'da_dung',p:0.7},{sbd:'C',ten:'Chi',loai:'du_bao',p:0.99}],q2:[{sbd:'A',ten:'An',loai:'da_dung',p:0.5},{sbd:'B',ten:'Bình',loai:'da_dung',p:0.7}],q3:[{sbd:'A',ten:'An',loai:'du_bao',p:0.5},{sbd:'C',ten:'Chi',loai:'du_bao',p:0.99}]}}})
 // 21/10: chế độ "Chắc đúng" = bộ chọn cũ, giữ y kết quả cũ.
 const r=await layEmChieu(['q1','q2','q3'],['absent','A','B','C'],new Set(['A','B','C']),undefined,undefined,{cheDo:'chac'})
 expect(api.mock.calls[0]![1].sbd).toEqual(['A','B','C'])
 expect(r.get('q1')![0].sbd).toBe('A');expect(r.get('q2')![0].sbd).toBe('B');expect(r.get('q3')![0].sbd).toBe('C')
 expect(nhanEmChieu(r.get('q3')![0]).chu).toBe('Dự kiến làm được câu này')
 const doi=await layEmChieu(['q1'],['A','B','C'],undefined,undefined,new Map([['q1',new Set(['A'])]]),{cheDo:'chac'})
 expect(doi.get('q1')![0].sbd).toBe('B')
 // Mặc định "Trộn": vẫn chỉ em có mặt, ba câu ba em khác nhau, em được chọn mang tầng + lý do (chỉ màn thầy).
 const tron=await layEmChieu(['q1','q2','q3'],['absent','A','B','C'],new Set(['A','B','C']),undefined,undefined,{hatGiong:'t'})
 const ai=['q1','q2','q3'].map(q=>tron.get(q)![0])
 expect(new Set(ai.map(e=>e.sbd)).size).toBe(3);expect(ai.every(e=>e.sbd!=='absent'&&e.tang&&e.lyDo)).toBe(true)
})
it('Kiểm tra đầu giờ giữ người gọi và cầu ghi cũ; Dạy học ghi đúng em mới được chọn',async()=>{
 const c:CauDayHoc={khoa:'k',qid:'DH-12-C1-B1-I-1',phan:'I',q:{id:'k',text:'Chất nào là ester?',choices:['A','B','C','D'],correct:'B',chuyenDe:'Ester'} as CauDayHoc['q'],maDe:'DH-12-C1-B1',tenDe:'Ester',chuyenDe:'Ester',maDang:null,tenDang:null,mucDo:'biet',tuLuan:false}
 const old=new Map([['k',{sbd:'old',hoTen:'Em cũ'}]])
 const dau=await dungToChieuDayHoc([c],old,'Đầu giờ','buoi',true,['new'])
 expect(api).not.toHaveBeenCalled();expect([...dau.o.values()][0]?.sbd).toBe('old')
 api.mockResolvedValue({ok:true,du:{cau:{[c.qid]:[{sbd:'new',ten:'Em đã đúng',loai:'da_dung',p:0.8}]}}})
 const day=await dungToChieuDayHoc([c],old,'Dạy học','buoi',false,['new'])
 expect([...day.o.values()][0]?.sbd).toBe('new');expect(day.html).toContain('Đã tự làm đúng câu này')
 expect(day.html).not.toContain('Em cũ')
 api.mockResolvedValue({ok:false,chu:'Mất mạng'})
 const chung=await dungToChieuDayHoc([c],old,'Dạy học','buoi',false,['new'])
 expect(chung.o.size).toBe(0);expect(chung.html).toContain('Chất nào là ester?');expect(chung.html).toContain('Cả lớp')
})
