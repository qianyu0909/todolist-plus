var express = require('express');
var router = express.Router();
var client = require('../mongodb/index')

const dbName = 'todolist_database'

function findAll() {
  return new Promise((resolve) => {
    client.connect((err) => {
      if (err) {
        console.log('Database connection failed!');
        return;
      }

      console.log('Database connection successful!');
      let db = client.db(dbName);

      db.collection("todolist").find().toArray((err, data) => {
        if (err) {
          console.log(err);
          return;
        }
        resolve(data)
        client.close();
      })
    })
  })
}

router.get('/', async function (req, res, next) {
  const todolistList = await findAll()
  res.send({
    code: 200,
    data: todolistList
  })
});

function insertOne(data) {
  return new Promise((resolve) => {
    client.connect((err) => {
      if (err) {
        console.log('Database connection failed!');
        return;
      }

      console.log('Database connection successful!');
      let db = client.db(dbName);

      db.collection("todolist").insertOne(data, (err, result) => {
        if (err) {
          console.log(err);
          return;
        }
        resolve(true)
        client.close();
      })

    })
  })
}

function updateOne(data) {
  return new Promise((resolve) => {
    client.connect((err) => {
      if (err) {
        console.log('Database connection failed!');
        return;
      }

      console.log('Database connection successful!');
      let db = client.db(dbName);

      delete data._id

      db.collection("todolist").updateOne({ id: data.id }, { $set: data }, (err, result) => {
        if (err) {
          console.log(err);
          return;
        }
        resolve(true)
        client.close();
      })

    })
  })
}

router.post('/', async function (req, res, next) {
  const result = await insertOne(req.body)
  res.send({
    code: result ? 200 : 500,
  })
});

function deleteOne(id) {
  return new Promise((resolve) => {
    client.connect((err) => {
      if (err) {
        console.log('Database connection failed!');
        return;
      }

      console.log('Database connection success');
      let db = client.db(dbName);

      db.collection("todolist").deleteOne({ id }, (err, result) => {
        if (err) {
          console.log(err);
          return;
        }
        resolve(true)
        client.close();
      })

    })
  })
}

router.delete('/:id', async function (req, res, next) {
  const result = await deleteOne(req.params.id)
  res.send({
    code: result ? 200 : 500,
  })
});

router.put('/', async function (req, res, next) {
  const result = await updateOne(req.body)
  res.send({
    code: result ? 200 : 500,
  })
});


module.exports = router;
