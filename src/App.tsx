import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AIPage from './pages/AIPage'
import DetailPage from './pages/DetailPage'

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: '10px 20px', background: '#f0f0f0', display: 'flex', gap: 20 }}>
        <Link to="/">📚 学习记录</Link>
        <Link to="/ai">🤖 AI 助手</Link>
      </nav>
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ai" element={<AIPage />} />
        <Route path="/detail/:id" element={<DetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App