// @vitest-environment node
// KHÔNG VA CHẠM TÊN LỚP CSS (bài học hotfix P0 21/09: `.mt`/`.mt-tren` của mũi tên phản ứng hoá học ở src/index.css trùng tiền tố `mt-` của bản vẽ ⇒ app phụ huynh tràn ngang trên điện thoại thật).
// Với MỌI thành phần giao diện làm trong ngày (Thi đua, Cho ăn, Đường về đích, thanh hấp thụ của Đảo, thẻ Giao thêm, app PH mới): mỗi lớp mà TSX của nó dùng và có tiền tố riêng CHỈ được định nghĩa trong tệp CSS SỞ HỮU của nó —
// không tệp CSS nào khác trong src/ có bộ chọn `.lớp` trùng. Bản vẽ của phiên phụ dùng tiền tố ngắn (td-, vd-, mt-…): bê nguyên là rủi ro y hệt; chỉ chấp nhận tiền tố mang họ của app (bnv-, vd-, dao-, phm-…) và kiểm mỗi lần.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const goc = process.cwd()
const doc = (p: string) => fs.readFileSync(path.join(goc, p), 'utf8')
function duyetCss(dir: string, ra: string[] = []): string[] {
  for (const e of fs.readdirSync(path.join(goc, dir), { withFileTypes: true })) {
    const p = `${dir}/${e.name}`
    if (e.isDirectory()) {
      if (e.name !== 'node_modules' && e.name !== 'graphify-out') duyetCss(p, ra)
    } else if (e.name.endsWith('.css')) ra.push(p)
  }
  return ra
}
const TAT_CA_CSS = duyetCss('src')
const boChon = (css: string): Set<string> => {
  const s = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{[^{}]*\}/g, '{}')
  return new Set([...s.matchAll(/\.([A-Za-z][\w-]*)/g)].map((m) => m[1]!))
}
const DINH_NGHIA = new Map(TAT_CA_CSS.map((p) => [p, boChon(doc(p))] as const))
const lopTsx = (src: string, tienTo: RegExp): string[] => {
  const ra = new Set<string>()
  for (const m of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) for (const t of (m[1] ?? m[2] ?? '').replace(/\$\{[^}]*\}/g, ' ').split(/\s+/)) if (t && /^[A-Za-z][\w-]*$/.test(t) && tienTo.test(t)) ra.add(t)
  return [...ra]
}

const CA = [
  { ten: 'Thi đua hôm nay', tsx: ['src/components/bang-nhiem-vu/OThiDua.tsx'], css: ['src/components/bang-nhiem-vu/bang-nhiem-vu.css'], tienTo: /^bnv-td/ },
  { ten: 'Lời nhắc Cho ăn', tsx: ['src/components/bang-nhiem-vu/TheChoAn.tsx'], css: ['src/components/bang-nhiem-vu/bang-nhiem-vu.css'], tienTo: /^bnv-cho-an/ },
  { ten: 'Thẻ Giao thêm bài cho con', tsx: ['src/components/bang-nhiem-vu/GiaoThemChoCon.tsx'], css: ['src/components/bang-nhiem-vu/bang-nhiem-vu.css'], tienTo: /^bnv-giao-them/ },
  { ten: 'Đường về đích', tsx: ['src/components/bang-nhiem-vu/TheVeDich.tsx'], css: ['src/components/bang-nhiem-vu/ve-dich.css'], tienTo: /^vd(-|$)/ },
  { ten: 'Thanh hấp thụ của Đảo', tsx: ['src/game/than-thu-v2/dao/DaoCuaEm.tsx'], css: ['src/game/than-thu-v2/dao/dao.css'], tienTo: /^dao-hap-thu/ },
  { ten: 'App phụ huynh mới (bảng "Mọi thứ về con")', tsx: ['src/components/ph-moi/BangMoiThu.tsx', 'src/components/ph-moi/ThanhDay.tsx'], css: ['src/components/ph-moi/ph-moi.css', 'src/components/ph-moi/ph-moi-them.css'], tienTo: /^phm(-|$)/ },
  { ten: 'App phụ huynh mới (màn chính kiểu Apple)', tsx: ['src/components/ph-moi/ManChinh.tsx', 'src/components/ph-moi/ThanhDayAp.tsx', 'src/components/ph-moi/BieuTuongAp.tsx'], css: ['src/components/ph-moi/ph-apple.css'], tienTo: /^phm-ap(-|$)/ },
  { ten: 'Bảng tin kiểu sàn giao dịch (thầy)', tsx: ['src/components/bang-tin-san/BangTinSan.tsx', 'src/components/bang-tin-san/ThanhTren.tsx', 'src/components/bang-tin-san/BangChay.tsx', 'src/components/bang-tin-san/OSo.tsx', 'src/components/bang-tin-san/SoLan.tsx'], css: ['src/components/bang-tin-san/bang-tin-san.css'], tienTo: /^bts-/ },
] as const

describe('không va chạm tên lớp CSS', () => {
  for (const c of CA)
    it(`${c.ten}: mọi lớp có tiền tố riêng CHỈ định nghĩa trong tệp CSS sở hữu; không tệp CSS nào khác trùng bộ chọn`, () => {
      const lop = [...new Set(c.tsx.flatMap((t) => lopTsx(doc(t), c.tienTo)))]
      expect(lop.length, `không thấy lớp nào của ${c.ten}`).toBeGreaterThan(3)
      // mỗi lớp phải có định nghĩa ở tệp CSS sở hữu (không dùng lớp mồ côi)
      const suoHuu = new Set(c.css.flatMap((p) => [...DINH_NGHIA.get(p)!]))
      const moCoi = lop.filter((t) => !suoHuu.has(t))
      // Lớp chỉ làm móc chọn (data-…/test) không có CSS: cho phép tối đa 4.
      expect(moCoi.length, `${c.ten}: lớp không có định nghĩa: ${moCoi.join(', ')}`).toBeLessThanOrEqual(4)
      for (const [p, d] of DINH_NGHIA) {
        if ((c.css as readonly string[]).includes(p)) continue
        for (const t of lop) expect(d.has(t), `${p} có bộ chọn .${t} (của ${c.ten})`).toBe(false)
      }
    })
  it('gốc `.mt` (mũi tên hoá học) vẫn ở index.css và KHÔNG thành gốc của app nào: không TSX phụ huynh/HS mới dùng className "m3 mt" / "mt"', () => {
    expect(boChon(doc('src/index.css')).has('mt')).toBe(true)
    for (const f of ['src/components/ph-moi/ManChinh.tsx', 'src/components/ph-moi/BangMoiThu.tsx', 'src/components/bang-nhiem-vu/TheVeDich.tsx', 'src/components/bang-nhiem-vu/OThiDua.tsx']) expect(doc(f)).not.toMatch(/className="(?:[\w-]+ )*mt(?: [\w-]+)*"/)
  })
})
