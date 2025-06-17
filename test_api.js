// 测试API接口的简单脚本
const testAPI = async () => {
  try {
    console.log('测试题目API...');
    
    // 测试获取题目
    const response = await fetch('http://localhost:3000/api/questions');
    const data = await response.json();
    
    console.log('API响应:', data);
    console.log('题目数量:', data.data?.length || 0);
    
    if (data.success && data.data && data.data.length > 0) {
      console.log('✅ API测试成功！');
      console.log('第一道题目:', data.data[0].question);
    } else {
      console.log('❌ API测试失败');
    }
  } catch (error) {
    console.error('❌ API测试出错:', error.message);
  }
};

// 如果在Node.js环境中运行
if (typeof window === 'undefined') {
  testAPI();
}

// 如果在浏览器中运行
if (typeof window !== 'undefined') {
  window.testAPI = testAPI;
  console.log('在浏览器控制台中运行 testAPI() 来测试API');
}
