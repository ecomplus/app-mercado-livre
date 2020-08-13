const Order = require('./Order')
class OrderBuilder {
  constructor(orderSchema) {
    this.order = new Order()
    this.orderSchema = orderSchema
  }

  getOrder() {
    return this.order
  }
}

module.exports = OrderBuilder