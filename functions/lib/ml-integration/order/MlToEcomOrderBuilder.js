const OrderBuilder = require('./OrderBuilder')
const { randomObjectId } = require('@ecomplus/utils')

class MlToEcomOrderBuilder extends OrderBuilder {
  constructor(orderSchema, appSdk, storeId) {
    super(orderSchema)
    this.appSdk = appSdk
    this.storeId = parseInt(storeId, 10)
  }

  buildAmount() {
    this.order.amount = {
      total: this.orderSchema.total_amount,
      subtotal: this.orderSchema.paid_amount
    }
  }

  buildItem(mlItem) {
    return new Promise((resolve, reject) => {
      const { quantity, unit_price, item } = mlItem
      const { seller_custom_field } = item
      const resource = `/products.json?sku=${seller_custom_field}`
      return this.appSdk.apiRequest(this.storeId, resource)
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
          resolve()
        })
        .catch(err => {
          throw new Error(err)
        })
    })
  }

  buildItems() {
    return new Promise((resolve, reject) => {
      try {
        this.order.items = []
        const promises = []
        for (const mlItem of this.orderSchema.order_items) {
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
        throw new Error(error)
      }
    })
  }

  buildTransactions() {
    const paymentOptions = ['credit_card', 'banking_billet', 'online_debit',
      'account_deposit', 'debit_card', 'balance_on_intermediary', 'loyalty_points', 'other']
    const transactions = []
    for (const payment of this.orderSchema.payments) {
      const transaction = {
        _id: randomObjectId(),
        payment_method: {
          code: (paymentOptions.find(type => type === payment.payment_type) || 'other'),
          name: payment.payment_method_id,
        },
        amount: payment.total_paid_amount,
        installments: {
          number: payment.installments,
          value: payment.installment_amount
        },
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
      transactions.push(transaction)
    }
    this.order.transactions = transactions
  }

  buildBuyer() {
    return this.order.buyers = [
      {
        _id: randomObjectId(),
        main_email: this.orderSchema.buyer.email,
        emails: [{ address: this.orderSchema.buyer.email }],
        display_name: `${this.orderSchema.buyer.first_name} ${this.orderSchema.buyer.last_name}`,
        doc_number: this.orderSchema.buyer.doc_number
      }
    ]
  }



  buildStatus() {
    switch (this.orderSchema.status) {
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
    switch (this.orderSchema.status) {
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
    this.order.notes = `Order: ${this.orderSchema.id}`
  }

  create(callback) {
    const resource = '/orders.json'
    this.appSdk
      .apiRequest(this.storeId, resource, 'POST', this.getOrder())
      .then(({ response }) => {
        callback(null, response.data)
      })
      .catch(err => {
        if (err && err.response) {
          callback(err.response.data)
        }
      })
  }
}

module.exports = MlToEcomOrderBuilder