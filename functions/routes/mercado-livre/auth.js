const meli = require('mercadolibre')
const { ml } = require('firebase-functions').config()
const ProfileService = require('../../services/ml_to_ecom/profileService')
const UtilsService = require('../../services/utilsService')
const { logger } = require('firebase-functions');


const getProfile = (user) => {
  return new Promise((resolve, reject) => {
    if (user && user.data().access_token) {
      const utilsservice = new UtilsService(user.data())
      return utilsservice.getUserInfo()
        .then(profile => resolve(profile))
        .catch(error => {
          logger.info('[ML AUTH:getProfil ERROR]', error)
          reject(error)
        })
    }
    reject('invalid user!')
  })
}

const updateProfile = (appSdk, store_id, profile) => {
  return new Promise((resolve, reject) => {
    const profileService = new ProfileService(appSdk, store_id)
    logger.log('[ML AUTH:updateProfile START UPDATE PROFILE]', profile)
    return profileService.updateUserInfo(profile)
      .then(({ response }) => {
        if (response && response.status == 204) {
          logger.log('[SUCCESS TO UPDATE PROFILE]', profile)
          return resolve()
        }
        logger.log('[ML AUTH:updateProfile ERROR TO UPDATE PROFILE]', response)
        return reject('Error to process login with Mercado Livre!')
      })
      .catch((err) => {
        logger.log('[ML AUTH:updateProfile ERROR TO UPDATE PROFILE]', err)
        return reject(err)
      })
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
        logger.log('[ML AUTH: ERROR]', err)
        throw err
      }

      if (result && result.log && result.status == 400) {
        logger.log('[ML AUTH: RESULT]', result)
        return admin.firestore()
          .collection('ml_app_auth')
          .doc(`${store_id}`)
          .get()
          .then(getProfile)
          .then(profile => updateProfile(appSdk, store_id, profile))
          .then(() => res.send('loading...'))
          .catch(error => {
            logger.log('[ML AUTH: ERROR]', error)
            res.status(500).send(error)
          })
      }

      logger.log('[ML AUTH: RESULT]', result)

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
          .then(getProfile)
          .then(profile => updateProfile(appSdk, store_id, profile))
          .then(() => res.send('loading...'))
          .catch(error => {
            logger.log('[ML AUTH: ERROR]', error)
            res.status(500).send(error)
          })
      }
      return res.status(500).send('Error to process login with Mercado Livre!')
    })
  } catch (error) {
    logger.log('[ML AUTH: ERROR]', error)
    return res.status(500).send(error)
  }

}