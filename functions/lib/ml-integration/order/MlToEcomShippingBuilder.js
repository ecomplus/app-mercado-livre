const ShippingBuilder = require('./ShippingBuilder')
const { randomObjectId } = require('@ecomplus/utils')


class MlToEcomShippingBuilder extends ShippingBuilder {
  constructor(shippingSchema, appSdk, storeId) {
    super(shippingSchema)
    this.appSdk = appSdk
    this.storeId = parseInt(storeId, 10)
  }

  buildFrom() {
    const senderAddress = this.shippingSchema.sender_address
    this.shipping.from.zip = senderAddress.zip_code
    this.shipping.from.country = senderAddress.country.name
    this.shipping.from.streat = senderAddress.streat_name
    this.shipping.from.number = senderAddress.streat_number
    this.shipping.from.province_code = senderAddress.state.id
    this.shipping.from.province_code = this.getProvinceCode(senderAddress)
    this.shipping.from.city = senderAddress.city.name
    this.shipping.from.borough = senderAddress.neighborhood.name
  }

  buildTo() {
    const receiverAddress = this.shippingSchema.receiver_address
    this.shipping.to.zip = receiverAddress.zip_code
    this.shipping.to.country = receiverAddress.country.name
    this.shipping.to.streat = receiverAddress.streat_name
    this.shipping.to.number = receiverAddress.streat_number
    this.shipping.to.province_code = this.getProvinceCode(receiverAddress)
    this.shipping.to.city = receiverAddress.city.name
    this.shipping.to.borough = receiverAddress.neighborhood.name
    this.shipping.to.phone = {
      number: receiverAddress.receiver_phone
    }
  }

  getProvinceCode(schema) {
    let code = schema.state.id
    if (schema.state.id.length > 2) {
      code = schema.state.id.split('-')[1]
    }
    return code
  }

  buildTotalPrice() {
    const shippingOption = this.shippingSchema.shipping_option
    this.shipping.total_price = shippingOption.list_cost
  }

  buildTrakingCodes() {
    this.shipping.tracking_codes = [
      {
        code: this.shippingSchema.tracking_number
      }
    ]
  }
}

module.exports = MlToEcomShippingBuilder