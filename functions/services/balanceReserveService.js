const admin = require('firebase-admin');

class BalanceReserve {
  constructor(sku) {
    this.collection = 'balance_reserve'
    this.productRef = admin
      .firestore()
      .collection('balance_reserve')
      .doc(sku)
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

  increase(value) {
    this.productRef.get()
      .then(snap => {
        const quantity = (snap.data() || {}).quantity || 0
        this.productRef.set({ quantity: quantity + value })
      })
  }

  decrease(value) {
    this.productRef.get()
      .then(snap => {
        const quantity = (snap.data() || {}).quantity || 0
        this.productRef.set({ quantity: quantity - value })
      })
  }
}

module.exports = BalanceReserve