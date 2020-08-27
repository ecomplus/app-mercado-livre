const admin = require('firebase-admin')
const { ml } = require('firebase-functions').config()

class MLRepository {
  constructor() { }

  getConfig() {
    return ml
  }

  async getUserById(mlUserId) {
    const result = await admin.firestore()
      .collection('ml_app_auth')
      .where('user_id', '=', parseInt(mlUserId, 10))
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
}

module.exports = () => new MLRepository()