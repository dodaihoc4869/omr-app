// HỘP THOẠI CỦA APP (thầy 28/09: "sửa lại những popup này cho phù hợp và đồng điệu với giao diện của app, quét hết mọi chỗ").
// Soi: (1) nguồn src/ không còn gọi confirm/alert/prompt của trình duyệt (trừ ngoại lệ có chú thích); (2) API promise
// `hoiXacNhan` / `baoTin` / `hoiNhap` trả đúng giá trị; Esc / nền = không đồng ý; tiêu điểm vào nút an toàn và trả về khi đóng;
// nút việc nguy hiểm màu lỗi; hộp nằm trong đúng vỏ màu của app (thầy `.m3.vo-thay`, HS/PH `.m3`).
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { baoTin, hoiNhap, hoiXacNhan, nhanVo } from '../src/components/hop-thoai'

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
})

const GOC = path.resolve(__dirname, '..')
function tepNguon(thu: string, ra: string[] = []): string[] {
  for (const t of fs.readdirSync(thu, { withFileTypes: true })) {
    const p = path.join(thu, t.name)
    if (t.isDirectory()) {
      if (t.name === 'graphify-out' || t.name === 'node_modules') continue
      tepNguon(p, ra)
    } else if (/\.(ts|tsx|js|jsx)$/.test(t.name)) ra.push(p)
  }
  return ra
}
const GOI_HOP_TRINH_DUYET = /\b(window|globalThis|self)\.(confirm|alert|prompt)\s*\(|(^|[^.\w$'"`])(confirm|alert|prompt)\s*\(/

/** NGOẠI LỆ có chú thích — tệp → số lần gọi được phép + câu chú thích bắt buộc có trong tệp.
 *  html-phieu.ts: phiếu HTML ĐỘC LẬP (không có React). Luồng nộp cũ gọi window.confirm nhưng lời hỏi bị CHẶN và vẽ lại bằng hộp
 *  M3 `gd-hop` (xem chú thích "HỘP XÁC NHẬN NỘP kiểu M3"); window.confirm gốc chỉ là đường lùi khi không dựng được hộp.
 *  Giữ nguyên để KHÔNG đổi luật nộp. `beforeunload`: không có trong src/ (nếu thêm, trình duyệt bắt buộc hộp mặc định). */
const NGOAI_LE: Record<string, { soLan: number; chuThich: string }> = {
  'src/lib/html-phieu.ts': { soLan: 2, chuThich: 'HỘP XÁC NHẬN NỘP kiểu M3' },
}

describe('nguồn: không còn hộp mặc định của trình duyệt', () => {
  it('src/ không gọi confirm()/alert()/prompt() (trừ ngoại lệ có chú thích)', () => {
    const vi_pham: string[] = []
    const dem: Record<string, number> = {}
    for (const p of tepNguon(path.join(GOC, 'src'))) {
      const rel = path.relative(GOC, p).split(path.sep).join('/')
      fs.readFileSync(p, 'utf8')
        .split('\n')
        .forEach((d, i) => {
          if (/^\s*(\/\/|\*|\/\*)/.test(d) || !GOI_HOP_TRINH_DUYET.test(d)) return
          if (NGOAI_LE[rel]) dem[rel] = (dem[rel] ?? 0) + 1
          else vi_pham.push(`${rel}:${i + 1}`)
        })
    }
    expect(vi_pham).toEqual([])
    for (const [rel, n] of Object.entries(NGOAI_LE)) {
      expect(dem[rel] ?? 0).toBeLessThanOrEqual(n.soLan)
      expect(fs.readFileSync(path.join(GOC, rel), 'utf8')).toContain(n.chuThich)
    }
  })

  it('trang cài app (public) cũng không còn alert()', () => {
    for (const t of ['public/cai-app.html', 'public/cai-dat.html', 'public/cai-app/index.html']) {
      const s = fs.readFileSync(path.join(GOC, t), 'utf8')
      expect(s).not.toMatch(/(^|[^.\w])(alert|confirm)\s*\(/m)
      expect(s).toContain('id="modal-android"')
    }
  })

  it('hai chỗ đã thay dùng hoiXacNhan', () => {
    for (const t of ['src/components/chien-dich/DsChienDichDaGiao.tsx', 'src/components/KhoiKhacPhuc3CheDo.tsx']) {
      expect(fs.readFileSync(path.join(GOC, t), 'utf8')).toMatch(/await hoiXacNhan\(/)
    }
  })
})

function nutMo(vo?: string) {
  const khung = document.createElement('div')
  if (vo) khung.className = vo
  const nut = document.createElement('button')
  nut.textContent = 'mở'
  khung.appendChild(nut)
  document.body.appendChild(khung)
  nut.focus()
  return nut
}

describe('hoiXacNhan', () => {
  const HOI = { tieuDe: 'Huỷ chiến dịch?', noiDung: 'Học sinh sẽ không nhận câu nữa.', nhanDongY: 'Huỷ chiến dịch', nguyHiem: true }

  it('bấm nút mang tên việc ⇒ true; nút đỏ; nút an toàn "Giữ lại"; không "OK"', async () => {
    nutMo()
    const p = hoiXacNhan(HOI)
    const hop = await screen.findByRole('alertdialog', { name: 'Huỷ chiến dịch?' })
    expect(hop.getAttribute('aria-modal')).toBe('true')
    expect(hop.textContent).not.toMatch(/\bOK\b|Cancel/)
    const dongY = within(hop).getByRole('button', { name: 'Huỷ chiến dịch' })
    expect(dongY.className).toContain('hxn-nut--nguy-hiem')
    expect(within(hop).getByRole('button', { name: 'Giữ lại' })).toBeTruthy()
    fireEvent.click(dongY)
    await expect(p).resolves.toBe(true)
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('bấm "Giữ lại" ⇒ false; Esc ⇒ false; bấm nền ⇒ false', async () => {
    nutMo()
    let p = hoiXacNhan(HOI)
    fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Giữ lại' }))
    await expect(p).resolves.toBe(false)
    p = hoiXacNhan(HOI)
    await screen.findByRole('alertdialog')
    fireEvent.keyDown(document, { key: 'Escape' })
    await expect(p).resolves.toBe(false)
    p = hoiXacNhan(HOI)
    await screen.findByRole('alertdialog')
    fireEvent.click(document.querySelector('.hxn-man') as HTMLElement)
    await expect(p).resolves.toBe(false)
  })

  it('việc thường: nút không đỏ, nút không đồng ý mặc định "Huỷ"', async () => {
    nutMo()
    const p = hoiXacNhan({ tieuDe: 'Kết thúc?', nhanDongY: 'Kết thúc ngay' })
    const hop = await screen.findByRole('alertdialog')
    expect(within(hop).getByRole('button', { name: 'Kết thúc ngay' }).className).not.toContain('hxn-nut--nguy-hiem')
    fireEvent.click(within(hop).getByRole('button', { name: 'Huỷ' }))
    await expect(p).resolves.toBe(false)
  })

  it('tiêu điểm vào nút an toàn; đóng xong trả tiêu điểm về nút đã mở', async () => {
    const nut = nutMo()
    const p = hoiXacNhan(HOI)
    const hop = await screen.findByRole('alertdialog')
    await waitFor(() => expect(document.activeElement).toBe(within(hop).getByRole('button', { name: 'Giữ lại' })))
    fireEvent.keyDown(document, { key: 'Escape' })
    await p
    expect(document.activeElement).toBe(nut)
  })

  it('nằm trong vỏ màu đúng app: app thầy `.m3.vo-thay`, app HS/PH `.m3` — vỏ `display: contents`, gỡ khi đóng', async () => {
    nutMo('m3 vo-thay')
    expect(nhanVo()).toBe('thay')
    let p = hoiXacNhan(HOI)
    let vo = (await screen.findByRole('alertdialog')).closest('[data-vo-cong="hop-thoai"]') as HTMLElement
    expect(vo.className).toBe('m3 vo-thay')
    expect(vo.style.display).toBe('contents')
    fireEvent.keyDown(document, { key: 'Escape' })
    await p
    expect(document.querySelector('[data-vo-cong="hop-thoai"]')).toBeNull()
    document.body.innerHTML = ''
    nutMo('m3')
    expect(nhanVo()).toBe('m3')
    p = hoiXacNhan({ ...HOI, vo: undefined })
    vo = (await screen.findByRole('alertdialog')).closest('[data-vo-cong="hop-thoai"]') as HTMLElement
    expect(vo.className).toBe('m3')
    fireEvent.keyDown(document, { key: 'Escape' })
    await p
  })
})

describe('baoTin và hoiNhap', () => {
  it('baoTin: một nút, tiêu điểm vào nút đó, bấm thì xong', async () => {
    nutMo()
    const p = baoTin({ tieuDe: 'Chưa lưu được', noiDung: 'Mạng yếu, thử lại sau.' })
    const hop = await screen.findByRole('alertdialog', { name: 'Chưa lưu được' })
    const nut = within(hop).getAllByRole('button')
    expect(nut).toHaveLength(1)
    await waitFor(() => expect(document.activeElement).toBe(nut[0]))
    fireEvent.click(nut[0])
    await expect(p).resolves.toBeUndefined()
  })

  it('hoiNhap: trả chữ đã gõ; Esc ⇒ null; là dialog, tiêu điểm vào ô', async () => {
    nutMo()
    let p = hoiNhap({ tieuDe: 'Đổi tên', nhan: 'Tên mới', macDinh: 'cũ', nhanDongY: 'Đổi tên' })
    const hop = await screen.findByRole('dialog', { name: 'Đổi tên' })
    const o = within(hop).getByRole('textbox') as HTMLInputElement
    expect(o.value).toBe('cũ')
    await waitFor(() => expect(document.activeElement).toBe(o))
    fireEvent.change(o, { target: { value: 'mới' } })
    fireEvent.keyDown(o, { key: 'Enter' })
    await expect(p).resolves.toBe('mới')
    p = hoiNhap({ tieuDe: 'Đổi tên', nhan: 'Tên mới' })
    await screen.findByRole('dialog')
    fireEvent.keyDown(document, { key: 'Escape' })
    await expect(p).resolves.toBeNull()
  })
})
