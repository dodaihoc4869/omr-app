import { afterEach, expect, it, vi } from 'vitest'
import { xepThuTuChua } from '../src/lib/thay-tu-chua'
import { layEmChieu, nhanEmChieu } from '../src/lib/ung-vien-chieu'
import { dungToChieuDayHoc, type CauDayHoc } from '../src/lib/day-hoc-len-bang'
const api=vi.hoisted(()=>vi.fn())
vi.mock('../src/lib/goi-lenh-thay',()=>({goiLenh:api}))
afterEach(()=>api.mockReset())
it('trộn ba nhóm chung: đủ câu, không trùng, không lần lượt nhóm; cùng buổi ổn định kể cả mảng vào đổi thứ tự',()=>{
 const ds=Array.from({length:9},(_,i)=>({qid:`q${i}`,phan:'I' as const,tinhToan:i<3,thuTuDe:i,q:{canChua:i>=3&&i<6?{sao:2 as const,dk:[],ly_do:'',bay:null}:undefined}}))
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
it('21/10: máy thầy thêm em chưa có số đo (bảng em) vào từng câu, gắn số lần sai + sổ lên bảng; chữa câu gọi em ĐÃ SAI, kèm em giảng lại', async () => {
 api.mockResolvedValue({ok:true,du:{cau:{q1:[{sbd:'A',ten:'An',loai:'da_dung',p:0.9,luc:'x'}]},soSai:{q1:{B:2}},em:{A:{ten:'An',soLan14:1,lanCuoiLenBang:null},B:{ten:'Bình',soLan14:0,lanCuoiLenBang:null}}}})
 const { napEmChieu, chonEmChieu } = await import('../src/lib/ung-vien-chieu')
 const nap = (await napEmChieu(['q1'], ['A', 'B']))!
 expect(nap.ds.get('q1')!.map((e) => [e.sbd, e.loai, e.soSai, e.soLan14])).toEqual([['A', 'da_dung', 0, 1], ['B', 'chua_co', 2, 0]])
 const c = chonEmChieu(nap, ['q1'], undefined, { capChua: true, hatGiong: 'c' }).get('q1')![0]!
 expect(c.sbd).toBe('B'); expect(c.giangLai?.sbd).toBe('A')
 // tải một lần, chọn lại không gọi mạng
 api.mockClear(); chonEmChieu(nap, ['q1'], undefined, { hatGiong: 'k' }); expect(api).not.toHaveBeenCalled()
})
it('21/10: tờ chiếu KHÔNG bao giờ ghi tầng; em giữ (coDinh) theo thứ tự khác vẫn ra đúng em đã hiện ở xem trước', async () => {
 const c:CauDayHoc={khoa:'k',qid:'DH-12-C1-B1-I-1',phan:'I',q:{id:'k',text:'Chất nào là ester?',choices:['A','B','C','D'],correct:'B',chuyenDe:'Ester'} as CauDayHoc['q'],maDe:'DH-12-C1-B1',tenDe:'Ester',chuyenDe:'Ester',maDang:null,tenDang:null,mucDo:'biet',tuLuan:false}
 const em=['a','b','c','d','e','f'].map((s,i)=>({sbd:s,ten:`Em ${s}`,loai:'du_bao',p:0.1+i*0.15}))
 api.mockResolvedValue({ok:true,du:{cau:{[c.qid]:em}}})
 const day=await dungToChieuDayHoc([c],new Map(),'Dạy học','buoi',false,em.map(e=>e.sbd))
 const e0=[...day.emGoi.values()][0]!
 expect(e0.tang).toBeTruthy();expect(e0.lyDo).toMatch(/Cần kèm|Trung bình|Khá/)
 // ("Trung bình"/"Khá" có sẵn trong bảng mức L1–L4 của tờ — không phải tầng) ⇒ dò chữ riêng của tầng và dòng lý do.
 expect(day.html).not.toMatch(/Cần kèm|lên bảng 14 ngày|ngày chưa lên bảng|Câu dễ →|Câu khó →/)
 expect(day.html).not.toContain(e0.lyDo!)
 for(const t of [1,2,3] as const)expect(JSON.stringify(nhanEmChieu({...e0,tang:t,lyDo:'Câu dễ → em Cần kèm'}))).not.toMatch(/Cần kèm|Trung bình|Khá/)
 // xem trước theo thứ tự A, tờ chiếu theo thứ tự B + coDinh ⇒ cùng em từng câu
 const { napEmChieu, chonEmChieu } = await import('../src/lib/ung-vien-chieu')
 const q=['q1','q2','q3','q4','q5','q6']
 api.mockResolvedValue({ok:true,du:{cau:Object.fromEntries(q.map(x=>[x,em]))}})
 const nap=(await napEmChieu(q,em.map(e=>e.sbd)))!
 const xem=chonEmChieu(nap,q,undefined,{hatGiong:'h'}),coDinh=new Map([...xem].map(([k,l])=>[k,l[0]!.sbd]))
 const chieu=chonEmChieu(nap,[...q].reverse(),undefined,{hatGiong:'h',coDinh})
 for(const x of q)expect(chieu.get(x)![0]!.sbd).toBe(xem.get(x)![0]!.sbd)
})
