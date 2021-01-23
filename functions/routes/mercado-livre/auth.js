const meli = require('mercadolibre')
const { ml } = require('firebase-functions').config()
const ProfileService = require('../../services/ml_to_ecom/profileService')
const { logger } = require('firebase-functions');


exports.get = ({ admin, appSdk }, req, res) => {
  try {
    const { code } = req.query
    const meliObject = new meli.Meli(ml.client_id, ml.secret_key)
    const redirectUri = ml.redirect_uri
    const { store_id } = req.cookies
    const profileService = new ProfileService(appSdk, store_id)
    meliObject.authorize(code, redirectUri, (err, result) => {
      if (err) {
        logger.error(err)
        throw err
      }

      if (result && result.error && result.status == 400) {
        logger.error('[ML AUTH: RESULT]', result)
        return admin.firestore()
          .collection('ml_app_auth')
          .doc(`${store_id}`)
          .get()
          .then(user => {
            logger.info('[ML AUTH: START UPDATE USER INFO]', user.data())
            if (user && user.data().access_token) {
              return profileService.updateUserInfo(user.data())
                .then(({ response }) => {
                  if (response && response.status == 204) {
                    logger.info('[SUCCESS TO UPDATE USER INFO]', user.data())
                    return res.send('loading...')
                  }
                  logger.error('[ML AUTH: ERROR TO UPDATE USER INFO]', response)
                  return res.send('Error to process login with Mercado Livre!')
                })
                .catch((err) => {
                  logger.error('[ML AUTH: ERROR TO HANDLE updateUserInfo]', err)
                })
            }
            logger.error('[ML AUTH: ML STATUS IS 400 BUT NOT HAVE USER]', result)
            Promise.reject(new Error('Error to proccess login with Mercado Livre!'))
          })
          .catch((err) => {
            logger.error(`[ML AUTH: document with store_id ${store_id} not found in ml_app_auth]`)
          })
      }
      logger.info('[ML AUTH: RESULT]', result)

      if (result && result.access_token) {
        const authData = {
          ...result,
          created_at: new Date(),
          updated_at: new Date()
        }

        return admin.firestore()
          .collection('ml_app_auth')
          .doc(`${store_id}`)
          .set(authData)
          .then(({ response }) => {
            if (response && response.status == 204) {
              logger.info('[SUCCESS TO UPDATE USER INFO]', authData)
              return res.send('loading...')
            }
            logger.error('[ML AUTH: ERROR TO UPDATE USER INFO]', response)
            return res.send('Error to process login with Mercado Livre!')
          })
          .catch((err) => logger.error(err))
      }

      return res.status(500).send('Error to process login with Mercado Livre!')
    })
  } catch (error) {
    console.log(error)
    return res.status(500).send(error)
  }

}