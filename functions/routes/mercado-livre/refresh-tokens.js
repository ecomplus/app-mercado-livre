const meli = require('mercadolibre')
const { ml } = require('firebase-functions').config()

exports.post = ({ admin }, req, res) => {
  try {
    admin.firestore()
      .collection('ml_app_auth')
      .get()
      .then(auths => {
        auths.forEach(auth => {
          const { access_token, refresh_token, created_at } = auth.data()
          const meliObject = new meli.Meli(
            ml.client_id,
            ml.secret_key,
            access_token,
            refresh_token
          )
          meliObject.refreshAccessToken((err, res) => {
            if (err) {
              return console.error('[ERROR TO REFRESH TOKEN]', err)
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
          })
        })
        return res.json('ok')
      })
      .catch(err => res.status(500).send(err))
  } catch (error) {
    return res.status(500).send(error)
  }
}