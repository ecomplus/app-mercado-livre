const qs = require('qs')
const axios = require('axios')
exports.get = ({ appSdk }, req, res) => {
  const { code } = req.query
  const params = qs.stringify({
    grant_type: 'authorization_code',
    client_id: '6653886911586901', // Todo get to env
    client_secret: '7D1OvA7YYK35p5EcX9rz00HsAMACjdGL', // Todo get to env
    redirect_uri: 'https://us-central1-ecom-mercado-livre.cloudfunctions.net/app/mercado-livre/auth',
    code
  })
  const url = `https://api.mercadolibre.com/oauth/token?${params}`
  axios.post(url)
    .then(data => res.json(data))
    .catch(error => res.send(error))
}