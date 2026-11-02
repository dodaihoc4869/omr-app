// @vitest-environment node
// TỰ ĐO ĐỘ CHÍNH XÁC ĐÁNH GIÁ 4 BẢNG (thầy 01/11: «tự đo tự làm tất tự tối ưu và phải đạt 99%»; v3 02/11: «Làm luôn với ca thi thật rồi đếm lại … tính từng
// câu từng đơn vị kiến thức … thêm phần lên bảng đạt và chưa đạt nữa … Làm chính xác 99% nhé»; v3b 02/11: «phải đánh giá trọn vẹn và chính xác hết mọi học sinh
// 99%, không còn theo dõi nữa nhé»).
// Thước: học sinh MÔ PHỎNG có ĐÁP ÁN TỪNG EM (tests/_mo-phong-hoc-sinh.ts — 25 kiểu, gồm các kiểu dễ bị xếp oan và kiểu RANH GIỚI). Mỗi em có đáp án trên HAI
// TRỤC: chất lượng (Học thật / Đối phó; null khi em chưa làm gì) và công sức (Chăm / Lười).
//   ĐỘ CHÍNH XÁC mỗi bảng = số em app xếp vào bảng mà đúng đáp án / số em app xếp vào bảng — PHẢI ≥ 99% ở cả 4 bảng, trên ≥ 3 hạt
//   (thêm hạt: MO_PHONG_HAT=404,505 npx vitest run tests/danh-gia-99-mo-phong.test.ts).
//   ĐỘ PHỦ = 100%: mọi em có nhãn công sức; mọi em có bằng chứng có nhãn chất lượng; mỗi trục đúng MỘT nhãn (không «Đang theo dõi», không chồng chéo trong trục).
// In thêm: số em vào bảng NHỜ ca thi / lên bảng (bản không có hai yếu tố này thì không vào), phủ từng kiểu.
import { describe, expect, it } from 'vitest'
import { tinhBon } from '../server/src/bon-chi-so'
import { CAC_KIEU, taoEm, taoRng } from './_mo-phong-hoc-sinh'
import type { MaBang } from '../src/lib/bon-bang-kieu'

const BANG: MaBang[] = ['ht', 'dp', 'ch', 'lu']
export function doMotHat(hat: number, moiKieu: number) {
  const r = taoRng(hat)
  const vao: Record<MaBang, { dung: number; sai: number }> = { ht: { dung: 0, sai: 0 }, dp: { dung: 0, sai: 0 }, ch: { dung: 0, sai: 0 }, lu: { dung: 0, sai: 0 } }
  const saiTheoKieu: Record<string, number> = {}
  const dungKieu: Record<string, { dung: number; tong: number }> = {}
  const nho = { ht: 0, dp: 0, htRa: 0, dpRa: 0, coCa: 0, khongCa: 0 }
  let tong = 0, khongBang = 0, thieuCl = 0, thieuCs = 0, hai = 0, theoDoi = 0, khongClDung = 0
  for (const k of CAC_KIEU) for (let i = 0; i < moiKieu; i++) {
    const em = taoEm(k, r, `${k}${i}`)
    const kq = tinhBon(em)
    const v = kq.soLieu.vao!
    tong++
    if (kq.soLieu.theoDoi) theoDoi++
    if (!BANG.some((b) => v[b])) khongBang++
    if (v.ht && v.dp) hai++
    if (v.ch === v.lu) thieuCs++
    if (em.dapAn.cl !== null && !v.ht && !v.dp) thieuCl++
    if (em.dapAn.cl === null && !v.ht && !v.dp) khongClDung++
    if (em.caThi?.length || em.lenBang?.length) nho.coCa++
    else nho.khongCa++
    const n = kq.soLieu.nho
    if (n) { nho.ht += n.ht === 2 ? 1 : 0; nho.dp += n.dp === 2 ? 1 : 0; nho.htRa += n.htRa; nho.dpRa += n.dpRa }
    const dk = (dungKieu[k] ??= { dung: 0, tong: 0 })
    dk.tong++
    let dungHet = true
    for (const b of BANG) {
      if (!v[b]) continue
      const dung = b === 'ht' || b === 'dp' ? em.dapAn.cl === b : em.dapAn.cs === b
      if (dung) vao[b].dung++
      else {
        dungHet = false
        vao[b].sai++
        saiTheoKieu[`${k}→${b}`] = (saiTheoKieu[`${k}→${b}`] ?? 0) + 1
        if (process.env.MO_PHONG_CHI_TIET) console.log(k, '→', b, JSON.stringify(kq.soLieu.ho), JSON.stringify(kq.diem))
      }
    }
    if (dungHet) dk.dung++
  }
  return { vao, saiTheoKieu, dungKieu, tong, khongBang, thieuCl, thieuCs, hai, theoDoi, khongClDung, nho }
}
const pc = (d: number, n: number) => (n ? (100 * d) / n : 100)
const HAT = (process.env.MO_PHONG_HAT ?? '101,202,303').split(',').map(Number).filter((x) => Number.isFinite(x) && x > 0)

describe('đánh giá 4 bảng v3b — hai trục, xếp TRỌN mọi em, tự đo trên học sinh mô phỏng có đáp án', () => {
  for (const hat of HAT) {
    it(`hạt ${hat}: độ chính xác ≥ 99% ở cả 4 bảng; mọi em đều được xếp (không còn «Đang theo dõi»)`, () => {
      const kq = doMotHat(hat, 70)
      const dong = BANG.map((b) => `${b}: ${kq.vao[b].dung}/${kq.vao[b].dung + kq.vao[b].sai} = ${pc(kq.vao[b].dung, kq.vao[b].dung + kq.vao[b].sai).toFixed(1)}%`)
      const kieu = Object.entries(kq.dungKieu).map(([k, x]) => `${k} ${pc(x.dung, x.tong).toFixed(0)}%`)
      console.log(`[hạt ${hat}] ${kq.tong} em · chưa xếp ${kq.khongBang} · ${dong.join(' · ')}\n  đúng trọn từng kiểu: ${kieu.join(' · ')}\n  sai: ${JSON.stringify(kq.saiTheoKieu)}`
        + `\n  v3: ${kq.nho.coCa} em có ca thi / lên bảng, ${kq.nho.khongCa} em không · vào NHỜ hai yếu tố: Học thật ${kq.nho.ht}, Đối phó ${kq.nho.dp} · đổi trục chất lượng nhờ hai yếu tố: rời Học thật ${kq.nho.htRa}, rời Đối phó ${kq.nho.dpRa}`)
      for (const b of BANG) expect(pc(kq.vao[b].dung, kq.vao[b].dung + kq.vao[b].sai), `độ chính xác bảng ${b}`).toBeGreaterThanOrEqual(99)
      // ĐỘ PHỦ 100%: không em nào bỏ ngỏ, mỗi trục đúng một nhãn
      expect(kq.khongBang, 'em chưa được xếp vào bảng nào').toBe(0)
      expect(kq.theoDoi, 'em «Đang theo dõi»').toBe(0)
      expect(kq.thieuCs, 'em thiếu / thừa nhãn công sức').toBe(0)
      expect(kq.thieuCl, 'em có bằng chứng mà thiếu nhãn chất lượng').toBe(0)
      expect(kq.hai, 'em vừa Học thật vừa Đối phó').toBe(0)
      expect(kq.nho.dp, 'có em Đối phó chỉ bắt được nhờ ca thi / lên bảng').toBeGreaterThan(0)
    }, 180_000)
  }
})
