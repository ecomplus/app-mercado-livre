const meli = require('mercadolibre')

class MLService {
  constructor(user, client) {
    this.user = user
    this.client = client
  }

  findSuggestedCategories(term, callback) {
    this.client.get(`/sites/MLB/domain_discovery/search?limit=5&q=${term}`, callback)
  }

  findOrder(resource, callback) {
    this.client.get(resource, callback)
  }

  createProduct(data, callback) {
    this.client.post('/items', data, callback)
  }

}

module.exports = async (storeId=false, mlUserId=false, mlRepository) => {
  if (!storeId && !mlUserId) {
    throw new Error('You must inform storeId or mlUserId')
  }
  let user
  if (mlUserId) {
   user = await mlRepository.getUserById(mlUserId)
  } else {
   user = await mlRepository.getUserByStoreId(storeId)
  }

  const mlConfig = mlRepository.getConfig()
  console.log(user)
  const client = new meli.Meli(
    mlConfig.client_id,
    mlConfig.secret_key,
    user.access_token,
    user.refresh_token
  )
  return new MLService(user, client, mlRepository)
}