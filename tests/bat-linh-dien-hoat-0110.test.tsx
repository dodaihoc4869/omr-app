import {afterEach,describe,expect,it} from 'vitest'
import {cleanup,render} from '@testing-library/react'
import {existsSync} from 'node:fs'
import bang from '../src/game/than-thu-v2/dien-hoat/atlas.json'
import {boCucSan,NHIP_CHUONG} from '../src/game/than-thu-v2/dien-hoat/kieu'
import Canh2 from '../src/game/than-thu-v2/doan2/Canh2'
import type {DoanXem,KetQuaCau} from '../src/game/than-thu-v2/doan-kieu'

afterEach(cleanup)
const xem={ma:'DH1',revision:1,laChu:true,batDau:true,gioMayChu:0,ghe:[{ghe:0,ten:'Minh',pet:2,cap:32,laMay:false,roi:false,laEm:true,trangThai:'dang_lam',tinHieu:null}],
 cau:{qid:'Q1',nhan:'toi_han_on'},tran:{tenChang:'Đèo',hiep:2,soHiep:8,laTrum:false,ketThuc:false,thang:null,linhTam:{hp:80,toiDa:100},quai:[{ma:1,loai:'bun_acid',hp:24}],trumVoGiap:[],nangLuong:0,daNhanTiepSuc:0,giay:40,moSauMs:0,conMs:30000,tenQuai:['Bùn Acid'],loaiQuai:['bun_acid'],tenTrum:['Trùm'],loaiTrum:['chua_te_ket_tua']}} as DoanXem
const kq={correct:true,answer:'B',solution:{chot:'Đã chấm.'}} as KetQuaCau
const dung=(x=xem,k:KetQuaCau|null=null,chan=false)=><Canh2 xem={x} tran={x.tran!} con={20} mo oPhucKich={3} onRoi={()=>{}} ketQua={k} chan={chan}/>
const dong=(c:HTMLElement)=>c.querySelector('.bl-arena')?.getAttribute('data-dong-tac')

describe('Bát Linh · ghép diễn hoạt vào Đảo/Đoàn',()=>{
 it('sân ngang giữ vị trí và kích thước trong video; dọc giữ hai bên và đủ khoảng bay',()=>{
  const g=boCucSan(1100,580);expect(g.left).toBe(275);expect(g.right).toBe(851);expect(g.size).toBe(335);expect(g.enemySize).toBe(220);expect(g.ground).toBeCloseTo(494.16)
  const d=boCucSan(390,315.44);expect(d.left).toBeCloseTo(175);expect(d.right).toBeCloseTo(527);expect(d.size).toBe(285);expect(d.enemySize).toBe(175)
  const ngangThap=boCucSan(520,220);expect(ngangThap.size).toBeLessThan(ngangThap.ground);expect(ngangThap.left).toBeLessThan(ngangThap.right-ngangThap.enemySize)
 })
 it('tám thú có chưởng riêng, đủ 32 bảng WebP và sáu khung hợp lệ mỗi bảng',()=>{
  expect(bang).toHaveLength(8);expect(new Set(bang.map(p=>p.type)).size).toBe(8)
  for(const p of bang)for(const sheet of Object.values(p.sheets)){
   expect(existsSync(`public${sheet.preview}`)).toBe(true);expect(sheet.frames).toHaveLength(6)
   for(const f of sheet.frames){expect(f.x).toBeGreaterThanOrEqual(0);expect(f.x+f.w).toBeLessThanOrEqual(1536);expect(f.y+f.h).toBeLessThanOrEqual(1024);expect(f.foot).toBeGreaterThan(0);expect(f.foot).toBeLessThanOrEqual(512)}
  }
  expect(NHIP_CHUONG.thuong.phong).toBe(.63);expect(NHIP_CHUONG.tuyet.trung).toBe(1.58)
 })
 it('chưa có kết quả từ máy chủ ⇒ đứng chờ; đúng mới bắn và cập nhật đồng hồ không bắn lại',()=>{
  const {container:c,rerender}=render(dung());expect(dong(c)).toBe('idle')
  rerender(dung(xem,kq));expect(dong(c)).toBe('cast')
  const khoa=c.querySelector('.bl-arena')?.getAttribute('data-su-kien')
  rerender(dung({...xem,revision:2}, {...kq}));expect(c.querySelector('.bl-arena')?.getAttribute('data-su-kien')).toBe(khoa)
  expect(c.textContent).toContain('Máu Linh Tâm 80/100');expect(c.textContent).toContain('Máu 24/24')
 })
 it('tải lại câu đã chốt ⇒ không phát lại đòn cũ; sang câu mới về đứng chờ',()=>{
  const {container:c,rerender}=render(dung(xem,kq));expect(dong(c)).toBe('idle')
  rerender(dung({...xem,tran:{...xem.tran!,hiep:3},cau:{...xem.cau!,qid:'Q2'}}));expect(dong(c)).toBe('idle')
  rerender(dung({...xem,tran:{...xem.tran!,hiep:3},cau:{...xem.cau!,qid:'Q2'}},kq));expect(dong(c)).toBe('cast')
 })
 it('chưa đúng thì nhận phản đòn; chọn Chắn thì dựng giáp, không vẽ đòn gây sát thương',()=>{
  const {container:c,rerender}=render(dung());rerender(dung(xem,{...kq,correct:false}));expect(dong(c)).toBe('hit')
  cleanup();const v=render(dung());v.rerender(dung(xem,kq,true));expect(dong(v.container)).toBe('guard')
 })
})
