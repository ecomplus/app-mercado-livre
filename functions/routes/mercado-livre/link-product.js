const FromMLProductService = require('../../services/ml_to_ecom/productService')
const SKIP_TRIGGER_NAME = 'SkipTrigger'
const ECHO_SKIP = 'SKIP'
const ECHO_API_ERROR = 'STORE_API_ERR'


exports.post = async ({ appSdk }, req, res) => {
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
    const { ecom_product_id, ml_product_id } = body


    if (!ecom_product_id || !ml_product_id) {
      res.status(400)
      return res.send({
        error: 'Bad Request',
        message: 'The body does not contains some or none of the following properties [ecom_product_id, ml_product_id]'
      })
    }

    const fromMLProductService = new FromMLProductService(appSdk, storeId)
    await fromMLProductService.link(ml_product_id, ecom_product_id)
    return res.status(204).send()

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