const getAppData = require('./../../lib/store-api/get-app-data')
const ProductDirector = require('../../lib/ml-integration/ProductDirector')
const MlProductBuilder = require('../../lib/ml-integration/MlProductBuilder')
const getMlInstance = require('../../lib/ml-integration/get-meli-instance')


const SKIP_TRIGGER_NAME = 'SkipTrigger'
const ECHO_SUCCESS = 'SUCCESS'
const ECHO_SKIP = 'SKIP'
const ECHO_API_ERROR = 'STORE_API_ERR'

// exports.post = ({ admin, appSdk }, req, res) => {
//   const { storeId } = req

//   getAppData({ appSdk, storeId })
//     .then(() => {
//       try {
//         const trigger = req.body
//         getMlInstance(admin, storeId)
//           .then(mlInstance => {
//             const productDirector = new ProductDirector(new MlProductBuilder(trigger.body, mlInstance))
//             productDirector.handlerProduct()
//             productDirector.save((err, productResponse) => {
//               if (err) {
//                 console.log(err)
//                 throw err
//               }
//               const { id } = productResponse
//               const resource = `products/${trigger.resource_id}/metafields.json`
//               const metaFields = { field: 'ml_id', value: id }
//               appSdk
//                 .apiRequest(storeId, resource, 'POST', metaFields)
//                 .then(() => {
//                   return res.send(ECHO_SUCCESS)
//                 })
//                 .catch(err => {
//                   console.log('[apiRequest ERROR]', err)
//                   err.name = SKIP_TRIGGER_NAME
//                   throw err
//                 })
//             })
//           }).catch((err => { throw err }))
//       } catch (error) {
//         console.error('[ERROR PRODUCT INTEGRATE]', error)
//         throw error
//       }
//     })
//     .catch(err => {
//       if (err.name === SKIP_TRIGGER_NAME) {
//         res.send(ECHO_SKIP)
//       } else {
//         res.status(500)
//         const { message } = err
//         res.send({
//           error: ECHO_API_ERROR,
//           message
//         })
//       }
//     })
// }