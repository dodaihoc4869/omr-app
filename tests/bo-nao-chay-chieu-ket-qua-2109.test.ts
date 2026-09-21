// BỘ NÃO — CUỐI LƯỢT CHIỀU PHẢI CÓ KẾT QUẢ THẬT (`scripts/bo-nao/chay-chieu.sh`, Code 1, 21/09/2026, Boss lệnh sau lượt xem trước hỏng 12:5x).
// Sự cố: `claude -p` tự kết thúc sau 600 giây chờ việc nền khi 3 trợ lý con còn viết ⇒ KHÔNG có xem-truoc.md nhưng script vẫn in "Xong lượt AI" và thoát 0.
// Nghiệm thu: không có xem-truoc.md MỚI ⇒ lỗi rõ + thoát mã ≠ 0 (không tin mã thoát của claude); tệp cũ của lần chạy trước không được tính; hôm nay không có em nào
// ⇒ thoát 0 (không phải lỗi); mã thoát ≠ 0 của claude nhưng đã ra tệp ⇒ vẫn thoát 0; lời dặn phiên AI cấm chạy trợ lý con ở chế độ nền.
// `claude` thật được thay bằng một tệp giả trong PATH — KHÔNG gọi mạng, KHÔNG gọi AI.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const NGAY = '2026-09-21'
let tam: string
beforeEach(() => {
  tam = mkdtempSync(join(tmpdir(), 'chay-chieu-'))
  // dựng cây giống gói: <tam>/scripts/bo-nao/chay-chieu.sh + <tam>/bo-nao/LOI-DAN-CHIEU.md + <tam>/bin/claude (giả)
  mkdirSync(join(tam, 'scripts', 'bo-nao'), { recursive: true })
  mkdirSync(join(tam, 'bo-nao'), { recursive: true })
  mkdirSync(join(tam, 'bin'), { recursive: true })
  copyFileSync(join(process.cwd(), 'scripts/bo-nao/chay-chieu.sh'), join(tam, 'scripts/bo-nao/chay-chieu.sh'))
  writeFileSync(join(tam, 'bo-nao/LOI-DAN-CHIEU.md'), 'lời dặn giả\n')
})
afterEach(() => rmSync(tam, { recursive: true, force: true }))

const thuMucChieu = () => join(tam, 'bo-nao', NGAY, 'chieu')
/** `claude` giả: chạy đoạn bash `than` (đã ở thư mục gốc gói), đọc-bỏ stdin, rồi thoát với `maThoat`. */
function claudeGia(than: string, maThoat = 0) {
  const p = join(tam, 'bin', 'claude')
  writeFileSync(p, `#!/bin/bash\ncat >/dev/null\n${than}\nexit ${maThoat}\n`)
  chmodSync(p, 0o755)
}
const GHI_TOM_TAT = (n: number | string) => `mkdir -p bo-nao/${NGAY}/chieu && echo '{"ngay":"${NGAY}","soEmDuocLay":${n}}' > bo-nao/${NGAY}/chieu/tom-tat.json`
const GHI_XEM_TRUOC = `echo '# xem trước' > bo-nao/${NGAY}/chieu/xem-truoc.md`
function chay(...doi: string[]) {
  const r = spawnSync('bash', ['scripts/bo-nao/chay-chieu.sh', ...doi], {
    cwd: tam,
    env: { ...process.env, PATH: `${join(tam, 'bin')}:${process.env.PATH}` },
    encoding: 'utf8',
    timeout: 60_000,
  })
  return { ma: r.status, ra: r.stdout, loi: r.stderr }
}
/** Đặt tệp có sẵn TỪ TRƯỚC (giờ sửa cuối cách đây 1 giờ) — mô phỏng tệp của lần chạy trước. */
function tepCu(rel: string, noiDung: string) {
  const p = join(tam, rel)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, noiDung)
  const truoc = new Date(Date.now() - 3_600_000)
  utimesSync(p, truoc, truoc)
}

describe('chay-chieu.sh: kiểm KẾT QUẢ THẬT cuối lượt, không tin lời "xong"', () => {
  it('claude thoát 0 nhưng KHÔNG ra gì (bị cắt sớm) ⇒ lỗi rõ, mã ≠ 0, KHÔNG in "Xong lượt AI"', () => {
    claudeGia('true', 0)
    const r = chay(NGAY)
    expect(r.ma).not.toBe(0)
    expect(r.loi).toContain('LỖI')
    expect(r.loi).toContain('tom-tat.json')
    expect(r.ra).not.toContain('Xong lượt AI')
  })
  it('đã lấy thẻ nhưng trợ lý con bị cắt ⇒ KHÔNG có xem-truoc.md ⇒ lỗi rõ nêu đúng đường dẫn, mã ≠ 0, claude thoát 0 cũng vậy', () => {
    claudeGia(GHI_TOM_TAT(60), 0)
    const r = chay(NGAY)
    expect(r.ma).not.toBe(0)
    expect(r.loi).toContain('LỖI')
    expect(r.loi).toContain(`bo-nao/${NGAY}/chieu/xem-truoc.md`)
    expect(r.loi).toContain('claude thoát mã 0')
    expect(r.ra).not.toContain('Xong lượt AI')
    expect(existsSync(join(thuMucChieu(), 'xem-truoc.md'))).toBe(false)
  })
  it('CÓ xem-truoc.md mới ⇒ thoát 0, in "Xong lượt AI" kèm đường dẫn và lệnh nộp có ngày', () => {
    claudeGia(`${GHI_TOM_TAT(60)}\n${GHI_XEM_TRUOC}`, 0)
    const r = chay(NGAY)
    expect(r.ma, r.loi).toBe(0)
    expect(r.ra).toContain('Xong lượt AI')
    expect(r.ra).toContain(`bo-nao/${NGAY}/chieu/xem-truoc.md`)
    expect(r.ra).toContain(`chay-chieu.sh --nop ${NGAY}`)
    expect(r.loi).toBe('')
  })
  it('KHÔNG tin mã thoát của claude: đã ra xem-truoc.md thì claude thoát 1 vẫn coi là xong', () => {
    claudeGia(`${GHI_TOM_TAT(7)}\n${GHI_XEM_TRUOC}`, 1)
    const r = chay(NGAY)
    expect(r.ma, r.loi).toBe(0)
    expect(r.ra).toContain('Xong lượt AI')
  })
  it('hôm nay không có em nào có tín hiệu (soEmDuocLay = 0) ⇒ thoát 0, nói rõ, không phải lỗi', () => {
    claudeGia(GHI_TOM_TAT(0), 0)
    const r = chay(NGAY)
    expect(r.ma, r.loi).toBe(0)
    expect(r.ra).toContain('không có em nào có tín hiệu')
    expect(r.ra).not.toContain('Xong lượt AI')
    expect(r.loi).toBe('')
  })
  it('TỆP CŨ của lần chạy trước không được tính: tom-tat.json + xem-truoc.md có sẵn nhưng lượt này claude không làm gì ⇒ lỗi', () => {
    tepCu(`bo-nao/${NGAY}/chieu/tom-tat.json`, `{"soEmDuocLay":60}`)
    tepCu(`bo-nao/${NGAY}/chieu/xem-truoc.md`, '# xem trước cũ')
    claudeGia('true', 0)
    const r = chay(NGAY)
    expect(r.ma).not.toBe(0)
    expect(r.loi).toContain('LỖI')
    expect(r.ra).not.toContain('Xong lượt AI')
  })
  it('tom-tat.json CŨ ghi 0 em không làm lượt này bị coi là "không có em": claude không chạy lay ⇒ vẫn là lỗi, không phải thoát êm', () => {
    tepCu(`bo-nao/${NGAY}/chieu/tom-tat.json`, `{"soEmDuocLay":0}`)
    claudeGia('true', 0)
    const r = chay(NGAY)
    expect(r.ma).not.toBe(0)
    expect(r.loi).toContain('tom-tat.json')
    expect(r.ra).not.toContain('không có em nào')
  })
  it('lấy thẻ mới nhưng xem-truoc.md là của lần trước (cũ) ⇒ lỗi: chỉ xem-truoc.md MỚI HƠN đầu lượt mới tính', () => {
    tepCu(`bo-nao/${NGAY}/chieu/xem-truoc.md`, '# xem trước cũ')
    claudeGia(GHI_TOM_TAT(60), 0)
    const r = chay(NGAY)
    expect(r.ma).not.toBe(0)
    expect(r.loi).toContain('xem-truoc.md')
  })
  it('không truyền ngày: dùng ngày hôm nay GIỜ VIỆT NAM để kiểm (`date` giả: giờ VN đã sang 22/09 khi UTC còn 21/09) — không kiểm nhầm thư mục ngày khác', () => {
    const dateGia = join(tam, 'bin', 'date')
    writeFileSync(dateGia, '#!/bin/bash\nif [ "$TZ" = "Asia/Ho_Chi_Minh" ]; then echo 2026-09-22; else echo 2026-09-21; fi\n')
    chmodSync(dateGia, 0o755)
    claudeGia(`mkdir -p bo-nao/2026-09-22/chieu && echo '{"soEmDuocLay":3}' > bo-nao/2026-09-22/chieu/tom-tat.json && echo x > bo-nao/2026-09-22/chieu/xem-truoc.md`, 0)
    const r = chay()
    expect(r.ma, r.loi).toBe(0)
    expect(r.ra).toContain('bo-nao/2026-09-22/chieu/xem-truoc.md')
    // ra ở ngày UTC (21/09) thay vì ngày VN thì KHÔNG tính
    rmSync(join(tam, 'bo-nao', '2026-09-22'), { recursive: true, force: true })
    claudeGia(`mkdir -p bo-nao/2026-09-21/chieu && echo '{"soEmDuocLay":3}' > bo-nao/2026-09-21/chieu/tom-tat.json && echo x > bo-nao/2026-09-21/chieu/xem-truoc.md`, 0)
    expect(chay().ma).not.toBe(0)
  })
  it('--nop không gọi AI và không đi qua phép kiểm này (claude giả sẽ ghi dấu nếu bị gọi)', () => {
    claudeGia('touch DA-GOI-CLAUDE', 0)
    mkdirSync(join(tam, 'scripts', 'bo-nao'), { recursive: true })
    writeFileSync(join(tam, 'scripts/bo-nao/nop.mjs'), 'process.exit(0)\n')
    const r = chay('--nop', NGAY)
    expect(r.ma, r.loi).toBe(0)
    expect(existsSync(join(tam, 'DA-GOI-CLAUDE'))).toBe(false)
  })
})

describe('lời dặn phiên AI: KHÔNG chạy trợ lý con ở chế độ nền', () => {
  const doc = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
  it('LOI-DAN-CHIEU.md, LOI-DAN-PHIEN.md và cẩm nang đều dặn: không nền, gọi cùng một lượt, CHỜ xong mới kết thúc', () => {
    for (const p of ['bo-nao/LOI-DAN-CHIEU.md', 'bo-nao/LOI-DAN-PHIEN.md']) {
      const d = doc(p)
      for (const t of ['KHÔNG chạy trợ lý con ở chế độ NỀN', '`run_in_background`', 'CHỜ mọi trợ lý trả kết quả xong', 'không kết thúc lượt khi còn trợ lý chưa xong']) expect(d, `${p} · ${t}`).toContain(t)
    }
    const cn = doc('bo-nao/HUONG-DAN-BO-NAO.md')
    for (const t of ['CÙNG MỘT lượt', 'CHỜ xong hết', 'KHÔNG chạy nền']) expect(cn, t).toContain(t)
  })
  it('chay-chieu.sh vẫn giữ trần chờ việc nền (CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS) và cú pháp bash đúng', () => {
    const sh = doc('scripts/bo-nao/chay-chieu.sh')
    expect(sh).toContain('CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS')
    const r = spawnSync('bash', ['-n', 'scripts/bo-nao/chay-chieu.sh'], { cwd: process.cwd(), encoding: 'utf8' })
    expect(r.status, r.stderr).toBe(0)
  })
})
