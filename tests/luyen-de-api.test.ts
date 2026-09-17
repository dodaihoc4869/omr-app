import {it,expect,vi} from 'vitest'
import {luyenDe} from '../server/src/luyen-de'
import type {Env} from '../server/src/kieu'
vi.mock('../server/src/game-v2-auth',()=>({gameIdentity:async(_e:unknown,b:Record<string,unknown>)=>{if(b.token!=='valid')throw Error('login');return 'S1'}}))
function env(deadline=Date.now()+60000,status='active'){
 const row={id:'P',sbd:'S1',created_at:Date.now(),deadline,status,bank_key:'private',answers:'{}',result:null as string|null}
 const source={maDe:'x',phanI:[{id:'Q',text:'Đề',choices:['a','b','c','d'],correct:'A',explanation:'bí mật'}],phanII:[],phanIII:[]}
 const e={DE:{get:async()=>({body:JSON.stringify([source])})},DB:{prepare:(sql:string)=>({bind:(...args:unknown[])=>({first:async()=>args[0]==='P'&&args[1]==='S1'?{...row}:null,run:async()=>{
 if(sql.includes("status='submitted'")){row.answers=String(args[0]);row.result=String(args[1]);row.status='submitted'}else row.answers=String(args[0]);return {success:true}
 }})})}} as unknown as Env
 return {e,row}
}
it('không token và sai chủ bài không đọc được đề',async()=>{const {e}=env();await expect(luyenDe(e,'open',{id:'P'})).rejects.toThrow('login');await expect(luyenDe(e,'open',{token:'valid',id:'khac'})).rejects.toThrow('Không tìm thấy')})
it('trước nộp không có đáp án, lời giải hay nguồn riêng tư',async()=>{const {e}=env();const r=await luyenDe(e,'open',{token:'valid',id:'P'});expect(JSON.stringify(r)).not.toContain('correct');expect(JSON.stringify(r)).not.toContain('bí mật');expect(r.solutions).toBeUndefined()})
it('nộp chấm ở máy chủ và nộp lại không thay điểm',async()=>{const {e}=env();const r=await luyenDe(e,'submit',{token:'valid',id:'P',answers:{Q:'A'},score:10});expect(r.result).toMatchObject({score:.25});expect(r.solutions).toBeTruthy();const again=await luyenDe(e,'submit',{token:'valid',id:'P',answers:{Q:'B'}});expect(again.result).toEqual(r.result)})
it('quá hạn không nhận đáp án mới dù máy em gửi thêm',async()=>{const {e}=env(Date.now()-1000);const r=await luyenDe(e,'submit',{token:'valid',id:'P',answers:{Q:'A'}});expect(r.result).toMatchObject({score:0})})
