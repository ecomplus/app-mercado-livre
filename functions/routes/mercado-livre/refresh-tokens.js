const meli = require('mercadolibre')
const { ml } = require('firebase-functions').config()

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
          console.error('[ERROR TO REFRESH TOKEN]', err)
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
        console.log('[NEW AUTH]', doc)
        return resolve(doc)
      })
    } catch (error) {
      return reject(error)
    }
  })
}

exports.post = ({ admin }, req, res) => {
  try {
    const promises = []
    admin.firestore()
      .collection('ml_app_auth')
      .get()
      .then(auths => {
        auths.forEach(auth => {
          promises.push(refreshToken(admin, auth.id, auth.data()))
        })
        console.log(promises)
        Promise.all(promises).then(() => {
          console.log('[ALL REFRESH TOKENS UPDATED]')
          return res.send('ok')
        })
      })
      .catch(err => { throw err })
  } catch (error) {
    return res.status(500).send(error)
  }
}