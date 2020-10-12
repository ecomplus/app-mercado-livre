
class ProductService {
  constructor(appSdk, storeId) {
    this.appSdk = appSdk
    this.storeId = parseInt(storeId, 10)
  }

  link(mlProductId, ecomProductId) {
    return new Promise((resolve, reject) => {
      const resource = `products/${ecomProductId}/metafields.json`
      const metafields = { field: 'ml_id', value: mlProductId }
      this.appSdk
        .apiRequest(this.storeId, resource, 'POST', metafields)
        .then(response => resolve(response))
        .catch(error => {
          if (error.response) {
            return reject(error.response.data)
          }
          return reject(error)
        })
    })
  }
}


module.exports = ProductService