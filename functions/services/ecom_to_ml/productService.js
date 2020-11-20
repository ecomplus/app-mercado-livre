const axios = require('axios').default
const _ = require('lodash')
const VARIATION_CORRELATIONS = require('./variations_correlations.json')
const BalanceReserveService = require('../balanceReserveService')
const log = require('../logService')

class ProductService {
  constructor(appSdk, token, data, storeId, mlMetadata = {}, category = {}, options = {}) {
    this.appSdk = appSdk
    this.storeId = storeId
    this.server = axios.create({
      baseURL: 'https://api.mercadolibre.com',
      timeout: 60000,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    this.category = category
    this.product = {}
    this.data = data
    this.options = options
    this._attributes = []
    this._variations = []
    this.mlId = mlMetadata.mlId
    this.mlMetadata = mlMetadata.metadata || {}
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
    const maxLength = this.category.settings.max_title_length || this.data.name.length
    this.product.title = this.data.name.slice(0, maxLength)
  }

  buildDescription() {
    this.product.description = (this.data.body_html || '').replace(/<[^>]*>?/gm, '');
  }

  buildCondition() {
    this.product.condition = this.data.condition
  }

  buildAvailableQuantity() {
    return new Promise((resolve, reject) => {
      if (this.product.variations && this.product.variations.length > 0) return resolve()
      if (this.mlId && !this.mlMetadata.allows_balance_update) {
        return resolve()
      }
      this.product.available_quantity = this.data.quantity || 0
      const { sku } = this.data
      if (!sku) return resolve()
      const balanceReserveService = new BalanceReserveService(this.storeId, sku)
      balanceReserveService.getQuantity()
        .then(reservedQuantity => {
          this.product.available_quantity = (this.data.quantity || 0) + reservedQuantity
          resolve()
        }).catch(error => reject(error))
    })
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
    if (!this.mlId || this.mlMetadata.allows_price_update) {
      this.product.price = this.data.price
      if (this.product.variations && this.product.variations.length > 0) {
        const highestPrice = this.data.variations
          ? _.maxBy(this.data.variations, 'price').price
          : this.data.price
        if (highestPrice > 0) {
          delete this.product.price
        }
      }
    }
  }

  getUniqPictures() {
    const { pictures } = this.data
    const sources = []
    if (pictures && pictures.length > 0) {
      pictures.map((picture) => {
        const { url } = picture.zoom || picture.big || picture.normal || picture.small
        sources.push({ source: url })
      })
    }
    return _.unionBy(sources, 'source')
  }

  buildPictures() {
    this.product.pictures = this.getUniqPictures()
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

  filterValidVariations(allowedAttributes, mlVariations = []) {
    const variations = []
    const ecomVariations = this.data.variations || []
    const updatedVariations = []

    for (const variation of mlVariations) {
      const ecomVariation = ecomVariations
        .find(({ sku }) => sku === variation.seller_custom_field)
      variations.push(this.buildUpdateVariation(ecomVariation, allowedAttributes, variation.id))
      if (ecomVariation) {
        updatedVariations.push(ecomVariation._id)
      }

    }

    const variationsToCreate = ecomVariations
      .filter(({ _id }) => !updatedVariations.includes(_id))

    for (const variation of variationsToCreate) {
      variations.push(this.buildVariation(variation, allowedAttributes))
    }

    return Promise.all(variations)
      .then(values => {
        const validVariations = values.filter(({ mlVariation }) => {
          return mlVariation.id || mlVariation.attribute_combinations.length > 0
        })
        return Promise.resolve(validVariations.map(variation => variation.mlVariation))
      })
      .catch(error => Promise.reject(error))
  }

  buildUniqueVariations(variations, checkAttributeCombinaitons = true) {
    if (!checkAttributeCombinaitons) {
      this.product.variations = variations
      return
    }

    if (variations && variations.length > 0) {
      this.product.variations = _.uniqWith(variations, (x, y) => {
        return _.isEqual(x.attribute_combinations, y.attribute_combinations)
      })
    }
    return
  }

  buildVariations(category_id) {
    return new Promise((resolve, reject) => {
      this.findAllowVariations(category_id)
        .then((allowedAttributes) => this.filterValidVariations(allowedAttributes))
        .then(this.buildUniqueVariations.bind(this))
        .then(() => resolve(this.product))
        .catch(error => reject(error))
    })
  }

  buildUpdateVariations(category_id, mlVariations = []) {
    return new Promise((resolve, reject) => {
      this.findAllowVariations(category_id)
        .then((allowedAttributes) => this.filterValidVariations(allowedAttributes, mlVariations))
        .then((variations) => this.buildUniqueVariations(variations, false))
        .then(() => resolve(this.product))
        .catch(error => reject(error))
    })
  }

  buildVariation(ecomVariation, allowedAttributes) {
    const mlVariation = {
      attribute_combinations: [],
      picture_ids: []
    }
    return Promise
      .resolve(this.buildVariationsSpecs({ ecomVariation, mlVariation, allowedAttributes }))
      .then(this.buildVariationPictures.bind(this))
      .then(this.buildVariationSKU.bind(this))
      .then(this.buildVariationAvailableQuantity.bind(this))
      .then(this.buildVariationPrice.bind(this))
      .catch(error => Promise.reject(error))
  }

  buildUpdateVariation(ecomVariation, allowedAttributes, mlVariationID) {
    const mlVariation = {
      id: mlVariationID
    }
    return Promise
      .resolve(this.buildVariationAvailableQuantity({ ecomVariation, mlVariation, allowedAttributes }))
      .then(this.buildVariationPrice.bind(this))
      .catch(error => Promise.reject(error))
  }

  buildVariationPrice(options) {
    const { ecomVariation, mlVariation, allowedAttributes } = options
    if (!this.mlId || this.mlMetadata.allows_price_update) {
      const highestPrice = this.data.variations
        ? (_.maxBy(this.data.variations, 'price') || {}).price
        : this.data.price
      mlVariation.price = highestPrice
    }
    return { ecomVariation, mlVariation, allowedAttributes }
  }

  buildVariationAvailableQuantity(options) {
    return new Promise((resolve, reject) => {
      const { ecomVariation, mlVariation, allowedAttributes } = options
      if (!ecomVariation || (this.mlId && !this.mlMetadata.allows_balance_update)) {
        return resolve({ ecomVariation, mlVariation, allowedAttributes })
      }
      const { quantity } = ecomVariation
      mlVariation.available_quantity = quantity || 0

      if (!ecomVariation.sku) {
        resolve({ ecomVariation, mlVariation, allowedAttributes })
      }

      const balanceReserveService = new BalanceReserveService(this.storeId, ecomVariation.sku)
      balanceReserveService.getQuantity()
        .then(reservedQuantity => {
          mlVariation.available_quantity += reservedQuantity
          resolve({ ecomVariation, mlVariation, allowedAttributes })
        })
        .catch(error => reject(error))
    })
  }

  buildVariationSKU(options) {
    const { ecomVariation, mlVariation, allowedAttributes } = options
    if (ecomVariation.sku) {
      mlVariation.attributes = [{
        id: "SELLER_SKU",
        value_name: ecomVariation.sku
      }]
      mlVariation.seller_custom_field = ecomVariation.sku
    }
    return { ecomVariation, mlVariation, allowedAttributes }
  }

  buildVariationsSpecs(options) {
    const { ecomVariation, mlVariation, allowedAttributes } = options
    const { specifications } = ecomVariation
    for (const attribute of allowedAttributes) {
      const spec = this.getSpecByProps(specifications, VARIATION_CORRELATIONS[attribute] || [attribute.toLowerCase()])
      if (spec.text) {
        mlVariation.attribute_combinations.push({ id: attribute, value_name: spec.text })
      }
    }
    return { ecomVariation, mlVariation, allowedAttributes }
  }

  buildVariationPictures(options) {
    const { ecomVariation, mlVariation, allowedAttributes } = options
    if (ecomVariation.picture_id) {
      const pictureUrl = this.data.pictures
        .find(({ _id }) => _id === ecomVariation.picture_id).zoom.url
      mlVariation.picture_ids.push(pictureUrl)
    } else {
      const pictures = this.getUniqPictures()
      if (Array.isArray(pictures) && pictures.length > 0) {
        mlVariation.picture_ids.push(pictures[0].source)
      }
    }
    return { ecomVariation, mlVariation, allowedAttributes }
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
      this.product = {}
      this.buildTitle()
      this.buildDescription()
      this.buildCondition()
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
      return this.buildVariations(this.options.category_id)
        .then(this.buildAvailableQuantity.bind(this))
        .then(() => resolve(this.product))
        .catch(error => reject(error))
    })
  }

  getProductByUpdate() {
    return new Promise((resolve, reject) => {
      this.product = {}
      return this.findProduct(this.mlId)
        .then(({ data }) => this.buildUpdateVariations(data.category_id, data.variations))
        .then(this.buildAvailableQuantity.bind(this))
        .then(this.buildPrice.bind(this))
        .then(() => resolve(this.product))
        .catch(error => reject(error))
    })
  }

  findProduct(id) {
    return new Promise((resolve, reject) => {
      this.server
        .get(`/items/${id}`)
        .then((response) => resolve(response))
        .catch(error => {
          if (error.response) {
            return reject(error.response.data)
          }
          reject(error)
        })
    })
  }

  create() {
    return new Promise((resolve, reject) => {
      this.getProductByCreate()
        .then(data => {
          this.server
            .post('/items', data)
            .then((response) => {
              log(this.appSdk, this.storeId, '[CREATE PRODUCT]', response.data)
              resolve(response)
            })
            .catch(error => {
              log(this.appSdk, this.storeId, '[CREATE PRODUCT]', error, false)
              if (error.response) {
                return reject(error.response.data)
              }
              reject(error)
            })
        })
    })
  }

  update() {
    return new Promise((resolve, reject) => {
      this.getProductByUpdate()
        .then(data => {
          this.server
            .put(`items/${this.mlId}`, data)
            .then((response) => {
              log(this.appSdk, this.storeId, '[UPDATE PRODUCT]', response.data)
              resolve(response)
            })
            .catch(error => {
              log(this.appSdk, this.storeId, '[UPDATE PRODUCT]', error.response || error, false)
              if (error.response) {
                return reject(error.response.data)
              }
              reject(error)
            })
        })
    })
  }

}

module.exports = ProductService
