const admin = require('firebase-admin');

class BalanceReserve {
  constructor(sku) {
    this.collection = 'balance_reserve'
    this.productRef = admin
      .firestore()
      .collection('balance_reserve')
      .doc(sku)
  }

  increase(quantity) {
    this.productRef.get()
      .then(result => {
        newQuantity = result.quantity + quantity
        this.productRef.set({ quantity: newQuantity })
      })
  }

  decrease(quantity) {
    this.productRef.get()
      .then(result => {
        newQuantity = result.quantity - quantity
        this.productRef.set({ quantity: newQuantity })
      })
  }
}

module.exports = BalanceReserve