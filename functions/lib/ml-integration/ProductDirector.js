class ProductDirector {
  constructor(productBuilder) {
    this.productBuilder = productBuilder
  }

  handlerProduct() {
    this.productBuilder.buildTitle()
    this.productBuilder.buildDescription()
    this.productBuilder.buildCondition()
    this.productBuilder.buildAvailableQuantity()
    this.productBuilder.buildListingTypes()
    this.productBuilder.buildCategory()
    this.productBuilder.buildCurrency()
    this.productBuilder.buildPrice()
    this.productBuilder.buildPictures()
    this.productBuilder.buildSellerCustomField()
    // this.productBuilder.buildVariations()
  }

  getProduct() {
    return this.productBuilder.getProduct();
  }

  save(callback) {
    return this.productBuilder.save(callback)
  }
}

module.exports = ProductDirector