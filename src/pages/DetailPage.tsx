import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRecords } from '../store'


function DetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
  const { records, updateRecords } = useRecords()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editDuration, setEditDuration] = useState('')
   
     // 根据 id 找到那条记录
  const record = records.find(r => r.id === Number(id))

  if (!record) {
    return <div>记录不存在</div>
  }

  const handleStartEdit = () => {
    setEditContent(record.content)
    setEditDuration(String(record.duration))
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditContent(record.content)
    setEditDuration(String(record.duration))
    setIsEditing(false)
  }

  const handleSave = () => {
    const durationValue = Number(editDuration)

    if (!editContent.trim() || Number.isNaN(durationValue) || durationValue < 0) {
      return
    }

    const nextRecords = records.map(r =>
      r.id === record.id
        ? {
            ...r,
            content: editContent.trim(),
            duration: durationValue,
          }
        : r
    )

    updateRecords(nextRecords)
    setIsEditing(false)
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={() => navigate(-1)}>← 返回</button>
        {!isEditing && <button onClick={handleStartEdit}>✏️ 编辑</button>}
      </div>

      {isEditing ? (
        <input
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          style={{ width: '100%', fontSize: 30, fontWeight: 700, marginBottom: 8, padding: '8px 10px' }}
        />
      ) : (
        <h1>{record.content}</h1>
      )}

      <p>📅 {record.date}</p>

      {isEditing ? (
        <p>
          ⏱️{' '}
          <input
            type="number"
            min={0}
            value={editDuration}
            onChange={(e) => setEditDuration(e.target.value)}
            style={{ width: 120, padding: '4px 8px' }}
          />{' '}
          分钟
        </p>
      ) : (
        <p>⏱️ {record.duration} 分钟</p>
      )}

      <p>🏷️ {record.tag || '其他'}</p>
      {record.summary && (
        <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
          {record.summary}
        </div>
      )}

      {isEditing && (
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={handleSave}>保存</button>
          <button onClick={handleCancelEdit}>取消</button>
        </div>
      )}
    </div>
  )
}

export default DetailPage