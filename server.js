const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')

const app = new express()

app.use(bodyParser.json())
app.use(cors())

app.post('/message', (req, res) => {
  const { message } = req.body

  if (typeof message === 'string') {
    if (['ciao', 'hi'].includes(message.toLowerCase())) {
      return res.send({ answer: message })
    }
  }

  return res.send({ answer: 'boh' })
})

app.listen(3000, () => console.log(`Started on http://localhost:3000`))
