const getAppData = require('../lib/store-api/get-app-data')
const updateAppData = require('../lib/store-api/update-app-data')

const error = (appSdk, storeId, entity, error) => {
  appSdk.getAuth(storeId)
    .then(auth => {
      return getAppData({ appSdk, storeId, auth })
        .then(appData => {
          let { logs } = appData
          if (!Array.isArray(logs)) {
            logs = []
          }
          const logData = {
            entity,
            timestamp: new Date(),
            success: false,
          }
          if (error && error.response) {
            logData.status = error.response.status
            logData.requestMethod = JSON.stringify(error.config.method, null, 4)
            logData.requestURL = JSON.stringify(error.config.url, null, 4)
            logData.requestData = JSON.stringify(JSON.parse(error.config.data), null, 4)
            logData.notes = JSON.stringify(error.response.data, null, 4)
          } else {
            logData.notes = JSON.stringify(error, null, 4)
          }

          logs.unshift(logData)
          return updateAppData({ appSdk, storeId, auth }, {
            logs: logs.slice(0, 200)
          }, true)
        })
    })
    .catch(console.error)
}

const success = (appSdk, storeId, entity, notes) => {
  appSdk.getAuth(storeId)
    .then(auth => {
      return getAppData({ appSdk, storeId, auth })
        .then(appData => {
          let { logs } = appData
          if (!Array.isArray(logs)) {
            logs = []
          }
          const logData = {
            entity,
            timestamp: new Date(),
            success: true,
            notes: JSON.stringify(notes, null, 4)
          }
          logs.unshift(logData)
          return updateAppData({ appSdk, storeId, auth }, {
            logs: logs.slice(0, 200)
          }, true)
        })
    })
    .catch(console.error)
}

module.exports = {
  error,
  success
}