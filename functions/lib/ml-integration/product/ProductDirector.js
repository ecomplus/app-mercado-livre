class ProductDirector {
  constructor(productBuilder) {
    this.productBuilder = productBuilder
  }

  getProduct() {
    return this.productBuilder.getProduct()
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
    this.productBuilder.buildGtin()
    this.productBuilder.buildBrand()
    this.productBuilder.buildDimensions()
    this.productBuilder.buildSpecifications()
    this.productBuilder.buildAttributes()
    this.productBuilder.buildWeight()
    // this.productBuilder.buildVariations()
  }

  create(callback) {
    this.buildProductToCreate()
    return this.productBuilder.create(callback)
  }
}

module.exports = ProductDirector