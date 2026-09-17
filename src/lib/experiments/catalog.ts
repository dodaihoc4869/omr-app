import type {Scene} from './scene'
export const SCENES:Record<string,Scene>={
  "glucose-cold": {
    "title": "Glucose với Cu(OH)₂ ở nhiệt độ thường",
    "phases": [
      {
        "title": "Tạo Cu(OH)₂",
        "note": "Thêm NaOH vào CuSO₄.",
        "vessels": [
          {
            "label": "Kết tủa xanh",
            "solid": "#419bc3"
          }
        ]
      },
      {
        "title": "Thêm glucose, lắc nhẹ",
        "note": "Kết tủa tan, tạo dung dịch xanh lam.",
        "vessels": [
          {
            "label": "Phức đồng(II) – glucose",
            "liquid": "#419bc3"
          }
        ]
      }
    ]
  },
  "glucose-hot": {
    "title": "Glucose với Cu(OH)₂ trong kiềm, đun nóng",
    "phases": [
      {
        "title": "Ở nhiệt độ thường",
        "note": "Glucose hoà tan Cu(OH)₂ tạo dung dịch xanh.",
        "vessels": [
          {
            "label": "Dung dịch xanh",
            "liquid": "#419bc3"
          }
        ]
      },
      {
        "title": "Đun nóng",
        "note": "Xuất hiện kết tủa Cu₂O đỏ gạch.",
        "vessels": [
          {
            "label": "Cu₂O",
            "solid": "#b9532f",
            "heat": true
          }
        ]
      }
    ]
  },
  "glucose-compare": {
    "title": "So sánh glucose với Cu(OH)₂ trước và sau khi đun",
    "phases": [
      {
        "title": "Thêm glucose vào cả hai ống",
        "note": "Ở nhiệt độ thường, kết tủa tan cho dung dịch xanh.",
        "vessels": [
          {
            "label": "Ống (1)",
            "liquid": "#419bc3"
          },
          {
            "label": "Ống (2)",
            "liquid": "#419bc3"
          }
        ]
      },
      {
        "title": "Chỉ đun ống (2)",
        "note": "Ống (1) vẫn xanh; ống (2) có Cu₂O đỏ gạch.",
        "vessels": [
          {
            "label": "Ống (1): không đun",
            "liquid": "#419bc3"
          },
          {
            "label": "Ống (2): đun nóng",
            "solid": "#b9532f",
            "heat": true
          }
        ]
      }
    ]
  },
  "aldehyde-copper": {
    "title": "Aldehyde với Cu(OH)₂ trong kiềm",
    "phases": [
      {
        "title": "Trộn ở nhiệt độ thường",
        "note": "Cu(OH)₂ là kết tủa xanh, chưa có Cu₂O đỏ gạch.",
        "vessels": [
          {
            "label": "Cu(OH)₂",
            "solid": "#419bc3"
          }
        ]
      },
      {
        "title": "Đun nóng với aldehyde",
        "note": "Aldehyde khử Cu(II), tạo kết tủa Cu₂O đỏ gạch.",
        "vessels": [
          {
            "label": "Cu₂O",
            "solid": "#b9532f",
            "heat": true
          }
        ]
      }
    ]
  },
  "tollens-glucose": {
    "title": "Phản ứng tráng bạc của glucose",
    "phases": [
      {
        "title": "Chuẩn bị thuốc thử",
        "note": "Thêm NH₃ từng giọt vào AgNO₃ đến khi kết tủa vừa tan hết.",
        "vessels": [
          {
            "label": "Thuốc thử Tollens"
          }
        ]
      },
      {
        "title": "Thêm glucose, làm ấm",
        "note": "Bạc kim loại bám trên thành dụng cụ sạch.",
        "vessels": [
          {
            "label": "Lớp bạc",
            "coat": "#b8c3ca",
            "heat": true
          }
        ]
      }
    ]
  },
  "tollens-aldehyde": {
    "title": "Phản ứng tráng bạc của aldehyde",
    "phases": [
      {
        "title": "Thuốc thử Tollens",
        "note": "Dung dịch bạc trong ammonia.",
        "vessels": [
          {
            "label": "Thuốc thử"
          }
        ]
      },
      {
        "title": "Thêm aldehyde, làm ấm",
        "note": "Bạc kim loại tách ra và có thể bám trên thành ống sạch.",
        "vessels": [
          {
            "label": "Bạc kim loại",
            "coat": "#b8c3ca",
            "heat": true
          }
        ]
      }
    ]
  },
  "starch-iodine": {
    "title": "Nhận biết tinh bột bằng iodine",
    "phases": [
      {
        "title": "Trước khi nhỏ iodine",
        "note": "Mẫu có chứa tinh bột.",
        "vessels": [
          {
            "label": "Tinh bột",
            "liquid": "#e4e3d980"
          }
        ]
      },
      {
        "title": "Nhỏ iodine",
        "note": "Xuất hiện màu xanh tím / xanh đen.",
        "vessels": [
          {
            "label": "Tinh bột + iodine",
            "liquid": "#3c337f"
          }
        ]
      }
    ]
  },
  "starch-thermal": {
    "title": "Màu của hồ tinh bột và iodine khi nóng – lạnh",
    "phases": [
      {
        "title": "Nhỏ iodine vào hồ tinh bột",
        "note": "Xuất hiện màu xanh tím.",
        "vessels": [
          {
            "label": "Nhiệt độ thường",
            "liquid": "#3c337f"
          }
        ]
      },
      {
        "title": "Đun nóng",
        "note": "Màu xanh tím nhạt đi.",
        "vessels": [
          {
            "label": "Đang đun",
            "liquid": "#c1ad7530",
            "heat": true
          }
        ]
      },
      {
        "title": "Để nguội",
        "note": "Màu xanh tím xuất hiện trở lại nếu iodine chưa mất hết.",
        "vessels": [
          {
            "label": "Đã nguội",
            "liquid": "#3c337f"
          }
        ]
      }
    ]
  },
  "biuret": {
    "title": "Phản ứng màu biuret của protein",
    "phases": [
      {
        "title": "Tạo Cu(OH)₂",
        "note": "Trộn CuSO₄ với NaOH.",
        "vessels": [
          {
            "label": "Kết tủa xanh",
            "solid": "#419bc3"
          }
        ]
      },
      {
        "title": "Thêm lòng trắng trứng",
        "note": "Trong môi trường kiềm, protein tạo phức màu tím.",
        "vessels": [
          {
            "label": "Màu tím biuret",
            "liquid": "#9d6bb2"
          }
        ]
      }
    ]
  },
  "protein-heat": {
    "title": "Đông tụ protein khi đun nóng",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Lòng trắng trứng đã pha loãng.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Protein biến tính và đông tụ, xuất hiện phần đục trắng.",
        "vessels": [
          {
            "label": "Sau phản ứng",
            "solid": "#e5e6dd",
            "liquid": "#cbd4ce55",
            "heat": true
          }
        ]
      }
    ]
  },
  "protein-acid": {
    "title": "Protein gặp acid",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Nhỏ acid vào lòng trắng trứng.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Xuất hiện phần đục do protein bị biến tính và đông tụ.",
        "vessels": [
          {
            "label": "Sau phản ứng",
            "solid": "#e5e6dd",
            "liquid": "#cbd4ce55"
          }
        ]
      }
    ]
  },
  "protein-nitric": {
    "title": "Lòng trắng trứng với HNO₃ đặc",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Thêm HNO₃ đặc vào mẫu lòng trắng trứng.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Xuất hiện phần đông tụ màu vàng.",
        "vessels": [
          {
            "label": "Sau phản ứng",
            "solid": "#e9c74c",
            "liquid": "#e7cb7540"
          }
        ]
      }
    ]
  },
  "protein-two": {
    "title": "Hai phép thử với lòng trắng trứng",
    "phases": [
      {
        "title": "Chuẩn bị hai mẫu",
        "note": "Hai ống đều chứa lòng trắng trứng.",
        "vessels": [
          {
            "label": "Ống (1)"
          },
          {
            "label": "Ống (2)"
          }
        ]
      },
      {
        "title": "Đun ống (1), thêm HNO₃ đặc vào ống (2)",
        "note": "Ống (1) đông tụ trắng; ống (2) có phần đông tụ vàng.",
        "vessels": [
          {
            "label": "Ống (1)",
            "solid": "#e5e6dd",
            "heat": true
          },
          {
            "label": "Ống (2)",
            "solid": "#e9c74c"
          }
        ]
      }
    ]
  },
  "protein-three": {
    "title": "Ba phép thử với lòng trắng trứng",
    "phases": [
      {
        "title": "Ống (1): đun nóng",
        "note": "Protein đông tụ.",
        "vessels": [
          {
            "label": "Đông tụ trắng",
            "solid": "#e5e6dd",
            "heat": true
          }
        ]
      },
      {
        "title": "Ống (2): Cu(OH)₂ trong kiềm",
        "note": "Phản ứng biuret.",
        "vessels": [
          {
            "label": "Dung dịch tím",
            "liquid": "#9d6bb2"
          }
        ]
      },
      {
        "title": "Ống (3): HNO₃ đặc",
        "note": "Xuất hiện phần đông tụ vàng.",
        "vessels": [
          {
            "label": "Màu vàng",
            "solid": "#e9c74c"
          }
        ]
      }
    ]
  },
  "aniline-bromine": {
    "title": "Aniline với nước bromine",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Nhỏ nước bromine vào aniline, lắc nhẹ.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Bromine nhạt màu; 2,4,6-tribromoaniline kết tủa trắng.",
        "vessels": [
          {
            "label": "Sau phản ứng",
            "solid": "#e5e6dd"
          }
        ]
      }
    ]
  },
  "aniline-solubility": {
    "title": "Aniline: thêm acid rồi thêm kiềm",
    "phases": [
      {
        "title": "Aniline trong nước",
        "note": "Aniline ít tan, hỗn hợp có thể đục hoặc phân lớp.",
        "vessels": [
          {
            "label": "Aniline + nước",
            "layer": "#d8d3a2"
          }
        ]
      },
      {
        "title": "Thêm HCl",
        "note": "Tạo muối anilinium tan, hỗn hợp trong hơn.",
        "vessels": [
          {
            "label": "Muối tan"
          }
        ]
      },
      {
        "title": "Thêm NaOH dư",
        "note": "Aniline được giải phóng; hỗn hợp đục hoặc tách lớp trở lại.",
        "vessels": [
          {
            "label": "Aniline",
            "layer": "#d8d3a2"
          }
        ]
      }
    ]
  },
  "methylamine-copper": {
    "title": "Methylamine với dung dịch CuSO₄",
    "phases": [
      {
        "title": "Nhỏ từ từ",
        "note": "Ban đầu xuất hiện Cu(OH)₂ xanh nhạt.",
        "vessels": [
          {
            "label": "Cu(OH)₂",
            "solid": "#419bc3"
          }
        ]
      },
      {
        "title": "Tiếp tục thêm đến dư",
        "note": "Kết tủa tan dần tạo phức màu xanh đậm.",
        "vessels": [
          {
            "label": "Phức đồng(II)",
            "liquid": "#2753aa"
          }
        ]
      }
    ]
  },
  "ethylamine-copper": {
    "title": "Ethylamine với dung dịch CuSO₄",
    "phases": [
      {
        "title": "Nhỏ từ từ",
        "note": "Ban đầu xuất hiện Cu(OH)₂ xanh nhạt.",
        "vessels": [
          {
            "label": "Cu(OH)₂",
            "solid": "#419bc3"
          }
        ]
      },
      {
        "title": "Tiếp tục thêm đến dư",
        "note": "Kết tủa tan dần tạo phức màu xanh đậm.",
        "vessels": [
          {
            "label": "Phức đồng(II)",
            "liquid": "#2753aa"
          }
        ]
      }
    ]
  },
  "ammonia-copper": {
    "title": "NH₃ với dung dịch CuSO₄",
    "phases": [
      {
        "title": "Nhỏ từ từ",
        "note": "Ban đầu xuất hiện Cu(OH)₂ xanh nhạt.",
        "vessels": [
          {
            "label": "Cu(OH)₂",
            "solid": "#419bc3"
          }
        ]
      },
      {
        "title": "Tiếp tục thêm đến dư",
        "note": "Kết tủa tan dần tạo phức màu xanh đậm.",
        "vessels": [
          {
            "label": "Phức đồng(II)",
            "liquid": "#2753aa"
          }
        ]
      }
    ]
  },
  "amine-nitrous": {
    "title": "Amine no bậc một với HNO₂",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Cho methylamine hoặc ethylamine tác dụng với HNO₂ ở nhiệt độ thường.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Có bọt khí N₂ không màu thoát ra.",
        "vessels": [
          {
            "label": "Sau phản ứng",
            "gas": "#6d9bac"
          }
        ]
      }
    ]
  },
  "iron-hydroxide": {
    "title": "Tạo kết tủa Fe(OH)₃",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Thêm dung dịch kiềm vào dung dịch chứa Fe³⁺.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Xuất hiện kết tủa Fe(OH)₃ nâu đỏ.",
        "vessels": [
          {
            "label": "Sau phản ứng",
            "solid": "#99563d"
          }
        ]
      }
    ]
  },
  "copper-hydroxide": {
    "title": "Tạo kết tủa Cu(OH)₂",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Thêm NaOH vào dung dịch CuSO₄.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Xuất hiện kết tủa Cu(OH)₂ xanh.",
        "vessels": [
          {
            "label": "Sau phản ứng",
            "solid": "#419bc3"
          }
        ]
      }
    ]
  },
  "amine-two-metals": {
    "title": "Ethylamine với FeCl₃ và CuSO₄",
    "phases": [
      {
        "title": "Nhỏ ethylamine vào hai mẫu",
        "note": "Fe(OH)₃ nâu đỏ và Cu(OH)₂ xanh xuất hiện.",
        "vessels": [
          {
            "label": "FeCl₃",
            "solid": "#99563d"
          },
          {
            "label": "CuSO₄",
            "solid": "#419bc3"
          }
        ]
      },
      {
        "title": "Ethylamine dư",
        "note": "Fe(OH)₃ không tan; Cu(OH)₂ tan thành phức xanh đậm.",
        "vessels": [
          {
            "label": "Fe(OH)₃ còn lại",
            "solid": "#99563d"
          },
          {
            "label": "Phức Cu(II)",
            "liquid": "#2753aa"
          }
        ]
      }
    ]
  },
  "amine-acid": {
    "title": "Methylamine, phenolphthalein và HCl",
    "phases": [
      {
        "title": "Thêm phenolphthalein",
        "note": "Dung dịch methylamine có tính base, chuyển hồng.",
        "vessels": [
          {
            "label": "Methylamine",
            "liquid": "#df82b0"
          }
        ]
      },
      {
        "title": "Thêm đủ HCl",
        "note": "Acid phản ứng với base, màu hồng mất đi.",
        "vessels": [
          {
            "label": "Sau khi thêm acid"
          }
        ]
      }
    ]
  },
  "base-indicator": {
    "title": "Phenolphthalein trong dung dịch base",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Nhỏ phenolphthalein vào dung dịch base theo đề.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Dung dịch chuyển hồng.",
        "vessels": [
          {
            "label": "Sau phản ứng",
            "liquid": "#df82b0"
          }
        ]
      }
    ]
  },
  "titrate-base": {
    "title": "Nhỏ NaOH vào acid có phenolphthalein",
    "phases": [
      {
        "title": "Trước điểm kết thúc",
        "note": "Nhỏ từng giọt và lắc đều bình.",
        "vessels": [
          {
            "label": "Dung dịch trong bình",
            "liquid": "#b7dce62b"
          }
        ]
      },
      {
        "title": "Điểm kết thúc",
        "note": "Dừng khi màu hồng nhạt bền theo thời gian quy định trong đề.",
        "vessels": [
          {
            "label": "Quan sát màu",
            "liquid": "#dea0bb"
          }
        ]
      }
    ],
    "apparatus": "titration",
    "reagent": "NaOH"
  },
  "titrate-acid": {
    "title": "Nhỏ HCl vào NaOH có phenolphthalein",
    "phases": [
      {
        "title": "Trước điểm kết thúc",
        "note": "Nhỏ từng giọt và lắc đều bình.",
        "vessels": [
          {
            "label": "Dung dịch trong bình",
            "liquid": "#df82b0"
          }
        ]
      },
      {
        "title": "Điểm kết thúc",
        "note": "Màu hồng vừa biến mất là dấu hiệu kết thúc.",
        "vessels": [
          {
            "label": "Quan sát màu",
            "liquid": "#b7dce62b"
          }
        ]
      }
    ],
    "apparatus": "titration",
    "reagent": "HCl"
  },
  "permanganate": {
    "title": "Chuẩn độ Fe²⁺ bằng KMnO₄ trong acid",
    "phases": [
      {
        "title": "Trước điểm kết thúc",
        "note": "Nhỏ từng giọt và lắc đều bình.",
        "vessels": [
          {
            "label": "Dung dịch trong bình",
            "liquid": "#b7dce62b"
          }
        ]
      },
      {
        "title": "Điểm kết thúc",
        "note": "Trước điểm cuối, màu tím của giọt KMnO₄ mất đi. KMnO₄ vừa dư làm xuất hiện màu hồng nhạt bền.",
        "vessels": [
          {
            "label": "Quan sát màu",
            "liquid": "#dcb0d2"
          }
        ]
      }
    ],
    "apparatus": "titration",
    "reagent": "KMnO₄"
  },
  "soap": {
    "title": "Xà phòng hoá chất béo và tách xà phòng",
    "phases": [
      {
        "title": "Dầu/mỡ + NaOH",
        "note": "Ban đầu chất béo ít tan, tách lớp.",
        "vessels": [
          {
            "label": "Hỗn hợp",
            "layer": "#c8ad57"
          }
        ]
      },
      {
        "title": "Đun và khuấy",
        "note": "Chất béo phản ứng tạo muối của acid béo và glycerol.",
        "vessels": [
          {
            "label": "Hỗn hợp sau khi đun",
            "liquid": "#d6d8bd90",
            "heat": true
          }
        ]
      },
      {
        "title": "Thêm NaCl bão hoà, để yên",
        "note": "Xà phòng tách thành lớp trắng phía trên; glycerol ở phần dung dịch.",
        "vessels": [
          {
            "label": "Xà phòng ở trên",
            "layer": "#e5e6dd"
          }
        ]
      }
    ]
  },
  "ester-ethyl": {
    "title": "Điều chế ethyl acetate",
    "phases": [
      {
        "title": "Trộn acid và alcohol",
        "note": "H₂SO₄ đặc làm xúc tác; dùng lượng và nhiệt độ theo đề.",
        "vessels": [
          {
            "label": "Hỗn hợp phản ứng"
          }
        ]
      },
      {
        "title": "Gia nhiệt",
        "note": "Ester được tạo thành trong phản ứng thuận nghịch.",
        "vessels": [
          {
            "label": "Đun cách thuỷ",
            "heat": true
          }
        ]
      },
      {
        "title": "Làm lạnh, thêm NaCl bão hoà",
        "note": "Lớp giàu ester nổi phía trên. Màu vàng chỉ giúp phân biệt lớp; ester thực tế không màu.",
        "vessels": [
          {
            "label": "ethyl acetate",
            "layer": "#d1be79"
          }
        ]
      }
    ]
  },
  "ester-isoamyl": {
    "title": "Điều chế isoamyl acetate",
    "phases": [
      {
        "title": "Trộn acid và alcohol",
        "note": "H₂SO₄ đặc làm xúc tác; dùng lượng và nhiệt độ theo đề.",
        "vessels": [
          {
            "label": "Hỗn hợp phản ứng"
          }
        ]
      },
      {
        "title": "Gia nhiệt",
        "note": "Ester được tạo thành trong phản ứng thuận nghịch.",
        "vessels": [
          {
            "label": "Đun cách thuỷ",
            "heat": true
          }
        ]
      },
      {
        "title": "Làm lạnh, thêm NaCl bão hoà",
        "note": "Lớp giàu ester nổi phía trên. Màu vàng chỉ giúp phân biệt lớp; ester thực tế không màu.",
        "vessels": [
          {
            "label": "isoamyl acetate",
            "layer": "#d1be79"
          }
        ]
      }
    ]
  },
  "ester-two": {
    "title": "Thuỷ phân ethyl acetate: acid và kiềm",
    "phases": [
      {
        "title": "Trước khi đun",
        "note": "Ester ít tan, nằm thành lớp trên.",
        "vessels": [
          {
            "label": "Ống (1): acid",
            "layer": "#d1be79"
          },
          {
            "label": "Ống (2): NaOH",
            "layer": "#d1be79"
          }
        ]
      },
      {
        "title": "Sau khi đun",
        "note": "Trong acid vẫn còn ester do cân bằng; trong kiềm lớp ester giảm mạnh và có thể hết khi NaOH đủ, phản ứng đủ lâu.",
        "vessels": [
          {
            "label": "Ống (1)",
            "layer": "#d1be79",
            "layerSize": 14
          },
          {
            "label": "Ống (2)"
          }
        ]
      }
    ],
    "note": "Lớp ester thật không màu. Màu vàng và bề dày lớp chỉ để phân biệt, không biểu diễn hiệu suất hay thể tích thực."
  },
  "ester-three": {
    "title": "Thuỷ phân ethyl acetate trong ba môi trường",
    "phases": [
      {
        "title": "Ba ống trước khi đun",
        "note": "Mỗi ống có lớp ester nổi trên.",
        "vessels": [
          {
            "label": "(1) Nước",
            "layer": "#d1be79"
          },
          {
            "label": "(2) Acid",
            "layer": "#d1be79"
          },
          {
            "label": "(3) NaOH",
            "layer": "#d1be79"
          }
        ]
      },
      {
        "title": "Sau khi đun cùng điều kiện",
        "note": "Lớp ester trong nước giảm rất chậm; trong acid giảm một phần; trong NaOH giảm nhanh hơn.",
        "vessels": [
          {
            "label": "(1) Nước",
            "layer": "#d1be79"
          },
          {
            "label": "(2) Acid",
            "layer": "#d1be79",
            "layerSize": 14
          },
          {
            "label": "(3) NaOH"
          }
        ]
      }
    ],
    "note": "Màu lớp ester được thêm để dễ nhìn. Lượng còn lại phụ thuộc thời gian, nhiệt độ và lượng kiềm; hình không dùng để tính thể tích."
  },
  "distill-ethanol": {
    "title": "Chưng cất hỗn hợp ethanol – nước",
    "phases": [
      {
        "title": "Gia nhiệt hỗn hợp",
        "note": "Hơi tạo ra giàu ethanol hơn chất lỏng ban đầu.",
        "vessels": [
          {
            "label": "Bình đun",
            "heat": true
          }
        ]
      },
      {
        "title": "Làm lạnh hơi",
        "note": "Hơi qua sinh hàn ngưng tụ, chảy vào bình hứng.",
        "vessels": [
          {
            "label": "Phần cất"
          }
        ]
      }
    ],
    "apparatus": "distillation"
  },
  "ester-separate": {
    "title": "Chiết lớp ester khỏi lớp nước",
    "phases": [
      {
        "title": "Để hỗn hợp phân lớp",
        "note": "Với ester và dung dịch muối trong đề, lớp giàu ester ở trên.",
        "vessels": [
          {
            "label": "Hai lớp",
            "layer": "#d1be79"
          }
        ]
      },
      {
        "title": "Mở khoá phễu",
        "note": "Thu lớp dưới trước, đóng khoá tại mặt phân cách; thu lớp trên riêng.",
        "vessels": [
          {
            "label": "Lớp nước"
          },
          {
            "label": "Lớp ester",
            "liquid": "#d1be7955"
          }
        ]
      }
    ],
    "apparatus": "separation"
  },
  "fountain": {
    "title": "Đài phun ammonia",
    "phases": [
      {
        "title": "Nước tiếp xúc NH₃",
        "note": "NH₃ tan mạnh trong nước làm áp suất trong bình giảm.",
        "vessels": [
          {
            "label": "Nước đi vào bình"
          }
        ]
      },
      {
        "title": "Nước phun vào bình",
        "note": "Áp suất khí quyển đẩy nước lên. Phenolphthalein chuyển hồng trong dung dịch ammonia.",
        "vessels": [
          {
            "label": "Dung dịch NH₃",
            "liquid": "#df82b0"
          }
        ]
      }
    ],
    "apparatus": "fountain"
  },
  "ammonium-base": {
    "title": "Nhận biết ion NH₄⁺ bằng kiềm",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Thêm kiềm, đun nóng nhẹ theo đề.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "NH₃ thoát ra làm giấy quỳ tím ẩm chuyển xanh.",
        "vessels": [
          {
            "label": "Sau phản ứng",
            "gas": "#7da6b8",
            "paper": "#577ac2",
            "heat": true
          }
        ]
      }
    ]
  },
  "fertilizer": {
    "title": "Phân biệt KNO₃ và NH₄Cl bằng NaOH",
    "phases": [
      {
        "title": "Thêm NaOH, đun nhẹ",
        "note": "KNO₃ không giải phóng NH₃; NH₄Cl có NH₃ thoát ra.",
        "vessels": [
          {
            "label": "(1) KNO₃",
            "heat": true
          },
          {
            "label": "(2) NH₄Cl",
            "gas": "#7da6b8",
            "heat": true
          }
        ]
      },
      {
        "title": "Đưa quỳ tím ẩm gần miệng ống",
        "note": "Chỉ quỳ ở ống chứa NH₄Cl chuyển xanh.",
        "vessels": [
          {
            "label": "(1)",
            "paper": "#9e70ad"
          },
          {
            "label": "(2)",
            "paper": "#577ac2"
          }
        ]
      }
    ]
  },
  "silver-chloride": {
    "title": "Nhận biết Cl⁻ bằng AgNO₃",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Sau các bước xử lí mẫu trong đề, thêm AgNO₃.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Ag⁺ và Cl⁻ tạo kết tủa AgCl trắng.",
        "vessels": [
          {
            "label": "Sau phản ứng",
            "solid": "#e5e6dd"
          }
        ]
      }
    ]
  },
  "barium-sulfate": {
    "title": "Nhận biết sulfate bằng Ba²⁺",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Trộn dung dịch chứa SO₄²⁻ với dung dịch chứa Ba²⁺.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Xuất hiện kết tủa BaSO₄ trắng.",
        "vessels": [
          {
            "label": "Sau phản ứng",
            "solid": "#e5e6dd"
          }
        ]
      }
    ]
  },
  "sulfate-compare": {
    "title": "So sánh kết tủa CaSO₄ và BaSO₄",
    "phases": [
      {
        "title": "Nhỏ dung dịch sulfate",
        "note": "Hai mẫu lần lượt chứa Ca²⁺ và Ba²⁺.",
        "vessels": [
          {
            "label": "Ca²⁺"
          },
          {
            "label": "Ba²⁺"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "BaSO₄ ít tan hơn nhiều nên kết tủa rõ hơn; CaSO₄ xuất hiện tuỳ nồng độ đã cho.",
        "vessels": [
          {
            "label": "CaSO₄",
            "solid": "#e4e6d580"
          },
          {
            "label": "BaSO₄",
            "solid": "#e5e6dd"
          }
        ]
      }
    ]
  },
  "iron-copper": {
    "title": "Đinh sắt trong dung dịch CuSO₄",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Đinh sắt sạch, dung dịch CuSO₄ xanh.",
        "vessels": [
          {
            "label": "Fe + CuSO₄",
            "metal": "#83929b",
            "liquid": "#419bc3"
          }
        ]
      },
      {
        "title": "Sau một thời gian",
        "note": "Đồng đỏ bám trên sắt; màu xanh nhạt dần.",
        "vessels": [
          {
            "label": "Đồng bám trên sắt",
            "metal": "#b96e44",
            "liquid": "#8db7b866"
          }
        ]
      }
    ]
  },
  "copper-silver": {
    "title": "Đồng trong dung dịch AgNO₃",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Lá đồng trong dung dịch AgNO₃ không màu.",
        "vessels": [
          {
            "label": "Cu + AgNO₃",
            "metal": "#b96e44"
          }
        ]
      },
      {
        "title": "Sau một thời gian",
        "note": "Bạc bám trên đồng; dung dịch có màu xanh của ion Cu²⁺.",
        "vessels": [
          {
            "label": "Ag và Cu²⁺",
            "metal": "#c3c9ca",
            "solid": "#c3c9ca",
            "liquid": "#419bc3"
          }
        ]
      }
    ]
  },
  "copper-electrolysis": {
    "title": "Điện phân CuSO₄ với điện cực trơ",
    "phases": [
      {
        "title": "Đóng mạch điện",
        "note": "Dung dịch còn ion Cu²⁺.",
        "vessels": [
          {
            "label": "CuSO₄",
            "liquid": "#419bc3"
          }
        ]
      },
      {
        "title": "Quan sát hai điện cực",
        "note": "Ở cathode: đồng đỏ bám. Ở anode: có O₂ thoát ra. Màu xanh của dung dịch nhạt dần.",
        "vessels": [
          {
            "label": "Anode (+): O₂",
            "gas": "#7da6b8",
            "liquid": "#78adcc70"
          },
          {
            "label": "Cathode (−): Cu",
            "metal": "#b96e44",
            "liquid": "#78adcc70"
          }
        ]
      }
    ],
    "apparatus": "electrolysis"
  },
  "copper-refining": {
    "title": "Điện phân với anode bằng đồng",
    "phases": [
      {
        "title": "Nối điện cực",
        "note": "Đồng ở anode (+), vật nhận lớp đồng ở cathode (−).",
        "vessels": [
          {
            "label": "Dung dịch chứa Cu²⁺",
            "liquid": "#419bc3"
          }
        ]
      },
      {
        "title": "Khi có dòng điện",
        "note": "Đồng ở anode tan; đồng bám lên cathode.",
        "vessels": [
          {
            "label": "Anode: Cu → Cu²⁺",
            "metal": "#b96e44",
            "liquid": "#419bc3"
          },
          {
            "label": "Cathode: Cu²⁺ → Cu",
            "metal": "#b96e44",
            "liquid": "#419bc3"
          }
        ]
      }
    ],
    "apparatus": "electrolysis",
    "note": "Sơ đồ chỉ mô tả sự chuyển đồng. Tạp chất và biến đổi nồng độ phải xét riêng theo đề; hình không giả định mọi tạp chất đều tan."
  },
  "zinc-acid-copper": {
    "title": "Kẽm trong acid: ảnh hưởng của CuSO₄",
    "phases": [
      {
        "title": "Cho kẽm vào acid loãng",
        "note": "Kẽm tan và có bọt H₂ thoát ra.",
        "vessels": [
          {
            "label": "Ống đối chứng",
            "metal": "#89959b",
            "gas": "#7da6b8"
          },
          {
            "label": "Ống thí nghiệm",
            "metal": "#89959b",
            "gas": "#7da6b8"
          }
        ]
      },
      {
        "title": "Thêm CuSO₄ vào ống thí nghiệm",
        "note": "Đồng bám trên kẽm tạo cặp điện cực; bọt khí thoát ra nhanh hơn.",
        "vessels": [
          {
            "label": "Đối chứng",
            "metal": "#89959b",
            "gas": "#7da6b8"
          },
          {
            "label": "Có đồng bám",
            "metal": "#b96e44",
            "gas": "#7da6b8"
          }
        ]
      }
    ]
  },
  "acid-metals": {
    "title": "Al, Fe và Cu trong H₂SO₄ loãng",
    "phases": [
      {
        "title": "Cho các lá kim loại đã làm sạch vào acid",
        "note": "So sánh trong cùng điều kiện của đề.",
        "vessels": [
          {
            "label": "(1) Al",
            "metal": "#b0b7bd"
          },
          {
            "label": "(2) Fe",
            "metal": "#89959b"
          },
          {
            "label": "(3) Cu",
            "metal": "#b96e44"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Al và Fe có H₂ thoát ra; Cu không phản ứng với H₂SO₄ loãng trong điều kiện này.",
        "vessels": [
          {
            "label": "(1) Al",
            "gas": "#7da6b8"
          },
          {
            "label": "(2) Fe",
            "gas": "#7da6b8"
          },
          {
            "label": "(3) Cu",
            "metal": "#b96e44"
          }
        ]
      }
    ]
  },
  "copper-sulfuric": {
    "title": "Cu với H₂SO₄ đặc, nóng",
    "phases": [
      {
        "title": "Trước khi đun",
        "note": "Đồng trong acid theo đề.",
        "vessels": [
          {
            "label": "Cu",
            "metal": "#b96e44"
          }
        ]
      },
      {
        "title": "Đun nóng",
        "note": "Đồng tan, dung dịch xanh; khí SO₂ không màu thoát ra.",
        "vessels": [
          {
            "label": "CuSO₄ và SO₂",
            "liquid": "#419bc3",
            "gas": "#7da6b8",
            "heat": true
          }
        ]
      }
    ]
  },
  "copper-sulfuric-compare": {
    "title": "Cu với H₂SO₄ loãng và đặc nóng",
    "phases": [
      {
        "title": "Acid loãng",
        "note": "Không quan sát thấy Cu tan hoặc khí H₂.",
        "vessels": [
          {
            "label": "Cu còn lại",
            "metal": "#b96e44"
          }
        ]
      },
      {
        "title": "Acid đặc, nóng",
        "note": "Cu tan, tạo dung dịch CuSO₄ xanh và SO₂ không màu.",
        "vessels": [
          {
            "label": "CuSO₄",
            "liquid": "#419bc3",
            "gas": "#7da6b8",
            "heat": true
          }
        ]
      }
    ]
  },
  "copper-nitric": {
    "title": "Cu với HNO₃ đặc",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Nhỏ HNO₃ đặc vào đồng.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Đồng tan, dung dịch có Cu²⁺ màu xanh; NO₂ màu nâu đỏ thoát ra.",
        "vessels": [
          {
            "label": "Sau phản ứng",
            "liquid": "#419bc3",
            "gas": "#9f542d"
          }
        ]
      }
    ]
  },
  "thiocyanate": {
    "title": "Cân bằng Fe³⁺ – SCN⁻",
    "phases": [
      {
        "title": "Chia dung dịch thành hai ống",
        "note": "Cả hai mẫu ban đầu có màu đỏ.",
        "vessels": [
          {
            "label": "(1)",
            "liquid": "#bb4947"
          },
          {
            "label": "(2)",
            "liquid": "#bb4947"
          }
        ]
      },
      {
        "title": "Thêm KSCN vào (1), NaOH vào (2)",
        "note": "Ống (1) đỏ đậm hơn. Ống (2) xuất hiện Fe(OH)₃; màu đỏ của dung dịch nhạt đi.",
        "vessels": [
          {
            "label": "(1) Thêm KSCN",
            "liquid": "#871f2e"
          },
          {
            "label": "(2) Thêm NaOH",
            "liquid": "#d0a19755",
            "solid": "#99563d"
          }
        ]
      }
    ]
  },
  "sodium-water": {
    "title": "Natri với nước có phenolphthalein",
    "phases": [
      {
        "title": "Cho mẫu Na nhỏ vào nước",
        "note": "Mẫu Na phản ứng trên mặt nước.",
        "vessels": [
          {
            "label": "Na + nước",
            "metal": "#a7b1b8"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Na tan dần, có H₂ thoát ra; dung dịch NaOH tạo thành làm phenolphthalein chuyển hồng.",
        "vessels": [
          {
            "label": "NaOH + chỉ thị",
            "liquid": "#df82b0",
            "gas": "#7da6b8"
          }
        ]
      }
    ]
  },
  "calcium-water": {
    "title": "Calcium với nước có phenolphthalein",
    "phases": [
      {
        "title": "Thả calcium vào nước",
        "note": "Phản ứng tạo calcium hydroxide và H₂.",
        "vessels": [
          {
            "label": "Ca + nước",
            "metal": "#a7b1b8"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Có bọt khí, phenolphthalein chuyển hồng. Hỗn hợp có thể đục khi Ca(OH)₂ vượt độ tan.",
        "vessels": [
          {
            "label": "Ca(OH)₂",
            "liquid": "#df82b0",
            "gas": "#7da6b8"
          }
        ]
      }
    ]
  },
  "iodoform": {
    "title": "Phản ứng iodoform",
    "phases": [
      {
        "title": "Trộn mẫu với I₂ và kiềm",
        "note": "Dùng chất và điều kiện đã cho trong đề.",
        "vessels": [
          {
            "label": "I₂",
            "liquid": "#a8753840"
          }
        ]
      },
      {
        "title": "Quan sát mẫu cho phản ứng",
        "note": "Xuất hiện kết tủa CHI₃ vàng.",
        "vessels": [
          {
            "label": "Iodoform",
            "solid": "#e9cb4d"
          }
        ]
      }
    ]
  },
  "electrophoresis": {
    "title": "Điện di amino acid",
    "phases": [
      {
        "title": "Xét pH so với pI",
        "note": "pH < pI: điện tích tổng dương; pH > pI: điện tích tổng âm; pH ≈ pI: gần trung hoà.",
        "vessels": [
          {
            "label": "Xác định dạng ion"
          }
        ]
      },
      {
        "title": "Đặt trong điện trường",
        "note": "Ion dương về cathode (−), ion âm về anode (+); dạng gần trung hoà hầu như ở vị trí ban đầu.",
        "vessels": [
          {
            "label": "So sánh với vệt trong đề"
          }
        ]
      }
    ],
    "apparatus": "electrophoresis",
    "note": "Sơ đồ mô tả nguyên lí, không gán tên amino acid hoặc số thứ tự vệt thay cho hình trong đề."
  },
  "no2-cold": {
    "title": "Làm lạnh hệ NO₂ ⇌ N₂O₄ kín",
    "phases": [
      {
        "title": "Ban đầu",
        "note": "NO₂ làm hỗn hợp khí có màu nâu đỏ.",
        "vessels": [
          {
            "label": "Ống kín",
            "gasFill": "#9f542d99"
          }
        ]
      },
      {
        "title": "Làm lạnh bằng nước đá",
        "note": "Màu nâu nhạt dần khi lượng NO₂ giảm.",
        "vessels": [
          {
            "label": "Ống vẫn kín",
            "gasFill": "#9f542d22"
          }
        ]
      }
    ],
    "note": "Các ống luôn kín; sắc nâu là khí NO₂, không phải chất lỏng. Hình chỉ mô tả định tính, không thay số liệu nồng độ."
  },
  "silver-halides": {
    "title": "AgNO₃ với các ion halide",
    "phases": [
      {
        "title": "Nhỏ AgNO₃ vào từng mẫu",
        "note": "Quan sát từng ống riêng biệt.",
        "vessels": [
          {
            "label": "F⁻"
          },
          {
            "label": "Cl⁻"
          },
          {
            "label": "Br⁻"
          },
          {
            "label": "I⁻"
          }
        ]
      },
      {
        "title": "Sau khi trộn",
        "note": "AgF tan; AgCl trắng; AgBr vàng nhạt; AgI vàng.",
        "vessels": [
          {
            "label": "F⁻: không kết tủa"
          },
          {
            "label": "AgCl",
            "solid": "#e5e6dd"
          },
          {
            "label": "AgBr",
            "solid": "#e8db9b"
          },
          {
            "label": "AgI",
            "solid": "#e9c84b"
          }
        ]
      }
    ]
  },
  "chlorine-iodide": {
    "title": "Chlorine với iodide có hồ tinh bột",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Nhỏ nước chlorine vào dung dịch NaI đã có hồ tinh bột.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Iodide bị oxi hoá thành iodine; mẫu xuất hiện màu xanh tím.",
        "vessels": [
          {
            "label": "Sau phản ứng",
            "liquid": "#3c337f"
          }
        ]
      }
    ]
  },
  "acetylene-silver": {
    "title": "Acetylene với AgNO₃ trong NH₃",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Sục acetylene vào thuốc thử trong đề.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Xuất hiện kết tủa bạc acetylide màu vàng nhạt.",
        "vessels": [
          {
            "label": "Sau phản ứng",
            "solid": "#e1d386"
          }
        ]
      }
    ]
  },
  "alkynes-alkenes": {
    "title": "Tách acetylene rồi nhận biết ethylene",
    "phases": [
      {
        "title": "Ống (1): AgNO₃ trong NH₃",
        "note": "Acetylene tạo kết tủa vàng nhạt; ethylene đi tiếp.",
        "vessels": [
          {
            "label": "Ống (1)",
            "solid": "#e1d386"
          }
        ]
      },
      {
        "title": "Ống (2): nước bromine",
        "note": "Ethylene làm màu nước bromine nhạt dần.",
        "vessels": [
          {
            "label": "Trước",
            "liquid": "#c78b45"
          },
          {
            "label": "Sau"
          }
        ]
      }
    ]
  },
  "glucose-bromine": {
    "title": "Glucose với nước bromine",
    "phases": [
      {
        "title": "Nước bromine ban đầu",
        "note": "Dung dịch có màu vàng nâu nhạt.",
        "vessels": [
          {
            "label": "Nước bromine",
            "liquid": "#c78b4570"
          }
        ]
      },
      {
        "title": "Thêm glucose, lắc đều",
        "note": "Màu bromine nhạt dần khi tham gia phản ứng.",
        "vessels": [
          {
            "label": "Sau phản ứng"
          }
        ]
      }
    ]
  },
  "nickel-ammonia": {
    "title": "Ni(OH)₂ với ammonia dư",
    "phases": [
      {
        "title": "Ban đầu",
        "note": "Bột Ni(OH)₂ màu xanh lá.",
        "vessels": [
          {
            "label": "Ni(OH)₂",
            "solid": "#72a17b"
          }
        ]
      },
      {
        "title": "Thêm NH₃ dư",
        "note": "Chất rắn tan, tạo phức ammine màu xanh dương.",
        "vessels": [
          {
            "label": "Phức Ni(II)",
            "liquid": "#668dd1"
          }
        ]
      }
    ]
  },
  "copper-ethanol": {
    "title": "Oxi hoá ethanol bằng CuO",
    "phases": [
      {
        "title": "Đun dây đồng trong không khí",
        "note": "Bề mặt đồng phủ CuO màu đen.",
        "vessels": [
          {
            "label": "CuO trên đồng",
            "metal": "#333d43",
            "heat": true
          }
        ]
      },
      {
        "title": "Nhúng vào ethanol",
        "note": "CuO bị khử thành Cu màu đỏ; ethanol bị oxi hoá thành ethanal.",
        "vessels": [
          {
            "label": "Đồng đỏ",
            "metal": "#b96e44"
          }
        ]
      }
    ]
  },
  "carbonate-acid": {
    "title": "Carbonate/hydrogencarbonate với acid",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Cho acid vào mẫu theo đề.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Có bọt CO₂ không màu thoát ra. CO₂ không duy trì sự cháy.",
        "vessels": [
          {
            "label": "Sau phản ứng",
            "gas": "#7da6b8"
          }
        ]
      }
    ]
  },
  "carbonate-rate": {
    "title": "Diện tích tiếp xúc và tốc độ phản ứng",
    "phases": [
      {
        "title": "Cùng lượng CaCO₃, cùng dung dịch HCl dư",
        "note": "So sánh khối, viên nhỏ và bột.",
        "vessels": [
          {
            "label": "Khối",
            "solid": "#e5e6dd"
          },
          {
            "label": "Viên nhỏ",
            "solid": "#e5e6dd"
          },
          {
            "label": "Bột",
            "solid": "#e5e6dd"
          }
        ]
      },
      {
        "title": "Phản ứng sinh CO₂",
        "note": "Bột có diện tích tiếp xúc lớn nhất nên tan hết nhanh nhất; dạng khối chậm nhất.",
        "vessels": [
          {
            "label": "Khối: chậm",
            "gas": "#7da6b8"
          },
          {
            "label": "Viên: nhanh hơn",
            "gas": "#7da6b8"
          },
          {
            "label": "Bột: nhanh nhất",
            "gas": "#7da6b8"
          }
        ]
      }
    ],
    "note": "Số bọt trong sơ đồ không biểu diễn tốc độ định lượng; so sánh tốc độ bằng điều kiện và dữ liệu của đề."
  },
  "soap-detergent": {
    "title": "Xà phòng, chất giặt rửa và nước cứng",
    "phases": [
      {
        "title": "Thêm dầu rồi lắc",
        "note": "Dầu phân lớp trong nước; chất giặt rửa giúp phân tán dầu.",
        "vessels": [
          {
            "label": "(1) Nước",
            "layer": "#c8ad57"
          },
          {
            "label": "(2) Xà phòng",
            "liquid": "#d9dfcb88"
          }
        ]
      },
      {
        "title": "Có thêm CaCl₂",
        "note": "Xà phòng tạo muối calcium ít tan nên giảm khả năng giặt rửa; chất giặt rửa tổng hợp trong bài vẫn dùng được.",
        "vessels": [
          {
            "label": "(3) Xà phòng + CaCl₂",
            "solid": "#e5e6dd",
            "layer": "#c8ad57"
          },
          {
            "label": "(4) Tổng hợp + CaCl₂",
            "liquid": "#d9dfcb88"
          }
        ]
      }
    ]
  },
  "soap-hardwater": {
    "title": "Xà phòng trong dung dịch CaCl₂",
    "phases": [
      {
        "title": "Hai mẫu có CaCl₂",
        "note": "Ống (1) chứa nước; ống (2) chứa nước xà phòng.",
        "vessels": [
          {
            "label": "(1) Nước + CaCl₂"
          },
          {
            "label": "(2) Xà phòng + CaCl₂"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Chỉ ống có xà phòng tạo muối calcium của acid béo ít tan.",
        "vessels": [
          {
            "label": "(1) Không kết tủa"
          },
          {
            "label": "(2) Kết tủa",
            "solid": "#e5e6dd"
          }
        ]
      }
    ]
  },
  "sucrose-hydrolysis-copper": {
    "title": "Thuỷ phân saccharose rồi thử sản phẩm",
    "phases": [
      {
        "title": "Thuỷ phân trong acid",
        "note": "Gia nhiệt theo đề để tạo đường có tính khử.",
        "vessels": [
          {
            "label": "Đang thuỷ phân",
            "heat": true
          }
        ]
      },
      {
        "title": "Xử lí acid dư",
        "note": "Làm nguội và trung hoà theo đúng thuốc thử trong đề; tạo môi trường phù hợp trước phép thử.",
        "vessels": [
          {
            "label": "Mẫu sau xử lí"
          }
        ]
      },
      {
        "title": "Thử tính khử",
        "note": "Với Cu(OH)₂ trong kiềm và đun nóng: xuất hiện Cu₂O đỏ gạch.",
        "vessels": [
          {
            "label": "Kết quả phép thử",
            "solid": "#b9532f",
            "heat": true
          }
        ]
      }
    ]
  },
  "sucrose-hydrolysis-silver": {
    "title": "Thuỷ phân saccharose rồi thử sản phẩm",
    "phases": [
      {
        "title": "Thuỷ phân trong acid",
        "note": "Gia nhiệt theo đề để tạo đường có tính khử.",
        "vessels": [
          {
            "label": "Đang thuỷ phân",
            "heat": true
          }
        ]
      },
      {
        "title": "Xử lí acid dư",
        "note": "Làm nguội và trung hoà theo đúng thuốc thử trong đề; tạo môi trường phù hợp trước phép thử.",
        "vessels": [
          {
            "label": "Mẫu sau xử lí"
          }
        ]
      },
      {
        "title": "Thử tính khử",
        "note": "Với thuốc thử Tollens và làm ấm: bạc tách ra.",
        "vessels": [
          {
            "label": "Kết quả phép thử",
            "coat": "#b8c3ca",
            "heat": true
          }
        ]
      }
    ]
  },
  "cellulose-hydrolysis-copper": {
    "title": "Thuỷ phân cellulose rồi thử sản phẩm",
    "phases": [
      {
        "title": "Thuỷ phân trong acid",
        "note": "Gia nhiệt theo đề để tạo đường có tính khử.",
        "vessels": [
          {
            "label": "Đang thuỷ phân",
            "heat": true
          }
        ]
      },
      {
        "title": "Xử lí acid dư",
        "note": "Làm nguội và trung hoà theo đúng thuốc thử trong đề; tạo môi trường phù hợp trước phép thử.",
        "vessels": [
          {
            "label": "Mẫu sau xử lí"
          }
        ]
      },
      {
        "title": "Thử tính khử",
        "note": "Với Cu(OH)₂ trong kiềm và đun nóng: xuất hiện Cu₂O đỏ gạch.",
        "vessels": [
          {
            "label": "Kết quả phép thử",
            "solid": "#b9532f",
            "heat": true
          }
        ]
      }
    ]
  },
  "cellulose-hydrolysis-silver": {
    "title": "Thuỷ phân cellulose rồi thử sản phẩm",
    "phases": [
      {
        "title": "Thuỷ phân trong acid",
        "note": "Gia nhiệt theo đề để tạo đường có tính khử.",
        "vessels": [
          {
            "label": "Đang thuỷ phân",
            "heat": true
          }
        ]
      },
      {
        "title": "Xử lí acid dư",
        "note": "Làm nguội và trung hoà theo đúng thuốc thử trong đề; tạo môi trường phù hợp trước phép thử.",
        "vessels": [
          {
            "label": "Mẫu sau xử lí"
          }
        ]
      },
      {
        "title": "Thử tính khử",
        "note": "Với thuốc thử Tollens và làm ấm: bạc tách ra.",
        "vessels": [
          {
            "label": "Kết quả phép thử",
            "coat": "#b8c3ca",
            "heat": true
          }
        ]
      }
    ]
  },
  "starch-hydrolysis-copper": {
    "title": "Thuỷ phân tinh bột rồi thử sản phẩm",
    "phases": [
      {
        "title": "Thuỷ phân trong acid",
        "note": "Gia nhiệt theo đề để tạo đường có tính khử.",
        "vessels": [
          {
            "label": "Đang thuỷ phân",
            "heat": true
          }
        ]
      },
      {
        "title": "Xử lí acid dư",
        "note": "Làm nguội và trung hoà theo đúng thuốc thử trong đề; tạo môi trường phù hợp trước phép thử.",
        "vessels": [
          {
            "label": "Mẫu sau xử lí"
          }
        ]
      },
      {
        "title": "Thử tính khử",
        "note": "Với Cu(OH)₂ trong kiềm và đun nóng: xuất hiện Cu₂O đỏ gạch.",
        "vessels": [
          {
            "label": "Kết quả phép thử",
            "solid": "#b9532f",
            "heat": true
          }
        ]
      }
    ]
  },
  "starch-hydrolysis-silver": {
    "title": "Thuỷ phân tinh bột rồi thử sản phẩm",
    "phases": [
      {
        "title": "Thuỷ phân trong acid",
        "note": "Gia nhiệt theo đề để tạo đường có tính khử.",
        "vessels": [
          {
            "label": "Đang thuỷ phân",
            "heat": true
          }
        ]
      },
      {
        "title": "Xử lí acid dư",
        "note": "Làm nguội và trung hoà theo đúng thuốc thử trong đề; tạo môi trường phù hợp trước phép thử.",
        "vessels": [
          {
            "label": "Mẫu sau xử lí"
          }
        ]
      },
      {
        "title": "Thử tính khử",
        "note": "Với thuốc thử Tollens và làm ấm: bạc tách ra.",
        "vessels": [
          {
            "label": "Kết quả phép thử",
            "coat": "#b8c3ca",
            "heat": true
          }
        ]
      }
    ]
  },
  "sucrose-cold": {
    "title": "Saccharose với Cu(OH)₂",
    "phases": [
      {
        "title": "Tạo Cu(OH)₂",
        "note": "CuSO₄ và NaOH cho kết tủa xanh.",
        "vessels": [
          {
            "label": "Cu(OH)₂",
            "solid": "#419bc3"
          }
        ]
      },
      {
        "title": "Thêm saccharose, lắc đều",
        "note": "Kết tủa tan tạo dung dịch xanh lam.",
        "vessels": [
          {
            "label": "Phức đồng(II)",
            "liquid": "#419bc3"
          }
        ]
      }
    ]
  },
  "three-foods": {
    "title": "Cu(OH)₂ với glucose, saccharose và protein",
    "phases": [
      {
        "title": "Tạo Cu(OH)₂ trong ba ống",
        "note": "Mỗi ống có kết tủa xanh.",
        "vessels": [
          {
            "label": "(1)",
            "solid": "#419bc3"
          },
          {
            "label": "(2)",
            "solid": "#419bc3"
          },
          {
            "label": "(3)",
            "solid": "#419bc3"
          }
        ]
      },
      {
        "title": "Thêm ba mẫu, không đun",
        "note": "Glucose và saccharose cho dung dịch xanh; lòng trắng trứng cho màu tím biuret.",
        "vessels": [
          {
            "label": "(1) Glucose",
            "liquid": "#419bc3"
          },
          {
            "label": "(2) Saccharose",
            "liquid": "#419bc3"
          },
          {
            "label": "(3) Protein",
            "liquid": "#9d6bb2"
          }
        ]
      }
    ]
  },
  "ammonia-al-zinc": {
    "title": "Al³⁺ và Zn²⁺ với NH₃ dư",
    "phases": [
      {
        "title": "Thêm NH₃ từ từ",
        "note": "Cả hai mẫu xuất hiện kết tủa trắng.",
        "vessels": [
          {
            "label": "(1) Al(OH)₃",
            "solid": "#e5e6dd"
          },
          {
            "label": "(2) Zn(OH)₂",
            "solid": "#e5e6dd"
          }
        ]
      },
      {
        "title": "Tiếp tục thêm NH₃ dư",
        "note": "Al(OH)₃ không tan; Zn(OH)₂ tan thành phức không màu.",
        "vessels": [
          {
            "label": "(1) Kết tủa còn",
            "solid": "#e5e6dd"
          },
          {
            "label": "(2) Phức tan"
          }
        ]
      }
    ]
  },
  "al-hydroxide": {
    "title": "Al³⁺ với một lượng nhỏ NaOH",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Thêm vài giọt NaOH theo đề.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Xuất hiện kết tủa keo trắng Al(OH)₃; nếu tiếp tục thêm kiềm dư thì có thể tan.",
        "vessels": [
          {
            "label": "Sau phản ứng",
            "solid": "#e5e6dd"
          }
        ]
      }
    ]
  },
  "copper-chloride": {
    "title": "Phức đồng(II) với chloride",
    "phases": [
      {
        "title": "Dung dịch CuSO₄ ban đầu",
        "note": "Phức aqua của Cu²⁺ có màu xanh.",
        "vessels": [
          {
            "label": "Ban đầu",
            "liquid": "#419bc3"
          }
        ]
      },
      {
        "title": "Thêm HCl đặc",
        "note": "Nồng độ Cl⁻ cao tạo phức chloride màu vàng; hỗn hợp có thể xanh lục khi còn phức aqua.",
        "vessels": [
          {
            "label": "Phức chloride",
            "liquid": "#cbbd54"
          }
        ]
      }
    ]
  },
  "copper-chloride-compare": {
    "title": "Thêm HCl đặc và NaCl vào CuSO₄",
    "phases": [
      {
        "title": "Hai mẫu CuSO₄ giống nhau",
        "note": "Dung dịch xanh nhạt.",
        "vessels": [
          {
            "label": "(1)",
            "liquid": "#419bc3"
          },
          {
            "label": "(2)",
            "liquid": "#419bc3"
          }
        ]
      },
      {
        "title": "Theo điều kiện đã cho",
        "note": "Ống HCl đặc chuyển vàng chanh; ống NaCl bão hoà xanh nhạt hơn.",
        "vessels": [
          {
            "label": "(1) HCl đặc",
            "liquid": "#d4cc55"
          },
          {
            "label": "(2) NaCl",
            "liquid": "#419bc350"
          }
        ]
      }
    ]
  },
  "iron-hydrolysis": {
    "title": "Sự thuỷ phân ion Fe³⁺",
    "phases": [
      {
        "title": "Ban đầu",
        "note": "Dung dịch chứa ion Fe³⁺ có màu vàng nâu.",
        "vessels": [
          {
            "label": "Fe³⁺",
            "liquid": "#bc964966"
          }
        ]
      },
      {
        "title": "Sau một thời gian",
        "note": "Xuất hiện phần không tan màu nâu theo cân bằng trong đề.",
        "vessels": [
          {
            "label": "Hydroxide sắt(III)",
            "solid": "#99563d"
          }
        ]
      }
    ]
  },
  "water-iron": {
    "title": "Nước giếng để tiếp xúc không khí",
    "phases": [
      {
        "title": "Ban đầu",
        "note": "Hai mẫu nước mới lấy trong suốt.",
        "vessels": [
          {
            "label": "(1) Để hở"
          },
          {
            "label": "(2) Bịt kín"
          }
        ]
      },
      {
        "title": "Sau thời gian của đề",
        "note": "Mẫu (1) có kết tủa nâu đỏ; mẫu (2) vẫn trong theo quan sát đã cho.",
        "vessels": [
          {
            "label": "(1) Có kết tủa",
            "solid": "#99563d"
          },
          {
            "label": "(2) Vẫn trong"
          }
        ]
      }
    ]
  },
  "ester-acid": {
    "title": "Thuỷ phân ethyl acetate trong acid",
    "phases": [
      {
        "title": "Trước khi đun",
        "note": "Ester ít tan, có lớp riêng.",
        "vessels": [
          {
            "label": "Ester + acid",
            "layer": "#d1be79"
          }
        ]
      },
      {
        "title": "Đun cách thuỷ",
        "note": "Một phần ester thuỷ phân; phản ứng thuận nghịch nên lớp ester vẫn còn.",
        "vessels": [
          {
            "label": "Ester còn lại",
            "layer": "#d1be79",
            "layerSize": 14,
            "heat": true
          }
        ]
      }
    ],
    "note": "Màu vàng chỉ đánh dấu lớp ester không màu. Bề dày lớp không phải số liệu thể tích."
  },
  "sulfate-three": {
    "title": "Ba mẫu thử tạo sulfate ít tan",
    "phases": [
      {
        "title": "Chuẩn bị",
        "note": "Ống (1): CaCl₂; (2): BaCl₂; (3): Na₂SO₄.",
        "vessels": [
          {
            "label": "(1)"
          },
          {
            "label": "(2)"
          },
          {
            "label": "(3)"
          }
        ]
      },
      {
        "title": "Thêm sulfate vào (1), (2); BaCl₂ vào (3)",
        "note": "Ở nồng độ đã cho, CaSO₄ và BaSO₄ kết tủa trắng.",
        "vessels": [
          {
            "label": "(1) CaSO₄",
            "solid": "#e5e6dd"
          },
          {
            "label": "(2) BaSO₄",
            "solid": "#e5e6dd"
          },
          {
            "label": "(3) BaSO₄",
            "solid": "#e5e6dd"
          }
        ]
      }
    ]
  },
  "zinc-copper-acid": {
    "title": "Zn nối với Cu trong acid loãng",
    "phases": [
      {
        "title": "Chưa nối dây",
        "note": "Kim loại hoạt động phản ứng với acid; Cu riêng lẻ không giải phóng H₂.",
        "vessels": [
          {
            "label": "Zn",
            "metal": "#89959b",
            "gas": "#7da6b8"
          },
          {
            "label": "Cu",
            "metal": "#b96e44"
          }
        ]
      },
      {
        "title": "Nối dây dẫn",
        "note": "Zn bị oxi hoá, electron đi sang Cu; H⁺ nhận electron ở Cu tạo H₂.",
        "vessels": [
          {
            "label": "Zn bị ăn mòn",
            "metal": "#89959b"
          },
          {
            "label": "H₂ trên Cu",
            "metal": "#b96e44",
            "gas": "#7da6b8"
          }
        ]
      }
    ],
    "note": "Hai thanh cùng nhúng trong một cốc acid và nối bằng dây ở bước sau. Các ô tách ra chỉ để thấy rõ hiện tượng tại từng thanh; dùng hình gốc để xem bố trí."
  },
  "aluminium-copper-acid": {
    "title": "Al nối với Cu trong acid loãng",
    "phases": [
      {
        "title": "Chưa nối dây",
        "note": "Kim loại hoạt động phản ứng với acid; Cu riêng lẻ không giải phóng H₂.",
        "vessels": [
          {
            "label": "Al",
            "metal": "#89959b",
            "gas": "#7da6b8"
          },
          {
            "label": "Cu",
            "metal": "#b96e44"
          }
        ]
      },
      {
        "title": "Nối dây dẫn",
        "note": "Al bị oxi hoá, electron đi sang Cu; H⁺ nhận electron ở Cu tạo H₂.",
        "vessels": [
          {
            "label": "Al bị ăn mòn",
            "metal": "#89959b"
          },
          {
            "label": "H₂ trên Cu",
            "metal": "#b96e44",
            "gas": "#7da6b8"
          }
        ]
      }
    ],
    "note": "Hai thanh cùng nhúng trong một cốc acid và nối bằng dây ở bước sau. Các ô tách ra chỉ để thấy rõ hiện tượng tại từng thanh; dùng hình gốc để xem bố trí."
  },
  "iron-acid-copper": {
    "title": "Sắt trong acid khi có thêm CuSO₄",
    "phases": [
      {
        "title": "Hai mẫu sắt trong acid",
        "note": "Cả hai mẫu có H₂ thoát ra.",
        "vessels": [
          {
            "label": "(1) Đối chứng",
            "metal": "#89959b",
            "gas": "#7da6b8"
          },
          {
            "label": "(2)",
            "metal": "#89959b",
            "gas": "#7da6b8"
          }
        ]
      },
      {
        "title": "Mẫu có thêm CuSO₄",
        "note": "Đồng bám trên sắt tạo cặp điện cực, làm sắt bị ăn mòn nhanh hơn.",
        "vessels": [
          {
            "label": "(1)",
            "metal": "#89959b",
            "gas": "#7da6b8"
          },
          {
            "label": "(2) Có đồng bám",
            "metal": "#b96e44",
            "gas": "#7da6b8"
          }
        ]
      }
    ]
  },
  "rust-four": {
    "title": "Bốn điều kiện ăn mòn sắt",
    "phases": [
      {
        "title": "Trong nước muối và không khí",
        "note": "Sắt có thể gỉ; khi tiếp xúc Cu, sắt bị ăn mòn nhanh hơn.",
        "vessels": [
          {
            "label": "(1) Fe",
            "metal": "#89959b",
            "solid": "#a45d38"
          },
          {
            "label": "(3) Fe – Cu",
            "metal": "#a45d38",
            "solid": "#a45d38"
          }
        ]
      },
      {
        "title": "Kẽm bảo vệ; dầu ngăn tiếp xúc",
        "note": "Zn bị oxi hoá trước Fe. Đinh ngập dầu ít tiếp xúc nước và oxygen nên được bảo vệ.",
        "vessels": [
          {
            "label": "(2) Fe – Zn",
            "metal": "#89959b"
          },
          {
            "label": "(4) Fe trong dầu",
            "metal": "#89959b",
            "liquid": "#c2a96550"
          }
        ]
      }
    ],
    "note": "Hình mô tả định tính sau thời gian chờ trong đề; không mô tả lượng gỉ thực tế."
  },
  "rust-two": {
    "title": "Kẽm bảo vệ sắt trong nước muối",
    "phases": [
      {
        "title": "Để trong không khí",
        "note": "So sánh đinh Fe và đinh Fe nối với Zn.",
        "vessels": [
          {
            "label": "(1) Fe",
            "metal": "#89959b"
          },
          {
            "label": "(2) Fe – Zn",
            "metal": "#89959b"
          }
        ]
      },
      {
        "title": "Sau một thời gian",
        "note": "Đinh (1) gỉ; ở đinh (2), Zn bị oxi hoá trước nên bảo vệ Fe.",
        "vessels": [
          {
            "label": "(1) Có gỉ",
            "solid": "#a45d38",
            "metal": "#a45d38"
          },
          {
            "label": "(2) Fe được bảo vệ",
            "metal": "#89959b"
          }
        ]
      }
    ]
  },
  "sulfate-electrolysis": {
    "title": "Điện phân Na₂SO₄ với điện cực trơ",
    "phases": [
      {
        "title": "Đóng mạch",
        "note": "Nước bị điện phân ở hai điện cực.",
        "vessels": [
          {
            "label": "Na₂SO₄"
          }
        ]
      },
      {
        "title": "Quan sát với phenolphthalein",
        "note": "Cathode có H₂ và OH⁻ nên vùng gần cathode hồng; anode có O₂ và H⁺.",
        "vessels": [
          {
            "label": "Anode (+): O₂",
            "gas": "#7da6b8"
          },
          {
            "label": "Cathode (−): H₂",
            "gas": "#7da6b8",
            "liquid": "#df82b0"
          }
        ]
      }
    ],
    "apparatus": "electrolysis"
  },
  "javel": {
    "title": "Điện phân nước muối không có màng ngăn",
    "phases": [
      {
        "title": "Có dòng điện",
        "note": "Cathode giải phóng H₂, anode tạo Cl₂.",
        "vessels": [
          {
            "label": "Anode (+)",
            "gas": "#c9bd64"
          },
          {
            "label": "Cathode (−)",
            "gas": "#7da6b8"
          }
        ]
      },
      {
        "title": "Các sản phẩm tiếp xúc nhau",
        "note": "Cl₂ phản ứng với NaOH tạo NaCl và NaClO. Dung dịch thu được có tính tẩy màu.",
        "vessels": [
          {
            "label": "Dung dịch Javel"
          }
        ]
      }
    ],
    "apparatus": "electrolysis"
  },
  "sodium-magnesium": {
    "title": "Na và Mg với nước ở nhiệt độ thường",
    "phases": [
      {
        "title": "Cho hai kim loại vào nước có chỉ thị",
        "note": "Hai mẫu ở cùng nhiệt độ.",
        "vessels": [
          {
            "label": "Na",
            "metal": "#a7b1b8"
          },
          {
            "label": "Mg",
            "metal": "#a7b1b8"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Na phản ứng rõ, tạo H₂ và màu hồng; Mg phản ứng rất chậm ở nhiệt độ thường.",
        "vessels": [
          {
            "label": "Na",
            "gas": "#7da6b8",
            "liquid": "#df82b0"
          },
          {
            "label": "Mg",
            "metal": "#a7b1b8"
          }
        ]
      }
    ]
  },
  "calcium-barium": {
    "title": "Ca và Ba với nước có chỉ thị",
    "phases": [
      {
        "title": "Hai kim loại phản ứng với nước",
        "note": "Đều giải phóng H₂ và tạo dung dịch có tính base.",
        "vessels": [
          {
            "label": "Ca",
            "gas": "#7da6b8",
            "liquid": "#df82b0"
          },
          {
            "label": "Ba",
            "gas": "#7da6b8",
            "liquid": "#df82b0"
          }
        ]
      },
      {
        "title": "So sánh",
        "note": "Trong điều kiện tương tự, Ba phản ứng mạnh hơn Ca; dùng số liệu đề để so sánh định lượng.",
        "vessels": [
          {
            "label": "Ca"
          },
          {
            "label": "Ba"
          }
        ]
      }
    ]
  },
  "fermentation": {
    "title": "Lên men glucose tạo ethanol",
    "phases": [
      {
        "title": "Ủ với nấm men trong điều kiện thích hợp",
        "note": "Glucose chuyển dần thành ethanol và CO₂.",
        "vessels": [
          {
            "label": "Dịch lên men",
            "gas": "#7da6b8"
          }
        ]
      },
      {
        "title": "Theo dõi theo thời gian",
        "note": "CO₂ thoát ra; lượng ethanol được xác định bằng dữ liệu đo. Quá trình chậm lại khi điều kiện không còn phù hợp.",
        "vessels": [
          {
            "label": "Mẫu sau lên men"
          }
        ]
      }
    ],
    "note": "Sơ đồ chỉ mô tả hiện tượng thoát khí. Đọc đồ thị gốc để xác định tốc độ, thời điểm và hiệu suất; không suy ra số liệu từ số bọt."
  },
  "ester-reflux": {
    "title": "Tổng hợp ester và phân tách sản phẩm",
    "phases": [
      {
        "title": "Gia nhiệt acid và alcohol có xúc tác",
        "note": "Phản ứng tạo ester là thuận nghịch; hơi ngưng tụ được hồi lưu nếu dùng sinh hàn thẳng đứng.",
        "vessels": [
          {
            "label": "Hỗn hợp phản ứng",
            "heat": true
          }
        ]
      },
      {
        "title": "Làm nguội và phân tách",
        "note": "Làm theo quy trình tách của đề. Lớp giàu ester và lớp nước có thể được tách bằng phễu chiết.",
        "vessels": [
          {
            "label": "Hai lớp",
            "layer": "#d1be79"
          }
        ]
      }
    ],
    "note": "Sơ đồ nguyên lí; hình gốc vẫn thể hiện đúng sinh hàn, nhánh dẫn, nhãn dụng cụ và dữ liệu phổ. Màu vàng chỉ đánh dấu lớp hữu cơ."
  },
  "pepsin": {
    "title": "Ảnh hưởng môi trường đến pepsin",
    "phases": [
      {
        "title": "Ban đầu",
        "note": "Ba mẫu albumin đều đục theo dữ liệu đề.",
        "vessels": [
          {
            "label": "(1) HCl",
            "liquid": "#d8ddd8b0"
          },
          {
            "label": "(2) Nước",
            "liquid": "#d8ddd8b0"
          },
          {
            "label": "(3) NaHCO₃",
            "liquid": "#d8ddd8b0"
          }
        ]
      },
      {
        "title": "Sau 20 phút theo bảng",
        "note": "Mẫu acid trong hơn; hai mẫu còn lại vẫn đục.",
        "vessels": [
          {
            "label": "(1) Trong"
          },
          {
            "label": "(2) Đục",
            "liquid": "#d8ddd8b0"
          },
          {
            "label": "(3) Đục",
            "liquid": "#d8ddd8b0"
          }
        ]
      }
    ],
    "note": "Trạng thái lấy từ bảng trong đề. Đồ thị gốc được giữ để so sánh hoạt tính pepsin và chymotrypsin."
  },
  "amylase": {
    "title": "Theo dõi tinh bột bị amylase thuỷ phân",
    "phases": [
      {
        "title": "Lấy giọt mẫu thử với iodine",
        "note": "Khi còn tinh bột, mẫu thử chuyển xanh tím.",
        "vessels": [
          {
            "label": "Còn tinh bột",
            "liquid": "#3c337f"
          }
        ]
      },
      {
        "title": "Tiếp tục lấy mẫu theo thời gian",
        "note": "Khi mẫu không còn cho màu xanh tím với iodine, ghi lại thời gian theo quy trình đề.",
        "vessels": [
          {
            "label": "Không còn phản ứng màu",
            "liquid": "#d1b36b44"
          }
        ]
      }
    ],
    "note": "Iodine được thêm vào mẫu nhỏ lấy ra, không thêm vào toàn bộ hỗn hợp đang ủ. Đồ thị đề cung cấp thời gian đo tại từng pH; hình không tự suy ra pH tối ưu."
  },
  "protease": {
    "title": "Theo dõi protease làm mềm thịt",
    "phases": [
      {
        "title": "Chuẩn bị các mẫu cùng khối lượng",
        "note": "Dùng các nồng độ protease khác nhau, giữ cùng nhiệt độ.",
        "vessels": [
          {
            "label": "Đối chứng",
            "solid": "#b67f75"
          },
          {
            "label": "Có protease",
            "solid": "#b67f75"
          }
        ]
      },
      {
        "title": "Đo độ mềm theo thời gian",
        "note": "Protease phân cắt protein. So sánh lực cắt hoặc thời gian đạt độ mềm bằng số liệu trong đề.",
        "vessels": [
          {
            "label": "Mẫu được kiểm tra",
            "solid": "#b67f7580"
          }
        ]
      }
    ],
    "note": "Hình mô tả bố trí và quá trình phân giải, không mô tả màu thật thay đổi hay thay thế số liệu đồ thị."
  },
  "cellulase": {
    "title": "Theo dõi cellulose bị phân huỷ",
    "phases": [
      {
        "title": "Hai nhóm mẫu bông",
        "note": "Một nhóm có men vi sinh, một nhóm đối chứng không có men.",
        "vessels": [
          {
            "label": "Đối chứng",
            "solid": "#e5e6dd"
          },
          {
            "label": "Có men",
            "solid": "#e5e6dd"
          }
        ]
      },
      {
        "title": "Ủ, lọc, làm khô rồi cân",
        "note": "Mẫu có men giảm lượng bông theo hoạt tính enzyme. So sánh khối lượng ở từng nhiệt độ bằng bảng đề.",
        "vessels": [
          {
            "label": "Bông đối chứng",
            "solid": "#e5e6dd"
          },
          {
            "label": "Bông còn lại",
            "solid": "#e5e6dd77"
          }
        ]
      }
    ],
    "note": "Lượng bông vẽ trong hình chỉ minh hoạ. Không dùng diện tích hạt để tính phần trăm phân huỷ."
  },
  "lactic": {
    "title": "Lên men lactic và chuẩn độ sản phẩm",
    "phases": [
      {
        "title": "Ủ glucose với vi sinh vật",
        "note": "Giữ từng mẫu ở nhiệt độ quy định; có mẫu trắng để đối chứng.",
        "vessels": [
          {
            "label": "Mẫu trắng"
          },
          {
            "label": "Mẫu có vi sinh"
          }
        ]
      },
      {
        "title": "Lấy mẫu, pha loãng và chuẩn độ",
        "note": "Dùng NaOH với phenolphthalein. So sánh thể tích NaOH của từng mẫu theo bảng.",
        "vessels": [
          {
            "label": "Điểm cuối",
            "liquid": "#dea0bb"
          }
        ]
      }
    ],
    "apparatus": "titration",
    "reagent": "NaOH",
    "note": "Lên men lactic trong phản ứng nêu ở đề không tạo CO₂. Màu hồng chỉ xuất hiện trong bước chuẩn độ có phenolphthalein."
  },
  "acid-dilution": {
    "title": "Pha loãng H₂SO₄ đặc",
    "phases": [
      {
        "title": "Chuẩn bị nước",
        "note": "Có sẵn nước trong dụng cụ chịu nhiệt; dùng phương tiện bảo hộ của phòng thí nghiệm.",
        "vessels": [
          {
            "label": "Nước"
          }
        ]
      },
      {
        "title": "Thêm acid từ từ vào nước",
        "note": "Khuấy và làm mát. Hỗn hợp nóng lên do quá trình pha loãng toả nhiệt.",
        "vessels": [
          {
            "label": "Dung dịch nóng lên",
            "heat": true
          }
        ]
      }
    ],
    "note": "Minh hoạ chiều pha đúng: acid vào nước. Không đổ nước vào acid đặc. Hiệu ứng nhiệt không biểu diễn dung dịch sôi hay nhiệt độ cụ thể."
  },
  "sugar-carbon": {
    "title": "H₂SO₄ đặc tác dụng với đường",
    "phases": [
      {
        "title": "Đường ban đầu",
        "note": "Đường có màu trắng.",
        "vessels": [
          {
            "label": "Đường",
            "solid": "#e5e6dd"
          }
        ]
      },
      {
        "title": "Acid đặc lấy nước",
        "note": "Đường hoá nâu rồi đen.",
        "vessels": [
          {
            "label": "Khối carbon",
            "solid": "#303335"
          }
        ]
      },
      {
        "title": "Khối đen nở xốp",
        "note": "Khí và hơi thoát ra làm khối xốp dâng lên.",
        "vessels": [
          {
            "label": "Carbon xốp",
            "solid": "#303335",
            "gas": "#7da6b8"
          }
        ]
      }
    ]
  },
  "iron-sulfur": {
    "title": "Sắt tác dụng với lưu huỳnh",
    "phases": [
      {
        "title": "Hỗn hợp ban đầu",
        "note": "Bột sắt và sulfur chưa phản ứng.",
        "vessels": [
          {
            "label": "Fe và S",
            "solid": "#9f9a51"
          }
        ]
      },
      {
        "title": "Gia nhiệt khởi đầu",
        "note": "Phản ứng toả nhiệt, tạo FeS màu đen. Xét chất dư theo lượng ban đầu trong đề.",
        "vessels": [
          {
            "label": "FeS",
            "solid": "#303335",
            "heat": true
          }
        ]
      }
    ]
  },
  "ammonia-four": {
    "title": "Bốn biến đổi của ammonia có chỉ thị",
    "phases": [
      {
        "title": "Ban đầu",
        "note": "Dung dịch NH₃ có phenolphthalein màu hồng.",
        "vessels": [
          {
            "label": "NH₃ + chỉ thị",
            "liquid": "#df82b0"
          }
        ]
      },
      {
        "title": "Ống (1) và (2)",
        "note": "Đun lâu làm NH₃ thoát đi; thêm đủ HCl trung hoà NH₃. Cả hai mẫu mất hoặc nhạt màu hồng.",
        "vessels": [
          {
            "label": "(1) Đun",
            "heat": true
          },
          {
            "label": "(2) HCl"
          }
        ]
      },
      {
        "title": "Ống (3) và (4)",
        "note": "Na₂CO₃ giữ môi trường base; AlCl₃ dư tiêu thụ NH₃ và tạo Al(OH)₃.",
        "vessels": [
          {
            "label": "(3) Na₂CO₃",
            "liquid": "#df82b0"
          },
          {
            "label": "(4) AlCl₃ dư",
            "solid": "#e5e6dd"
          }
        ]
      }
    ]
  },
  "amine-bromine-compare": {
    "title": "Nước bromine với aniline và methylamine",
    "phases": [
      {
        "title": "Nhỏ bromine vào hai mẫu",
        "note": "Lắc nhẹ theo đề.",
        "vessels": [
          {
            "label": "(1) Aniline"
          },
          {
            "label": "(2) Methylamine"
          }
        ]
      },
      {
        "title": "So sánh hiện tượng",
        "note": "Aniline cho kết tủa trắng 2,4,6-tribromoaniline. Methylamine không tạo kết tủa trắng này.",
        "vessels": [
          {
            "label": "(1)",
            "solid": "#e5e6dd"
          },
          {
            "label": "(2) Không có kết tủa trắng"
          }
        ]
      }
    ]
  },
  "copper-ferric": {
    "title": "Cu trong dung dịch Fe³⁺",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Đồng tiếp xúc dung dịch chứa Fe³⁺.",
        "vessels": [
          {
            "label": "Cu + Fe³⁺",
            "metal": "#b96e44",
            "liquid": "#c4a45655"
          }
        ]
      },
      {
        "title": "Phản ứng oxi hoá – khử",
        "note": "Cu tan thành Cu²⁺; Fe³⁺ bị khử thành Fe²⁺. Không tạo Fe kim loại.",
        "vessels": [
          {
            "label": "Dung dịch sau phản ứng",
            "liquid": "#6eafa777"
          }
        ]
      }
    ]
  },
  "zinc-copper-salt": {
    "title": "Zn nối Cu trong nước muối có oxygen",
    "phases": [
      {
        "title": "Nối hai thanh bằng dây",
        "note": "Zn bị oxi hoá thành Zn²⁺; electron chuyển qua dây sang Cu.",
        "vessels": [
          {
            "label": "Anode: Zn",
            "metal": "#89959b"
          },
          {
            "label": "Cathode: Cu",
            "metal": "#b96e44"
          }
        ]
      },
      {
        "title": "Tại vùng gần Cu",
        "note": "Oxygen hoà tan nhận electron, tạo OH⁻. Phenolphthalein thêm vào vùng này chuyển hồng.",
        "vessels": [
          {
            "label": "Gần Cu có OH⁻",
            "liquid": "#df82b0",
            "metal": "#b96e44"
          }
        ]
      }
    ],
    "note": "Trong dung dịch NaCl không có sẵn Cu²⁺ để bám Cu. Hai thanh thuộc cùng hệ điện hoá; xem hình gốc để đối chiếu ống chữ U."
  },
  "silver-plating": {
    "title": "Mạ bạc bằng điện phân",
    "phases": [
      {
        "title": "Nối nguồn một chiều",
        "note": "Bạc ở anode (+), vật cần mạ ở cathode (−); dung dịch có ion Ag⁺.",
        "vessels": [
          {
            "label": "AgNO₃"
          }
        ]
      },
      {
        "title": "Cho dòng điện chạy",
        "note": "Ag ở anode tan; Ag⁺ nhận electron bám bạc lên vật ở cathode.",
        "vessels": [
          {
            "label": "Anode bạc",
            "metal": "#b8c3ca"
          },
          {
            "label": "Vật được mạ bạc",
            "coat": "#b8c3ca"
          }
        ]
      }
    ],
    "apparatus": "electrolysis"
  },
  "galvanic-zinc-copper": {
    "title": "Pin Zn – Cu",
    "phases": [
      {
        "title": "Hai nửa pin nối bằng cầu muối",
        "note": "Zn trong dung dịch Zn²⁺; Cu trong dung dịch Cu²⁺.",
        "vessels": [
          {
            "label": "Zn / Zn²⁺",
            "metal": "#89959b"
          },
          {
            "label": "Cu²⁺ / Cu",
            "metal": "#b96e44",
            "liquid": "#419bc3"
          }
        ]
      },
      {
        "title": "Nối mạch ngoài",
        "note": "Zn tan và nhường electron qua dây đến Cu. Cu²⁺ nhận electron, đồng bám thêm trên cathode.",
        "vessels": [
          {
            "label": "Zn → Zn²⁺ + 2e⁻",
            "metal": "#89959b"
          },
          {
            "label": "Cu²⁺ + 2e⁻ → Cu",
            "metal": "#b96e44",
            "liquid": "#419bc366"
          }
        ]
      }
    ],
    "note": "Cầu muối khép kín mạch bằng sự chuyển ion; electron đi qua dây dẫn ngoài. Dùng số chỉ volt kế trong đề, không coi hình là phép đo."
  },
  "galvanic-al-lead": {
    "title": "Pin Al – Pb",
    "phases": [
      {
        "title": "Hai nửa pin nối cầu muối",
        "note": "Al nhúng trong Al³⁺; Pb nhúng trong Pb²⁺.",
        "vessels": [
          {
            "label": "Al / Al³⁺",
            "metal": "#aeb9c0"
          },
          {
            "label": "Pb²⁺ / Pb",
            "metal": "#818890"
          }
        ]
      },
      {
        "title": "Nối mạch ngoài",
        "note": "Al nhường electron, Pb²⁺ nhận electron ở điện cực Pb. Electron đi trong dây từ Al sang Pb.",
        "vessels": [
          {
            "label": "Anode: Al",
            "metal": "#aeb9c0"
          },
          {
            "label": "Cathode: Pb",
            "metal": "#818890"
          }
        ]
      }
    ]
  },
  "biuret-unknown": {
    "title": "Mẫu X tạo màu tím với Cu(OH)₂",
    "phases": [
      {
        "title": "Tạo Cu(OH)₂ trong kiềm",
        "note": "Xuất hiện kết tủa xanh.",
        "vessels": [
          {
            "label": "Cu(OH)₂",
            "solid": "#419bc3"
          }
        ]
      },
      {
        "title": "Thêm mẫu X theo đề",
        "note": "Mẫu cho phản ứng màu biuret tạo màu tím.",
        "vessels": [
          {
            "label": "Màu tím",
            "liquid": "#9d6bb2"
          }
        ]
      }
    ]
  },
  "amine-litmus": {
    "title": "Quỳ tím với amine và ammonia",
    "phases": [
      {
        "title": "Cho các mẫu lên quỳ riêng",
        "note": "Methylamine, ethylamine và ammonia có tính base trong nước.",
        "vessels": [
          {
            "label": "Methylamine",
            "paper": "#577ac2"
          },
          {
            "label": "Ethylamine",
            "paper": "#577ac2"
          },
          {
            "label": "NH₃",
            "paper": "#577ac2"
          }
        ]
      },
      {
        "title": "Aniline",
        "note": "Aniline là base rất yếu, không làm quỳ tím đổi màu trong phép thử này.",
        "vessels": [
          {
            "label": "Aniline",
            "paper": "#9e70ad"
          }
        ]
      }
    ]
  },
  "acid-properties": {
    "title": "Một số tính chất của acetic acid",
    "phases": [
      {
        "title": "Giấy quỳ tím",
        "note": "Acetic acid làm quỳ tím ẩm chuyển đỏ.",
        "vessels": [
          {
            "label": "Quỳ chuyển đỏ",
            "paper": "#c86373"
          }
        ]
      },
      {
        "title": "Tác dụng với Mg",
        "note": "Có H₂ thoát ra; Mg tan dần.",
        "vessels": [
          {
            "label": "Mg + acid",
            "gas": "#7da6b8"
          }
        ]
      },
      {
        "title": "Tác dụng với hydrogencarbonate",
        "note": "Có CO₂ thoát ra.",
        "vessels": [
          {
            "label": "Bọt CO₂",
            "gas": "#7da6b8"
          }
        ]
      }
    ]
  },
  "ester-methyl-propionate": {
    "title": "Điều chế methyl propionate theo hình",
    "phases": [
      {
        "title": "Bình (A): gia nhiệt",
        "note": "Methanol và propanoic acid phản ứng có xúc tác H₂SO₄.",
        "vessels": [
          {
            "label": "Hỗn hợp trong A",
            "heat": true
          }
        ]
      },
      {
        "title": "Ống (B): làm lạnh",
        "note": "Hơi đi qua ống dẫn và ngưng tụ ở ống B đặt trong nước đá.",
        "vessels": [
          {
            "label": "Sản phẩm ngưng tụ"
          }
        ]
      }
    ],
    "note": "Minh hoạ hiện tượng; hình gốc giữ nguyên nhãn A, B và đường dẫn hơi."
  },
  "hydrate-heating": {
    "title": "Tách nước kết tinh bằng gia nhiệt",
    "phases": [
      {
        "title": "Cân mẫu và dụng cụ",
        "note": "Ghi khối lượng ban đầu trước khi đun.",
        "vessels": [
          {
            "label": "Muối ngậm nước",
            "solid": "#9fbb98"
          }
        ]
      },
      {
        "title": "Đun nhẹ, để nguội rồi cân",
        "note": "Nước kết tinh thoát ra, khối lượng giảm. Lặp lại đến khi khối lượng không đổi.",
        "vessels": [
          {
            "label": "Mẫu sau gia nhiệt",
            "solid": "#d5d7c7",
            "heat": true
          }
        ]
      }
    ],
    "note": "Không đun quá mạnh gây phân huỷ muối. Đọc khối lượng ở bảng gốc; hình không biểu diễn số phân tử nước kết tinh."
  },
  "sulfur-hydrogen-sulfide": {
    "title": "SO₂ với dung dịch H₂S",
    "phases": [
      {
        "title": "Dẫn SO₂ vào dung dịch H₂S",
        "note": "Phản ứng oxi hoá – khử tạo sulfur.",
        "vessels": [
          {
            "label": "Ban đầu"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Xuất hiện sulfur màu vàng làm dung dịch đục.",
        "vessels": [
          {
            "label": "Sulfur",
            "solid": "#e3ce5e"
          }
        ]
      }
    ]
  },
  "amine-ph": {
    "title": "Đo pH các dung dịch amine",
    "phases": [
      {
        "title": "Chuẩn bị ở cùng điều kiện",
        "note": "Các mẫu cùng nồng độ, cùng nhiệt độ như đề.",
        "vessels": [
          {
            "label": "NH₃"
          },
          {
            "label": "Amine"
          }
        ]
      },
      {
        "title": "Đo từng mẫu",
        "note": "Đọc pH từ máy đo; rửa điện cực giữa các mẫu để tránh lẫn dung dịch.",
        "vessels": [
          {
            "label": "Mẫu đang đo"
          }
        ]
      },
      {
        "title": "So sánh kết quả",
        "note": "Dùng bảng hoặc đồ thị gốc. Không suy ra lực base chỉ từ số nguyên tử carbon.",
        "vessels": [
          {
            "label": "Đối chiếu số liệu"
          }
        ]
      }
    ]
  },
  "aspirin-hydrolysis": {
    "title": "Theo dõi sự thuỷ phân aspirin",
    "phases": [
      {
        "title": "Bắt đầu phản ứng",
        "note": "Aspirin chuyển thành salicylic acid theo điều kiện trong đề.",
        "vessels": [
          {
            "label": "Mẫu ban đầu"
          }
        ]
      },
      {
        "title": "Lấy mẫu theo thời gian",
        "note": "Nồng độ aspirin còn lại được đo ở các thời điểm. Quan sát bằng mắt không cho trực tiếp nồng độ.",
        "vessels": [
          {
            "label": "Mẫu theo thời gian"
          }
        ]
      }
    ],
    "note": "Đây là sơ đồ theo dõi phản ứng, không gán màu cho aspirin hoặc suy ra nồng độ từ hình. Bảng gốc được giữ để tính toán."
  },
  "phenol-base-co2": {
    "title": "Phenol: đục → trong → đục",
    "phases": [
      {
        "title": "Phenol và nước",
        "note": "Theo đề, hỗn hợp ban đầu trắng đục.",
        "vessels": [
          {
            "label": "A",
            "liquid": "#e5e6dda0"
          }
        ]
      },
      {
        "title": "Thêm NaOH",
        "note": "Phenol chuyển thành phenolate tan, hỗn hợp trong hơn.",
        "vessels": [
          {
            "label": "B"
          }
        ]
      },
      {
        "title": "Sục CO₂",
        "note": "Tạo lại phenol, hỗn hợp trắng đục trở lại.",
        "vessels": [
          {
            "label": "C",
            "liquid": "#e5e6dda0"
          }
        ]
      }
    ]
  },
  "ammonia-five": {
    "title": "NH₃ từ ít đến dư với năm dung dịch",
    "phases": [
      {
        "title": "MgCl₂ và AlCl₃",
        "note": "Có hydroxide trắng, không tan trong NH₃ dư.",
        "vessels": [
          {
            "label": "Mg(OH)₂",
            "solid": "#e5e6dd"
          },
          {
            "label": "Al(OH)₃",
            "solid": "#e5e6dd"
          }
        ]
      },
      {
        "title": "AgNO₃ và CuSO₄",
        "note": "Ban đầu xuất hiện kết tủa; NH₃ dư tạo phức tan. Phức bạc không màu, phức đồng xanh đậm.",
        "vessels": [
          {
            "label": "Phức bạc"
          },
          {
            "label": "Phức đồng",
            "liquid": "#2358a7"
          }
        ]
      },
      {
        "title": "Na₂SO₄",
        "note": "Không xuất hiện kết tủa.",
        "vessels": [
          {
            "label": "Dung dịch"
          }
        ]
      }
    ]
  },
  "acid-four": {
    "title": "H₂SO₄ loãng với bốn chất rắn",
    "phases": [
      {
        "title": "CaCO₃ và NaHCO₃",
        "note": "Có CO₂ thoát ra; CaCO₃ còn có thể bị lớp CaSO₄ ít tan che phủ.",
        "vessels": [
          {
            "label": "CaCO₃",
            "gas": "#7da6b8",
            "solid": "#e5e6dd"
          },
          {
            "label": "NaHCO₃",
            "gas": "#7da6b8"
          }
        ]
      },
      {
        "title": "Mg và ZnO",
        "note": "Mg giải phóng H₂; ZnO tan do phản ứng acid–base, không tạo khí.",
        "vessels": [
          {
            "label": "Mg",
            "gas": "#7da6b8"
          },
          {
            "label": "ZnO tan"
          }
        ]
      }
    ]
  },
  "chlorine-bromide": {
    "title": "Chlorine oxi hoá bromide",
    "phases": [
      {
        "title": "Trước phản ứng",
        "note": "Dung dịch bromide ban đầu không màu.",
        "vessels": [
          {
            "label": "Br⁻"
          }
        ]
      },
      {
        "title": "Cho chlorine vào",
        "note": "Br⁻ chuyển thành Br₂, xuất hiện màu vàng nâu tuỳ nồng độ.",
        "vessels": [
          {
            "label": "Br₂",
            "liquid": "#ad733977"
          }
        ]
      }
    ]
  },
  "chlorine-four": {
    "title": "Nước chlorine với bốn dung dịch",
    "phases": [
      {
        "title": "NaBr và KI",
        "note": "Tạo bromine vàng nâu hoặc iodine nâu.",
        "vessels": [
          {
            "label": "Br₂",
            "liquid": "#ad733977"
          },
          {
            "label": "I₂",
            "liquid": "#82533099"
          }
        ]
      },
      {
        "title": "NaOH và FeSO₄",
        "note": "Cl₂ phản ứng với kiềm; Fe²⁺ bị oxi hoá thành Fe³⁺. Màu phụ thuộc nồng độ, không dùng màu để tính lượng chất.",
        "vessels": [
          {
            "label": "Trong kiềm"
          },
          {
            "label": "Fe³⁺",
            "liquid": "#c4a45655"
          }
        ]
      }
    ]
  },
  "carbide-water": {
    "title": "Calcium carbide với nước",
    "phases": [
      {
        "title": "CaC₂ tiếp xúc nước",
        "note": "Phản ứng tạo acetylene và calcium hydroxide.",
        "vessels": [
          {
            "label": "CaC₂",
            "solid": "#7f8585"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Khí C₂H₂ thoát ra; hỗn hợp có thể đục do Ca(OH)₂ ít tan.",
        "vessels": [
          {
            "label": "C₂H₂ và Ca(OH)₂",
            "gas": "#7da6b8",
            "liquid": "#e5e6dd88"
          }
        ]
      }
    ]
  },
  "phenol-alkyne": {
    "title": "Alkyne với bạc trong ammonia",
    "phases": [
      {
        "title": "Alkyne đầu mạch",
        "note": "Acetylene, methylacetylene và ethylacetylene có H liên kết với carbon nối ba đầu mạch, tạo muối bạc kết tủa.",
        "vessels": [
          {
            "label": "Muối bạc",
            "solid": "#d7cf92"
          }
        ]
      },
      {
        "title": "Dimethylacetylene",
        "note": "Không có H ở đầu liên kết ba, không cho kết tủa trong phép thử này.",
        "vessels": [
          {
            "label": "Không kết tủa"
          }
        ]
      }
    ]
  },
  "cellulose-cold": {
    "title": "Thuỷ phân bông rồi thử với CuSO₄ trong kiềm",
    "phases": [
      {
        "title": "Bông trong acid, làm nóng",
        "note": "Cellulose thuỷ phân, bông tan dần.",
        "vessels": [
          {
            "label": "Bông",
            "solid": "#e5e6dd",
            "heat": true
          }
        ]
      },
      {
        "title": "Trung hoà rồi tạo môi trường kiềm",
        "note": "Làm theo chỉ thị quỳ trong đề trước khi thêm CuSO₄.",
        "vessels": [
          {
            "label": "Quỳ xanh",
            "paper": "#577ac2"
          }
        ]
      },
      {
        "title": "Thêm CuSO₄, khuấy ở nhiệt độ thường",
        "note": "Glucose trong sản phẩm thuỷ phân tạo phức đồng màu xanh. Chưa đun bước này nên không minh hoạ Cu₂O đỏ gạch.",
        "vessels": [
          {
            "label": "Phức đồng – glucose",
            "liquid": "#419bc3"
          }
        ]
      }
    ]
  },
  "milk-acid": {
    "title": "Sữa gặp acid từ chanh",
    "phases": [
      {
        "title": "Sữa ban đầu",
        "note": "Casein phân tán trong sữa.",
        "vessels": [
          {
            "label": "Sữa",
            "liquid": "#e5e6ddbb"
          }
        ]
      },
      {
        "title": "Thêm nước chanh",
        "note": "Casein đông tụ, tạo các mảng lợn cợn.",
        "vessels": [
          {
            "label": "Casein đông tụ",
            "liquid": "#e5e6dd55",
            "solid": "#e5e6dd"
          }
        ]
      }
    ]
  },
  "metal-three": {
    "title": "So sánh Cu, Pb, Ag trong dung dịch muối",
    "phases": [
      {
        "title": "Cu + Pb(NO₃)₂",
        "note": "Không có phản ứng thế kim loại trong điều kiện đề.",
        "vessels": [
          {
            "label": "Cu không đổi",
            "metal": "#b96e44"
          }
        ]
      },
      {
        "title": "Pb + AgNO₃",
        "note": "Pb tan; bạc kim loại xuất hiện.",
        "vessels": [
          {
            "label": "Bạc tách ra",
            "metal": "#818890",
            "coat": "#b8c3ca"
          }
        ]
      },
      {
        "title": "Ag + Cu(NO₃)₂",
        "note": "Không có phản ứng thế kim loại trong điều kiện đề.",
        "vessels": [
          {
            "label": "Ag không đổi",
            "metal": "#b8c3ca",
            "liquid": "#419bc3"
          }
        ]
      }
    ]
  },
  "iodometry-copper": {
    "title": "Xác định Cu²⁺ bằng iodometry",
    "phases": [
      {
        "title": "Thêm I⁻ dư",
        "note": "Tạo CuI trắng và iodine làm dung dịch có màu nâu.",
        "vessels": [
          {
            "label": "CuI và I₂",
            "solid": "#e5e6dd",
            "liquid": "#82533099"
          }
        ]
      },
      {
        "title": "Thêm thiosulfate",
        "note": "I₂ bị khử thành I⁻; màu iodine nhạt dần, CuI vẫn còn.",
        "vessels": [
          {
            "label": "Sau chuẩn độ",
            "solid": "#e5e6dd"
          }
        ]
      }
    ],
    "apparatus": "titration",
    "reagent": "S₂O₃²⁻",
    "note": "Không tự thêm chỉ thị tinh bột khi đề không nêu. Thể tích và nồng độ lấy từ dữ kiện đề."
  },
  "alkali-water": {
    "title": "Li, Na, K tác dụng với nước",
    "phases": [
      {
        "title": "Tiếp xúc nước",
        "note": "Đều tạo hydroxide và H₂; mức độ mãnh liệt nhìn chung tăng từ Li đến K.",
        "vessels": [
          {
            "label": "Li",
            "gas": "#7da6b8"
          },
          {
            "label": "Na",
            "gas": "#7da6b8"
          },
          {
            "label": "K",
            "gas": "#7da6b8"
          }
        ]
      }
    ],
    "note": "Hình chỉ so sánh định tính. Không dùng kích thước bọt để tính tốc độ; không mô phỏng mọi mẫu đều bốc cháy."
  },
  "iia-water": {
    "title": "Mg, Ca, Sr, Ba với nước ở nhiệt độ thường",
    "phases": [
      {
        "title": "Mg",
        "note": "Phản ứng rất chậm, khó thấy rõ bằng mắt trong thời gian ngắn.",
        "vessels": [
          {
            "label": "Mg",
            "metal": "#aeb9c0"
          }
        ]
      },
      {
        "title": "Ca, Sr, Ba",
        "note": "Có H₂ thoát ra; nhìn chung phản ứng tăng dần từ Ca đến Ba. Ca(OH)₂ ít tan có thể làm mẫu đục.",
        "vessels": [
          {
            "label": "Ca",
            "gas": "#7da6b8",
            "liquid": "#e5e6dd55"
          },
          {
            "label": "Sr",
            "gas": "#7da6b8"
          },
          {
            "label": "Ba",
            "gas": "#7da6b8"
          }
        ]
      }
    ]
  },
  "hardwater-heat": {
    "title": "Đun nước có độ cứng tạm thời",
    "phases": [
      {
        "title": "Ban đầu",
        "note": "Trong nước có hydrogencarbonate của Ca²⁺ và/hoặc Mg²⁺.",
        "vessels": [
          {
            "label": "Mẫu nước"
          }
        ]
      },
      {
        "title": "Đun nóng",
        "note": "Muối hydrogencarbonate phân huỷ, tạo cặn ít tan và CO₂.",
        "vessels": [
          {
            "label": "Cặn trắng",
            "solid": "#e5e6dd",
            "heat": true,
            "gas": "#7da6b8"
          }
        ]
      }
    ],
    "note": "Xuất hiện cặn khi đun chứng tỏ có thành phần độ cứng tạm thời; chưa đủ để loại trừ độ cứng vĩnh cửu cùng tồn tại."
  },
  "alum-water": {
    "title": "Phèn nhôm làm trong nước",
    "phases": [
      {
        "title": "Nước đục, pH phù hợp",
        "note": "Các hạt nhỏ lơ lửng trong nước.",
        "vessels": [
          {
            "label": "Nước đục",
            "liquid": "#b8a88b88"
          }
        ]
      },
      {
        "title": "Tạo bông keo Al(OH)₃",
        "note": "Bông keo hấp phụ các hạt lơ lửng rồi lắng xuống.",
        "vessels": [
          {
            "label": "Bông cặn lắng",
            "solid": "#c6c4b6"
          }
        ]
      },
      {
        "title": "Phần nước phía trên trong hơn",
        "note": "Tách phần cặn khỏi nước.",
        "vessels": [
          {
            "label": "Nước đã lắng"
          }
        ]
      }
    ],
    "note": "Mô tả cơ chế keo tụ; nước trong hơn không đồng nghĩa đã đủ điều kiện để uống."
  },
  "ammonia-smoke": {
    "title": "Ba hiện tượng của ammonia",
    "phases": [
      {
        "title": "Quỳ tím ẩm",
        "note": "NH₃ tan trong nước trên giấy tạo môi trường base, quỳ chuyển xanh.",
        "vessels": [
          {
            "label": "Quỳ ẩm",
            "paper": "#577ac2"
          }
        ]
      },
      {
        "title": "Hơi NH₃ gặp hơi HCl",
        "note": "Xuất hiện khói trắng gồm các hạt NH₄Cl nhỏ.",
        "vessels": [
          {
            "label": "NH₄Cl",
            "gas": "#d5d9de"
          }
        ]
      },
      {
        "title": "NH₃ vào AlCl₃",
        "note": "Tạo Al(OH)₃ trắng, không tan trong NH₃ dư.",
        "vessels": [
          {
            "label": "Al(OH)₃",
            "solid": "#e5e6dd"
          }
        ]
      }
    ]
  },
  "ammonia-salts": {
    "title": "Trộn bốn cặp dung dịch",
    "phases": [
      {
        "title": "NH₃ + AlCl₃",
        "note": "Tạo Al(OH)₃ trắng.",
        "vessels": [
          {
            "label": "Al(OH)₃",
            "solid": "#e5e6dd"
          }
        ]
      },
      {
        "title": "(NH₄)₂SO₄ + Ba(OH)₂",
        "note": "Tạo BaSO₄ trắng, giải phóng NH₃.",
        "vessels": [
          {
            "label": "BaSO₄ và NH₃",
            "solid": "#e5e6dd",
            "gas": "#7da6b8"
          }
        ]
      },
      {
        "title": "NH₄Cl + AgNO₃",
        "note": "Tạo AgCl trắng.",
        "vessels": [
          {
            "label": "AgCl",
            "solid": "#e5e6dd"
          }
        ]
      },
      {
        "title": "NH₃ + HCl trong dung dịch",
        "note": "Tạo NH₄Cl tan, không tạo kết tủa.",
        "vessels": [
          {
            "label": "Dung dịch NH₄Cl"
          }
        ]
      }
    ]
  },
  "sulfur-burn": {
    "title": "Sulfur cháy và hấp thụ sản phẩm",
    "phases": [
      {
        "title": "Sulfur cháy trong oxygen",
        "note": "Tạo SO₂ không màu; ngọn lửa sulfur có màu xanh.",
        "vessels": [
          {
            "label": "Sulfur",
            "solid": "#d8c643",
            "heat": true
          }
        ]
      },
      {
        "title": "Dẫn sản phẩm vào Ba(OH)₂ dư",
        "note": "Xuất hiện kết tủa BaSO₃ trắng.",
        "vessels": [
          {
            "label": "BaSO₃",
            "solid": "#e5e6dd"
          }
        ]
      }
    ],
    "note": "Giữ đúng điều kiện Ba(OH)₂ dư trong đề; không đồng nhất sulfite với sulfate."
  },
  "zinc-four": {
    "title": "Bốn thí nghiệm Zn, Cu với HCl",
    "phases": [
      {
        "title": "Zn trong HCl",
        "note": "Zn tan, H₂ thoát ra.",
        "vessels": [
          {
            "label": "(1) Zn",
            "metal": "#89959b",
            "gas": "#7da6b8"
          }
        ]
      },
      {
        "title": "Zn + HCl, thêm CuSO₄",
        "note": "Cu bám trên Zn, tạo cặp tiếp xúc; quá trình thoát H₂ rõ hơn.",
        "vessels": [
          {
            "label": "(2) Zn/Cu",
            "metal": "#89959b",
            "coat": "#b96e44",
            "gas": "#7da6b8"
          }
        ]
      },
      {
        "title": "Cu trong HCl",
        "note": "Không có phản ứng giải phóng H₂ trong điều kiện đề.",
        "vessels": [
          {
            "label": "(3) Cu",
            "metal": "#b96e44"
          }
        ]
      },
      {
        "title": "Zn tiếp xúc Cu trong HCl",
        "note": "Zn bị ăn mòn; H₂ thoát ở bề mặt cathode.",
        "vessels": [
          {
            "label": "(4) Cặp Zn–Cu",
            "metal": "#b96e44",
            "gas": "#7da6b8"
          }
        ]
      }
    ]
  },
  "saponin": {
    "title": "Chiết saponin từ bồ kết",
    "phases": [
      {
        "title": "Bồ kết và nước",
        "note": "Gia nhiệt theo điều kiện đề.",
        "vessels": [
          {
            "label": "Bồ kết",
            "solid": "#69543d",
            "heat": true
          }
        ]
      },
      {
        "title": "Dung dịch chiết",
        "note": "Dịch chiết nâu sẫm chứa các chất tan, trong đó có saponin có tính giặt rửa.",
        "vessels": [
          {
            "label": "Dịch bồ kết",
            "liquid": "#705039bb"
          }
        ]
      }
    ]
  },
  "permanganate-two": {
    "title": "Hai chiều thêm dung dịch khi chuẩn độ Fe²⁺",
    "phases": [
      {
        "title": "KMnO₄ vào Fe²⁺ acid",
        "note": "Màu từng giọt thuốc tím mất đi khi Fe²⁺ còn dư. Điểm cuối có màu hồng nhạt bền.",
        "vessels": [
          {
            "label": "Điểm cuối",
            "liquid": "#dfb1cf"
          }
        ]
      },
      {
        "title": "Fe²⁺ acid vào KMnO₄",
        "note": "Màu thuốc tím nhạt dần tới mất màu. Dễ khó nhận ra lượng Fe²⁺ đã thêm dư.",
        "vessels": [
          {
            "label": "Màu tím mất đi"
          }
        ]
      }
    ],
    "note": "Hai bố trí là hai cách trong đề; không xem chúng có độ chính xác như nhau."
  },
  "oxalate-permanganate": {
    "title": "Oxalate với permanganate trong acid",
    "phases": [
      {
        "title": "Khi oxalate còn",
        "note": "Permanganate bị khử, màu tím nhạt đi; tạo CO₂.",
        "vessels": [
          {
            "label": "CO₂",
            "gas": "#7da6b8"
          }
        ]
      },
      {
        "title": "Oxalate hết, dư một ít permanganate",
        "note": "Dung dịch có màu hồng nhạt bền.",
        "vessels": [
          {
            "label": "Điểm cuối",
            "liquid": "#dfb1cf"
          }
        ]
      }
    ],
    "apparatus": "titration",
    "reagent": "KMnO₄",
    "note": "Sơ đồ phản ứng oxi hoá–khử trong môi trường acid. Nhiệt độ, nồng độ và thể tích phải đối chiếu quy trình gốc, không suy từ hình."
  },
  "fermentation-lime": {
    "title": "Lên men glucose và dẫn CO₂ vào nước vôi",
    "phases": [
      {
        "title": "Lên men",
        "note": "Glucose tạo ethanol và CO₂.",
        "vessels": [
          {
            "label": "Hỗn hợp lên men",
            "gas": "#7da6b8"
          }
        ]
      },
      {
        "title": "CO₂ vào nước vôi",
        "note": "Xuất hiện CaCO₃ trắng; nếu CO₂ dư, cặn có thể tan tiếp. Dùng điều kiện và số liệu đề để xét giai đoạn cuối.",
        "vessels": [
          {
            "label": "CaCO₃",
            "solid": "#e5e6dd"
          }
        ]
      }
    ]
  },
  "protein-four": {
    "title": "Bốn phép thử với lòng trắng trứng",
    "phases": [
      {
        "title": "Ống (1): HNO₃",
        "note": "Protein cho phản ứng màu vàng.",
        "vessels": [
          {
            "label": "(1)",
            "solid": "#e9c74c"
          }
        ]
      },
      {
        "title": "Ống (2): Cu(OH)₂",
        "note": "Có màu tím biuret trong môi trường kiềm.",
        "vessels": [
          {
            "label": "(2)",
            "liquid": "#9d6bb2"
          }
        ]
      },
      {
        "title": "Ống (3): NaOH, đun",
        "note": "Protein bị thuỷ phân trong kiềm; sự cắt liên kết không nhìn thấy trực tiếp.",
        "vessels": [
          {
            "label": "(3)",
            "heat": true
          }
        ]
      },
      {
        "title": "Ống (4): đun",
        "note": "Protein đông tụ trắng.",
        "vessels": [
          {
            "label": "(4)",
            "solid": "#e5e6dd",
            "heat": true
          }
        ]
      }
    ]
  },
  "chromate-dichromate": {
    "title": "Chromate chuyển thành dichromate",
    "phases": [
      {
        "title": "Hoà tan, lọc sau nung quặng",
        "note": "Dung dịch chứa chromate có màu vàng.",
        "vessels": [
          {
            "label": "CrO₄²⁻",
            "liquid": "#e5cd48"
          }
        ]
      },
      {
        "title": "Acid hoá theo đề",
        "note": "Cân bằng chuyển về dichromate màu da cam.",
        "vessels": [
          {
            "label": "Cr₂O₇²⁻",
            "liquid": "#d58a36"
          }
        ]
      },
      {
        "title": "Phản ứng với Fe²⁺ trong acid",
        "note": "Cr(VI) bị khử thành Cr³⁺; Fe²⁺ bị oxi hoá thành Fe³⁺. Màu hỗn hợp phụ thuộc nồng độ.",
        "vessels": [
          {
            "label": "Dung dịch sau phản ứng",
            "liquid": "#84995b66"
          }
        ]
      }
    ]
  },
  "flame-alkali": {
    "title": "Màu ngọn lửa của Li⁺, Na⁺, K⁺",
    "phases": [
      {
        "title": "Thử từng mẫu riêng",
        "note": "Màu đặc trưng: lithium đỏ tía, sodium vàng, potassium tím nhạt.",
        "vessels": [
          {
            "label": "Li⁺: đỏ tía",
            "flame": "#d34e70"
          },
          {
            "label": "Na⁺: vàng",
            "flame": "#edbc36"
          },
          {
            "label": "K⁺: tím nhạt",
            "flame": "#ba91de"
          }
        ]
      }
    ],
    "note": "Không dùng độ sáng của hình để suy ra nồng độ. Vết sodium có thể che lấp màu của potassium."
  },
  "flame-unknown": {
    "title": "Hai mẫu X, Y theo kết quả đề",
    "phases": [
      {
        "title": "Thêm phenolphthalein",
        "note": "Cả hai mẫu chuyển hồng theo dữ kiện đã cho.",
        "vessels": [
          {
            "label": "X",
            "liquid": "#df82b0"
          },
          {
            "label": "Y",
            "liquid": "#df82b0"
          }
        ]
      },
      {
        "title": "Trộn X và Y",
        "note": "Xuất hiện kết tủa trắng.",
        "vessels": [
          {
            "label": "Kết tủa",
            "solid": "#e5e6dd"
          }
        ]
      },
      {
        "title": "Thử màu ngọn lửa",
        "note": "Giữ nguyên kí hiệu X, Y để đối chiếu với đề.",
        "vessels": [
          {
            "label": "X: lục",
            "flame": "#85b56c"
          },
          {
            "label": "Y: tím",
            "flame": "#ba91de"
          }
        ]
      }
    ]
  },
  "soap-before-salt": {
    "title": "Đun chất béo với NaOH",
    "phases": [
      {
        "title": "Ban đầu",
        "note": "Chất béo chưa tan trong dung dịch nước.",
        "vessels": [
          {
            "label": "Hai pha",
            "layer": "#dfce8d"
          }
        ]
      },
      {
        "title": "Đun và khuấy",
        "note": "Chất béo bị xà phòng hoá, hỗn hợp dần đồng nhất hơn.",
        "vessels": [
          {
            "label": "Hỗn hợp sau đun",
            "liquid": "#ded7b277",
            "heat": true
          }
        ]
      }
    ],
    "note": "Đề chưa thêm NaCl nên hình không tự thêm bước tách bánh xà phòng nổi lên."
  },
  "ester-extract-ether": {
    "title": "Chiết ester bằng diethyl ether",
    "phases": [
      {
        "title": "Cho hỗn hợp vào phễu chiết",
        "note": "Lắc và để yên theo sơ đồ đề để hai lớp phân tách.",
        "vessels": [
          {
            "label": "Hai lớp",
            "layer": "#dfce8d"
          }
        ]
      },
      {
        "title": "Tách lớp",
        "note": "Lớp hữu cơ chứa ether và ester nhẹ hơn nằm trên; lớp nước nằm dưới. Thu từng lớp riêng.",
        "vessels": [
          {
            "label": "Lớp hữu cơ",
            "liquid": "#dfce8d55"
          },
          {
            "label": "Lớp nước"
          }
        ]
      }
    ],
    "apparatus": "separation",
    "note": "Màu lớp hữu cơ được tô để phân biệt, không phải màu thực của ether hoặc ester. Hình gốc giữ nguyên các nhãn và bước xử lí."
  },
  "starch-follow": {
    "title": "Theo dõi thuỷ phân tinh bột và thử sản phẩm",
    "phases": [
      {
        "title": "Mẫu ban đầu thử iodine",
        "note": "Khi còn tinh bột, mẫu thử có màu xanh tím.",
        "vessels": [
          {
            "label": "Mẫu thử ban đầu",
            "liquid": "#3c337f"
          }
        ]
      },
      {
        "title": "Thuỷ phân hoàn toàn",
        "note": "Mẫu lấy ra không còn tạo màu xanh tím với iodine.",
        "vessels": [
          {
            "label": "Mẫu thử sau thuỷ phân",
            "liquid": "#d1b36b44"
          }
        ]
      },
      {
        "title": "Trung hoà, tạo kiềm rồi thử đồng khi nóng",
        "note": "Sản phẩm chứa glucose khử Cu(II), tạo Cu₂O đỏ gạch.",
        "vessels": [
          {
            "label": "Cu₂O",
            "solid": "#b9532f",
            "heat": true
          }
        ]
      }
    ],
    "note": "Mỗi phép thử dùng phần mẫu tương ứng. Giữ nguyên hướng dẫn thao tác và lượng hoá chất ở đề."
  },
  "copper-unknown-cold": {
    "title": "Chất X hoà tan Cu(OH)₂",
    "phases": [
      {
        "title": "CuSO₄ với NaOH",
        "note": "Xuất hiện Cu(OH)₂ xanh.",
        "vessels": [
          {
            "label": "Cu(OH)₂",
            "solid": "#419bc3"
          }
        ]
      },
      {
        "title": "Thêm X theo đề",
        "note": "Kết tủa tan, dung dịch chuyển xanh lam.",
        "vessels": [
          {
            "label": "Phức tan",
            "liquid": "#419bc3"
          }
        ]
      }
    ],
    "note": "Giữ X là chất chưa biết. Hình biểu diễn hiện tượng đề đã cho, không tự gán X thành glucose hay chất khác."
  },
  "amine-water-gas": {
    "title": "Tính base của methylamine trong hai môi trường",
    "phases": [
      {
        "title": "Trong nước với phenolphthalein",
        "note": "Dung dịch methylamine làm chỉ thị chuyển hồng.",
        "vessels": [
          {
            "label": "CH₃NH₂",
            "liquid": "#df82b0"
          }
        ]
      },
      {
        "title": "Thêm HCl đủ trung hoà",
        "note": "Màu hồng mất đi.",
        "vessels": [
          {
            "label": "Muối tan"
          }
        ]
      },
      {
        "title": "Hơi methylamine gặp hơi HCl",
        "note": "Tạo các hạt muối CH₃NH₃Cl nhỏ, nhìn như khói trắng.",
        "vessels": [
          {
            "label": "Khói muối",
            "gas": "#d5d9de"
          }
        ]
      }
    ]
  },
  "phenolphthalein-four": {
    "title": "Phenolphthalein với bốn mẫu",
    "phases": [
      {
        "title": "NaOH và Ba(OH)₂",
        "note": "Hai dung dịch base làm chỉ thị chuyển hồng.",
        "vessels": [
          {
            "label": "NaOH",
            "liquid": "#df82b0"
          },
          {
            "label": "Ba(OH)₂",
            "liquid": "#df82b0"
          }
        ]
      },
      {
        "title": "HNO₃ và KCl",
        "note": "Chỉ thị không màu trong hai mẫu này.",
        "vessels": [
          {
            "label": "HNO₃"
          },
          {
            "label": "KCl"
          }
        ]
      }
    ]
  },
  "soil-ph": {
    "title": "Đo pH dịch chiết đất",
    "phases": [
      {
        "title": "Trộn đất với nước",
        "note": "Chuẩn bị dịch chiết của mẫu đất.",
        "vessels": [
          {
            "label": "Đất và nước",
            "liquid": "#a3947c66",
            "solid": "#85755d"
          }
        ]
      },
      {
        "title": "Lọc",
        "note": "Tách phần rắn, lấy phần dung dịch để đo.",
        "vessels": [
          {
            "label": "Dịch lọc"
          }
        ]
      },
      {
        "title": "Dùng máy đo pH",
        "note": "Số đo đề cung cấp là 4,52. Không suy pH từ màu dịch lọc.",
        "vessels": [
          {
            "label": "pH = 4,52"
          }
        ]
      }
    ]
  },
  "egg-back-titration": {
    "title": "Xác định carbonate trong vỏ trứng",
    "phases": [
      {
        "title": "Vỏ trứng với HCl dư",
        "note": "CaCO₃ tan và có CO₂ thoát ra.",
        "vessels": [
          {
            "label": "CO₂",
            "gas": "#7da6b8"
          }
        ]
      },
      {
        "title": "Lọc, lấy mẫu định lượng",
        "note": "Lấy đúng thể tích dung dịch A quy định trong đề.",
        "vessels": [
          {
            "label": "Dung dịch A"
          }
        ]
      },
      {
        "title": "Chuẩn độ HCl còn dư bằng NaOH",
        "note": "Dùng lượng acid đã phản ứng để tính lượng carbonate.",
        "vessels": [
          {
            "label": "Sau chuẩn độ"
          }
        ]
      }
    ],
    "apparatus": "titration",
    "reagent": "NaOH",
    "note": "Đề không nêu chỉ thị, nên không tự gán một màu điểm cuối. Các thể tích vẫn lấy từ đề gốc."
  },
  "ammonia-back-titration": {
    "title": "Hấp thụ NH₃ và chuẩn độ acid dư",
    "phases": [
      {
        "title": "NH₃ phản ứng với HCl",
        "note": "NH₃ nhận proton tạo NH₄⁺, nằm trong dung dịch.",
        "vessels": [
          {
            "label": "NH₄⁺ và HCl dư"
          }
        ]
      },
      {
        "title": "Chuẩn độ phần acid dư",
        "note": "Thêm dung dịch NaOH chuẩn; lấy lượng HCl ban đầu trừ lượng còn dư.",
        "vessels": [
          {
            "label": "Sau chuẩn độ"
          }
        ]
      }
    ],
    "apparatus": "titration",
    "reagent": "NaOH",
    "note": "Không tự thêm màu chỉ thị khi đề không nêu loại chỉ thị."
  },
  "kcl-crystallise": {
    "title": "Kết tinh KCl khi làm lạnh",
    "phases": [
      {
        "title": "Dung dịch bão hoà nóng",
        "note": "KCl đang hoà tan trong nước.",
        "vessels": [
          {
            "label": "Dung dịch nóng",
            "heat": true
          }
        ]
      },
      {
        "title": "Để nguội, làm lạnh",
        "note": "Độ tan giảm, tinh thể KCl tách ra.",
        "vessels": [
          {
            "label": "KCl kết tinh",
            "solid": "#e5e6dd"
          }
        ]
      }
    ]
  },
  "oil-hydrogenation": {
    "title": "Hydrogen hoá dầu rồi để nguội",
    "phases": [
      {
        "title": "Dầu với H₂, xúc tác Ni",
        "note": "Liên kết đôi trong gốc acid béo được hydrogen hoá theo điều kiện đề.",
        "vessels": [
          {
            "label": "Dầu ban đầu",
            "liquid": "#d6bf6688",
            "heat": true
          }
        ]
      },
      {
        "title": "Để nguội sau phản ứng",
        "note": "Sản phẩm no có thể rắn ở nhiệt độ thường; trong đề triolein tạo tristearin.",
        "vessels": [
          {
            "label": "Sản phẩm rắn",
            "solid": "#e2dbbf",
            "dry": true
          }
        ]
      }
    ]
  },
  "acid-litmus": {
    "title": "Sulfuric acid loãng với quỳ tím",
    "phases": [
      {
        "title": "Trước thử",
        "note": "Giấy quỳ tím.",
        "vessels": [
          {
            "label": "Quỳ tím",
            "paper": "#9e70ad"
          }
        ]
      },
      {
        "title": "Nhỏ acid loãng",
        "note": "Quỳ chuyển đỏ.",
        "vessels": [
          {
            "label": "Quỳ đỏ",
            "paper": "#c86373"
          }
        ]
      }
    ]
  },
  "nitric-yellow": {
    "title": "Nitric acid đặc để lâu ngả vàng",
    "phases": [
      {
        "title": "Ban đầu",
        "note": "Dung dịch nitric acid tinh khiết không màu.",
        "vessels": [
          {
            "label": "HNO₃"
          }
        ]
      },
      {
        "title": "Khi một phần HNO₃ phân huỷ",
        "note": "NO₂ sinh ra hoà tan trong dung dịch, làm dung dịch vàng hơn.",
        "vessels": [
          {
            "label": "Dung dịch ngả vàng",
            "liquid": "#d8ba5e66"
          }
        ]
      }
    ]
  },
  "copper-oxide-co": {
    "title": "CO khử CuO khi nung nóng",
    "phases": [
      {
        "title": "CuO trước phản ứng",
        "note": "Copper(II) oxide màu đen.",
        "vessels": [
          {
            "label": "CuO",
            "solid": "#303335",
            "dry": true
          }
        ]
      },
      {
        "title": "Dẫn CO qua CuO nóng",
        "note": "CuO bị khử, tạo đồng màu đỏ và CO₂.",
        "vessels": [
          {
            "label": "Cu",
            "solid": "#b96e44",
            "dry": true,
            "heat": true
          }
        ]
      }
    ]
  },
  "iron-two-salts": {
    "title": "Sắt trong hai dung dịch muối",
    "phases": [
      {
        "title": "Fe + Cu(NO₃)₂",
        "note": "Fe tan; Cu màu đỏ bám, màu xanh của Cu²⁺ giảm.",
        "vessels": [
          {
            "label": "Cu bám",
            "metal": "#858d95",
            "coat": "#b96e44",
            "liquid": "#419bc344"
          }
        ]
      },
      {
        "title": "Fe dư + AgNO₃",
        "note": "Fe tan, Ag tách ra. Theo điều kiện Fe dư, dung dịch cuối chứa Fe²⁺.",
        "vessels": [
          {
            "label": "Ag bám",
            "metal": "#858d95",
            "coat": "#b8c3ca"
          }
        ]
      }
    ]
  },
  "sulfate-acid-five": {
    "title": "H₂SO₄ loãng với năm chất",
    "phases": [
      {
        "title": "Ag và Mg",
        "note": "Ag không giải phóng H₂; Mg tan và có H₂.",
        "vessels": [
          {
            "label": "Ag",
            "metal": "#b8c3ca"
          },
          {
            "label": "Mg",
            "gas": "#7da6b8"
          }
        ]
      },
      {
        "title": "NaHSO₃",
        "note": "Acid giải phóng SO₂ không màu.",
        "vessels": [
          {
            "label": "SO₂",
            "gas": "#7da6b8"
          }
        ]
      },
      {
        "title": "BaCl₂ và Ca(OH)₂",
        "note": "BaCl₂ tạo BaSO₄ trắng; Ca(OH)₂ được trung hoà, CaSO₄ ít tan có thể tách ra tuỳ nồng độ.",
        "vessels": [
          {
            "label": "BaSO₄",
            "solid": "#e5e6dd"
          },
          {
            "label": "Mẫu Ca(OH)₂"
          }
        ]
      }
    ]
  },
  "silver-cyanide": {
    "title": "Ag⁺ với CN⁻ từ ít đến dư",
    "phases": [
      {
        "title": "Thêm ít CN⁻",
        "note": "Có thể xuất hiện AgCN trắng.",
        "vessels": [
          {
            "label": "AgCN",
            "solid": "#e5e6dd"
          }
        ]
      },
      {
        "title": "CN⁻ dư",
        "note": "Kết tủa tan do tạo phức [Ag(CN)₂]⁻.",
        "vessels": [
          {
            "label": "Phức tan"
          }
        ]
      }
    ],
    "note": "Chỉ mô tả hiện tượng và phức chất theo câu hỏi; không phải quy trình thực hành."
  },
  "thomson": {
    "title": "Ống tia âm cực của Thomson",
    "phases": [],
    "apparatus": "cathode",
    "note": "Chùm electron phát ra từ cathode; trong điện trường ngang, chùm lệch về bản dương. Đường đi phóng đại để dễ quan sát, không biểu diễn kích thước thực."
  },
  "titration-neutral": {
    "title": "Quan sát một phép chuẩn độ",
    "phases": [
      {
        "title": "Lấy mẫu bằng pipette",
        "note": "Đặt phần dung dịch cần phân tích vào bình tam giác.",
        "vessels": [
          {
            "label": "Mẫu cần phân tích"
          }
        ]
      },
      {
        "title": "Thêm dung dịch chuẩn từ burette",
        "note": "Theo dõi điểm cuối bằng chỉ thị hoặc thiết bị theo đề; đọc thể tích đầu và cuối.",
        "vessels": [
          {
            "label": "Dung dịch sau chuẩn độ"
          }
        ]
      }
    ],
    "apparatus": "titration",
    "note": "Không tự gán chỉ thị hoặc màu điểm cuối. Nồng độ, thể tích và cách xác định điểm cuối phải lấy từ đề."
  },
  "burette-bubble": {
    "title": "Bọt khí ở đầu burette ảnh hưởng số đọc",
    "phases": [
      {
        "title": "Số đọc ban đầu",
        "note": "Đầu burette còn bọt khí, chưa được dung dịch lấp đầy.",
        "vessels": [
          {
            "label": "Có bọt khí",
            "gas": "#7da6b8"
          }
        ]
      },
      {
        "title": "Trong quá trình chuẩn độ",
        "note": "Một phần thể tích đọc được dùng lấp đầy đầu burette, chưa chảy vào bình.",
        "vessels": [
          {
            "label": "Đầu burette được lấp đầy"
          }
        ]
      }
    ],
    "apparatus": "titration",
    "reagent": "NaOH",
    "note": "Nếu không xử lí bọt khí trước khi đọc thể tích đầu, thể tích tính từ hai số đọc lớn hơn lượng thực sự vào bình. Hình bọt chỉ là sơ đồ phóng đại."
  },
  "phenol-bromine": {
    "title": "Phenol với nước bromine",
    "phases": [
      {
        "title": "Nhỏ nước bromine vào phenol",
        "note": "Bromine bị tiêu thụ.",
        "vessels": [
          {
            "label": "Ban đầu",
            "liquid": "#ad733944"
          }
        ]
      },
      {
        "title": "Quan sát",
        "note": "Màu bromine nhạt đi và có kết tủa trắng 2,4,6-tribromophenol.",
        "vessels": [
          {
            "label": "Kết tủa trắng",
            "solid": "#e5e6dd"
          }
        ]
      }
    ]
  },
  "oil-water": {
    "title": "Dầu ăn trong nước",
    "phases": [
      {
        "title": "Lắc hỗn hợp",
        "note": "Dầu phân tán tạm thời thành giọt.",
        "vessels": [
          {
            "label": "Khi lắc",
            "liquid": "#d9d1a777"
          }
        ]
      },
      {
        "title": "Để yên",
        "note": "Dầu không tan, dần tách thành lớp phía trên.",
        "vessels": [
          {
            "label": "Hai lớp",
            "layer": "#d6bf66"
          }
        ]
      }
    ]
  },
  "oil-soap": {
    "title": "Dầu ăn trong dung dịch xà phòng",
    "phases": [
      {
        "title": "Ban đầu",
        "note": "Dầu chưa phân tán đều.",
        "vessels": [
          {
            "label": "Dầu và xà phòng",
            "layer": "#d6bf66"
          }
        ]
      },
      {
        "title": "Lắc đều",
        "note": "Xà phòng giúp dầu phân tán thành các giọt nhỏ, tạo nhũ tương.",
        "vessels": [
          {
            "label": "Nhũ tương",
            "liquid": "#dad8bb99"
          }
        ]
      }
    ]
  },
  "isoamyl-water": {
    "title": "Dầu chuối trong nước",
    "phases": [
      {
        "title": "Thêm isoamyl acetate vào nước",
        "note": "Ester ít tan và nhẹ hơn nước.",
        "vessels": [
          {
            "label": "Hai lớp",
            "layer": "#dfce8d"
          }
        ]
      },
      {
        "title": "Lắc rồi để yên",
        "note": "Sau khi phân tán tạm thời, hai lớp lại tách ra; ester ở trên.",
        "vessels": [
          {
            "label": "Ester trên, nước dưới",
            "layer": "#dfce8d"
          }
        ]
      }
    ],
    "note": "Ester tinh khiết không màu; hình tô lớp trên để dễ phân biệt."
  },
  "sulfur-dioxide-permanganate": {
    "title": "SO₂ làm mất màu thuốc tím",
    "phases": [
      {
        "title": "Thuốc tím ban đầu",
        "note": "Dung dịch có màu tím.",
        "vessels": [
          {
            "label": "MnO₄⁻",
            "liquid": "#9854a8"
          }
        ]
      },
      {
        "title": "Cho SO₂ phản ứng",
        "note": "SO₂ bị oxi hoá; permanganate bị khử thành Mn²⁺ theo phương trình đề, màu tím nhạt đi.",
        "vessels": [
          {
            "label": "Dung dịch nhạt màu"
          }
        ]
      }
    ]
  }
}
