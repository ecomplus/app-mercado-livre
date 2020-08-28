const OrderDirector = require('../../lib/ml-integration/order/OrderDirector.js')
const MlToEcomOrderBuilder = require('../../lib/ml-integration/order/MlToEcomOrderBuilder')
const meli = require('mercadolibre')
const { ml } = require('firebase-functions').config()
const serviceFactory = require('../../services/serviceFactory')
const getMlService = serviceFactory('ml')

const SKIP_TRIGGER_NAME = 'SkipTrigger'
const ECHO_SUCCESS = 'SUCCESS'
const ECHO_SKIP = 'SKIP'
const ECHO_API_ERROR = 'STORE_API_ERR'

exports.post = async ({ admin, appSdk }, req, res) => {
  try {
    const { body } = req
    if (!body.topic === 'orders_v2') {
      return res.send('ok')
    }
    const mlService = await getMlService(false, body.user_id)
    mlService.findOrder(body.resource, (error, order) => {
      if (error) {
        return res.status(500).send(error)
      }
      const orderDirector = new OrderDirector(new MlToEcomOrderBuilder(order, appSdk, mlService.user.storeId))
      orderDirector.create((error, order) => {
        if (error) {
          let status = error.status ? error.status : 500
          return res.status(status).send(error)
        }
        return res.json(order)
      })
    })
  } catch (error) {
    if (error.name === SKIP_TRIGGER_NAME) {
      res.send(ECHO_SKIP)
    } else {
      res.status(500)
      const { message } = error
      res.send({
        error: ECHO_API_ERROR,
        message
      })
    }
  }
}
