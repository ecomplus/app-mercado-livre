const meli = require('mercadolibre')
const { ml } = require('firebase-functions').config()

module.exports = (admin, storeID) => {
  return new Promise((resolve, reject) => {
    const { client_id, secret_key } = ml
    admin.firestore()
      .collection('ml_app_auth')
      .doc(storeID)
      .get()
      .then(snapshot => {
        const { access_token } = snapshot.data()
        const meliObj = new meli.meli(
          client_id,
          secret_key,
          access_token
        )
        console.log['ML - INIT MELI OBJ', meliObj]
        return resolve(meliObj)
      })
      .catch(err => reject(err))
  })
}