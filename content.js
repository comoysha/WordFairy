// 创建侧边栏
function createSidebar() {
  const sidebar = document.createElement('div');
  sidebar.className = 'wordfairy-sidebar hidden';
  sidebar.innerHTML = `
    <div class="container">
      <h1>词妆精灵</h1>
      <div class="button-group">
        <button id="extract-words">提取分类词汇</button>
        <button id="toggle-highlight">高亮开/关</button>
      </div>
      <div class="model-section">
        <label for="model-name">模型选择:</label>
        <div class="model-input">
          <input type="text" id="model-name" placeholder="输入模型名称" value="google/gemini-2.0-flash-lite-001">
          <button id="save-model">保存</button>
        </div>
      </div>
      <div class="api-key-section">
        <label for="api-key">OpenRouter API Key:</label>
        <div class="api-key-input">
          <input type="password" id="api-key" placeholder="输入您的API Key">
          <button id="save-api-key">保存</button>
        </div>
        <div id="status-message"></div>
      </div>
      <div class="word-categories" id="word-categories"></div>
    </div>
  `;
  document.body.appendChild(sidebar);
  return sidebar;
}

// 创建一个函数来清理之前的状态
function cleanupPreviousState() {
  // 清除存储的词汇分类数据
  chrome.storage.local.remove(['wordCategories'], function() {
    console.log('已清除之前的词汇分类数据');
  });
  
  // 移除所有高亮
  removeHighlights(document.body);
}

// 在页面加载时清理之前的状态
cleanupPreviousState();

// 创建但不立即显示侧边栏
let sidebar = null;

// 延迟加载侧边栏，只在用户激活扩展时才创建
function initializeSidebar() {
  if (!sidebar) {
    sidebar = createSidebar();
    
    // 加载隔离样式
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('styles/sidebar-isolated.css');
    document.head.appendChild(link);
    
    // 初始化事件监听器
    initializeEventListeners();
  }
  return sidebar;
}

// 初始化事件监听
function initializeEventListeners() {
  const extractWordsBtn = sidebar.querySelector('#extract-words');
  const toggleHighlightBtn = sidebar.querySelector('#toggle-highlight');
  const apiKeyInput = sidebar.querySelector('#api-key');
  const saveApiKeyBtn = sidebar.querySelector('#save-api-key');
  const statusMessage = sidebar.querySelector('#status-message');
  const wordCategoriesContainer = sidebar.querySelector('#word-categories');

  // 从存储中加载模型名称和API密钥
  chrome.storage.local.get(['modelName', 'openRouterApiKey'], function(result) {
    if (result.modelName) {
      document.getElementById('model-name').value = result.modelName;
    }
    if (result.openRouterApiKey) {
      apiKeyInput.value = result.openRouterApiKey;
      statusMessage.textContent = 'API密钥已加载';
      statusMessage.style.color = 'green';
      setTimeout(() => { statusMessage.textContent = ''; }, 2000);
    }
  });

  // 从存储中加载最近一次的分类词汇提取结果
  chrome.storage.local.get(['wordCategories'], function(result) {
    if (result.wordCategories) {
      displayWordCategories(result.wordCategories, wordCategoriesContainer);
    }
  });

  // 保存模型名称
  const modelNameInput = sidebar.querySelector('#model-name');
  const saveModelBtn = sidebar.querySelector('#save-model');

  saveModelBtn.addEventListener('click', function() {
    const modelName = modelNameInput.value.trim();
    if (modelName) {
      chrome.storage.local.set({modelName: modelName}, function() {
        statusMessage.textContent = '模型名称已保存';
        statusMessage.style.color = 'green';
        setTimeout(() => { statusMessage.textContent = ''; }, 2000);
      });
    } else {
      statusMessage.textContent = '请输入有效的模型名称';
      statusMessage.style.color = 'red';
      setTimeout(() => { statusMessage.textContent = ''; }, 2000);
    }
  });

  // 保存API密钥
  saveApiKeyBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({openRouterApiKey: apiKey}, function() {
        statusMessage.textContent = 'API密钥已保存';
        statusMessage.style.color = 'green';
        setTimeout(() => { statusMessage.textContent = ''; }, 2000);
      });
    } else {
      statusMessage.textContent = '请输入有效的API密钥';
      statusMessage.style.color = 'red';
      setTimeout(() => { statusMessage.textContent = ''; }, 2000);
    }
  });

  // 提取分类词汇
  extractWordsBtn.addEventListener('click', function() {
    chrome.storage.local.get(['openRouterApiKey', 'modelName'], function(result) {
      if (!result.openRouterApiKey) {
        statusMessage.textContent = '请先设置API密钥';
        statusMessage.style.color = 'red';
        setTimeout(() => { statusMessage.textContent = ''; }, 2000);
        return;
      }

      const modelName = result.modelName || document.getElementById('model-name').value.trim();
      if (!modelName) {
        statusMessage.textContent = '请先设置模型名称';
        statusMessage.style.color = 'red';
        setTimeout(() => { statusMessage.textContent = ''; }, 2000);
        return;
      }

      // 显示正在提取词汇的状态，不设置自动消失
      statusMessage.textContent = '正在提取词汇...';
      statusMessage.style.color = 'blue';

      extractWords(result.openRouterApiKey, modelName).then(categories => {
        if (categories) {
          displayWordCategories(categories, wordCategoriesContainer);
          statusMessage.textContent = '词汇提取成功';
          statusMessage.style.color = 'green';
        } else {
          statusMessage.textContent = '词汇提取失败';
          statusMessage.style.color = 'red';
        }
      });
    });
  });

  // 切换高亮显示
  toggleHighlightBtn.addEventListener('click', function() {
    toggleHighlight();
  });
}

// 监听扩展图标点击事件
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'toggleSidebar') {
    try {
      // 确保侧边栏已初始化
      sidebar = initializeSidebar();
      sidebar.classList.toggle('hidden');
      document.body.classList.toggle('wordfairy-sidebar-active');
      sendResponse({success: true});
    } catch (error) {
      console.error('Error toggling sidebar:', error);
      sendResponse({success: false, error: error.message});
    }
  }
  return true; // 保持消息通道开放
});

// 显示分类词汇列表
function displayWordCategories(categories, container) {
  container.innerHTML = '';
  
  const categoryNames = {
    person: '人名',
    location: '地名',
    time: '时间',
    organization: '组织机构'
  };

  // 遍历每个类别
  for (const category in categories) {
    if (categories[category] && categories[category].length > 0) {
      // 创建类别容器
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'category';

      // 创建类别标题
      const titleDiv = document.createElement('div');
      titleDiv.className = `category-title ${category}`;
      titleDiv.textContent = `${categoryNames[category]} (${categories[category].length})`;
      categoryDiv.appendChild(titleDiv);

      // 创建词汇列表容器
      const wordsDiv = document.createElement('div');
      wordsDiv.className = 'words-list';

      // 按词频排序并添加词汇
      categories[category].sort((a, b) => b.count - a.count).forEach(item => {
        const wordSpan = document.createElement('span');
        wordSpan.className = `word ${category}`;
        wordSpan.textContent = `${item.word} (${item.count})`;

        // 存储词汇在页面中的位置索引
        wordSpan.dataset.currentIndex = '0';
        
        // 添加点击事件
        wordSpan.addEventListener('click', () => {
          // 复制词汇到剪贴板(只复制词汇本身，不包含计数)
          navigator.clipboard.writeText(item.word).then(() => {
            // 显示复制成功提示
            const toast = document.createElement('div');
            toast.className = 'copy-toast';
            toast.textContent = '复制成功';
            document.body.appendChild(toast);

            // 2秒后移除提示
            setTimeout(() => {
              document.body.removeChild(toast);
            }, 2000);
          });

          // 获取所有匹配的高亮元素
          const highlights = document.querySelectorAll(`.wordFairy-highlight-${category}`);
          const matchedHighlights = Array.from(highlights).filter(el => el.textContent === item.word);

          if (matchedHighlights.length > 0) {
            // 获取当前索引
            let currentIndex = parseInt(wordSpan.dataset.currentIndex);
            // 更新索引，实现循环
            currentIndex = (currentIndex + 1) % matchedHighlights.length;
            wordSpan.dataset.currentIndex = currentIndex.toString();

            // 重置所有高亮元素的样式
            const allHighlights = document.querySelectorAll(
              '.wordFairy-highlight-person, .wordFairy-highlight-location, .wordFairy-highlight-time, .wordFairy-highlight-organization'
            );
            allHighlights.forEach(el => {
              el.classList.add('wordFairy-highlight-dimmed');
              el.classList.remove('wordFairy-highlight-focused');
            });

            // 设置当前点击词汇的高亮样式
            matchedHighlights[currentIndex].classList.remove('wordFairy-highlight-dimmed');
            matchedHighlights[currentIndex].classList.add('wordFairy-highlight-focused');

            // 滚动到目标位置
            matchedHighlights[currentIndex].scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        });

        wordsDiv.appendChild(wordSpan);
      });

      categoryDiv.appendChild(wordsDiv);
      container.appendChild(categoryDiv);
    }
  }
}

// 初始化侧边栏事件监听
initializeEventListeners();

// 提取分类词汇
async function extractWords(apiKey, modelName) {
  // 获取页面内容
  const articleContent = document.body.innerText;
  
  // 准备请求数据
  const prompt = `请从以下文本中提取所有的人名、地名、时间和组织名，并按这些类别进行分类。返回一个JSON格式的对象，键为"person"、"location"、"time"、"organization"，值为对应类别的词汇数组。只返回JSON对象，不要有其他文字。\n\n文本内容：${articleContent}`;
  
  try {
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
          const regex = new RegExp(item.word, 'gi');
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
    statusMessage.textContent = `提取词汇失败: ${error.message}`;
    statusMessage.style.color = 'red';
    return null;
  }
}

// 高亮显示词汇
function highlightWords(categories) {
  console.log('highlightWords函数被调用，参数:', categories);
  // 如果没有提供分类，从存储中获取
  if (!categories) {
    console.log('未提供分类参数，从存储中获取...');
    try {
      chrome.storage.local.get(['wordCategories'], function(result) {
        try {
          if (result.wordCategories) {
            console.log('从存储中获取到分类词汇:', result.wordCategories);
            applyHighlight(result.wordCategories);
          } else {
            console.warn('存储中没有分类词汇');
            alert('没有可用的分类词汇，请先提取词汇');
          }
        } catch (error) {
          console.error('处理存储中的分类词汇时出错:', error);
          alert('处理分类词汇时出错，请查看控制台获取详细信息');
        }
      });
    } catch (error) {
      console.error('从存储中获取分类词汇时出错:', error);
      alert('获取分类词汇时出错，请查看控制台获取详细信息');
    }
  } else {
    console.log('直接使用提供的分类参数:', categories);
    try {
      applyHighlight(categories);
    } catch (error) {
      console.error('应用高亮时出错:', error);
      alert('应用高亮时出错，请查看控制台获取详细信息');
    }
  }
}

// 应用高亮
function applyHighlight(categories) {
  console.log('开始应用高亮，分类数据:', categories);
  
  // 移除现有的高亮
  removeHighlights(document.body);
  console.log('已移除现有高亮');
  
  // 为每个类别分别应用高亮
  Object.entries(categories).forEach(([category, words]) => {
    if (words && words.length > 0) {
      console.log(`开始处理分类 ${category}，包含 ${words.length} 个词汇`);
      
      // 过滤并整理词汇
      const filteredWords = words
        .filter(item => item && (typeof item === 'string' ? item.trim() : item.word && item.word.trim()))
        .map(item => typeof item === 'string' ? item.trim() : item.word.trim());
      
      if (filteredWords.length > 0) {
        // 根据类别选择高亮样式
        const className = `wordFairy-highlight-${category}`;
        
        // 处理该类别的所有词汇
        highlightAllWords(document.body, filteredWords, className);
        console.log(`分类 ${category} 的高亮应用完成`);
      }
    }
  });
}

// 移除所有高亮
function removeHighlights(container) {
  // 查找所有高亮元素
  const highlights = container.querySelectorAll(
    '.wordFairy-highlight-person, .wordFairy-highlight-location, .wordFairy-highlight-time, .wordFairy-highlight-organization'
  );
  
  // 遍历并移除高亮
  highlights.forEach(highlight => {
    // 获取高亮元素的文本内容
    const text = highlight.textContent;
    // 创建文本节点替换高亮元素
    const textNode = document.createTextNode(text);
    // 用文本节点替换高亮元素
    highlight.parentNode.replaceChild(textNode, highlight);
  });
}

// 高亮所有词汇
function highlightAllWords(container, words, className) {
  console.log(`开始高亮 ${words.length} 个词汇，类别: ${className}`);
  
  // 递归处理所有文本节点
  function processNode(node) {
    // 如果是文本节点
    if (node.nodeType === Node.TEXT_NODE) {
      let text = node.nodeValue;
      let parent = node.parentNode;
      
      // 跳过已经高亮的节点
      if (parent.classList && 
          (parent.classList.contains('wordFairy-highlight-person') ||
           parent.classList.contains('wordFairy-highlight-location') ||
           parent.classList.contains('wordFairy-highlight-time') ||
           parent.classList.contains('wordFairy-highlight-organization'))) {
        return;
      }
      
      // 跳过侧边栏内的节点
      let isInsideSidebar = false;
      let currentNode = parent;
      while (currentNode) {
        if (currentNode.classList && currentNode.classList.contains('wordfairy-sidebar')) {
          isInsideSidebar = true;
          break;
        }
        currentNode = currentNode.parentNode;
      }
      
      if (isInsideSidebar) {
        return; // 跳过侧边栏内的节点
      }
      
      // 对每个词汇进行处理
      for (const word of words) {
        if (!word || word.length < 2) continue; // 跳过空词或过短的词
        
        // 创建不区分大小写的正则表达式
        const regex = new RegExp(word, 'gi');
        let match;
        
        // 查找所有匹配
        if (match = regex.exec(text)) {
          console.log(`在文本中找到词汇 "${word}"`);
          
          // 分割文本节点
          const beforeText = text.substring(0, match.index);
          const matchText = text.substring(match.index, match.index + word.length);
          const afterText = text.substring(match.index + word.length);
          
          // 创建前部分文本节点
          if (beforeText) {
            parent.insertBefore(document.createTextNode(beforeText), node);
          }
          
          // 创建高亮元素
          const highlightEl = document.createElement('span');
          highlightEl.className = className;
          highlightEl.textContent = matchText;
          parent.insertBefore(highlightEl, node);
          
          // 创建后部分文本节点
          if (afterText) {
            const afterNode = document.createTextNode(afterText);
            parent.insertBefore(afterNode, node);
            // 继续处理剩余文本
            processNode(afterNode);
          }
          
          // 移除原始节点
          parent.removeChild(node);
          return; // 处理完一个词后退出，避免处理同一节点多次
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // 如果是元素节点，递归处理其子节点
      // 创建一个副本以避免在迭代过程中修改集合
      const childNodes = Array.from(node.childNodes);
      childNodes.forEach(child => processNode(child));
    }
  }
  
  // 开始处理容器内的所有节点
  const childNodes = Array.from(container.childNodes);
  childNodes.forEach(node => processNode(node));
  
  console.log(`完成高亮处理，类别: ${className}`);
}

// 切换高亮显示
function toggleHighlight() {
  console.log('切换高亮状态');
  
  // 检查是否已有高亮
  const hasHighlights = document.body.querySelectorAll('.wordFairy-highlight-person, .wordFairy-highlight-location, .wordFairy-highlight-time, .wordFairy-highlight-organization').length > 0;
  console.log('当前是否有高亮:', hasHighlights ? '是' : '否');
  
  if (hasHighlights) {
    // 如果已有高亮，则移除
    try {
      console.log('开始移除所有高亮');
      removeHighlights(document.body);
      console.log('高亮已移除');
      return {success: true, message: '高亮已关闭'};
    } catch (error) {
      console.error('移除高亮时出错:', error);
      return {success: false, message: '移除高亮时出错'};
    }
  } else {
    // 如果没有高亮，则应用高亮
    try {
      console.log('开始重新应用高亮');
      // 从存储中获取分类词汇
      chrome.storage.local.get(['wordCategories'], function(result) {
        if (result.wordCategories) {
          console.log('从存储中获取到分类词汇:', result.wordCategories);
          applyHighlight(result.wordCategories);
        } else {
          console.warn('存储中没有分类词汇');
          alert('没有可用的分类词汇，请先提取词汇');
        }
      });
      return {success: true, message: '正在应用高亮'};
    } catch (error) {
      console.error('应用高亮时出错:', error);
      return {success: false, message: '应用高亮时出错'};
    }
  }
}