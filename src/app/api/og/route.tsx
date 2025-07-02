import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || '深圳教师考编练习系统'
    const description = searchParams.get('description') || 'AI智能刷题平台'
    const type = searchParams.get('type') || 'default'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative',
          }}
        >
          {/* 背景装饰 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            }}
          />
          
          {/* 主要内容 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px',
              textAlign: 'center',
              zIndex: 1,
            }}
          >
            {/* 图标 */}
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '30px',
                backgroundColor: 'rgba(255,255,255,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '40px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  fontSize: '60px',
                  color: '#6366f1',
                }}
              >
                📚
              </div>
            </div>

            {/* 标题 */}
            <h1
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '20px',
                textShadow: '0 4px 8px rgba(0,0,0,0.2)',
                lineHeight: 1.1,
                maxWidth: '900px',
              }}
            >
              {title}
            </h1>

            {/* 描述 */}
            <p
              style={{
                fontSize: '32px',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: '40px',
                maxWidth: '800px',
                lineHeight: 1.3,
              }}
            >
              {description}
            </p>

            {/* 标签 */}
            <div
              style={{
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {['AI智能分析', '历年真题', '错题复习', '模拟考试'].map((tag) => (
                <div
                  key={tag}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '25px',
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: '500',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>

          {/* 底部品牌 */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              right: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '24px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✨
            </div>
            深圳教师考编系统
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
