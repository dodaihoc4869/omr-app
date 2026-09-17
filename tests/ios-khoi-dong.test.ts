import {describe,it,expect,vi} from 'vitest'
import {readFileSync} from 'node:fs'
import {chuanHoaIonQuenThuoc} from '../src/lib/chem-format'
describe('khởi động Safari cũ',()=>{
 it('nạp bộ công thức khi runtime từ chối RegExp lookbehind',async()=>{
  const Native=RegExp
  const Limited=new Proxy(Native,{construct(target,args){if(String(args[0]).includes('(?<'))throw new SyntaxError('Invalid regular expression: invalid group specifier name');return Reflect.construct(target,args)}})
  vi.resetModules();vi.stubGlobal('RegExp',Limited)
  try{const mod=await import('../src/lib/chem-format');expect(mod.chuanHoaIonQuenThuoc('Fe3+ và SO42-')).toBe('Fe^{3+} và SO_{4}^{2-}')}finally{vi.unstubAllGlobals()}
 })
 it('giữ ranh giới, dấu và chuỗi ion liên tiếp',()=>{
  expect(chuanHoaIonQuenThuoc('Fe3+,Cu2+; NH4+ / SO42-')).toBe('Fe^{3+},Cu^{2+}; NH_{4}^{+} / SO_{4}^{2-}')
  expect(chuanHoaIonQuenThuoc('xFe3+ 2Fe3+ Fe3++')).toBe('xFe3+ 2Fe3+ Fe3++')
 })
 it('máy chậm không tự xóa kho lưu và không ép tải lại sau timeout',()=>{
  const html=readFileSync('index.html','utf8');expect(html).not.toContain('caches.delete(');expect(html).not.toContain('.unregister(');expect(html).toContain("window.addEventListener('unhandledrejection'");expect(html).toContain('u.pathname + u.search + u.hash')
 })
})
