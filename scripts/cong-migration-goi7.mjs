// Chỉ cho một DDL chỉ-thêm trong namespace Gói 7; ngoại lệ ngoài namespace phải khớp nguyên văn.
const CHI_MUC_LUOT = 'CREATE INDEX IF NOT EXISTS game_v2_attempt_sbd_qid ON game_v2_attempt(sbd,qid,session)'
const TEN_GOI = 'goi_bai_7(?:_[a-z][a-z0-9_]*)?'
const COT = '[a-z][a-z0-9_]*'
const chiMuc = new RegExp(`^CREATE INDEX IF NOT EXISTS ${TEN_GOI} ON ${TEN_GOI}\\(${COT}(?:,${COT})*\\)$`)
const bang = new RegExp(`^CREATE TABLE IF NOT EXISTS ${TEN_GOI} \\(([a-zA-Z0-9_, ()]+)\\)$`)
const dinhNghiaCot = new RegExp(`^${COT} (?:TEXT|INTEGER|REAL)(?: NOT NULL| UNIQUE| PRIMARY KEY)*(?: CHECK\\(${COT} IN\\(0,1\\)\\))?$`)
const khoaChinh = new RegExp(`^PRIMARY KEY\\(${COT}(?:,${COT})*\\)$`)

export function chiThemGoi7(sql) {
  if (typeof sql !== 'string') return false
  if (sql === CHI_MUC_LUOT || chiMuc.test(sql)) return true
  const noiDung = bang.exec(sql)?.[1]
  if (!noiDung) return false
  // Tách định nghĩa ở dấu phẩy ngoài ngoặc: CHECK/PRIMARY KEY không phải cột mới.
  const phan = []
  let sau = 0, dau = 0
  for (let i = 0; i < noiDung.length; i++) {
    const c = noiDung[i]
    if (c === '(') sau++
    if (c === ')' && --sau < 0) return false
    if (c === ',' && sau === 0) {
      phan.push(noiDung.slice(dau, i))
      dau = i + 1
    }
  }
  if (sau !== 0) return false
  phan.push(noiDung.slice(dau))
  return phan.every(p => dinhNghiaCot.test(p) || khoaChinh.test(p))
}
