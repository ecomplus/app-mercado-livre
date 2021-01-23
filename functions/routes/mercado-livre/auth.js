const meli = require('mercadolibre')
const { ml } = require('firebase-functions').config()
const ProfileService = require('../../services/ml_to_ecom/profileService')
const { logger } = require('firebase-functions');


const updateProfile = (appSdk, store_id, user) => {
  return new Promise((resolve, reject) => {
    const profileService = new ProfileService(appSdk, store_id)
    logger.info('[ML AUTH: START UPDATE USER INFO]', user.data())
    if (user && user.data().access_token) {
      return profileService.updateUserInfo(user.data())
        .then(({ response }) => {
          if (response && response.status == 204) {
            logger.info('[SUCCESS TO UPDATE USER INFO]', user.data())
            return resolve()
          }
          logger.error('[ML AUTH: ERROR TO UPDATE USER INFO]', response)
          return reject('Error to process login with Mercado Livre!')
        })
        .catch((err) => {
          logger.error('[ML AUTH: ERROR TO HANDLE updateUserInfo]', err)
          return reject(err)
        })
    }
    return reject('Error to proccess login with Mercado Livre')
  })
}

exports.get = ({ admin, appSdk }, req, res) => {
  try {
    const { code } = req.query
    const meliObject = new meli.Meli(ml.client_id, ml.secret_key)
    const redirectUri = ml.redirect_uri
    const { store_id } = req.cookies

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
          .then(user => updateProfile(appSdk, store_id, user))
          .then(() => res.send('loading...'))
          .catch(error => res.status(500).send(error))
      }

      logger.info('[ML AUTH: RESULT]', result)

      if (result && result.access_token) {
        const authData = {
          ...result,
          created_at: new Date(),
          updated_at: new Date()
        }

        const docRef = admin.firestore()
          .collection('ml_app_auth')
          .doc(`${store_id}`)

        docRef.set(authData)

        return docRef.get()
          .then(user => updateProfile(appSdk, store_id, user))
          .then(() => res.send('loading...'))
          .catch(error => res.status(500).send(error))
      }
      return res.status(500).send('Error to process login with Mercado Livre!')
    })
  } catch (error) {
    console.log(error)
    return res.status(500).send(error)
  }

}