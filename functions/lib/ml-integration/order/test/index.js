const getAppData = require('../../../store-api/get-app-data')
const OrderDirector = require('../OrderDirector')
const MlToEcomOrderBuilder = require('../MlToEcomOrderBuilder')
const mlOrder = require('./mlOrder.json')

const createOrder = () => {
  try {
    const storeId = 1011
    getAppData({ appSdk, storeId }, true)
    const orderDirector = new OrderDirector(new MlToEcomOrderBuilder(mlOrder))
    orderDirector.create((err, productResponse) => {
      if (err) {
        console.log(err)
        throw err
      }
      console.log(productResponse)
    })
  } catch (error) {
    console.error('[ERROR PRODUCT INTEGRATE]', error)
    throw error
  }
}

createOrder()