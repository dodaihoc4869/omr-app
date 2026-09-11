// CÂY KHO ĐỀ — đọc cấu trúc thật nằm trong MÃ ĐỀ.
//
// Thầy chốt 12/09: "chỗ chọn btvn cho chọn theo cây thư mục chuẩn theo kho đề
// nhé. Cho tick nhiều." Danh sách phẳng 118 tờ đề trong một ô chọn là thứ không
// tìm được gì: thầy phải cuộn qua cả kho để thấy hai tờ cùng một bài.
//
// Mã đề của thầy đã có sẵn cấu trúc, chỉ là chưa ai đọc nó:
//
//     12-C3-B8-D2      lớp 12 · chương 3 · bài 8 · đề 2
//     12-C2-ON         lớp 12 · chương 2 · ôn tập chương
//     DH-12-C2-B4      dạy thêm · lớp 12 · chương 2 · bài 4
//
// KHÔNG ĐOÁN KHI GẶP MÃ LẠ. Mã không khớp khuôn thì rơi vào nhánh "Khác" và
// vẫn tick được — im lặng giấu một tờ đề đi là thầy tìm mãi không ra.

export interface DeKhoTom {
  maDe: string
  tenDe: string
  soCau: number
}

export interface NutCay {
  /** Khoá duy nhất trong cây, dùng làm key của React và để mở/đóng. */
  khoa: string
  nhan: string
  /** Nhánh con; lá thì rỗng. */
  con: NutCay[]
  /** Tờ đề của chính nút này (chỉ ở lá). */
  de: DeKhoTom | null
  /** Mọi mã đề nằm dưới nút này — để tick cả nhánh một nhát. */
  moiMaDe: string[]
  /** Tổng số câu dưới nút này. */
  tongCau: number
}

/** Các phần đọc được từ một mã đề. Phần nào không có thì rỗng. */
export interface PhanMaDe {
  dayThem: boolean
  lop: string
  chuong: string
  bai: string
  de: string
  /** Mã không đọc được theo khuôn nào. */
  la: boolean
}

export function docMaDe(maDe: string): PhanMaDe {
  const kq: PhanMaDe = { dayThem: false, lop: '', chuong: '', bai: '', de: '', la: false }
  const phan = String(maDe ?? '')
    .trim()
    .toUpperCase()
    .split('-')
    .filter(Boolean)
  if (phan.length === 0) {
    kq.la = true
    return kq
  }
  let i = 0
  if (phan[i] === 'DH') {
    kq.dayThem = true
    i++
  }
  if (/^\d{1,2}$/.test(phan[i] ?? '')) {
    kq.lop = phan[i]
    i++
  }
  for (; i < phan.length; i++) {
    const p = phan[i]
    if (/^C\d+$/.test(p)) kq.chuong = p.slice(1)
    else if (/^B\d+$/.test(p)) kq.bai = p.slice(1)
    else if (/^D\d+$/.test(p)) kq.de = p.slice(1)
    else if (p === 'ON') kq.bai = 'ON'
    else kq.la = true
  }
  if (!kq.lop && !kq.chuong && !kq.bai) kq.la = true
  return kq
}

/** TÊN BÀI hiện trên cây. Lấy từ `tenDe` vì đó là chữ thầy tự đặt; cắt phần
 * đuôi sau dấu gạch dài (thường là "— Chuyên đề bài tập dạy thêm") để nhãn
 * không dài gấp ba lần bề ngang điện thoại. */
export function tenBai(d: DeKhoTom, p: PhanMaDe): string {
  const goc = String(d.tenDe ?? '').trim()
  const cat = goc.split('—')[0].trim()
  if (cat) return cat
  if (p.bai === 'ON') return `Ôn tập chương ${p.chuong || ''}`.trim()
  if (p.bai) return `Bài ${p.bai}`
  return d.maDe
}

function nut(khoa: string, nhan: string): NutCay {
  return { khoa, nhan, con: [], de: null, moiMaDe: [], tongCau: 0 }
}

/** Gom một cây bốn tầng: lớp → chương → bài → tờ đề.
 *
 * Thứ tự: lớp giảm dần (12 trước, vì đó là lớp thầy dạy nhiều nhất), rồi chương
 * và bài TĂNG dần theo số — sắp theo chữ thì "Bài 10" đứng trước "Bài 2". */
export function dungCayKhoDe(ds: DeKhoTom[]): NutCay[] {
  const goc = new Map<string, NutCay>()

  for (const d of ds) {
    const p = docMaDe(d.maDe)
    const tenLop = p.la && !p.lop ? 'Khác' : p.dayThem ? `Lớp ${p.lop || '?'} · dạy thêm` : `Lớp ${p.lop || '?'}`
    const khoaLop = p.la && !p.lop ? 'khac' : `${p.dayThem ? 'dh' : 'ch'}-${p.lop || '?'}`
    let nLop = goc.get(khoaLop)
    if (!nLop) {
      nLop = nut(khoaLop, tenLop)
      goc.set(khoaLop, nLop)
    }

    const khoaCh = `${khoaLop}/C${p.chuong || '?'}`
    let nCh = nLop.con.find((x) => x.khoa === khoaCh)
    if (!nCh) {
      nCh = nut(khoaCh, p.chuong ? `Chương ${p.chuong}` : 'Chưa rõ chương')
      nLop.con.push(nCh)
    }

    const khoaBai = `${khoaCh}/B${p.bai || '?'}`
    let nBai = nCh.con.find((x) => x.khoa === khoaBai)
    if (!nBai) {
      nBai = nut(khoaBai, tenBai(d, p))
      nCh.con.push(nBai)
    }

    const la = nut(`${khoaBai}/${d.maDe}`, `${d.maDe} · ${d.soCau} câu`)
    la.de = d
    la.moiMaDe = [d.maDe]
    la.tongCau = d.soCau
    nBai.con.push(la)
  }

  const so = (s: string): number => {
    const m = s.match(/\d+/)
    return m ? Number(m[0]) : 9999
  }
  const xepDuoi = (n: NutCay): NutCay => {
    n.con = n.con.map(xepDuoi).sort((a, b) => so(a.nhan) - so(b.nhan) || a.nhan.localeCompare(b.nhan, 'vi'))
    n.moiMaDe = n.de ? n.moiMaDe : n.con.flatMap((x) => x.moiMaDe)
    n.tongCau = n.de ? n.tongCau : n.con.reduce((t, x) => t + x.tongCau, 0)
    return n
  }

  return [...goc.values()]
    .map(xepDuoi)
    .sort((a, b) => {
      if (a.khoa === 'khac') return 1
      if (b.khoa === 'khac') return -1
      return so(b.nhan) - so(a.nhan) || a.nhan.localeCompare(b.nhan, 'vi')
    })
}

/** Nhánh đã tick hết chưa — để ô tick cha hiện đúng ba trạng thái. */
export function trangThaiTick(n: NutCay, daChon: Set<string>): 'het' | 'mot_phan' | 'khong' {
  if (n.moiMaDe.length === 0) return 'khong'
  const co = n.moiMaDe.filter((m) => daChon.has(m)).length
  if (co === 0) return 'khong'
  return co === n.moiMaDe.length ? 'het' : 'mot_phan'
}
