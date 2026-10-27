// GIÃN Ý ĐỀ (thầy 27/10: «Đề hiển thị phải có giãn cách ý cho phù hợp, đọc không bị rối») — CHỈ là bước TRÌNH BÀY của màn làm bài
// app học sinh (DeCau): không đổi chữ đề, không đổi luật. Đề (đã qua `tachDongTheoY`) → các ĐOẠN:
//   · mỗi dòng xuống hàng gốc (\n, <br>, </p><p>) là một đoạn;
//   · dòng mở bằng «Bước 1:», «Thí nghiệm 1:», «(1)», «a)», «Cho biết:» ⇒ đoạn có NHÃN (chữ nhãn đứng riêng để in đậm vừa);
//     «Bước N:» / «Thí nghiệm N:» / «Cho biết:» / «Giả sử» đứng giữa dòng ngay sau dấu kết câu cũng được tách ra đoạn riêng;
//   · PHƯƠNG TRÌNH phản ứng (chuỗi chất có mũi tên →, ⇌, …) ⇒ khối riêng 'pt' — kể cả khi dính sau câu chữ cùng dòng;
//   · CÂU HỎI cuối (câu chứa «là bao nhiêu», «Giá trị của», «nào sau đây», «?» cuối đề, hoặc phần sau dòng trống cuối) ⇒ đoạn 'hoi'.
// KHÔNG tự cắt câu theo dấu chấm ở chỗ nào khác (đề dài một dòng vẫn là một đoạn) — không đoán bừa.

export type LoaiDoan = 'chu' | 'nhan' | 'pt' | 'hoi'
export type DoanDe = { loai: LoaiDoan; chu: string; nhan?: string }

const RE_NHAN_DAU = /^(?:(?:Bước|Thí nghiệm|TN|Giai đoạn|Phần)\s*\d{1,2}\s*[:.]|Cho biết\s*:|\(\d{1,2}\)|\([a-eA-E]\)|[a-e]\))/
/** Mẫu mở đoạn riêng khi đứng giữa dòng, ngay sau dấu kết câu (không gồm «(1)», «a)»: `tachDongTheoY` đã lo). */
const RE_MO_DOAN_GIUA = /([.;!?])[ \t]+(?=(?:Bước|Thí nghiệm)\s*\d{1,2}\s*:|Cho biết\s*:|Giả sử\s)/g
const RE_MUI = /→|⇌|←|⟶|⇄|⇋|->|<=>|<->/
const RE_HOI = /là bao nhiêu|[Gg]iá trị (?:của|gần nhất)|nào sau đây|\?\s*$/

/** Một khúc cách nhau bằng khoảng trắng có dáng CÔNG THỨC hoá học (C6H5NH2, 3HNO3, C6H2(NO2)3NH2, Na2Cr2O7/H+, X, Y1…). */
export function laCongThuc(tu: string): boolean {
  let t = tu.replace(/^\d+(?:\/\d+)?(?=[A-Z([])/, '').replace(/\((?:s|l|g|aq|dd|k|r)\)$/, '').replace(/[↑↓]+$/, '')
  if (!/[A-Z]/.test(t)) return false
  t = t.replace(/[A-Z][a-z]?/g, '')
  return /^[\d()[\]·.*+\-−⁺⁻⁰-⁹₀-₉ₙ/n]*$/.test(t)
}

const DIEU_KIEN = /^(?:đặc|loãng|dư|khan|nóng|t°|to|xt|xúc tác|đun nóng|↑|↓)$/i
type Khuc = { bd: number; kt: number; raw: string; loai: 'mui' | 'cong' | 'ct' | 'dk' | 'heso' | 'chu'; hetCau: boolean }

function phanLoai(raw: string): Khuc['loai'] {
  const t = raw.replace(/[,.;:]+$/, '')
  if (!t) return 'chu'
  if (RE_MUI.test(t)) return 'mui'
  if (t === '+') return 'cong'
  if (/^\d+(?:\/\d+)?$/.test(t)) return 'heso'
  if (DIEU_KIEN.test(t)) return 'dk'
  if (t.startsWith('(') && t.endsWith(')')) {
    // Ngoặc điều kiện «(H2SO4 đặc, t°)», «(xt, t°)»; ngoặc lời «(2,4,6-trinitrophenol)», «(khối lượng riêng 1 g/mL)» không phải.
    const ben = t.slice(1, -1).split(/[\s,]+/).filter(Boolean)
    if (ben.length && ben.every((x) => laCongThuc(x) || DIEU_KIEN.test(x) || /^(?:xt|t°|to|°C|\d+°C|as|ánh sáng|enzyme|men|Ni|Pt|Pd)$/i.test(x))) return 'dk'
    return 'chu'
  }
  return laCongThuc(t) ? 'ct' : 'chu'
}

/** Khúc theo khoảng trắng; ngoặc chưa đóng gộp tiếp các khúc sau tới khi đóng (tối đa 8 khúc). */
function tachKhuc(s: string): Khuc[] {
  const ra: Khuc[] = []
  const re = /\S+/g
  let m: RegExpExecArray | null
  const thieu = (x: string) => (x.match(/[([]/g)?.length ?? 0) - (x.match(/[)\]]/g)?.length ?? 0)
  while ((m = re.exec(s)) !== null) {
    let bd = m.index, kt = m.index + m[0].length, du = thieu(m[0]), lan = 0
    while (du > 0 && lan < 8) {
      const tiep = re.exec(s)
      if (!tiep) break
      kt = tiep.index + tiep[0].length
      du += thieu(tiep[0])
      lan++
    }
    const raw = s.slice(bd, kt)
    ra.push({ bd, kt, raw, loai: phanLoai(raw), hetCau: /[.;]$/.test(raw) })
    bd = kt
  }
  return ra
}

/** Vị trí [bd, kt) của PHƯƠNG TRÌNH đầu tiên trong một dòng (chất + chất → chất…), hoặc null. Khắt khe: thà bỏ sót còn hơn cắt nhầm câu chữ. */
export function timPhuongTrinh(s: string): { bd: number; kt: number } | null {
  if (!RE_MUI.test(s) || /\$|\\[a-zA-Z]/.test(s)) return null
  const k = tachKhuc(s)
  const vao = new Set<Khuc['loai']>(['ct', 'cong', 'dk', 'heso'])
  for (let ai = 0; ai < k.length; ai++) {
    if (k[ai].loai !== 'mui') continue
    let a = ai - 1
    while (a >= 0 && vao.has(k[a].loai) && !k[a].hetCau) a--
    let dau = a + 1
    while (dau < ai && k[dau].loai !== 'ct' && k[dau].loai !== 'heso') dau++
    let b = ai + 1, cuoi = ai
    while (b < k.length && (vao.has(k[b].loai) || k[b].loai === 'mui')) {
      cuoi = b
      if (k[b].hetCau) break
      b++
    }
    while (cuoi > ai && (k[cuoi].loai === 'cong' || k[cuoi].loai === 'mui')) cuoi--
    const trai = k.slice(dau, ai), phai = k.slice(ai + 1, cuoi + 1)
    const soCt = [...trai, ...phai].filter((x) => x.loai === 'ct').length
    if (!trai.some((x) => x.loai === 'ct') || !phai.some((x) => x.loai === 'ct') || soCt < 2) continue
    const ca = [...trai, k[ai], ...phai]
    const caDong = dau === 0 && cuoi === k.length - 1
    if (!caDong && !ca.some((x) => x.loai === 'cong') && ca.filter((x) => x.loai === 'mui').length < 2) continue
    return { bd: k[dau].bd, kt: k[cuoi].kt }
  }
  return null
}

/** Một dòng (đã bỏ nhãn) → đoạn chữ + khối phương trình. */
function tachDongPt(dong: string, nhan: string | undefined, ra: DoanDe[]): void {
  let con = dong, nh = nhan
  for (let lan = 0; lan < 6; lan++) {
    const pt = timPhuongTrinh(con)
    if (!pt) break
    const truoc = con.slice(0, pt.bd).trim()
    if (truoc) ra.push({ loai: nh ? 'nhan' : 'chu', chu: truoc, ...(nh ? { nhan: nh } : {}) })
    ra.push({ loai: 'pt', chu: con.slice(pt.bd, pt.kt), ...(!truoc && nh ? { nhan: nh } : {}) })
    nh = undefined
    con = con.slice(pt.kt).trim()
    if (!con) return
  }
  ra.push({ loai: nh ? 'nhan' : 'chu', chu: con, ...(nh ? { nhan: nh } : {}) })
}

const laHoa = (c: string): boolean => c !== c.toLowerCase() && c === c.toUpperCase()

/** Đề → các đoạn trình bày. Đề rỗng ⇒ []. */
export function tachDoanDe(de: string | null | undefined): DoanDe[] {
  if (!de) return []
  const s = String(de)
    .replace(/\r\n?/g, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/^\s*<p[^>]*>|<\/p>\s*$/gi, '')
    .replace(RE_MO_DOAN_GIUA, '$1\n')
  const ra: DoanDe[] = []
  let viTriSauTrong = -1 // chỉ số đoạn đầu tiên sau dòng trống cuối
  for (const dongGoc of s.split('\n')) {
    const dong = dongGoc.trim()
    if (!dong) { if (ra.length) viTriSauTrong = ra.length; continue }
    const m = RE_NHAN_DAU.exec(dong)
    const nhan = m ? m[0] : undefined
    const than = m ? dong.slice(m[0].length).trim() : dong
    if (m && !than) { ra.push({ loai: 'nhan', chu: '', nhan }); continue }
    tachDongPt(than, nhan, ra)
  }
  // CÂU HỎI CUỐI: phần sau dòng trống cuối (một đoạn chữ), hoặc câu cuối chứa dấu hiệu hỏi.
  const cuoi = ra[ra.length - 1]
  if (cuoi && cuoi.loai !== 'pt') {
    if (viTriSauTrong === ra.length - 1 && viTriSauTrong > 0 && !cuoi.nhan) cuoi.loai = 'hoi'
    else if (!cuoi.nhan) {
      const mh = RE_HOI.exec(cuoi.chu)
      if (mh) {
        // Đầu câu hỏi = ngay sau dấu kết câu (. ! ?) gần nhất trước dấu hiệu, có khoảng trắng và chữ HOA mở câu sau nó.
        const re = /[.!?]\s+(\S)/g
        let dauCau = 0, x: RegExpExecArray | null
        while ((x = re.exec(cuoi.chu)) !== null && x.index < mh.index) if (laHoa(x[1])) dauCau = x.index + x[0].length - 1
        if (dauCau > 0) {
          const truoc = cuoi.chu.slice(0, dauCau).trim()
          ra.splice(ra.length - 1, 1, { loai: 'chu', chu: truoc }, { loai: 'hoi', chu: cuoi.chu.slice(dauCau).trim() })
        } else if (ra.length > 1) cuoi.loai = 'hoi'
      }
    }
  }
  return ra
}

/** Phương trình chỉ được xuống dòng TẠI TOÁN TỬ: sau «+» hoặc trước mũi tên; mọi khoảng trắng khác (trong ngoặc điều kiện «(H2SO4 đặc, t°)»,
 *  giữa chất và «đặc») thành khoảng trắng không ngắt — không vỡ giữa một chất / một điều kiện. Chữ nhìn thấy không đổi. */
export function giuLienPhuongTrinh(pt: string): string {
  const k = tachKhuc(pt)
  let ra = ''
  k.forEach((x, i) => {
    if (i > 0) {
      const giua = pt.slice(k[i - 1].kt, x.bd)
      const ngat = k[i - 1].loai === 'cong' || x.loai === 'mui'
      ra += ngat ? giua : giua.replace(/[ \t]+/g, '\u00a0')
    }
    ra += x.loai === 'dk' ? x.raw.replace(/[ \t]+/g, '\u00a0') : x.raw
  })
  return pt.slice(0, k[0]?.bd ?? 0) + ra + pt.slice(k[k.length - 1]?.kt ?? pt.length)
}
