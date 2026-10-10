import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('Đoàn Hộ Tống · Cho phép vuốt cuộn mượt mà trên mobile dọc để chọn đáp án và chốt', () => {
  const tranV2 = readFileSync(resolve(__dirname, '../src/game/than-thu-v2/dao2/tran-v2.css'), 'utf-8')
  const doanCss = readFileSync(resolve(__dirname, '../src/game/than-thu-v2/doan.css'), 'utf-8')

  it('tran-v2.css có media query màn dọc cho .dh.dh-tran mở overflow-y: auto và touch-action: pan-y', () => {
    expect(tranV2).toMatch(/@media\s*\(max-width:719px\),\s*\(orientation:portrait\)/)
    expect(tranV2).toMatch(/html:root body \.dh\.dh-tran\s*\{[^}]*overflow-y:\s*auto\s*!important/)
    expect(tranV2).toMatch(/html:root body \.dh\.dh-tran\s*\{[^}]*touch-action:\s*pan-y\s*!important/)
  })

  it('tran-v2.css gỡ height cứng của .dh-khung và cho phép mở rộng tự nhiên trên mobile dọc', () => {
    expect(tranV2).toMatch(/html:root body \.dh\.dh-tran \.dh-khung\s*\{[^}]*height:\s*auto\s*!important/)
    expect(tranV2).toMatch(/html:root body \.dh\.dh-tran \.dh-khung\s*\{[^}]*overflow:\s*visible\s*!important/)
  })

  it('tran-v2.css mở cuộn thẻ giấy .dh-giay, gỡ overscroll-behavior: contain để không chặn vuốt chạm', () => {
    expect(tranV2).toMatch(/html:root body \.dh\.dh-tran \.dh-giay\s*\{[^}]*overscroll-behavior:\s*auto\s*!important/)
    expect(tranV2).toMatch(/html:root body \.dh\.dh-tran \.dh-giay\s*\{[^}]*overflow:\s*visible\s*!important/)
  })

  it('tran-v2.css đảm bảo .dh2-doc và .dh2-thao-tac không bị co méo trên mobile dọc', () => {
    expect(tranV2).toMatch(/html:root body \.dh\.dh2 \.dh2-doc\s*\{[^}]*flex:\s*0 0 auto\s*!important/)
    expect(tranV2).toMatch(/html:root body \.dh\.dh2 \.dh2-thao-tac\s*\{[^}]*display:\s*flex\s*!important/)
  })

  it('doan.css mở cuộn overflow-y: auto cho .dh-tran trên màn dọc / mobile', () => {
    expect(doanCss).toMatch(/@media\s*\(max-width:719px\),\s*\(orientation:portrait\)/)
    expect(doanCss).toMatch(/\.dh-tran\{overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior-y:auto\}/)
    expect(doanCss).toMatch(/\.dh-tran \.dh-khung\{height:auto;min-height:100%;overflow:visible/)
  })
})
