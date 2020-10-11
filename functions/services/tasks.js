const functions = require('firebase-functions');
const MLNotificationService = require('./ml_to_ecom/notificationService')
const ProductService = require('./ecom_to_ml/productService')
const OrderService = require('./ml_to_ecom/orderService')
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
  const { response } = await appSdk.apiRequest(parseInt(storeId), resource, 'GET')
  if (response.statusText === 'OK') {
    const { data } = response
    if (data.result && data.result.length > 0) {
      return data.result[0]._id
    }
  }
}

const handleProduct = async (appSdk, notification) => {
  try {
    if (notification.resource_id) {
      functions.logger.info('[handleProduct]')
      const resource = `/products/${notification.resource_id}/metafields.json`
      const { response } = await appSdk.apiRequest(
        parseInt(notification.store_id), resource, 'GET')

      const user = await admin
        .firestore()
        .collection('ml_app_auth')
        .doc(notification.store_id.toString())
        .get()

      for (const metafields of response.data.result.filter(({ field }) => field === 'ml_id')) {
        try {
          const productService = new ProductService(user.data().access_token, notification.body)
          const productData = productService.getProductByUpdate()
          await productService.update(metafields.value, productData)
        } catch (error) {
          functions.logger.error(error)
        }

      }
      functions.logger.info('[handleProduc]: UPDATED PRODUCTS:')
      functions.logger.info(response.data.result)
    }
    return true
  } catch (error) {
    functions.logger.error(error)
    return false
  }
}

const handleOrder = async (appSdk, notification) => {
  // Pegar os dados da ordem no mercado livre
  // Verificar se a ordem existe na ecom
  // Se existir atualizar a ordem
  // Se não existir, criar a ordem

  // Tem que verificar como vai ficar shipment

  try {

    const result = await admin
      .firestore()
      .collection('ml_app_auth')
      .where('user_id', '==', parseInt(notification.user_id, 10))
      .get()

    if (!result.empty) {
      const user = result.docs[0].data()
      const storeId = result.docs[0].id
      const mlNotificationService = new MLNotificationService(user.access_token, notification)
      const mlOrder = await mlNotificationService.getResourceData(notification.resource)
      const orderService = new OrderService(appSdk, storeId, mlOrder)
      const orderData = await orderService.getOrder()
      const orderOnEcomId = await orderService.findOrderOnEcom(mlOrder.id)
      if (orderOnEcomId) {
        functions.logger.info(`[handleOrder]: UPDATED ECOM ORDER ${orderOnEcomId}`);
        return await orderService.update(orderOnEcomId, orderData)
      }
      functions.logger.info(`[handleOrder]: CREATED ORDER ON ECOM BY ML ORLDER ID: ${mlOrder.id}`);
      return await orderService.create(orderData)
    }
    return false

    // const mlService = await getMlService(false, notification.user_id)
    // mlService.findOrder(notification.resource, async (error, order) => {
    //   functions.logger.info(`ORDER - APOS findOrder ${JSON.stringify(order)}`)
    //   if (error) {
    //     functions.logger.error(error);
    //     mlService.updateNotification(notificationId, {
    //       ...notification, hasError: true, error: error
    //     })
    //     return true
    //   }
    //   const orderDirector = new OrderDirector(new MlToEcomOrderBuilder(order, appSdk, mlService.user.storeId))
    //   const orderId = await getEcomOrder(appSdk, mlService.user.storeId, order.id)
    //   functions.logger.info(`ORDER ${orderId}`)
    //   orderDirector.save(orderId, async (error, ecomOrder) => {
    //     if (error) {
    //       error = (error || {})
    //       functions.logger.error(error);
    //       mlService.updateNotification(notificationId, {
    //         ...notification, hasError: true, error: { stack: error.stack || error, status: error.status || '' }
    //       })
    //       return true
    //     }
    //     if (!orderId && order.shipping) {
    //       return mlService.findShipping(order.shipping.id, async (error, shipping) => {
    //         if (error) {
    //           error = (error || {})
    //           functions.logger.error(error);
    //           mlService.updateNotification(notificationId, {
    //             ...notification, hasError: true, error: { stack: error.stack || error, status: error.status || '' }
    //           })
    //           return true
    //         }
    //         const shippingDirector = new ShippingDirector(new MlToEcomShippingBuilder(shipping, appSdk, mlService.user.storeId))
    //         const resource = `/orders/${ecomOrder._id}/shipping_lines.json`
    //         return appSdk
    //           .apiRequest(parseInt(mlService.user.storeId), resource, 'POST', shippingDirector.getShipping())
    //           .then(() => {
    //             mlService.removeNotification(notificationId)
    //             return true
    //           }).catch(error => {
    //             functions.logger.error(error);
    //             mlService.updateNotification(notificationId, {
    //               ...notification, hasError: true, error: error.stack || error
    //             })
    //             return true
    //           })
    //       })
    //     } else {
    //       mlService.removeNotification(notificationId)
    //       return true
    //     }
    //   })
    // })

  } catch (error) {
    functions.logger.error('[ORDER ERROR]');
    functions.logger.error(error);
    return true
  }
}


exports.onEcomNotification = functions.firestore
  .document('ecom_notifications/{documentId}')
  .onCreate(async (snap) => {
    functions.logger.info('TRIGGER ECOM NOTIFICATION', snap.data())
    const appSdk = await setup(null, true, admin.firestore())
    const notification = snap.data()
    switch (notification.resource) {
      case 'products':
        handleProduct(appSdk, notification)
        break;

      default:
        break;
    }
    return true
  })

exports.onMlNotification = functions.firestore
  .document('ml_notifications/{documentId}')
  .onCreate(async (snap) => {
    functions.logger.info('TRIGGER ML NOTIFICATION', snap.data())
    const appSdk = await setup(null, true, admin.firestore())
    const notification = snap.data()
    switch (notification.topic) {
      case 'created_orders':
        handleOrder(appSdk, notification)
        break;
      case 'orders':
        handleOrder(appSdk, notification)
        break;
      case 'orders_v2':
        handleOrder(appSdk, notification)
        break;
      case 'shipments':
        // handleShipments(appSdk, notification)
        break;
      default:
        break;
    }
    return true
  })
