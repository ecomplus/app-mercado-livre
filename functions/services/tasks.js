const functions = require('firebase-functions');
const OrderDirector = require('../lib/ml-integration/order/OrderDirector.js')
const ShippingDirector = require('../lib/ml-integration/order/ShippingDirector.js')
const MlToEcomOrderBuilder = require('../lib/ml-integration/order/MlToEcomOrderBuilder')
const MlToEcomShippingBuilder = require('../lib/ml-integration/order/MlToEcomShippingBuilder')
const serviceFactory = require('../services/serviceFactory')
const getMlService = serviceFactory('ml')
const { setup } = require('@ecomplus/application-sdk')
const admin = require('firebase-admin');

const getEcomOrder = async (appSdk, storeId, mlOrderId) => {
  const resource = `/orders.json?metafields.field=ml_order_id&metafields.value=${mlOrderId}&fields=metafields&limit=1&sort=-created_at`
  console.log(mlOrderId)
  const { response  }= await appSdk.apiRequest(parseInt(storeId), resource, 'GET')
  if (response.statusText === 'OK') {
    const { data } = response
    if (data.result && data.result.length > 0) {
      return data.result[0]._id
    }
  }

}


exports.onNotification = functions.firestore.document('ml_notifications/{documentId}')
  .onCreate(async (snap) => {
    functions.logger.info(`ORDER ${JSON.stringify(snap.data())}`)
    const appSdk = await setup(null, true, admin.firestore())
    const notification = snap.data()
    const notificationId = snap.id
    if (notification.topic !== 'orders_v2') {
      return true
    }
    const mlService = await getMlService(false, notification.user_id)
    mlService.findOrder(notification.resource, async (error, order) => {
      if (error) {
        functions.logger.error(error);
        mlService.updateNotification(notificationId, {
          ...notification, hasError: true, error: error
        })
        return true
      }
      const orderDirector = new OrderDirector(new MlToEcomOrderBuilder(order, appSdk, mlService.user.storeId))
      const orderId = await getEcomOrder(appSdk, mlService.user.storeId, order.id)
      functions.logger.info(`ORDER ${orderId}`)
      orderDirector.save(orderId, async (error, ecomOrder) => {
        if (error) {
          error = (error || {})
          functions.logger.error(error);
          mlService.updateNotification(notificationId, {
            ...notification, hasError: true, error: { stack: error.stack || error, status: error.status || '' }
          })
          return true
        }
        if (!orderId && order.shipping) {
          return mlService.findShipping(order.shipping.id, async (error, shipping) => {
            if (error) {
              error = (error || {})
              functions.logger.error(error);
              mlService.updateNotification(notificationId, {
                ...notification, hasError: true, error: { stack: error.stack || error, status: error.status || '' }
              })
              return true
            }
            const shippingDirector = new ShippingDirector(new MlToEcomShippingBuilder(shipping, appSdk, mlService.user.storeId))
            const resource = `/orders/${ecomOrder._id}/shipping_lines.json`
            return appSdk
              .apiRequest(parseInt(mlService.user.storeId), resource, 'POST', shippingDirector.getShipping())
              .then(() => {
                mlService.removeNotification(notificationId)
                return true
              }).catch(error => {
                functions.logger.error(error);
                mlService.updateNotification(notificationId, {
                  ...notification, hasError: true, error: error.stack || error
                })
                return true
              })
          })
        } else {
          mlService.removeNotification(notificationId)
          return true
        }
      })
    })
  })


