const { auth } = require('firebase-admin')
const getAppData = require('./../../lib/store-api/get-app-data')
const updateAppData = require('./../../lib/store-api/update-app-data')

class ProductService {
  constructor(appSdk, storeId) {
    this.appSdk = appSdk
    this.storeId = parseInt(storeId, 10)
  }

  link(mlProductId, ecomProductId) {
    return new Promise((resolve, reject) => {
      const { appSdk, storeId } = this
      return getAppData({ appSdk, storeId, auth })
        .then((data) => {
          if (!data.product_correlations) {
            data.product_correlations = {}
          }
          if (!data.product_correlations[ecomProductId]) {
            data.product_correlations[ecomProductId] = []
          }
          data.product_correlations[ecomProductId].push(mlProductId)
          resolve(updateAppData({ appSdk, storeId, auth }, data))
        }).catch(error => reject(error))
    })
  }
}


module.exports = ProductService