const admin = require('firebase-admin')
const { ml } = require('firebase-functions').config()

class MLRepository {
  constructor() { }

  getConfig() {
    return ml
  }

  async getUserById(storeId) {
    const result = await admin.firestore()
      .collection('ml_app_auth')
      .where('user_id', '=', storeId)
      .get()
    if (!result.empty) {
      const doc = result.docs[0]
      return doc.data()
    }
    return {}
  }

  async getUserByStoreId(storeId) {
    const result = await admin.firestore()
      .collection('ml_app_auth')
      .doc(storeId.toString())
      .get()
    if (result.exists) {
      return result.data()
    }
    return {}
  }
}

module.exports = () => new MLRepository()