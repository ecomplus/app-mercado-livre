class OrderDirector {
  constructor(orderBuilder) {
    this.orderBuilder = orderBuilder
  }

  getOrder() {
    return this.orderBuilder.getOrder()
  }

  builderOrderToCreate() {
    return new Promise((resolve, reject) => {
      try {
        this.orderBuilder.buildAmount()
        this.orderBuilder.buildItems()
          .then(() => resolve())
      } catch (error) {
        reject(error)
      }
    })
  }

  create(callback) {
    this.builderOrderToCreate().then(() => {
      return this.orderBuilder.create(callback)
    })
  }
}

module.exports = OrderDirector