// read configured E-Com Plus app data
const getAppData = require('./../../lib/store-api/get-app-data')
const ProductDirector = require('../../lib/ml-integration/ProductDirector')
const MlProductBuilder = require('../../lib/ml-integration/MlProductBuilder')

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
          const productDirector = new ProductDirector(new MlProductBuilder(trigger.body))
          productDirector.handlerProduct()
          console.log('[ML-PRODUCT-BUILDER]', productDirector.getProduct())
        } catch (error) {
          console.error('[ERROR-ML-PRODUCT-BUILDER]', error)
        }
      }
      // all done
      return res.send(ECHO_SUCCESS)
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
