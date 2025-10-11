/**
 * 剧本预览图自动生成器
 * 基于剧本JSON数据生成漂亮的SVG预览图片
 * 无需额外依赖，纯SVG实现
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// 预览图配置
export const PREVIEW_CONFIG = {
  width: 420,
  // height现在动态计算，不再使用固定值
  background: {
    gradient: ['#0f172a', '#1e293b', '#334155'], // 深蓝渐变
    bloodTheme: ['#7c2d12', '#991b1b', '#dc2626'] // 血染主题
  },
  fonts: {
    title: 'bold 28px serif',
    subtitle: '18px serif', 
    info: '14px sans-serif',
    watermark: '12px sans-serif'
  },
  colors: {
    title: '#ffffff',
    subtitle: '#e2e8f0',
    info: '#94a3b8',
    accent: '#f59e0b',
    danger: '#ef4444'
  }
}

// 血染钟楼角色类型
type BotcTeam = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler' | 'fabled'

interface BotcCharacter {
  id: string
  name?: string
  team?: BotcTeam
  ability?: string
  image?: string
  edition?: string
  firstNight?: number
  firstNightReminder?: string
  otherNight?: number
  otherNightReminder?: string
  reminders?: string[]
  remindersGlobal?: string[]
  setup?: boolean
  [key: string]: any
}

// 剧本JSON数据接口
interface ScriptData {
  id: string
  title: string
  author?: string
  json: BotcCharacter[] | {
    // 血染钟楼剧本常见字段
    name?: string
    author?: string
    description?: string
    setup?: string[]
    players?: number | { min: number, max: number }
    characters?: BotcCharacter[]
    difficulty?: string | number
    type?: string
    tags?: string[]
    // 其他可能字段
    [key: string]: any
  }
}

// 角色类型映射
const TEAM_NAMES: Record<BotcTeam, string> = {
  townsfolk: '镇民',
  outsider: '外来者', 
  minion: '爪牙',
  demon: '恶魔',
  traveler: '旅行者',
  fabled: '传奇角色'
}

const TEAM_EMOJIS: Record<BotcTeam, string> = {
  townsfolk: '👥',
  outsider: '🏃',
  minion: '🗡️', 
  demon: '😈',
  traveler: '🧳',
  fabled: '⭐'
}

/**
 * 从剧本JSON中提取关键信息
 */
export function extractScriptInfo(scriptData: ScriptData) {
  const { title, author, json } = scriptData
  
  // 处理两种JSON格式：数组格式和对象格式
  let characters: BotcCharacter[] = []
  let scriptName = title
  let scriptAuthor = author
  
  if (Array.isArray(json)) {
    // 数组格式：第一个元素是元数据，其余是角色
    console.log('[PREVIEW] Processing array format JSON')
    
    // 提取元数据
    const metaData = json.find(item => item.id === '_meta')
    if (metaData) {
      scriptName = metaData.name || title
      scriptAuthor = metaData.author || author
      console.log('[PREVIEW] Found meta data:', { name: scriptName, author: scriptAuthor })
    }
    
    // 提取角色（排除元数据和特殊互动说明）
    characters = json.filter((item: any) => {
      // 排除 _meta 和其他元数据对象
      if (item.id === '_meta' || item.id?.includes('_meta')) return false
      // 排除 jinxed 互动说明（这些是角色互动规则，不是真正的角色）
      if (item.team === 'a jinxed' || item.team === 'jinxed') return false
      return true
    }) as BotcCharacter[]
    console.log(`[PREVIEW] Found ${characters.length} characters in array format`)
  } else if (json && typeof json === 'object') {
    // 对象格式：角色在characters字段中
    console.log('[PREVIEW] Processing object format JSON')
    characters = json.characters || []
    scriptName = json.name || title
    scriptAuthor = json.author || author
  }
  
  // 调试：输出JSON结构
  console.log('[PREVIEW] Parsing script:', {
    title: scriptName,
    author: scriptAuthor,
    charactersCount: characters.length,
    firstCharacter: characters[0] || null
  })
  
  // 提取并分类角色
  const rolesByTeam: Record<BotcTeam, BotcCharacter[]> = {
    townsfolk: [],
    outsider: [],
    minion: [],
    demon: [],
    traveler: [],
    fabled: []
  }
  
  let totalCharacters = 0
  
  if (characters && Array.isArray(characters)) {
    console.log(`[PREVIEW] Processing ${characters.length} characters`)
    
    for (const char of characters) {
      totalCharacters++
      
      // 调试：输出角色信息
      console.log('[PREVIEW] Character:', {
        id: char.id,
        name: char.name,
        team: char.team,
        ability: char.ability ? (char.ability.substring(0, 50) + '...') : 'no ability'
      })
      
      const team = char.team as BotcTeam
      if (team && rolesByTeam[team]) {
        rolesByTeam[team].push(char)
        console.log(`[PREVIEW] Added ${char.name || char.id} to ${team}`)
      } else {
        // 如果没有team字段，尝试根据ID/name推断
        const charId = (char.id || char.name || '').toLowerCase()
        const charName = (char.name || char.id || '').toLowerCase()
        
        // 恶魔角色 - 通常只有1-2个
        if (charId.includes('demon') || charId.includes('imp') || 
            ['imp', 'legion', 'vigormortis', 'vortox', 'fang_gu', 'no_dashii', 'shabaloth', 'po'].includes(charId) ||
            charName.includes('恶魔') || charName.includes('小恶魔') || charName.includes('军团')) {
          rolesByTeam.demon.push(char)
        }
        // 爪牙角色 - 通常2-4个
        else if (charId.includes('minion') || 
                ['poisoner', 'spy', 'scarlet_woman', 'baron', 'godfather', 'devil_s_advocate', 'assassin', 'mastermind', 'pit_hag', 'witch', 'cerenovus', 'evil_twin'].includes(charId) ||
                charName.includes('爪牙') || charName.includes('投毒者') || charName.includes('间谍') || charName.includes('红颜女郎')) {
          rolesByTeam.minion.push(char)
        }
        // 外来者角色 - 通常0-2个
        else if (charId.includes('outsider') || 
                ['butler', 'drunk', 'recluse', 'saint', 'tinker', 'moonchild', 'goon', 'lunatic', 'klutz', 'mutant', 'barber', 'sweetheart'].includes(charId) ||
                charName.includes('外来者') || charName.includes('酒鬼') || charName.includes('隐士') || charName.includes('圣徒')) {
          rolesByTeam.outsider.push(char)
        }
        // 旅行者角色 - 特殊角色
        else if (charId.includes('traveler') || charId.includes('traveller') ||
                ['scapegoat', 'gunslinger', 'beggar', 'bureaucrat', 'thief', 'apprentice', 'matron', 'judge', 'bishop', 'voudon'].includes(charId) ||
                charName.includes('旅行者') || charName.includes('替罪羊') || charName.includes('枪手')) {
          rolesByTeam.traveler.push(char)
        }
        // 传奇角色 - 特殊规则角色
        else if (charId.includes('fabled') || 
                ['doomsayer', 'angel', 'buddhist', 'hell_s_librarian', 'revolutionary', 'fiddler', 'toymaker', 'fibbin', 'duchess', 'sentinel'].includes(charId) ||
                charName.includes('传奇') || charName.includes('末日预言者') || charName.includes('天使')) {
          rolesByTeam.fabled.push(char)
        }
        // 默认为镇民 - 数量最多的角色类型
        else {
          rolesByTeam.townsfolk.push(char)
          console.log(`[PREVIEW] Added ${char.name || char.id} to townsfolk (default)`)
        }
      }
    }
    
    // 调试：输出最终分类结果
    console.log('[PREVIEW] Final role classification:', {
      townsfolk: rolesByTeam.townsfolk.length,
      outsider: rolesByTeam.outsider.length,
      minion: rolesByTeam.minion.length,
      demon: rolesByTeam.demon.length,
      traveler: rolesByTeam.traveler.length,
      fabled: rolesByTeam.fabled.length
    })
  }
  
  // 提取玩家数量
  let playerCount = '未知'
  if (!Array.isArray(json) && json?.players) {
    if (typeof json.players === 'number') {
      playerCount = `${json.players}人`
    } else if (json.players.min && json.players.max) {
      playerCount = `${json.players.min}-${json.players.max}人`
    }
  } else if (!Array.isArray(json) && json?.setup && Array.isArray(json.setup)) {
    playerCount = `${json.setup.length}人`
  } else if (totalCharacters > 0) {
    // 根据角色总数和阵营配比估算玩家数
    const townsfoldCount = rolesByTeam.townsfolk.length
    const outsiderCount = rolesByTeam.outsider.length
    const minionCount = rolesByTeam.minion.length 
    const demonCount = rolesByTeam.demon.length
    
    // 血染钟楼标准配比计算
    if (townsfoldCount > 0 && demonCount > 0) {
      // 根据镇民数量推算玩家数（镇民通常占60-70%）
      const estimatedPlayers = Math.round(townsfoldCount / 0.65)
      playerCount = `${estimatedPlayers}人左右`
    } else {
      playerCount = `${Math.ceil(totalCharacters * 0.8)}人左右`
    }
  }
  
  // 计算各类型角色数量
  const roleCounts = Object.entries(rolesByTeam).map(([team, chars]) => ({
    team: team as BotcTeam,
    count: chars.length,
    characters: chars
  })).filter(item => item.count > 0)
  
  // 提取难度
  let difficulty = '普通'
  if (!Array.isArray(json) && json?.difficulty) {
    if (typeof json.difficulty === 'string') {
      difficulty = json.difficulty
    } else if (typeof json.difficulty === 'number') {
      const levels = ['简单', '普通', '困难', '专家', '地狱']
      difficulty = levels[Math.min(json.difficulty - 1, levels.length - 1)] || '普通'
    }
  } else if (Array.isArray(json)) {
    // 对于数组格式，根据角色复杂度推断难度
    const hasComplexRoles = characters.some(char => 
      char.ability && char.ability.length > 100 || 
      (char.reminders && char.reminders.length > 3)
    )
    difficulty = hasComplexRoles ? '困难' : '普通'
  }
  
  // 提取标签
  let tags: string[] = []
  if (!Array.isArray(json) && json?.tags && Array.isArray(json.tags)) {
    tags = json.tags.slice(0, 3) // 最多3个标签
  }
  
  // 提取类型
  let scriptType = '标准'
  if (!Array.isArray(json) && json?.type) {
    scriptType = json.type
  } else if (Array.isArray(json)) {
    // 对于数组格式，根据角色数量判断类型
    scriptType = totalCharacters > 15 ? '扩展剧本' : '标准剧本'
  }
  
  return {
    title: scriptName || '未命名剧本',
    author: scriptAuthor || '未知作者', 
    playerCount,
    totalCharacters,
    roleCounts,
    rolesByTeam,
    difficulty,
    scriptType,
    tags,
    description: Array.isArray(json) ? '' : (json?.description || '')
  }
}

/**
 * 生成剧本预览SVG图片 - 新版分类列表布局
 */
export function generateScriptPreviewSVG(scriptData: ScriptData): string {
  const { width } = PREVIEW_CONFIG
  const info = extractScriptInfo(scriptData)
  
  // 处理标题
  const maxTitleLength = 16
  const displayTitle = info.title.length > maxTitleLength 
    ? info.title.substring(0, maxTitleLength - 2) + '...'
    : info.title
  
  // 按顺序获取有角色的类型
  const teamOrder: BotcTeam[] = ['townsfolk', 'outsider', 'minion', 'demon', 'traveler', 'fabled']
  const teamsWithRoles = teamOrder.filter(team => info.rolesByTeam[team].length > 0)
  
  // 辅助函数：将长文本分成两行（固定宽度，超出才换行）
  const splitTextToLines = (text: string, maxLength: number): string[] => {
    if (text.length <= maxLength) return [text]
    
    // 固定宽度截断，第一行显示maxLength个字符
    const firstLine = text.substring(0, maxLength)
    const remainingText = text.substring(maxLength)
    
    // 第二行如果还超出，添加省略号
    const secondLine = remainingText.length > maxLength 
      ? remainingText.substring(0, maxLength - 2) + '..'
      : remainingText
    
    return [firstLine, secondLine]
  }

  // 生成角色列表HTML - 两列布局，包含logo和技能
  const generateRolesList = () => {
    let y = 70 // 起始Y坐标（删除了基础信息行）
    const roleElements: string[] = []
    const columnWidth = (width - 60) / 2 // 两列宽度
    const leftColumnX = 30
    const rightColumnX = leftColumnX + columnWidth + 10
    
    for (const team of teamsWithRoles) {
      const roles = info.rolesByTeam[team]
      const teamName = TEAM_NAMES[team]
      const teamEmoji = TEAM_EMOJIS[team]
      const teamColor = team === 'demon' ? '#ef4444' : 
                       team === 'minion' ? '#f97316' : 
                       team === 'outsider' ? '#eab308' : 
                       team === 'townsfolk' ? '#10b981' : 
                       team === 'traveler' ? '#8b5cf6' : '#ec4899'
      
      // 类型标题（跨两列）
      roleElements.push(`
        <rect x="${leftColumnX}" y="${y - 5}" width="${width - 60}" height="18" fill="${teamColor}" opacity="0.2" rx="4"/>
        <text x="${leftColumnX + 5}" y="${y + 8}" font-size="10" font-weight="bold" fill="${teamColor}">
          ${teamEmoji} ${teamName} (${roles.length}个)
        </text>
      `)
      
      y += 26  // 标题和角色之间的间距
      
      // 角色列表 - 两列布局
      let leftColumnHeight = 0  // 追踪左列的高度
      
      roles.forEach((char, index) => {
        const isLeftColumn = index % 2 === 0
        const currentX = isLeftColumn ? leftColumnX : rightColumnX
        const logoX = currentX + 10
        const textX = logoX + 14
        
        const name = char.name || char.id || '未知'
        const ability = char.ability || char.description || ''
        const imageUrl = char.image || ''
        const initial = name.charAt(0) || '?'
        
        // 技能描述支持两行，每行最多22个字符（充分利用列宽）
        const abilityLines = ability ? splitTextToLines(ability, 22) : []
        const currentHeight = abilityLines.length > 0 ? 20 + (abilityLines.length - 1) * 8 : 14
        
        // Logo - 使用真实图片
        if (imageUrl) {
          roleElements.push(`
            <defs>
              <clipPath id="clip-${char.id}">
                <circle cx="${logoX}" cy="${y - 3}" r="6"/>
              </clipPath>
            </defs>
            <circle cx="${logoX}" cy="${y - 3}" r="6.5" fill="${teamColor}" opacity="0.2"/>
            <image href="${imageUrl}" x="${logoX - 6}" y="${y - 9}" width="12" height="12" 
                   clip-path="url(#clip-${char.id})" preserveAspectRatio="xMidYMid slice"/>
          `)
        } else {
          // 备用：使用首字母
          roleElements.push(`
            <circle cx="${logoX}" cy="${y - 3}" r="7" fill="${teamColor}" opacity="0.15"/>
            <circle cx="${logoX}" cy="${y - 3}" r="6" fill="${teamColor}" opacity="0.25"/>
            <text x="${logoX}" y="${y + 1}" font-size="8" font-weight="bold" fill="${teamColor}" text-anchor="middle">${initial}</text>
          `)
        }
        
        // 角色名字
        roleElements.push(`
          <text x="${textX}" y="${y}" font-size="8" font-weight="bold" fill="#ffffff">${name}</text>
        `)
        
        // 角色技能（最多两行）
        abilityLines.forEach((line, lineIndex) => {
          roleElements.push(`
            <text x="${textX}" y="${y + 8 + lineIndex * 8}" font-size="6.5" fill="#94a3b8">${line}</text>
          `)
        })
        
        // 每两个角色（一行）后增加Y坐标
        if (isLeftColumn) {
          // 左列：记录高度
          leftColumnHeight = currentHeight
        } else {
          // 右列：使用左右列中的最大高度
          const rowHeight = Math.max(leftColumnHeight, currentHeight)
          y += rowHeight
        }
      })
      
      // 如果角色数是奇数，需要手动增加Y坐标
      if (roles.length % 2 === 1) {
        const lastChar = roles[roles.length - 1]
        const ability = lastChar.ability || lastChar.description || ''
        const abilityLines = ability ? splitTextToLines(ability, 22) : []
        const rowHeight = abilityLines.length > 0 ? 20 + (abilityLines.length - 1) * 8 : 14
        y += rowHeight
      }
      
      y += 12 // 类型之间的间距
    }
    
    return { elements: roleElements.join(''), finalY: y }
  }
  
  // 生成角色列表并获取最终高度
  const { elements: rolesContent, finalY } = generateRolesList()
  
  // 计算动态高度：最终Y坐标 + 底部边距
  const dynamicHeight = finalY + 40
  
  console.log(`[PREVIEW] Dynamic height calculated: ${dynamicHeight}px (content ends at ${finalY}px)`)
  
  // 生成SVG - 使用动态高度
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${dynamicHeight}" viewBox="0 0 ${width} ${dynamicHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="50%" style="stop-color:#1e293b"/>
      <stop offset="100%" style="stop-color:#334155"/>
    </linearGradient>
    <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="15" cy="15" r="1" fill="white" opacity="0.08"/>
    </pattern>
  </defs>
  
  <!-- 背景 -->
  <rect width="${width}" height="${dynamicHeight}" fill="url(#bgGrad)"/>
  <rect width="${width}" height="${dynamicHeight}" fill="url(#dots)"/>
  
  <!-- 边框 -->
  <rect x="10" y="10" width="${width - 20}" height="${dynamicHeight - 20}" 
        fill="none" stroke="#f59e0b" stroke-width="3" rx="8"/>
  
  <!-- 标题 -->
  <text x="${width/2}" y="42" font-size="20" font-weight="bold" 
        fill="white" text-anchor="middle">${displayTitle}</text>
  
  <!-- 作者信息 -->
  <text x="${width/2}" y="60" font-size="11" fill="#94a3b8" text-anchor="middle">
    作者: ${info.author}
  </text>
  
  <!-- 角色分类列表 -->
  ${rolesContent}
  
  <!-- 底部标识 -->
  <text x="${width - 15}" y="${dynamicHeight - 12}" font-size="8" fill="#ef4444" 
        text-anchor="end" opacity="0.7">🩸 Blood on the Clocktower</text>
</svg>`

  return svg
}

/**
 * 下载图片并转为base64
 */
async function downloadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(5000) // 5秒超时
    })
    if (!response.ok) return null
    
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const contentType = response.headers.get('content-type') || 'image/png'
    
    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.warn(`[PREVIEW] Failed to download image: ${url}`, error)
    return null
  }
}

/**
 * 处理JSON中的图片URL，转为base64
 */
async function processImagesInJson(json: any): Promise<any> {
  if (Array.isArray(json)) {
    const processed = await Promise.all(
      json.map(async (item) => {
        if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) {
          const base64 = await downloadImageAsBase64(item.image)
          return { ...item, image: base64 || item.image }
        }
        return item
      })
    )
    return processed
  }
  return json
}

/**
 * 生成剧本预览图 (SVG格式)
 */
export async function generateScriptPreview(
  scriptData: ScriptData,
  outputPath?: string
): Promise<Buffer> {
  try {
    console.log(`[PREVIEW GEN] Generating SVG for "${scriptData.title}"`)
    
    // 处理图片URL为base64
    const processedJson = await processImagesInJson(scriptData.json)
    const processedData = { ...scriptData, json: processedJson }
    
    const svg = generateScriptPreviewSVG(processedData)
    const buffer = Buffer.from(svg, 'utf-8')
    
    if (outputPath) {
      // 确保目录存在
      const dir = join(outputPath, '../')
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      
      // 保存为SVG文件
      const svgPath = outputPath.replace('.png', '.svg')
      writeFileSync(svgPath, svg, 'utf-8')
      console.log(`[PREVIEW GEN] SVG saved to: ${svgPath}`)
    }
    
    return buffer
  } catch (error) {
    console.error('[PREVIEW GEN] SVG generation failed:', error)
    throw error
  }
}

/**
 * 生成剧本预览图的文件路径 (SVG)
 */
export function getPreviewImagePath(scriptId: string): string {
  return `generated-previews/${scriptId}.svg`
}

/**
 * 检查是否需要重新生成预览图
 */
export function shouldRegeneratePreview(
  scriptId: string,
  lastModified: Date,
  storagePath: string
): boolean {
  const previewPath = join(storagePath, getPreviewImagePath(scriptId))
  
  if (!existsSync(previewPath)) {
    return true
  }
  
  try {
    const stats = require('fs').statSync(previewPath)
    return stats.mtime < lastModified
  } catch {
    return true
  }
}

/**
 * 批量生成预览图
 */
export async function batchGeneratePreviews(
  scripts: ScriptData[],
  storagePath: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0
  
  for (let i = 0; i < scripts.length; i++) {
    try {
      const script = scripts[i]
      const outputPath = join(storagePath, getPreviewImagePath(script.id))
      
      await generateScriptPreview(script, outputPath)
      success++
      
      if (onProgress) {
        onProgress(i + 1, scripts.length)
      }
    } catch (error) {
      console.error(`Failed to generate preview for script ${scripts[i].id}:`, error)
      failed++
    }
  }
  
  return { success, failed }
}
