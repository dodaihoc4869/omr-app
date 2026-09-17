import {describe,it,expect} from 'vitest'
import {chuDeChieu} from '../src/lib/html-may-chieu'
describe('projector source line breaks',()=>{
 it('keeps author ideas on separate lines',()=>{expect(chuDeChieu('Các ý:\na) Một\r\nb) Hai<br />c) Ba').match(/<br>/g)).toHaveLength(3)})
 it('escapes executable markup and preserves chemistry subscripts',()=>{const h=chuDeChieu('H2O\n<script>alert(1)</script>');expect(h).not.toContain('<script>');expect(h).toContain('<br>');expect(h).toContain('<sub>')})
})
