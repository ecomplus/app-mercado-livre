const ProductBuilder = require('./ProductBuilder')

class MlProductBuilder extends ProductBuilder {
  constructor(productSchema, mlInstance) {
    super(productSchema)
    this.mlInstance = mlInstance
    this._attributes = []
  }

  buildTitle() {
    this.product.title = this.productSchema.name
  }

  buildGtin() {
    const { gtin } = this.productSchema
    if (gtin && gtin.length > 0) {
      this._attributes.push({ "id": "GTIN", "value_name": gtin })
    }
  }

  buildDescription() {
    this.product.description = this.productSchema.body_html.replace(/<[^>]*>?/gm, '');
  }

  buildCondition() {
    this.product.condition = this.productSchema.condition
  }

  buildAvailableQuantity() {
    this.product.available_quantity = this.productSchema.quantity
  }

  buildListingTypes() {
    this.product.listing_type_id = 'gold_special'
  }

  buildCategory() {
    this.product.category_id = 'MLB272126'
  }

  buildCurrency() {
    this.product.currency_id = this.productSchema.currency_id
  }

  buildPrice() {
    this.product.price = this.productSchema.price
  }

  buildPictures() {
    const { pictures } = this.productSchema
    if (pictures && pictures.length > 0) {
      this.product.pictures = pictures.map(({ small }) => ({ source: small.url }))
      this.product.pictures.concat(pictures.map(({ normal }) => ({ source: normal.url })))
      this.product.pictures.concat(pictures.map(({ big }) => ({ source: big.url })))
    }
  }

  buildVariations() {
    this.product.variations = [
      {
        id: 'SELLER_SKU',
        value_name: this.productSchema.sku
      }
    ]
  }

  buildSellerCustomField() {
    this.product.seller_custom_field = this.productSchema.sku
  }

  buildAttributes() {
    if (this._attributes.length > 0) {
      this.product.attributes = this._attributes
    }
  }

  update(callback) {
    const { metafields } = this.productSchema
    const mlId = (metafields || []).find(({ field }) => field === 'ml_id')
    if (!mlId) {
      return callback(new Error('ml_id was not found in metafields'))
    }
    return this.mlInstance.put(`/items/${mlId.value}`, this.getProduct(), (err, res) => {
      return callback(err, res)
    })
  }

  create(callback) {
    console.log(JSON.stringify(this.getProduct()))
    return this.mlInstance.post('/items', this.getProduct(), (err, res) => {
      console.log('[ERROR]', err, res)
      return callback(err, res)
    })
  }
}

module.exports = MlProductBuilder

