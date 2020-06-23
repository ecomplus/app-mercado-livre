const meli = require('mercadolibre')

exports.post = ({ admin }, req, res) => {
  try {
    admin.firestore()
      .collection('ml_app_auth')
      .get()
      .then(auths => {
        auths.forEach(auth => {
          const { access_token, refresh_token } = auth.data()
          const meliObject = new meli.Meli(
            '6653886911586901',
            '7D1OvA7YYK35p5EcX9rz00HsAMACjdGL',
            access_token,
            refresh_token
          )
          meliObject.refreshAccessToken((err, res) => {
            console.log('[refresh-token]', res, err)
          })
        })
        return res.json('ok')
      })
      .catch(err => res.status(500).send(err))
  } catch (error) {
    return res.status(500).send(error)
  }
}