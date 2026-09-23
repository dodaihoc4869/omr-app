// Read-only audit of pure production functions; no D1/R2, credentials, or real students.
// Run from the repository: node scripts/kiem-toan-ca-nhan-hoa-2309.mjs
import { createServer } from 'vite'
import assert from 'node:assert/strict'
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = fileURLToPath(new URL('../', import.meta.url))
const server = await createServer({ root, configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const load = (path) => server.ssrLoadModule('/' + path)
  const [plan, game, profile, transition, parent, shields, levels, daily] = await Promise.all([
    load('server/src/ke-hoach-ngay.ts'), load('src/game/than-thu-v2/core.ts'),
    load('server/src/ho-so-nam-kt.ts'), load('server/src/exp-chuyen-trang-thai.ts'),
    load('server/src/parent-news-chon-cau.ts'), load('server/src/exp-ho-so-game.ts'),
    load('src/game/than-thu-hoa-hoc/kinh-nghiem.ts'), load('src/lib/dat-nhiem-vu-ngay.ts'),
  ])
  const now = Date.parse('2026-09-23T05:00:00Z')
  const D = 86400000, date = (n) => new Date(now + n * D).toISOString().slice(0, 10)
  const base = { sbd: 'SYNTHETIC', now, homNay: date(0), phutNgay: 10, mauGiay: Array(5).fill(240), btvn: [], mom: [], cauToiHan: [], soCauChuaKhacPhuc: 0, dang: [], nhiemVuThanThu: [], caSapToi: [], lichSu: [], daLamHomNay: { soCau: 0, lenBac: 0, tutBac: 0 }, homNayLaNgayNghi: false }
  const findings = []
  const budget = plan.tinhNganSach(base, 0)
  findings.push({ id: 'A01', case: '10 minutes, observed 240 seconds/question', targetQuestions: budget.mucTieuCau, targetMinutes: budget.mucTieuCau * budget.vanTocGiay / 60, minimumMinutes: budget.toiThieuCau * budget.vanTocGiay / 60 })
  assert.equal(budget.mucTieuCau, 8)

  const q = { qid: 'Q', group: 'G', maDe: 'SYNTHETIC', version: '1', phan: 'I', text: 'Synthetic', choices: ['A','B','C','D'], ideas: [], hinhAnh: [], dang: 'D', tenDang: 'D', mucDo: 'biet', sao: 0, kienThuc: ['K'], correct: 'A', reviewed: true, solution: '' }
  const ev = [{ qid: 'seed', group: 'seed', dang: 'D', mucDo: 'biet', kienThuc: ['K'], wrong: false, date: date(-20), ca: 'synthetic' }]
  const attempt = (i, correct, qid = 'Q') => ({ id: String(i), session: String(i), qid, group: qid === 'Q' ? 'G' : qid, dang: 'D', mucDo: 'biet', correct, assisted: false, novel: true, at: now + i * D })
  const history = [attempt(-10, false), attempt(-9, false), attempt(-8, false), attempt(-4, true)]
  const opt = { loai: 'khoi_dong', cap: 1, now, soCau: 1, dueQids: new Set(['Q']) }
  const withThree = game.chooseLuotMoi([q], ev, history, [], opt).length
  const withTwo = game.chooseLuotMoi([q], ev, history.slice(1), [], opt).length
  assert.equal(withThree, 0); assert.equal(withTwo, 1)
  findings.push({ id: 'A02', case: 'Recovered question is due; three historic errors versus two', selectedWithThreeErrors: withThree, selectedWithTwoErrors: withTwo })

  const event = (qid, n, correct, i = 0) => ({ khoa: `${qid}|${n}|${i}`, sbd: 'SYNTHETIC', qid, nguon: 'btvn', ketQua: correct, giay: 90, luc: new Date(now + n * D + i * 1000).toISOString(), ngayVn: date(n), maDang: 'D', chuyenDe: 'CD' })
  const four = Array.from({length: 4}, (_, i) => event('Q'+i, 0, 1, i))
  const academic = profile.phatLaiSuKien(four).dang[0].bac
  const gameLevel = game.targetLevel('D', four.map(e => ({ qid: e.qid, group: e.qid, dang: 'D', mucDo: 'biet', kienThuc: ['K'], wrong: false, date: e.luc, ca: 'synthetic-btvn' })), [])
  assert.equal(academic, 2); assert.equal(gameLevel, 0)
  findings.push({ id: 'A03', case: 'Four distinct correct easy questions; same academic day', academicLevel: academic, gameLevel })

  const tra = { dang: new Map(), chuyenDe: new Map() }
  const repeated = [event('Q', -20, 0), event('Q', -1, 1), event('Q', 0, 1)]
  const yesterday = transition.chuyenTrangThaiTrongNgay(repeated, tra, date(-1), null).lenBac
  const today = transition.chuyenTrangThaiTrongNgay(repeated, tra, date(0), null).lenBac
  assert.deepEqual(yesterday, ['Q']); assert.deepEqual(today, ['Q'])
  findings.push({ id: 'A04', case: 'One old error, correct on two following days', promotionYesterday: yesterday, promotionToday: today, expPerPromotion: 6 })

  const picked = parent.chonCauChoPhuHuynh({ soCan: 1, seed: 1, ungVien: [{ qid: 'H', dang: 'D', mucDo: 'hieu', group: 'H' }], toiHan: [], dangYeu: [{ maDang: 'D', bac: 0 }], dangDaHoc: new Set(['D']), suKienGanDay: new Set() })
  assert.deepEqual(picked, [{ qid: 'H', nguon: 'bu_kho' }])
  findings.push({ id: 'A05', case: 'Parent selector, weak skill at level 0; only level 1 fallback exists', picked })

  const p = { cap: 10, luatCap: 3, exp: 0, wallet: 700, earned: 700, shields: { used: 0 }, expMoi: { daCong: 700, manhDaTinh: 21, ngayDat: 21 }, khienRen: { manh: 21, daRen: 0 } }
  const before = shields.khienConLai(p)
  shields.renKhienBangExp(p, 0)
  const after = shields.khienConLai(p)
  assert.equal(before, 1); assert.equal(after, 2)
  findings.push({ id: 'A06', case: 'Day 21, level 10, 21 fragments, wallet 700', beforeForge: before, afterForge: after, walletAfter: p.wallet })

  const task = plan.lapKeHoachNgay({ ...base, mauGiay: Array(5).fill(75), mom: [{ id: 'M', soCau: 4, taoLuc: new Date(now-3600000).toISOString(), batDauLuc: new Date(now-1000).toISOString() }], dang: [{ sbd: 'SYNTHETIC', maDang: 'D', soGap: 6, soSai: 5, soDaKhacPhuc: 1, soMoiSai: 3, soChuaThaySai: 0, bac: 0, mocOnKe: date(-1), mocMoiSai: date(-1) }], cauToiHan: Array.from({length: 3}, (_, i) => ({ qid: 'due'+i, maDang: 'D', mocOnKe: date(-1), lanSai: 1 })) })
  const taskTotal = task.viec.reduce((sum, v) => sum + v.soCau, 0)
  assert.ok(taskTotal > task.nganSach.mucTieuCau)
  findings.push({ id: 'A07', case: 'Four mandatory questions, three due reviews, six-question optional game', budget: task.nganSach.mucTieuCau, displayedQuestions: taskTotal, tasks: task.viec.map(v => ({ type: v.loai, count: v.soCau, required: v.batBuoc })) })

  const dailyResult = daily.thieuDat({ daLam: 8, lenBac: 0, toiThieu: 4, treNhip: false, soCauToiHan: 1, ngayVn: date(0), soCauDungHomNay: 8 })
  assert.deepEqual(dailyResult, ['chua_len_bac'])
  findings.push({ id: 'A08', case: 'Eight correct answers, due item has never been wrong; maintenance recall is not lenBac', missing: dailyResult })

  // Hypothetical NEW economy, not implementation: 220 total core XP/day,
  // optional XP up to 120, absorption <=200, shared 21-fragment issuance.
  // No purchases, no opening balance, no legacy grants; weekends off in one case.
  function simulate(name, optionalXP, weekdaysOnly = false) {
    let wallet = 0, absorbed = 0, active = 0, fragments = 0, shieldsOwned = 0, level10Day = null
    const grants = [], checkpoints = []
    for (let calendarDay = 1; calendarDay <= 70; calendarDay++) {
      if (weekdaysOnly && (calendarDay-1)%7 >= 5) continue
      active++; fragments++; wallet += 220 + optionalXP
      const take = Math.min(200, wallet); wallet -= take; absorbed += take
      if (level10Day === null && absorbed >= levels.tongExpToiCap(10)) level10Day = calendarDay
      if (fragments >= 21 && absorbed >= levels.tongExpToiCap(10) && shieldsOwned < 5) {
        const cost = shieldsOwned === 0 ? 0 : 300
        if (wallet - cost >= 400 || cost === 0) {
          fragments -= 21; wallet -= cost; shieldsOwned++
          grants.push({ calendarDay, activeDay: active, cost })
        }
      }
      if ([12,21,42].includes(active)) checkpoints.push({ activeDay: active, calendarDay, wallet, absorbed, shieldsOwned, fragments })
    }
    assert.ok(level10Day >= 12); assert.ok(grants[0].activeDay >= 21)
    for (let i = 1; i < grants.length; i++) assert.ok(grants[i].activeDay-grants[i-1].activeDay >= 21)
    return { name, dailyXP: 220 + optionalXP, level10CalendarDay: level10Day, grants, checkpoints }
  }
  const proposedCurve = Array.from({length: 119}, (_, i) => i < 9 ? levels.thanhExp(i+1) : 10*Math.round((450 + 3.5*(i+1-10))/10))
  const proposedTotal = proposedCurve.reduce((a,b) => a+b,0)
  assert.equal(proposedCurve.slice(0,9).reduce((a,b) => a+b,0), 2400)
  assert.ok(proposedCurve.every((v,i) => i === 0 || v >= proposedCurve[i-1]))
  const result = { scope: 'Pure-function synthetic audit and hypothetical economy only; no production data or writes.', sourceCommit: execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), findings, currentLevelCurve: { xpTo10: levels.tongExpToiCap(10), earliestActiveDaysAt200: Math.ceil(levels.tongExpToiCap(10)/200), xpTo120: levels.tongExpToiCap(120) }, optionalProposedLevelCurve: { formulaFromLevel10: '10 * round((450 + 3.5 * (level - 10)) / 10)', xpTo120: proposedTotal, earliestActiveDaysAt200: Math.ceil(proposedTotal/200), costLevel10: proposedCurve[9], costLevel119: proposedCurve[118] }, proposedEconomy: [simulate('Core daily', 0), simulate('Core plus 40 meaningful optional XP daily', 40), simulate('Core five days/week starting Monday', 0, true)] }
  const dir = new URL('../docs/kiem-toan-ca-nhan-hoa-2309/', import.meta.url)
  await mkdir(dir, { recursive: true })
  await writeFile(new URL('bang-chung-va-mo-phong.json', dir), JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result, null, 2))
} finally {
  await server.close()
}
