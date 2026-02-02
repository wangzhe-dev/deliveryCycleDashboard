// src/components/segmentLayout.js
export const SEGMENT_LAYOUT = {
    // ==================== FF1区 - 最前段 ====================
    'A201C': { zone: 'A', mZone: 'FORE', mSubZone: 'FF1', x: -85, y: -1.5, z: 0, width: 10, height: 3, depth: 8, type: 'center' },
    'A201P': { zone: 'A', mZone: 'FORE', mSubZone: 'FF1', x: -85, y: -1.5, z: -8, width: 10, height: 3, depth: 6, type: 'port' },
    'A201S': { zone: 'A', mZone: 'FORE', mSubZone: 'FF1', x: -85, y: -1.5, z: 8, width: 10, height: 3, depth: 6, type: 'starboard' },
    
    // ==================== FF2区 - 前段中部 ====================
    'A202C': { zone: 'A', mZone: 'FORE', mSubZone: 'FF2', x: -75, y: -0.5, z: 0, width: 10, height: 4, depth: 10, type: 'center' },
    'A202P': { zone: 'A', mZone: 'FORE', mSubZone: 'FF2', x: -75, y: -0.5, z: -10, width: 10, height: 4, depth: 6, type: 'port' },
    'A202S': { zone: 'A', mZone: 'FORE', mSubZone: 'FF2', x: -75, y: -0.5, z: 10, width: 10, height: 4, depth: 6, type: 'starboard' },
    
    // ==================== FF3区 - 前段后部 ====================
    'A203C': { zone: 'A', mZone: 'FORE', mSubZone: 'FF3', x: -65, y: 1, z: 0, width: 10, height: 5, depth: 12, type: 'center' },
    'A203P': { zone: 'A', mZone: 'FORE', mSubZone: 'FF3', x: -65, y: 1, z: -12, width: 10, height: 5, depth: 6, type: 'port' },
    'A203S': { zone: 'A', mZone: 'FORE', mSubZone: 'FF3', x: -65, y: 1, z: 12, width: 10, height: 5, depth: 6, type: 'starboard' },
    
    // ==================== FM1区 - 前舷下段 ====================
    'B101P': { zone: 'B', mZone: 'FORE_MID', mSubZone: 'FM1', x: -70, y: -3.5, z: -8, width: 12, height: 3, depth: 4, type: 'port' },
    'B101S': { zone: 'B', mZone: 'FORE_MID', mSubZone: 'FM1', x: -70, y: -3.5, z: 8, width: 12, height: 3, depth: 4, type: 'starboard' },
    'S301S': { zone: 'S', mZone: 'FORE_MID', mSubZone: 'FM1', x: -60, y: 4, z: 14, width: 10, height: 5, depth: 2, type: 'starboard' },
    'S302P': { zone: 'S', mZone: 'FORE_MID', mSubZone: 'FM1', x: -60, y: 4, z: -14, width: 10, height: 5, depth: 2, type: 'port' },
    
    // ==================== FM2区 - 前舷中段 ====================
    'B102P': { zone: 'B', mZone: 'FORE_MID', mSubZone: 'FM2', x: -58, y: -3.5, z: -8, width: 12, height: 3, depth: 4, type: 'port' },
    'B102S': { zone: 'B', mZone: 'FORE_MID', mSubZone: 'FM2', x: -58, y: -3.5, z: 8, width: 12, height: 3, depth: 4, type: 'starboard' },
    'S303P': { zone: 'S', mZone: 'FORE_MID', mSubZone: 'FM2', x: -50, y: 4, z: -14, width: 10, height: 5, depth: 2, type: 'port' },
    'S303S': { zone: 'S', mZone: 'FORE_MID', mSubZone: 'FM2', x: -50, y: 4, z: 14, width: 10, height: 5, depth: 2, type: 'starboard' },
    'A301P': { zone: 'A', mZone: 'FORE_MID', mSubZone: 'FM2', x: -58, y: 8, z: -8, width: 8, height: 4, depth: 3, type: 'port' },
    'A301S': { zone: 'A', mZone: 'FORE_MID', mSubZone: 'FM2', x: -58, y: 8, z: 8, width: 8, height: 4, depth: 3, type: 'starboard' },
    
    // ==================== FM3区 - 前舷后段 ====================
    'B103P': { zone: 'B', mZone: 'FORE_MID', mSubZone: 'FM3', x: -46, y: -3.5, z: -8, width: 12, height: 3, depth: 4, type: 'port' },
    'B103S': { zone: 'B', mZone: 'FORE_MID', mSubZone: 'FM3', x: -46, y: -3.5, z: 8, width: 12, height: 3, depth: 4, type: 'starboard' },
    'S304P': { zone: 'S', mZone: 'FORE_MID', mSubZone: 'FM3', x: -40, y: 4, z: -14, width: 10, height: 5, depth: 2, type: 'port' },
    'S304S': { zone: 'S', mZone: 'FORE_MID', mSubZone: 'FM3', x: -40, y: 4, z: 14, width: 10, height: 5, depth: 2, type: 'starboard' },
    'A302P': { zone: 'A', mZone: 'FORE_MID', mSubZone: 'FM3', x: -50, y: 8, z: -8, width: 8, height: 4, depth: 3, type: 'port' },
    'A302S': { zone: 'A', mZone: 'FORE_MID', mSubZone: 'FM3', x: -50, y: 8, z: 8, width: 8, height: 4, depth: 3, type: 'starboard' },
    
    // ==================== MD1区 - 中舷前段 ====================
    'B104P': { zone: 'B', mZone: 'MID', mSubZone: 'MD1', x: -34, y: -3.5, z: -8, width: 12, height: 3, depth: 4, type: 'port' },
    'B104S': { zone: 'B', mZone: 'MID', mSubZone: 'MD1', x: -34, y: -3.5, z: 8, width: 12, height: 3, depth: 4, type: 'starboard' },
    'S305P': { zone: 'S', mZone: 'MID', mSubZone: 'MD1', x: -30, y: 4, z: -14, width: 10, height: 5, depth: 2, type: 'port' },
    'S305S': { zone: 'S', mZone: 'MID', mSubZone: 'MD1', x: -30, y: 4, z: 14, width: 10, height: 5, depth: 2, type: 'starboard' },
    'A303P': { zone: 'A', mZone: 'MID', mSubZone: 'MD1', x: -42, y: 8, z: -8, width: 8, height: 4, depth: 3, type: 'port' },
    'A303S': { zone: 'A', mZone: 'MID', mSubZone: 'MD1', x: -42, y: 8, z: 8, width: 8, height: 4, depth: 3, type: 'starboard' },
    
    // ==================== MD2区 - 中舷中前段 ====================
    'B105P': { zone: 'B', mZone: 'MID', mSubZone: 'MD2', x: -22, y: -3.5, z: -8, width: 12, height: 3, depth: 4, type: 'port' },
    'B105S': { zone: 'B', mZone: 'MID', mSubZone: 'MD2', x: -22, y: -3.5, z: 8, width: 12, height: 3, depth: 4, type: 'starboard' },
    'S306P': { zone: 'S', mZone: 'MID', mSubZone: 'MD2', x: -20, y: 4, z: -14, width: 10, height: 5, depth: 2, type: 'port' },
    'S306S': { zone: 'S', mZone: 'MID', mSubZone: 'MD2', x: -20, y: 4, z: 14, width: 10, height: 5, depth: 2, type: 'starboard' },
    'A304C': { zone: 'A', mZone: 'MID', mSubZone: 'MD2', x: -34, y: 8, z: 0, width: 8, height: 4, depth: 6, type: 'center' },
    'A304P': { zone: 'A', mZone: 'MID', mSubZone: 'MD2', x: -34, y: 8, z: -6, width: 8, height: 4, depth: 3, type: 'port' },
    'A304S': { zone: 'A', mZone: 'MID', mSubZone: 'MD2', x: -34, y: 8, z: 6, width: 8, height: 4, depth: 3, type: 'starboard' },
    
    // ==================== MD3区 - 中舷中心段 ====================
    'B106P': { zone: 'B', mZone: 'MID', mSubZone: 'MD3', x: -10, y: -3.5, z: -8, width: 12, height: 3, depth: 4, type: 'port' },
    'B106S': { zone: 'B', mZone: 'MID', mSubZone: 'MD3', x: -10, y: -3.5, z: 8, width: 12, height: 3, depth: 4, type: 'starboard' },
    'S307P': { zone: 'S', mZone: 'MID', mSubZone: 'MD3', x: -10, y: 4, z: -14, width: 10, height: 5, depth: 2, type: 'port' },
    'S307S': { zone: 'S', mZone: 'MID', mSubZone: 'MD3', x: -10, y: 4, z: 14, width: 10, height: 5, depth: 2, type: 'starboard' },
    'A305C': { zone: 'A', mZone: 'MID', mSubZone: 'MD3', x: -26, y: 8, z: 0, width: 8, height: 4, depth: 6, type: 'center' },
    'A305P': { zone: 'A', mZone: 'MID', mSubZone: 'MD3', x: -26, y: 8, z: -6, width: 8, height: 4, depth: 3, type: 'port' },
    'A305S': { zone: 'A', mZone: 'MID', mSubZone: 'MD3', x: -26, y: 8, z: 6, width: 8, height: 4, depth: 3, type: 'starboard' },
    
    // ==================== MD4区 - 中舷后段 ====================
    'B107C': { zone: 'B', mZone: 'MID', mSubZone: 'MD4', x: 2, y: -3.5, z: 0, width: 14, height: 3, depth: 8, type: 'center' },
    'S308P': { zone: 'S', mZone: 'MID', mSubZone: 'MD4', x: 0, y: 4, z: -14, width: 10, height: 5, depth: 2, type: 'port' },
    'S308S': { zone: 'S', mZone: 'MID', mSubZone: 'MD4', x: 0, y: 4, z: 14, width: 10, height: 5, depth: 2, type: 'starboard' },
    'S310C': { zone: 'S', mZone: 'MID', mSubZone: 'MD4', x: 10, y: 4, z: 0, width: 10, height: 5, depth: 4, type: 'center' },
    'M101P': { zone: 'M', mZone: 'MID', mSubZone: 'MD4', x: -50, y: 6, z: -5, width: 8, height: 4, depth: 3, type: 'port' },
    'M101S': { zone: 'M', mZone: 'MID', mSubZone: 'MD4', x: -50, y: 6, z: 5, width: 8, height: 4, depth: 3, type: 'starboard' },
    
    // ==================== ER1区 - 机舱前段 ====================
    'B108C': { zone: 'B', mZone: 'ENGINE', mSubZone: 'ER1', x: 16, y: -3.5, z: 0, width: 14, height: 3, depth: 8, type: 'center' },
    'E100S': { zone: 'E', mZone: 'ENGINE', mSubZone: 'ER1', x: 30, y: 3, z: 12, width: 10, height: 8, depth: 4, type: 'starboard' },
    'E101P': { zone: 'E', mZone: 'ENGINE', mSubZone: 'ER1', x: 30, y: 3, z: -12, width: 10, height: 8, depth: 4, type: 'port' },
    'E101S': { zone: 'E', mZone: 'ENGINE', mSubZone: 'ER1', x: 30, y: 3, z: 12, width: 10, height: 8, depth: 4, type: 'starboard' },
    'S401P': { zone: 'S', mZone: 'ENGINE', mSubZone: 'ER1', x: 20, y: 4, z: -14, width: 10, height: 5, depth: 2, type: 'port' },
    'S401S': { zone: 'S', mZone: 'ENGINE', mSubZone: 'ER1', x: 20, y: 4, z: 14, width: 10, height: 5, depth: 2, type: 'starboard' },
    
    // ==================== ER2区 - 机舱中段 ====================
    'B109C': { zone: 'B', mZone: 'ENGINE', mSubZone: 'ER2', x: 30, y: -3.5, z: 0, width: 14, height: 3, depth: 8, type: 'center' },
    'E102P': { zone: 'E', mZone: 'ENGINE', mSubZone: 'ER2', x: 40, y: 3, z: -12, width: 10, height: 8, depth: 4, type: 'port' },
    'E102S': { zone: 'E', mZone: 'ENGINE', mSubZone: 'ER2', x: 40, y: 3, z: 12, width: 10, height: 8, depth: 4, type: 'starboard' },
    'S402P': { zone: 'S', mZone: 'ENGINE', mSubZone: 'ER2', x: 30, y: 4, z: -14, width: 10, height: 5, depth: 2, type: 'port' },
    'S402S': { zone: 'S', mZone: 'ENGINE', mSubZone: 'ER2', x: 30, y: 4, z: 14, width: 10, height: 5, depth: 2, type: 'starboard' },
    
    // ==================== ER3区 - 机舱后段 ====================
    'B110C': { zone: 'B', mZone: 'ENGINE', mSubZone: 'ER3', x: 44, y: -3.5, z: 0, width: 14, height: 3, depth: 8, type: 'center' },
    'E103P': { zone: 'E', mZone: 'ENGINE', mSubZone: 'ER3', x: 50, y: 3, z: -12, width: 10, height: 8, depth: 4, type: 'port' },
    'E103S': { zone: 'E', mZone: 'ENGINE', mSubZone: 'ER3', x: 50, y: 3, z: 12, width: 10, height: 8, depth: 4, type: 'starboard' },
    'S501P': { zone: 'S', mZone: 'ENGINE', mSubZone: 'ER3', x: 40, y: 4, z: -14, width: 10, height: 5, depth: 2, type: 'port' },
    'S501S': { zone: 'S', mZone: 'ENGINE', mSubZone: 'ER3', x: 40, y: 4, z: 14, width: 10, height: 5, depth: 2, type: 'starboard' },
    
    // ==================== AF1区 - 船艉前段 ====================
    'E201C': { zone: 'E', mZone: 'AFT', mSubZone: 'AF1', x: 60, y: 5, z: 0, width: 12, height: 10, depth: 10, type: 'center' },
    'E201P': { zone: 'E', mZone: 'AFT', mSubZone: 'AF1', x: 60, y: 5, z: -10, width: 12, height: 10, depth: 4, type: 'port' },
    'E201S': { zone: 'E', mZone: 'AFT', mSubZone: 'AF1', x: 60, y: 5, z: 10, width: 12, height: 10, depth: 4, type: 'starboard' },
    'S502P': { zone: 'S', mZone: 'AFT', mSubZone: 'AF1', x: 50, y: 4, z: -14, width: 10, height: 5, depth: 2, type: 'port' },
    'S502S': { zone: 'S', mZone: 'AFT', mSubZone: 'AF1', x: 50, y: 4, z: 14, width: 10, height: 5, depth: 2, type: 'starboard' },
    
    // ==================== AF2区 - 船艉中段 ====================
    'E202C': { zone: 'E', mZone: 'AFT', mSubZone: 'AF2', x: 72, y: 5, z: 0, width: 12, height: 10, depth: 10, type: 'center' },
    'E202P': { zone: 'E', mZone: 'AFT', mSubZone: 'AF2', x: 72, y: 5, z: -10, width: 12, height: 10, depth: 4, type: 'port' },
    'E202S': { zone: 'E', mZone: 'AFT', mSubZone: 'AF2', x: 72, y: 5, z: 10, width: 12, height: 10, depth: 4, type: 'starboard' },
    'E203P': { zone: 'E', mZone: 'AFT', mSubZone: 'AF2', x: 84, y: 8, z: -8, width: 10, height: 4, depth: 3, type: 'port' },
    'E203S': { zone: 'E', mZone: 'AFT', mSubZone: 'AF2', x: 84, y: 8, z: 8, width: 10, height: 4, depth: 3, type: 'starboard' },
    
    // ==================== AF3区 - 船艉后段 ====================
    'F101C': { zone: 'F', mZone: 'AFT', mSubZone: 'AF3', x: 84, y: 2, z: 0, width: 10, height: 6, depth: 8, type: 'center' },
    'F201C': { zone: 'F', mZone: 'AFT', mSubZone: 'AF3', x: 94, y: 3, z: 0, width: 10, height: 7, depth: 8, type: 'center' },
    'F202C': { zone: 'F', mZone: 'AFT', mSubZone: 'AF3', x: 104, y: 3, z: 0, width: 10, height: 7, depth: 8, type: 'center' },
    'F301C': { zone: 'F', mZone: 'AFT', mSubZone: 'AF3', x: 114, y: 2, z: 0, width: 10, height: 6, depth: 8, type: 'center' },
    'F501C': { zone: 'F', mZone: 'AFT', mSubZone: 'AF3', x: 124, y: 1, z: 0, width: 10, height: 5, depth: 6, type: 'center' },
    'F601P': { zone: 'F', mZone: 'AFT', mSubZone: 'AF3', x: 124, y: 1, z: -6, width: 10, height: 5, depth: 4, type: 'port' },
    'F601S': { zone: 'F', mZone: 'AFT', mSubZone: 'AF3', x: 124, y: 1, z: 6, width: 10, height: 5, depth: 4, type: 'starboard' },
    
    // ==================== 上层建筑区域 ====================
    'E300P': { zone: 'E', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS1', x: 94, y: 8, z: -8, width: 10, height: 4, depth: 3, type: 'port' },
    'E300S': { zone: 'E', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS1', x: 94, y: 8, z: 8, width: 10, height: 4, depth: 3, type: 'starboard' },
    'E301P': { zone: 'E', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS2', x: 104, y: 8, z: -8, width: 10, height: 4, depth: 3, type: 'port' },
    'E301S': { zone: 'E', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS2', x: 104, y: 8, z: 8, width: 10, height: 4, depth: 3, type: 'starboard' },
    'E302P': { zone: 'E', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS3', x: 114, y: 8, z: -8, width: 10, height: 4, depth: 3, type: 'port' },
    'E302S': { zone: 'E', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS3', x: 114, y: 8, z: 8, width: 10, height: 4, depth: 3, type: 'starboard' },
    'E303P': { zone: 'E', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS3', x: 124, y: 8, z: -8, width: 10, height: 4, depth: 3, type: 'port' },
    'E303S': { zone: 'E', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS3', x: 124, y: 8, z: 8, width: 10, height: 4, depth: 3, type: 'starboard' },
    'E901P': { zone: 'E', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS3', x: 134, y: 8, z: -8, width: 10, height: 4, depth: 3, type: 'port' },
    'E901S': { zone: 'E', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS3', x: 134, y: 8, z: 8, width: 10, height: 4, depth: 3, type: 'starboard' },
    'E902C': { zone: 'E', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS3', x: 144, y: 8, z: 0, width: 12, height: 4, depth: 8, type: 'center' },
    
    // ==================== D系列 - 上层建筑 ====================
    'D301C': { zone: 'D', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS1', x: 100, y: 12, z: 0, width: 8, height: 5, depth: 10, type: 'center' },
    'D302C': { zone: 'D', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS2', x: 108, y: 12, z: 0, width: 8, height: 5, depth: 10, type: 'center' },
    'D303C': { zone: 'D', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS2', x: 116, y: 12, z: 0, width: 8, height: 5, depth: 10, type: 'center' },
    'D304C': { zone: 'D', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS3', x: 124, y: 12, z: 0, width: 8, height: 5, depth: 10, type: 'center' },
    'D305C': { zone: 'D', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS3', x: 132, y: 12, z: 0, width: 8, height: 5, depth: 10, type: 'center' },
    'D306C': { zone: 'D', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS3', x: 140, y: 12, z: 0, width: 8, height: 5, depth: 10, type: 'center' },
    'D307C': { zone: 'D', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS3', x: 148, y: 12, z: 0, width: 8, height: 5, depth: 10, type: 'center' },
    'D308C': { zone: 'D', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS3', x: 156, y: 12, z: 0, width: 8, height: 5, depth: 10, type: 'center' },
    'D509C': { zone: 'D', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS1', x: -40, y: 12, z: 0, width: 8, height: 5, depth: 8, type: 'center' },
    'D510C': { zone: 'D', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS1', x: -48, y: 12, z: 0, width: 8, height: 5, depth: 8, type: 'center' },
    'D511C': { zone: 'D', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS1', x: -56, y: 12, z: 0, width: 8, height: 5, depth: 8, type: 'center' },
    'D512C': { zone: 'D', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS1', x: -64, y: 12, z: 0, width: 8, height: 5, depth: 8, type: 'center' },
    'D513C': { zone: 'D', mZone: 'SUPERSTRUCTURE', mSubZone: 'SS1', x: -72, y: 12, z: 0, width: 8, height: 5, depth: 8, type: 'center' },
        // ==================== 额外：FORE 区 - 船艏龙骨 + 弧度带 ====================
    // 船艏龙骨（稍微低一点、窄一点）
    'K_FF1': { zone: 'B', mZone: 'FORE', mSubZone: 'FF1', x: -85, y: -4.5, z: 0, width: 8, height: 2.2, depth: 6, type: 'center' },
    'K_FF2': { zone: 'B', mZone: 'FORE', mSubZone: 'FF2', x: -75, y: -4.2, z: 0, width: 8, height: 2.4, depth: 7, type: 'center' },
    'K_FF3': { zone: 'B', mZone: 'FORE', mSubZone: 'FF3', x: -65, y: -3.8, z: 0, width: 8, height: 2.6, depth: 8, type: 'center' },

    // 船艏两侧下缘弧度（更靠外、更矮一点）
    'CURVE_FF1P': { zone: 'S', mZone: 'FORE', mSubZone: 'FF1', x: -85, y: -2.2, z: -16, width: 8, height: 3, depth: 3, type: 'port' },
    'CURVE_FF1S': { zone: 'S', mZone: 'FORE', mSubZone: 'FF1', x: -85, y: -2.2, z: 16, width: 8, height: 3, depth: 3, type: 'starboard' },

    'CURVE_FF2P': { zone: 'S', mZone: 'FORE', mSubZone: 'FF2', x: -75, y: -1.8, z: -16, width: 8, height: 3.2, depth: 3, type: 'port' },
    'CURVE_FF2S': { zone: 'S', mZone: 'FORE', mSubZone: 'FF2', x: -75, y: -1.8, z: 16, width: 8, height: 3.2, depth: 3, type: 'starboard' },

    'CURVE_FF3P': { zone: 'S', mZone: 'FORE', mSubZone: 'FF3', x: -65, y: -1.2, z: -16, width: 8, height: 3.4, depth: 3, type: 'port' },
    'CURVE_FF3S': { zone: 'S', mZone: 'FORE', mSubZone: 'FF3', x: -65, y: -1.2, z: 16, width: 8, height: 3.4, depth: 3, type: 'starboard' },

    // ==================== 额外：FORE_MID 区 - 前舷龙骨 + 弧度带 ====================
    'K_FM1': { zone: 'B', mZone: 'FORE_MID', mSubZone: 'FM1', x: -70, y: -4.2, z: 0, width: 10, height: 2.2, depth: 6, type: 'center' },
    'K_FM2': { zone: 'B', mZone: 'FORE_MID', mSubZone: 'FM2', x: -58, y: -4.0, z: 0, width: 10, height: 2.4, depth: 6, type: 'center' },
    'K_FM3': { zone: 'B', mZone: 'FORE_MID', mSubZone: 'FM3', x: -46, y: -3.8, z: 0, width: 10, height: 2.6, depth: 6, type: 'center' },

    'CURVE_FM1P': { zone: 'S', mZone: 'FORE_MID', mSubZone: 'FM1', x: -70, y: -2.6, z: -12, width: 10, height: 2.6, depth: 3, type: 'port' },
    'CURVE_FM1S': { zone: 'S', mZone: 'FORE_MID', mSubZone: 'FM1', x: -70, y: -2.6, z: 12, width: 10, height: 2.6, depth: 3, type: 'starboard' },

    'CURVE_FM2P': { zone: 'S', mZone: 'FORE_MID', mSubZone: 'FM2', x: -58, y: -2.4, z: -12, width: 10, height: 2.8, depth: 3, type: 'port' },
    'CURVE_FM2S': { zone: 'S', mZone: 'FORE_MID', mSubZone: 'FM2', x: -58, y: -2.4, z: 12, width: 10, height: 2.8, depth: 3, type: 'starboard' },

    'CURVE_FM3P': { zone: 'S', mZone: 'FORE_MID', mSubZone: 'FM3', x: -46, y: -2.2, z: -12, width: 10, height: 3.0, depth: 3, type: 'port' },
    'CURVE_FM3S': { zone: 'S', mZone: 'FORE_MID', mSubZone: 'FM3', x: -46, y: -2.2, z: 12, width: 10, height: 3.0, depth: 3, type: 'starboard' },

    // ==================== 额外：MID 区 - 中舷龙骨 + 弧度带 ====================
    'K_MD1': { zone: 'B', mZone: 'MID', mSubZone: 'MD1', x: -34, y: -4.0, z: 0, width: 12, height: 2.4, depth: 7, type: 'center' },
    'K_MD2': { zone: 'B', mZone: 'MID', mSubZone: 'MD2', x: -22, y: -3.8, z: 0, width: 12, height: 2.6, depth: 7, type: 'center' },
    'K_MD3': { zone: 'B', mZone: 'MID', mSubZone: 'MD3', x: -10, y: -3.6, z: 0, width: 12, height: 2.8, depth: 7, type: 'center' },
    'K_MD4': { zone: 'B', mZone: 'MID', mSubZone: 'MD4', x: 2, y: -3.4, z: 0, width: 12, height: 3.0, depth: 7, type: 'center' },

    'CURVE_MD1P': { zone: 'S', mZone: 'MID', mSubZone: 'MD1', x: -34, y: -2.6, z: -14, width: 11, height: 3.0, depth: 3, type: 'port' },
    'CURVE_MD1S': { zone: 'S', mZone: 'MID', mSubZone: 'MD1', x: -34, y: -2.6, z: 14, width: 11, height: 3.0, depth: 3, type: 'starboard' },

    'CURVE_MD2P': { zone: 'S', mZone: 'MID', mSubZone: 'MD2', x: -22, y: -2.4, z: -14, width: 11, height: 3.2, depth: 3, type: 'port' },
    'CURVE_MD2S': { zone: 'S', mZone: 'MID', mSubZone: 'MD2', x: -22, y: -2.4, z: 14, width: 11, height: 3.2, depth: 3, type: 'starboard' },

    'CURVE_MD3P': { zone: 'S', mZone: 'MID', mSubZone: 'MD3', x: -10, y: -2.2, z: -14, width: 11, height: 3.4, depth: 3, type: 'port' },
    'CURVE_MD3S': { zone: 'S', mZone: 'MID', mSubZone: 'MD3', x: -10, y: -2.2, z: 14, width: 11, height: 3.4, depth: 3, type: 'starboard' },

    'CURVE_MD4P': { zone: 'S', mZone: 'MID', mSubZone: 'MD4', x: 2, y: -2.0, z: -14, width: 11, height: 3.6, depth: 3, type: 'port' },
    'CURVE_MD4S': { zone: 'S', mZone: 'MID', mSubZone: 'MD4', x: 2, y: -2.0, z: 14, width: 11, height: 3.6, depth: 3, type: 'starboard' },

    // ==================== 额外：ENGINE 区 - 机舱龙骨 + 弧度带 ====================
    'K_ER1': { zone: 'B', mZone: 'ENGINE', mSubZone: 'ER1', x: 16, y: -3.4, z: 0, width: 12, height: 2.6, depth: 7, type: 'center' },
    'K_ER2': { zone: 'B', mZone: 'ENGINE', mSubZone: 'ER2', x: 30, y: -3.2, z: 0, width: 12, height: 2.8, depth: 7, type: 'center' },
    'K_ER3': { zone: 'B', mZone: 'ENGINE', mSubZone: 'ER3', x: 44, y: -3.0, z: 0, width: 12, height: 3.0, depth: 7, type: 'center' },

    'CURVE_ER1P': { zone: 'S', mZone: 'ENGINE', mSubZone: 'ER1', x: 16, y: -2.2, z: -12, width: 11, height: 3.2, depth: 3, type: 'port' },
    'CURVE_ER1S': { zone: 'S', mZone: 'ENGINE', mSubZone: 'ER1', x: 16, y: -2.2, z: 12, width: 11, height: 3.2, depth: 3, type: 'starboard' },

    'CURVE_ER2P': { zone: 'S', mZone: 'ENGINE', mSubZone: 'ER2', x: 30, y: -2.0, z: -12, width: 11, height: 3.4, depth: 3, type: 'port' },
    'CURVE_ER2S': { zone: 'S', mZone: 'ENGINE', mSubZone: 'ER2', x: 30, y: -2.0, z: 12, width: 11, height: 3.4, depth: 3, type: 'starboard' },

    'CURVE_ER3P': { zone: 'S', mZone: 'ENGINE', mSubZone: 'ER3', x: 44, y: -1.8, z: -12, width: 11, height: 3.6, depth: 3, type: 'port' },
    'CURVE_ER3S': { zone: 'S', mZone: 'ENGINE', mSubZone: 'ER3', x: 44, y: -1.8, z: 12, width: 11, height: 3.6, depth: 3, type: 'starboard' },

    // ==================== 额外：AFT 区 - 船艉龙骨 + 弧度带 ====================
    'K_AF1': { zone: 'F', mZone: 'AFT', mSubZone: 'AF1', x: 60, y: -2.8, z: 0, width: 10, height: 2.6, depth: 7, type: 'center' },
    'K_AF2': { zone: 'F', mZone: 'AFT', mSubZone: 'AF2', x: 72, y: -2.6, z: 0, width: 10, height: 2.8, depth: 7, type: 'center' },
    'K_AF3': { zone: 'F', mZone: 'AFT', mSubZone: 'AF3', x: 90, y: -2.4, z: 0, width: 10, height: 3.0, depth: 7, type: 'center' },

    'CURVE_AF1P': { zone: 'S', mZone: 'AFT', mSubZone: 'AF1', x: 60, y: -1.8, z: -14, width: 10, height: 3.2, depth: 3, type: 'port' },
    'CURVE_AF1S': { zone: 'S', mZone: 'AFT', mSubZone: 'AF1', x: 60, y: -1.8, z: 14, width: 10, height: 3.2, depth: 3, type: 'starboard' },

    'CURVE_AF2P': { zone: 'S', mZone: 'AFT', mSubZone: 'AF2', x: 72, y: -1.6, z: -14, width: 10, height: 3.4, depth: 3, type: 'port' },
    'CURVE_AF2S': { zone: 'S', mZone: 'AFT', mSubZone: 'AF2', x: 72, y: -1.6, z: 14, width: 10, height: 3.4, depth: 3, type: 'starboard' },

    'CURVE_AF3P': { zone: 'S', mZone: 'AFT', mSubZone: 'AF3', x: 90, y: -1.4, z: -14, width: 10, height: 3.6, depth: 3, type: 'port' },
    'CURVE_AF3S': { zone: 'S', mZone: 'AFT', mSubZone: 'AF3', x: 90, y: -1.4, z: 14, width: 10, height: 3.6, depth: 3, type: 'starboard' }

};