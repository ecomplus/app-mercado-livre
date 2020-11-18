const { auth } = require('firebase-admin')
const getAppData = require('./../../lib/store-api/get-app-data')
const updateAppData = require('./../../lib/store-api/update-app-data')

class ProfileService {
  constructor(appSdk, storeId) {
    this.appSdk = appSdk
    this.storeId = parseInt(storeId, 10)
  }

  updateUserInfo(mlProfile) {
    return new Promise((resolve, reject) => {
      const { appSdk, storeId } = this
      return getAppData({ appSdk, storeId, auth })
        .then((data) => {
          data.mlProfile = mlProfile
          resolve(updateAppData({ appSdk, storeId, auth }, data))
        }).catch(error => reject(error))
    })
  }
}


module.exports = ProfileService