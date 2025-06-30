const fs = require('fs')
const path = require('path')

// 创建基本的SVG图标内容
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="url(#gradient)"/>
  <g transform="translate(${size*0.25}, ${size*0.25})">
    <rect x="${size*0.08}" y="${size*0.12}" width="${size*0.39}" height="${size*0.31}" rx="${size*0.016}" fill="#ffffff" opacity="0.95"/>
    <rect x="${size*0.098}" y="${size*0.137}" width="${size*0.35}" height="${size*0.27}" rx="${size*0.008}" fill="#f8fafc"/>
    <line x1="${size*0.137}" y1="${size*0.195}" x2="${size*0.41}" y2="${size*0.195}" stroke="#64748b" stroke-width="${size*0.004}" opacity="0.6"/>
    <line x1="${size*0.137}" y1="${size*0.234}" x2="${size*0.371}" y2="${size*0.234}" stroke="#64748b" stroke-width="${size*0.004}" opacity="0.6"/>
    <line x1="${size*0.137}" y1="${size*0.273}" x2="${size*0.391}" y2="${size*0.273}" stroke="#64748b" stroke-width="${size*0.004}" opacity="0.6"/>
    <circle cx="${size*0.141}" cy="${size*0.141}" r="${size*0.023}" fill="#10b981" opacity="0.9"/>
    <path d="M${size*0.129} ${size*0.141}l${size*0.012} ${size*0.012} ${size*0.023}-${size*0.023}" stroke="#ffffff" stroke-width="${size*0.004}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
    </linearGradient>
  </defs>
</svg>
`.trim()

// 需要创建的图标尺寸
const iconSizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512]

// 确保icons目录存在
const iconsDir = path.join(__dirname, '../public/icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

console.log('🎨 开始创建PWA图标...')

// 创建SVG图标
iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size)
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`)
  fs.writeFileSync(svgPath, svgContent)
  console.log(`✅ 创建 icon-${size}x${size}.svg`)
})

// 创建主SVG图标
const mainSvgContent = createSVGIcon(512)
const mainSvgPath = path.join(iconsDir, 'icon.svg')
fs.writeFileSync(mainSvgPath, mainSvgContent)
console.log('✅ 创建 icon.svg')

console.log(`
🎉 PWA图标创建完成！

📁 图标位置: public/icons/
📋 创建的文件:
${iconSizes.map(size => `   - icon-${size}x${size}.svg`).join('\n')}
   - icon.svg

⚠️  注意: 这些是SVG格式的图标。如果需要PNG格式，请：
1. 打开 scripts/generate-pwa-icons.html 文件
2. 在浏览器中打开该文件
3. 点击"生成所有图标"按钮
4. 下载生成的PNG图标到 public/icons/ 目录

🚀 PWA配置已完成，现在可以：
1. 运行 npm run build 构建应用
2. 运行 npm run start 启动生产服务器
3. 在支持PWA的浏览器中访问应用
4. 查看安装提示并测试PWA功能
`)
