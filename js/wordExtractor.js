// 词汇提取和AI接口模块

// 提取分类词汇 - 修改为使用自定义分类
async function extractWords(apiKey, modelName) {
  const articleContent = document.body.innerText;
  
  try {
    // 获取分类模式和自定义分类配置
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['customCategories', 'categoryMode'], resolve);
    });
    
    const categoryMode = result.categoryMode || 'default';
    let categoriesToUse;
    
    if (categoryMode === 'custom') {
      categoriesToUse = result.customCategories || defaultCategories;
    } else {
      categoriesToUse = defaultCategories;
    }
    
    // 生成prompt
    let categoriesDescription = categoriesToUse.map(cat => 
      `- ${cat.name}: ${cat.description}`
    ).join('\n');
    
    const prompt = `请从以下文本中提取词汇并按指定类别进行分类。返回一个JSON格式的对象，键名由你根据分类内容自动生成（使用英文），值为对应类别的词汇数组。只返回JSON对象，不要有其他文字。\n\n分类要求：\n${categoriesDescription}\n\n文本内容：${articleContent}`;
    
    // 调用OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/wordfairy-chrome-extension',
        'X-Title': 'WordFairy Chrome Extension'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || '请求失败');
    }
    
    // 解析API返回的结果
    const content = data.choices[0].message.content;
    let categories;
    
    try {
      // 尝试解析JSON
      categories = JSON.parse(content);
    } catch (e) {
      // 如果不是纯JSON，尝试从文本中提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        categories = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析API返回的结果');
      }
    }
    
    // 统计每个词汇在文本中出现的次数
    const categoriesWithCount = {};
    
    for (const category in categories) {
      if (categories[category] && Array.isArray(categories[category])) {
        // 创建词汇计数映射
        const wordCountMap = {};
        
        // 对每个词汇进行计数
        categories[category].forEach(word => {
          if (word && word.trim()) {
            const trimmedWord = word.trim();
            // 如果词汇已存在，增加计数
            if (wordCountMap[trimmedWord]) {
              wordCountMap[trimmedWord].count++;
            } else {
              // 否则添加新词汇
              wordCountMap[trimmedWord] = { word: trimmedWord, count: 1 };
            }
          }
        });
        
        // 计算每个词汇在文本中的实际出现次数
        Object.values(wordCountMap).forEach(item => {
          const regex = new RegExp(item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          const matches = articleContent.match(regex);
          if (matches) {
            item.count = matches.length;
          }
        });
        
        // 转换为带计数的词汇数组
        categoriesWithCount[category] = Object.values(wordCountMap)
          .map(item => ({ word: item.word, count: item.count }))
          .sort((a, b) => b.count - a.count); // 按出现次数降序排序
      } else {
        categoriesWithCount[category] = [];
      }
    }
    
    // 保存分类词汇到存储中
    chrome.storage.local.set({wordCategories: categoriesWithCount});
    
    // 高亮显示词汇
    highlightWords(categoriesWithCount);
    
    return categoriesWithCount;
  } catch (error) {
    console.error('提取词汇失败:', error);
    const statusMessage = document.querySelector('#status-message');
    if (statusMessage) {
      statusMessage.textContent = `提取词汇失败: ${error.message}`;
      statusMessage.style.color = 'red';
    }
    return null;
  }
}