import {it,expect,vi,afterEach} from 'vitest'
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react'
vi.mock('../src/components/TheCau',()=>({default:(p:any)=><button onClick={()=>p.onSelect('A')}>{p.text}</button>}))
vi.mock('../src/components/KhoiCauSai',()=>({LoiGiaiCauSai:()=> <p>Lời giải từ kho</p>}))
vi.mock('../src/components/QuestionMedia',()=>({HinhTaiViTri:()=>null,ManHinhAnh:()=>null}))
vi.mock('../src/game/than-thu-v2/battle-audio',()=>({unlockBattleAudio:vi.fn(),playBattleSound:vi.fn()}))
import {playBattleSound} from '../src/game/than-thu-v2/battle-audio'
import EscortQuestion from '../src/game/than-thu-v2/EscortQuestion'
afterEach(cleanup)
const q={qid:'q1',phan:'I',text:'Câu Hoá tại bản đồ',choices:['a','b','c','d'],hinhAnh:[]}
it('tự tải câu theo phòng và lượt, trả lời và hiện lời giải ngay tại khung',async()=>{
 const call=vi.fn(async(action:string)=>action==='start'?{id:'session',questions:[q]}:{correct:true,answer:'A',solution:'Giải',solutionImages:[],attempt:{assisted:false}})
 render(<EscortQuestion room="LT1" round={2} call={call}/>);fireEvent.click(await screen.findByText(q.text));fireEvent.click(screen.getByText('Trả lời câu Hoá'))
 expect(await screen.findByText('Lời giải từ kho')).toBeTruthy();expect(screen.getByText(q.text)).toBeTruthy()
 expect(call).toHaveBeenCalledWith('start',{mode:'arena',guardian:'LT1',guardianRound:2});expect(call).toHaveBeenCalledWith('answer',{session:'session',qid:'q1',answer:'A',assisted:false})
})
it('mở lại câu đã chấm không hiện nút nộp thêm lần nữa',async()=>{
 const call=vi.fn(async()=>({id:'session',questions:[q],answered:[{correct:true,answer:'A',solutionImages:[],attempt:{assisted:true}}]}))
 render(<EscortQuestion room="LT1" round={2} call={call}/>);await screen.findByText('Lời giải từ kho');expect(screen.queryByText('Trả lời câu Hoá')).toBeNull();expect(screen.getByText('Lượt này em đứng yên, chỉ được dựng khiên yếu (+5 giáp).')).toBeTruthy();await waitFor(()=>expect(call).toHaveBeenCalledTimes(1))
})

it('âm báo phân biệt câu đúng và sai sau khi máy chủ chấm',async()=>{
 for(const correct of [true,false]){vi.mocked(playBattleSound).mockClear();const call=vi.fn(async(action:string)=>action==='start'?{id:'s',questions:[q]}:{correct,answer:'A',solutionImages:[]});render(<EscortQuestion room="LT1" round={1} call={call}/>);fireEvent.click(await screen.findByText(q.text));fireEvent.click(screen.getByText('Trả lời câu Hoá'));await waitFor(()=>expect(playBattleSound).toHaveBeenCalledWith(1,0,correct,false));cleanup()}
})
