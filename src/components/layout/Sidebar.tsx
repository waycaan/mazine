'use client'

import Link from 'next/link'
import { Trash, ChevronLeft, Save, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { SearchDialog } from '@/components/search/SearchDialog'
import { useState } from 'react'

// 侧边栏组件
export default function Sidebar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <>
      <div className="w-16 h-full border-r flex flex-col items-center py-4 space-y-4 bg-background">
        {/* 回收站链接 */}
        <Link 
          href="/trash" 
          className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground"
        >
          <Trash className="w-5 h-5" />
        </Link>
        
        {/* 主题切换按钮 */}
        <ThemeToggle />
        
        {/* 搜索按钮 */}
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-grow" />
        
        {/* 备份按钮 */}
        <button className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground">
          <Save className="w-5 h-5" />
        </button>
        
        {/* 退出按钮 */}
        <button className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* 搜索对话框 */}
      <SearchDialog 
        open={isSearchOpen} 
        onOpenChange={setIsSearchOpen} 
      />
    </>
  )
} 