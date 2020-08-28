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
        this.orderBuilder.buildTransactions()
        this.orderBuilder.buildAmount()
        this.orderBuilder.buildBuyer()
        this.orderBuilder.buildStatus()
        this.orderBuilder.buildFinancialStatus()
        this.orderBuilder.buildItems()
          .then(() => resolve()).catch(err => reject(err))
      } catch (error) {
        reject(error)
      }
    })
  }

  create(callback) {
    this.builderOrderToCreate().then(() => {
      return this.orderBuilder.create(callback)
    }).catch(error => callback(error) )
  }
}

module.exports = OrderDirector