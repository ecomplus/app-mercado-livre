const faker = require('faker')

faker.locale = 'pt_BR'
const name = faker.commerce.productName()

exports.productWithVariations = {
  "visible": true,
  "available": true,
  "manage_stock": true,
  "name": name,
  "sku": "IVO4131",
  "quantity": faker.random.number(100),
  "price": parseFloat(faker.commerce.price()),
  "cost_price": 30,
  "pictures": [
    {
      "zoom": {
        "url": faker.random.image(),
        "size": "379x304",
        "alt": "WomenRecurrent_dashcard_379x304._SY304_CB410112290_"
      },
      "big": {
        "url": faker.random.image(),
        "size": "379x304",
        "alt": "WomenRecurrent_dashcard_379x304._SY304_CB410112290_"
      },
      "normal": {
        "url": faker.random.image(),
        "size": "350x281",
        "alt": "WomenRecurrent_dashcard_379x304._SY304_CB410112290_"
      },
      "_id": "799020160339439994400000"
    },
    {
      "zoom": {
        "url": faker.random.image(),
        "size": "640x426",
        "alt": "young-woman-1745173_640"
      },
      "big": {
        "url": faker.random.image(),
        "size": "640x426",
        "alt": "young-woman-1745173_640"
      },
      "normal": {
        "url": faker.random.image(),
        "size": "350x233",
        "alt": "young-woman-1745173_640"
      },
      "_id": "277060160339437748300000"
    },
    {
      "zoom": {
        "url": faker.random.image(),
        "size": "824x789",
        "alt": "Captura de tela de 2020-06-23 18-28-46"
      },
      "big": {
        "url": faker.random.image(),
        "size": "700x670",
        "alt": "Captura de tela de 2020-06-23 18-28-46"
      },
      "normal": {
        "url": faker.random.image(),
        "size": "350x335",
        "alt": "Captura de tela de 2020-06-23 18-28-46"
      },
      "_id": "502680159294781069200000"
    },
    {
      "zoom": {
        "url": faker.random.image(),
        "size": "797x796",
        "alt": "Captura de tela de 2020-06-23 18-29-21"
      },
      "big": {
        "url": faker.random.image(),
        "size": "700x699",
        "alt": "Captura de tela de 2020-06-23 18-29-21"
      },
      "normal": {
        "url": faker.random.image(),
        "size": "350x350",
        "alt": "Captura de tela de 2020-06-23 18-29-21"
      },
      "_id": "502680159294781069200001"
    }
  ],
  "categories": [
    {
      "_id": "5ef270aa14ff772fde7adb4f",
      "name": "Vestido",
      "slug": "vestido"
    },
    {
      "_id": "5f356a91f023684cdbda16f8",
      "name": "Vestido com manga cuta",
      "slug": "vestido/manga-cuta"
    },
    {
      "_id": "5ef26c6214ff772fde7ada74",
      "name": "Bebês",
      "slug": "bebes"
    }
  ],
  "slug": faker.lorem.slug(),
  "commodity_type": "physical",
  "ad_relevance": 0,
  "currency_id": "BRL",
  "currency_symbol": "R$",
  "condition": "new",
  "adult": false,
  "auto_fill_related_products": true,
  "body_html": faker.commerce.productDescription(),
  "weight": {
    "value": 100,
    "unit": "g"
  },
  "dimensions": {
    "width": {
      "value": 30,
      "unit": "cm"
    },
    "height": {
      "value": 15,
      "unit": "cm"
    },
    "length": {
      "value": 60,
      "unit": "cm"
    }
  },
  "base_price": parseFloat(faker.commerce.price()),
  "variations": [
    {
      "name": name,
      "picture_id": "277060160339437748300000",
      "price": parseFloat(faker.commerce.price()),
      "quantity": faker.random.number(100),
      "_id": "957090160375051881100003",
      "specifications": {
        "size": [
          {
            "text": "M",
            "value": "m"
          }
        ],
        "colors": [
          {
            "text": "Azul",
            "value": "#0000ff"
          }
        ]
      },
      "sku": "IVO4131-801-1",
      "base_price": 45
    },
    {
      "name": name,
      "picture_id": "799020160339439994400000",
      "quantity": faker.random.number(100),
      "sku": "IVO4131-297-2",
      "_id": "957090160375051881100006",
      "specifications": {
        "size": [
          {
            "text": "M",
            "value": "m"
          }
        ],
        "colors": [
          {
            "text": "Branco",
            "value": "#ffffff"
          }
        ]
      },
      "base_price": 45,
      "price": parseFloat(faker.commerce.price())
    },
    {
      "name": name,
      "sku": "IVO4131-584-3",
      "_id": "957090160375051881100007",
      "specifications": {
        "size": [
          {
            "text": "G",
            "value": "l"
          }
        ],
        "colors": [
          {
            "text": "Azul",
            "value": "#0000ff"
          }
        ]
      },
      "quantity": faker.random.number(100),
      "base_price": 45,
      "price": parseFloat(faker.commerce.price())
    },
    {
      "_id": "957090160375051881100008",
      "specifications": {
        "size": [
          {
            "text": "G",
            "value": "l"
          }
        ],
        "colors": [
          {
            "text": "Branco",
            "value": "#ffffff"
          }
        ]
      },
      "name": name,
      "sku": "IVO4131-995-4",
      "quantity": faker.random.number(100),
      "base_price": 45,
      "price": parseFloat(faker.commerce.price())
    },
    {
      "_id": "957090160375051881100009",
      "specifications": {
        "size": [
          {
            "text": "p",
            "value": "s"
          }
        ],
        "colors": [
          {
            "text": "Azul",
            "value": "#0000ff"
          }
        ]
      },
      "name": name,
      "sku": "IVO4131-455-5",
      "quantity": faker.random.number(100),
      "base_price": 45,
      "price": parseFloat(faker.commerce.price())
    },
    {
      "_id": "957090160375051881100010",
      "specifications": {
        "size": [
          {
            "text": "p",
            "value": "s"
          }
        ],
        "colors": [
          {
            "text": "Branco",
            "value": "#ffffff"
          }
        ]
      },
      "name": name,
      "sku": "IVO4131-948-6",
      "base_price": 45,
      "price": parseFloat(faker.commerce.price())
    }
  ]
}