const ProductDirector = require('../../lib/ml-integration/product/ProductDirector')
const MlProductBuilder = require('../../lib/ml-integration/product/MlProductBuilder')
const serviceFactory = require('../../services/serviceFactory')
const functions = require('firebase-functions')
const getMlService = serviceFactory('ml')


const SKIP_TRIGGER_NAME = 'SkipTrigger'
const ECHO_SUCCESS = 'SUCCESS'
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
    const mlService = await getMlService(storeId)
    const options = { listing_type_id, category_id }
    const productDirector = new ProductDirector(new MlProductBuilder(product, mlService, options))
    productDirector.create((err, productResponse) => {
      if (err) {
        functions.logger.error(error)
        return res.status(500).send(error)
      }
      if (productResponse.error) {
        functions.logger.error(productResponse.error)
        return res.status(422).json(productResponse)
      }
      const { id } = productResponse
      const resource = `products/${product._id}/metafields.json`
      const metaFields = { field: 'ml_id', value: id }
      appSdk
        .apiRequest(storeId, resource, 'POST', metaFields)
        .then(() => {
          return res.send(ECHO_SUCCESS)
        })
        .catch(error => {
          functions.logger.error(error)
          let status = error.status ? error.status : 500
          return res.status(status).send(error)
        })
    })
  } catch (error) {
    functions.logger.error(error)
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