const UtilsService = require('../../services/utilsService')

exports.get = async ({ admin }, req, res) => {
  try {
    const storeId = parseInt(req.get('x-store-id'), 10) || req.query.storeId
    if (!storeId) {
      res.status(401)
      return res.send({
        error: 'Unauthorized',
        message: 'Missing store_id'
      })
    }
    const result = await admin
      .firestore()
      .collection('ml_app_auth')
      .doc(storeId.toString())
      .get()

    const user = result.data()
    const utilsService = new UtilsService(user.access_token)
    const categories = await utilsService.findSuggestedCategories(req.query.term)
    return res.json(categories)
  } catch (error) {
    if (error.response) {
      return res.status(422).send(error.response)
    }
    return res.status(500).send(error.message)
  }
}