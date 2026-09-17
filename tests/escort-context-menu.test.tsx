import {it,expect,vi,afterEach} from 'vitest'
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react'
vi.mock('../src/game/than-thu-v2/Spirit2D',()=>({default:()=>null}))
vi.mock('../src/game/than-thu-v2/SpiritArt',()=>({default:()=>null}))
vi.mock('../src/game/than-thu-v2/EscortGuide',()=>({default:()=>null}))
vi.mock('../src/game/than-thu-v2/battle-audio',()=>({unlockBattleAudio:()=>{},playBattleSound:()=>{},battleMuted:()=>true,setBattleMuted:()=>{}}))
vi.mock('../src/game/than-thu-v2/EscortQuestion',()=>({default:({onAnswered}:any)=><button onClick={()=>onAnswered(2)}>Chấm câu thử</button>}))
import EscortRoom from '../src/game/than-thu-v2/EscortRoom'
import {newEscort,player} from '../src/game/than-thu-v2/escort-core'
afterEach(()=>{cleanup();sessionStorage.clear()})
it('hành động ở ô được chọn, chỉ hiện năng lượng sau khi chấm; không còn bảng nút và nhật ký dưới bàn',async()=>{
 const base=newEscort('1',1,1,Date.now());const room={...base,id:'LTtest',owner:true,started:true,revision:1,deadline:Date.now()+480000,players:[{...player('p0',1,1,0),self:true,ready:false,alias:'Rồng Lam'},{...player('p1',2,1,1),self:false,ready:false,alias:'Boss'}]}
 sessionStorage.setItem('escort:test',room.id);const call=vi.fn(async()=>({escort:room}))
 const {container}=render(<EscortRoom active storageKey="test" call={call}/>);await screen.findByText(/Phòng LTtest/)
 expect(container.querySelector('.escort-actions')).toBeNull();expect(container.querySelector('.escort-log')).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Ô 2,2'}));expect(screen.getByText('Em làm câu Hoá phía dưới trước nhé.')).toBeTruthy();expect(screen.queryByRole('button',{name:'Tung chưởng',exact:true})).toBeNull()
 fireEvent.click(screen.getByText('Chấm câu thử'));expect(await screen.findByRole('button',{name:'Tung chưởng',exact:true})).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'Di chuyển',exact:true}));expect(call).not.toHaveBeenCalledWith('escort-act',expect.anything());expect(screen.getByText('Đi tới ô trống liền kề đã chọn. Không tốn năng lượng.')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Xác nhận Di chuyển'}));await waitFor(()=>expect(call).toHaveBeenCalledWith('escort-act',expect.objectContaining({command:{type:'move',x:1,y:1,target:-1}})))
 expect(container.querySelector('.escort-hud .escort-leave')).toBeTruthy()
})
