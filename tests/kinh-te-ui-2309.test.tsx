import {afterEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import TuiDo from '../src/game/than-thu-v2/dao/TuiDo'
import type {DaoProfile} from '../src/game/than-thu-v2/dao/kieu'
afterEach(cleanup)
const profile:DaoProfile={pet:'dat_quy',choice:false,cap:10,exp:0,wallet:700,mastery:[],soNgayDat:20,ngayMoKhienQua:21,khienConLai:0,renKhien:{gia:300,duTru:400,manh:21},khienRen:{manh:21,daRen:0,chuaDung:0,conLai:0,moiKhien:21}}
it('cấp 10 chưa đủ ngày không hiện khiên ảo; mảnh đã đủ không bị chia dư về 0',()=>{
  render(<TuiDo profile={profile} onDungKhien={vi.fn()} onRenKhien={vi.fn()}/>)
  expect(screen.getByText('Khiên · 0 lượt')).toBeTruthy()
  expect((screen.getByRole('button',{name:'Dùng khiên'}) as HTMLButtonElement).disabled).toBe(true)
  expect((screen.getByRole('button',{name:/Rèn 1 khiên/}) as HTMLButtonElement).disabled).toBe(true)
  expect(screen.getByText('Mảnh khiên · 21/21')).toBeTruthy()
})
it('rèn giữ 400 EXP dự trữ và gửi số đã rèn để máy chủ chống cộng trùng',()=>{
  const forge=vi.fn()
  const ui=render(<TuiDo profile={{...profile,soNgayDat:21,wallet:699}} onDungKhien={vi.fn()} onRenKhien={forge}/>)
  expect((screen.getByRole('button',{name:/Rèn 1 khiên/}) as HTMLButtonElement).disabled).toBe(true)
  ui.rerender(<TuiDo profile={{...profile,soNgayDat:21}} onDungKhien={vi.fn()} onRenKhien={forge}/>)
  fireEvent.click(screen.getByRole('button',{name:/Rèn 1 khiên/}))
  expect(forge).toHaveBeenCalledExactlyOnceWith(0)
})
