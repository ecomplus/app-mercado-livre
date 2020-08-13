const OrderBuilder = require('./OrderBuilder')

class MlToEcomOrderBuilder extends OrderBuilder {
  constructor(orderSchema, appSdk, storeId) {
    super(orderSchema)
    this.appSdk = appSdk
    this.storeId = storeId
  }

  create(callback) {
    const resource = '/orders.json'
    console.log('[TYPE OF]', typeof this.storeId)
    this.appSdk
      .getAuth(parseInt(this.storeId, 10))
      .then(auth => {
        console.log('[AUTH]', auth)
        this.appSdk
          .apiRequest(parseInt(this.storeId, 10), resource, 'POST', this.getOrder(), auth)
            .then(res => callback(null, res))
            .catch(err => callback(err))
      })
      .catch(err => callback(err))
  }
}

module.exports = MlToEcomOrderBuilder