const ProductDirector = require('../ProductDirector')
const MlProductBuilder = require('../MlProductBuilder')
const ecomProduct = require('./ecomProduct.json')
const meli = require('mercadolibre')


const getMlInstance = () => {
  const clientId = '6653886911586901'
  const clientSecret = '7D1OvA7YYK35p5EcX9rz00HsAMACjdGL'
  const accessToken = 'APP_USR-6653886911586901-081201-baaafe5f5ecddc92c5272360354794ed-593020850'
  return new Promise((resolve, reject) => {
    try {
      const meliObj = new meli.Meli(
        clientId,
        clientSecret,
        accessToken
      )
      resolve(meliObj)
    } catch (error) {
      reject(error)
    }
  })
}

const createProduct = () => {
  try {
    getMlInstance()
      .then(mlInstance => {
        const options = {
          category_id: 'MLB272126',
          listing_type_id: 'gold_special'
        }
        const productDirector = new ProductDirector(new MlProductBuilder(ecomProduct, mlInstance, options))
        productDirector.create((err, productResponse) => {
          if (err) {
            console.log(err)
            throw err
          }
          console.log(productResponse)
        })
      }).catch((err => { throw err }))
  } catch (error) {
    console.error('[ERROR PRODUCT INTEGRATE]', error)
    throw error
  }
}

createProduct()