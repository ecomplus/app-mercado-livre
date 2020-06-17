const meli = require('mercadolibre')
exports.get = ({ appSdk }, req, res) => {
  try {
    const { code } = req.query
    const meliObject = new meli.Meli('6653886911586901', '7D1OvA7YYK35p5EcX9rz00HsAMACjdGL')
    const redirectUri = 'https://us-central1-ecom-mercado-livre.cloudfunctions.net/app/mercado-livre/auth'
    meliObject.authorize(code, redirectUri, (err, result) => {
      return res.json({ err, result })
    })
  } catch (error) {
    return res.status(500).send(error)
  }

}