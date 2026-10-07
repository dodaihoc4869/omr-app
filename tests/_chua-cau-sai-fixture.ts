import type { Env } from '../server/src/kieu'
import type { HocLieuChua, ProbeRef } from '../server/src/chua-cau-sai-kieu'
import { gameToken } from '../server/src/game-v2-auth'
export const Q = 'DH-12-C1-B1-III-1'
export const probe = (
  id: string,
  hoi: string,
  dapAn: string,
  khac: Partial<ProbeRef> = {},
): ProbeRef => ({
  qid: id,
  phienBan: 'v1',
  phan: 'III',
  kyNang: ['tinh_M'],
  laTuongDuong: false,
  noiDungTrucTiep: { hoi, kieu: 'so', dapAn },
  ...khac,
})
export function hocLieuMau(): HocLieuChua {
  const cd = probe('cd', 'Tính M(NaOH), cho Na=23, O=16, H=1.', '40')
  const pb = probe(
    'pb',
    'Một mol NaOH có những nguyên tử nào? Chọn tổng khối lượng phù hợp.',
    'B',
    {
      phan: 'I',
      dapAnSai: ['A'],
      noiDungTrucTiep: {
        hoi: 'Một mol NaOH có những nguyên tử nào? Chọn tổng khối lượng phù hợp.',
        kieu: 'chon',
        dapAn: 'B',
        luaChon: [
          { ky: 'A', noi: 'Chỉ gồm Na: 23 g' },
          { ky: 'B', noi: 'Na, O, H: 40 g' },
        ],
      },
    },
  )
  const h: HocLieuChua = {
    schemaVersion: 1,
    qidGoc: Q,
    contentVersion: 'v1',
    buoc: [
      {
        id: 'm',
        thuTu: 0,
        tieuDe: 'Khối lượng mol',
        tienQuyet: [],
        viKyNang: ['tinh_M'],
        chanDoan: [cd],
        phanBiet: [pb],
        kiemLai: [probe('kl', 'Tính M(KOH), K=39, O=16, H=1.', '56')],
        hoTro: [
          { muc: 1, noiDung: 'Công thức có mấy nguyên tố?' },
          {
            muc: 2,
            noiDung: 'Một mol chất chứa đủ các nguyên tử trong công thức.',
          },
          {
            muc: 3,
            noiDung: 'NaOH: 23+16+1=40 g/mol. Thử cách cộng với chất khác.',
          },
        ],
        loiThuongGap: [
          {
            ma: 'chi_na',
            loai: 'kien_thuc',
            tinHieu: 'Chỉ tính Na',
            probeXacNhan: 'pb',
          },
        ],
        hieuBuoc: {
          mucTieu: 'Tính M từ công thức.',
          yNghiaDaiLuong: 'Khối lượng của một mol chất.',
          viSaoCanBuoc: 'Mẫu số đúng mới đổi được gam sang mol.',
          dieuKienApDung:
            'Cộng nguyên tử khối theo số nguyên tử trong công thức.',
          noiVoiBuocSau: 'Dùng n=m/M để tính mol.',
          doiChieu: [
            {
              maLoi: 'chi_na',
              probeXacNhan: pb,
              cachNghiCu: 'Em chọn chỉ tính Na.',
              diemLech: 'Đã bỏ O và H.',
              heQua: 'Một mol NaOH không chỉ có Na.',
              cachDung: 'Cộng đủ khối lượng các nguyên tử trong công thức.',
            },
          ],
          kiemLyDo: [
            probe('ld', 'Vì sao M(Ca(OH)2) phải tính hai nhóm OH?', 'B', {
              phan: 'I',
              noiDungTrucTiep: {
                hoi: 'Vì sao M(Ca(OH)2) phải tính hai nhóm OH?',
                kieu: 'chon_ly_do',
                dapAn: 'B',
                luaChon: [
                  { ky: 'A', noi: 'Vì Ca có nguyên tử khối lớn.' },
                  { ky: 'B', noi: 'Chỉ số 2 nhân cả O và H trong ngoặc.' },
                ],
              },
            }),
          ],
          chuyenGiao: [probe('cg', 'Tính M(Mg(OH)2), Mg=24, O=16, H=1.', '58')],
        },
      },
    ],
    banGhepBai: [
      {
        ...probe('ghep', 'Tính M(Al(OH)3), Al=27, O=16, H=1.', '78'),
        laTuongDuong: true,
        loai: 'ghep_bai',
      },
    ],
    banKiemChung: [
      {
        ...probe('kiem', 'Tính M(Ba(OH)2), Ba=137, O=16, H=1.', '171'),
        laTuongDuong: true,
        loai: 'kiem_chung',
      },
    ],
  }
  h.buoc[0].kiemLai.push(probe('kl2', 'Tính M(Li2O), Li=7, O=16.', '30'))
  h.buoc[0].hieuBuoc!.kiemLyDo.push(
    probe('ld2', 'Vì sao khối lượng mol K2O gồm hai nguyên tử K?', 'B', {
      phan: 'I',
      noiDungTrucTiep: {
        hoi: 'Vì sao khối lượng mol K2O gồm hai nguyên tử K?',
        kieu: 'chon_ly_do',
        dapAn: 'B',
        luaChon: [
          { ky: 'A', noi: 'Mọi oxide đều có hai kim loại.' },
          {
            ky: 'B',
            noi: 'Chỉ số 2 ở K cho biết hai nguyên tử K trong công thức.',
          },
        ],
      },
    }),
  )
  h.buoc[0].hieuBuoc!.chuyenGiao.push(
    probe('cg2', 'Tính M(Ca(OH)2), Ca=40, O=16, H=1.', '74'),
  )
  h.banGhepBai.push({
    ...probe('ghep2', 'Tính M(Fe(OH)3), Fe=56, O=16, H=1.', '107'),
    laTuongDuong: true,
    loai: 'ghep_bai',
  })
  h.banKiemChung.push({
    ...probe('kiem2', 'Tính M(Sr(OH)2), Sr=88, O=16, H=1.', '122'),
    laTuongDuong: true,
    loai: 'kiem_chung',
  })
  return h
}
export async function seedChua(env: Env) {
  const h = hocLieuMau()
  const q = {
    qid: Q,
    maDe: 'DH-12-C1-B1',
    lop: '12',
    version: 'v1',
    group: 'nhom-Q',
    phan: 'III',
    text: 'Tính M(LiOH), Li=7, O=16, H=1.',
    choices: [],
    ideas: [],
    correct: '24',
    solution: 'bí mật lời giải',
    reviewed: true,
    kienThuc: ['tinh_M'],
  }
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('HS1','Em Một','12','x','x')",
    ),
    env.DB.prepare(
      "INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('chua_cau_sai_v1',?,'x')",
    ).bind(JSON.stringify({ bat: true, sbd: ['HS1'] })),
    env.DB.prepare(
      "INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,cap_nhat_luc) VALUES('DH-12-C1-B1','Mol','12',1,'kho/1','v1')",
    ),
    env.DB.prepare(
      "INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-12-C1-B1','v1','x')",
    ),
    env.DB.prepare(
      "INSERT INTO game_v2_question(ma_de,qid,version,content_group,json) VALUES('DH-12-C1-B1',?,'v1','nhom-Q',?)",
    ).bind(Q, JSON.stringify(q)),
    env.DB.prepare(
      "INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,visibility,purpose) VALUES('sai1','HS1',?,'game','G1',1,0,'2026-09-29T01:00:00Z','2026-09-29','none','released','repair')",
    ).bind(Q),
    env.DB.prepare(
      "INSERT INTO chua_loi_hoc_lieu(bam,content_version,qid_chuan,hoc_lieu_json,trang_thai,nguoi_duyet,phien_ban_duyet,kiem_tra_luc,tao_luc,cap_nhat_luc) VALUES('b','v1',?,?,'du_dung','Thầy thử','v1',1,1,1)",
    ).bind(Q, JSON.stringify(h)),
  ])
  // Đồng bộ đồng hồ SQL thực với Date giả của bộ Node; D1/workerd dùng đồng hồ thực.
  await env.DB.prepare(
    "UPDATE chua_loi_dot SET giao_luc=?,chot_do_luc=? WHERE sbd='HS1'",
  )
    .bind(Date.now(), Date.now() + 7 * 86400000)
    .run()
  return await gameToken(env, 'HS1')
}
