class ProductDirector {
  constructor(productBuilder) {
    this.productBuilder = productBuilder
  }

  getProduct() {
    return this.productBuilder.getProduct();
  }

  buildProductToCreate() {
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

  create(callback) {
    this.buildProductToCreate();
    return this.productBuilder.create(callback)
  }
}

module.exports = ProductDirector