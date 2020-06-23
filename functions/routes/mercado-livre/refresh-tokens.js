const meli = require('mercadolibre')

const updateToken = (storeId, auth) => {
  return admin.firestore()
  .collection('ml_app_auth')
  .doc(`${storeId}`)
  .set(auth)
}


exports.post = ({ admin }, req, res) => {
  try {
    const promises = []
    admin.firestore()
      .collection('ml_app_auth')
      .get()
      .then(auths => {
        auths.forEach(auth => {
          const { access_token, refresh_token, created_at } = auth.data()
          const meliObject = new meli.Meli(
            '6653886911586901',
            '7D1OvA7YYK35p5EcX9rz00HsAMACjdGL',
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
            promises.push(updateToken(auth.id, authData))
          })
        })
        Promise.all(promises)
          .then(() => console.log('[ALL TOKENS UPDATED]'))
          .catch(error => console.log('[ERRO TO REFRESH TOKENS]', error))
        return res.json('ok')
      })
      .catch(err => res.status(500).send(err))
  } catch (error) {
    return res.status(500).send(error)
  }
}