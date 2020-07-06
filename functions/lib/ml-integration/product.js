const getMeliInstance = require('./get-meli-instance')

class MLProduct {
  constructor(admin, storeId, ecomProduct) {
    this.admin = admin
    this.storeId = storeId
    this.ecomProduct = ecomProduct
  }

  get title() {
    return this.ecomProduct.name
  }

  get price() {
    return this.ecomProduct.price
  }

  get category_id() {
    // Todo: check how to parser
    return 'MLB272126'
  }

  get available_quantity() {
    return this.ecomProduct.quantity
  }

  get buying_mode() {
    // Todo: check how to work
    return 'buy_it_now'
  }

  get condition() {
    return this.ecomProduct.condition
  }

  get listing_type_id() {
    // Todo: checko how to work
    return 'gold_special'
  }

  get description() {
    return { plain_text: this.ecomProduct.body_html }
  }

  get video() {
    // Todo: check if exists video in ecom product
    return []
  }

  get sale_terms() {
    // Todo: check how to work
    return []
  }

  get pictures() {
    const { pictures } = this.ecomProduct
    if (pictures && pictures.length > 0) {
      return pictures.map(({ big }) => ({ source: big.url }))
    }
    return []
  }

  get atrributes() {
    // Todo: check what prodcts have
    return [
      {
        id: 'BRAND',
        value_name: "Product Brand"
      },
      {
        id: 'EAN',
        value: '7898095297749'
      }
    ]
  }

  get currency_id() {
    return "BRL"
  }

  save() {
    return new Promise((resolve, reject) => {
      try {
        const mlPayload = {
          title: this.title,
          price: this.price,
          category_id: this.category_id,
          available_quantity: this.available_quantity,
          buying_mode: this.buying_mode,
          condition: this.condition,
          listing_type_id: this.listing_type_id,
          description: this.description,
          video: this.video,
          sale_terms: this.sale_terms,
          pictures: this.pictures,
          atrributes: this.atrributes,
          currency_id: this.currency_id
        }

        console.log('[ML-INTEGRATION:SALVE PRODUCT  ]', mlPayload, this.ecomProduct, this.storeId)
        // return resolve(mlPayload)
        getMeliInstance(this.admin, this.storeId).then(instance => {
          return instance.post('/items', mlPayload, (err, res) => {
            console.log('[ML - MELI SAVE]', err, res)
            return resolve(true)
          })
        }).catch((err) => { reject(err) })
      } catch (error) {
        console.error('[ML-INTEGRATION:SALVE PRODUCT]', error)
        reject(error)
      }
    })
  }

}

module.exports = MLProduct
