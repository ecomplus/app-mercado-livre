const admin = require('firebase-admin')
const { ml } = require('firebase-functions').config()
const uuid = require('uuid')

const NOTIFICATION_COLLECTION = 'ml_notifications'

class MLRepository {
  constructor() {
    this.db = admin.firestore()
  }

  getConfig() {
    return ml
  }

  async getUserById(mlUserId) {
    const result = await admin.firestore()
      .collection('ml_app_auth')
      .where('user_id', '==', parseInt(mlUserId, 10))
      .get()
    if (!result.empty) {
      const doc = result.docs[0]
      return { storeId: doc.id, ...doc.data() }
    }
    return {}
  }

  async getUserByStoreId(storeId) {
    const result = await admin.firestore()
      .collection('ml_app_auth')
      .doc(storeId.toString())
      .get()
    if (result.exists) {
      return { storeId: result.id, ...result.data() }
    }
    return {}
  }

  async createNotification(notification) {
    const docRef = await this.db.collection('ml_notifications').add(notification)
    return docRef.id
  }

  updateNotification(id, notification) {
    const docRef = this.db.collection('ml_notifications').doc(id)
    console.log(id, notification)
    docRef.set(notification, { merge: true })
  }

  async findNotificationsByResource(resource) {
    let result = await admin.firestore()
      .collection(NOTIFICATION_COLLECTION)
      .where('resource', '==', resource)
      .get()
    result = result.docs.map(doc => doc.data())
    return Promise.resolve(result)
  }

  async removeNotification(notificationId) {
    return await this.db
      .collection(NOTIFICATION_COLLECTION)
      .doc(notificationId)
      .delete()
  }

}

module.exports = () => new MLRepository()