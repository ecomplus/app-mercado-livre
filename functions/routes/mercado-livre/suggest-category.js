const serviceFactory = require('../../services/serviceFactory')
const getMlService = serviceFactory('ml')


exports.get = async ({ admin, appSdk }, req, res) => {
  try {
    const storeId = parseInt(req.get('x-store-id'), 10) || req.query.storeId
    const mlService = await getMlService(storeId)
    mlService.findSuggestedCategories(req.query.term, (err, data) => {
      console.log(err, data)
      if (err) return res.status(500).send(err)
      return res.send(data)
    })
  } catch (error) {
    return res.status(500).send(error.message)
  }

}