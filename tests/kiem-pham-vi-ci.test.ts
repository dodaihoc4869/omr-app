// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'

const workflow = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8')
// Chạy đúng khối shell trong workflow, không viết lại phép phân loại trong test.
const shell = workflow.split('      - name: Xác định thay đổi mã chạy')[1].split('\n      - ')[0].split('        run: |\n')[1].split('\n').map(l=>l.replace(/^ {10}/,'')).join('\n')
const dirs: string[] = []
afterEach(()=>{ for(const d of dirs.splice(0)) rmSync(d,{recursive:true,force:true}) })
function lap(change: string, event = 'push', missing = false) {
  const dir = mkdtempSync(join(tmpdir(),'chua-ci-')); dirs.push(dir)
  const git = (args: string[]) => execFileSync('/usr/bin/git',args,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()
  git(['init','-b','main'])
  const ghi = (file: string, text: string) => {mkdirSync(dirname(join(dir,file)),{recursive:true});writeFileSync(join(dir,file),text)}
  ghi('src/a.ts','export const a = 1\n')
  git(['add','--','src/a.ts']); git(['-c','user.name=CI','-c','user.email=ci@example.invalid','commit','-m','moc'])
  const before = git(['rev-parse','HEAD'])
  ghi(change,'doi\n'); git(['add','--',change]); git(['-c','user.name=CI','-c','user.email=ci@example.invalid','commit','-m','doi'])
  git(['remote','add','origin',missing?join(dir,'khong-co-repo'):dir])
  const bin = join(dir,'bin'); mkdirSync(bin); symlinkSync('/usr/bin/git',join(bin,'git'))
  const output = join(dir,'output')
  // PATH chỉ có git: runner hoàn toàn không có rg/grep mà vẫn phân loại đúng.
  execFileSync('/bin/bash',['--noprofile','--norc','-e','-c',shell.replaceAll('/tmp/chua-ma-doi.txt','"$CHUA_TEST_DIFF"')],{cwd:dir,env:{...process.env,PATH:bin,MOC_TRUOC:before,SU_KIEN:event,GITHUB_OUTPUT:output,CHUA_TEST_DIFF:join(dir,'diff.txt')},stdio:['ignore','pipe','pipe']})
  return readFileSync(output,'utf8').trim()
}
describe('Cổng CI hoạt động khi runner không có rg',()=>{
  it.each(['server/x.ts','src/a.ts','public/a.json','.github/workflows/deploy.yml'])('đổi %s phải chạy toàn repo',file=>{
    expect(lap(file)).toBe('toan-bo=true')
  })
  it('chỉ đổi tài liệu có thể dùng bộ liên quan',()=>{
    expect(lap('docs/a.md')).toBe('toan-bo=false')
  })
  it('không đọc được mốc đối chiếu thì vẫn chạy toàn bộ',()=>{
    expect(lap('docs/a.md','push',true)).toBe('toan-bo=true')
  })
  it('workflow_dispatch không có đợt push đối chiếu thì chạy toàn bộ',()=>{
    expect(lap('docs/a.md','workflow_dispatch')).toBe('toan-bo=true')
  })
})
