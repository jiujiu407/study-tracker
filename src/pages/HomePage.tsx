import { useState, useEffect } from "react";
import { generateSummaryStream, chatWithHistory } from '../api'

interface Record {
  id: number
  date: string
  content: string
  duration: number
  tag?: string  // 问号表示可选，老数据没有 tag 也不会报错
  summary?: string    // 学习总结内容，可选
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function HomePage() {
// ✅ 初始化：只在组件第一次加载时从 localStorage 读取
const [records, setRecords] = useState<Record[]>(() => {
  const saved = localStorage.getItem('study-records')
  return saved ? JSON.parse(saved) : []
})
  const [input, setInput] = useState('')
  const [duration, setDuration] = useState<number>(60)
  const [tag, setTag] = useState<string>('工程化')
  const [summary, setSummary] = useState('')
  const [viewingSummary, setViewingSummary] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editDuration, setEditDuration] = useState<number>(60)
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [question, setQuestion] = useState('')

// ✅ 持久化：每次 records 变化时自动存入 localStorage（无额外渲染）
useEffect(() => {
  localStorage.setItem('study-records', JSON.stringify(records))
}, [records])

  const addRecord = () => {
    if (!input.trim()) return
    const newRecord: Record = {
      id: Date.now(),
      date: new Date().toLocaleDateString('zh-CN'),
      content: input.trim(),
      duration: duration,   // 用输入框的值，不再是 60
      tag: tag,
      summary: summary.trim() || undefined    // 没填总结就是 undefined
    }
    setRecords([newRecord, ...records])
    setInput('')
    setSummary('')
  }
 
  const startEdit = (record: Record) => {
    setEditingId(record.id)
    setEditContent(record.content)
    setEditDuration(record.duration)
  }
  const saveEdit = () => {
  if (!editContent.trim()) return
  setRecords(records.map(item =>
    item.id === editingId
      ? { ...item, content: editContent.trim(), duration: editDuration }
      : item
  ))
  setEditingId(null)
}

  return (
  <div style={{ maxWidth: 700, margin: '50px auto', padding: '0 20px' }}>
    <h1>📚 学习记录系统</h1>

    {/* 输入区域 */}
    <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addRecord()}
        placeholder="今天学了什么？"
        style={{ flex: 1, minWidth: 200, padding: '8px 12px', fontSize: 16 }}
      />
      <input
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        placeholder="时长（分钟）"
        style={{ width: 120, padding: '8px 12px', fontSize: 16 }}
      />
      <select
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        style={{ padding: '8px 12px', fontSize: 16 }}
      >
        <option value="工程化">🏗️ 工程化</option>
        <option value="React">⚛️ React</option>
        <option value="TypeScript">📘 TypeScript</option>
        <option value="AI">🤖 AI</option>
        <option value="其他">📦 其他</option>
      </select>
      <button onClick={addRecord} style={{ padding: '8px 20px', fontSize: 16 }}>
        记录
      </button>
    </div>

    {/* 总结输入框单独一行 */}
    <textarea
      value={summary}
      onChange={(e) => setSummary(e.target.value)}
      placeholder="学习总结（可选，支持 Markdown）"
      rows={3}
      style={{ width: '100%', padding: '8px 12px', fontSize: 16, marginBottom: 20, resize: 'vertical', boxSizing: 'border-box' }}
    />
   <button
  onClick={async () => {
    if (!input.trim()) return
    setSummary('')  // 先清空总结框
    await generateSummaryStream(input, (text) => {
      setSummary(prev => prev + text)  // 每收到一个字，追加到后面
    })
  }}
  style={{ padding: '6px 16px', fontSize: 14, marginTop: 8 }}
>
  🤖 AI 生成总结
</button>
    {/* 查看总结区域 */}
    {viewingSummary && (
      <div style={{
        background: '#fffbe6',
        border: '1px solid #ffe58f',
        borderRadius: 8,
        padding: '16px 20px',
        marginBottom: 20,
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        fontSize: 14,
        lineHeight: 1.8
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong>📝 学习总结</strong>
          <button onClick={() => setViewingSummary(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        {viewingSummary}
      </div>
    )}

    {/* 追问区域 */}
<div style={{ marginTop: 20, border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
  <h4>💬 继续追问</h4>
  {chatHistory.map((msg, i) => (
    <div key={i} style={{ marginBottom: 8, color: msg.role === 'user' ? '#333' : '#1890ff' }}>
      <strong>{msg.role === 'user' ? '你' : 'AI'}：</strong>{msg.content}
    </div>
  ))}
  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
    <input
      value={question}
      onChange={(e) => setQuestion(e.target.value)}
      onKeyDown={async (e) => {
        if (e.key === 'Enter' && question.trim()) {
          const currentQuestion = question.trim()
          setQuestion('')
          
          // 把用户问题加到历史
          const newHistory = [...chatHistory, { role: 'user' as const, content: currentQuestion }]
          setChatHistory(newHistory)
          
          // 调用 AI，逐字显示
          setSummary('')
          const fullReply = await chatWithHistory(currentQuestion, newHistory, (text) => {
            setSummary(prev => prev + text)
          })
          
          // 把 AI 回复也加到历史
          setChatHistory([...newHistory, { role: 'assistant', content: fullReply }])
        }
      }}
      placeholder="继续追问 AI..."
      style={{ flex: 1, padding: '8px 12px', fontSize: 14 }}
    />
  </div>
</div>

    {/* 记录列表 */}
    <div>
      {records.map((record) => (
        <div
          key={record.id}
          style={{
            padding: '12px 16px',
            marginBottom: 10,
            background: '#f5f5f5',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <span style={{ color: '#999', whiteSpace: 'nowrap' }}>{record.date}</span>
          {editingId === record.id ? (
  // 编辑模式
  <div style={{ display: 'flex', gap: 8, flex: 1 }}>
    <input
      value={editContent}
      onChange={(e) => setEditContent(e.target.value)}
      style={{ flex: 1, padding: '4px 8px' }}
    />
    <input
      value={editDuration}
      onChange={(e) => setEditDuration(Number(e.target.value))}
      style={{ width: 60, padding: '4px 8px' }}
      type="number"
    />
    <button onClick={saveEdit} style={{ padding: '4px 12px' }}>保存</button>
    <button onClick={() => setEditingId(null)} style={{ padding: '4px 12px' }}>取消</button>
  </div>
) : (
  // 普通模式
  <span style={{ flex: 1 }}>{record.content}</span>
)}
          <span style={{ background: '#e6f7ff', color: '#1890ff', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>
            {record.tag || '其他'}
          </span>
          <span style={{ color: '#1890ff', whiteSpace: 'nowrap' }}>{record.duration} 分钟</span>
          {record.summary && (
            <button
              onClick={() => setViewingSummary(record.summary || null)}
              style={{ border: '1px solid #ddd', background: 'white', borderRadius: 4, cursor: 'pointer', padding: '2px 8px', fontSize: 13 }}
            >
              📄
            </button>
          )}
          <button
  onClick={() => startEdit(record)}
  style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}
>
  ✏️
</button>
          <button
            onClick={() => {
              const newRecords = records.filter((item) => item.id !== record.id)
              setRecords(newRecords)
            }}
            style={{ color: '#ff4d4f', border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}
          >
            🗑
          </button>
        </div>
      ))}
    </div>
  </div>
)
}

export default HomePage