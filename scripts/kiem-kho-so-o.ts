// KIỂM KHO: câu Phần III đáp số DÀI HƠN 4 Ô PHIẾU (sửa lỗi 15/10 "10000 chỉ nhập được 1000"). CHỈ ĐỌC D1, không ghi gì.
// In danh sách để thầy sửa đề về chuẩn 4 ô nếu muốn: (1) câu cần hơn 4 ô (máy chủ đã gửi kèm số ô, em gõ đủ được); (2) câu "phần III" số mà
// bàn phím số không gõ được trong TRAN_O ô ⇒ đang bị chặn khỏi kênh nhập số (luật chung `laCauTuLuan`). Câu tự luận gắn nhầm phần III chỉ đếm.
// Chạy:  npm run kiem:kho-so-o            (gọi `wrangler d1 execute omr --remote`, cần đăng nhập wrangler)
//        npm run kiem:kho-so-o -- --tep ket-qua-wrangler.json   (đọc tệp JSON `wrangler d1 execute --json` có sẵn, không gọi mạng)
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { lyDoTuLuan } from '../src/lib/cau-tu-luan'
import { SO_O_PHIEU, TRAN_O, dapSoGoPhim, soOPhanIII } from '../src/lib/so-o-tra-loi-ngan'

const SQL = "SELECT ma_de, qid, json_extract(json,'$.correct') AS c, json_extract(json,'$.tuLuan') AS tl FROM game_v2_question WHERE json_extract(json,'$.phan')='III' ORDER BY ma_de, qid"
type Dong = { ma_de: string; qid: string; c: string | null; tl: number | null }

function docDong(): Dong[] {
  const i = process.argv.indexOf('--tep')
  const raw = i > 0 && process.argv[i + 1]
    ? readFileSync(resolve(process.argv[i + 1]!), 'utf8')
    : execFileSync('npx', ['-y', 'wrangler@latest', 'd1', 'execute', 'omr', '--remote', '--json', '--command', SQL], { cwd: resolve(process.cwd(), 'server'), encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'inherit'] })
  const j = JSON.parse(raw) as { results?: Dong[] }[]
  return j.flatMap((x) => x.results ?? [])
}

const dong = docDong()
const canHon4: string[] = [], chan: string[] = []
let tuLuan = 0, vao = 0
for (const x of dong) {
  const c = String(x.c ?? '')
  const ly = lyDoTuLuan({ qid: x.qid, maDe: x.ma_de, phan: 'III', correct: c, ...(x.tl ? { tuLuan: true } : {}) })
  const soO = soOPhanIII(c)
  if (ly) {
    if (ly.startsWith('phần III đáp số không nhập được')) chan.push(`${x.qid}\t${x.ma_de}\t${JSON.stringify(c)}\tgõ ${JSON.stringify(dapSoGoPhim(c))}`)
    else tuLuan++
    continue
  }
  vao++
  if (soO !== null && soO > SO_O_PHIEU) canHon4.push(`${x.qid}\t${x.ma_de}\t${JSON.stringify(c)}\tgõ ${dapSoGoPhim(c)}\t${soO} ô`)
}
console.log(`Kho Phần III: ${dong.length} câu · vào kênh nhập số ${vao} · tự luận/đáp án chữ (không vào kênh số) ${tuLuan} · chặn vì cần hơn ${TRAN_O} ô ${chan.length}`)
console.log(`\n(1) Câu cần HƠN ${SO_O_PHIEU} Ô (${canHon4.length}) — app đã cho đủ ô; thầy sửa đề về 4 ô nếu muốn đúng phiếu:`)
console.log(canHon4.join('\n') || '  (không có)')
console.log(`\n(2) Câu bị CHẶN khỏi kênh nhập số (${chan.length}):`)
console.log(chan.join('\n') || '  (không có)')
