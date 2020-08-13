const OrderBuilder = require('./OrderBuilder')
const { randomObjectId } = require('@ecomplus/utils')

class MlToEcomOrderBuilder extends OrderBuilder {
  constructor(orderSchema, appSdk, storeId) {
    super(orderSchema)
    this.appSdk = appSdk
    this.storeId = parseInt(storeId, 10)
  }

  buildAmount() {
    this.order.amount = {
      total: this.orderSchema.total_amount,
      subtotal: this.orderSchema.paid_amount
    }
  }

  buildItem(mlItem) {
    return new Promise((resolve, reject) => {
      const { quantity, unit_price, item } = mlItem
      const { seller_custom_field } = item
      const resource = `/products.json?sku=${seller_custom_field}`
      return this.appSdk.apiRequest(this.storeId, resource)
        .then(({ response }) => {
          if (response.data && response.data.result) {
            const productId = response.data.result[0]._id
            return this.appSdk.apiRequest(this.storeId, `/products/${productId}.json`)
              .then(({response}) => {
                const { data } = response
                return resolve({
                  _id: randomObjectId(),
                  product_id: data._id,
                  quantity,
                  sku: seller_custom_field,
                  name: data.name,
                  price: unit_price
                })
              })
          }
          reject('No product found with this sku')
        })
        .catch(err => {
          console.log(err)
          reject(err)
        })
    })
  }

  buildItems() {
    return new Promise((resolve, reject) => {
      try {
        this.order.items = []
        const promises = []
        for (const mlItem of this.orderSchema.order_items) {
          promises.push(this.buildItem(mlItem))
        }
        Promise.all(promises)
          .then(items => {
            this.order.items = items
            resolve()
          })
          .catch(err => reject(err))
      } catch (error) {
        reject(error)
      }
    })
  }

  create(callback) {
    const resource = '/orders.json'
    this.appSdk
      .getAuth(this.storeId)
      .then(auth => {
        console.log('[AUTH]', auth)
        this.appSdk
          .apiRequest(this.storeId, resource, 'POST', this.getOrder(), auth)
          .then(res => callback(null, res))
          .catch(err => callback(err))
      })
      .catch(err => callback(err))
  }
}

module.exports = MlToEcomOrderBuilder