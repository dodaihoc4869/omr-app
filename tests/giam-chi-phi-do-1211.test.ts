// GIẢM LƯỢT DURABLE OBJECT (12/11, thầy «chỉ 5 đô một tháng»; DO đo 115 nghìn lượt/ngày, gói ~33 nghìn):
//  (1) báo máy các em THEO LÔ qua ngăn trung chuyển — N em = N + k lượt ngăn thay vì 2N; kết quả (em nào nhận tin gì) y hệt cách cũ;
//  (2) `/hs/kenh-ve` không qua ngăn (0 lệnh D1) — mỗi lần nối lại kênh đẩy bớt 1–2 lượt ngăn.
import { afterEach, describe, expect, it } from 'vitest'
import type { Env } from '../server/src/kieu'
import {
  DAU_BAO_NGAN, DAU_TRONG_NGAN, DUONG_BAO_LO_NGAN, NganHocSinh, baoMayCacEm, datXuLyNgan, laDuongNgan, vaoNgan, xoaDemNganDinh, xoaEnvChungNgan,
} from '../server/src/ngan-hoc-sinh'

afterEach(() => { xoaDemNganDinh(); xoaEnvChungNgan() })

interface WsGia { gui: string[]; kem: unknown; send(x: string): void; close(): void; serializeAttachment(v: unknown): void; deserializeAttachment(): unknown }
const wsGia = (): WsGia => ({ gui: [], kem: { m: 'may' }, send(x) { this.gui.push(x) }, close() {}, serializeAttachment(v) { this.kem = v }, deserializeAttachment() { return this.kem } })

/** Không gian ngăn giả: mỗi tên một NganHocSinh THẬT (đúng mã fetch); ngăn của em `d1|<sbd>` có một máy đang mở kênh. Đếm mọi lượt gọi ngăn. */
function khongGian(dinh: string[], o: { loBiTu?: boolean } = {}) {
  const goi: { ten: string; duong: string }[] = []
  const may = new Map<string, WsGia>()
  const ngan = new Map<string, NganHocSinh>()
  const db = { prepare: () => ({ bind: () => ({ first: async () => ({ gia_tri: JSON.stringify({ ds: dinh, tien: 'd1|', v: 3 }) }) }) }) }
  const env = { MA_BI_MAT: 'x', DB: db } as unknown as Env & { NGAN_HS: unknown }
  const ns = {
    idFromName: (ten: string) => ({ toString: () => ten }),
    get: (id: { toString(): string }) => ({
      fetch: async (req: Request) => {
        const ten = id.toString(), duong = new URL(req.url).pathname
        goi.push({ ten, duong })
        if (o.loBiTu && duong === DUONG_BAO_LO_NGAN) return new Response('không có', { status: 404 }) // trung chuyển bản cũ
        let n = ngan.get(ten)
        if (!n) {
          if (ten.startsWith('d1|') && !may.has(ten)) may.set(ten, wsGia())
          const w = may.get(ten)
          n = new NganHocSinh({ waitUntil() {}, getWebSockets: () => (w ? [w] : []) } as never, env)
          ngan.set(ten, n)
        }
        return n.fetch(req)
      },
    }),
  }
  env.NGAN_HS = ns
  return { env: env as Env, goi, may }
}

describe('báo máy các em theo lô qua ngăn trung chuyển', () => {
  const em = Array.from({ length: 40 }, (_, i) => `S${i + 1}`)
  it('40 em, 3 trung chuyển ⇒ 40 + ≤ 3 lượt ngăn (cũ: 80); mỗi em nhận đúng MỘT tin {"t":"doi","k":["live"]}', async () => {
    const { env, goi, may } = khongGian(['dinh|1', 'dinh|2', 'dinh|3'])
    expect(await baoMayCacEm(env, [...em, 'S1', ' '], 'live')).toBe(40)
    expect(goi.filter((g) => g.duong === DUONG_BAO_LO_NGAN).length).toBeLessThanOrEqual(3)
    expect(goi.length).toBeLessThanOrEqual(43)
    for (const s of em) expect(may.get(`d1|${s}`)?.gui.map((x) => JSON.parse(x)), s).toEqual([{ t: 'doi', k: ['live'] }])
    // Ngăn của em được gọi ĐÚNG tên `d1|<sbd>` bởi trung chuyển (tạo cạnh trung chuyển như lệnh đầu), không qua tên lạ.
    expect(goi.filter((g) => g.ten.startsWith('d1|')).map((g) => g.ten).sort()).toEqual(em.map((s) => `d1|${s}`).sort())
  })
  it('trung chuyển chưa có đường lô (404) ⇒ báo lẻ từng em qua trung chuyển như cũ — kết quả y hệt', async () => {
    const { env, may } = khongGian(['dinh|1', 'dinh|2'], { loBiTu: true })
    expect(await baoMayCacEm(env, em, 'goi')).toBe(40)
    for (const s of em) expect(may.get(`d1|${s}`)?.gui.map((x) => JSON.parse(x)), s).toEqual([{ t: 'doi', k: ['goi'] }])
  })
  it('đường lô chỉ nhận lệnh có dấu báo (Worker luôn xoá dấu này ở lệnh máy khách); tiền tố lạ ⇒ không gọi em nào', async () => {
    const { env, goi, may } = khongGian(['dinh|1'])
    const n = new NganHocSinh({ waitUntil() {}, getWebSockets: () => [] } as never, env)
    datXuLyNgan(async () => new Response('đường thường', { status: 418 }))
    const khongDau = await n.fetch(new Request(`https://ngan${DUONG_BAO_LO_NGAN}`, { method: 'POST', headers: { [DAU_TRONG_NGAN]: '1' }, body: JSON.stringify({ tien: 'd1|', ds: ['S1'] }) }))
    expect(khongDau.status).toBe(418) // không phải lệnh báo ⇒ chạy như lệnh thường (đường lạ ⇒ máy chủ trả lỗi), không gọi ngăn nào
    const tienLa = await n.fetch(new Request(`https://ngan${DUONG_BAO_LO_NGAN}`, { method: 'POST', headers: { [DAU_TRONG_NGAN]: '1', [DAU_BAO_NGAN]: 'goi' }, body: JSON.stringify({ tien: 'apac|', ds: ['S1'] }) }))
    expect(tienLa.status).toBe(400)
    expect(goi).toEqual([])
    expect(may.size).toBe(0)
    // Máy khách không tới được đường `/__ngan/*` qua Worker.
    expect(laDuongNgan(DUONG_BAO_LO_NGAN)).toBe(false)
    const khach = await vaoNgan(new Request(`https://w${DUONG_BAO_LO_NGAN}`, { method: 'POST', headers: { [DAU_BAO_NGAN]: 'goi' }, body: '{}' }), env)
    expect(khach).toBeNull()
  })
})

describe('/hs/kenh-ve không qua ngăn', () => {
  it('kenh-ve đi đường thường (0 lệnh D1, khỏi tốn lượt ngăn); lệnh học sinh khác vẫn qua ngăn', () => {
    expect(laDuongNgan('/hs/kenh-ve')).toBe(false)
    for (const p of ['/hs/ke-hoach-ngay', '/hs/ca-dang-mo', '/game-v2/answer', '/mom/list']) expect(laDuongNgan(p), p).toBe(true)
  })
})
