const functions = require('firebase-functions');


exports.onNotify = functions.firestore.document('ml_notifications')
  .onCreate((snap, context) => {
    functions.logger.log('Uppercasing', context.params);
    console.log('PASSANDO NO ON CREATE')
    console.log(snap.data())
    console.log(context)
    return true
  })