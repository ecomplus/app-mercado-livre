const FromEcomProductService = require('../../services/ecom_to_ml/productService')
const FromMLProductService = require('../../services/ml_to_ecom/productService')
const UtilsService = require('../../services/utilsService')
const SKIP_TRIGGER_NAME = 'SkipTrigger'
const ECHO_SKIP = 'SKIP'
const ECHO_API_ERROR = 'STORE_API_ERR'

exports.get = async ({ admin }, req, res) => {
  try {
    const storeId = parseInt(req.get('x-store-id'), 10) || req.query.storeId
    if (!storeId) {
      res.status(401)
      return res.send({
        error: 'Unauthorized',
        message: 'Missing store_id'
      })
    }

    const result = await admin
      .firestore()
      .collection('ml_app_auth')
      .doc(storeId.toString())
      .get()

    const user = result.data()

    const utilsService = new UtilsService(user)
    const products = await utilsService.getProducts()
    return res.json(products)

  } catch (error) {
    if (error.response) {
      return res.status(422).send(error.response)
    }
    return res.status(500).send(error.message)
  }
}

exports.post = async ({ admin, appSdk }, req, res) => {
  try {
    const storeId = parseInt(req.get('x-store-id'), 10) || req.query.storeId
    const { body } = req
    if (!storeId) {
      res.status(401)
      return res.send({
        error: 'Unauthorized',
        message: 'Missing store_id'
      })
    }
    const { listing_type_id, category_id, product } = body


    if (!listing_type_id || !category_id || !product) {
      res.status(400)
      return res.send({
        error: 'Bad Request',
        message: 'The body does not contains some or none of the following properties [listing_type_id, category_id, product]'
      })
    }

    const result = await admin
      .firestore()
      .collection('ml_app_auth')
      .doc(storeId.toString())
      .get()

    const user = result.data()

    const productService = new FromEcomProductService(user.access_token, product, { listing_type_id, category_id })
    const productData = productService.getProductByCreate()
    try {
      const response = await productService.create(productData)
      if (response.status !== 201) {
        return res.json(response.data)
      }
      const fromMLProductService = new FromMLProductService(appSdk, storeId)
      await fromMLProductService.link(response.data.id, product._id)
      return res.json(response.data)
    } catch (error) {
      if (error && error.status === 400) {
        return res.status(400).json(error)
      }
      return res.status(500).send(error)
    }
  } catch (error) {
    console.log(error)
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