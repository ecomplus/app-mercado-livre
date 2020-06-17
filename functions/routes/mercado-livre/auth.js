const meli = require('mercadolibre')
exports.get = ({ appSdk }, req, res) => {
  const { code } = req.query
  const meliObject = new meli.Meli('6653886911586901', '7D1OvA7YYK35p5EcX9rz00HsAMACjdGL')
  const redirect_uri = meliObject.getAuthURL()
  meliObject.authorize(code, redirect_uri, (err, result) => {
    return res.json(err, result)
  })

}