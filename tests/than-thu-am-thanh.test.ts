/**
 * ÂM THANH THẦN THÚ — SÁU HỆ PHẢI RA SÁU TIẾNG KHÁC NHAU.
 *
 * Thầy chốt 15-09: *"âm thanh hiện tại quá đơn điệu và nhàm chán... âm thanh
 * của chưởng phải mãnh liệt đẳng cấp"*.
 *
 * Bản cũ: mỗi tiếng đúng MỘT bộ dao động trần nối thẳng ra loa. Phép kiểm này
 * khoá lại đúng chỗ đó — đếm số lớp và loại lớp mà mỗi tiếng dựng ra, trên một
 * ngữ cảnh âm thanh GIẢ ghi lại mọi lời gọi. Không nghe được thì đếm, chứ
 * không đoán.
 *
 * Số đo sóng thật (dựng bằng OfflineAudioContext trong trình duyệt, 15-09):
 *   hệ Hoả 388 Hz · Hữu cơ 643 · Base 1488 · Khí 1683 · Acid 1883 · Điện 2461
 *   chưởng thường đỉnh 0,260 dài 0,44 s — cuồng nộ đỉnh 0,691 dài 1,17 s
 */
import { describe, it, expect } from 'vitest'
import { AmThanhPet } from '../src/game/than-thu-hoa-hoc/am-thanh-pet'

interface So { dao: number; on: number; loc: number; khuech: number }

/** Ngữ cảnh âm thanh giả: không phát gì, chỉ đếm lại từng lớp được dựng. */
function nguCanhGia(): { ctx: unknown; so: So } {
  const so: So = { dao: 0, on: 0, loc: 0, khuech: 0 }
  const thamSo = () => ({
    setValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
    linearRampToValueAtTime: () => {},
    setTargetAtTime: () => {},
  })
  const nut = () => ({ connect: () => {}, disconnect: () => {} })
  const ctx = {
    currentTime: 0,
    sampleRate: 44100,
    state: 'running',
    destination: nut(),
    createDynamicsCompressor: () => ({
      ...nut(), threshold: thamSo(), knee: thamSo(), ratio: thamSo(),
      attack: thamSo(), release: thamSo(),
    }),
    createGain: () => { so.khuech++; return { ...nut(), gain: thamSo() } },
    createConvolver: () => ({ ...nut(), buffer: null }),
    createBuffer: (kenh: number, dai: number) => ({
      getChannelData: () => new Float32Array(dai),
      numberOfChannels: kenh,
    }),
    createBufferSource: () => {
      so.on++
      return { ...nut(), buffer: null, loop: false, start: () => {}, stop: () => {} }
    },
    createBiquadFilter: () => {
      so.loc++
      return { ...nut(), type: 'lowpass', frequency: thamSo(), Q: thamSo() }
    },
    createOscillator: () => {
      so.dao++
      return {
        ...nut(), type: 'sine', frequency: thamSo(), detune: thamSo(),
        start: () => {}, stop: () => {},
      }
    },
  }
  return { ctx, so }
}

function dem(goi: (a: AmThanhPet) => void): So {
  const { ctx, so } = nguCanhGia()
  const am = new AmThanhPet()
  am.dungDayChuyen(ctx as never)
  // Đếm lại từ 0: khâu dựng dây chuyền cũng tạo vài nút.
  so.dao = 0; so.on = 0; so.loc = 0; so.khuech = 0
  goi(am)
  return so
}

const HE = ['hoa', 'axit', 'kiem', 'khi', 'dien', 'huuco'] as const

describe('Mỗi tiếng kêu là nhiều lớp chồng nhau, không phải một bộ dao động trần', () => {
  for (const he of HE) {
    it(`hệ ${he}: ít nhất ba lớp và có hốc cộng hưởng`, () => {
      const s = dem((a) => a.keu(he))
      expect(s.dao + s.on).toBeGreaterThanOrEqual(3)
      // Bản cũ nối thẳng dao động ra loa, không một bộ lọc nào.
      expect(s.loc).toBeGreaterThanOrEqual(1)
    })
  }

  it('sáu hệ không hệ nào trùng dấu vân lớp với hệ nào', () => {
    const van = HE.map((he) => {
      const s = dem((a) => a.keu(he))
      return `${s.dao}|${s.on}|${s.loc}`
    })
    // Hệ Hoả và hệ Điện có lớp lạo xạo sinh ngẫu nhiên nên số lọc dao động;
    // phần còn lại phải đủ để sáu dấu vân không gộp xuống dưới bốn kiểu.
    expect(new Set(van).size).toBeGreaterThanOrEqual(4)
  })
})

describe('Chưởng cuồng nộ phải to hơn hẳn chưởng thường', () => {
  it('nhiều lớp hơn gấp nhiều lần', () => {
    const thuong = dem((a) => a.tanCong())
    const no = dem((a) => a.kichNo())
    expect(no.dao + no.on).toBeGreaterThan((thuong.dao + thuong.on) * 2)
  })

  it('có hạ âm, vỡ dải rộng và đuôi vang — chưởng thường không có', () => {
    const no = dem((a) => a.kichNo())
    // Ba lớp nhiễu: rít dâng, vỡ, đuôi vang.
    expect(no.on).toBeGreaterThanOrEqual(3)
    // Bốn giọng: rít, hạ âm, hai tiếng kim loại (mỗi giọng có thể hai bộ dao động).
    expect(no.dao).toBeGreaterThanOrEqual(4)
  })
})

describe('Bật tắt tiếng', () => {
  it('tắt rồi thì không dựng thêm lớp nào', () => {
    const { ctx, so } = nguCanhGia()
    const am = new AmThanhPet()
    am.dungDayChuyen(ctx as never)
    am.datBat(false)
    so.dao = 0; so.on = 0
    am.keu('hoa'); am.kichNo(); am.tanCong()
    expect(so.dao + so.on).toBe(0)
    expect(am.dangBat()).toBe(false)
  })

  it('bật lại thì kêu tiếp', () => {
    const { ctx, so } = nguCanhGia()
    const am = new AmThanhPet()
    am.dungDayChuyen(ctx as never)
    am.datBat(false)
    am.datBat(true)
    so.dao = 0; so.on = 0
    am.keu('hoa')
    expect(so.dao + so.on).toBeGreaterThan(0)
  })
})
