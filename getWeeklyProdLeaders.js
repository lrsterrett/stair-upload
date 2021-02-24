const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault()
})

const firestore = new admin.firestore.Firestore()

firestore.collectionGroup('history')
  .where('date', '==', '2021-02-21')
  .where('unit', '==', 'week')
  .where('isUserHistory', '==', true)
  .orderBy('climbs', 'desc')
  .get()
  .then(results => results.docs.forEach(doc => console.log(doc.data())))