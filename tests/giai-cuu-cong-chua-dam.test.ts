/** CỔNG LUẬT DẪM: 10 000 ca giả lập, không ca nào được sai. */
import { describe, it, expect } from 'vitest'
import { CAU_HINH } from '../src/game/giai-cuu-cong-chua/cau-hinh'
import { xuLyDam, chamDinhDau, type ThanhPhan } from '../src/game/giai-cuu-cong-chua/xu-ly-dam'
import { HOA_CHAT } from '../src/game/giai-cuu-cong-chua/hoa-chat'
import { xuLyHoaChat } from '../src/game/giai-cuu-cong-chua/bang-khac-che'

const CT = HOA_CHAT.map((h) => h.ct)

function nguoi(p: Partial<ThanhPhan> = {}): ThanhPhan {
  return {
    x: 0, y: 0, vy: 0,
    rong: CAU_HINH.RONG_NHAN_VAT, cao: CAU_HINH.CAO_NHAN_VAT,
    batTuDen: 0, song: true, hoaChat: 'Zn',
    ...p,
  }
}

/** Bộ sinh ngẫu nhiên CÓ HẠT GIỐNG — chạy lại cho ra đúng bộ ca cũ. */
function tao(hat: number): () => number {
  let s = hat >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

describe('luật dẫm — 10 000 ca', () => {
  it('0 ca người ĐỨNG YÊN bị loại', () => {
    const r = tao(20260914)
    let sai = 0
    for (let i = 0; i < 10000; i++) {
      const bi = nguoi({ x: 0, y: 0, vy: 0, hoaChat: CT[Math.floor(r() * 12)]! })
      // người kia đứng yên hoặc đi ngang — vy = 0
      const dam = nguoi({ x: (r() - 0.5) * 60, y: bi.cao * r(), vy: 0, hoaChat: CT[Math.floor(r() * 12)]! })
      if (xuLyDam(dam, bi, 0).cham !== 'khongCham') sai++
    }
    expect(sai).toBe(0)
  })

  it('0 ca dẫm trúng khi đang BAY LÊN', () => {
    const r = tao(7)
    let sai = 0
    for (let i = 0; i < 10000; i++) {
      const bi = nguoi({ hoaChat: CT[Math.floor(r() * 12)]! })
      const dam = nguoi({
        x: (r() - 0.5) * 20,
        y: bi.y + bi.cao + (r() - 0.5) * CAU_HINH.CAO_VUNG_DAU,
        vy: r() * 900,                      // vy > 0 là đang bay LÊN
        hoaChat: CT[Math.floor(r() * 12)]!,
      })
      if (xuLyDam(dam, bi, 0).cham !== 'khongCham') sai++
    }
    expect(sai).toBe(0)
  })

  it('0 ca dẫm trúng người đang BẤT TỬ', () => {
    const r = tao(99)
    let sai = 0
    for (let i = 0; i < 10000; i++) {
      const giay = r() * 100
      const bi = nguoi({ batTuDen: giay + 0.01 + r(), hoaChat: CT[Math.floor(r() * 12)]! })
      const dam = nguoi({
        x: 0, y: bi.y + bi.cao, vy: -CAU_HINH.TOC_DO_ROI_TOI_THIEU - r() * 400,
        hoaChat: CT[Math.floor(r() * 12)]!,
      })
      if (xuLyDam(dam, bi, giay).cham !== 'khongCham') sai++
    }
    expect(sai).toBe(0)
  })

  it('rơi đúng đỉnh đầu, đủ nhanh, đối thủ không bất tử ⇒ LUÔN tính là dẫm', () => {
    const r = tao(1234)
    let truot = 0
    for (let i = 0; i < 10000; i++) {
      const bi = nguoi({ hoaChat: CT[Math.floor(r() * 12)]! })
      const dam = nguoi({
        x: (r() - 0.5) * (CAU_HINH.RONG_NHAN_VAT - 2),
        y: bi.y + bi.cao + (r() - 0.5) * (CAU_HINH.CAO_VUNG_DAU * 1.6),
        vy: -CAU_HINH.TOC_DO_ROI_TOI_THIEU - r() * 500,
        hoaChat: CT[Math.floor(r() * 12)]!,
      })
      if (!chamDinhDau(dam, bi, 0)) truot++
    }
    expect(truot).toBe(0)
  })

  it('ai mất mạng phải khớp ĐÚNG bảng hoá chất, cả 144 cặp chất', () => {
    const sai: string[] = []
    for (const a of CT) {
      for (const b of CT) {
        const bi = nguoi({ hoaChat: b })
        const dam = nguoi({ y: bi.y + bi.cao, vy: -400, hoaChat: a })
        const kq = xuLyDam(dam, bi, 0)
        const hoa = xuLyHoaChat(a, b)
        if (a === b) { if (kq.matMang.length !== 0) sai.push(`${a}+${b} cùng chất mà có người mất mạng`); continue }
        if (hoa.loai === 'khongPhanUng' && kq.matMang.length !== 0) sai.push(`${a}+${b} trơ mà mất mạng`)
        if (hoa.loai === 'trungHoa' && kq.matMang.length !== 2) sai.push(`${a}+${b} trung hoà mà không phải cả hai`)
        if (hoa.loai === 'khacChe') {
          const dung = hoa.thang === a ? 'nguoiBiDam' : 'nguoiDam'
          if (kq.matMang.length !== 1 || kq.matMang[0] !== dung) sai.push(`${a} dẫm ${b}: phải là ${dung}`)
        }
      }
    }
    expect(sai).toEqual([])
  })

  it('dẫm người khắc chế mình ⇒ CHÍNH MÌNH mất mạng', () => {
    const bi = nguoi({ hoaChat: 'Zn' })
    const dam = nguoi({ y: bi.y + bi.cao, vy: -400, hoaChat: 'CuSO₄' })
    const kq = xuLyDam(dam, bi, 0)
    expect(kq.matMang).toEqual(['nguoiDam'])
    expect(kq.hoa?.pt).toBe('Zn + CuSO₄ → ZnSO₄ + Cu↓')
  })
})
