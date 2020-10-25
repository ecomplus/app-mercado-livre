const log = ({ appSdk, storeId }, entity, payload) => {
  const isError = payload instanceof Error
  appSdk.getAuth(storeId)
    .then(auth => {
      return getAppData({ appSdk, storeId, auth })
        .then(appData => {
          let { logs } = appData
          const logData = {
            resource,
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