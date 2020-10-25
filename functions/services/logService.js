const getAppData = require('../lib/store-api/get-app-data')
const updateAppData = require('../lib/store-api/update-app-data')

const log = (appSdk, storeId, entity, payload) => {
  const isError = payload instanceof Error
  appSdk.getAuth(storeId)
    .then(auth => {
      console.log(auth)
      return getAppData({ appSdk, storeId, auth })
        .then(appData => {
          let { logs } = appData
          if (!Array.isArray(logs)) {
            logs = []
          }
          const logData = {
            entity,
            timestamp: new Date(),
            success: isError,
            notes: JSON.stringify(payload)
          }
          logs.unshift(logData)
          return updateAppData({ appSdk, storeId, auth }, {
            logs: logs.slice(0, 200)
          }, true)
        })
    })
    .catch(console.error)
}

module.exports = log