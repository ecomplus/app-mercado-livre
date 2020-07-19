const getMeliInstance = require('./get-meli-instance')

class MLProduct {
  constructor(admin, storeId, ecomProduct) {
    this.admin = admin
    this.storeId = storeId
    this.ecomProduct = ecomProduct
  }

  get title() {
    // Todo: check max_title_length by category
    return this.ecomProduct.name
  }

  get description() {
    return { plain_text: this.ecomProduct.name }
  }

  get condition() {
    return this.ecomProduct.condition
  }

  get available_quantity() {
    return this.ecomProduct.quantity
  }

  get pictures() {
    const { pictures } = this.ecomProduct
    if (pictures && pictures.length > 0) {
      const mlPictures = pictures.map(({ small }) => ({ source: small.url }))
      mlPictures.concat(pictures.map(({ normal }) => ({ source: normal.url })))
      mlPictures.concat(pictures.map(({ big }) => ({ source: big.url })))
      return mlPictures
    }
    return []
  }

  get category_id() {
    // Todo: check how to parser
    return 'MLB272126'
  }

  get buying_mode() {
    return 'buy_it_now'
  }

  get price() {
    return this.ecomProduct.price
  }

  get currency_id() {
    return "BRL"
  }

  get payment_methods() {
    // Todo: checkar how to works
    return []
  }

  get listing_type_id() {
    // Todo: checko how to work
    return 'gold_special'
  }

  get video() {
    // Todo: check if exists video in ecom product
    return []
  }

  get sale_terms() {
    // Todo: check how to work
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
          // video: this.video,
          sale_terms: this.sale_terms,
          pictures: this.pictures,
          // atrributes: this.atrributes,
          currency_id: this.currency_id
        }

        console.log('[ML-INTEGRATION:SALVE PRODUCT  ]', mlPayload, this.ecomProduct, this.storeId)
        // return resolve(mlPayload)
        return getMeliInstance(this.admin, this.storeId).then(instance => {
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
