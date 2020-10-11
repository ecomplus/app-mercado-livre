const serviceFactory = require('../../services/serviceFactory')
const getMlService = serviceFactory('ml')

const SKIP_TRIGGER_NAME = 'SkipTrigger'
const ECHO_SUCCESS = 'SUCCESS'
const ECHO_SKIP = 'SKIP'
const ECHO_API_ERROR = 'STORE_API_ERR'

const { handleMLNotification } = require('../../services/tasks')

exports.post = async ({ appSdk }, req, res) => {
  let mlService
  let notification = req.body
  try {
    mlService = await getMlService(false, notification.user_id)
    if (await mlService.hasNotification(notification)) {
      return res.status(422).send('processing for this resource already exists')
    }

    const snap = await mlService.createNotification(notification)
    handleMLNotification(snap)

    return res.status(200).send('Ok')

  } catch (error) {
    if (error.name === SKIP_TRIGGER_NAME) {
      res.send(ECHO_SKIP)
    } else {
      res.status(500)
      const { message } = error
      res.send({
        error: ECHO_API_ERROR,
        message
      })
    }
  }
}
