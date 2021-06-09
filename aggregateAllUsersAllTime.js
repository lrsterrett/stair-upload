const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault()
})

const firestore = new admin.firestore.Firestore()

let total = 0

firestore.collection('users')
  .get()
  .then(results => {
    results.docs.forEach(doc => {
      total += doc.data().allTime
    })

    console.log(total)
  })