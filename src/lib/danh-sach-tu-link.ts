// DANH SÁCH LỚP TẢI THẲNG TỪ GOOGLE SHEET CỦA THẦY (thầy chốt 07/09).
//
// Thầy dán link mỗi khối một dòng, một lần; sau đó sửa sổ xong chỉ bấm Đồng bộ.
//
// VÌ SAO MÁY THẦY TẢI CHỨ KHÔNG PHẢI MÁY CHỦ. Bản đầu để Apps Script gọi
// `UrlFetchApp` cho gọn. Đo trên máy chủ thật thì hỏng: lệnh đó đòi thêm quyền
// `script.external_request`, mà thêm quyền là phải xin lại uỷ quyền cho CẢ ứng
// dụng web — làm giữa buổi dạy thì chặn hết em đang thi. Đo tiếp thì tệp "Xuất
// bản lên web" của Google CÓ gắn nhãn CORS, trình duyệt đọc thẳng được. Nên máy
// thầy tải, rồi đẩy lên bằng `napDanhSachLop` vốn đã có quyền từ trước.
//
// Máy chủ chỉ GIỮ LINK hộ (Script property), để thầy đổi máy hay mở app trên
// điện thoại vẫn không phải dán lại.

export interface EmTrongDanhSach {
  sbd: string
  hoTen: string
  namSinh: string
  lop: string
}

/** Mọi kiểu link Google Sheet về đúng một link tải CSV.
 *
 * Ba dạng thầy có thể dán:
 *   - link "Xuất bản lên web": /spreadsheets/d/e/<mã>/pubhtml (hoặc /pub?...)
 *   - link sheet thường:       /spreadsheets/d/<mã>/edit#gid=123
 *   - link CSV sẵn:            giữ nguyên
 * `gid` giữ lại nếu có, để thầy trỏ đúng một tab chứ không phải tab đầu. */
export function linkCsvDanhSach(u: unknown): string {
  const s = String(u == null ? '' : u).trim()
  if (!s) return ''
  const gid = /[#?&]gid=(\d+)/.exec(s)?.[1]
  const pub = /\/spreadsheets\/d\/e\/([^/]+)\/pub/.exec(s)
  if (pub) return `https://docs.google.com/spreadsheets/d/e/${pub[1]}/pub?output=csv${gid ? `&gid=${gid}` : ''}`
  const thuong = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/.exec(s)
  if (thuong) return `https://docs.google.com/spreadsheets/d/${thuong[1]}/export?format=csv${gid ? `&gid=${gid}` : ''}`
  return s
}

/** Bóc CSV đúng luật dấu ngoặc kép: ô có dấu phẩy, có xuống dòng, có `""` bên
 * trong đều phải giữ nguyên. Tên em người Việt hay có dấu phẩy trong ô ghi chú,
 * bóc bằng `split(',')` là lệch hết cột. */
export function tachCsv(van: string): string[][] {
  const bang: string[][] = []
  let hang: string[] = []
  let o = ''
  let trongNgoac = false
  const t = String(van || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (trongNgoac) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          o += '"'
          i++
        } else trongNgoac = false
      } else o += c
      continue
    }
    if (c === '"') trongNgoac = true
    else if (c === ',') {
      hang.push(o)
      o = ''
    } else if (c === '\n') {
      hang.push(o)
      bang.push(hang)
      hang = []
      o = ''
    } else o += c
  }
  if (o !== '' || hang.length) {
    hang.push(o)
    bang.push(hang)
  }
  return bang
}

function chuanNhan(v: string): string {
  return String(v || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐðÐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim()
}

/** Nhận cột theo TÊN TIÊU ĐỀ, không theo vị trí: ba sheet của thầy đặt tiêu đề
 * khác nhau ("HoTen" và "Họ tên"). Không tiêu đề nào khớp thì mới lùi về
 * 0-1-2-3. */
export function cotDanhSach(tieuDe: string[]): { sbd: number; hoTen: number; namSinh: number; lop: number } {
  const vt = { sbd: -1, hoTen: -1, namSinh: -1, lop: -1 }
  tieuDe.forEach((ten, i) => {
    const t = chuanNhan(ten)
    if (vt.sbd < 0 && (t === 'sbd' || t === 'sobaodanh' || t === 'so')) vt.sbd = i
    else if (vt.hoTen < 0 && (t === 'hoten' || t === 'ten' || t === 'hovaten')) vt.hoTen = i
    else if (vt.namSinh < 0 && (t === 'namsinh' || t === 'nam' || t === 'ngaysinh')) vt.namSinh = i
    else if (vt.lop < 0 && (t === 'lop' || t === 'khoi')) vt.lop = i
  })
  if (vt.sbd < 0) vt.sbd = 0
  if (vt.hoTen < 0) vt.hoTen = 1
  if (vt.namSinh < 0) vt.namSinh = 2
  return vt
}

/** Năm sinh về đúng 4 chữ số — ô có thể là số, là ngày, hay là chuỗi. */
export function namSinh4So(v: unknown): string {
  return /(19|20)\d{2}/.exec(String(v == null ? '' : v))?.[0] ?? ''
}

/** Lớp suy từ năm sinh (vào lớp 1 lúc 6 tuổi; năm học mới tính từ tháng 9).
 * Sheet của thầy chỉ có SBD, họ tên, năm sinh — cột Lớp tự tính ở đây. */
export function lopTuNamSinh(ns: unknown, now: Date = new Date()): string {
  const n = Number(ns)
  if (!Number.isFinite(n) || n < 1990 || n > 2100) return ''
  const namHoc = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  const lop = namHoc - n - 5
  return lop >= 1 && lop <= 12 ? String(lop) : ''
}

/** Bóc một tệp CSV thành danh sách em. Dòng không có số báo danh dạng số bị bỏ
 * — sheet của thầy hay có dòng tiêu đề phụ, dòng tổng, dòng ghi chú. */
export function docDanhSachTuCsv(van: string, now?: Date): EmTrongDanhSach[] {
  const bang = tachCsv(van).filter((h) => h.some((o) => String(o).trim()))
  if (bang.length < 2) return []
  const vt = cotDanhSach(bang[0])
  const ra: EmTrongDanhSach[] = []
  for (let i = 1; i < bang.length; i++) {
    const h = bang[i]
    const sbd = String(h[vt.sbd] ?? '').trim()
    if (!/^\d{3,12}$/.test(sbd)) continue
    const ns = namSinh4So(h[vt.namSinh])
    const lop = (vt.lop >= 0 ? String(h[vt.lop] ?? '').trim() : '') || lopTuNamSinh(ns, now)
    ra.push({ sbd, hoTen: String(h[vt.hoTen] ?? '').replace(/\s+/g, ' ').trim(), namSinh: ns, lop })
  }
  return ra
}

export interface KetQuaMotLink {
  link: string
  items: EmTrongDanhSach[]
  loi: string
}

/** Tải MỘT link. Lỗi trả về trong `loi`, không ném — một link hỏng không được
 * làm hỏng cả lượt đồng bộ trước khi thầy kịp đọc lý do. */
export async function taiDanhSachTuLink(link: string, tai: typeof fetch = fetch, now?: Date): Promise<KetQuaMotLink> {
  const url = linkCsvDanhSach(link)
  if (!url) return { link, items: [], loi: 'Link rỗng' }
  let van = ''
  try {
    const r = await tai(url)
    if (!r.ok) return { link, items: [], loi: `Google trả mã ${r.status} — kiểm tra sheet đã bật Tệp → Chia sẻ → Xuất bản lên web chưa` }
    van = await r.text()
  } catch (e) {
    return { link, items: [], loi: `Không tải được: ${e instanceof Error ? e.message : 'lỗi mạng'}` }
  }
  if (/^\s*(<!DOCTYPE|<html)/i.test(van)) {
    return { link, items: [], loi: 'Link trả về trang HTML chứ không phải CSV — dùng link Xuất bản lên web' }
  }
  const items = docDanhSachTuCsv(van, now)
  if (!items.length) return { link, items: [], loi: 'Không dòng nào có số báo danh' }
  return { link, items, loi: '' }
}

export interface KetQuaGomLink {
  items: EmTrongDanhSach[]
  theoLink: { link: string; so: number; loi: string }[]
  trung: string[]
  /** Link nào hỏng. Còn dòng nào ở đây thì TUYỆT ĐỐI không đẩy lên. */
  hong: { link: string; loi: string }[]
}

/** Tải cả bộ link rồi gộp. Số báo danh trùng giữa hai khối: giữ dòng của link
 * đứng trước, ghi lại để báo cho thầy. */
export async function gomDanhSachTuLink(links: string[], tai: typeof fetch = fetch, now?: Date): Promise<KetQuaGomLink> {
  const kq = await Promise.all(links.map((l) => taiDanhSachTuLink(l, tai, now)))
  const items: EmTrongDanhSach[] = []
  const daCo = new Set<string>()
  const trung: string[] = []
  for (const r of kq) {
    for (const e of r.items) {
      if (daCo.has(e.sbd)) {
        trung.push(e.sbd)
        continue
      }
      daCo.add(e.sbd)
      items.push(e)
    }
  }
  return {
    items,
    theoLink: kq.map((r) => ({ link: r.link, so: r.items.length, loi: r.loi })),
    trung,
    hong: kq.filter((r) => r.loi).map((r) => ({ link: r.link, loi: r.loi })),
  }
}
