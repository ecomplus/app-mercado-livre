const getAppData = require('../lib/store-api/get-app-data')
const updateAppData = require('../lib/store-api/update-app-data')

const log = (appSdk, storeId, entity, payload, success=true) => {
  appSdk.getAuth(storeId)
    .then(auth => {
      return getAppData({ appSdk, storeId, auth }, false)
        .then(appData => {
          let { logs } = appData
          if (!Array.isArray(logs)) {
            logs = []
          }
          const logData = {
            entity,
            timestamp: new Date(),
            success: success,
            notes: JSON.stringify(payload, null, 4)
          }
          logs.unshift(logData)
          return updateAppData({ appSdk, storeId, auth }, {
            logs: logs.slice(0, 200)
          })
        })
    })
    .catch(console.error)
}

module.exports = log