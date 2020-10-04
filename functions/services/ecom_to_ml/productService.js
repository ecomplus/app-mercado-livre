const { app } = require('firebase-admin')
const meli = require('mercadolibre')
const { ml } = require('firebase-functions').config()
const qs = require('qs')

class MLProductService {
  constructor(admin, appSdk, storeId, ecomSchema, options = {}) {
    this.product = {}
    this.ecomSchema = ecomSchema
    this.options = options
    this.admin = admin
    this.appSdk = appSdk
    this.storeId = storeId
    this._attributes = []
    this._variations = []
  }

  getSpecByProps(specs, props) {
    if (!specs) return {}
    for (let i = 0; i < props.length; i++) {
      if (specs[props[i]]) {
        return specs[props[i]][0]
      }
    }
    return {}
  }

  buildTitle() {
    this.product.title = this.ecomSchema.name
  }

  buildDescription() {
    this.product.description = (this.ecomSchema.body_html || '').replace(/<[^>]*>?/gm, '');
  }

  buildCondition() {
    this.product.condition = this.ecomSchema.condition
  }

  buildAvailableQuantity() {
    this.product.available_quantity = this.ecomSchema.quantity
  }

  buildListingTypes() {
    this.product.listing_type_id = this.options.listing_type_id
  }

  buildCategory() {
    this.product.category_id = this.options.category_id
  }

  buildCurrency() {
    this.product.currency_id = this.ecomSchema.currency_id
  }

  buildPrice() {
    this.product.price = this.ecomSchema.price
  }

  buildPictures() {
    const { pictures } = this.ecomSchema
    const sources = []
    if (pictures && pictures.length > 0) {
      pictures.map(({ small, normal, big, zoom }) => {
        const urls = [small || [], normal || [], big || [], zoom || []].map(({ url }) => url)
        console.log(urls)
        urls.forEach(url => {
          if (url) sources.push({ source: url })
        })
      })
      this.product.pictures = sources
    }
  }

  buildVariations() {
    this.product.variations = [
      {
        id: 'SELLER_SKU',
        value_name: this.ecomSchema.sku
      }
    ]
  }

  buildSellerCustomField() {
    this.product.seller_custom_field = this.ecomSchema.sku
  }

  buildGtin() {
    const { gtin } = this.ecomSchema
    if (gtin && gtin.length > 0) {
      for (const item of gtin) {
        this._attributes.push({ id: 'GTIN', value_name: item })
      }
    }
  }

  buildBrand() {
    const { brands } = this.ecomSchema
    if (brands && brands.length > 0) {
      for (const { name } of brands) {
        this._attributes.push({ id: 'BRAND', value_name: name })
      }
    }
  }

  buildDimensions() {
    const { dimensions } = this.ecomSchema
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
    this._attributes.push({
      id: 'MODEL',
      value_name: this.getSpecByProps(specifications, variations).text,
    })
  }

  buildMaterial(specifications) {
    const variations = ['material']
    this._attributes.push({
      id: 'MATERIAL',
      value_name: this.getSpecByProps(specifications, variations).text,
    })
  }

  buildGender(specifications) {
    const variations = ['gender', 'genero', 'gênero', 'genre', 'sexo']
    const gender = this.getSpecByProps(specifications, variations).text
    if (gender) {
      this._attributes.push({
        id: 'GENDER',
        value_name: gender
      })
    }
  }

  buildLengthType(specifications) {
    const variations = ['tipo_de_cumprimento', 'tipo_cumprimento', 'length_type']
    const lengthType = this.getSpecByProps(specifications, variations).text
    if (lengthType) {
      this._attributes.push({
        id: 'LENGTH_TYPE',
        value_name: lengthType
      })
    }
  }

  buildUnitsPerPckage(specifications) {
    this._attributes.push({
      id: 'UNITS_PER_PACKAGE',
      value_name: this.getSpecByProps(specifications, ['package_quantity']).text || 1
    })
  }

  buildSpecifications() {
    const { specifications } = this.ecomSchema
    if (specifications) {
      this.buildModel(specifications)
      this.buildMaterial(specifications)
      this.buildUnitsPerPckage(specifications)
      this.buildGender(specifications)
      this.buildLengthType(specifications)
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
    const { weight } = this.ecomSchema
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

  async getProduct() {
    try {
      this.buildTitle()
      this.buildDescription()
      this.buildCondition()
      this.buildAvailableQuantity()
      this.buildListingTypes()
      this.buildCategory()
      this.buildCurrency()
      this.buildPrice()
      this.buildPictures()
      this.buildSellerCustomField()
      this.buildGtin()
      this.buildBrand()
      this.buildDimensions()
      this.buildSpecifications()
      this.buildAttributes()
      this.buildWeight()
      // this.buildVariations()
      return Promise.resolve(this.product)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  async getProductOnMl() {
    // Vai la na ecom, vê nos metafields se tem ml_id
    try {
      const query = qs.stringify({
        'metafields.fields': 'ml_id',
        fields: 'metafields',
        limit: 1,
        sort: '-created_at'
      })
      const resource = `/products.json?${query}`
      const result = await this.appSdk.apiRequest(parseInt(storeId), resource, 'GET')
      return Promise.resolve(result)
    } catch (error) {
      Promise.reject(error)
    }

  }

  async create() {

  }

}

module.exports = MLProductService
