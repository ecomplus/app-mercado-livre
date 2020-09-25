// read configured E-Com Plus app data
const getAppData = require('./../../lib/store-api/get-app-data')

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
      console.log('[fields] ==> ', trigger.fields)
      console.log('[body] ==> ', trigger.body)
      console.log('[resource_id] ==> ', trigger.resource_id)
      console.log('[method] ==> ', trigger.method)
      console.log('[action] ==> ', trigger.action)
      if (trigger.resource === 'products') {
        if (trigger.action === 'change') {
          const resource = `/products/${trigger.resource_id}/metafields.json`
          appSdk
            .apiRequest(parseInt(storeId), resource, 'GET')
            .then(({ data }) => {
              const mlId = data.result.find(metadata => metadata.field === 'ml_id')
              const productDirector = new ProductDirector(new MlProductBuilder(product, mlService, { id: mlId }))
              productDirector.update((err, productResponse) => {
                console.log(productResponse)
                if (err) {
                  return res.status(500).send(error)
                }
                if (productResponse.error) {
                  return res.status(422).json(productResponse)
                }
                return res.send(ECHO_SUCCESS)
              })
            }).catch(error => res.send(error))
        }

        // try {
        //   getMlInstance(admin, storeId)
        //     .then(mlInstance => {
        //       const productDirector = new ProductDirector(new MlProductBuilder(trigger.body, mlInstance))
        //       productDirector.handlerProduct()
        //       productDirector.save((err, productResponse) => {
        //         if (err) {
        //           console.log(err)
        //           throw err
        //         }
        //         const { metafields } = trigger.body
        //         if (metafields &&
        //           metafields.find(({ field }) => field === 'ml_id')) {
        //           return res.send(ECHO_SUCCESS)
        //         }
        //         const { id } = productResponse
        //         const resource = `products/${trigger.resource_id}/metafields.json`
        //         const metaFields = { field: 'ml_id', value: id }
        //         console.log(metafields)
        //         appSdk
        //           .apiRequest(storeId, resource, 'POST', metaFields)
        //           .then(() => {
        //             return res.send(ECHO_SUCCESS)
        //           })
        //           .catch(err => {
        //             console.log('[apiRequest ERROR]', err)
        //             err.name = SKIP_TRIGGER_NAME
        //             throw err
        //           })
        //       })
        //     }).catch((err => { throw err }))
        // } catch (error) {
        //   console.error('[ERROR PRODUCT INTEGRATE]', error)
        //   throw error
        // }
      } else {
        return res.send(ECHO_SUCCESS)
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
