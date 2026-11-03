// Chỉ số dưới / trên CHUẨN cho khuôn svg (phông tự host của app không có kí tự ₂ ²⁺ nên không để trình duyệt tự chọn glyph). Dùng chung app + máy vẽ (dựng ảnh kiểm).
const CHI_SO: Record<string, [string, number]> = { '₀': ['0', 1], '₁': ['1', 1], '₂': ['2', 1], '₃': ['3', 1], '₄': ['4', 1], '₅': ['5', 1], '₆': ['6', 1], '₇': ['7', 1], '₈': ['8', 1], '₉': ['9', 1], '₊': ['+', 1], '₋': ['−', 1], '⁰': ['0', -1], '¹': ['1', -1], '²': ['2', -1], '³': ['3', -1], '⁴': ['4', -1], '⁵': ['5', -1], '⁶': ['6', -1], '⁷': ['7', -1], '⁸': ['8', -1], '⁹': ['9', -1], '⁺': ['+', -1], '⁻': ['−', -1] }
const RE_CHI_SO = /[₀-₉₊₋⁰¹²³⁴-⁹⁺⁻]+/g
/** Chỉ số dưới / trên CHUẨN, không phụ thuộc phông: kí tự Unicode (NH₃, SO₄²⁻) đổi thành tspan nhỏ 70 % hạ / nâng — chữ vẫn là chữ thật trong đề. */
export function chiSoChuan(svg: string): string {
  return svg.replace(/>([^<>]+)</g, (_m, t: string) => {
    if (!RE_CHI_SO.test(t)) return `>${t}<`
    RE_CHI_SO.lastIndex = 0
    let ra = '', cuoi = 0, dang = 0 // dang = độ lệch dy (em của chữ mẹ) đang áp ở mạch chữ hiện tại
    for (const m of t.matchAll(RE_CHI_SO)) {
      const dau = t.slice(cuoi, m.index)
      if (dau) ra += dang ? `<tspan dy="${-dang}em">${dau}</tspan>` : dau
      dang = 0
      // mỗi kí tự một tspan cỡ 70 %: dưới hạ 0.2, trên nâng 0.4 (đơn vị = cỡ chữ mẹ; dy tính theo em của chính tspan nên chia 0.7)
      let ds = 0
      for (const c of m[0]) { const [k, h] = CHI_SO[c]!; const dich = h > 0 ? 0.2 : -0.4; ra += `<tspan dy="${((dich - ds) / 0.7).toFixed(3)}em" font-size="70%">${k}</tspan>`; ds = dich }
      dang = ds
      cuoi = m.index! + m[0].length
    }
    const duoi = t.slice(cuoi)
    if (duoi) ra += dang ? `<tspan dy="${-dang}em">${duoi}</tspan>` : duoi
    else if (dang) ra += `<tspan dy="${-dang}em"></tspan>`
    return `>${ra}<`
  })
}
