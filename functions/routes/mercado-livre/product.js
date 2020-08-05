const getAppData = require('../../lib/store-api/get-app-data')
const ProductDirector = require('../../lib/ml-integration/ProductDirector')
const MlProductBuilder = require('../../lib/ml-integration/MlProductBuilder')
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
  return getAppData({ appSdk, storeId }, true)
    .then((config) => {
      console.log('[config]', config)
      try {
        getMlInstance(admin, storeId)
          .then(mlInstance => {
            const productDirector = new ProductDirector(new MlProductBuilder(body, mlInstance))
            productDirector.create((err, productResponse) => {
              if (err) {
                console.log(err)
                throw err
              }
              const { id } = productResponse
              const resource = `products/${body._id}/metafields.json`
              const metaFields = { field: 'ml_id', value: id }
              appSdk
                .apiRequest(storeId, resource, 'POST', metaFields)
                .then(() => {
                  return res.send(ECHO_SUCCESS)
                })
                .catch(err => {
                  console.log('[apiRequest ERROR]', err)
                  err.name = SKIP_TRIGGER_NAME
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