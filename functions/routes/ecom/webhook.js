// read configured E-Com Plus app data
const { auth } = require('firebase-admin')
const getAppData = require('./../../lib/store-api/get-app-data')
const updateAppData = require('./../../lib/store-api/update-app-data')
const functions = require('firebase-functions');


const SKIP_TRIGGER_NAME = 'SkipTrigger'
const ECHO_SUCCESS = 'SUCCESS'
const ECHO_SKIP = 'SKIP'
const ECHO_API_ERROR = 'STORE_API_ERR'

const addNotification = (admin, trigger) => {
  functions.logger.info('[addNotification]', trigger)
  return admin.firestore()
    .collection('ecom_notifications')
    .add(trigger)
}

const JOBS = ['exportation_products', 'link_products']


exports.post = ({ admin, appSdk }, req, res) => {
  // receiving notification from Store API
  const { storeId } = req

  /**
   * Treat E-Com Plus trigger body here
   * Ref.: https://developers.e-com.plus/docs/api/#/store/triggers/
   */
  const trigger = req.body

  // get app configured options
  getAppData({ appSdk, storeId, auth })

    .then(appData => {
      setTimeout(() => {
        if (
          Array.isArray(appData.ignore_triggers) &&
          appData.ignore_triggers.indexOf(trigger.resource) > -1
        ) {
          // ignore current trigger
          const err = new Error()
          err.name = SKIP_TRIGGER_NAME
          throw err
        }

        /* DO YOUR CUSTOM STUFF HERE */
        try {
          const { body, fields, resource } = trigger
          switch (resource) {
            case 'applications':
              if (fields.includes('data')) {
                const data = {}
                let hasJobs = false
                for (const job of JOBS) {
                  if (Array.isArray(body[job]) && body[job].length > 0) {
                    hasJobs = true
                    data[job] = []
                  }
                }
                if (hasJobs) {
                  addNotification(admin, trigger).catch(err => { throw err })
                  updateAppData({ appSdk, storeId, auth }, data)
                }
              }
              break;
            default:
              addNotification(admin, trigger).catch(err => { throw err })
              break;
          }
          return res.status(204).send()

        } catch (error) {
          throw error
        }
      })
    }, Math.floor(Math.random() * (3000 - 10)) + 10)
    .catch(err => {
      if (err.name === SKIP_TRIGGER_NAME) {
        res.send(ECHO_SKIP)
      } else {
        res.status(500)
        const { message } = err
        res.send({
          error: ECHO_API_ERROR,
          message
        })
      }
    })
}
