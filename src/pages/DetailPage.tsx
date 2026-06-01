import { useParams, useNavigate } from 'react-router-dom'
import { useRecords } from '../store'


function DetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { records } = useRecords()
   
     // 根据 id 找到那条记录
  const record = records.find(r => r.id === Number(id))

  if (!record) {
    return <div>记录不存在</div>
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>← 返回</button>
      <h1>{record.content}</h1>
      <p>📅 {record.date}</p>
      <p>⏱️ {record.duration} 分钟</p>
      <p>🏷️ {record.tag || '其他'}</p>
      {record.summary && (
        <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
          {record.summary}
        </div>
      )}
    </div>
  )
}

export default DetailPage