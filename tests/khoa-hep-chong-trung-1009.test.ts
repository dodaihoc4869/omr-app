// T3 + T4 — KHACPHUCTREOHANGLOAT.md.
//
//   T3: `vaoThi` đọc HẾT ngoài khoá, chỉ ôm khoá quanh đoạn kiểm-rồi-ghi.
//   T4: `submit` nguyên tử và LÀM LẠI ĐƯỢC — khoá chống trùng `maCa|sbd|lanThu`.
//
// VÌ SAO HAI THUỐC NÀY ĐI CÙNG MỘT TỆP: T5 sắp bật thử-lại-tự-động cho `submit`,
// và mục 4 của đặc tả cấm thẳng — "cấm thử lại một hành động ghi chưa có khoá
// chống trùng". T4 là điều kiện để T5 được phép tồn tại. Gỡ T4 ra mà quên tắt
// T5 là mỗi lần chập mạng lại ghi đè một bài đã nộp.
//
// Các phép kiểm dưới đây CHẠY THẬT hàm rút từ `.gs`, trên Sheet giả có đếm ô.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const GS = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')

function rutHam(ten: string): string {
  const dau = GS.indexOf(`function ${ten}(`)
  if (dau < 0) throw new Error(`Không thấy hàm ${ten}`)
  let sau = 0
  for (let k = GS.indexOf('{', dau); k < GS.length; k++) {
    if (GS[k] === '{') sau++
    else if (GS[k] === '}') {
      sau--
      if (sau === 0) return GS.slice(dau, k + 1)
    }
  }
  throw new Error(`Hàm ${ten} không đóng ngoặc`)
}

function rutHang(ten: string): string[] {
  const m = new RegExp(`const ${ten} = (\\[[^\\]]*\\])`).exec(GS)
  if (!m) throw new Error(`Không thấy hằng ${ten}`)
  return JSON.parse(m[1].replace(/'/g, '"')) as string[]
}

const LUOT_HEADERS = rutHang('LUOT_HEADERS')
const LUOT_COT_KHOANOP = Number(/const LUOT_COT_KHOANOP = (\d+)/.exec(GS)![1])

/** Sheet giả: đếm ô đọc, và đếm số LƯỢT GỌI Sheets (cái đắt thật trên Apps
 * Script là số lượt gọi, không chỉ số ô). */
class SheetGia {
  o: unknown[][]
  soODoc = 0
  soLuotGoi = 0
  coTextFinder: boolean
  constructor(hang: unknown[][], coTextFinder = true) {
    this.o = hang.map((r) => r.slice())
    this.coTextFinder = coTextFinder
  }
  getLastRow() {
    return this.o.length
  }
  getDataRange() {
    this.soLuotGoi++
    this.soODoc += this.o.length * (this.o[0]?.length ?? 0)
    return { getValues: () => this.o.map((r) => r.slice()) }
  }
  getRange(row: number, col: number, nr = 1, nc = 1) {
    const t = this
    return {
      getValues: () => {
        t.soLuotGoi++
        t.soODoc += nr * nc
        const ra: unknown[][] = []
        for (let i = 0; i < nr; i++) {
          const h = t.o[row + i - 1] ?? []
          const d: unknown[] = []
          for (let j = 0; j < nc; j++) d.push(h[col - 1 + j] ?? '')
          ra.push(d)
        }
        return ra
      },
      setValues: (v: unknown[][]) => {
        t.soLuotGoi++
        for (let i = 0; i < v.length; i++) {
          const h = (t.o[row + i - 1] = t.o[row + i - 1] ?? [])
          for (let j = 0; j < v[i].length; j++) h[col - 1 + j] = v[i][j]
        }
      },
      setValue: (v: unknown) => {
        t.soLuotGoi++
        const h = (t.o[row - 1] = t.o[row - 1] ?? [])
        h[col - 1] = v
      },
      createTextFinder: (tim: string) => {
        if (!t.coTextFinder) throw new Error('môi trường không có TextFinder')
        let nguyenO = false
        const api = {
          matchEntireCell: (b: boolean) => {
            nguyenO = b
            return api
          },
          findAll: () => {
            // Google tìm trên máy chủ của họ: KHÔNG tính là ô kéo về script.
            t.soLuotGoi++
            const ra: { getRow: () => number }[] = []
            for (let i = 0; i < nr; i++) {
              const v = String((t.o[row + i - 1] ?? [])[col - 1] ?? '')
              const khop = nguyenO ? v === tim : v.indexOf(tim) >= 0
              if (khop) {
                const r = row + i
                ra.push({ getRow: () => r })
              }
            }
            return ra
          },
        }
        return api
      },
    }
  }
}

interface Gs {
  timLuotMoiNhat_: (sh: unknown, maCa: string, sbd: string) => Record<string, unknown> | null
  khoaNop_: (maCa: string, sbd: string, lanThu: number) => string
  nopTrungRoi_: (luot: unknown, khoa: string) => boolean
  doiKhoa_: (lock: unknown, hanMs?: number) => boolean
  HAN_CHO_KHOA_MS: number
}

function dungGs(nn = () => 0.5): Gs {
  const than = [
    `const LUOT_HEADERS = ${JSON.stringify(LUOT_HEADERS)}`,
    `const LUOT_COT_KHOANOP = ${LUOT_COT_KHOANOP}`,
    /const const HAN_CHO_KHOA_MS/.test(GS) ? '' : `const HAN_CHO_KHOA_MS = ${/const HAN_CHO_KHOA_MS = (\d+)/.exec(GS)![1]}`,
    rutHam('docLuot_'),
    rutHam('timLuotMoiNhat_'),
    rutHam('khoaNop_'),
    rutHam('nopTrungRoi_'),
    rutHam('doiKhoa_'),
    'return { timLuotMoiNhat_, khoaNop_, nopTrungRoi_, doiKhoa_, HAN_CHO_KHOA_MS }',
  ].join('\n')
  const Utilities = { sleep: () => {} }
  const Math2 = Object.create(Math) as Math
  ;(Math2 as unknown as { random: () => number }).random = nn
  return new Function('Utilities', 'Math', than)(Utilities, Math2) as Gs
}

/** LuotThi giả kích thước thật: R dòng, 23 cột, ba cột JSON rất nặng. */
function luotGia(soDong: number, coTextFinder = true): SheetGia {
  const hang: unknown[][] = [LUOT_HEADERS.slice()]
  for (let i = 0; i < soDong; i++) {
    const d = Array.from({ length: LUOT_HEADERS.length }, () => '' as unknown)
    d[0] = 'ca' + (i % 40)
    d[1] = String(10000 + (i % 300))
    d[2] = 1 + Math.floor(i / 300)
    d[7] = 'dang_lam'
    d[8] = 'A'.repeat(5000)
    d[11] = 'B'.repeat(5000)
    d[12] = 'Em ' + (i % 300)
    d[21] = 'C'.repeat(5000)
    hang.push(d)
  }
  return new SheetGia(hang, coTextFinder)
}

describe('T1/T3 — TRA MỘT DÒNG, KHÔNG QUÉT BẢNG', () => {
  it('tìm ĐÚNG dòng, đúng lượt mới nhất của em', () => {
    const gs = dungGs()
    const sh = luotGia(600)
    // Em 10000 có hai lượt: dòng 2 (LanThu 1) và dòng 302 (LanThu 2), ca khác nhau.
    const l = gs.timLuotMoiNhat_(sh, 'ca0', '10000') as Record<string, unknown>
    expect(l).not.toBeNull()
    expect(l.sbd).toBe('10000')
    expect(l.maCa).toBe('ca0')
    expect(l.row).toBe(2)
  })

  it('lấy LƯỢT MỚI NHẤT khi em có nhiều lượt trong CÙNG một ca', () => {
    const gs = dungGs()
    const sh = luotGia(10)
    // Dựng thêm hai lượt cùng ca cho một em, lượt sau LanThu lớn hơn.
    sh.o.push(['caX', '77777', 1, '', '', '', '', 'da_nop', '', '', '', '', 'Em', '', '', '', '', '', '', '', '', '', 'caX|77777|1'])
    sh.o.push(['caX', '77777', 3, '', '', '', '', 'dang_lam', '', '', '', '', 'Em', '', '', '', '', '', '', '', '', '', ''])
    sh.o.push(['caX', '77777', 2, '', '', '', '', 'da_nop', '', '', '', '', 'Em', '', '', '', '', '', '', '', '', '', ''])
    const l = gs.timLuotMoiNhat_(sh, 'caX', '77777') as Record<string, unknown>
    expect(l.lanThu).toBe(3)
    expect(l.trangThai).toBe('dang_lam')
  })

  it('ĐÍCH BẢNG MỤC 3 DÒNG 6 — số ô đọc mỗi lượt tra ≤ 220', () => {
    const gs = dungGs()
    const sh = luotGia(1800)
    gs.timLuotMoiNhat_(sh, 'ca0', '10000')
    // eslint-disable-next-line no-console
    console.log(`[T1] LuotThi 1800 dòng × ${LUOT_HEADERS.length} cột · tra một em đọc ${sh.soODoc} ô · ${sh.soLuotGoi} lượt gọi Sheets`)
    expect(sh.soODoc).toBeLessThanOrEqual(220)
    // Và phải ÍT lượt gọi: trên Apps Script mỗi lượt gọi Sheets đắt hơn cả ô.
    //
    // Bảng giả ở đây CỐ Ý khắc nghiệt hơn thật: em 10000 có ba dòng trong cùng
    // ca ('ca0' lặp mỗi 40 dòng, SBD lặp mỗi 300 dòng ⇒ trùng nhau mỗi 600
    // dòng). Ngoài đời một em một ca là MỘT dòng, tức 3 lượt gọi. Trần 6 để
    // phép kiểm vẫn bắt được nếu ai đó đưa một lượt quét bảng trở lại.
    expect(sh.soLuotGoi).toBeLessThanOrEqual(6)
  })

  it('so với cách cũ (quét 19 cột cả bảng) — ít hơn hai bậc', () => {
    const gs = dungGs()
    const sh = luotGia(1800)
    gs.timLuotMoiNhat_(sh, 'ca0', '10000')
    const cu = 1801 * (8 + 2 + 11) // cách cũ: `luotMoiNhatTheoSbd_` bản nhẹ, ba dải, cả bảng
    // eslint-disable-next-line no-console
    console.log(`[T1] cũ ${cu} ô · mới ${sh.soODoc} ô · giảm ${Math.round((1 - sh.soODoc / cu) * 100)}%`)
    expect(sh.soODoc * 100).toBeLessThan(cu)
  })

  it('KHÔNG CHẶN OAN: TextFinder hỏng thì QUÉT LẠI, không trả "chưa vào thi"', () => {
    const gs = dungGs()
    const sh = luotGia(400, false) // môi trường không có TextFinder
    const l = gs.timLuotMoiNhat_(sh, 'ca0', '10000') as Record<string, unknown>
    expect(l).not.toBeNull()
    expect(l.row).toBe(2)
  })

  it('KHÔNG CHẶN OAN: TextFinder tìm hụt (số lưu dạng số) thì cũng quét lại', () => {
    const gs = dungGs()
    const sh = luotGia(50)
    // Ghi SBD dạng SỐ — TextFinder giả so chuỗi nên sẽ hụt.
    sh.o.push(['caY', 88888, 1, '', '', '', '', 'dang_lam', '', '', '', '', 'Em', '', '', '', '', '', '', '', '', '', ''])
    const l = gs.timLuotMoiNhat_(sh, 'caY', '88888') as Record<string, unknown>
    expect(l).not.toBeNull()
    expect(l.lanThu).toBe(1)
  })

  it('em chưa có lượt nào ⇒ null, không nổ', () => {
    const gs = dungGs()
    expect(gs.timLuotMoiNhat_(luotGia(50), 'ca0', '99999')).toBeNull()
    expect(gs.timLuotMoiNhat_(luotGia(0), 'ca0', '10000')).toBeNull()
  })

  it('đọc được cột khoá chống trùng của dòng tìm thấy', () => {
    const gs = dungGs()
    const sh = luotGia(5)
    sh.o.push(['caZ', '55555', 1, '', '', '', '', 'da_nop', '', '', '', '', 'Em', '', '', '', '', '', '', '', '', '', 'caZ|55555|1'])
    const l = gs.timLuotMoiNhat_(sh, 'caZ', '55555') as Record<string, unknown>
    expect(l.khoaNop).toBe('caZ|55555|1')
  })
})

describe('T4 — KHOÁ CHỐNG TRÙNG', () => {
  it('khoá là `maCa|sbd|lanThu`', () => {
    const gs = dungGs()
    expect(gs.khoaNop_('890691', '10022', 2)).toBe('890691|10022|2')
    // Bản app cũ không gửi lanThu ⇒ coi là lượt 1, không phải NaN.
    expect(gs.khoaNop_('890691', '10022', 0 as unknown as number)).toBe('890691|10022|1')
  })

  it('ĐÃ NỘP đúng khoá đó ⇒ nhận lại, KHÔNG ghi đè', () => {
    const gs = dungGs()
    const luot = { trangThai: 'da_nop', khoaNop: 'ca1|10001|1' }
    expect(gs.nopTrungRoi_(luot, 'ca1|10001|1')).toBe(true)
  })

  it('THI LẠI (lanThu mới) ⇒ khoá khác ⇒ VẪN GHI', () => {
    const gs = dungGs()
    const luot = { trangThai: 'da_nop', khoaNop: 'ca1|10001|1' }
    expect(gs.nopTrungRoi_(luot, 'ca1|10001|2')).toBe(false)
  })

  it('lượt ĐANG LÀM ⇒ chưa nộp bao giờ ⇒ phải ghi', () => {
    const gs = dungGs()
    expect(gs.nopTrungRoi_({ trangThai: 'dang_lam', khoaNop: 'ca1|10001|1' }, 'ca1|10001|1')).toBe(false)
  })

  it('bài bị KHOÁ vì rời màn cũng tính là đã nộp', () => {
    const gs = dungGs()
    expect(gs.nopTrungRoi_({ trangThai: 'khoa', khoaNop: 'ca1|10001|1' }, 'ca1|10001|1')).toBe(true)
  })

  it('BẢNG MỤC 3 DÒNG 11 — dòng CŨ chưa có cột khoá vẫn ghi được như trước', () => {
    const gs = dungGs()
    // Mọi ca trước 10/09: cột 23 trống. Không được coi là "đã nhận" —
    // nếu không, em nộp lại sau khi mất mạng sẽ không bao giờ ghi được bài.
    expect(gs.nopTrungRoi_({ trangThai: 'da_nop', khoaNop: '' }, 'ca1|10001|1')).toBe(false)
    expect(gs.nopTrungRoi_({ trangThai: 'da_nop' }, 'ca1|10001|1')).toBe(false)
    expect(gs.nopTrungRoi_(null, 'ca1|10001|1')).toBe(false)
  })

  it('BẢNG MỤC 3 DÒNG 8 — nộp 5 lần cùng khoá: ghi 1 lần, nhận lại 4 lần', () => {
    const gs = dungGs()
    const khoa = gs.khoaNop_('ca1', '10001', 1)
    const dong = { trangThai: 'dang_lam', khoaNop: '' }
    let soLanGhi = 0
    let soLanNhanLai = 0
    for (let i = 0; i < 5; i++) {
      if (gs.nopTrungRoi_(dong, khoa)) {
        soLanNhanLai += 1
        continue
      }
      soLanGhi += 1
      dong.trangThai = 'da_nop'
      dong.khoaNop = khoa // đóng dấu CÙNG lượt ghi cuối
    }
    // eslint-disable-next-line no-console
    console.log(`[T4] 5 lượt nộp cùng khoá · ghi ${soLanGhi} lần · nhận lại ${soLanNhanLai} lần`)
    expect(soLanGhi).toBe(1)
    expect(soLanNhanLai).toBe(4)
  })
})

describe('T3 — HẠN CHỜ KHOÁ VÀ LÙI NGẪU NHIÊN', () => {
  it('hạn chờ nâng lên 20 giây đúng như đặc tả', () => {
    expect(dungGs().HAN_CHO_KHOA_MS).toBe(20000)
  })

  it('lấy được khoá ngay ⇒ không nghỉ, không thử lại', () => {
    const gs = dungGs()
    let lan = 0
    expect(gs.doiKhoa_({ tryLock: () => (lan++, true) })).toBe(true)
    expect(lan).toBe(1)
  })

  it('hết hạn lần đầu ⇒ THỬ THÊM một lần', () => {
    const gs = dungGs()
    let lan = 0
    expect(gs.doiKhoa_({ tryLock: () => ++lan >= 2 })).toBe(true)
    expect(lan).toBe(2)
  })

  it('vẫn không được ⇒ NÉM LỖI, cấm nuốt — máy em còn giữ bài và gửi lại', () => {
    const gs = dungGs()
    expect(() => gs.doiKhoa_({ tryLock: () => false })).toThrow()
  })

  it('khoảng nghỉ là NGẪU NHIÊN — 30 máy cùng hết hạn không cùng thử lại một lúc', () => {
    const moc: number[] = []
    for (let i = 0; i < 30; i++) {
      const nn = () => i / 30
      const gs = dungGs(nn)
      let nghi = -1
      const than = rutHam('doiKhoa_')
      const f = new Function('Utilities', 'Math', 'HAN_CHO_KHOA_MS', `${than}\nreturn doiKhoa_`).bind(null)(
        { sleep: (ms: number) => (nghi = ms) },
        Object.assign(Object.create(Math), { random: nn }),
        20000,
      ) as (lock: unknown) => boolean
      let lan = 0
      f({ tryLock: () => ++lan >= 2 })
      void gs
      moc.push(nghi)
    }
    // eslint-disable-next-line no-console
    console.log(`[T3] 30 máy · ${new Set(moc).size} mốc thử lại khác nhau · ${Math.min(...moc)}–${Math.max(...moc)}ms`)
    expect(new Set(moc).size).toBeGreaterThan(25)
    expect(Math.max(...moc) - Math.min(...moc)).toBeGreaterThan(500)
  })
})

describe('T3 — VÙNG KHOÁ CỦA `vaoThi` PHẢI HẸP', () => {
  const vaoThi = GS.slice(GS.indexOf("if (action === 'vaoThi')"), GS.indexOf("if (action === 'duyetThiLai')"))
  const trongKhoa = vaoThi.slice(vaoThi.indexOf('doiKhoa_(lock)'), vaoThi.indexOf('lock.releaseLock()'))

  it('mọi lượt ĐỌC nặng đã ra ngoài khoá', () => {
    for (const ten of [
      'coDanhSachHocSinh_(',
      'timTrongDanhSachLop_(',
      'hoSoHocSinh_(',
      'cauLapCuaEm_(',
      'demLapCuaEm_(',
      'docJsonLon_(',
      'boCuaEm_(',
      'khopHoSoDanhSach_(',
    ]) {
      expect(trongKhoa, `${ten} lẽ ra phải nằm NGOÀI khoá`).not.toContain(ten)
    }
  })

  it('ghi nhật ký chặn vào cũng ra ngoài khoá — nó không bảo vệ gì cả', () => {
    expect(trongKhoa).not.toContain('ghiChanVao_(')
  })

  it('trong khoá vẫn phải ĐỌC LẠI dòng rồi mới quyết định — không tin bản đọc ngoài', () => {
    const iDoc = trongKhoa.indexOf('timLuotMoiNhat_(sh, maCa, sbd)')
    const iQd = trongKhoa.indexOf('quyetDinhVaoThi_(ca, luot,')
    expect(iDoc).toBeGreaterThan(0)
    expect(iQd).toBeGreaterThan(iDoc)
  })

  it('em BỊ CHẶN được trả lời NGOÀI khoá — đám đông tệ nhất không xếp hàng', () => {
    const ngoai = vaoThi.slice(0, vaoThi.indexOf('doiKhoa_(lock)'))
    expect(ngoai).toContain('if (!qdThu.ok)')
  })

  it('PHÒNG CHỜ trả lời ngoài khoá — lúc đông nhất của ca không chạm khoá', () => {
    const ngoai = vaoThi.slice(0, vaoThi.indexOf('doiKhoa_(lock)'))
    expect(ngoai).toContain("cach: 'cho'")
  })

  it('vẫn NHẢ KHOÁ trong finally — hỏng giữa chừng không được giữ khoá vĩnh viễn', () => {
    expect(vaoThi).toMatch(/finally \{[\s\S]{0,80}lock\.releaseLock\(\)/)
  })
})
