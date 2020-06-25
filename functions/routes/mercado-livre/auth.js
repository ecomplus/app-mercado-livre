const meli = require('mercadolibre')
const { ml } = require('firebase-functions').config()

exports.get = ({ admin }, req, res) => {
  try {
    const { code } = req.query
    const meliObject = new meli.Meli(ml.client_id, ml.secret_key)
    const redirectUri = ml.redirect_uri
    meliObject.authorize(code, redirectUri, (err, result) => {
      if (err) {
        throw new Error(err)
      }
      const { store_id } = req.cookies
      const authData = {
        ...result,
        created_at: new Date(),
        updated_at: new Date()
      }

      admin.firestore()
        .collection('ml_app_auth')
        .doc(`${store_id}`)
        .set(authData)
        .then(() => res.send('ok'))
        .catch(err => { throw new Error(err) })
    })
  } catch (error) {
    return res.status(500).send(error)
  }

}