import React from 'react'
import ReactDOM from 'react-dom/client'
import { StoryApp } from './components/StoryApp'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoryApp />
  </React.StrictMode>
)