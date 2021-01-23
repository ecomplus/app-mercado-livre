const meli = require('mercadolibre')
const { ml } = require('firebase-functions').config()
const ProfileService = require('../../services/ml_to_ecom/profileService')


exports.get = ({ admin, appSdk }, req, res) => {
  try {
    const { code } = req.query
    const meliObject = new meli.Meli(ml.client_id, ml.secret_key)
    const redirectUri = ml.redirect_uri
    // const { store_id } = req.cookies
    var store_id = 1117

    const profileService = new ProfileService(appSdk, store_id)
    meliObject.authorize(code, redirectUri, (err, result) => {
      if (err) {
        throw err
      }

      if (result && result.status === 200) {
        const authData = {
          ...result,
          created_at: new Date(),
          updated_at: new Date()
        }

        return admin.firestore()
          .collection('ml_app_auth')
          .doc(`${store_id}`)
          .set(authData)
          .then(() => {
            profileService.updateUserInfo(authData)
              .then(() => res.send('loading...'))
              .catch((err) => { console.log(err) })

          })
          .catch((err) => { throw err })
      }

      if (result && result.status == 400) {
        return admin.firestore()
          .collection('ml_app_auth')
          .doc(`${store_id}`)
          .get()
          .then(user => {
            console.debug(user.data())
            if (user && user.data().access_token) {
              return profileService.updateUserInfo(user.data())
                .then(({ response }) => {
                  if (response && response.status == 204) {
                    return res.send('loading...')
                  }
                })
                .catch((err) => Promise.reject(err))
            }
            Promise.reject(new Error('Error to proccess login with Mercado Livre!'))
          })
          .catch((err) => Promise.reject(err))
      }

      return res.status(500).send('Error to process login with Mercado Livre!')
    })
  } catch (error) {
    console.log(error)
    return res.status(500).send(error)
  }

}