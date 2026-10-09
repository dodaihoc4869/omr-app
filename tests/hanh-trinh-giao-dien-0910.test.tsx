import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import BangChienDich from '../src/components/chien-dich/BangChienDich'
import type { BangChienDich as DuBang } from '../src/components/chien-dich/api'
import DsChienDichDaGiao from '../src/components/chien-dich/DsChienDichDaGiao'

vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: async () => ({ok:true,du:{ok:true,homNay:'2026-10-09',chienDich:[10,11,12].map(k => ({
  id:`hanh-trinh-v3-khoi-${k}`,ten:`Hành trình giỏi hoá · Khối ${k}`,lop:`Khối ${k}`,maDe:[],hanNop:'9999-12-31',theLucNgay:36,huyetChien:false,maCa:null,taoLuc:'2026-10-09',trangThai:'dang_chay',soCau:100,soEm:1,hetHan:false,hanhTrinh:true,
}))}}) }))

afterEach(cleanup)
describe('Bảng ba hành trình', () => {
  it('chỉ quản lý ba hành trình, không còn nút giao/chỉnh chỉ tiêu/huỷ thủ công', async () => {
    render(<DsChienDichDaGiao onGiaoMoi={vi.fn()} />)
    await screen.findByText('Hành trình giỏi hoá · Khối 12')
    expect(screen.getAllByRole('button',{name:'Xem bảng'})).toHaveLength(3)
    expect(screen.queryByRole('button',{name:'+ Giao chiến dịch mới'})).toBeNull()
    expect(screen.queryByRole('button',{name:'Chỉnh sửa'})).toBeNull()
    expect(screen.queryByRole('button',{name:'Huỷ'})).toBeNull()
    expect(screen.queryByRole('switch')).toBeNull()
    expect(document.body.textContent).not.toContain('9999')
  })
  it('hiện kế hoạch cá nhân, thiếu câu và chưa mở app; không hiện hạn 9999 hoặc số vững giả', () => {
    const du = {
      ok:true,homNay:'2026-10-09',hetHan:false,
      chienDich:{id:'hanh-trinh-v3-khoi-12',ten:'Hành trình giỏi hoá · Khối 12',lop:'Khối 12',hanNop:'9999-12-31',soEm:3,soCau:100,hanhTrinh:true},
      lop:{coXat:0,thanhThao:0,huyetChien:0,canDayLaiCau:0,canDayLaiLuot:0},dang:[],em:[],canDayLai:[],noCu:[],
      hanhTrinhNgay:{em:[
        {sbd:'1',ten:'An',tang:1,toiThieu:24,daLam:6,daXep:24,conThieu:0},
        {sbd:'2',ten:'Bình',tang:3,toiThieu:36,daLam:12,daXep:30,conThieu:6},
        {sbd:'3',ten:'Chi',tang:null,toiThieu:null,daLam:0,daXep:0,conThieu:0},
      ]},
    } as unknown as DuBang
    const {container}=render(<BangChienDich du={du} nowMs={Date.parse('2026-10-09')} dangChieu={false} onChieu={vi.fn()} onDaChua={vi.fn()} />)
    const hang=(ten:string)=>screen.getByText(ten).closest('tr')!
    expect(hang('An').textContent).toContain('6/24 câu')
    expect(hang('An').textContent).toContain('1/4 chặng')
    expect(hang('Bình').textContent).toContain('12/36 câu')
    expect(within(hang('Bình')).getByText('6 câu')).toBeTruthy()
    expect(hang('Chi').textContent).toContain('Chưa mở app hôm nay')
    expect(container.textContent).not.toContain('9999')
    expect(container.textContent).not.toContain('0%')
  })
})
