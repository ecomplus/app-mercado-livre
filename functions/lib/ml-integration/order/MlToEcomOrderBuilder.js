const OrderBuilder = require('./OrderBuilder')

class MlToEcomOrderBuilder extends OrderBuilder {
  constructor(orderSchema, appSdk, storeId) {
    super(orderSchema)
    this.appSdk = appSdk
    this.storeId = storeId
  }

  create(callback) {
    const resource = '/orders.json'
    this.appSdk
      .getAuth(storeId)
      .then(auth => {
        console.log('[AUTH]', auth)
        this.appSdk
          .apiRequest(this.storeId, resource, 'POST', this.getOrder())
          .then(res => callback(null, res))
          .catch(err => callback(err))
      })
      .catch(err => callback(err))
  }
}

module.exports = MlToEcomOrderBuilder