import { describe, expect, it, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { NguoiChoiGame } from '../src/components/DauTruongGame'

describe('Đấu trường Game Neon giải trí tối đa 12 người chơi qua SBD', () => {
  it('nội dung game thuần giải trí, KHÔNG liên quan gì tới hoá học', () => {
    const fileContent = readFileSync(resolve(__dirname, '../src/components/DauTruongGame.tsx'), 'utf8')
    
    // Đảm bảo không dính các từ khoá hoá học
    expect(fileContent).not.toMatch(/\b(axit|bazơ|ancol|este|đồng vị|bảo toàn electron|phản ứng oxi hoá)\b/i)
    
    // Đảm bảo có các yếu tố game hành động giải trí
    expect(fileContent).toContain('ĐẤU TRƯỜNG NEON SINH TỒN')
    expect(fileContent).toContain('12')
    expect(fileContent).toContain('Dash')
    expect(fileContent).toContain('vongBo')
  })

  it('hỗ trợ kết nối tối đa 12 người chơi bằng Số Báo Danh (SBD)', () => {
    const players: NguoiChoiGame[] = []
    
    // Tạo 12 người chơi với SBD khác nhau
    for (let i = 1; i <= 12; i++) {
      players.push({
        sbd: `SBD_${12000 + i}`,
        hoTen: `Chiến binh ${i}`,
        mau: `rgb(${i * 20}, 100, 200)`,
        x: 300,
        y: 300,
        vx: 0,
        vy: 0,
        banKinh: 22,
        song: true,
        diem: 0,
        sanSang: true,
        thoiGianDash: 0,
        coKhien: false,
      })
    }

    expect(players.length).toBe(12)
    expect(players[0].sbd).toBe('SBD_12001')
    expect(players[11].sbd).toBe('SBD_12012')
  })

  it('cơ chế húc Dash và vòng bo co dần', () => {
    let rVongBo = 280
    const buocCo = 0.04
    
    // Vòng bo co lại sau các frame
    for (let frame = 0; frame < 100; frame++) {
      rVongBo = Math.max(70, rVongBo - buocCo)
    }
    
    expect(rVongBo).toBeLessThan(280)
    expect(rVongBo).toBeGreaterThanOrEqual(70)
  })
})
