const functions = require('firebase-functions');
const MLNotificationService = require('./ml_to_ecom/notificationService')
const ProductService = require('./ecom_to_ml/productService')
const OrderService = require('./ml_to_ecom/orderService')
const { setup } = require('@ecomplus/application-sdk')
const admin = require('firebase-admin');

const ORDER_ML_USER_NOT_FOUND = '[handleOrder]: ERROR TO HANDLER ORDER, ML USER NOT FOUND'
const ORDER_CREATED_SUCCESS = '[handleOrder]: CREATED ORDER ON ECOM BY ML ORLDER '
const ORDER_UPDATED_SUCCESS = '[handleOrder]: UPDATED ORDER ON ECOM'
const ORDER_ALREADY_EXISTS = '[handleOrder]: ERROR TO CREATE ORDER ON ECOM BY ML ORLDER, ORDER ALREADY EXISTS'
const ORDER_NOT_FOUND = '[handleOrder]: ERROR TO UPDATED ECOM ORDER, ML ORDER NOT FOUND IN ECOM'



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

const handleOrder = async (appSdk, snap) => {
  try {
    const notification = snap.data()
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
      const orderOnEcomId = await orderService.findOrderOnEcom(mlOrder.id)
      if (notification.topic === 'created_orders') {
        if (!orderOnEcomId) {
          const orderDataToCreate = await orderService.getOrderToCreate()
          await orderService.create(orderDataToCreate)
          functions.logger.info(`${ORDER_CREATED_SUCCESS} ID: ${mlOrder.id}`);
          await snap.ref.delete()
          return true
        }
        functions.logger.error(`${ORDER_ALREADY_EXISTS} ML: ${mlOrder.id} ECOM: ${orderOnEcomId}`);
        await snap.ref.delete()
        return false
      } else {
        if (orderOnEcomId) {
          setTimeout(async () => {
            const orderDataToUpdate = orderService.getOrderToUpdate()
            const mlOrderStatusOnEcom = await orderService.findMLOrderStatus(orderOnEcomId)
            if (mlOrderStatusOnEcom !== mlOrder.status) {
              await orderService.update(orderOnEcomId, orderDataToUpdate)
              functions.logger.info(`${ORDER_UPDATED_SUCCESS} ID: ${orderOnEcomId}`);
            }
            await snap.ref.delete()
            return true
          }, 3000)
        }
        functions.logger.error(`${ORDER_NOT_FOUND} ML ORDER ID: ${mlOrder.id}`);
        await snap.ref.delete()
        // snap.ref.set({ error: `${ORDER_NOT_FOUND} ML ORDER ID: ${mlOrder.id}` }, { merge: true })
        return false
      }
    }
    functions.logger.error(` ${ORDER_ML_USER_NOT_FOUND} - ${notification}`);
    await snap.ref.delete()
    // snap.ref.set({ error: ` ${ORDER_ML_USER_NOT_FOUND} - ${notification}` }, { merge: true })
    return false
  } catch (error) {
    functions.logger.error('[handleOrder]: FATAL ERROR');
    functions.logger.error(error);
    await snap.ref.delete()
    // snap.ref.set({ error: JSON.stringify(error) }, { merge: true })
    return false
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
        handleOrder(appSdk, snap)
        break;
      case 'orders':
        handleOrder(appSdk, snap)
        break;
      case 'orders_v2':
        handleOrder(appSdk, snap)
        break;
      case 'shipments':
        // handleShipments(appSdk, notification)
        break;
      default:
        snap.ref.delete()
        break;
    }
    return true
  })
