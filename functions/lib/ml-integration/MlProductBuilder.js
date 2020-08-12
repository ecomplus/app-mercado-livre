const ProductBuilder = require('./ProductBuilder')

class MlProductBuilder extends ProductBuilder {
  constructor(productSchema, mlInstance) {
    super(productSchema)
    this.mlInstance = mlInstance
    this._attributes = []
    this._variations = []
  }

  buildTitle() {
    this.product.title = this.productSchema.name
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
    const sources = []
    if (pictures && pictures.length > 0) {
      pictures.map(({ small, normal, big, zoom }) => {
        sources.push({ source: small.url })
        sources.push({ source: normal.url })
        sources.push({ source: big.url })
        sources.push({ source: zoom.url })
      })
      this.product.pictures = sources
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

  buildGtin() {
    const { gtin } = this.productSchema
    if (gtin && gtin.length > 0) {
      for (const item of gtin) {
        this._attributes.push({ id: 'GTIN', value_name: item })
      }
    }
  }

  buildBrand() {
    const { brands } = this.productSchema
    if (brands && brands.length > 0) {
      for (const { name } of brands) {
        this._attributes.push({ id: 'BRAND', value_name: name })
      }
    }
  }

  buildDimensions() {
    const { dimensions } = this.productSchema
    if (dimensions) {
      this.buildWidth(dimensions)
      this.buildHeight(dimensions)
      this.buildLength(dimensions)
    }
  }

  buildHeight(dimensions) {
    if (dimensions.height) {
      const { value, unit } = dimensions.height
      this._attributes.push(
        {
          id: 'HEIGHT',
          value_name: `${value}${unit}`,
          value_struct: {
            "number": value,
            "unit": unit
          }
        })
    }
  }

  buildWidth(dimensions) {
    if (dimensions.width) {
      const { value, unit } = dimensions.width
      this._attributes.push({
        id: 'WIDTH',
        value_name: `${value}${unit}`,
        value_struct: {
          "number": value,
          "unit": unit
        }
      })
    }
  }

  buildModel(specifications) {
    const variations = ['model', 'modelo']
    for (const key of Object.keys(specifications)) {
      if (variations.includes(key)) {
        for (const model of specifications[key]) {
          this._attributes.push({
            id: 'MODEL',
            value_name: model.text,
          })
        }
      }
    }
  }

  buildMaterial(specifications) {
    const variations = ['material']
    for (const key of Object.keys(specifications)) {
      if (variations.includes(key)) {
        for (const material of specifications[key]) {
          this._attributes.push({
            id: 'MATERIAL',
            value_name: material.text,
          })
        }
      }
    }
  }

  buildSpecifications() {
    const { specifications } = this.productSchema
    if (specifications) {
      this.buildModel(specifications)
      this.buildMaterial(specifications)
    }
  }

  buildLength(dimensions) {
    if (dimensions.length) {
      const { value, unit } = dimensions.length
      this._attributes.push(
        {
          id: 'LENGTH',
          value_name: `${value}${unit}`,
          value_struct: {
            "number": value,
            "unit": unit
          }
        }
      )
    }
  }

  buildWeight() {
    const { weight } = this.productSchema
    if (weight) {
      const { value, unit } = weight
      this._attributes.push({
        id: "WEIGHT",
        value_name: `${value}${unit}`,
        value_struct: {
          "number": value,
          "unit": unit
        }
      })
    }
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
    console.log(JSON.stringify(this.getProduct(), null, 2))
    return this.mlInstance.post('/items', this.getProduct(), (err, res) => {
      console.log('[ERROR]', err, res)
      return callback(err, res)
    })
  }
}

module.exports = MlProductBuilder

