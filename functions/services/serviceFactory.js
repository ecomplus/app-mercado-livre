const mlRepository = require('../repository/mlRepository')()

class ServiceFactory {
  constructor(service) {
    return this[`_${service}`]()
  }

  _ml() {
    return (storeId, mlUserId) => require('./mlService')(storeId, mlUserId, mlRepository)
  }

}

module.exports = (service) => new ServiceFactory(service)