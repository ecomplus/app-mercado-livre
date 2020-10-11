const axios = require('axios').default

class NotificationService {
  constructor(token, notification) {
    this.server = axios.create({
      baseURL: 'https://api.mercadolibre.com',
      timeout: 60000,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    this.notification = notification
  }

  getResourceData(resource) {
    return new Promise((resolve, reject) => {
      this.server
        .get(resource)
        .then(({ data }) => resolve(data))
        .catch(error => {
          if (error.response) {
            return reject(error.response.data)
          }
          return reject(error)
        })
    })
  }
}


module.exports = NotificationService