const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault()
})

const firestore = new admin.firestore.Firestore()

let total = 0

firestore.collection('users/dmilliken@jahnelgroup.com/history')
  .where('unit', '==', 'day')
  .get()
  .then(results => {
    results.docs.forEach(doc => {
      total += doc.data().climbs
    })

    console.log(total)
  })