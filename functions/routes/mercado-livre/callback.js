exports.get = (req, res) => {
  try {
    res.set('x-store-id', 'x1054')
    res.cookie('storeId', 's1054')
    return res.redirect('http://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=6653886911586901&sotore_id=xxx')
  } catch (error) {
    return res.status(500).send(error)
  }
}