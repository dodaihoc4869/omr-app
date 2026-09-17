import {it,expect,afterEach} from 'vitest'
import {render,screen,fireEvent,cleanup} from '@testing-library/react'
import Khung from '../src/components/KhungThanThuToanManHinh'
afterEach(cleanup)
it('mở rộng được khi iPhone không có Fullscreen API, không dựng lại game, thoát phục hồi cuộn',()=>{
 const {container}=render(<Khung><input aria-label="trạng thái game" defaultValue="đang học"/></Khung>)
 const input=screen.getByLabelText('trạng thái game')
 fireEvent.click(screen.getByText('Toàn màn hình'))
 expect(container.querySelector('[data-than-thu-fullscreen="true"]')).not.toBeNull()
 expect(document.body.style.overflow).toBe('hidden')
 expect(screen.getByLabelText('trạng thái game')).toBe(input)
 fireEvent.click(screen.getByText('Thoát toàn màn hình'))
 expect(container.querySelector('[data-than-thu-fullscreen="false"]')).not.toBeNull()
 expect(document.body.style.overflow).not.toBe('hidden')
})
