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
    return ''
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
    return ''
  }

  get sale_terms() {
    // Todo: check how to work
    return []
  }

  get pictures() {
    return this.ecomProduct.pictures
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
        const {
          title,
          price,
          category_id,
          available_quantity,
          buying_mode,
          condition,
          listing_type_id,
          description,
          video,
          sale_terms,
          pictures,
          atrributes
        } = this
        const mlPayload = {
          title,
          price,
          category_id,
          available_quantity,
          buying_mode,
          condition,
          listing_type_id,
          description,
          video,
          sale_terms,
          pictures,
          atrributes
        }

        console.log('[ML-INTEGRATION:SALVE PRODUCT  ]', mlPayload, this.storeId)
        return resolve(mlPayload)
        // getMeliInstance(this.admin, this.storeId).then(instance => {
        //   return instance.post('/items', mlPayload, (err, res) => {
        //     console.log('[ML - MELI SAVE]', err, res)
        //     return resolve(true)
        //   })
        // }).catch((err) => { reject(err) })
      } catch (error) {
        console.error('[ML-INTEGRATION:SALVE PRODUCT]', error)
        reject(error)
      }
    })
  }

}

module.exports = MLProduct
