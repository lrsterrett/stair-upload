const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault()
})

const firestore = new admin.firestore.Firestore()

const oldID = 'ethascho@jahnelgroup.com';
const newID = 'eschoen@jahnelgroup.com';

(async function getAllTime() {
  const query = await firestore.collection(`users/${oldID}/history`)
    .get()
  
  // query.docs.forEach(doc => {
  //   console.log(doc.id)
  //   console.log(doc.data())
  //   console.log('--------')
  // })

  await query.docs.forEach(async (doc) => {
    const id = doc.id.replace(oldID, newID)
    console.log(doc.id)
    console.log(id)
    console.log(doc.data())
    console.log({
      ...doc.data(),
      resourceID: newID
    })
    
    await firestore.doc(`users/${newID}/history/${id}`)
      .set({
        ...doc.data(),
        resourceID: newID
      })
  })
})()