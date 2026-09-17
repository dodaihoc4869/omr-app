import {it,expect} from 'vitest'
import {teacherDayRange,recordPresence} from '../server/src/teacher-news'
import worker from '../server/src/index'
import type {Env} from '../server/src/kieu'
it('ngày giáo viên bắt đầu 00:01 Việt Nam đến 00:01 ngày sau',()=>{expect(teacherDayRange('2026-09-16')).toEqual({start:'2026-09-15T17:01:00.000Z',end:'2026-09-16T17:01:00.000Z'});expect(()=>teacherDayRange('2026-02-31')).toThrow()})
it('bảng tin giáo viên không mở cho người chưa xác thực',async()=>{const r=await worker.fetch(new Request('https://app/teacher-news',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}),{MA_BI_MAT:'teacher'} as Env);expect(r.status).toBe(403)})
it('heartbeat cập nhật cùng phiên, không cộng thêm lượt khi gửi lặp',async()=>{let sql='';const calls:any[]=[];const env={DB:{prepare:(s:string)=>{sql=s;return {bind:(...args:any[])=>({run:async()=>calls.push(args)})}}}} as unknown as Env;await recordPresence(env,{session:'test-session-1234',role:'hs'});await recordPresence(env,{session:'test-session-1234',role:'hs'});expect(sql).toContain('ON CONFLICT(day,session_id,role) DO UPDATE SET last_seen');expect(calls[0].slice(0,3)).toEqual(calls[1].slice(0,3));expect(await recordPresence(env,{session:'x',role:'admin'})).toMatchObject({ok:false})})
