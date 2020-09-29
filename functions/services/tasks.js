const functions = require('firebase-functions');
const OrderDirector = require('../lib/ml-integration/order/OrderDirector.js')
const ShippingDirector = require('../lib/ml-integration/order/ShippingDirector.js')
const MlToEcomOrderBuilder = require('../lib/ml-integration/order/MlToEcomOrderBuilder')
const MlToEcomShippingBuilder = require('../lib/ml-integration/order/MlToEcomShippingBuilder')
const serviceFactory = require('../services/serviceFactory')
const getMlService = serviceFactory('ml')
const { setup } = require('@ecomplus/application-sdk')
const admin = require('firebase-admin');


exports.onNotification = functions.firestore.document('ml_notifications/{documentId}')
  .onCreate(async (snap) => {
    console.log(snap.id)
    const appSdk = await setup(null, true, admin.firestore())
    const notification = snap.data()
    const notificationId = snap.id
    mlService = await getMlService(false, notification.user_id)
    mlService.findOrder(notification.resource, async (error, order) => {
      if (error) {
        console.log(notificationId, 'notificationId')
        mlService.updateNotification(notificationId, {
          ...notification, hasError: true, error: error
        })
        return true
      }
      const orderDirector = new OrderDirector(new MlToEcomOrderBuilder(order, appSdk, mlService.user.storeId))
      orderDirector.create(async (error, ecomOrder) => {
        if (error) {
          console.log(notificationId, 'notificationId')
          mlService.updateNotification(notificationId, {
            ...notification, hasError: true, error: { stack: error.stack, status: error.status}
          })
          return true
        }
        if (order.shipping) {
          return mlService.findShipping(order.shipping.id, async (error, shipping) => {
            if (error) {
              mlService.updateNotification(notificationId, {
                ...notification, hasError: true, error: { stack: error.stack, status: error.status}
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
              }).catch( error => {
                mlService.updateNotification(notificationId, {
                  ...notification, hasError: true, error: error
                })
                return true
              })
          })
        } else {
          return res.send(ECHO_SUCCESS)
        }
      })
    })


    return true
})


