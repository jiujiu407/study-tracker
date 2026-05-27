import { useState } from 'react'
import { generateSummaryStream, chatWithHistory } from '../api'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function AIPage() {
  const [input, setInput] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [question, setQuestion] = useState('')

  const handleGenerate = async () => {
    if (!input.trim()) return
    setSummary('')
    setLoading(true)
    await generateSummaryStream(input, (text) => {
      setSummary(prev => prev + text)
    })
    setLoading(false)
  }

  const handleAsk = async () => {
    if (!question.trim()) return
    const currentQuestion = question.trim()
    setQuestion('')
    const newHistory = [...chatHistory, { role: 'user' as const, content: currentQuestion }]
    setChatHistory(newHistory)
    setSummary('')
    const fullReply = await chatWithHistory(currentQuestion, newHistory, (text) => {
      setSummary(prev => prev + text)
    })
    setChatHistory([...newHistory, { role: 'assistant', content: fullReply }])
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
      <h1>🤖 AI 学习助手</h1>

      {/* 输入学习内容 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="输入今天的学习内容，AI 帮你总结..."
          style={{ flex: 1, padding: '8px 12px', fontSize: 16 }}
        />
        <button onClick={handleGenerate} disabled={loading} style={{ padding: '8px 20px', fontSize: 16 }}>
          {loading ? '生成中...' : '🤖 生成总结'}
        </button>
      </div>

      {/* AI 总结区域 */}
      {summary && (
        <div style={{
          background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 8,
          padding: '16px 20px', marginBottom: 20, whiteSpace: 'pre-wrap', lineHeight: 1.8
        }}>
          {summary}
        </div>
      )}

      {/* 对话历史 */}
      {chatHistory.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4>💬 对话历史</h4>
          {chatHistory.map((msg, i) => (
            <div key={i} style={{ marginBottom: 8, color: msg.role === 'user' ? '#333' : '#1890ff' }}>
              <strong>{msg.role === 'user' ? '你' : 'AI'}：</strong>{msg.content}
            </div>
          ))}
        </div>
      )}

      {/* 追问输入框 */}
      {summary && (
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="继续追问 AI..."
            style={{ flex: 1, padding: '8px 12px', fontSize: 14 }}
          />
          <button onClick={handleAsk} style={{ padding: '8px 16px', fontSize: 14 }}>追问</button>
        </div>
      )}
    </div>
  )
}

export default AIPage