const admin = require('firebase-admin');

class BalanceReserve {
  constructor(sku) {
    this.collection = 'balance_reserve'
    this.productRef = admin
      .firestore()
      .collection('balance_reserve')
      .doc(this.formatSKU(sku))
  }

  formatSKU(sku) {
    return sku.replace(/\./g, '_').replace(/\//g, '-')
  }

  getQuantity() {
    return new Promise((resolve, reject) => {
      this.productRef.get()
        .then(snap => {
          const quantity = (snap.data() || {}).quantity || 0
          return resolve(quantity)
        }).catch(error => reject(error))
    })
  }

  async increase(value) {
    return this.productRef.get()
      .then(snap => {
        const quantity = (snap.data() || {}).quantity || 0
        this.productRef.set({ quantity: quantity + value })
      })
  }

  async decrease(value) {
    return this.productRef.get()
      .then(snap => {
        const quantity = (snap.data() || {}).quantity || 0
        this.productRef.set({ quantity: quantity - value })
      })
  }

  remove() {
    return this.productRef.delete()
  }
}

module.exports = BalanceReserve