const OrderDirector = require('../../lib/ml-integration/order/OrderDirector.js')
const MlToEcomOrderBuilder = require('../../lib/ml-integration/order/MlToEcomOrderBuilder')
const meli = require('mercadolibre')
const { ml } = require('firebase-functions').config()

const SKIP_TRIGGER_NAME = 'SkipTrigger'
const ECHO_SUCCESS = 'SUCCESS'
const ECHO_SKIP = 'SKIP'
const ECHO_API_ERROR = 'STORE_API_ERR'

exports.post = ({ admin, appSdk }, req, res) => {
  try {
    const { body } = req
    if (!body.topic === 'orders_v2') {
      return res.send(ECHO_SKIP)
    }
    admin.firestore()
      .collection('ml_app_auth')
      .where('user_id', '=', body.user_id)
      .get()
      .then(users => {
        try {
          users.forEach(user => {
            const { access_token } = user.data()
            const storeId = user.id
            const meliObject = new meli.Meli(
              ml.client_id,
              ml.screte_key,
              access_token
            )
            return meliObject.get(body.resource, (err, mlOrder) => {
              if (err) {
                throw err
              }
              try {
                const orderDirector = new OrderDirector(new MlToEcomOrderBuilder(mlOrder, appSdk, storeId))
                orderDirector.create((err, order) => {
                  console.log('[passa aqui]', err)

                  if (err) {
                    throw err
                  }

                  return res.json(order.response.data)
                })
              } catch (error) {
                throw error
              }

            })

          })
        } catch (error) {
          throw error
        }

      })
      .catch(error => {
        throw error
      })
  } catch (error) {
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
  }
}
