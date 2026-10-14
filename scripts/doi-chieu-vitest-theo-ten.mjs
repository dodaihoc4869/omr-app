// Đối chiếu theo tệp + tên đầy đủ; đếm cả tên trùng, không lấy tổng số đỏ thay cho so lỗi.
import fs from 'node:fs'
const [basePath, headPath, outputPath, baseCommit, sourceCommit] = process.argv.slice(2)
if (!basePath || !headPath || !outputPath) throw new Error('Cần JSON nền, JSON nhánh, tệp kết quả và tùy chọn hai mã commit.')
const base = JSON.parse(fs.readFileSync(basePath, 'utf8')), head = JSON.parse(fs.readFileSync(headPath, 'utf8'))
const file = path => path.replaceAll('\\', '/').replace(/^.*?\/tests\//, 'tests/')
const cases = report => {
  const map = new Map()
  for (const row of report.testResults) for (const test of row.assertionResults) {
    const key = `${file(row.name)}\n${test.fullName}`
    const item = map.get(key) ?? { file: file(row.name), name: test.fullName, total: 0, failed: 0, pending: 0 }
    item.total++; if (test.status === 'failed') item.failed++
    if (['pending', 'todo', 'skipped'].includes(test.status)) item.pending++
    map.set(key, item)
  }
  return map
}
const failedFiles = report => report.testResults.filter(row => row.status === 'failed').map(row => file(row.name))
const emptyFailed = report => report.testResults.filter(row => row.status === 'failed' && !row.assertionResults.length).map(row => file(row.name))
const summary = report => ({ passed: report.numPassedTests, failed: report.numFailedTests, pending: report.numPendingTests, files: report.testResults.length, failedFiles: failedFiles(report).length, emptyFailedSuites: emptyFailed(report).length })
const old = cases(base), now = cases(head), oldFiles = new Set(failedFiles(base)), oldEmpty = new Set(emptyFailed(base))
const result = {
  baseCommit, sourceCommit, base: summary(base), head: summary(head),
  newFailedTests: [...now].filter(([key, test]) => test.failed > (old.get(key)?.failed ?? 0)).map(([key, test]) => ({ ...test, baseFailed: old.get(key)?.failed ?? 0 })),
  newFailedFiles: failedFiles(head).filter(path => !oldFiles.has(path)),
  newEmptyFailedSuites: emptyFailed(head).filter(path => !oldEmpty.has(path)),
  newSkippedTests: [...now].filter(([key, test]) => test.pending > (old.get(key)?.pending ?? 0)).map(([, test]) => test),
  removedTests: [...old].filter(([key, test]) => test.total > (now.get(key)?.total ?? 0)).map(([key, test]) => ({ file: test.file, name: test.name, count: test.total - (now.get(key)?.total ?? 0) })),
}
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ base: result.base, head: result.head, newFailed: result.newFailedTests.length, newFailedFiles: result.newFailedFiles.length, newEmptyFailedSuites: result.newEmptyFailedSuites.length, newSkipped: result.newSkippedTests.length }))
if (result.newFailedTests.length || result.newFailedFiles.length || result.newEmptyFailedSuites.length || result.newSkippedTests.length) process.exitCode = 1
