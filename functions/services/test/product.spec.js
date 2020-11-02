process.env.FIREBASE_CONFIG = JSON.stringify(require(process.env.GOOGLE_APPLICATION_CREDENTIALS))
const admin = require('firebase-admin')
admin.initializeApp()


const { handleExportationProducts, handleUpdateProduct } = require('../tasks')
const { expect } = require('chai')
const productWithVariations = require('./mocks/productWithVariations.json')

describe('export product with variations', () => {
  let appSdk;
  let product;
  before(function () {
    const { setup } = require('@ecomplus/application-sdk')
    return setup(null, true, admin.firestore())
      .then(sdk => {
        appSdk = sdk
        const resource = '/products.json'
        return appSdk
          .apiRequest(1117, resource, 'POST', productWithVariations)
          .then(({ response }) => {
            console.log(response)
            product = response.data
          })
          .catch(error => {
            console.log(error.response.data)
            throw error
          })
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
            "product_id": product._id
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
      "store_id": 1117
    }
    return handleExportationProducts(appSdk, notification).then(res => {
      expect(res).to.be.length(1)
      const { data } = res[0]
      expect(data).to.be.an('object')
      expect(data.variations).to.be.an('array').that.not.is.empty
      expect(data.seller_custom_field).to.be.eq('IVO4131')
    })
  })

  after(function () {
    const resource = `/products/${product._id}.json`
    return appSdk
      .apiRequest(1117, resource, 'DELETE')
      .then(({ response }) => {
        console.log(response)
      })
      .catch(error => {
        console.log(error.response.data)
        throw error
      })
  })

})


const updatedProduct = () => {
  setup(null, true, admin.firestore())
    .then((appSdk) => {
      const notification = {
        "_id": "5f95ac73b2161709fa438127",
        "action": "change",
        "authentication_id": "5eee209814ff772fde7a8295",
        "body": {
          "quantity": 100
        },
        "datetime": "2020-10-25T16:48:51.927Z",
        "fields": [
          "quantity"
        ],
        "method": "PATCH",
        "resource": "products",
        "resource_id": "5f91da6eb2161709fa42bbae",
        "subresource": "variations",
        "subresource_id": "957090160375051881100003",
        "store_id": 1117
      }
      handleUpdateProduct(appSdk, notification)
    })
}

// exportProduct()
// setTimeout(updatedProduct, 1000)