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
    // if (notification.topic !== 'orders_v2') {
    //   return res.send(ECHO_SUCCESS)
    // }
    mlService = await getMlService(false, notification.user_id)
    if (await mlService.hasNotification(notification)) {
      return res.status(422).send('processing for this resource already exists')
    }
    await mlService.createNotification(notification)
    return res.send(ECHO_SUCCESS)
    // mlService.findOrder(notification.resource, async (error, order) => {
    //   if (error) {
    //     await mlService.removeNotification(notificationId)

    //     return res.status(500).send(error)
    //   }
    //   const orderDirector = new OrderDirector(new MlToEcomOrderBuilder(order, appSdk, mlService.user.storeId))
    //   orderDirector.create(async (error, ecomOrder) => {
    //     console.log(error, ecomOrder)
    //     if (error) {
    //       let status = error.status ? error.status : 500
    //       await mlService.removeNotification(notificationId)
    //       return res.status(status).send(error)
    //     }
    //     await mlService.removeNotification(notificationId)
    //     if (order.shipping) {
    //       return mlService.findShipping(order.shipping.id, async (error, shipping) => {
    //         if (error) {
    //           let status = error.status ? error.status : 500
    //           await mlService.removeNotification(notificationId)
    //           return res.status(status).send(error)
    //         }
    //         const shippingDirector = new ShippingDirector(new MlToEcomShippingBuilder(shipping, appSdk, mlService.user.storeId))
    //         const resource = `/orders/${ecomOrder._id}/shipping_lines.json`
    //         return appSdk
    //           .apiRequest(parseInt(mlService.user.storeId), resource, 'POST', shippingDirector.getShipping())
    //           .then(() => {
    //             return res.send(ECHO_SUCCESS)
    //           }).catch( error => res.send(error))
    //       })
    //     } else {
    //       return res.send(ECHO_SUCCESS)
    //     }
    //   })
    // })

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
