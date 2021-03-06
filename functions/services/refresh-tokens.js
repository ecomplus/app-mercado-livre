const meli = require('mercadolibre')
const { ml } = require('firebase-functions').config()
const { logger } = require('firebase-functions');

const refreshToken = (admin, storeId, data) => {
  const { access_token, refresh_token, created_at } = data
  return new Promise((resolve, reject) => {
    try {
      const meliObject = new meli.Meli(
        ml.client_id,
        ml.secret_key,
        access_token,
        refresh_token
      )
      meliObject.refreshAccessToken((err, res) => {
        if (err) {
          console.error('[ML - ERROR TO REFRESH TOKEN]', err)
          throw err
        }
        const authData = {
          ...res,
          updated_at: new Date(),
          created_at
        }
        let doc = admin.firestore()
          .collection('ml_app_auth')
          .doc(`${storeId}`)
          .set(authData)
        return resolve(doc)
      })
    } catch (error) {
      return reject(error)
    }
  })
}

exports.updateMLTokens = (admin) => {
  try {
    const promises = []
    admin.firestore()
      .collection('ml_app_auth')
      .get()
      .then(auths => {
        auths.forEach(auth => {
          promises.push(refreshToken(admin, auth.id, auth.data()))
        })
        Promise.all(promises).then(() => {
          logger.info('[updateMLTokens]: success to update ml tokens')
        })
      })
      .catch(err => { throw err })
  } catch (error) {
    logger.error('[updateMLTokens]', error)
    throw error
  }
}