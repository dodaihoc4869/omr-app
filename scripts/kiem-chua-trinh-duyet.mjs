// Browser thật + API fixture xác định: đo bố cục, bàn phím, dialog và retry mất mạng.
// API/SQL thật được kiểm riêng trong chua-cau-sai-chat-luong + d1-runtime-chua-cau-sai.
// 26/10: từ «Chữa câu gọn» (#373) màn em mở đợt rồi gọi `gon-mo` ⇒ 4 khổ đi luồng gọn (Kiểm tra → mất mạng → gửi lại đúng khoá → «Em đã tự sửa xong câu này»);
// lượt «lối cũ» 360px: Worker chưa có lệnh gọn (404 «Không có đường này») ⇒ rơi về sửa từng bước (phat-item / nop-item) như trước.
import assert from 'node:assert/strict'
import { mkdirSync, existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
const out = process.env.CHUA_ARTIFACT_DIR ?? '/tmp/chua-browser'
mkdirSync(out, { recursive: true })
const vite = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '4178',
    '--strictPort',
  ],
  { stdio: 'ignore' },
)
let browser
const base = 'http://127.0.0.1:4178'
const item = {
  id: 'i1',
  loai: 'chan_doan',
  tieuDe: 'Khối lượng mol',
  kieu: 'so',
  hoi: 'Tính khối lượng mol NaOH. Cho Na = 23; O = 16; H = 1.',
  luaChon: null,
  donVi: 'g/mol',
}
const ph = {
  ok: true,
  dotId: 'd1',
  phienId: 'p1',
  trangThai: 'dang_chua_buoc',
  lanGapLai: 1,
  tienDo: { soBuocDaQua: 0, soBuocCanKiem: 1 },
  tienDoChiTiet: [
    { buocId: 'm', tieuDe: 'Khối lượng mol', trangThai: 'dang_kiem' },
  ],
  cauGoc: { phan: 'III', text: 'Tính khối lượng mol LiOH, Li=7, O=16, H=1.' },
  item,
}
// Dạng đúng như `gonMo` (server/src/chua-gon-lenh.ts): đề công khai, KHÔNG đáp án.
const mo = {
  ok: true,
  dotId: 'd1',
  lan: 1,
  ban: 'Q',
  banKhac: false,
  tuSuaNeuDung: true,
  de: {
    qid: 'Q',
    phan: 'III',
    text: 'Tính khối lượng mol NaOH. Cho Na = 23; O = 16; H = 1.',
  },
}
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base)).ok) break
    } catch {}
    await new Promise((r) => setTimeout(r, 100))
    if (i === 99) throw new Error('Vite chưa khởi động')
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHUA_CHROMIUM
      ? { executablePath: process.env.CHUA_CHROMIUM }
      : existsSync('/usr/bin/chromium')
        ? { executablePath: '/usr/bin/chromium' }
        : {}),
  })
  for (const { width, height, ten, loiCu = false } of [
    { width: 360, height: 900, ten: '360' },
    { width: 430, height: 900, ten: '430' },
    { width: 844, height: 390, ten: 'xoay-ngang-844' },
    { width: 1280, height: 900, ten: 'may-tinh-1280' },
    { width: 360, height: 900, ten: 'loi-cu-360', loiCu: true },
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: 'reduce',
    })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    let matMang = true
    const nops = []
    await page.route('https://chua.test/**', async (route) => {
      const url = route.request().url(),
        b = route.request().postDataJSON()
      if (url.endsWith('/mo-dot'))
        return route.fulfill({ json: { ok: true, dotId: 'd1' } })
      if (url.endsWith('/gon-mo'))
        return loiCu
          ? route.fulfill({
              status: 404,
              json: { ok: false, error: 'Không có đường này' },
            })
          : route.fulfill({ json: mo })
      if (url.endsWith('/gon-nop')) {
        nops.push(b)
        if (matMang) {
          matMang = false
          return route.abort('failed')
        }
        return route.fulfill({
          json: {
            ok: true,
            dotId: 'd1',
            lan: 1,
            ban: 'Q',
            dung: true,
            ket: 'tu_sua',
            trangThai: 'da_tu_sua',
          },
        })
      }
      if (url.endsWith('/phat-item')) return route.fulfill({ json: ph })
      if (url.endsWith('/nop-item')) {
        nops.push(b)
        if (matMang) {
          matMang = false
          return route.abort('failed')
        }
        return route.fulfill({
          json: {
            ok: true,
            itemId: 'i1',
            receiptId: 'n1',
            dung: true,
            phanGiuDuoc: 'Em đã cộng đủ ba nguyên tố.',
            hanhDongTiep: 'Tiếp theo, thử vì sao cần cộng đủ nguyên tử.',
          },
        })
      }
      return route.fulfill({ json: { ok: true } })
    })
    await page.goto(`${base}/tests/fixtures/chua-cau-sai.html`)
    const nut = page.getByRole('button', { name: 'Mở câu cần chữa' })
    await nut.click()
    await page
      .getByRole('heading', {
        name: loiCu ? 'Khối lượng mol' : 'Em tự làm lại câu này',
        exact: true,
      })
      .waitFor()
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `Tràn ngang ở ${width}px`,
    )
    for (let i = 0; i < 18; i++) {
      await page.keyboard.press('Tab')
      assert.equal(
        await page.evaluate(() => !!document.activeElement?.closest('dialog')),
        true,
        'Tiêu điểm thoát khung',
      )
    }
    const phanHoi = loiCu
      ? page.getByText('Em đã cộng đủ ba nguyên tố.')
      : page.getByRole('heading', {
          name: 'Em đã tự sửa xong câu này',
          exact: true,
        })
    if (loiCu) {
      await page.getByRole('textbox', { name: 'Câu trả lời của em' }).fill('40')
      await page.getByRole('button', { name: 'Tự thử lại' }).click()
      await page.getByRole('alert').waitFor()
      assert.equal(
        await page
          .getByRole('textbox', { name: 'Câu trả lời của em' })
          .isDisabled(),
        true,
        'Mất mạng phải giữ câu trả lời đã nộp',
      )
      await page
        .getByRole('button', { name: 'Gửi lại câu trả lời đã giữ' })
        .click()
    } else {
      const o = page.getByRole('textbox', { name: 'Đáp án của em' })
      await o.fill('40')
      const kiem = page.getByRole('button', { name: 'Kiểm tra', exact: true })
      await kiem.click()
      await page.getByRole('alert').waitFor()
      assert.equal(
        await o.inputValue(),
        '40',
        'Mất mạng phải giữ đáp án em đã gõ',
      )
      assert.equal(await kiem.isEnabled(), true, 'Mất mạng phải cho gửi lại')
      await kiem.click()
    }
    await phanHoi.waitFor()
    assert.equal(nops.length, 2, 'Phải có đúng một lần gửi lại')
    assert.deepEqual(
      nops[0],
      nops[1],
      'Retry phải giữ nguyên khoá chống lặp và payload',
    )
    await page.waitForTimeout(1000)
    await phanHoi.waitFor()
    assert.equal(errors.length, 0, errors.join('\n'))
    await page.screenshot({ path: `${out}/chua-${ten}.png`, fullPage: true })
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('dialog').count(), 0)
    assert.equal(
      await nut.evaluate((el) => el === document.activeElement),
      true,
      'Đóng khung phải trả tiêu điểm về nút mở',
    )
    await page.getByRole('button', { name: 'Mở tờ chữa chung' }).click()
    const to = page.frameLocator('.lop-xem-phieu iframe')
    await to
      .locator('.mc-than')
      .getByText('Cùng nối lại: Khối lượng mol')
      .waitFor()
    assert.equal(
      await to.locator('.mc-cham').count(),
      0,
      'Không chấm cá nhân trên tờ chữa chung',
    )
    assert.equal(
      await to.getByText('Tên riêng của học sinh').count(),
      0,
      'Không chiếu tên riêng',
    )
    assert.equal(
      await to.locator('.mc-giai').isVisible(),
      false,
      'Giữ lời gỡ đóng trước khi chữa',
    )
    await to.locator('#mc-thanh [data-k="C"]').click()
    await page.getByText('Đã ghi chữa chung: 1').waitFor()
    await page.screenshot({
      path: `${out}/chua-lop-${ten}.png`,
      fullPage: true,
    })
    assert.equal(errors.length, 0, errors.join('\n'))
    await page.close()
  }
  console.log(
    'PASS: chữa câu gọn 360/430/xoay ngang 844/máy tính 1280px + lối cũ sửa từng bước 360px; không tràn ngang; Tab giữ trong dialog; Escape trả tiêu điểm; retry nguyên khoá + payload; phản hồi được giữ; tờ chữa chung giấu tên/lời gỡ, Thầy chữa ghi qua cầu nối iframe thật.',
  )
} finally {
  await browser?.close()
  vite.kill('SIGTERM')
}
