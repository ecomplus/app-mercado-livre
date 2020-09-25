const Shipping = require('./Shipping')
class ShippingBuilder {
  constructor(shippingSchema) {
    this.shipping = new Shipping()
    this.shippingSchema = shippingSchema
  }

  getShipping() {
    return this.shipping
  }
}

module.exports = ShippingBuilder