const axios = require('axios').default

class UtilsService {
  constructor(token) {
    this.server = axios.create({
      baseURL: 'https://api.mercadolibre.com',
      timeout: 60000,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  }

  async findSuggestedCategories(term) {
    try {
      const { data } = await this.server
        .get(`/sites/MLB/domain_discovery/search?limit=5&q=${term}`)
      return Promise.resolve(data)
    } catch (error) {
      if (error.response) {
        return Promise.reject(error.response)
      }
      return Promise.reject(error)
    }

  }
}

module.exports = UtilsService