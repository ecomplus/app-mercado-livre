const OrderDirector = require('../../lib/ml-integration/order/OrderDirector.js')
const MlToEcomOrderBuilder = require('../../lib/ml-integration/order/MlToEcomOrderBuilder')
const serviceFactory = require('../../services/serviceFactory')
const getMlService = serviceFactory('ml')

const SKIP_TRIGGER_NAME = 'SkipTrigger'
const ECHO_SUCCESS = 'SUCCESS'
const ECHO_SKIP = 'SKIP'
const ECHO_API_ERROR = 'STORE_API_ERR'

exports.post = async ({ appSdk }, req, res) => {
  let mlService
  let notification = req.body
  try {
    if (!notification.topic === 'orders_v2') {
      return res.send('ok')
    }
    mlService = await getMlService(false, notification.user_id)
    if (await mlService.hasNotification(notification)) {
      return res.status(422).send('processing for this resource already exists')
    }
    const notificationId = mlService.saveNotification(notification)
    mlService.findOrder(notification.resource, async (error, order) => {
      if (error) {
        await mlService.removeNotification(notificationId)

        return res.status(500).send(error)
      }
      const orderDirector = new OrderDirector(new MlToEcomOrderBuilder(order, appSdk, mlService.user.storeId))
      orderDirector.create(async (error) => {
        if (error) {
          let status = error.status ? error.status : 500
          await mlService.removeNotification(notificationId)
          return res.status(status).send(error)
        }
        await mlService.removeNotification(notificationId)
        return res.send(ECHO_SUCCESS)
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
