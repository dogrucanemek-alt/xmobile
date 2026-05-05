import * as FileSystem from 'expo-file-system';

const ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';

// Anahtar kelime → tür (substring eşleşme için öncelik sırasına göre)
const TUR_KURALLAR: Array<{ anahtar: string; tur: string; ad: string }> = [
  // Alt giyim — önce kontrol et (pants içeren etiketler üst'e düşmesin)
  { anahtar: 'trouser',  tur: 'Alt',       ad: 'Pantolon'        },
  { anahtar: 'pant',     tur: 'Alt',       ad: 'Pantolon'        },
  { anahtar: 'jean',     tur: 'Alt',       ad: 'Jean'            },
  { anahtar: 'denim',    tur: 'Alt',       ad: 'Kot'             },
  { anahtar: 'skirt',    tur: 'Alt',       ad: 'Etek'            },
  { anahtar: 'short',    tur: 'Alt',       ad: 'Şort'            },
  { anahtar: 'legging',  tur: 'Alt',       ad: 'Tayt'            },
  { anahtar: 'chino',    tur: 'Alt',       ad: 'Pantolon'        },
  { anahtar: 'cargo',    tur: 'Alt',       ad: 'Kargo Pantolon'  },
  { anahtar: 'sweatpant',tur: 'Alt',       ad: 'Eşofman Altı'   },
  // Dış giyim
  { anahtar: 'jacket',   tur: 'Dış Giyim', ad: 'Ceket'          },
  { anahtar: 'coat',     tur: 'Dış Giyim', ad: 'Kaban'          },
  { anahtar: 'blazer',   tur: 'Dış Giyim', ad: 'Blazer'         },
  { anahtar: 'raincoat', tur: 'Dış Giyim', ad: 'Yağmurluk'      },
  { anahtar: 'trench',   tur: 'Dış Giyim', ad: 'Trençkot'       },
  { anahtar: 'parka',    tur: 'Dış Giyim', ad: 'Parka'          },
  { anahtar: 'overcoat', tur: 'Dış Giyim', ad: 'Palto'          },
  { anahtar: 'windbreak',tur: 'Dış Giyim', ad: 'Rüzgarlık'      },
  // Ayakkabı
  { anahtar: 'sneaker',  tur: 'Ayakkabı',  ad: 'Spor Ayakkabı'  },
  { anahtar: 'boot',     tur: 'Ayakkabı',  ad: 'Bot'            },
  { anahtar: 'sandal',   tur: 'Ayakkabı',  ad: 'Sandalet'       },
  { anahtar: 'loafer',   tur: 'Ayakkabı',  ad: 'Loafer'         },
  { anahtar: 'heel',     tur: 'Ayakkabı',  ad: 'Topuklu'        },
  { anahtar: 'shoe',     tur: 'Ayakkabı',  ad: 'Ayakkabı'       },
  { anahtar: 'footwear', tur: 'Ayakkabı',  ad: 'Ayakkabı'       },
  // Aksesuar
  { anahtar: 'handbag',  tur: 'Aksesuar',  ad: 'El Çantası'     },
  { anahtar: 'bag',      tur: 'Aksesuar',  ad: 'Çanta'          },
  { anahtar: 'hat',      tur: 'Aksesuar',  ad: 'Şapka'          },
  { anahtar: 'cap',      tur: 'Aksesuar',  ad: 'Şapka'          },
  { anahtar: 'belt',     tur: 'Aksesuar',  ad: 'Kemer'          },
  { anahtar: 'scarf',    tur: 'Aksesuar',  ad: 'Atkı'           },
  { anahtar: 'glasses',  tur: 'Aksesuar',  ad: 'Gözlük'         },
  { anahtar: 'watch',    tur: 'Aksesuar',  ad: 'Saat'           },
  // Üst giyim
  { anahtar: 'hoodie',   tur: 'Üst',       ad: 'Kapüşonlu'      },
  { anahtar: 'sweatshirt',tur: 'Üst',      ad: 'Sweatshirt'     },
  { anahtar: 'sweater',  tur: 'Üst',       ad: 'Kazak'          },
  { anahtar: 'cardigan', tur: 'Üst',       ad: 'Hırka'          },
  { anahtar: 'blouse',   tur: 'Üst',       ad: 'Bluz'           },
  { anahtar: 'shirt',    tur: 'Üst',       ad: 'Gömlek'         },
  { anahtar: 't-shirt',  tur: 'Üst',       ad: 'Tişört'         },
  { anahtar: 'tshirt',   tur: 'Üst',       ad: 'Tişört'         },
  { anahtar: 'jersey',   tur: 'Üst',       ad: 'Forma'          },
  { anahtar: 'vest',     tur: 'Üst',       ad: 'Yelek'          },
  { anahtar: 'top',      tur: 'Üst',       ad: 'Üst'            },
];

export async function kiyafetTani(
  imageUri: string,
  apiKey: string,
): Promise<{ ad: string; tur: string }> {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: 'base64',
  });

  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { content: base64 },
        features: [{ type: 'LABEL_DETECTION', maxResults: 20 }],
      }],
    }),
  });

  const data = await res.json();
  const labels: string[] = (data.responses?.[0]?.labelAnnotations ?? [])
    .map((l: { description: string }) => l.description.toLowerCase());

  // Her label için TUR_KURALLAR'daki her anahtarı substring olarak dene
  for (const label of labels) {
    for (const kural of TUR_KURALLAR) {
      if (label.includes(kural.anahtar)) {
        return { ad: kural.ad, tur: kural.tur };
      }
    }
  }

  return { ad: 'Yeni Kıyafet', tur: 'Üst' };
}
