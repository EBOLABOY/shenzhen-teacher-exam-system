#!/usr/bin/env node
/**
 * 测试AI API连接
 */

const AI_CONFIG = {
  baseURL: 'http://154.19.184.12:3000/v1',
  apiKey: 'sk-jb6FLf9xavIBMma8Q3u90BrSpX3uT4bfCOSGAD9g0UK4JQJ4',
  model: 'gemini-2.5-flash-preview-05-20',
  maxTokens: 1000,
  temperature: 0.7,
  timeout: 120000
};

async function testAIAPI() {
  console.log('🧪 测试AI API连接...\n');

  try {
    console.log('1. 测试API基本连接...');
    console.log('API地址:', AI_CONFIG.baseURL);
    console.log('模型:', AI_CONFIG.model);

    const requestBody = {
      model: AI_CONFIG.model,
      messages: [
        { role: 'system', content: '你是一个有用的助手。' },
        { role: 'user', content: '请简单回答：你好，这是一个测试。' }
      ],
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature
    };

    console.log('\n2. 发送测试请求...');
    console.log('请求体大小:', JSON.stringify(requestBody).length, '字符');

    const response = await fetch(AI_CONFIG.baseURL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('\n3. 检查响应...');
    console.log('状态码:', response.status);
    console.log('状态文本:', response.statusText);
    console.log('Content-Type:', response.headers.get('content-type'));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API请求失败');
      console.error('错误响应:', errorText);
      return;
    }

    const data = await response.json();
    console.log('\n4. 解析响应数据...');
    console.log('响应结构:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasMessage: !!data.choices?.[0]?.message,
      hasContent: !!data.choices?.[0]?.message?.content,
      contentLength: data.choices?.[0]?.message?.content?.length
    });

    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      console.log('\n✅ API测试成功！');
      console.log('AI响应:', data.choices[0].message.content);
    } else {
      console.log('\n❌ API响应格式异常');
      console.log('完整响应:', JSON.stringify(data, null, 2));
    }

    // 检查是否有其他有用信息
    if (data.usage) {
      console.log('\n📊 使用统计:');
      console.log('- 提示词tokens:', data.usage.prompt_tokens);
      console.log('- 完成tokens:', data.usage.completion_tokens);
      console.log('- 总tokens:', data.usage.total_tokens);
    }

    if (data.model) {
      console.log('\n🤖 实际使用模型:', data.model);
    }

  } catch (error) {
    console.error('\n❌ 测试过程中出错:', error.message);
    if (error.code) {
      console.error('错误代码:', error.code);
    }
    if (error.cause) {
      console.error('错误原因:', error.cause);
    }
  }
}

// 运行测试
testAIAPI().then(() => {
  console.log('\n🎉 测试完成!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 测试失败:', error);
  process.exit(1);
});
