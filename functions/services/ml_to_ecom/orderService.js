const qs = require('qs')
const { randomObjectId } = require('@ecomplus/utils')

class OrderService {
  constructor(appSdk, storeId, data) {
    this.appSdk = appSdk
    this.storeId = parseInt(storeId, 10)
    this.data = data
    this.order = {}
  }

  buildAmount() {
    this.order.amount = {
      total: this.data.total_amount,
      subtotal: this.data.paid_amount
    }
  }

  buildItem(mlItem) {
    return new Promise((resolve, reject) => {
      const { quantity, unit_price, item } = mlItem
      const { seller_custom_field } = item
      const resource = `/products.json?sku=${seller_custom_field}`
      this.appSdk.apiRequest(this.storeId, resource)
        .then(({ response }) => {
          if (response.data && response.data.result.length > 0) {
            const productId = response.data.result[0]._id
            return this.appSdk.apiRequest(this.storeId, `/products/${productId}.json`)
              .then(({ response }) => {
                const { data } = response
                return resolve({
                  _id: randomObjectId(),
                  product_id: data._id,
                  quantity,
                  sku: seller_custom_field,
                  name: data.name,
                  price: unit_price
                })
              })
              .catch(err => reject(err))
          }
          return resolve()
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  buildItems() {
    return new Promise((resolve, reject) => {
      try {
        this.order.items = []
        const promises = []
        for (const mlItem of this.data.order_items) {
          promises.push(this.buildItem(mlItem))
        }
        Promise.all(promises)
          .then(items => {
            this.order.items = items
            resolve()
          }).catch(error => {
            Promise.reject(error)
          });
      } catch (error) {
        reject(error)
      }
    })
  }

  buildTransactions() {
    const paymentOptions = ['credit_card', 'banking_billet', 'online_debit',
      'account_deposit', 'debit_card', 'balance_on_intermediary', 'loyalty_points', 'other']
    const transactions = []
    for (const payment of this.data.payments) {
      const transaction = {
        _id: randomObjectId(),
        payment_method: {
          code: (paymentOptions.find(type => type === payment.payment_type) || 'other'),
          name: payment.payment_method_id,
        },
        amount: payment.total_paid_amount,
        intermediator: {
          transaction_id: payment.id.toString(),
          transaction_reference: payment.order_id.toString(),
          buyer_id: payment.payer_id.toString()
        },
        app: {
          _id: randomObjectId(),
          label: 'mlmp',
          intermediator: {
            name: 'Mercado Livre',
            code: payment.order_id.toString()
          }
        }
      }
      if (payment.installment_amount) {
        payment.installments = {
          number: payment.installments,
          value: payment.installment_amount
        }
      }
      transactions.push(transaction)
    }
    this.order.transactions = transactions
  }

  buildBuyer() {
    const buyer = {
      _id: randomObjectId(),
      display_name: `${this.data.buyer.first_name} ${this.data.buyer.last_name}`,
      doc_number: this.data.buyer.doc_number
    }
    if (this.data.buyer.email) {
      buyer.main_email = this.data.buyer.email,
      buyer.emails = [{ address: this.data.buyer.email }]
    }
    return this.order.buyers = [buyer]
  }

  buildStatus() {
    switch (this.data.status) {
      case 'cancelled':
        this.order.status = 'cancelled'
        break;
      case 'invalid':
        this.order.status = 'cancelled'
        break;
      default:
        this.order.status = 'open'
        break;
    }
  }

  buildFinancialStatus() {
    let status
    switch (this.data.status) {
      case 'paid':
        status = 'paid'
        break;
      case 'cancelled':
        status = 'refunded'
        break;
      case 'invalid':
        status = 'unknown'
        break;
      default:
        status = 'pending'
        break;
    }
    this.order.financial_status = {
      current: status
    }
  }

  buildNotes() {
    this.order.notes = `Order: ${this.data.id}`
  }

  buildMetafields() {
    this.order.metafields = [
      {
        _id: randomObjectId(),
        field: 'ml_order_id',
        value: this.data.id.toString()
      },
      {
        _id: randomObjectId(),
        field: 'ml_order_status',
        value: this.data.status.toString()
      }
    ]
  }

  findOrderOnEcom(mlOrderID) {
    return new Promise((resolve, reject) => {
      const query = qs.stringify({
        'metafields.field': 'ml_order_id',
        'metafields.value': mlOrderID,
        fields: 'metafields',
        limit: 1,
        sort: '-created_at'
      })
      const resource = `/orders.json?${query}`
      this.appSdk.apiRequest(this.storeId, resource, 'GET')
        .then(({ response }) => {
          if (response.statusText === 'OK') {
            const { data } = response
            if (data.result && data.result.length > 0) {
              return resolve(data.result[0]._id)
            }
          }
          return resolve(false)
        })
        .catch(error => reject(error))
    })
  }

  findMLOrderStatus(orderId) {
    return new Promise((resolve, reject) => {
      const resource = `/orders/${orderId}/metafields.json`
      this.appSdk.apiRequest(this.storeId, resource, 'GET')
        .then(({ response }) => {
          if (response.statusText === 'OK') {
            const { data } = response
            if (data.result && data.result.length > 0) {
              const status = data.result.find(r => r.field === 'ml_order_status')
              return resolve(status.value)
            }
          }
          return resolve(false)
        })
        .catch(error => reject(error))
    })
  }

  getOrderToCreate() {
    return new Promise((resolve, reject) => {
      this.order = {}
      try {
        this.buildTransactions()
        this.buildAmount()
        this.buildBuyer()
        this.buildStatus()
        this.buildFinancialStatus()
        this.buildNotes()
        this.buildMetafields()
        this.buildItems()
          .then(() => resolve(this.order)).catch(err => reject(err))
      } catch (error) {
        reject(error)
      }
    })
  }

  getOrderToUpdate() {
    this.buildTransactions()
    this.buildBuyer()
    this.buildStatus()
    this.buildFinancialStatus()
    this.buildNotes()
    this.buildMetafields()
  }

  update(orderId, data) {
    return new Promise((resolve, reject) => {
      const resource = `/orders/${orderId}.json`
      this.appSdk
        .apiRequest(this.storeId, resource, 'PATCH', data)
        .then(response => resolve(response))
        .catch(error => {
          if (error.response) {
            return reject(error.response.data)
          }
          return reject(error)
        })
    })
  }

  create(data) {
    return new Promise((resolve, reject) => {
      const resource = '/orders.json'
      this.appSdk
        .apiRequest(this.storeId, resource, 'POST', data)
        .then(response => resolve(response))
        .catch(error => {
          if (error.response) {
            return reject(error.response.data)
          }
          return reject(error)
        })
    })
  }
}


module.exports = OrderService


