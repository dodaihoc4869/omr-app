// PHÁT HIỆN GIAN LẬN BÀI TẬP VỀ NHÀ (BTVN)
// Áp dụng phương pháp phân tích bất thường năng lực (Aberrant Capability Discrepancy)
// và phân tích thông đồng / trùng lặp đáp án (Psychometric Collusion & Error Concordance).
// Dữ liệu ca thi có giám sát là căn cứ đối chiếu tin tưởng nhất (Ground Truth Baseline).

export interface ThongTinHocSinhBtvn {
  sbd: string
  hoTen: string
  nopLuc: string | null
  soDung: number | null
  soCau: number | null
  thuHoi: boolean
  dap_an_json?: string | null
}

export interface KetQuaKiemTraGianLan {
  sbd: string
  gianLan: boolean
  xacSuatGianLan: number // 0 - 100
  lyDoGianLan: string
  diemThiDoiChieu: number | null
  chiTietDoiChieu: {
    diemThiTB: number | null
    diemThiMax: number | null
    soCaThi: number
    diemBtvnQuyDoi: number | null
    doLechNangLuc: number | null
    trungLapVoi: string | null
    tiLeTrungLap: number | null
    trungLoiSai: number | null
    khoangCachPhut: number | null
    soLanRoiManThi: number
  }
}

export interface ThiThatBaseline {
  sbd: string
  diemTB: number
  diemMax: number
  soCa: number
  tongRoiMan: number
}

function parseAnswers(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {}
  try {
    const obj = JSON.parse(raw)
    if (typeof obj !== 'object' || obj === null) return {}
    const res: Record<string, string> = {}
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') res[k] = v.trim()
      else if (typeof v === 'number') res[k] = String(v).trim()
    }
    return res
  } catch {
    return {}
  }
}

function normalizeAnswerValue(val: string): string {
  return val.replace(/\s+/g, '').replace(',', '.').toLowerCase()
}

/**
 * Tính điểm trùng lặp đáp án và khoảng cách thời gian giữa 2 học sinh
 */
function tinhTrungLapCap(
  a: ThongTinHocSinhBtvn,
  b: ThongTinHocSinhBtvn
): {
  tiLe: number
  soCauChung: number
  soCauGiong: number
  soCauPhan3Giong: number
  khoangCachPhut: number
} {
  const ansA = parseAnswers(a.dap_an_json)
  const ansB = parseAnswers(b.dap_an_json)

  const keysA = Object.keys(ansA)
  if (keysA.length === 0) return { tiLe: 0, soCauChung: 0, soCauGiong: 0, soCauPhan3Giong: 0, khoangCachPhut: 9999 }

  let soCauChung = 0
  let diemGiongTrongSo = 0
  let tongTrongSo = 0
  let soCauGiong = 0
  let soCauPhan3Giong = 0

  for (const qid of keysA) {
    if (qid in ansB) {
      soCauChung++
      const va = normalizeAnswerValue(ansA[qid] || '')
      const vb = normalizeAnswerValue(ansB[qid] || '')

      const isPhan3 = qid.includes('-III-') || /^\d+(\.\d+)?$/.test(va)
      const isPhan2 = qid.includes('-II-')
      const weight = isPhan3 ? 2.5 : isPhan2 ? 1.5 : 1.0

      tongTrongSo += weight

      if (va && vb && va === vb) {
        soCauGiong++
        diemGiongTrongSo += weight
        if (isPhan3) soCauPhan3Giong++
      }
    }
  }

  const tiLe = tongTrongSo > 0 ? Math.round((diemGiongTrongSo / tongTrongSo) * 100) : 0

  let khoangCachPhut = 9999
  if (a.nopLuc && b.nopLuc) {
    const tA = Date.parse(a.nopLuc)
    const tB = Date.parse(b.nopLuc)
    if (!isNaN(tA) && !isNaN(tB)) {
      khoangCachPhut = Math.round(Math.abs(tA - tB) / (1000 * 60) * 10) / 10
    }
  }

  return { tiLe, soCauChung, soCauGiong, soCauPhan3Giong, khoangCachPhut }
}

/**
 * Thuật toán tính xác suất gian lận cho danh sách học sinh nộp BTVN
 * @param dsEm Danh sách học sinh trong ca BTVN
 * @param mapThiThat Bản đồ dữ liệu ca thi có giám sát (SBD -> { diemTB, diemMax, soCa, tongRoiMan })
 */
export function phanTichGianLanBtvn(
  dsEm: ThongTinHocSinhBtvn[],
  mapThiThat: Map<string, ThiThatBaseline>
): Map<string, KetQuaKiemTraGianLan> {
  const ketQua = new Map<string, KetQuaKiemTraGianLan>()

  // Lọc danh sách học sinh đã nộp bài
  const daNop = dsEm.filter((e) => !e.thuHoi && e.nopLuc && e.soCau && e.soCau > 0)

  // 1. Phân tích tương quan cặp (Pairwise Collusion) giữa các học sinh cùng nộp BTVN
  const collusionMap = new Map<
    string,
    {
      maxRate: number
      targetSbd: string
      targetHoTen: string
      khoangCachPhut: number
      soPhan3Giong: number
      soCauChung: number
    }
  >()

  for (let i = 0; i < daNop.length; i++) {
    for (let j = i + 1; j < daNop.length; j++) {
      const emA = daNop[i]
      const emB = daNop[j]

      const { tiLe, soCauChung, soCauPhan3Giong, khoangCachPhut } = tinhTrungLapCap(emA, emB)

      if (soCauChung >= 6 && tiLe >= 65) {
        const curA = collusionMap.get(emA.sbd)
        if (!curA || tiLe > curA.maxRate) {
          collusionMap.set(emA.sbd, {
            maxRate: tiLe,
            targetSbd: emB.sbd,
            targetHoTen: emB.hoTen,
            khoangCachPhut,
            soPhan3Giong: soCauPhan3Giong,
            soCauChung,
          })
        }

        const curB = collusionMap.get(emB.sbd)
        if (!curB || tiLe > curB.maxRate) {
          collusionMap.set(emB.sbd, {
            maxRate: tiLe,
            targetSbd: emA.sbd,
            targetHoTen: emA.hoTen,
            khoangCachPhut,
            soPhan3Giong: soCauPhan3Giong,
            soCauChung,
          })
        }
      }
    }
  }

  // 2. Tính điểm bất thường cho từng học sinh
  for (const em of dsEm) {
    if (em.thuHoi || !em.nopLuc || !em.soCau || em.soCau === 0) {
      ketQua.set(em.sbd, {
        sbd: em.sbd,
        gianLan: false,
        xacSuatGianLan: 0,
        lyDoGianLan: '',
        diemThiDoiChieu: null,
        chiTietDoiChieu: {
          diemThiTB: null,
          diemThiMax: null,
          soCaThi: 0,
          diemBtvnQuyDoi: null,
          doLechNangLuc: null,
          trungLapVoi: null,
          tiLeTrungLap: null,
          trungLoiSai: null,
          khoangCachPhut: null,
          soLanRoiManThi: 0,
        },
      })
      continue
    }

    const baseline = mapThiThat.get(em.sbd)
    const diemBtvn = Math.round(((em.soDung || 0) / em.soCau) * 10 * 100) / 100

    let diemThiChuan: number | null = null
    let doLechNangLuc: number | null = null
    let diemDisc = 0 // Điểm bất thường từ độ lệch ca thi (0 - 100)

    if (baseline && baseline.soCa > 0) {
      // Benchmark là max(diemTB, diemMax - 0.5)
      diemThiChuan = Math.round(Math.max(baseline.diemTB, baseline.diemMax - 0.5) * 100) / 100
      doLechNangLuc = Math.round((diemBtvn - diemThiChuan) * 100) / 100

      // Nếu thi thật đã rất giỏi (>= 8.5) thì điểm BTVN cao là bình thường
      if (diemThiChuan < 8.5) {
        if (doLechNangLuc >= 3.5) {
          diemDisc = Math.min(98, 90 + Math.round((doLechNangLuc - 3.5) * 6))
        } else if (doLechNangLuc >= 2.0) {
          diemDisc = 65 + Math.round((doLechNangLuc - 2.0) * 16)
        } else if (doLechNangLuc >= 1.2) {
          diemDisc = 30 + Math.round((doLechNangLuc - 1.2) * 40)
        }
      }
    }

    // Điểm collusion
    let diemCollusion = 0
    const col = collusionMap.get(em.sbd)
    if (col && col.maxRate >= 70) {
      if (col.maxRate >= 85) {
        if (col.khoangCachPhut <= 10) {
          diemCollusion = Math.min(99, 90 + Math.round((col.maxRate - 85) * 0.6) + (col.soPhan3Giong >= 4 ? 4 : 0))
        } else if (col.khoangCachPhut <= 30) {
          diemCollusion = 82 + Math.round((col.maxRate - 85) * 0.5)
        } else {
          diemCollusion = 75 + Math.round((col.maxRate - 85) * 0.4)
        }
      } else if (col.maxRate >= 75) {
        if (col.khoangCachPhut <= 10) diemCollusion = 78
        else if (col.khoangCachPhut <= 30) diemCollusion = 70
        else diemCollusion = 62
      } else {
        diemCollusion = col.khoangCachPhut <= 15 ? 65 : 50
      }
    }

    // Ảnh hưởng rời màn hình trong ca thi có giám sát
    let heSoRoiMan = 0
    if (baseline && baseline.tongRoiMan >= 3 && (diemDisc >= 40 || diemCollusion >= 50)) {
      heSoRoiMan = Math.min(10, baseline.tongRoiMan * 2)
    }

    // Tổng hợp xác suất gian lận
    let xacSuat = 0
    if (diemCollusion >= 70) {
      if (diemDisc >= 50) {
        xacSuat = Math.min(99, Math.max(diemCollusion, diemDisc) + 4 + heSoRoiMan)
      } else {
        xacSuat = Math.min(99, diemCollusion + heSoRoiMan)
      }
    } else if (diemDisc >= 70) {
      xacSuat = Math.min(99, diemDisc + (diemCollusion >= 50 ? 5 : 0) + heSoRoiMan)
    } else {
      xacSuat = Math.round(diemDisc * 0.55 + diemCollusion * 0.45)
    }

    // Xác định cờ gian lận (ngưỡng >= 70%)
    const gianLan = xacSuat >= 70

    // Tạo lý do đối chiếu chi tiết, rõ ràng và thuyết phục cho giáo viên
    const cacLyDo: string[] = []
    if (diemThiChuan !== null && doLechNangLuc !== null && doLechNangLuc >= 1.2) {
      cacLyDo.push(
        `Lệch ca thi: Thi thật ${diemThiChuan.toFixed(1)}đ vs BTVN ${diemBtvn.toFixed(1)}đ (+${doLechNangLuc.toFixed(1)}đ)`
      )
    }

    if (col && col.maxRate >= 70) {
      const tenDoiTac = col.targetHoTen || `SBD ${col.targetSbd}`
      const phutStr = col.khoangCachPhut <= 120 ? `nộp cách ${col.khoangCachPhut}p` : ''
      const phan3Str = col.soPhan3Giong > 0 ? `trùng ${col.soPhan3Giong} câu số` : ''
      const sub = [phutStr, phan3Str].filter(Boolean).join(' · ')
      cacLyDo.push(`Khớp ${col.maxRate}% đáp án với ${tenDoiTac} (${col.targetSbd})${sub ? ` (${sub})` : ''}`)
    }

    if (baseline && baseline.tongRoiMan >= 3 && xacSuat >= 60) {
      cacLyDo.push(`Từng rời màn hình ${baseline.tongRoiMan} lần trong các ca thi thật`)
    }

    const lyDoGianLan = cacLyDo.length > 0 ? cacLyDo.join(' · ') : (xacSuat >= 50 ? 'Có dấu hiệu bất thường về kết quả nộp bài' : 'Bình thường')

    ketQua.set(em.sbd, {
      sbd: em.sbd,
      gianLan,
      xacSuatGianLan: xacSuat,
      lyDoGianLan,
      diemThiDoiChieu: diemThiChuan,
      chiTietDoiChieu: {
        diemThiTB: baseline ? Math.round(baseline.diemTB * 100) / 100 : null,
        diemThiMax: baseline ? Math.round(baseline.diemMax * 100) / 100 : null,
        soCaThi: baseline ? baseline.soCa : 0,
        diemBtvnQuyDoi: diemBtvn,
        doLechNangLuc,
        trungLapVoi: col ? col.targetSbd : null,
        tiLeTrungLap: col ? col.maxRate : null,
        trungLoiSai: null,
        khoangCachPhut: col ? col.khoangCachPhut : null,
        soLanRoiManThi: baseline ? baseline.tongRoiMan : 0,
      },
    })
  }

  return ketQua
}
