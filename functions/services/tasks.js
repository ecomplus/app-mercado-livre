const functions = require('firebase-functions');
const FromMLProductService = require('./ml_to_ecom/productService')
const UtilsService = require('./utilsService')
const MLNotificationService = require('./ml_to_ecom/notificationService')
const ProductService = require('./ecom_to_ml/productService')
const ProfileService = require('./ml_to_ecom/profileService')
const OrderService = require('./ml_to_ecom/orderService')
const ShipmentService = require('./ml_to_ecom/shipmentService')
const { auth } = require('firebase-admin')
const getAppData = require('../lib/store-api/get-app-data')
const { setup } = require('@ecomplus/application-sdk')
const admin = require('firebase-admin');

const BalanceReserve = require('./balanceReserveService');


const getUser = (params) => {
  return new Promise((resolve, reject) => {
    const { notification } = params
    return admin
      .firestore()
      .collection('ml_app_auth')
      .doc(notification.store_id.toString())
      .get()
      .then(user => resolve({ ...params, user }))
      .catch(error => reject(error))
  })
}

const getEcomProduct = (params) => {
  return new Promise((resolve, reject) => {
    const { appSdk, notification } = params
    const resource = `/products/${notification.resource_id}.json`
    appSdk.apiRequest(parseInt(notification.store_id), resource, 'GET')
      .then(({ response }) => {
        resolve({
          ...params, product: {
            status: response.status, data: response.data
          }
        })
      })
      .catch(error => reject(error))
  })
}

const getMlCategory = (params) => {
  return new Promise((resolve, reject) => {
    const { user, product } = params
    const utilsService = new UtilsService(user.data())
    return utilsService.getCategory(product.category_id)
      .then(category => resolve({ ...params, category }))
      .catch(error => reject(error))
  })
}

const createProduct = (params) => {
  return new Promise((resolve, reject) => {
    const { appSdk, user, product, ecomProduct, notification, category } = params
    const { category_id, listing_type_id } = product
    const accessToken = user.data().access_token
    const storeId = notification.store_id
    const productService = new ProductService(appSdk, accessToken, ecomProduct, storeId, {}, category, { listing_type_id, category_id })
    return productService.create()
      .then(result => resolve({ ...params, result }))
      .catch(error => reject(error))
  })
}

const linkProduct = (params) => {
  return new Promise((resolve, reject) => {
    const { appSdk, notification, result, ecomProduct, product } = params
    const fromMLProductService = new FromMLProductService(appSdk, notification.store_id)
    return fromMLProductService.link(result.data.id, ecomProduct._id, product)
      .then(() => resolve(params))
      .catch(error => reject(error))
  })
}

const createProducts = (params) => {
  return new Promise((resolve, reject) => {
    const { appSdk, notification } = params
    const productsToExport = notification.body.exportation_products || []
    const products = []
    for (const product of productsToExport) {
      const resource = `/products/${product.product_id}.json`
      products.push(
        appSdk.apiRequest(parseInt(notification.store_id, 10), resource, 'GET')
          .then(({ response }) => getMlCategory({ ...params, product, ecomProduct: response.data }))
          .then(createProduct)
          .then(linkProduct)
      )
    }
    return Promise.all(products)
      .then(values => {
        return resolve(values.map(({ result }) => ({ status: result.status, data: result.data })))
      })
      .catch(error => reject(error))
  })
}

const exportProducts = (appSdk, notification) => {
  return new Promise((resolve, reject) => {
    getUser({ appSdk, notification })
      .then(createProducts)
      .then(result => resolve(result))
      .catch(error => reject(error))
  })
}

const getMlMetadata = (params) => {
  return new Promise((resolve, reject) => {
    const { appSdk, notification } = params
    getAppData({ appSdk, storeId: notification.store_id, auth })
      .then(data => {
        const productCorrelations = data.product_correlations || {}
        const mlMetadata = (productCorrelations[notification.resource_id] || [])
          .map((mlMetadata) => mlMetadata)

        return resolve({ ...params, mlMetadata })
      })
      .catch(error => reject(error))
  })
}

const updateProducts = (params) => {
  return new Promise((resolve, reject) => {
    const { appSdk, user, product, notification, mlMetadata } = params
    const productsToUpdate = []
    for (const metadata of mlMetadata) {
      const data = { ...product, ...notification.body }
      const accessToken = user.data().access_token
      const storeId = notification.store_id
      const productService = new ProductService(appSdk, accessToken, data, storeId, metadata)
      productsToUpdate.push(productService.update())
    }
    return Promise.all(productsToUpdate)
      .then(values => resolve({ ...params, result: values }))
      .catch(error => {
        return reject(error)
      })
  })
}

const handleUpdateProduct = (appSdk, notification) => {
  return new Promise((resolve, reject) => {
    getUser({ appSdk, notification })
      .then(getEcomProduct)
      .then(getMlMetadata)
      .then(updateProducts)
      .then(({ result }) => {
        resolve(result)
      })
      .catch(error => {
        reject(error)
      })
  })
}

const handleLinkProduct = async (appSdk, notification) => {
  try {
    const { body, store_id } = notification
    const products = body.link_products || []
    for (const product of products) {
      try {
        const { product_id, ml_product_id } = product
        const fromMLProductService = new FromMLProductService(appSdk, store_id)
        await fromMLProductService.link(ml_product_id, product_id, product)
      } catch (error) {
        throw error
      }
    }
    Promise.resolve(true)
  }
  catch (error) {
    throw error
  }
}

const handleShipment = async (appSdk, storeId, mlNotificationService, ecomOrderId, mlShipmentId) => {
  try {
    const mlShipment = await mlNotificationService.getResourceData(`/shipments/${mlShipmentId}`)
    const shipmentService = new ShipmentService(appSdk, storeId, mlShipment)
    const shipmentData = shipmentService.getDataToCreate()
    await shipmentService.create(ecomOrderId, shipmentData)
    return Promise.resolve(true)
  } catch (error) {
    throw error
  }
}

const handleBalanceReserve = (storeId, mlOrder, ecomStatus = false) => {
  let { status, order_items } = mlOrder
  if (status !== ecomStatus) {
    let operation
    if (status === 'payment_required') {
      operation = 'increase'
    }
    if (status === 'paid' && ecomStatus !== status) {
      operation = 'decrease'
    }
    if (ecomStatus === 'payment_required' && ecomStatus !== status) {
      operation = 'decrease'
    }
    if (operation) {
      for (const product of order_items) {
        const { quantity, item } = product
        let sku = item.seller_custom_field
        if (product.variation_id) {
          const attribute = product.variation_attributes.find(attr => attr.id === 'SELLER_SKU')
          if (attribute && attribute.value) {
            sku = attribute.value
          }
        }
        if (sku) {
          const balanceReserve = new BalanceReserve(storeId, sku)
          balanceReserve[operation](quantity)
        }
      }
    }
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
        await handleShipment(appSdk, storeId, mlNotificationService, response.data._id, mlOrder.shipping.id)
        handleBalanceReserve(storeId, mlOrder, false)
      } else {
        const orderDataToUpdate = orderService.getOrderToUpdate()
        const mlOrderStatusOnEcom = await orderService.findMLOrderStatus(orderOnEcomId)
        if (mlOrderStatusOnEcom !== mlOrder.status) {
          await orderService.update(orderOnEcomId, orderDataToUpdate)
          handleBalanceReserve(mlOrder, mlOrderStatusOnEcom)
          await handleShipment(appSdk, storeId, mlNotificationService, orderOnEcomId, mlOrder.shipping.id)
        }
      }
      return Promise.resolve(true)
    }
    return Promise.resolve(true)
  } catch (error) {
    return Promise.reject(error)
  } finally {
    await snap.ref.delete()
  }
}

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

const handleUpdateMLProfile = async (snap) => {
  try {
    const appSdk = await setup(null, true, admin.firestore())
    const utilsService = new UtilsService(snap.data())
    const userInfo = await utilsService.getUserInfo()
    const profileService = new ProfileService(appSdk, snap.id)
    return profileService.updateUserInfo(userInfo)
  } catch (error) {
    throw error
  }
}

exports.onEcomNotification = functions.firestore
  .document('ecom_notifications/{documentId}')
  .onCreate(async (snap) => {
    const appSdk = await setup(null, true, admin.firestore())
    const notification = snap.data()
    switch (notification.resource) {
      case 'products':
        await handleUpdateProduct(appSdk, notification)
        break;
      case 'applications':
        await exportProducts(appSdk, notification)
        await handleLinkProduct(appSdk, notification)
        break;
      default:
        break;
    }
    snap.ref.delete()
    return true
  })


exports.onMLCreateAuthentication = functions.firestore
  .document('ml_app_auth/{documentId}')
  .onCreate(async (snap) => {
    return await handleUpdateMLProfile(snap)
  })


exports.exportProducts = exportProducts
exports.handleMLNotification = handleMLNotification
exports.handleUpdateProduct = handleUpdateProduct
exports.handleUpdateMLProfile = handleUpdateMLProfile