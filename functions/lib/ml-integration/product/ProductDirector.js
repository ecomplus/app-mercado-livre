class ProductDirector {
  constructor(productBuilder) {
    this.productBuilder = productBuilder
    this.updatedBuilders = {
      quantity: this.productBuilder.buildAvailableQuantity,
      price: this.productBuilder.buildPrice,
      pictures: this.productBuilder.pictures

    }
  }

  getProduct() {
    return this.productBuilder.getProduct()
  }

  buildProductUpdate(fields) {
    for (const field of fields) {
      if (this.updatedBuilders.hasOwnProperty(field)) {
        this.updatedBuilders[field]()
      }
    }
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

  update(fields, callback) {
    this.buildProductUpdate(fields)
    return this.productBuilder.update(callback)
  }
}

module.exports = ProductDirector