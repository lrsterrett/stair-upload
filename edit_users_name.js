const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault()
})

const firestore = new admin.firestore.Firestore()

const userID = 'aconway@jahnelgroup.com';

(async function getAllTime() {
  const query = await firestore.collection(`users/${userID}/history`)
    .where('unit', '==', 'day')
    .get()
  
  let allTime = 0
  
  query.docs.forEach(doc => {
    allTime += doc.data().climbs
  })
  
  console.log(allTime)
})()