// Ion quen thuoc — bang DONG. Thay bat duoc 10/09: cau "nuoc cung" hien
// `Ca2+`, `Mg2+`, `HCO3-`, `SO42-` nguyen van.
import { describe, it, expect } from 'vitest'
import { parseChemText, chuanHoaIonQuenThuoc } from '../src/lib/chem-format'

const hien = (s: string) =>
  parseChemText(s)
    .map((p) => (p.t === 'sub' ? `_${p.v}` : p.t === 'sup' ? `^${p.v}` : p.v))
    .join('')

describe('ion quen thuoc trong bang', () => {
  it('cation kim loai: so la DIEN TICH', () => {
    expect(hien('Ca2+')).toBe('Ca^2+')
    expect(hien('Mg2+')).toBe('Mg^2+')
    expect(hien('Fe3+')).toBe('Fe^3+')
    expect(hien('Cu2+')).toBe('Cu^2+')
    expect(hien('Al3+')).toBe('Al^3+')
  })
  it('anion nhieu nguyen tu: cat dung than va dien tich', () => {
    expect(hien('SO42-')).toBe('SO_4^2-')
    expect(hien('HCO3-')).toBe('HCO_3^-')
    expect(hien('CO32-')).toBe('CO_3^2-')
    expect(hien('NO3-')).toBe('NO_3^-')
    expect(hien('NH4+')).toBe('NH_4^+')
    expect(hien('Cr2O72-')).toBe('Cr_2O_7^2-')
  })
  it('dung nguyen cau cua thay', () => {
    expect(hien('Ca2+, Mg2+, HCO3-, Cl-, SO42-.')).toBe('Ca^2+, Mg^2+, HCO_3^-, Cl^-, SO_4^2-.')
  })
})

describe('KHONG duoc dong vao', () => {
  it('manh ma de khong phai ion', () => {
    for (const x of ['12-C1-B2-D1', 'C1-', 'B3-', 'C2-', 'P1+']) {
      expect(chuanHoaIonQuenThuoc(x)).toBe(x)
    }
  })
  it('ion khong co that thi giu nguyen', () => {
    for (const x of ['Cl3-', 'Br1+', 'Cs4+', 'Xe2+', 'Hg4+', 'Ge3+']) {
      expect(chuanHoaIonQuenThuoc(x)).toBe(x)
    }
  })
  it('lien ket trong cong thuc cau tao', () => {
    expect(chuanHoaIonQuenThuoc('-CO-NH-')).toBe('-CO-NH-')
    expect(chuanHoaIonQuenThuoc('CH3-CH2-OH')).toBe('CH3-CH2-OH')
  })
  it('khong an vao giua tu dai hon', () => {
    expect(chuanHoaIonQuenThuoc('XCa2+')).toBe('XCa2+')
    expect(chuanHoaIonQuenThuoc('Ca2+3')).toBe('Ca2+3')
  })
  it('cong thuc thuong van dung nhu cu', () => {
    expect(hien('H2SO4')).toBe('H_2SO_4')
    expect(hien('Na2CO3')).toBe('Na_2CO_3')
    expect(hien('1s22s22p3')).toBe('1s^22s^22p^3')
  })
})
