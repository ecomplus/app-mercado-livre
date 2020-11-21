const SKIP_TRIGGER_NAME = 'SkipTrigger'
const ECHO_SKIP = 'SKIP'
const ECHO_API_ERROR = 'STORE_API_ERR'

const NOTIFICATION_COLLECTION = 'ml_notifications'

const { handleMLNotification } = require('../../services/tasks')

exports.post = async ({ admin }, req, res) => {
  const notification = req.body
  try {

    const result = await admin.firestore()
      .collection(NOTIFICATION_COLLECTION)
      .where('resource', '==', notification.resource)
      .get()

    const notifications = result.docs.map(doc => doc.data())

    if (notifications.length > 0) {
      return res.status(422).send('processing for this resource already exists')
    }

    const docRef = await admin
      .firestore()
      .collection(NOTIFICATION_COLLECTION)
      .doc(notification.resource.replace(/\//g, ''))
      .set(notification, { merge: true })

    const snap = await docRef.get()

    await handleMLNotification(snap)

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
