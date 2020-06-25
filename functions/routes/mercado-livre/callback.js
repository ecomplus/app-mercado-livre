const { ml } = require('firebase-functions').config()

exports.get = ({ appSdk }, req, res) => {
  try {
    const { store_id } = req.query
    if (!store_id) {
      return res.status(400).send('store_id query param is required!')
    }
    res.cookie('store_id', store_id)
    return res.redirect(ml.authorize_uri)
  } catch (error) {
    return res.status(500).send(error)
  }
}