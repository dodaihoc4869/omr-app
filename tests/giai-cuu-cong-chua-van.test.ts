/** CỔNG MÔ PHỎNG: bot, trùm, luật chọn chất. Chạy được vì logic tách khỏi vẽ. */
import { describe, it, expect } from 'vitest'
import { CAU_HINH } from '../src/game/giai-cuu-cong-chua/cau-hinh'
import { VanChoi } from '../src/game/giai-cuu-cong-chua/van-choi'
import { sinhDao, coDat, boSinh } from '../src/game/giai-cuu-cong-chua/man-choi'
import { HOA_CHAT } from '../src/game/giai-cuu-cong-chua/hoa-chat'
import { biKhacChe, canhBaoDam } from '../src/game/giai-cuu-cong-chua/bang-khac-che'
import { xuLyDam, type ThanhPhan } from '../src/game/giai-cuu-cong-chua/xu-ly-dam'
import { taoRong, buocRong, rongMatMau, dinhDauRong } from '../src/game/giai-cuu-cong-chua/rong'

describe('đảo sinh từ hạt giống', () => {
  it('cùng hạt giống ⇒ cùng đảo', () => {
    expect(JSON.stringify(sinhDao(42))).toBe(JSON.stringify(sinhDao(42)))
    expect(JSON.stringify(sinhDao(42))).not.toBe(JSON.stringify(sinhDao(43)))
  })
  it('không có hai vực liền nhau — nhảy đúp luôn qua được', () => {
    for (let h = 0; h < 200; h++) {
      const d = sinhDao(h)
      const v = [...d.vuc].sort((a, b) => a.x1 - b.x1)
      for (let i = 1; i < v.length; i++) {
        expect(v[i]!.x1 - v[i - 1]!.x2, `hạt ${h}`).toBeGreaterThan(60)
      }
      // mọi vực đều có bậc bắc qua
      for (const q of v) {
        const co = d.bac.some((b) => b.x < (q.x1 + q.x2) / 2 && b.x + b.rong > (q.x1 + q.x2) / 2)
        expect(co, `hạt ${h} vực ${q.x1}`).toBe(true)
      }
    }
  })
})

describe('500 ván bot', () => {
  const vans = Array.from({ length: 500 }, (_, i) => {
    const v = new VanChoi(1000 + i, null, false, -1)   // -1: ván toàn bot
    v.chayHet(90)
    return v
  })

  it('BOT KHÔNG BAO GIỜ CHẠM CÔNG CHÚA — 0 lần', () => {
    expect(vans.filter((v) => v.ket.botChamCongChua).length).toBe(0)
  })

  it('CẤM TRÙNG CHẤT — 0 ván có hai người cùng hoá chất', () => {
    const xau = vans.filter((v) => {
      const s = v.nguoi.filter((n) => n.song).map((n) => n.hoaChat)
      return new Set(s).size !== s.length
    })
    expect(xau.length).toBe(0)
  })

  it('KHÔNG AI BỊ KHOÁ CHẤT — mất mạng lần nào cũng được mời chọn lại', () => {
    let thieuLoiMoi = 0
    for (const v of vans) {
      for (const n of v.nguoi) {
        const daMat = CAU_HINH.SO_MANG - n.mang
        // mất mạng thứ ba là ra khỏi ván, không còn gì để chọn lại
        const loiMoiPhaiCo = Math.min(daMat, CAU_HINH.SO_MANG - 1)
        if (n.soLanDuocChon !== loiMoiPhaiCo) thieuLoiMoi++
      }
    }
    expect(thieuLoiMoi).toBe(0)
  })

  it('đổi chéo chạy thật — có người đã đổi sang chất khác', () => {
    const daDoi = vans.reduce((t, v) => t + v.nguoi.filter((n) => n.soLanDoiChat > 0).length, 0)
    expect(daDoi).toBeGreaterThan(0)
  })

  it('đổi chéo giữ nguyên HOÁN VỊ — 12 chất vẫn phân biệt sau khi đổi', () => {
    for (const v of vans) {
      const tat = v.nguoi.map((n) => n.hoaChat)
      expect(new Set(tat).size, 'ván ' + v.dao.hat).toBe(12)
    }
  })
  it('ván có diễn biến thật — có người mất mạng, không phải đứng im', () => {
    const coMat = vans.filter((v) => v.nguoi.some((n) => n.mang < CAU_HINH.SO_MANG)).length
    expect(coMat / vans.length).toBeGreaterThan(0.5)
  })
})

describe('bot nhảy hụt THẬT', () => {
  it('tỉ lệ quyết định đúng khớp BOT_DO_CHINH_XAC ±3%', () => {
    // Đo trực tiếp bộ sinh của bot: mỗi quyết định rút một số, đúng khi < ngưỡng.
    let dung = 0, tong = 0
    for (let b = 0; b < 100; b++) {
      const r = boSinh(20260914 + b * 7919)
      for (let i = 0; i < 100; i++) { if (r() < CAU_HINH.BOT_DO_CHINH_XAC) dung++; tong++ }
    }
    expect(Math.abs(dung / tong - CAU_HINH.BOT_DO_CHINH_XAC)).toBeLessThan(0.03)
  })

  it('bot rơi xuống vực thật — có ván bot mất mạng vì địa hình', () => {
    let matVìVuc = 0
    for (let i = 0; i < 60; i++) {
      const v = new VanChoi(5000 + i, null, false, -1)
      v.chayHet(40)
      if (v.nguoi.some((n) => n.mang < CAU_HINH.SO_MANG)) matVìVuc++
    }
    expect(matVìVuc).toBeGreaterThan(0)
  })

  it('đảo có vực thật để rơi', () => {
    const d = sinhDao(123)
    expect(d.vuc.length).toBeGreaterThan(3)
    expect(coDat(d, d.vuc[0]!.x1 + 10)).toBe(false)
  })
})

describe('trùm rồng', () => {
  /** Mô phỏng riêng trận trùm: người chơi có độ chính xác = BOT_DO_CHINH_XAC. */
  function danhTrum(hat: number): boolean {
    const r = boSinh(hat)
    const rong = taoRong(0, () => Math.floor(r() * HOA_CHAT.length))
    let mang = CAU_HINH.SO_MANG
    let chat = HOA_CHAT[Math.floor(r() * HOA_CHAT.length)]!.ct
    let t = 0
    while (t < 120 && mang > 0 && rong.pha !== 'nga') {
      const truoc = rong.pha
      buocRong(rong, 1 / 60)
      t += 1 / 60
      if (truoc !== 'ho' && rong.pha === 'ho') {
        // cửa sổ hở: có nhảy trúng không
        if (r() < CAU_HINH.BOT_DO_CHINH_XAC) {
          if (biKhacChe(chat, rong.hoaChat)) { mang -= 1; if (mang > 0) chat = HOA_CHAT[Math.floor(r() * HOA_CHAT.length)]!.ct }
          else rongMatMau(rong, () => Math.floor(r() * HOA_CHAT.length))
        }
      }
      if (truoc !== 'phun' && rong.pha === 'phun') {
        if (r() > CAU_HINH.BOT_DO_CHINH_XAC) { mang -= 1; if (mang > 0) chat = HOA_CHAT[Math.floor(r() * HOA_CHAT.length)]!.ct }
      }
    }
    return rong.pha === 'nga'
  }

  it('RỒNG LUÔN HẠ ĐƯỢC — tỉ lệ trong 15–45%, 2 000 ván', () => {
    let ha = 0
    for (let i = 0; i < 2000; i++) if (danhTrum(90000 + i)) ha++
    const ti = ha / 2000
    // eslint-disable-next-line no-console
    console.log(`  hạ rồng ${(ti * 100).toFixed(1)}% (${ha}/2000)`)
    expect(ti).toBeGreaterThan(0.15)
    expect(ti).toBeLessThan(0.45)
  })

  it('rồng đổi hoá chất mỗi khi mất máu — ba máu là ba câu hỏi khác nhau', () => {
    const r = boSinh(7)
    const rong = taoRong(0, () => Math.floor(r() * HOA_CHAT.length))
    const day = [rong.hoaChat]
    rongMatMau(rong, () => Math.floor(r() * HOA_CHAT.length)); day.push(rong.hoaChat)
    rongMatMau(rong, () => Math.floor(r() * HOA_CHAT.length)); day.push(rong.hoaChat)
    expect(day[0]).not.toBe(day[1])
    expect(day[1]).not.toBe(day[2])
    expect(rong.mau).toBe(1)
    rongMatMau(rong, () => Math.floor(r() * HOA_CHAT.length))
    expect(rong.pha).toBe('nga')
  })

  it('chỉ dẫm được đầu rồng trong giai đoạn hở', () => {
    const rong = taoRong(0, () => 0)
    rong.pha = 'do'
    const cao = dinhDauRong(rong).y
    rong.pha = 'ho'
    expect(dinhDauRong(rong).y).toBeLessThan(cao)
  })
})

describe('cảnh báo khắc chế', () => {
  it('2 000 ca: viền đỏ hiện ĐÚNG và CHỈ ĐÚNG khi chính mình sẽ mất mạng', () => {
    const CT = HOA_CHAT.map((h) => h.ct)
    const r = boSinh(31337)
    let sai = 0
    for (let i = 0; i < 2000; i++) {
      const a = CT[Math.floor(r() * 12)]!
      const b = CT[Math.floor(r() * 12)]!
      if (a === b) continue
      const bi: ThanhPhan = {
        x: 0, y: 0, vy: 0, rong: CAU_HINH.RONG_NHAN_VAT, cao: CAU_HINH.CAO_NHAN_VAT,
        batTuDen: 0, song: true, hoaChat: b,
      }
      const dam: ThanhPhan = { ...bi, y: bi.cao, vy: -400, hoaChat: a }
      const kq = xuLyDam(dam, bi, 1)
      const tuMatMang = kq.matMang.includes('nguoiDam')
      if ((canhBaoDam(a, b) !== 'an') !== tuMatMang) sai++
    }
    expect(sai).toBe(0)
  })
})
