process.env.FIREBASE_CONFIG = JSON.stringify(require(process.env.GOOGLE_APPLICATION_CREDENTIALS))
const admin = require('firebase-admin')
admin.initializeApp()
const { exportProducts, handleUpdateProduct } = require('../tasks')
const { expect } = require('chai')
const { productWithVariations } = require('./mocks/productWithVariations')
const { productWithoutVariations } = require('./mocks/productWithoutVariations')
const STORE_ID = 1117
const faker = require('faker')

const randomQuantity = faker.random.number(100)


createProduct = (appSdk, data) => {
  return new Promise((resolve, reject) => {
    const resource = '/products.json'
    return appSdk
      .apiRequest(STORE_ID, resource, 'POST', data)
      .then(({ response }) => {
        resolve(response.data)
      })
      .catch(error => {
        console.log(error.response.data)
        reject(error.response.data)
      })
  })
}

deleteProduct = (appSdk, id) => {
  return new Promise((resolve, reject) => {
    const resource = `/products/${id}.json`
    return appSdk
      .apiRequest(STORE_ID, resource, 'DELETE')
      .then(({ response }) => resolve(response.data))
      .catch(error => reject(error))
  })
}

updateProduct = (appSdk, id, data) => {
  return new Promise((resolve, reject) => {
    const resource = `/products/${id}.json`
    return appSdk
      .apiRequest(STORE_ID, resource, 'PATCH', data)
      .then(({ response }) => resolve(response.data))
      .catch(error => reject(error))
  })
}

describe('export product without variations', () => {
  let appSdk;
  let product;
  before(function () {
    const { setup } = require('@ecomplus/application-sdk')
    return setup(null, true, admin.firestore())
      .then(sdk => {
        appSdk = sdk
        return createProduct(appSdk, productWithoutVariations)
          .then(res => product = res)
          .catch(error => console.log(error))
      })
  })


  it('should be export with success', () => {
    const notification = {
      "_id": "5f95ac73b2161709fa438127",
      "action": "change",
      "authentication_id": "5eee209814ff772fde7a8295",
      "body": {
        "exportation_products": [
          {
            "category_id": "MLB108704",
            "listing_type_id": "gold_pro",
            "product_id": product._id,
            "allows_balance_update": true,
            "allows_price_update": true,
          }
        ]
      },
      "datetime": "2020-10-25T16:48:51.927Z",
      "fields": [
        "data"
      ],
      "method": "PATCH",
      "resource": "applications",
      "resource_id": "5f95ab39b2161709fa43811c",
      "store_id": STORE_ID
    }
    return exportProducts(appSdk, notification).then(res => {
      expect(res).to.be.length(1)
      const { data } = res[0]
      expect(data).to.be.an('object')
      expect(data.variations).is.empty
      expect(data.seller_custom_field).to.be.eq(productWithoutVariations.sku).that.not.empty
    })
  })

  it(`shold be updated available_quantity ${randomQuantity}`, () => {
    const notification = {
      "_id": "5f95ac73b2161709fa438127",
      "action": "change",
      "authentication_id": "5eee209814ff772fde7a8295",
      "body": {
        "quantity": randomQuantity
      },
      "datetime": "2020-10-25T16:48:51.927Z",
      "fields": [
        "quantity"
      ],
      "method": "PATCH",
      "resource": "products",
      "resource_id": product._id,
      "store_id": 1117
    }

    return updateProduct(appSdk, product._id, { quantity: randomQuantity })
      .then(() => {
        return handleUpdateProduct(appSdk, notification).then(res => {
          expect(res).to.be.length(1)
          const { data } = res[0]
          expect(data.available_quantity).to.be.equal(randomQuantity)
        })
      })
  })

  it(`shold be updated price to 300`, () => {
    const notification = {
      "_id": "5f95ac73b2161709fa438127",
      "action": "change",
      "authentication_id": "5eee209814ff772fde7a8295",
      "body": {
        "price": 300
      },
      "datetime": "2020-10-25T16:48:51.927Z",
      "fields": [
        "price"
      ],
      "method": "PATCH",
      "resource": "products",
      "resource_id": product._id,
      "store_id": 1117
    }

    return updateProduct(appSdk, product._id, { price: 300 })
      .then(() => {
        return handleUpdateProduct(appSdk, notification).then(res => {
          expect(res).to.be.length(1)
          const { data } = res[0]
          expect(data.price).to.be.equal(300)
        })
      })
  })

  after(function () {
    deleteProduct(appSdk, product._id)
  })

  describe('export product and not update balance', () => {
    let appSdk;
    let product;
    before(function () {
      const { setup } = require('@ecomplus/application-sdk')
      return setup(null, true, admin.firestore())
        .then(sdk => {
          appSdk = sdk
          return createProduct(appSdk, productWithoutVariations)
            .then(res => product = res)
            .catch(error => console.log(error))
        })
    })

    it('should export product and not allow balance update', () => {
      const notification = {
        "_id": "5f95ac73b2161709fa438127",
        "action": "change",
        "authentication_id": "5eee209814ff772fde7a8295",
        "body": {
          "exportation_products": [
            {
              "category_id": "MLB108704",
              "listing_type_id": "gold_pro",
              "product_id": product._id,
              "allows_balance_update": false
            }
          ]
        },
        "datetime": "2020-10-25T16:48:51.927Z",
        "fields": [
          "data"
        ],
        "method": "PATCH",
        "resource": "applications",
        "resource_id": "5f95ab39b2161709fa43811c",
        "store_id": STORE_ID
      }

      const notificationUpdateQuantity = {
        "_id": "5f95ac73b2161709fa438127",
        "action": "change",
        "authentication_id": "5eee209814ff772fde7a8295",
        "body": {
          "quantity": productWithVariations.quantity + randomQuantity
        },
        "datetime": "2020-10-25T16:48:51.927Z",
        "fields": [
          "quantity"
        ],
        "method": "PATCH",
        "resource": "products",
        "resource_id": product._id,
        "store_id": 1117
      }

      return exportProducts(appSdk, notification).then(res => {
        expect(res).to.be.length(1)
        const { data } = res[0]
        expect(data).to.be.an('object')
        expect(data.variations).is.empty
        expect(data.available_quantity).to.be.equal(productWithoutVariations.quantity)
        return updateProduct(appSdk, product._id, { quantity: productWithVariations.quantity + randomQuantity })
          .then(() => {
            return handleUpdateProduct(appSdk, notificationUpdateQuantity).then(res => {
              expect(res).to.be.length(1)
              const { data } = res[0]
              expect(data.available_quantity).to.be.equal(productWithoutVariations.quantity)
            })
          })
      })
    })

    after(function () {
      deleteProduct(appSdk, product._id)
    })

  })
})

describe('export product with variations', () => {
  let appSdk;
  let product;
  before(function () {
    const { setup } = require('@ecomplus/application-sdk')
    return setup(null, true, admin.firestore())
      .then(sdk => {
        appSdk = sdk
        return createProduct(appSdk, productWithVariations)
          .then(res => product = res)
          .catch(error => console.log(error))
      })
  })


  it('should be export with success', () => {
    const notification = {
      "_id": "5f95ac73b2161709fa438127",
      "action": "change",
      "authentication_id": "5eee209814ff772fde7a8295",
      "body": {
        "exportation_products": [
          {
            "category_id": "MLB108704",
            "listing_type_id": "gold_pro",
            "product_id": product._id,
            "allows_balance_update": true,
            "allows_price_update": true
          }
        ]
      },
      "datetime": "2020-10-25T16:48:51.927Z",
      "fields": [
        "data"
      ],
      "method": "PATCH",
      "resource": "applications",
      "resource_id": "5f95ab39b2161709fa43811c",
      "store_id": STORE_ID
    }
    return exportProducts(appSdk, notification).then(res => {
      expect(res).to.be.length(1)
      const { data } = res[0]
      expect(data).to.be.an('object')
      expect(data.variations).to.be.an('array').that.not.is.empty
      expect(data.seller_custom_field).to.be.eq(productWithVariations.sku).that.not.empty
    })
  })

  after(function () {
    deleteProduct(appSdk, product._id)
  })
})
