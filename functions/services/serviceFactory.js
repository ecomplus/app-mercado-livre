const mlRepository = require('../repository/mlRepository')()

class ServiceFactory {
  constructor(service) {
    return this[`_${service}`]()
  }

  _ml() {
    return (storeId) => require('./mlService')(storeId, mlRepository)
  }

}

module.exports = (service) => new ServiceFactory(service)