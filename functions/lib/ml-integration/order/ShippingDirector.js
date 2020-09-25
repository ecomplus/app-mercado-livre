class ShippingDirector {
  constructor(shippingBuilder) {
    this.shippingBuilder = shippingBuilder
  }

  getShipping() {
    this.shippingBuilder.buildFrom()
    this.shippingBuilder.buildTo()
    this.shippingBuilder.buildTotalPrice()
    this.shippingBuilder.buildTrakingCodes()
    return this.shippingBuilder.getShipping()
  }

  builderShippingToCreate() {
    return new Promise((resolve, reject) => {
      try {
        this.buildFrom()
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  create(callback) {
    this.builderShippingToCreate().then(() => {
      return this.shippingBuilder.create(callback)
    }).catch(error => callback(error) )
  }
}

module.exports = ShippingDirector