// LÝ DO THƯỞNG của một câu trong game v2 — câu chữ SẴN IN cho học sinh, tính từ đúng kết quả của `advance` (mốc 20/40/40).
// Dùng chung: máy chủ trả trong lệnh `answer` (`lyDoThuong`); máy khách dùng lại khi Worker cũ chưa trả trường này.
export interface LyDoThuong { moc: 0 | 1 | 2 | 3; exp: number; chu: string }
export function lyDoThuong(d: { correct: boolean; assisted: boolean; reward: number; milestone: number; stage: number }): LyDoThuong {
  const moc = (d.reward > 0 && d.milestone >= 1 && d.milestone <= 3 ? d.milestone : 0) as LyDoThuong['moc']
  if (moc === 1) return { moc, exp: d.reward, chu: `+${d.reward} EXP · lần đầu em tự làm đúng dạng này — sao thứ 1` }
  if (moc === 2) return { moc, exp: d.reward, chu: `+${d.reward} EXP · đúng lại ở một câu khác sau 1 ngày — sao thứ 2 của dạng này` }
  if (moc === 3) return { moc, exp: d.reward, chu: `+${d.reward} EXP · đúng lại sau 7 ngày — sao thứ 3, dạng này đã khắc phục xong` }
  if (d.assisted) return { moc: 0, exp: 0, chu: 'Câu có trợ giúp nên chưa tính sao — mai em tự làm lại câu cùng dạng nhé' }
  if (!d.correct) return { moc: 0, exp: 0, chu: 'Chưa đúng — dạng này hẹn em ôn lại vào ngày mai' }
  return { moc: 0, exp: 0, chu: d.stage >= 3 ? 'Đúng rồi · dạng này em đã đủ 3 sao, giữ phong độ nhé' : `Đúng rồi · sao thứ ${Math.min(3, d.stage + 1)} mở khi em làm đúng một câu KHÁC của dạng này vào ngày khác` }
}
