const meli = require('mercadolibre')
const { ml } = require('firebase-functions').config()

exports.post = ({ admin }, req, res) => {
  try {
      console.log(req.body)
      // admin.firestore()
      //   .collection('ml_app_notifications')
      //   .doc(`${store_id}`)
      //   .set(authData)
      //   .then(() => res.send('ok'))
      //   .catch(err => { throw new Error(err) })
      return res.status(204).send()
  } catch (error) {
    return res.status(500).send(error)
  }

}