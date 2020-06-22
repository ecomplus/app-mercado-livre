const meli = require('mercadolibre')

exports.post = ({ admin }, req, res) => {
  try {
    admin.firestore()
      .collection('ml_app_auth')
      .get()
      .then(auths => {
        auths.forEach(auth => {
          const { access_token, refresh_token } = auth
          const meliObject = new meli.Meli(
            '6653886911586901',
            '7D1OvA7YYK35p5EcX9rz00HsAMACjdGL',
            access_token,
            refresh_token
          )
          console.log('==== access and refresh===', access_token, refresh_token)
          meliObject.refreshAccessToken((error, result) => {
            console.log('=====results', result, error)
          })
        })
        return res.json('ok')
      })
      .catch(err => res.status(500).send(err))
  } catch (error) {
    return res.status(500).send(error)
  }
}