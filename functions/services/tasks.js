const functions = require('firebase-functions');
const FromEcomProductService = require('./ecom_to_ml/productService')
const FromMLProductService = require('./ml_to_ecom/productService')
// const UtilsService = require('./utilsService')
const MLNotificationService = require('./ml_to_ecom/notificationService')
const ProductService = require('./ecom_to_ml/productService')
const OrderService = require('./ml_to_ecom/orderService')
const ShipmentService = require('./ml_to_ecom/shipmentService')

const { setup } = require('@ecomplus/application-sdk')
const admin = require('firebase-admin');

const ORDER_ML_USER_NOT_FOUND = '[handleOrder]: ERROR TO HANDLER ORDER, ML USER NOT FOUND'
const ORDER_CREATED_SUCCESS = '[handleOrder]: CREATED ORDER ON ECOM BY ML ORLDER '
const ORDER_UPDATED_SUCCESS = '[handleOrder]: UPDATED ORDER ON ECOM'

const SHIPMENT_CREATED_SUCCESS = '[handleShipment]: SUCCESS TO CREATED SHIPMENT'
const SHIPMENT_CREATED_ERROR = '[handleShipment]: ERROR TO CREATED SHIPMENT'
const log = require('./logService');


const handleExportationProducts = async (appSdk, notification) => {
  functions.logger.info(`[handleApplication]: HANDLER APPLICATION`)
  try {
    const products = notification.body.exportation_products || []
    for (const product of products) {
      try {
        const { listing_type_id, category_id, product_id } = product
        if (!listing_type_id || !category_id || !product_id) {
          functions.logger.error('[handleApplication]: The body does not contains some or none of the following properties [listing_type_id, category_id, product_id]')
          return
        }
        const result = await admin
          .firestore()
          .collection('ml_app_auth')
          .doc(notification.store_id.toString())
          .get()

        const user = result.data()
        const resource = `/products/${product_id}.json`
        const { response } = await appSdk.apiRequest(parseInt(notification.store_id), resource, 'GET')
        const productService = new FromEcomProductService(user.access_token, response.data, { listing_type_id, category_id })
        const productData = await productService.getProductByCreate()
        try {
          const mlResponse = await productService.create(productData)
          if (mlResponse.status !== 201) {
            functions.logger.info(`[handleApplication]: SUCCESS TO CREATE PRODUCT ON ML: ${mlResponse.data}`)
            log(appSdk, notification.store_id, '[handleApplication]', mlResponse.data)
          }
          const fromMLProductService = new FromMLProductService(appSdk, notification.store_id)
          await fromMLProductService.link(mlResponse.data.id, product_id)
        } catch (error) {
          if (error.response) {
            functions.logger.error(`[handleApplication]: ERROR TO CREATE PRODUCT ON ML: ${json.stringify(error.response)}`)
            log(appSdk, notification.store_id, '[handleApplication]', new Error(error.response))
          }
          functions.logger.error(`[handleApplication]: ERROR TO CREATE PRODUCT ON ML: ${error}`)
          log(appSdk, notification.store_id, '[handleApplication]', new Error(error))
        }
      } catch (error) {
        functions.logger.error(`[handleApplication]: ERROR TO CREATE PRODUCT ON ML: ${error}`)
      }

    }
    Promise.resolve(true)
  } catch (error) {
    Promise.reject(error)
  }
}

const handleUpdateProduct = async (appSdk, notification) => {
  try {
    if (notification.resource_id) {
      functions.logger.info('[handleProduct]')
      const user = await admin
        .firestore()
        .collection('ml_app_auth')
        .doc(notification.store_id.toString())
        .get()
      const resource = `/products/${notification.resource_id}.json`
      const { response } = await appSdk.apiRequest(parseInt(notification.store_id), resource, 'GET')
      const { data } = response
      for (const metafields of (data.metafields || []).filter(({ field }) => field === 'ml_id')) {
        try {
          const productService = new ProductService(user.data().access_token, { ...data, ...notification.body })
          const productData = await productService.getProductByUpdate(metafields.value)
          await productService.update(metafields.value, productData)
        } catch (error) {
          functions.logger.error(error)
        }

      }
      functions.logger.info('[handleProduc]: UPDATED PRODUCTS:')
      functions.logger.info(response.data.result)
    }
    return Promise.resolve(true)
  } catch (error) {
    functions.logger.error(error)
    return Promise.reject(error)
  }
}
exports.handleUpdateProduct = handleUpdateProduct

const handleLinkProduct = async (appSdk, notification) => {
  try {
    const { body, store_id } = notification
    const products = body.link_products || []
    for (const product of products) {
      try {
        const { product_id, ml_product_id } = product
        if (!product_id || !ml_product_id) {
          functions.logger.error('[linkProduct]: The body does not contains some or none of the following properties [ecom_product_id, ml_product_id]')
        }
        const fromMLProductService = new FromMLProductService(appSdk, store_id)
        await fromMLProductService.link(ml_product_id, product_id)
      } catch (error) {
        functions.logger.error(error)
      }
    }
    Promise.resolve(true)
  }
  catch (error) {
    functions.logger.error(error)
    Promise.reject(error)
  }
}

const handleShipment = async (appSdk, storeId, mlNotificationService, ecomOrderId, mlShipmentId) => {
  try {
    const mlShipment = await mlNotificationService.getResourceData(`/shipments/${mlShipmentId}`)
    const shipmentService = new ShipmentService(appSdk, storeId, mlShipment)
    const shipmentData = shipmentService.getDataToCreate()
    await shipmentService.create(ecomOrderId, shipmentData)
    functions.logger.info(`${SHIPMENT_CREATED_SUCCESS} TO ORDER: ${ecomOrderId}`)
    return Promise.resolve(true)
  } catch (error) {
    functions.logger.error(`${SHIPMENT_CREATED_ERROR} TO SHIPMENT ON ML: ${mlShipmentId}`)
    functions.logger.error(error)
    return Promise.reject(error)
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
      if (!orderOnEcomId) {
        const orderDataToCreate = await orderService.getOrderToCreate()
        const { response } = await orderService.create(orderDataToCreate)
        functions.logger.info(`${ORDER_CREATED_SUCCESS} ID: ${mlOrder.id}`);
        await handleShipment(appSdk, storeId, mlNotificationService, response.data._id, mlOrder.shipping.id)
      } else {
        const orderDataToUpdate = orderService.getOrderToUpdate()
        const mlOrderStatusOnEcom = await orderService.findMLOrderStatus(orderOnEcomId)
        if (mlOrderStatusOnEcom !== mlOrder.status) {
          await orderService.update(orderOnEcomId, orderDataToUpdate)
          functions.logger.info(`${ORDER_UPDATED_SUCCESS} ID: ${orderOnEcomId}`);
          await handleShipment(appSdk, storeId, mlNotificationService, orderOnEcomId, mlOrder.shipping.id)
        } else {
          functions.logger.info(`[handleOrder] SKIPPED ORDER NOT HAS CHANGED: ${mlOrderStatusOnEcom}`);
        }
      }
      return Promise.resolve(true)
    }
    functions.logger.error(` ${ORDER_ML_USER_NOT_FOUND} - ${notification}`);
    return Promise.resolve(true)
  } catch (error) {
    functions.logger.error(`[handleOrder]: FATAL ERROR ${JSON.stringify(error)}`);
    return Promise.reject(error)
  } finally {
    await snap.ref.delete()
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
        await handleUpdateProduct(appSdk, notification)
        break;
      case 'applications':
        await handleExportationProducts(appSdk, notification)
        await handleLinkProduct(appSdk, notification)
        break;
      default:
        break;
    }
    snap.ref.delete()
    return true
  })

const handleMLNotification = async (snap) => {
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
}

exports.handleMLNotification = handleMLNotification
