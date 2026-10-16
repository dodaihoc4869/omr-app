#!/usr/bin/env node
// Linh kiện React thật, Chromium thật, API giả có ghi nhật ký. Không chạm học sinh/D1.
// 3 khổ × sáng/tối; ảnh JPG ≤150 KB. Cổng này kiểm giao diện, không thay kiểm tích hợp D1.
import { mkdirSync, realpathSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const GOC = resolve(import.meta.dirname, '..')
const RA = resolve(process.argv[2] ?? join(GOC, 'docs/hoi-thay-ca-nhan-1610/anh'))
mkdirSync(RA, { recursive: true })
const vite = await createServer({ root: GOC, logLevel: 'error', server: { port: 0, host: '127.0.0.1', watch: null, hmr: false, fs: { allow: [GOC, realpathSync(join(GOC, 'node_modules'))] } } })
await vite.listen()
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox'] })
const ketQua = []
const cau = { qid: 'Q', so: 'Câu 12', chuong: 'Ester', de: '<p>Chất nào sau đây là ester?</p>', y: { A: 'CH3COOC2H5', B: 'C2H5OH', C: 'CH3COOH', D: 'CH3CHO' } }
const ct = { yChinh: 'Ester có nhóm chức **–COO–** nối với gốc hydrocarbon.', buoc: [{ ten: 'Nhìn nhóm chức', chu: 'Trong CH3COOC2H5, nhóm –COO– nằm giữa hai gốc hydrocarbon.' }], bang: null, ghiNho: 'Phân biệt nhóm –COO– với nhóm –COOH.', hoiTiep: ['Giải thích dễ hơn'] }
let phienDem = 0
try {
  for (const [rong, cao, ten] of [[390, 844, 'doc'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']]) {
    for (const mau of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width: rong, height: cao }, colorScheme: mau, reducedMotion: 'reduce', locale: 'vi-VN' })
      await ctx.addInitScript(() => localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'token-thu-giao-dien' })))
      const calls = [], errors = []
      const hocSinh = [
        ...Array.from({ length: 5 }, (_, i) => ({ sbd: `1200${i}`, ten: `Học sinh mẫu ${i + 1}`, lop: '12A1', qid: 'KHO-I-7', tieuDe: 'Nhận diện nhóm chức ester', lyDo: 'Em chưa phân biệt nhóm chức ester và carboxylic acid.' })),
        ...Array.from({ length: 2 }, (_, i) => ({ sbd: `1100${i}`, ten: `Học sinh mẫu ${i + 6}`, lop: '11A1', qid: 'KHO-III-3', tieuDe: 'Tính nồng độ dung dịch', lyDo: 'Em còn nhầm đổi đơn vị thể tích.' })),
        { sbd: '10001', ten: 'Học sinh mẫu 8', lop: '10A1', qid: 'KHO-II-2', tieuDe: 'Cấu tạo nguyên tử', lyDo: 'Em muốn thầy giải thích thêm bước xác định số electron.' },
      ].map((em) => ({ ...em, guiLuc: 1792112400000, capNhatLuc: 1792112400000, revision: 1 }))
      let canGiup = [...hocSinh]
      await ctx.route('**/gv/hoi-tro-ly/**', (r) => {
        const u = new URL(r.request().url()).pathname, body = r.request().postDataJSON()
        calls.push({ u, body })
        if (u.endsWith('/can-giup')) return r.fulfill({ json: { ok: true, tong: canGiup.length, ds: canGiup } })
        if (u.endsWith('/ho-tro')) {
          canGiup = canGiup.filter((x) => x.qid !== body.qid)
          return r.fulfill({ json: { ok: true, soEm: body.em.length, thongBao: 'Đã gửi hướng dẫn cho 5 em. Các em sẽ tự kiểm lại.' } })
        }
        return r.fulfill({ json: { ok: false } })
      })
      let lanNop = 0, daNop = false, kiemLaiTrucTiep = false
      const phienId = `phien-thu-${++phienDem}`
      const receipt = { ok: true, dung: true, trangThai: 'cho_kiem_lai', denHan: '2026-10-18T01:00:00Z', thongBao: 'Em tự làm đúng. App sẽ kiểm lại ở lịch ôn phù hợp.' }
      const dsChua = Array.from({ length: 104 }, (_, i) => ({ dotId: `D${i}`, qid: `CAU-${i}`, trangThai: i === 103 ? 'da_tu_sua' : i === 102 ? 'cho_gap_lai_2' : 'can_chan_doan', ...(i === 0 ? { kiemHoiThay: true } : {}), ...(i === 102 ? { denHan: '2100-01-01T00:00:00Z' } : {}) }))
      let demChua = { can: 102, cho: 1, xong: 1, tong: 104 }
      let kiemLaiRieng = []
      await ctx.route('**/game-v2/hoa2-cau-da-lam', (r) => r.fulfill({ json: { ok: true, cheDo2: false } }))
      await ctx.route('**/hs/**', async (r) => {
        const u = new URL(r.request().url()).pathname
        const body = r.request().postDataJSON()
        calls.push({ u, body })
        if (u === '/hs/chua-cau-sai/co') return r.fulfill({ json: { ok: true } })
        if (u === '/hs/chua-cau-sai/danh-sach') return r.fulfill({ json: { ok: true, ds: body.sau ? [...dsChua.slice(100), dsChua[99]] : dsChua.slice(0, 100), dem: demChua, kiemLaiHoiThay: kiemLaiRieng, ...(body.sau || dsChua.length <= 100 ? {} : { sau: { hang: 1, giaoLuc: 100, dotId: 'D99', nay: new Date().toISOString() } }) } })
        if (u === '/hs/hoi-thay') return r.fulfill({ json: { ok: true, coLoiGiai: true, cau, hoSo: { qid: 'Q', bam: 'b', dang: 'tn', ten: 'Ester', co: [] }, hoiThem: true } })
        if (u === '/hs/hoi-tro-ly') return r.fulfill({ json: { ok: true, traLoi: ct.yChinh, cauTruc: ct, conLai: 18 } })
        if (u.endsWith('/kiem/mo')) return r.fulfill({ json: daNop ? receipt : { ok: true, trangThai: 'co_cau', phienId, cau: { qid: 'KHO-I-7', phan: 'I', text: 'Chất nào sau đây là ester?', choices: ['HCOOCH3', 'CH3OH', 'HCOOH', 'CH3CHO'] } } })
        if (u.endsWith('/kiem/nop')) {
          if (++lanNop === 1) return r.abort('failed')
          daNop = true
          if (kiemLaiTrucTiep) { dsChua[0].trangThai = 'da_tu_sua'; demChua = { can: 101, cho: 1, xong: 2, tong: 104 } }
          return r.fulfill({ json: { ...receipt, ...(kiemLaiTrucTiep ? { trangThai: 'da_xac_nhan', thongBao: 'Em đã tự làm được ở lần kiểm lại.' } : {}), idempotent: true } })
        }
        if (u.endsWith('/kiem/gui-thay')) return r.fulfill({ json: { ok: true, thongBao: 'Đã gửi chỗ em đang vướng. Em tiếp tục phần học khác trong lúc chờ thầy nhé.' } })
        return r.fulfill({ json: { ok: true, bat: false, trangThai: 'tat' } })
      })
      const p = await ctx.newPage()
      p.on('pageerror', (e) => errors.push(e.message))
      const dau = `${ten}-${mau === 'dark' ? 'toi' : 'sang'}`
      const soat = async (trangThai, chup = false) => {
        const hinh = await p.evaluate(() => {
          const hop = document.querySelector('.lg-hh')
          const ngoai = [...hop.querySelectorAll('*')].filter((e) => e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX === 'visible' && !e.closest('[hidden]')).map((e) => e.className?.baseVal ?? e.className).slice(0, 5)
          const nho = [...hop.querySelectorAll('.lg-kc-mo, .lg-kc-phu')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 48 || r.width < 44) }).map((e) => e.textContent)
          return { ngoai, nho, trangTran: document.documentElement.scrollWidth > innerWidth + 1 }
        })
        ketQua.push({ khung: dau, trangThai, ...hinh, loiTrang: [...errors] })
        if (hinh.ngoai.length || hinh.nho.length || hinh.trangTran || errors.length) throw new Error(`${dau}/${trangThai}: ${JSON.stringify(hinh)} ${errors.join(',')}`)
        if (chup) {
          await p.evaluate(() => document.fonts.ready)
          for (let quality = 82; quality >= 40; quality -= 6) {
            const b = await p.screenshot({ type: 'jpeg', quality })
            if (b.length < 150_000 || quality <= 40) { writeFileSync(join(RA, `${dau}-${trangThai}.jpg`), b); break }
          }
        }
      }
      await p.goto(`${vite.resolvedUrls.local[0]}docs/ban-ve-hoi-thay-1310/that/index.html`)
      await p.getByRole('button', { name: 'Hỏi thầy', exact: true }).click()
      await p.getByLabel('Chỗ em thắc mắc về câu này').fill('Em chưa hiểu nhóm chức ester ạ?')
      await p.getByRole('button', { name: 'Gửi', exact: true }).click()
      await p.getByRole('button', { name: 'Tự làm một câu tương đương' }).waitFor()
      if (calls.some((c) => c.u.includes('/kiem/'))) throw new Error('Gọi kiểm chứng trước khi em bấm')
      await soat('moi-tu-lam')
      await p.getByRole('button', { name: 'Tự làm một câu tương đương' }).click()
      await p.locator('.lg-kc-cau').waitFor()
      await p.locator('.lg-kc').scrollIntoViewIfNeeded()
      await soat('tu-lam', true)
      await p.locator('.lg-kc-cau .pa-hang').first().click()
      await p.getByRole('button', { name: 'Nộp câu tự làm' }).click()
      await p.getByRole('button', { name: 'Gửi lại lần trả lời này' }).waitFor()
      await soat('mat-mang')
      await p.getByRole('button', { name: 'Gửi lại lần trả lời này' }).click()
      await p.getByText('Đang chờ kiểm lại', { exact: true }).waitFor()
      const nop = calls.filter((c) => c.u.endsWith('/kiem/nop'))
      if (nop.length !== 2 || JSON.stringify(nop[0].body) !== JSON.stringify(nop[1].body)) throw new Error('Lượt gửi lại thay mã/bài làm')
      await soat('cho-kiem-lai', true)
      await p.getByRole('button', { name: 'Cần thầy hỗ trợ', exact: true }).click()
      await p.getByRole('button', { name: 'Đã gửi thầy' }).waitFor()
      await soat('da-gui-thay')
      // Bảng thật phía thầy, tải riêng theo nút; cùng 3 khổ × 2 chế độ.
      await p.goto(`${vite.resolvedUrls.local[0]}docs/hoi-thay-ca-nhan-1610/giao-vien/index.html`)
      await p.getByRole('button', { name: 'Xem chỗ cần giúp' }).waitFor()
      if (calls.some((x) => x.u.startsWith('/gv/'))) throw new Error('Bảng thầy tự gọi trước khi bấm')
      await p.getByRole('button', { name: 'Xem chỗ cần giúp' }).click()
      await p.getByRole('heading', { name: 'Nhận diện nhóm chức ester' }).waitFor()
      const gv = await p.evaluate(() => ({
        ngang: document.documentElement.scrollWidth > innerWidth + 1,
        nho: [...document.querySelectorAll('.ht-can-giup button, .ht-can-giup summary')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 48 || r.width < 44) }).map((e) => e.textContent),
      }))
      if (gv.ngang || gv.nho.length || errors.length) throw new Error(`${dau}/giao-vien: ${JSON.stringify(gv)} ${errors.join(',')}`)
      ketQua.push({ khung: dau, trangThai: 'giao-vien-da-tai', ...gv, loiTrang: [...errors] })
      await p.evaluate(() => document.fonts.ready)
      for (let quality = 82; quality >= 40; quality -= 6) {
        const b = await p.screenshot({ type: 'jpeg', quality })
        if (b.length < 150_000 || quality <= 40) { writeFileSync(join(RA, `${dau}-giao-vien.jpg`), b); break }
      }
      await p.getByLabel('Hướng dẫn gửi các em').first().fill('Em nhìn nhóm –COO– giữa hai gốc hydrocarbon, rồi thử phân biệt với nhóm –COOH nhé.')
      await p.getByRole('button', { name: 'Gửi hướng dẫn cho 5 em' }).click()
      await p.getByText('Đã gửi hướng dẫn cho 5 em. Các em sẽ tự kiểm lại.').waitFor()
      if (await p.getByRole('heading', { name: 'Nhận diện nhóm chức ester' }).count()) throw new Error('Không cập nhật nhóm đã gửi tại chỗ')
      ketQua.push({ khung: dau, trangThai: 'giao-vien-da-gui', loiTrang: [...errors] })
      // Danh sách thật: tổng cần sửa không bị giới hạn 100; trang tiếp chống trùng.
      await p.goto(`${vite.resolvedUrls.local[0]}docs/hoi-thay-ca-nhan-1610/tu-sua-loi/index.html`)
      await p.getByText('Đã tải 100/104 câu trong danh sách.').waitFor()
      if ((await p.locator('.tcl-so b').textContent()) !== '102') throw new Error('Thẻ tổng chưa dùng số toàn bộ')
      if (await p.locator('.tcl-the').count() !== 100) throw new Error('Trang đầu không đúng 100 mục')
      const doTuSua = async (trangThai) => {
        const doDuoc = await p.evaluate(() => ({ ngang: document.documentElement.scrollWidth > innerWidth + 1, soCan: document.querySelector('.tcl-so b').textContent, soDaTai: document.querySelectorAll('.tcl-the').length }))
        if (doDuoc.ngang || errors.length) throw new Error(`${dau}/${trangThai}: ${JSON.stringify(doDuoc)} ${errors.join(',')}`)
        ketQua.push({ khung: dau, trangThai, ...doDuoc, loiTrang: [...errors] })
      }
      await doTuSua('tu-sua-loi-100-trong-104')
      await p.getByRole('button', { name: 'Xem tiếp các câu' }).click()
      await p.waitForFunction(() => document.querySelectorAll('.tcl-the').length === 104)
      if (await p.getByRole('button', { name: 'Xem tiếp các câu' }).count()) throw new Error('Còn nút tải tiếp dù đã hết trang')
      if ((await p.locator('.tcl-so b').textContent()) !== '102') throw new Error('Tải tiếp làm lệch tổng cần sửa')
      await p.evaluate(() => window.scrollTo(0, 0))
      await doTuSua('tu-sua-loi-da-tai-du-104')
      for (let quality = 82; quality >= 40; quality -= 6) {
        const b = await p.screenshot({ type: 'jpeg', quality })
        if (b.length < 150_000 || quality <= 40) { writeFileSync(join(RA, `${dau}-tu-sua-loi.jpg`), b); break }
      }
      // Đến ngày kiểm lại: chọn hàng mở thẳng API kho, không nhận lời hướng dẫn AI mới.
      daNop = false; lanNop = 1; kiemLaiTrucTiep = true
      const soAiTruoc = calls.filter((x) => x.u === '/hs/hoi-thay' || x.u === '/hs/hoi-tro-ly').length
      await p.locator('[data-khoa="D0"]').click()
      await p.locator('.lg-kc-cau').waitFor()
      if (calls.filter((x) => x.u === '/hs/hoi-thay' || x.u === '/hs/hoi-tro-ly').length !== soAiTruoc) throw new Error('Kiểm lại trực tiếp đã gọi AI')
      const doTrucTiep = await p.evaluate(() => ({ ngang: document.documentElement.scrollWidth > innerWidth + 1 }))
      if (doTrucTiep.ngang || errors.length) throw new Error(`${dau}/kiem-truc-tiep: tràn hoặc lỗi trang`)
      ketQua.push({ khung: dau, trangThai: 'kiem-lai-truc-tiep-khong-hoi-ai', ...doTrucTiep, loiTrang: [...errors] })
      for (let quality = 82; quality >= 40; quality -= 6) {
        const b = await p.screenshot({ type: 'jpeg', quality })
        if (b.length < 150_000 || quality <= 40) { writeFileSync(join(RA, `${dau}-kiem-lai-truc-tiep.jpg`), b); break }
      }
      await p.locator('.lg-kc-cau .pa-hang').first().click()
      await p.getByRole('button', { name: 'Nộp câu tự làm' }).click()
      await p.getByText('Đã xác nhận khắc phục', { exact: true }).waitFor()
      await p.getByRole('button', { name: 'Quay lại danh sách' }).click()
      await p.waitForFunction(() => document.querySelector('.tcl-so b')?.textContent === '101')
      ketQua.push({ khung: dau, trangThai: 'kiem-lai-truc-tiep-ve-cap-nhat-so', soCan: 101, loiTrang: [...errors] })
      // Một receipt chưa có đợt sai phải vẫn mở được, không bịa thêm số lỗi.
      dsChua.splice(0); demChua = { can: 0, cho: 0, xong: 0, tong: 0 }
      kiemLaiRieng = [{ qid: 'CAU-KIEM-RIENG', ten: 'Nhận diện nhóm chức ester', phan: 'I', trangThai: 'den_han' }]
      daNop = false
      await p.reload()
      await p.getByRole('region', { name: 'Kiểm lại sau Hỏi thầy' }).waitFor()
      await p.getByText('Em không còn câu nào cần sửa', { exact: true }).waitFor()
      if (await p.locator('.tcl-so').count()) throw new Error('Lịch Hỏi thầy tạo số lỗi giả')
      if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) throw new Error('Khu kiểm lại riêng tràn ngang')
      ketQua.push({ khung: dau, trangThai: 'kiem-lai-rieng-khong-tang-loi', soCan: 0, kiemRieng: 1, loiTrang: [...errors] })
      for (let quality = 82; quality >= 40; quality -= 6) {
        const b = await p.screenshot({ type: 'jpeg', quality })
        if (b.length < 150_000 || quality <= 40) { writeFileSync(join(RA, `${dau}-kiem-lai-rieng.jpg`), b); break }
      }
      await p.getByRole('button', { name: /Nhận diện nhóm chức ester/ }).click()
      await p.locator('.lg-kc-cau').waitFor()
      if (!calls.some((x) => x.u.endsWith('/kiem/mo') && x.body.qid === 'CAU-KIEM-RIENG')) throw new Error('Khu riêng không mở đúng câu')
      if (calls.filter((x) => x.u === '/hs/hoi-thay' || x.u === '/hs/hoi-tro-ly').length !== soAiTruoc) throw new Error('Khu riêng lại gọi AI')
      ketQua.push({ khung: dau, trangThai: 'kiem-lai-rieng-mo-khong-hoi-ai', loiTrang: [...errors] })
      await ctx.close()
      console.log(`${dau}: 13 trạng thái đạt, gồm kiểm lại riêng không tạo lỗi và không hỏi lại AI`)
    }
  }
} finally {
  writeFileSync(join(RA, 'ket-qua.json'), JSON.stringify({ moTa: 'Chromium thật; linh kiện thật; API giả, không phải số đo máy chủ thật', ketQua }, null, 2))
  await browser.close(); await vite.close()
}
