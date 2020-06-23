const meli = require('mercadolibre')
exports.get = ({ admin }, req, res) => {
  try {
    const { code } = req.query
    const meliObject = new meli.Meli('6653886911586901', '7D1OvA7YYK35p5EcX9rz00HsAMACjdGL')
    const redirectUri = 'https://us-central1-ecom-mercado-livre.cloudfunctions.net/app/mercado-livre/auth'
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
        .then(data => {
          return res.json({ data, query: req.query, headers: req.headers, cookies: req.cookies })
        })
        .catch(err => { throw new Error(err) })
    })
  } catch (error) {
    return res.status(500).send(error)
  }

}