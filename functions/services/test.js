process.env.FIREBASE_CONFIG = JSON.stringify(require(process.env.GOOGLE_APPLICATION_CREDENTIALS))
const admin = require('firebase-admin')
admin.initializeApp()
const { setup } = require('@ecomplus/application-sdk')

const { handleExportationProducts, handleUpdateProduct } = require('./tasks')

const exportProduct = () => {
  setup(null, true, admin.firestore())
    .then((appSdk) => {
      const notification = {
        "_id": "5f95ac73b2161709fa438127",
        "action": "change",
        "authentication_id": "5eee209814ff772fde7a8295",
        "body": {
          "exportation_products": [
            {
              "category_id": "MLB108704",
              "listing_type_id": "gold_pro",
              "product_id": "5f91da6eb2161709fa42bbae"
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
      handleExportationProducts(appSdk, notification)
    }).catch(error => console.log(error))

}

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
setTimeout(updatedProduct, 1000)