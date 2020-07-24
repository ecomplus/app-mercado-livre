// read configured E-Com Plus app data
const getAppData = require('./../../lib/store-api/get-app-data')
const ProductDirector = require('../../lib/ml-integration/ProductDirector')
const MlProductBuilder = require('../../lib/ml-integration/MlProductBuilder')
const getMlInstance = require('../../lib/ml-integration/get-meli-instance')

const SKIP_TRIGGER_NAME = 'SkipTrigger'
const ECHO_SUCCESS = 'SUCCESS'
const ECHO_SKIP = 'SKIP'
const ECHO_API_ERROR = 'STORE_API_ERR'

exports.post = ({ admin, appSdk }, req, res) => {
  // receiving notification from Store API
  const { storeId } = req

  /**
   * Treat E-Com Plus trigger body here
   * Ref.: https://developers.e-com.plus/docs/api/#/store/triggers/
   */
  const trigger = req.body

  // get app configured options
  getAppData({ appSdk, storeId })

    .then(appData => {
      if (
        Array.isArray(appData.ignore_triggers) &&
        appData.ignore_triggers.indexOf(trigger.resource) > -1
      ) {
        // ignore current trigger
        const err = new Error()
        err.name = SKIP_TRIGGER_NAME
        throw err
      }

      /* DO YOUR CUSTOM STUFF HERE */
      if (trigger.resource === 'products') {
        try {
          getMlInstance(admin, storeId)
            .then(mlInstance => {
              console.log('[WEBHOOK ML INSTANCE]', mlInstance)
              const productDirector = new ProductDirector(new MlProductBuilder(mlInstance, rigger.body))
              productDirector.handlerProduct()
              productDirector.save((err, res) => {
                if (err) {
                  throw err
                }
                const { _id } = res
                const resource = `products/${trigger.body._id}.json`
                appSdk
                  .apiRequest(storeId, resource, 'PATCH', {
                    hidden_metafields: [
                      {
                        id: Date.now().toString(16),
                        namespace: 'ml_id',
                        value: _id
                      }
                    ]
                  })
                  .then(r => {
                    console.log('[apiRequest]', r)
                    return res.send(ECHO_SUCCESS)
                  })
                  .catch(err => { throw err })
              })
            }).catch((err => { throw err }))
        } catch (error) {
          console.error('[ERROR PRODUCT INTEGRATE]', error)
          throw error
        }
      }
    })
    .catch(err => {
      if (err.name === SKIP_TRIGGER_NAME) {
        // trigger ignored by app configuration
        res.send(ECHO_SKIP)
      } else {
        // console.error(err)
        // request to Store API with error response
        // return error status code
        res.status(500)
        const { message } = err
        res.send({
          error: ECHO_API_ERROR,
          message
        })
      }
    })
}
