const ProductService = require('../../services/ecom_to_ml/productService')
const SKIP_TRIGGER_NAME = 'SkipTrigger'
const ECHO_SKIP = 'SKIP'
const ECHO_API_ERROR = 'STORE_API_ERR'


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

    const productService = new ProductService(user.access_token, product, { listing_type_id, category_id })
    const productData = productService.getProductByCreate()
    try {
      const response = await productService.create(productData)
      if (response.status !== 201) {
        return res.json(response.data)
      }
    } catch (error) {
      if (error && error.status === 400) {
        return res.status(400).json(error)
      }
      throw error
    }
    const resource = `products/${product._id}/metafields.json`
    const metafields = { field: 'ml_id', value: response.data.id }
    await appSdk.apiRequest(storeId, resource, 'POST', metafields)
    return res.json(response.data)
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