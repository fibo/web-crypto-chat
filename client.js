import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey
const generateKey = () => {
  return window.crypto.subtle.generateKey({
    name: 'AES-GCM',
    length: 256,
  }, true, ['encrypt', 'decrypt'])
}

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#Supported_algorithms
const supportedAlgorithms = ['RSA-OAEP', 'AES-CTR', 'AES-CBC', 'AES-GCM']

function App () {
  const [algorithm, setAlgorythm] = useState('')
  const [messageHistory, setMessageHistory] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!message) return

    const body = JSON.stringify({ message })

    setMessageHistory(messageHistory => messageHistory.concat({ sender: 'Me', message }))
    setInputText('')

    fetch('http://localhost:3000/message', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body
    }).then((response) => response.json()).then((data) => {
      if (data.answer) {
        setMessageHistory(messageHistory => messageHistory.concat({ sender: 'Bot', message: data.answer }))
      }
    })
  }, [message, setMessageHistory, setInputText])

  return (
    <div className="window">
      <div className="title-bar">
        <div className="title-bar-text">Web Crypto Chat</div>
      </div>

      <div className="window-body">
        <select style={{'margin': '1em'}}>
          {supportedAlgorithms.map((algorithm, i) => (
            <option key={i} value={algorithm}>{algorithm}</option>
          ))}
        </select>

        <button>Generate Key</button>

        <div className="field-row" style={{'margin': '1em'}}>
          <label htmlFor="message">Message</label>
          <input id="message" type="text" onChange={(event) => { setInputText(event.target.value) }} value={inputText}/>
        </div>

        <button style={{'margin': '1em'}} onClick={() => { setMessage(inputText) }}>Send</button>

        {messageHistory.length > 0 && (
          <ul className="tree-view">
            {messageHistory.map(({ sender, message }, i) => (
              <li key={i}>
                {sender}
                <ul>
                  <li>{message}</li>
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)