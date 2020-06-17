const qs = require('qs')
const meli = require('mercadolibre')
exports.get = ({ appSdk }, req, res) => {
  const { code } = req.query
  const redirect_uri = meli.getAuthURL()
  meli.authorize(code, redirect_uri, (err, result) => {
    return res.json(err, result)
  })

}