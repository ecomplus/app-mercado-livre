class OrderDirector {
  constructor(orderBuilder) {
    this.orderBuilder = orderBuilder
  }

  getOrder() {
    return this.orderBuilder.getOrder()
  }

  builderOrderToCreate() {

  }

  create(callback) {
    this.builderOrderToCreate()
    return this.orderBuilder.create(callback)
  }
}

module.exports = OrderDirector