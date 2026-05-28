import { useState } from 'react'
import { generateSummary } from '../api'
import { useRecords } from '../store'

interface Record {
  id: number
  date: string
  content: string
  duration: number
  tag?: string
  summary?: string
}

function HomePage() {
  const { records, updateRecords } = useRecords()
  const [input, setInput] = useState('')
  const [duration, setDuration] = useState<number>(60)
  const [tag, setTag] = useState<string>('工程化')
  const [summary, setSummary] = useState('')
  const [viewingSummary, setViewingSummary] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editDuration, setEditDuration] = useState<number>(60)

  const addRecord = () => {
    if (!input.trim()) return
    const newRecord: Record = {
      id: Date.now(),
      date: new Date().toLocaleDateString('zh-CN'),
      content: input.trim(),
      duration: duration,
      tag: tag,
      summary: summary.trim() || undefined
    }
    updateRecords([newRecord, ...records])
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
    updateRecords(records.map(item =>
      item.id === editingId
        ? { ...item, content: editContent.trim(), duration: editDuration }
        : item
    ))
    setEditingId(null)
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
      <h1>📚 学习记录</h1>
      <p>📊 当前共 {records.length} 条学习记录</p>

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
        <select value={tag} onChange={(e) => setTag(e.target.value)} style={{ padding: '8px 12px', fontSize: 16 }}>
          <option value="工程化">🏗️ 工程化</option>
          <option value="React">⚛️ React</option>
          <option value="TypeScript">📘 TypeScript</option>
          <option value="AI">🤖 AI</option>
          <option value="算法">🧮 算法</option>
          <option value="其他">📦 其他</option>
        </select>
        <button onClick={addRecord} style={{ padding: '8px 20px', fontSize: 16 }}>记录</button>
      </div>

      {/* 总结输入框 */}
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="学习总结（可选，支持 Markdown）"
        rows={3}
        style={{ width: '100%', padding: '8px 12px', fontSize: 16, marginBottom: 10, resize: 'vertical', boxSizing: 'border-box' }}
      />
      <button
        onClick={async () => {
          if (!input.trim()) return
          const aiSummary = await generateSummary(input)
          setSummary(aiSummary)
        }}
        style={{ padding: '6px 16px', fontSize: 14, marginBottom: 20 }}
      >
        🤖 AI 生成总结
      </button>

      {/* 查看总结区域 */}
      {viewingSummary && (
        <div style={{
          background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8,
          padding: '16px 20px', marginBottom: 20, whiteSpace: 'pre-wrap',
          fontFamily: 'monospace', fontSize: 14, lineHeight: 1.8
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong>📝 学习总结</strong>
            <button onClick={() => setViewingSummary(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>
          {viewingSummary}
        </div>
      )}

      {/* 记录列表 */}
      <div>
        {records.map((record) => (
          <div key={record.id} style={{
            padding: '12px 16px', marginBottom: 10, background: '#f5f5f5',
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12
          }}>
            <span style={{ color: '#999', whiteSpace: 'nowrap' }}>{record.date}</span>

            {editingId === record.id ? (
              <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                <input value={editContent} onChange={(e) => setEditContent(e.target.value)} style={{ flex: 1, padding: '4px 8px' }} />
                <input value={editDuration} onChange={(e) => setEditDuration(Number(e.target.value))} style={{ width: 60, padding: '4px 8px' }} type="number" />
                <button onClick={saveEdit} style={{ padding: '4px 12px' }}>保存</button>
                <button onClick={() => setEditingId(null)} style={{ padding: '4px 12px' }}>取消</button>
              </div>
            ) : (
              <>
                <span style={{ flex: 1 }}>{record.content}</span>
                <span style={{ background: '#e6f7ff', color: '#1890ff', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>
                  {record.tag || '其他'}
                </span>
                <span style={{ color: '#1890ff', whiteSpace: 'nowrap' }}>{record.duration} 分钟</span>
                {record.summary && (
                  <button onClick={() => setViewingSummary(record.summary || null)}
                    style={{ border: '1px solid #ddd', background: 'white', borderRadius: 4, cursor: 'pointer', padding: '2px 8px', fontSize: 13 }}>
                    📄
                  </button>
                )}
                <button onClick={() => startEdit(record)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>✏️</button>
                <button onClick={() => updateRecords(records.filter((item) => item.id !== record.id))}
                  style={{ color: '#ff4d4f', border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>🗑</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default HomePage