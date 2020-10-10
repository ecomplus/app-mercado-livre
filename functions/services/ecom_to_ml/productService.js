const axios = require('axios').default;
const qs = require('qs')

class MLProductService {
  constructor(token, data, options = {}) {
    this.server = axios.create({
      baseURL: 'https://api.mercadolibre.com',
      timeout: 60000,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    this.product = {}
    this.data = data
    this.options = options
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
    this.product.title = this.data.name
  }

  buildDescription() {
    this.product.description = (this.data.body_html || '').replace(/<[^>]*>?/gm, '');
  }

  buildCondition() {
    this.product.condition = this.data.condition
  }

  buildAvailableQuantity() {
    this.product.available_quantity = this.data.quantity
  }

  buildListingTypes() {
    this.product.listing_type_id = this.options.listing_type_id
  }

  buildCategory() {
    this.product.category_id = this.options.category_id
  }

  buildCurrency() {
    this.product.currency_id = this.data.currency_id
  }

  buildPrice() {
    this.product.price = this.data.price
  }

  buildPictures() {
    const { pictures } = this.data
    const sources = []
    if (pictures && pictures.length > 0) {
      pictures.map(({ small, normal, big, zoom }) => {
        const urls = [small || [], normal || [], big || [], zoom || []].map(({ url }) => url)
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
        value_name: this.data.sku
      }
    ]
  }

  buildSellerCustomField() {
    this.product.seller_custom_field = this.data.sku
  }

  buildGtin() {
    const { gtin } = this.data
    if (gtin && gtin.length > 0) {
      for (const item of gtin) {
        this._attributes.push({ id: 'GTIN', value_name: item })
      }
    }
  }

  buildBrand() {
    const { brands } = this.data
    if (brands && brands.length > 0) {
      for (const { name } of brands) {
        this._attributes.push({ id: 'BRAND', value_name: name })
      }
    }
  }

  buildDimensions() {
    const { dimensions } = this.data
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
    const { specifications } = this.data
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
    const { weight } = this.data
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

  getProductByCreate() {
    try {
      this.product = {}
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
      return this.product
    } catch (error) {
      throw error
    }
  }

  getProductByUpdate() {
    try {
      this.product = {}
      this.buildAvailableQuantity()
      this.buildPrice()
      return this.product
    } catch (error) {
      throw error
    }
  }


  findProduct(id) {
    return new Promise((resolve, reject) => {
      this.server
        .get(`/items/${id}`)
        .then((response) => resolve(response))
        .catch(error => {
          if (error.response) {
            console.log(error.response.data.cause)
            return reject(error.response.data)
          }
          reject(error)
        })
    })
  }

  create(data) {
    return new Promise((resolve, reject) => {
      this.server
        .post('/items', data)
        .then((response) => resolve(response))
        .catch(error => {
          if (error.response) {
            console.log(error.response.data.cause)
            return reject(error.response.data)
          }
          reject(error)
        })
    })
  }

  update(id, data) {
    return new Promise((resolve, reject) => {
      this.server
        .put(`items/${id}`, data)
        .then((response) => resolve(response))
        .catch(error => {
          if (error.response) {
            console.log(error.response.data.cause)
            return reject(error.response.data)
          }
          reject(error)
        })
    })
  }

}

module.exports = MLProductService
