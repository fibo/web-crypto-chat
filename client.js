import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey
const generateKey = (algorithm) => (
  window.crypto.subtle.generateKey({
    name: algorithm,
    length: 256,
  }, true, ['encrypt', 'decrypt'])
)

// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
const generateIv = () => (
  // https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
  window.crypto.getRandomValues(new Uint8Array(12))
)

// https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder
const encode = (data) => {
  const encoder = new TextEncoder()

  return encoder.encode(data)
}

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#Supported_algorithms
const supportedAlgorithms = ['AES-GCM', 'RSA-OAEP', 'AES-CTR', 'AES-CBC']

// https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
const decode = (bytestream) => {
  const decoder = new TextDecoder()

  return decoder.decode(bytestream)
}

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt
const encrypt = ({ data, key, algorithm, iv }) => (
  window.crypto.subtle.encrypt({
    name: algorithm,
    iv: iv,
  }, key, encode(data))
)

// https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
const pack = (buffer) => (
  window.btoa(
    String.fromCharCode.apply(null, new Uint8Array(buffer))
  )
)

// https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
const unpack = (packed) => {
  const string = window.atob(packed)
  const buffer = new ArrayBuffer(string.length)
  const bufferView = new Uint8Array(buffer)

  for (let i = 0; i < string.length; i++) {
    bufferView[i] = string.charCodeAt(i)
  }

  return buffer
}

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt
const decrypt = ({ algorithm, cipher, key, iv }) => (
  window.crypto.subtle.decrypt({
    name: algorithm,
    iv,
  }, key, cipher).then(encoded => decode(encoded))
)

const iv = generateIv()

function App () {
  const [algorithm, setAlgorithm] = useState('')
  const [localKey, setLocalKey] = useState()
  const [inputText, setInputText] = useState('')
  const [messageHistory, setMessageHistory] = useState([])
  const [message, setMessage] = useState('')
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(supportedAlgorithms[0])

  useEffect(() => {
    if (algorithm) {
      generateKey(algorithm).then(setLocalKey)
    }
  }, [algorithm, setLocalKey])

  useEffect(() => {
    if (!algorithm) return
    if (!message) return
    if (!localKey) return

  }, [algorithm, localKey, message])

  useEffect(() => {
    if (!message) return

    if (algorithm && localKey) {
      encrypt({ data: message, iv, algorithm, key: localKey }).then(
        (cipher) => {
          const encryptedMessage = pack(cipher)

          decrypt({ algorithm, key: localKey, iv, cipher }).then((decryptedMessage) => {
            setMessageHistory(messageHistory => messageHistory.concat({
              sender: 'Me', messages: [encryptedMessage, decryptedMessage]
            }))

            setInputText('')
          })

          fetch('http://localhost:3000/message', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: encryptedMessage })
          }).then((response) => response.json()).then((data) => {
            if (data.answer) {
              setMessageHistory(messageHistory => messageHistory.concat({ sender: 'Bot', messages: [data.answer] }))
            }
          })
        }
      )
    } else {
      setMessageHistory(messageHistory => messageHistory.concat({ sender: 'Me', messages: [ message ] }))
      setInputText('')

      fetch('http://localhost:3000/message', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      }).then((response) => response.json()).then((data) => {
        if (data.answer) {
          setMessageHistory(messageHistory => messageHistory.concat({ sender: 'Bot', messages: [data.answer] }))
        }
      })
    }
  }, [algorithm, localKey, message, setMessageHistory, setInputText])

  return (
    <div className="window">
      <div className="title-bar">
        <div className="title-bar-text">Web Crypto Chat</div>
      </div>

      <div className="window-body">
        <select style={{'margin': '1em'}} onChange={(value) => { setSelectedAlgorithm(event.target.value) }}>
          {supportedAlgorithms.map((algorithm, i) => (
            <option key={i} value={algorithm}>{algorithm}</option>
          ))}
        </select>

        <button
          onClick={() => {
            if (selectedAlgorithm) {
              setMessage('')
              setAlgorithm(selectedAlgorithm)
            }
          }}
        >Generate Key</button>

        <div className="field-row" style={{'margin': '1em'}}>
          <label htmlFor="message">Message</label>
          <input id="message" type="text" onChange={(event) => { setInputText(event.target.value) }} value={inputText}/>
        </div>

        <button style={{'margin': '1em'}} onClick={() => { setMessage(inputText) }}>Send</button>

        {messageHistory.length > 0 && (
          <ul className="tree-view">
            {messageHistory.map(({ sender, messages }, i) => (
              <li key={i}>
                {sender}
                <ul>
                  {messages.map((message, i) => (
                    <li key={i}>{message}</li>
                  ))}
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
