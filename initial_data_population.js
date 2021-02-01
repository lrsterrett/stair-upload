const fs = require('fs');
const csv = require('@fast-csv/parse');
const admin = require('firebase-admin');
const moment = require('moment');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  //databaseURL: "https://jg-stair-app---dev.firebaseio.com"
})
const firestore = new admin.firestore.Firestore()

let inputtedUsers = []
let formattedUsers;

fs.createReadStream('employees.csv')
  .pipe(csv.parse({ headers: true }))
  .on('error', error => console.error(error))
  .on('data', user => {
    inputtedUsers.push(user)
  })
  .on('end', () => {
    formattedUsers = formatUsers(inputtedUsers)

    updateUsersInFirebase(formattedUsers)

    inputtedUsers = []

    fs.createReadStream('guests.csv')
      .pipe(csv.parse({ headers: true }))
      .on('error', error => console.error(error))
      .on('data', user => {
        inputtedUsers.push(user)
      })
      .on('end', () => {
        formattedGuests = formatUsers(inputtedUsers)

        formattedUsers = formattedUsers.concat(formattedGuests)

        updateUsersInFirebase(formattedGuests)

        console.log(formattedUsers)

        const jg = aggregateJgNumbers(formattedUsers)

        updateJgInFirebase(jg)
      });
  });

function formatUsers(inputtedUsers) {
  return inputtedUsers.map(user => {
    const name = user['First Name'] + ' ' + user['Last Name']
    delete user['First Name']
    delete user['Last Name']

    const email = user['Email']
    delete user['Email']

    const inputDateFormat = 'M/D/YYYY'
    const outputDateFormat = 'YYYY-MM-DD'
    const days = {}
    const weeks = {}
    const months = {}
    const quarters = {}
    const years = {}
    let allTime = 0

    for (let day in user) {
      const climbs = parseInt(user[day])

      if (isNaN(climbs) || climbs == 0) {
        continue
      }

      const newDay = moment(day, inputDateFormat).format(outputDateFormat)
      days[newDay] = climbs

      const weekOf = moment(day, inputDateFormat).startOf('week').format(outputDateFormat)
      if (weeks[weekOf]) {
        weeks[weekOf] += climbs
      } else {
        weeks[weekOf] = climbs
      }

      const monthOf = moment(day, inputDateFormat).startOf('month').format(outputDateFormat)
      if (months[monthOf]) {
        months[monthOf] += climbs
      } else {
        months[monthOf] = climbs
      }

      const quarterOf = moment(day, inputDateFormat).startOf('quarter').format(outputDateFormat)
      if (quarters[quarterOf]) {
        quarters[quarterOf] += climbs
      } else {
        quarters[quarterOf] = climbs
      }

      const yearOf = moment(day, inputDateFormat).startOf('year').format(outputDateFormat)
      if (years[yearOf]) {
        years[yearOf] += climbs
      } else {
        years[yearOf] = climbs
      }

      allTime += climbs
    }

    return {
      name: name,
      email: email,
      days: days,
      weeks: weeks,
      months: months,
      quarters: quarters,
      years: years,
      allTime: allTime
    }
  })
}

function aggregateJgNumbers(formattedUsers) {
  let allTime = 0
  const days = {}
  const weeks = {}
  const months = {}
  const quarters = {}
  const years = {}
  const members = []

  for (let user of formattedUsers) {
    for (let day in user.days) {
      if (days[day]) {
        days[day] += user.days[day]
      } else {
        days[day] = user.days[day]
      }
    }

    for (let week in user.weeks) {
      if (weeks[week]) {
        weeks[week] += user.weeks[week]
      } else {
        weeks[week] = user.weeks[week]
      }
    }

    for (let month in user.months) {
      if (months[month]) {
        months[month] += user.months[month]
      } else {
        months[month] = user.months[month]
      }
    }

    for (let quarter in user.quarters) {
      if (quarters[quarter]) {
        quarters[quarter] += user.quarters[quarter]
      } else {
        quarters[quarter] = user.quarters[quarter]
      }
    }

    for (let year in user.years) {
      if (years[year]) {
        years[year] += user.years[year]
      } else {
        years[year] = user.years[year]
      }
    }

    allTime += user.allTime

    members.push({
      id: user.email,
      name: user.name
    })
  }

  return {
    days: days,
    weeks: weeks,
    months: months,
    quarters: quarters,
    years: years,
    allTime: allTime,
    members: members
  }
}

async function updateUsersInFirebase(formattedUsers) {
  for (let user of formattedUsers) {

    const id = makeid()

    if (user.email) {

      firestore.doc(`users/${user.email}`).set({
        active: true,
        allTime: user.allTime,
        email: user.email,
        isEmployee: true,
        isInJG: true,
        name: user.name,
        search: createUserSearchArray(user.name)
      })

    } else {

      firestore.doc(`users/${id}`).set({
        active: true,
        allTime: user.allTime,
        isEmployee: false,
        isInJG: true,
        name: user.name,
        search: createUserSearchArray(user.name)
      })

      user.email = id

    }

    for (let day in user.days) {
      firestore.doc(`users/${user.email}/history/${user.email}${day}day`).set({
        climbs: user.days[day],
        date: day,
        resourceID: user.email,
        unit: 'day'
      })
    }

    for (let week in user.weeks) {
      firestore.doc(`users/${user.email}/history/${user.email}${week}week`).set({
        climbs: user.weeks[week],
        date: week,
        resourceID: user.email,
        unit: 'week'
      })
    }

    for (let month in user.months) {
      firestore.doc(`users/${user.email}/history/${user.email}${month}month`).set({
        climbs: user.months[month],
        date: month,
        resourceID: user.email,
        unit: 'month'
      })
    }

    for (let quarter in user.quarters) {
      firestore.doc(`users/${user.email}/history/${user.email}${quarter}quarter`).set({
        climbs: user.quarters[quarter],
        date: quarter,
        resourceID: user.email,
        unit: 'quarter'
      })
    }

    for (let year in user.years) {
      firestore.doc(`users/${user.email}/history/${user.email}${year}year`).set({
        climbs: user.years[year],
        date: year,
        resourceID: user.email,
        unit: 'year'
      })
    }
  }
}

function updateJgInFirebase(jg) {
  firestore.doc('groups/JG').set({
    active: true,
    allTime: jg.allTime,
    members: jg.members,
    name: 'Jahnel Group'
  })

  for (let day in jg.days) {
    firestore.doc(`groups/JG/history/JG${day}day`).set({
      climbs: jg.days[day],
      date: day,
      resourceID: 'JG',
      unit: 'day'
    })
  }

  for (let week in jg.weeks) {
    firestore.doc(`groups/JG/history/JG${week}week`).set({
      climbs: jg.weeks[week],
      date: week,
      resourceID: 'JG',
      unit: 'week'
    })
  }

  for (let month in jg.months) {
    firestore.doc(`groups/JG/history/JG${month}month`).set({
      climbs: jg.months[month],
      date: month,
      resourceID: 'JG',
      unit: 'month'
    })
  }

  for (let quarter in jg.quarters) {
    firestore.doc(`groups/JG/history/JG${quarter}quarter`).set({
      climbs: jg.quarters[quarter],
      date: quarter,
      resourceID: 'JG',
      unit: 'quarter'
    })
  }

  for (let year in jg.years) {
    firestore.doc(`groups/JG/history/JG${year}year`).set({
      climbs: jg.years[year],
      date: year,
      resourceID: 'JG',
      unit: 'year'
    })
  }
}


function createUserSearchArray(name) {
  name = name.trim().toLowerCase()
  const lastName = name.split(' ')[1]
  const searchArray = []
  
  for (let i = 1; i <= name.length; i++) {
    searchArray.push(name.slice(0, i))
  }

  for (let i = 1; i <= lastName.length; i++) {
    searchArray.push(lastName.slice(0, i))
  }

  return searchArray
}

function makeid() {
  var result = ''
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var charactersLength = characters.length

  for ( var i = 0; i < 8; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

