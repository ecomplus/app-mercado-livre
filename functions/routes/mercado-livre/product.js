const getAppData = require('../../lib/store-api/get-app-data')
const ProductDirector = require('../../lib/ml-integration/product/ProductDirector')
const MlProductBuilder = require('../../lib/ml-integration/product/MlProductBuilder')
const getMlInstance = require('../../lib/ml-integration/get-meli-instance')


const SKIP_TRIGGER_NAME = 'SkipTrigger'
const ECHO_SUCCESS = 'SUCCESS'
const ECHO_SKIP = 'SKIP'
const ECHO_API_ERROR = 'STORE_API_ERR'


exports.post = ({ admin, appSdk }, req, res) => {
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
  return getAppData({ appSdk, storeId }, true)
    .then((config) => {
      try {
        getMlInstance(admin, storeId)
          .then(mlInstance => {
            const options = { listing_type_id, category_id }
            const productDirector = new ProductDirector(new MlProductBuilder(product, mlInstance, options))
            productDirector.create((err, productResponse) => {
              if (err) {
                throw err
              }
              if (productResponse.error) {
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
                .catch(err => {
                  throw err
                })
            })
          }).catch((err => { throw err }))
      } catch (error) {
        console.error('[ERROR PRODUCT INTEGRATE]', error)
        throw error
      }
    })
    .catch(err => {
      if (err.name === SKIP_TRIGGER_NAME) {
        res.send(ECHO_SKIP)
      } else {
        res.status(500)
        const { message } = err
        res.send({
          error: ECHO_API_ERROR,
          message
        })
      }
    })
}