/**
 * 剧本预览图自动生成器
 * 基于剧本JSON数据生成漂亮的SVG预览图片
 * 无需额外依赖，纯SVG实现
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'

// 预览图配置
export const PREVIEW_CONFIG = {
  width: 520, // 收缩宽度以适应更紧凑的布局
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
    danger: '#ef4444',
    night: '#8b5cf6' // 紫色用于夜晚行动
  },
  layout: {
    nightOrderWidth: 55, // 夜晚行动区域宽度（收缩）
    centerPadding: 4     // 中间区域左右边距（从8缩短到4）
    // nightLogoSize 和 nightLogoSpacing 现在动态计算
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
 * 提取夜晚行动顺序（过滤旅行者和传奇角色）
 */
function extractNightOrders(characters: BotcCharacter[]) {
  // 过滤函数：排除旅行者和传奇角色
  const isRegularCharacter = (char: BotcCharacter) => {
    const team = char.team?.toLowerCase()
    return team !== 'traveler' && team !== 'fabled'
  }
  
  // 首夜行动
  const firstNight = characters
    .filter(char => 
      typeof char.firstNight === 'number' && 
      char.firstNight > 0 && 
      isRegularCharacter(char)
    )
    .sort((a, b) => (a.firstNight || 0) - (b.firstNight || 0))
    .map(char => ({
      name: char.name || char.id || '未知',
      order: char.firstNight!,
      reminder: char.firstNightReminder || '',
      image: char.image || '',
      team: char.team
    }))
  
  // 其他夜晚行动
  const otherNight = characters
    .filter(char => 
      typeof char.otherNight === 'number' && 
      char.otherNight > 0 && 
      isRegularCharacter(char)
    )
    .sort((a, b) => (a.otherNight || 0) - (b.otherNight || 0))
    .map(char => ({
      name: char.name || char.id || '未知',
      order: char.otherNight!,
      reminder: char.otherNightReminder || '',
      image: char.image || '',
      team: char.team
    }))
  
  return { firstNight, otherNight }
}

/**
 * 从剧本JSON中提取关键信息
 */
export function extractScriptInfo(scriptData: ScriptData) {
  const { title, author, json } = scriptData
  
  // 处理两种JSON格式：数组格式和对象格式
  let characters: BotcCharacter[] = []
  // 直接使用传入的title和author（调用方已经处理了优先级）
  const scriptName: string = title
  const scriptAuthor: string = author || '未知作者'
  
  if (Array.isArray(json)) {
    // 数组格式：第一个元素是元数据，其余是角色
    console.log('[PREVIEW] Processing array format JSON')
    
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
  
  // 提取夜晚行动顺序
  const nightOrders = extractNightOrders(characters)
  
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
    description: Array.isArray(json) ? '' : (json?.description || ''),
    nightOrders // 添加夜晚行动顺序
  }
}

/**
 * 生成剧本预览SVG图片 - 新版分类列表布局
 */
export function generateScriptPreviewSVG(scriptData: ScriptData): string {
  const { width, layout } = PREVIEW_CONFIG
  const info = extractScriptInfo(scriptData)
  
  // 处理标题
  const maxTitleLength = 22 // 增加标题长度限制
  const displayTitle = info.title.length > maxTitleLength 
    ? info.title.substring(0, maxTitleLength - 2) + '...'
    : info.title
  
  // 按顺序获取有角色的类型
  const teamOrder: BotcTeam[] = ['townsfolk', 'outsider', 'minion', 'demon', 'traveler', 'fabled']
  const teamsWithRoles = teamOrder.filter(team => info.rolesByTeam[team].length > 0)
  
  // 计算布局
  const leftNightX = 15  // 左侧夜晚行动区域起始X
  const centerStartX = leftNightX + layout.nightOrderWidth + layout.centerPadding  // 中间区域起始X
  const centerWidth = width - 2 * (layout.nightOrderWidth + layout.centerPadding + 15) // 中间区域宽度
  const rightNightX = width - layout.nightOrderWidth - 15  // 右侧夜晚行动区域起始X
  
  // 辅助函数：将长文本智能分成多行（支持多行扩展，优先在标点符号处换行）
  const splitTextToLines = (
    text: string, 
    maxLength: number, 
    maxLines: number = 5
  ): string[] => {
    if (text.length <= maxLength) return [text]
    
    const lines: string[] = []
    let remaining = text
    
    // 标点符号列表（优先在这些位置换行）
    const punctuation = ['。', '，', '；', '：', '！', '？', '.', ',', ';', ':', '!', '?', ' ']
    
    while (remaining.length > 0 && lines.length < maxLines) {
      if (remaining.length <= maxLength) {
        // 剩余文本可以放在一行
        lines.push(remaining)
        break
      }
      
      // 尝试在标点符号或空格处切分
      let cutPoint = maxLength
      
      // 在 maxLength 附近查找最近的标点符号（向前查找 5 个字符）
      for (let i = maxLength; i > maxLength - 5 && i > 0; i--) {
        if (punctuation.includes(remaining[i])) {
          cutPoint = i + 1 // 包含标点符号
          break
        }
      }
      
      // 切分当前行
      const currentLine = remaining.substring(0, cutPoint).trim()
      lines.push(currentLine)
      remaining = remaining.substring(cutPoint).trim()
    }
    
    // 如果还有剩余文本（超过最大行数），在最后一行添加省略号
    if (remaining.length > 0 && lines.length === maxLines) {
      const lastLine = lines[lines.length - 1]
      if (lastLine.length > 2) {
        lines[lines.length - 1] = lastLine.substring(0, lastLine.length - 2) + '..'
      }
    }
    
    return lines
  }

  // 生成角色列表HTML - 两列布局，包含logo和技能
  const generateRolesList = () => {
    let y = 70 // 起始Y坐标（删除了基础信息行）
    const roleElements: string[] = []
    const columnWidth = (centerWidth - 20) / 2 // 两列宽度（基于中间区域宽度）
    const leftColumnX = centerStartX + 10
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
        <rect x="${leftColumnX}" y="${y - 5}" width="${centerWidth - 20}" height="18" fill="${teamColor}" opacity="0.2" rx="4"/>
        <text x="${leftColumnX + 5}" y="${y + 8}" font-size="10" font-weight="bold" fill="${teamColor}">
          ${teamEmoji} ${teamName} (${roles.length}个)
        </text>
      `)
      
      y += 32  // 标题和角色之间的间距（从26增加到32，避免logo放大后重叠）
      
      // 角色列表 - 两列布局
      let leftColumnHeight = 0  // 追踪左列的高度
      
      roles.forEach((char, index) => {
        const isLeftColumn = index % 2 === 0
        const currentX = isLeftColumn ? leftColumnX : rightColumnX
        const logoSize = 20 // 角色logo大小（从12增加到20）
        const logoX = currentX + 12
        const textX = logoX + logoSize + 4 // logo右侧+4px的文字起始位置
        
        const name = char.name || char.id || '未知'
        const ability = char.ability || char.description || ''
        const imageUrl = char.image || ''
        const initial = name.charAt(0) || '?'
        
        // 技能描述支持多行扩展（最多5行），每行最多调整为19个字符（因为logo变大了）
        const abilityLines = ability ? splitTextToLines(ability, 19, 5) : []
        const currentHeight = abilityLines.length > 0 ? 20 + (abilityLines.length - 1) * 8 : 14
        
        // Logo - 使用真实图片（增大到20x20）
        if (imageUrl) {
          roleElements.push(`
            <defs>
              <clipPath id="clip-${char.id}">
                <circle cx="${logoX}" cy="${y - 3}" r="${logoSize / 2}"/>
              </clipPath>
            </defs>
            <circle cx="${logoX}" cy="${y - 3}" r="${logoSize / 2 + 1}" fill="${teamColor}" opacity="0.2"/>
            <image href="${imageUrl}" x="${logoX - logoSize / 2}" y="${y - 3 - logoSize / 2}" width="${logoSize}" height="${logoSize}" 
                   clip-path="url(#clip-${char.id})" preserveAspectRatio="xMidYMid slice"/>
          `)
        } else {
          // 备用：使用首字母
          roleElements.push(`
            <circle cx="${logoX}" cy="${y - 3}" r="${logoSize / 2 + 1}" fill="${teamColor}" opacity="0.15"/>
            <circle cx="${logoX}" cy="${y - 3}" r="${logoSize / 2}" fill="${teamColor}" opacity="0.25"/>
            <text x="${logoX}" y="${y + 2}" font-size="11" font-weight="bold" fill="${teamColor}" text-anchor="middle">${initial}</text>
          `)
        }
        
        // 角色名字
        roleElements.push(`
          <text x="${textX}" y="${y}" font-size="8" font-weight="bold" fill="#ffffff">${name}</text>
        `)
        
        // 角色技能（支持多行扩展）
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
        const abilityLines = ability ? splitTextToLines(ability, 22, 5) : []
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
  
  // 生成夜晚行动顺序（只显示角色logo，垂直居中，动态缩放）
  const generateNightOrders = (totalHeight: number) => {
    const nightElements: string[] = []
    const topMargin = 70 // 顶部留白（避开标题区域）
    const bottomMargin = 40 // 底部留白
    const iconMargin = 0 // 互认区域后不需要额外边距，使用logoSpacing即可
    
    // 计算可用垂直空间
    const availableHeight = totalHeight - topMargin - bottomMargin
    
    // 获取最大角色数量（左侧需要+2，因为有爪和魔两个互认标记）
    const leftCharCount = info.nightOrders.firstNight.length + 2 // +2 = 爪 + 魔
    const rightCharCount = info.nightOrders.otherNight.length
    const maxCharCount = Math.max(leftCharCount, rightCharCount)
    
    // 如果没有夜晚行动角色，直接返回
    if (maxCharCount === 0) {
      return ''
    }
    
    // 动态计算logo大小和间距
    const spaceForLogos = availableHeight
    
    // 基础配置
    const minLogoSize = 18 // 最小logo大小
    const maxLogoSize = 26 // 最大logo大小（从32减小到26）
    const minSpacing = 22 // 最小间距
    const maxSpacing = 34 // 最大间距（从40减小到34）
    
    // 计算理想的间距（让logo均匀分布）
    let logoSpacing = spaceForLogos / maxCharCount
    let logoSize = logoSpacing * 0.7 // logo占间距的70%
    
    // 限制在合理范围内
    if (logoSize > maxLogoSize) {
      logoSize = maxLogoSize
      logoSpacing = maxSpacing
    } else if (logoSize < minLogoSize) {
      logoSize = minLogoSize
      logoSpacing = minSpacing
    } else {
      // 确保间距不会太小
      logoSpacing = Math.max(logoSpacing, minSpacing)
    }
    
    // 互认区域高度 = 2个logo的间距
    const recognitionHeight = 2 * logoSpacing
    
    // 重新计算实际需要的高度（左侧需要包含互认区域）
    const actualContentHeight = maxCharCount * logoSpacing
    
    // 计算垂直居中的起始Y坐标
    const startY = topMargin + (availableHeight - actualContentHeight) / 2
    
    console.log(`[PREVIEW] Night orders - left: ${leftCharCount} (爪+魔+${info.nightOrders.firstNight.length}), right: ${rightCharCount}, logoSize: ${logoSize.toFixed(1)}px, spacing: ${logoSpacing.toFixed(1)}px`)
    
    // 左侧：首夜行动（包含互认阶段）
    if (info.nightOrders.firstNight.length > 0) {
      const centerX = leftNightX + layout.nightOrderWidth / 2
      
      // 互认阶段标记：爪牙互认 + 恶魔认识爪牙（大小与logo一致）
      const recognitionSpacing = logoSpacing // 使用与logo相同的间距
      const borderWidth = Math.max(1.5, logoSize / 14) // 与logo相同的边框宽度
      const fontSize = Math.max(10, logoSize * 0.5) // 字体大小为logo的50%
      
      // "爪" - 爪牙互认阶段
      const minionY = startY + logoSize / 2
      nightElements.push(`
        <circle cx="${centerX}" cy="${minionY}" r="${logoSize / 2 + borderWidth}" fill="#f97316" opacity="0.2"/>
        <circle cx="${centerX}" cy="${minionY}" r="${logoSize / 2}" fill="#f97316" opacity="0.15"/>
        <text x="${centerX}" y="${minionY + fontSize * 0.35}" font-size="${fontSize}" font-weight="bold" 
              fill="#f97316" text-anchor="middle">爪</text>
      `)
      
      // "魔" - 恶魔认识爪牙阶段
      const demonY = minionY + recognitionSpacing
      nightElements.push(`
        <circle cx="${centerX}" cy="${demonY}" r="${logoSize / 2 + borderWidth}" fill="#ef4444" opacity="0.2"/>
        <circle cx="${centerX}" cy="${demonY}" r="${logoSize / 2}" fill="#ef4444" opacity="0.15"/>
        <text x="${centerX}" y="${demonY + fontSize * 0.35}" font-size="${fontSize}" font-weight="bold" 
              fill="#ef4444" text-anchor="middle">魔</text>
      `)
      
      // 角色logo列表（从互认区域后开始，index+2是因为爪和魔占了前2个位置）
      info.nightOrders.firstNight.forEach((action, index) => {
        const y = startY + (index + 2) * logoSpacing + logoSize / 2
        const logoId = `first-night-${index}`
        const borderWidth = Math.max(1.5, logoSize / 14) // 动态边框宽度
        
        if (action.image) {
          // 使用真实角色图片
          nightElements.push(`
            <defs>
              <clipPath id="clip-${logoId}">
                <circle cx="${centerX}" cy="${y}" r="${logoSize / 2}"/>
              </clipPath>
            </defs>
            <circle cx="${centerX}" cy="${y}" r="${logoSize / 2 + borderWidth}" fill="#8b5cf6" opacity="0.2"/>
            <image href="${action.image}" x="${centerX - logoSize / 2}" y="${y - logoSize / 2}" 
                   width="${logoSize}" height="${logoSize}" 
                   clip-path="url(#clip-${logoId})" preserveAspectRatio="xMidYMid slice"/>
          `)
        } else {
          // 备用：使用首字母
          const initial = action.name.charAt(0) || '?'
          const fontSize = Math.max(10, logoSize * 0.4)
          nightElements.push(`
            <circle cx="${centerX}" cy="${y}" r="${logoSize / 2}" fill="#8b5cf6" opacity="0.15"/>
            <text x="${centerX}" y="${y + fontSize * 0.35}" font-size="${fontSize}" font-weight="bold" 
                  fill="#8b5cf6" text-anchor="middle">${initial}</text>
          `)
        }
      })
    }
    
    // 右侧：其他夜晚行动（不包含互认阶段，直接从顶部开始）
    if (info.nightOrders.otherNight.length > 0) {
      const centerX = rightNightX + layout.nightOrderWidth / 2
      
      // 角色logo列表（从顶部开始，不需要月亮图标）
      info.nightOrders.otherNight.forEach((action, index) => {
        const y = startY + index * logoSpacing + logoSize / 2
        const logoId = `other-night-${index}`
        const borderWidth = Math.max(1.5, logoSize / 14) // 动态边框宽度
        
        if (action.image) {
          // 使用真实角色图片
          nightElements.push(`
            <defs>
              <clipPath id="clip-${logoId}">
                <circle cx="${centerX}" cy="${y}" r="${logoSize / 2}"/>
              </clipPath>
            </defs>
            <circle cx="${centerX}" cy="${y}" r="${logoSize / 2 + borderWidth}" fill="#8b5cf6" opacity="0.2"/>
            <image href="${action.image}" x="${centerX - logoSize / 2}" y="${y - logoSize / 2}" 
                   width="${logoSize}" height="${logoSize}" 
                   clip-path="url(#clip-${logoId})" preserveAspectRatio="xMidYMid slice"/>
          `)
        } else {
          // 备用：使用首字母
          const initial = action.name.charAt(0) || '?'
          const fontSize = Math.max(10, logoSize * 0.4)
          nightElements.push(`
            <circle cx="${centerX}" cy="${y}" r="${logoSize / 2}" fill="#8b5cf6" opacity="0.15"/>
            <text x="${centerX}" y="${y + fontSize * 0.35}" font-size="${fontSize}" font-weight="bold" 
                  fill="#8b5cf6" text-anchor="middle">${initial}</text>
          `)
        }
      })
    }
    
    return nightElements.join('')
  }
  
  const nightOrdersContent = generateNightOrders(dynamicHeight)
  
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
  
  <!-- 左上角制作者水印 -->
  <text x="20" y="28" font-size="9" fill="#94a3b8" opacity="0.25">
    制作者：萌萌
  </text>
  
  <!-- 标题 -->
  <text x="${width/2}" y="42" font-size="20" font-weight="bold" 
        fill="white" text-anchor="middle">${displayTitle}</text>
  
  <!-- 作者信息 -->
  <text x="${width/2}" y="60" font-size="11" fill="#94a3b8" text-anchor="middle">
    作者: ${info.author}
  </text>
  
  <!-- 角色分类列表 -->
  ${rolesContent}
  
  <!-- 夜晚行动顺序 -->
  ${nightOrdersContent}
</svg>`

  return svg
}

/**
 * 下载图片并转为base64
 */
async function compressBufferToBase64(
  buffer: ArrayBuffer,
  contentType: string,
  maxSize: number,
  prefer: 'png' | 'jpeg' = 'png'
): Promise<string> {
  // 如果原图已足够小，直接返回
  if (buffer.byteLength <= maxSize) {
    return `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`
  }

  // 先尝试PNG压缩
  if (prefer === 'png') {
    let quality = 70
    let maxWidth = 48
    let smallest: Buffer | null = null

    for (let i = 0; i < 4; i++) {
      try {
        const out = await sharp(Buffer.from(buffer))
          .resize(maxWidth, maxWidth, { fit: 'inside', withoutEnlargement: true })
          .png({ quality, compressionLevel: 9 })
          .toBuffer()
        smallest = !smallest || out.length < smallest.length ? out : smallest
        if (out.length <= maxSize) {
          return `data:image/png;base64,${out.toString('base64')}`
        }
        maxWidth = Math.max(20, Math.floor(maxWidth * 0.8))
        quality = Math.max(30, quality - 15)
      } catch {}
    }
    if (smallest) {
      return `data:image/png;base64,${smallest.toString('base64')}`
    }
  }

  // 再尝试JPEG压缩
  {
    let quality = 60
    let maxWidth = 36
    let smallest: Buffer | null = null
    for (let i = 0; i < 4; i++) {
      try {
        const out = await sharp(Buffer.from(buffer))
          .resize(maxWidth, maxWidth, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality, progressive: true, optimiseScans: true })
          .toBuffer()
        smallest = !smallest || out.length < smallest.length ? out : smallest
        if (out.length <= maxSize) {
          return `data:image/jpeg;base64,${out.toString('base64')}`
        }
        maxWidth = Math.max(16, Math.floor(maxWidth * 0.8))
        quality = Math.max(20, quality - 15)
      } catch {}
    }
    if (smallest) {
      return `data:image/jpeg;base64,${smallest.toString('base64')}`
    }
  }

  // 最后保底：返回原图（可能较大），以满足“不得使用占位符”的要求
  return `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`
}

async function downloadAndCompressAsBase64(url: string, maxSize: number, retries = 2): Promise<string | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // 减少图片下载超时从15秒到8秒，避免单个图片占用太多时间
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (!response.ok) {
        console.warn(`[PREVIEW] Image download failed (HTTP ${response.status}): ${url}`)
        return null
      }
      const buffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'image/png'
      return await compressBufferToBase64(buffer, contentType, maxSize, 'png')
    } catch (error) {
      const isLastAttempt = attempt === retries
      if (isLastAttempt) {
        console.warn(`[PREVIEW] Failed to download image after ${retries + 1} attempts: ${url}`, error)
        return null
      }
      // 减少重试等待时间从800ms到500ms
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  return null
}

/**
 * 处理JSON中的图片URL，转为base64
 */
async function processImagesInJson(json: any): Promise<any> {
  // 计算角色数量用于确定压缩阈值
  const countRoles = (data: any): number => {
    if (Array.isArray(data)) {
      return data.filter((x: any) => x && x.id && x.id !== '_meta').length
    }
    if (data && Array.isArray(data.characters)) return data.characters.length
    return 0
  }
  const roleCount = countRoles(json)
  const isLarge = roleCount > 15
  const isVeryLarge = roleCount > 20
  const perImageMax = isVeryLarge ? 4 * 1024 : isLarge ? 8 * 1024 : 20 * 1024

  const processArray = async (arr: any[]) => Promise.all(arr.map(async (item) => {
    // 处理角色图片
    if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) {
      const base64 = await downloadAndCompressAsBase64(item.image, perImageMax)
      // 若下载失败，移除image以便SVG回退到首字母，不使用占位符
      return base64 ? { ...item, image: base64 } : { ...item, image: undefined }
    }
    // 处理_meta.logo
    if (item.id === '_meta' && item.logo && typeof item.logo === 'string' && item.logo.startsWith('http')) {
      const base64 = await downloadAndCompressAsBase64(item.logo, Math.min(12 * 1024, perImageMax))
      return base64 ? { ...item, logo: base64 } : { ...item, logo: undefined }
    }
    return item
  }))

  if (Array.isArray(json)) {
    return await processArray(json)
  }
  if (json && typeof json === 'object' && Array.isArray(json.characters)) {
    const processedChars = await processArray(json.characters)
    const processedMeta = Array.isArray(json._meta) ? await processArray(json._meta) : json._meta
    return { ...json, characters: processedChars, _meta: processedMeta }
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
  const startTime = Date.now()
  try {
    console.log(`[PREVIEW GEN] Generating SVG for "${scriptData.title}"`)
    
    // 处理图片URL为base64（设置总超时30秒）
    const processStartTime = Date.now()
    const processedJson = await Promise.race([
      processImagesInJson(scriptData.json),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('图片处理超时')), 30000)
      )
    ]) as any
    const processTime = Date.now() - processStartTime
    console.log(`[PREVIEW GEN] Image processing took ${processTime}ms`)
    
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
    
    const totalTime = Date.now() - startTime
    console.log(`[PREVIEW GEN] Total generation time: ${totalTime}ms`)
    return buffer
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`[PREVIEW GEN] SVG generation failed after ${totalTime}ms:`, error)
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
