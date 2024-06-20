const axios = require('axios').default

class UtilsService {
  constructor(user) {
    this.user = user
    this.server = axios.create({
      baseURL: 'https://api.mercadolibre.com',
      timeout: 60000,
      headers: {
        Authorization: `Bearer ${user.access_token}`
      }
    })
  }

  async findSuggestedCategories(term) {
    try {
      const { data } = await this.server
        .get(`/sites/MLB/domain_discovery/search?q=${term}`)
      return Promise.resolve(data)
    } catch (error) {
      if (error.response) {
        return Promise.reject(error.response)
      }
      return Promise.reject(error)
    }
  }

  async getCategory(categoryId) {
    try {
      const { data } = await this.server
        .get(`/categories/${categoryId}`)
      return Promise.resolve(data)
    } catch (error) {
      if (error.response) {
        return Promise.reject(error.response)
      }
      return Promise.reject(error)
    }
  }

  async getProducts() {
    try {
      const { data } = await this.server
        .get(`/users/${this.user.user_id}/items/search`)
      return Promise.resolve(data)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  async getUserInfo() {
    try {
      const { data } = await this.server.get(`/users/${this.user.user_id}`)
      return Promise.resolve(data)
    } catch (error) {
      return Promise.reject(error)
    }
  }
}

module.exports = UtilsService
