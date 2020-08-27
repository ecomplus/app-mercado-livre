const meli = require('mercadolibre')

class MLService {
  constructor(client) {
    this.client = client
  }

  async findSuggestedCategories(term, callback) {
    this.client.get(`/sites/MLB/domain_discovery/search?limit=5&q=${term}`, callback)
  }
}

module.exports = async (storeId, mlRepository) => {
  const user = await mlRepository.getUserByStoreId(storeId)
  const mlConfig = mlRepository.getConfig()
  const client = new meli.Meli(
    mlConfig.client_id,
    mlConfig.secret_key,
    user.access_token,
    user.refresh_token
  )
  return new MLService(client, mlRepository)
}