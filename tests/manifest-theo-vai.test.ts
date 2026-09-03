// MANIFEST PHẢI ĐÚNG VAI NGAY TỪ LÚC PHÂN TÍCH HTML.
//
// Lỗi thầy quay video: bấm link riêng → dải "Cài ĐĐH Học sinh" hiện đúng → bấm
// Cài đặt → nhưng màn khởi động lại là app "ĐỖ ĐẠI HỌC" chung, biểu tượng
// chung, và mở lên vào app quản lý. Vì trình duyệt đọc thẻ <link rel="manifest">
// ngay lúc phân tích HTML, còn mã JS đổi thẻ thì chạy sau — đã muộn.
//
// Test này chạy ĐÚNG đoạn script nội tuyến trong index.html, không chép lại
// logic, để index.html sửa mà quên là test đổ.
import { beforeEach, describe, expect, it } from 'vitest'
import indexHtml from '../index.html?raw'

const TOKEN = 'a'.repeat(32)

/** Lấy đoạn script nội tuyến đầu tiên trong <head> của index.html. */
function scriptChonManifest(): string {
  const m = indexHtml.match(/<script>([\s\S]*?)<\/script>/)
  if (!m) throw new Error('index.html không còn script nội tuyến chọn manifest')
  return m[1]
}

function dungDom() {
  document.head.innerHTML = `
    <link rel="manifest" id="ddh-manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" id="ddh-apple-icon" href="/icon-192.png" />
    <meta name="apple-mobile-web-app-title" id="ddh-apple-title" content="ĐỖ ĐẠI HỌC" />`
}

function chay(duong: string) {
  history.replaceState(null, '', duong)
  dungDom()
  new Function(scriptChonManifest())()
  return {
    manifest: document.getElementById('ddh-manifest')!.getAttribute('href'),
    icon: document.getElementById('ddh-apple-icon')!.getAttribute('href'),
    ten: document.getElementById('ddh-apple-title')!.getAttribute('content'),
  }
}

beforeEach(() => history.replaceState(null, '', '/'))

describe('index.html chọn manifest theo vai', () => {
  it('link riêng học sinh /omr-app/hs/<token>', () => {
    expect(chay(`/omr-app/hs/${TOKEN}`)).toEqual({
      manifest: '/omr-app/manifest-hs.json',
      icon: '/omr-app/icon-hs-192.png',
      ten: 'ĐĐH Học sinh',
    })
  })

  it('link riêng phụ huynh /omr-app/ph/<token>', () => {
    expect(chay(`/omr-app/ph/${TOKEN}`)).toEqual({
      manifest: '/omr-app/manifest-ph.json',
      icon: '/omr-app/icon-ph-192.png',
      ten: 'ĐĐH Phụ huynh',
    })
  })

  it('app đã cài mở bằng start_url ?vai=hs&nguon=pwa', () => {
    expect(chay('/omr-app/?vai=hs&nguon=pwa').manifest).toBe('/omr-app/manifest-hs.json')
    expect(chay('/omr-app/?vai=ph&nguon=pwa').manifest).toBe('/omr-app/manifest-ph.json')
  })

  it('sau khi 404.html chuyển hướng: ?vai=hs&token=…', () => {
    expect(chay(`/omr-app/?vai=hs&token=${TOKEN}`).manifest).toBe('/omr-app/manifest-hs.json')
  })

  it('máy thầy và link vào thi giữ manifest chung', () => {
    for (const d of ['/omr-app/', '/omr-app/?vai=gv', '/omr-app/gv', '/omr-app/t/984033', '/omr-app/index.html']) {
      expect(chay(d)).toEqual({ manifest: '/manifest.json', icon: '/icon-192.png', ten: 'ĐỖ ĐẠI HỌC' })
    }
  })

  it('chạy được cả khi app không nằm trong thư mục con (máy thầy dev)', () => {
    expect(chay(`/hs/${TOKEN}`).manifest).toBe('/manifest-hs.json')
    expect(chay('/?vai=ph').manifest).toBe('/manifest-ph.json')
  })

  it('token sai độ dài thì không nhận là link riêng', () => {
    expect(chay('/omr-app/hs/abc').manifest).toBe('/manifest.json')
    expect(chay(`/omr-app/hs/${'a'.repeat(31)}`).manifest).toBe('/manifest.json')
  })

  it('index.html vẫn còn đúng MỘT thẻ manifest — hai thẻ thì thẻ sau bị bỏ qua, dễ hiểu nhầm', () => {
    const khongChuThich = indexHtml.replace(/<!--[\s\S]*?-->/g, '')
    const soThe = (khongChuThich.match(/<link[^>]+rel="manifest"/g) || []).length
    expect(soThe).toBe(1)
  })
})
