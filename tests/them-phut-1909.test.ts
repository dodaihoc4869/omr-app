// "THÊM 5 PHÚT" — phía màn thi học sinh (docs/hop-dong-them-phut-2109.md mục 2). Máy chủ trả hạn mới trong phản hồi trạng thái; máy em CHỈ được nhận khi
// MUỘN HƠN hạn đang giữ ≥ 30 s; sớm hơn/bằng/sai kiểu/thiếu trường (máy chủ cũ) ⇒ như cũ; KHÔNG BAO GIỜ rút giờ.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { chuBaoThemGio, hanMoiNeuKeoDai, MS_HIEN_BAO_THEM_GIO, NGUONG_KEO_DAI_MS } from '../src/lib/them-phut'
import { chuanHoaMayChu } from '../src/lib/cau-hinh-may-chu'
import { ngheHanMoi, quenCaVang, trangThaiMoi, type TinHanMoi } from '../src/lib/may-chu-moi'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const HAN = '2026-09-21T10:00:00.000Z'
const them = (giay: number) => new Date(new Date(HAN).getTime() + giay * 1000).toISOString()

describe('hanMoiNeuKeoDai — chỉ kéo dài, không bao giờ rút', () => {
  it('thêm 5 phút ⇒ nhận, nói "5 phút", hạn chuẩn ISO', () => {
    expect(hanMoiNeuKeoDai(HAN, them(300))).toEqual({ han: them(300), themPhut: 5 })
  })

  it('ĐÚNG 30 giây muộn hơn ⇒ nhận (ngưỡng ≥ 30); 29,999 giây ⇒ BỎ QUA', () => {
    expect(NGUONG_KEO_DAI_MS).toBe(30_000)
    expect(hanMoiNeuKeoDai(HAN, them(30))).toEqual({ han: them(30), themPhut: 1 }) // tối thiểu 1 phút để câu báo không nói "0 phút"
    expect(hanMoiNeuKeoDai(HAN, new Date(new Date(HAN).getTime() + 29_999).toISOString())).toBeNull()
  })

  it('bằng hoặc SỚM hơn ⇒ BỎ QUA ở mọi độ lệch — không bao giờ rút giờ', () => {
    for (const giay of [0, -1, -29, -30, -300, -3600, -86400]) expect(hanMoiNeuKeoDai(HAN, them(giay)), String(giay)).toBeNull()
  })

  it('thiếu / sai kiểu / rác ⇒ BỎ QUA (máy chủ cũ chạy như cũ)', () => {
    for (const x of [undefined, null, '', '   ', 'không phải ngày', 123, 1789930000000, {}, [], true, NaN]) expect(hanMoiNeuKeoDai(HAN, x), String(x)).toBeNull()
  })

  it('hạn đang giữ hỏng ⇒ không đoán, BỎ QUA', () => {
    expect(hanMoiNeuKeoDai('', them(300))).toBeNull()
    expect(hanMoiNeuKeoDai('rác', them(300))).toBeNull()
  })

  it('làm tròn số phút: 4 phút 50 giây ⇒ 5; 7 phút 20 giây ⇒ 7; gọi lặp với cùng hạn mới sau khi đã nhận ⇒ bỏ qua (không cộng đôi)', () => {
    expect(hanMoiNeuKeoDai(HAN, them(290))!.themPhut).toBe(5)
    expect(hanMoiNeuKeoDai(HAN, them(440))!.themPhut).toBe(7)
    const moi = hanMoiNeuKeoDai(HAN, them(300))!
    expect(hanMoiNeuKeoDai(moi.han, them(300))).toBeNull() // đã giữ đúng hạn ấy
  })

  it('hạn có múi giờ khác vẫn so đúng theo thời điểm', () => {
    expect(hanMoiNeuKeoDai('2026-09-21T17:00:00+07:00', '2026-09-21T10:05:00.000Z')).toMatchObject({ themPhut: 5 })
    expect(hanMoiNeuKeoDai('2026-09-21T17:00:00+07:00', '2026-09-21T09:55:00.000Z')).toBeNull()
  })

  it('câu báo: "Thầy cho thêm N phút"; tự tắt sau 12 giây', () => {
    expect(chuBaoThemGio(5)).toBe('Thầy cho thêm 5 phút')
    expect(MS_HIEN_BAO_THEM_GIO).toBe(12_000)
  })
})

const BAT = chuanHoaMayChu({ BAT: true, URL: 'https://x.workers.dev', SO_LAN_THU: 1, HAN_GIAY: 1 })
const TAT = chuanHoaMayChu({ BAT: false, URL: '' })
const TT = { sbd: 'E1', maCa: 'C1', lop: '', dangLam: true, batDauLuc: '', daLamCauHoi: 0, tongCauHoi: 0, soLanRoiApp: 0, blocked: false }
const gia = (tra: unknown) => (async () => new Response(JSON.stringify(tra), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch
const nhan: TinHanMoi[] = []
const huy: (() => void)[] = []
beforeEach(() => {
  quenCaVang()
  nhan.length = 0
})
afterEach(() => {
  while (huy.length) huy.pop()!()
})

describe('trangThaiMoi báo hạn mới cho người nghe', () => {
  it('máy chủ ok + hetGioLuc chuỗi ⇒ người nghe nhận đúng {maCa, sbd, hetGioLuc}; giá trị trả về vẫn true', async () => {
    huy.push(ngheHanMoi((t) => nhan.push(t)))
    globalThis.fetch = gia({ ok: true, hetGioLuc: them(300) })
    expect(await trangThaiMoi(BAT, TT)).toBe(true)
    expect(nhan).toEqual([{ maCa: 'C1', sbd: 'E1', hetGioLuc: them(300) }])
  })

  it('máy chủ CŨ (không có trường), ok:false, hoặc trường sai kiểu ⇒ KHÔNG báo gì; giá trị trả về như cũ', async () => {
    huy.push(ngheHanMoi((t) => nhan.push(t)))
    globalThis.fetch = gia({ ok: true })
    expect(await trangThaiMoi(BAT, TT)).toBe(true)
    globalThis.fetch = gia({ ok: false, hetGioLuc: them(300) })
    expect(await trangThaiMoi(BAT, TT)).toBe(false)
    for (const x of [123, null, { a: 1 }, true]) {
      globalThis.fetch = gia({ ok: true, hetGioLuc: x })
      expect(await trangThaiMoi(BAT, TT)).toBe(true)
    }
    expect(nhan).toEqual([])
  })

  it('cờ tắt ⇒ null, không gọi mạng, không báo', async () => {
    huy.push(ngheHanMoi((t) => nhan.push(t)))
    let goi = 0
    globalThis.fetch = (async () => { goi++; return new Response('{}') }) as typeof fetch
    expect(await trangThaiMoi(TAT, TT)).toBeNull()
    expect(goi).toBe(0)
    expect(nhan).toEqual([])
  })

  it('người nghe ném lỗi KHÔNG làm hỏng lượt báo và không chặn người nghe khác; huỷ đăng ký thì thôi nhận', async () => {
    huy.push(ngheHanMoi(() => { throw new Error('hỏng') }))
    const boNghe = ngheHanMoi((t) => nhan.push(t))
    globalThis.fetch = gia({ ok: true, hetGioLuc: them(300) })
    expect(await trangThaiMoi(BAT, TT)).toBe(true)
    expect(nhan.length).toBe(1)
    boNghe()
    expect(await trangThaiMoi(BAT, TT)).toBe(true)
    expect(nhan.length).toBe(1)
  })
})

describe('nối vào màn thi (khoá nguồn)', () => {
  const man = doc('src/screens/ExamTakeScreen.tsx')

  it('người nghe: đúng lượt (maCa + sbd), không phải bài tập/đã nộp, CHỈ nhận qua hanMoiNeuKeoDai, lưu qua đường sẵn có, một dòng báo tự tắt, dọn khi rời', () => {
    const i = man.indexOf('const huy = ngheHanMoi((tin) => {')
    expect(i).toBeGreaterThan(0)
    const khoi = man.slice(i, man.indexOf('}, [])', i))
    for (const s of [
      "if (!cur || cur.submitted || cur.loai === 'baitap' || cur.maCa !== tin.maCa || cur.sbd !== tin.sbd) return",
      'const keo = hanMoiNeuKeoDai(hetGioCua(cur), tin.hetGioLuc)',
      'if (!keo) return',
      'const next: ExamAttempt = { ...cur, hetGioLuc: keo.han }',
      'attemptRef.current = next',
      'setAttempt(next)',
      'saveAttempt(next)',
      'setBaoThemGio(chuBaoThemGio(keo.themPhut))',
      'setTimeout(() => setBaoThemGio(null), MS_HIEN_BAO_THEM_GIO)',
      'huy()',
    ]) expect(khoi, s).toContain(s)
    // không đường nào khác trong màn thi ghi hạn từ giá trị của máy chủ ngoài ba chỗ VÀO THI cũ + chỗ này
    expect((man.match(/hetGioLuc: keo\.han/g) || []).length).toBe(1)
    expect(man).not.toMatch(/hetGioLuc:\s*tin\./)
  })

  it('chữ ký/lời gọi trạng thái KHÔNG đổi (nhiều test khoá nguyên văn): pushExamStatus còn gọi `trangThaiMoi(chMoi, status)`', () => {
    const api = doc('src/lib/exam-api.ts')
    expect(api).toContain('const rMoi = await trangThaiMoi(chMoi, status)')
    expect(man).toMatch(/void pushExamStatus\(url, \{\s*sbd: a\.sbd,/)
  })

  it('dòng báo: chỉ khi KHÔNG có cảnh báo rời màn, role="status", M3 dùng DaiBaoNheM3, đường khác OThongBao xanh trong khung dính như cũ', () => {
    expect(man).toMatch(/\{baoThemGio &&\s*!canhBaoRoi &&\s*\(dungM3\(\) \? \(\s*<div className="sticky z-30" style=\{\{ top: 56 \}\} role="status" data-bao-them-gio>\s*<DaiBaoNheM3 chu=\{baoThemGio\} \/>/)
    expect(man).toMatch(/<OThongBao tone="xanh">\s*<b>\{baoThemGio\}<\/b>/)
  })

  it('KHÔNG đụng chốt an toàn: vẫn còn nguyên VanTay, ManGiuDeDoc, ManChan, hạn tự nộp theo `remaining <= 0`, luật 1 phút cuối', () => {
    for (const s of ['<VanTay sbd={attempt.sbd}', '<ManGiuDeDoc />', '<ManChan lyDo={lyDoChe}', 'if (remaining !== null && remaining <= 0) void doSubmit(attempt, true)', "a.chiNop3PhutCuoi && typeof remaining === 'number' && remaining > 60"]) expect(man, s).toContain(s)
  })

  it('CSS dòng báo: token M3, không hex, mọi luật dưới `.m3`', () => {
    const css = doc('src/screens/man-thi-m3.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const luat = css.match(/\.m3 \.thi-bao-nhe[^{]*\{[^}]*\}/g) || []
    expect(luat.length).toBe(3)
    expect(luat.join('\n')).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|position:\s*fixed|z-index/)
    expect(luat[0]).toMatch(/background: var\(--m3-tertiary-container\); color: var\(--m3-on-tertiary-container\)/)
  })
})
