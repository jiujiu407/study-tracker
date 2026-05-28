import { useState, useEffect } from 'react';

interface Record {
  id: number
  date: string
  content: string
  duration: number
  tag?: string
  summary?: string
}

// 全局变量，存在模块作用域里
let globalRecords: Record[] = []

// 监听器列表，数据变了就通知所有订阅者
let listeners: (() => void)[] = []

// 读取初始数据
const saved = localStorage.getItem('study-records')
if (saved) {
  globalRecords = JSON.parse(saved)
}

export function useRecords() {
  const [records, setRecords] = useState<Record[]>(globalRecords)

  useEffect(() => {
    // 订阅数据变化
    const listener = () => setRecords([...globalRecords])
    listeners.push(listener)
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  }, [])

  // 修改数据的方法
  const updateRecords = (newRecords: Record[]) => {
    globalRecords = newRecords
    localStorage.setItem('study-records', JSON.stringify(newRecords))
    listeners.forEach(l => l())
    setRecords([...newRecords])
  }

  return { records, updateRecords }
}