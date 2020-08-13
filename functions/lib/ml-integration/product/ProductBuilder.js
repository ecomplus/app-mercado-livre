const Product = require('./Product')
class ProductBuilder {
  constructor(productSchema) {
    this.product = new Product()
    this.productSchema = productSchema
  }

  getProduct() {
    return this.product
  }
}

module.exports = ProductBuilder