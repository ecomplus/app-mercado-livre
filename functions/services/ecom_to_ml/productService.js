const axios = require('axios').default
const _ = require('lodash')
const VARIATION_CORRELATIONS = require('./variations_correlations.json')

class ProductService {
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

  getAttributes(mlCategory) {
    return new Promise((resolve, reject) => {
      return this.server
        .get(`/categories/${mlCategory}/attributes`)
        .then(({ data }) => resolve(data))
        .catch(error => reject(error))
    })
  }

  getTechnicalSpecs(mlCategory) {
    return new Promise((resolve, reject) => {
      return this.server
        .get(`/categories/${mlCategory}/technical_specs/input`)
        .then(({ data }) => resolve(data))
        .catch(error => reject(error))
    })
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

  getUniqPictures() {
    const { pictures } = this.data
    const sources = []
    if (pictures && pictures.length > 0) {
      pictures.map(({ small, normal, big, zoom }) => {
        const urls = [small || [], normal || [], big || [], zoom || []].map(({ url }) => url)
        urls.forEach(url => {
          if (url) sources.push({ source: url })
        })
      })
    }
    return sources
  }

  buildPictures() {
    this.product.pictures = this.getUniqPictures
  }

  findAllowVariations(category_id) {
    return new Promise((resolve, reject) => {
      this.getAttributes(category_id)
        .then(attributes => {
          const allowedVariations = attributes
            .filter(attribute => attribute.tags.allow_variations === true)
            .map(({ id }) => id)
          resolve(allowedVariations)
        })
        .catch(error => reject(error))
    })
  }

  buildVariations() {
    return new Promise((resolve, reject) => {
      const category_id = this.product.category_id ? this.product.category_id : this.options.category_id
      this.findAllowVariations(category_id)
        .then(allowedAttributes => {
          this._variations = []
          for (const variation of (this.data.variations || [])) {
            const { quantity, price, specifications } = variation
            const mlVariation = {
              available_quantity: quantity ? quantity : this.data.quantity,
              price: price ? price : this.data.price,
              attribute_combinations: [],
              picture_ids: []
            }

            if (variation.picture_id) {
              const pictureUrl = this.data.pictures
                .find(({ _id }) => _id === variation.picture_id).zoom.url
              mlVariation.picture_ids.push(pictureUrl)
            } else {
              const pictures = this.getUniqPictures()
              if (Array.isArray(pictures) && pictures.length > 0) {
                mlVariation.picture_ids.push(pictures[0].source)
              }
            }

            for (const attribute of allowedAttributes) {
              const spec = this.getSpecByProps(specifications, VARIATION_CORRELATIONS[attribute] || [attribute.toLowerCase()])
              if (spec.text) {
                mlVariation.attribute_combinations.push({ id: attribute, value_name: spec.text })
              }
            }

            if (mlVariation.attribute_combinations.length > 0) {
              this._variations.push(mlVariation)
            }
          }
          if (this._variations.length > 0) {
            this.product.variations = _.uniqWith(this._variations, (x, y) => {
              return _.isEqual(x.attribute_combinations, y.attribute_combinations)
            })
          }
          resolve()
        })
        .catch(error => reject(error))
    })
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
    return new Promise((resolve, reject) => {
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
        this.buildVariations()
          .then(() => {
            resolve(this.product)
          })
          .catch(error => reject(error))
      } catch (error) {
        throw error
      }

    })
  }

  getProductByUpdate(mlProductId) {
    return new Promise((resolve, reject) => {
      try {
        this.product = {}
        this.findProduct(mlProductId)
          .then(({ data }) => {
            this.product.category_id = data.category_id
            console.log('[getProductByUpdate]', this.product)
            this.buildVariations()
              .then(() => {
                if (!data.variations) {
                  this.buildAvailableQuantity()
                  this.buildPrice()
                  return resolve(this.product)
                }
                resolve(this.product)
              })
              .catch(error => reject(error))
          }).catch(error => reject(error))

      } catch (error) {
        throw error
      }
    })
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
    console.log(JSON.stringify(data, null, 4))
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

module.exports = ProductService
