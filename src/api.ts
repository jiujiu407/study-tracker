export async function generateSummary(content: string): Promise<string> {
  try {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [
          {
            role: 'system',
            content: '你是学习助手，根据学习内容生成简洁的 Markdown 格式总结，包含知识点和关键代码示例。只返回总结内容，不要问候语。',
          },
          {
            role: 'user',
            content: `请为以下学习内容生成总结：${content}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`API 请求失败 (${response.status}): ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    const aiMessage = data.choices?.[0]?.message?.content

    if (!aiMessage) {
      console.error('返回数据结构:', JSON.stringify(data, null, 2))
      throw new Error('AI 返回了空内容，请检查控制台日志')
    }

    return aiMessage
  } catch (error) {
    console.error('AI 生成失败:', error)
    return `> ❌ AI 调用失败: ${error instanceof Error ? error.message : '未知错误'}
> 
> 请按以下步骤手动获取总结：
> 1. 打开 DeepSeek 网页版 (chat.deepseek.com)
> 2. 输入：请为以下学习内容生成简洁的 Markdown 格式总结，包含知识点和关键代码示例：${content}
> 3. 将生成的总结粘贴到下方输入框中`
  }
}

// 流式版本：一个字一个字返回
export async function generateSummaryStream(
  content: string,
  onChunk: (text: string) => void
): Promise<void> {
  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      stream: true,  // 关键：开启流式
      messages: [
        {
          role: 'system',
          content: '你是学习助手，根据学习内容生成简洁的 Markdown 格式总结，包含知识点和关键代码示例。只返回总结内容，不要问候语。',
        },
        {
          role: 'user',
          content: `请为以下学习内容生成总结：${content}`,
        },
      ],
    }),
  })

  // 读取流式返回的数据
  const reader = response.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    
    // 按行分割，每行是一个 "data: {json}" 格式
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''  // 最后一行可能不完整，留着下次拼

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6)  // 去掉 "data: " 前缀
        if (jsonStr === '[DONE]') return  // 流结束
        
        try {
          const chunk = JSON.parse(jsonStr)
          const text = chunk.choices?.[0]?.delta?.content
          if (text) {
            onChunk(text)  // 每收到一个字，就调用回调传给外面
          }
        } catch {
          // 解析失败就跳过
        }
      }
    }
  }
}

// 带历史记录的流式请求
export async function chatWithHistory(
  userMessage: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (text: string) => void
): Promise<string> {
  const messages = [
    { role: 'system', content: '你是学习助手，根据学习内容生成简洁的 Markdown 格式总结。' },
    ...history,
    { role: 'user', content: userMessage },
  ]

  let fullContent = ''

  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      stream: true,
      messages,
    }),
  })

  const reader = response.body?.getReader()
 if (!reader) return fullContent  // 加这一行，告诉 TS：如果 reader 不存在，直接退出
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6)
        if (jsonStr === '[DONE]') return fullContent
        const chunk = JSON.parse(jsonStr)
        const text = chunk.choices?.[0]?.delta?.content || ''
        fullContent += text
        onChunk(text)
      }
    }
  }

  return fullContent
}