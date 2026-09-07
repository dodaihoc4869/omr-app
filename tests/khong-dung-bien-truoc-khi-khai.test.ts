// CHỐT CHẶN "VÙNG CHẾT BIẾN" — dựng sau lỗi thầy gặp 06/09.
//
// LỖI ĐÃ DÍNH: khối `cauHoiBai` đọc `giayCauRef`, mà ref đó khai báo mãi dưới
// thân hàm. Khối đó CHẠY NGAY LÚC DỰNG MÀN, nên bấm Vào thi ra thẳng
// "Cannot access 'giayCauRef' before initialization" — cả ca thi đứng hình.
//
// VÌ SAO 1105 PHÉP KIỂM KHÔNG BẮT ĐƯỢC: chín tệp có nhắc `ExamTakeScreen`,
// nhưng tất cả đều ĐỌC MÃ NGUỒN DẠNG CHỮ, không tệp nào dựng màn ra chạy.
// Vùng chết biến chỉ lộ ra lúc chạy thật, mà `tsc` cũng không bắt.
//
// CÁCH CHẶN: bật luật `no-use-before-define` cho BIẾN (không cho hàm — hàm
// khai báo kiểu `function` được cẩu lên đầu nên vô hại), rồi CHỐT DANH SÁCH
// những chỗ đang vi phạm. Thêm một chỗ mới là phép kiểm này đỏ.
//
// Danh sách dưới đây là những chỗ ĐÃ RÀ TỪNG CÁI: tất cả đều nằm trong thân
// một callback (useEffect, setInterval, tay người bấm) nên tới lúc chạy thì
// biến đã khai báo xong. KHÔNG được nới danh sách này để cho mã mới chạy qua —
// thêm dòng vào đây phải kèm lý do vì sao chỗ đó an toàn.
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const GOC = resolve(__dirname, '..')

/** `tệp → tên biến` đã rà và xác nhận chỉ chạy trong callback. */
const DA_RA_SOAT: Record<string, string[]> = {
  'src/screens/ExamTakeScreen.tsx': [
    // Gọi trong useEffect và trong hàm bấm Nộp — chạy sau khi dựng xong.
    'trySend',
    'doSubmit',
    'baoThayGianLan',
    // Ref đo dấu vết, chỉ đụng trong setInterval / bộ nghe sự kiện.
    'giayCauRef',
    // `mocKhoaMotMinh`, `mocChamManCuoi`, `ghiChamMan` đã xoá 06/09 cùng luật
    // khoá suy đoán "không chạm màn" — xem `man-thi-sach.ts`.
  ],
  // Gọi trong nút bấm Đồng bộ, không phải lúc dựng màn.
  'src/screens/NganHangDeScreen.tsx': ['taiLocal'],
  // Hằng bảng tên, dùng trong thân hàm xuất ra ngoài.
  'src/lib/goi-len-bang.ts': ['TEN_MUC'],
  // `vi.hoisted()` — chính là CÁCH ĐÚNG để né bẫy này trong vitest: vitest cẩu
  // khối `hoisted` lên trên mọi `vi.mock`, nên tới lúc nhà máy giả lập chạy thì
  // `boDo` đã có giá trị. Máy soi tĩnh không biết luật cẩu riêng của vitest nên
  // vẫn kêu; đã đọc tay và xác nhận an toàn.
  'tests/cau-noi-ddh.test.ts': ['boDo'],
}

interface Nhan {
  code: string
  filename: string
  message: string
}

function viPham(): { tep: string; ten: string }[] {
  let ra = ''
  try {
    ra = execFileSync('npx', ['oxlint', '--format=json'], { cwd: GOC, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  } catch (e) {
    // oxlint trả mã thoát khác 0 khi có lỗi — vẫn in JSON ra stdout.
    ra = String((e as { stdout?: string }).stdout ?? '')
  }
  const d = (JSON.parse(ra) as { diagnostics: Nhan[] }).diagnostics ?? []
  return d
    .filter((x) => x.code.includes('no-use-before-define'))
    .map((x) => ({ tep: x.filename.replace(/\\/g, '/'), ten: (x.message.match(/'([^']+)'/) || ['', ''])[1] }))
}

describe('Không đọc biến trước khi khai báo', () => {
  it('luật đã bật trong .oxlintrc.json, và bật cho BIẾN chứ không phải hàm', async () => {
    const { readFileSync } = await import('node:fs')
    const c = JSON.parse(readFileSync(resolve(GOC, '.oxlintrc.json'), 'utf8')) as {
      rules: Record<string, unknown>
    }
    const r = c.rules['no-use-before-define'] as [string, Record<string, boolean>]
    expect(r[0]).toBe('error')
    expect(r[1].variables).toBe(true)
    // Hàm khai báo kiểu `function` được cẩu lên đầu — bật cho hàm chỉ tạo ồn.
    expect(r[1].functions).toBe(false)
  })

  it('KHÔNG có chỗ vi phạm nào ngoài danh sách đã rà soát', () => {
    const la = viPham().filter((v) => !(DA_RA_SOAT[v.tep] ?? []).includes(v.ten))
    // In ra đủ để người sửa biết phải nhìn vào đâu.
    expect(la.map((v) => `${v.tep}: ${v.ten}`)).toEqual([])
  })

  it('danh sách đã rà soát KHÔNG phình ra: mỗi tên trong đó phải thật sự còn vi phạm', () => {
    // Sửa xong một chỗ mà quên xoá khỏi danh sách thì lần sau nó lại che mất
    // một lỗi mới trùng tên. Đòi danh sách luôn khớp thực tế.
    const dang = viPham()
    const thua: string[] = []
    for (const tep of Object.keys(DA_RA_SOAT)) {
      for (const ten of DA_RA_SOAT[tep]) {
        if (!dang.some((v) => v.tep === tep && v.ten === ten)) thua.push(`${tep}: ${ten}`)
      }
    }
    expect(thua).toEqual([])
  })
})
