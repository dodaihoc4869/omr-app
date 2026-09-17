import {it,expect} from 'vitest'
import {nhomBtvn} from '../src/lib/nhom-btvn'
const row=(id:string,ca:string,sbd:string,time='2026-09-16T16:30:00.123Z')=>({maBtvn:id,maCa:ca,maDe:'D',soCau:86,giaoLuc:time,hanNop:'2030-01-01',quaHan:false,tong:1,daNop:0,chuaNop:[{sbd,hoTen:sbd}]})
it('groups session and added students, preserves original assignment for actions',()=>{const [g]=nhomBtvn([row('extra','Riêng','2'),row('session','848875','1')]);expect(g.maCa).toBe('848875');expect(g.tong).toBe(2);expect(g.maTheoSbd).toEqual({'1':'session','2':'extra'});expect(g.baiGoc).toHaveLength(2)})
it('separate assignments on same day remain separate',()=>{expect(nhomBtvn([row('a','848875','1'),row('b','848875','1','2026-09-16T16:31:00.123Z')])).toHaveLength(2)})
