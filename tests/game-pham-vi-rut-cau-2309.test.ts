// @vitest-environment node
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
import {gameV2} from '../server/src/game-v2'
import {gameToken} from '../server/src/game-v2-auth'
import {danhDau} from '../server/src/game-v2-doan'
import {giayCuaHiep} from '../src/game/than-thu-v2/doan-core'
import {chooseLuotMoi,learnedQuestionFilter,targetLevel,type Evidence,type PrivateQuestion} from '../src/game/than-thu-v2/core'
import {taoD1That} from './_d1-that'

const T=Date.parse('2026-09-23T12:00:00+07:00')
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(T)})
afterEach(()=>vi.useRealTimers())

function dung(){
  const d=taoD1That()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong',?,'x')").run(JSON.stringify({toanBo:true}))
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE','DE','12',60,'kho/DE.json',0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE','v1','x')").run()
  const them=d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for(const dang of ['A','B'])for(let i=0;i<20;i++){
    const qid=`${dang}${i}`,group=i===2||i===3?`${dang}-trung`:`g-${qid}`
    const q={qid,maDe:'DE',version:'v1',group,phan:'I',text:`${dang} ${i}`,choices:['a','b','c','d'],ideas:[],hinhAnh:[],dang,tenDang:dang,mucDo:'biet',sao:1,kienThuc:[`${dang}-KT`],correct:'A',solution:'',reviewed:true}
    them.run('DE',qid,'v1',group,dang,JSON.stringify(q))
  }
  for(const sbd of ['S1','S2','S3']){
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12','mk','x')").run(sbd,sbd)
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run(sbd,JSON.stringify({pet:'dat_quy',choice:false,legacy:null,cap:1,exp:0,wallet:0,earned:0,tower:1,mastery:[],arena:null,cutover:'2020-01-01T00:00:00.000Z'}),'x')
  }
  const hoc=(sbd:string,qid:string,dang:string)=>{
    const luc=new Date(T-60*86_400_000).toISOString()
    d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,giay,luc,ngay_vn,ma_dang) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(`hoc-${sbd}-${qid}`,sbd,qid,'on_lai','m',1,1,30,luc,luc.slice(0,10),dang)
    d.sql.prepare('INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,ket_qua_cuoi,nguon_cuoi,luc_cuoi,trang_thai,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(`${sbd}|${qid}`,sbd,qid,dang,1,0,0,1,1,1,'on_lai',luc,'chua_thay_sai',luc)
  }
  hoc('S1','A0','A');hoc('S2','B0','B')
  return d
}

describe('kho game theo phần từng em đã học',()=>{
  it('không lấy dạng bạn cùng lớp đã học và không lặp QID/nhóm nội dung trong lượt',async()=>{
    const d=dung()
    for(const [sbd,dang] of [['S1','A'],['S2','B']] as const){
      const r=await gameV2(d.env,'start',danhDau({token:await gameToken(d.env,sbd),mode:'adventure'})) as {questions:{qid:string;group:string;dang:string}[]}
      expect(r.questions).toHaveLength(6)
      expect(r.questions.every(q=>q.dang===dang)).toBe(true)
      expect(new Set(r.questions.map(q=>q.qid)).size).toBe(r.questions.length)
      expect(new Set(r.questions.map(q=>q.group)).size).toBe(r.questions.length)
    }
  })
  it('chưa có bằng chứng riêng thì trả kho trống, không tự lấy bài của lớp',async()=>{
    const d=dung()
    const r=await gameV2(d.env,'start',danhDau({token:await gameToken(d.env,'S3'),mode:'adventure'})) as {questions:unknown[];lyDo:string}
    expect(r.questions).toEqual([])
    expect(r.lyDo).toBe('kho_trong')
  })
  it('sổ học riêng vẫn mở đúng dạng khi bảng hồ sơ dựng lại chưa có dòng',async()=>{
    const d=dung()
    d.sql.prepare("DELETE FROM nam_kt_cau WHERE sbd='S2'").run()
    const r=await gameV2(d.env,'start',danhDau({token:await gameToken(d.env,'S2'),mode:'adventure'})) as {questions:{dang:string}[]}
    expect(r.questions.length).toBeGreaterThan(0)
    expect(r.questions.every(q=>q.dang==='B')).toBe(true)
  })
  it('đồng hồ tăng theo loại câu và mức độ, cùng số giây dùng cho cả hiệp',async()=>{
    // CNH-1.0 (02 §8): hạn mềm = ceil(1,25 × giây gốc), sàn 60, KHÔNG trần 180; đồng hồ đội ≤ 300/hiệp.
    expect(giayCuaHiep(1,[{phan:'I',mucDo:'biet'}])).toBe(94) // ceil(1,25 × 75)
    expect(giayCuaHiep(1,[{phan:'I',mucDo:'biet'},{phan:'III',mucDo:'van_dung'}])).toBe(300) // câu dài nhất chạm trần đội 300
    expect(giayCuaHiep(4,[])).toBe(60) // không kèm câu: hằng số cũ của hiệp trùm
    const d=dung()
    const r=await gameV2(d.env,'doan-mo',{token:await gameToken(d.env,'S1')}) as {doan:{tran:{giay:number;conMs:number}}}
    // MỤC 6 (23/09): hạn hiệp còn cộng THỜI GIAN ĐỌC theo độ dài đề ⇒ không còn hằng số 90 s;
    // máy chủ vẫn là nguồn hạn cuối và đồng hồ đếm đúng hạn ấy.
    expect(r.doan.tran.giay).toBeGreaterThanOrEqual(60) // §8: sàn 60 giây
    expect(r.doan.tran.giay).toBeLessThanOrEqual(300) // §8: trần ĐỒNG HỒ ĐỘI 300 giây/hiệp
    expect(r.doan.tran.conMs).toBe(r.doan.tran.giay*1000)
  })
})

describe('ôn có khoảng cách và chi phí chọn',()=>{
  const cau=(qid:string,group=`g-${qid}`):PrivateQuestion=>({qid,group,maDe:'DE',version:'v1',phan:'I',text:qid,choices:['a','b','c','d'],ideas:[],hinhAnh:[],dang:'A',tenDang:'A',mucDo:'biet',sao:1,kienThuc:['A-KT'],correct:'A',solution:'',reviewed:true})
  it('làm sai câu vận dụng không nâng bậc; tự làm đúng 4/5 câu qua hai lượt mới tăng mức',()=>{
    const evidence:Evidence[]=[{qid:'A-kho',group:'g-kho',dang:'A',mucDo:'van_dung',kienThuc:['A-KT'],wrong:true,date:new Date(T-3*86_400_000).toISOString(),ca:'thi'}]
    expect(targetLevel('A',evidence,[])).toBe(0)
    const got=chooseLuotMoi([cau('de'),{...cau('kho'),mucDo:'van_dung'}],evidence,[],[],{loai:'kham_pha',cap:1,now:T,soCau:6,gentle:true})
    expect(got.map(x=>x.q.qid)).toEqual(['de'])
    const attempts=Array.from({length:5},(_,i)=>({id:`a${i}`,session:i<3?'luot1':'luot2',group:`g${i}`,qid:`q${i}`,dang:'A',mucDo:'biet',correct:i!==2,assisted:false,at:T+i,novel:true}))
    expect(targetLevel('A',evidence,attempts)).toBe(1)
    expect(targetLevel('A',evidence,attempts.map(a=>({...a,assisted:true})))).toBe(0)
  })
  it('trùm chỉ lấy câu vừa sức; kho chỉ có trùm quá khó thì không ép học sinh làm',async()=>{
    for(const coCauDe of [true,false]){
      const d=dung()
      for(const [qid,mucDo] of [['TRUM-KHO','van_dung'],...(coCauDe?[['TRUM-DE','biet']]:[])]){
        const q={...cau(qid!),phan:'II',ideas:['a','b','c','d'],correct:'DSDS',mucDo}
        d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE',qid,'v1',q.group,'A',JSON.stringify({...q,maDe:'DE',version:'v1'}))
      }
      const r=await gameV2(d.env,'doan-mo',{token:await gameToken(d.env,'S1')}) as any
      const row=d.sql.prepare('SELECT json FROM doan_chang WHERE ma=?').get(r.doan.ma) as {json:string}
      const ids=Object.values(JSON.parse(row.json).trum).map((q:any)=>q?.qid??null)
      expect(ids).not.toContain('TRUM-KHO')
      if(coCauDe)expect(ids).toContain('TRUM-DE')
      else expect(ids).toEqual([null,null])
    }
  })
  it('ưu tiên câu tới hạn, hoãn câu vừa đúng và câu sai trong ngày',()=>{
    const ngay=(n:number)=>new Date(T-n*86_400_000).toISOString()
    const evidence:Evidence[]=[
      {qid:'A0',group:'g-A0',dang:'A',mucDo:'biet',kienThuc:['A-KT'],wrong:false,date:ngay(60),ca:'on_lai'},
      {qid:'A1',group:'g-A1',dang:'A',mucDo:'biet',kienThuc:['A-KT'],wrong:true,date:ngay(3),ca:'on_lai'},
      {qid:'A2',group:'g-A2',dang:'A',mucDo:'biet',kienThuc:['A-KT'],wrong:false,date:ngay(2),ca:'on_lai'},
      {qid:'A3',group:'g-A3',dang:'A',mucDo:'biet',kienThuc:['A-KT'],wrong:true,date:ngay(0),ca:'on_lai'},
    ]
    const pool=Array.from({length:14},(_,i)=>cau(`A${i}`,i===4||i===5?'g-cung-noi-dung':`g-A${i}`))
    const got=chooseLuotMoi(pool,evidence,[],[],{loai:'kham_pha',cap:1,now:T,soCau:6,gentle:true,dueQids:new Set(['A1'])}).map(x=>x.q)
    expect(got.map(q=>q.qid)).toContain('A1')
    expect(got.map(q=>q.qid)).not.toContain('A2')
    expect(got.map(q=>q.qid)).not.toContain('A3')
    expect(new Set(got.map(q=>q.group)).size).toBe(got.length)
  })
  it('qid giống nhau nhưng nội dung khác không thành bằng chứng đã học',()=>{
    const evidence:Evidence[]=[{qid:'X',group:'noi-dung-cu',dang:'A',mucDo:'biet',kienThuc:['A-KT'],wrong:false,date:new Date(T).toISOString(),ca:'on_lai'}]
    const daHoc=learnedQuestionFilter(evidence,new Set())
    expect(daHoc({...cau('X','noi-dung-khac'),dang:'B',kienThuc:['B-KT']})).toBe(false)
  })
  it('câu từng đúng được ôn khi hồ sơ báo tới hạn, kể cả chưa đủ 30 ngày',()=>{
    const evidence:Evidence[]=[{qid:'A2',group:'g-A2',dang:'A',mucDo:'biet',kienThuc:['A-KT'],wrong:false,date:new Date(T-2*86_400_000).toISOString(),ca:'on_lai'}]
    const got=chooseLuotMoi([cau('A2'),cau('A3')],evidence,[],[],{loai:'kham_pha',cap:1,now:T,soCau:1,gentle:true,dueQids:new Set(['A2'])})
    expect(got[0]?.q.qid).toBe('A2')
  })
  it('lọc 15.000 câu bằng chỉ mục bằng chứng trong bộ nhớ, không truy vấn mỗi câu',()=>{
    const evidence:Evidence[]=[{qid:'A0',group:'g-A0',dang:'A',mucDo:'biet',kienThuc:['A-KT'],wrong:false,date:new Date(T-60*86_400_000).toISOString(),ca:'on_lai'}]
    const pool=Array.from({length:15_000},(_,i)=>cau(`A${i}`))
    const start=performance.now(),daHoc=learnedQuestionFilter(evidence,new Set())
    const hopLe=pool.filter(daHoc)
    const got=chooseLuotMoi(hopLe,evidence,[],[],{loai:'kham_pha',cap:1,now:T,soCau:6,gentle:true})
    const ms=performance.now()-start
    expect(hopLe).toHaveLength(15_000)
    expect(got).toHaveLength(6)
    expect(new Set(got.map(x=>x.q.group)).size).toBe(6)
    expect(ms).toBeLessThan(10_000)
    console.info(`Chọn 6/15000 câu trong ${Math.round(ms)} ms`)
  })
})
