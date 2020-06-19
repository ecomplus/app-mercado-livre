exports.get = ({ appSdk }, req, res) => {
  try {
    const { store_id } = req.query
    if (!store_id) {
      return res.status(400).send('store_id query param is required!')
    }
    res.cookie('store_id', store_id)
    return res.redirect(`http://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=6653886911586901`)
  } catch (error) {
    return res.status(500).send(error)
  }
}