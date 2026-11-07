// @vitest-environment jsdom
// BỎ MÀN DANH SÁCH TỰ SỬA LỖI (thầy 07/11: «bỏ luôn màn sửa lỗi này đi, bấm nút đỏ sửa lỗi là vào thẳng câu luôn»): ManTuChua `thang` (cổng học sinh luôn bật)
// mở THẲNG câu chưa xong kế tiếp của Việc hôm nay, không vẽ danh sách; rời câu ⇒ về Hôm nay (onVe); xong hết hôm nay ⇒ về Hôm nay ngay.
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const api = vi.hoisted(() => ({ apiDanhSachTuChua: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-api', async (goc) => ({ ...(await goc<typeof import('../src/lib/chua-cau-sai-api')>()), apiDanhSachTuChua: api.apiDanhSachTuChua }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test', quenDiaChiMayChu: () => {} }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }), xongNapDiaChi: async () => {} }))
vi.mock('../src/components/chua-cau-sai/ManChuaCauSai', () => ({
  default: ({ qid, onVe, tienDo }: { qid: string; onVe: () => void; tienDo?: { noiVe?: string } }) => (<div><p>Đang chữa {qid}</p><p>về: {tienDo?.noiVe ?? '-'}</p><button type="button" onClick={onVe}>Rời câu</button></div>),
}))

import type { MucChua } from '../src/lib/chua-cau-sai-api'
import { taiTuSuaLoi, xoaNhoTuSua } from '../src/lib/tu-sua-loi'
const { default: ManTuChua } = await import('../src/components/hoc-tap/ManTuChua')

const mot = (n: number, tt: string, tien: string): MucChua[] => Array.from({ length: n }, (_, i) => ({ qid: `${tien}${i}`, dotId: `${tien}-d${i}`, trangThai: tt }))
const DS: MucChua[] = [...mot(6, 'can_chan_doan', 'm'), ...mot(2, 'da_tu_sua', 'z')]
const bat = (ds: MucChua[]) => ({ trangThai: 'bat', ds, dem: { tong: ds.length, can: ds.filter((m) => m.trangThai !== 'da_tu_sua').length, cho: 0, xong: ds.filter((m) => m.trangThai === 'da_tu_sua').length } })

beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); xoaNhoTuSua()
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '11010', token: 'tk' }))
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, cheDo2: true, chienDich: [], cau: [] }) })))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('Tự sửa lỗi mở thẳng câu (thầy 07/11)', () => {
  it('thang: không vẽ danh sách Việc hôm nay, mở ngay câu cần sửa đầu tiên; nút về ghi «Hôm nay»; rời câu ⇒ onVe', async () => {
    api.apiDanhSachTuChua.mockResolvedValue(bat(DS))
    await taiTuSuaLoi('tk', { moi: true })
    const onVe = vi.fn()
    render(<ManTuChua token="tk" thang onVe={onVe} />)
    // màn sửa câu (thật hoặc giả tuỳ nạp) mở NGAY câu đầu «Câu sai số 1» — không qua danh sách
    expect(await screen.findByText(/Đang chữa m0|Câu sai số 1/, undefined, { timeout: 8000 })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Việc hôm nay/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Rời câu|Quay lại/ }))
    expect(onVe).toHaveBeenCalledTimes(1)
  })

  it('không có `thang` (màn cũ / test cũ): vẫn vẽ danh sách như trước', async () => {
    api.apiDanhSachTuChua.mockResolvedValue(bat(DS))
    await taiTuSuaLoi('tk', { moi: true })
    render(<ManTuChua token="tk" onVe={vi.fn()} />)
    expect(await screen.findByRole('heading', { name: /Việc hôm nay/ })).toBeTruthy()
    expect(screen.queryByText(/Đang chữa/)).toBeNull()
  })

  it('cổng học sinh bật `thang`; nút màn xong chặng đọc nơi về từ tienDo.noiVe', () => {
    expect(readFileSync('src/screens/StudentPortalScreen.tsx', 'utf8')).toMatch(/<ManTuChua token=\{auth\.token\} qid=\{qidChua\} thang /)
    const duo = readFileSync('src/components/chua-cau-sai/ChuaGonDuo.tsx', 'utf8')
    expect(duo).toContain("`Về ${tienDo.noiVe ?? 'Tự sửa lỗi'}`")
    expect(duo).toContain(">Nghỉ, về {tienDo.noiVe ?? 'Tự sửa lỗi'}</button>")
  })
})
