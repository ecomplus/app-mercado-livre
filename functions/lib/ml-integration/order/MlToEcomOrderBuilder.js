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

  getProductId(sku) {
    return new Promise((resolve, reject) => {
      const resource = `/products.json?sku=${sku}`
      console.log('[resource]', resource)
      return this.appSdk.apiRequest(this.storeId, resource)
        .then(({ response }) => {
          console.log('[RESPONSE]', response)
          console.log('[DATA]', response.data)
          const { data } = response
          const { result } = data
          if (result) {
            return resolve(result[0]._id)
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
        for (const mlItem of this.orderSchema.order_items) {
          const { quantity, unit_price, item } = mlItem
          const { seller_custom_field } = item
          this.getProductId(seller_custom_field)
            .then(productId => {
              this.order.items.push({
                _id: randomObjectId(),
                product_id: productId,
                quantity,
                price: unit_price
              })
            })
        }
        resolve()
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