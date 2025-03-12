document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const readerModeBtn = document.getElementById('reader-mode');
  const extractWordsBtn = document.getElementById('extract-words');
  const toggleHighlightBtn = document.getElementById('toggle-highlight');
  const apiKeyInput = document.getElementById('api-key');
  const saveApiKeyBtn = document.getElementById('save-api-key');
  const statusMessage = document.getElementById('status-message');
  const wordCategoriesContainer = document.getElementById('word-categories');
  
  // 从存储中加载API密钥
  chrome.storage.local.get(['openRouterApiKey'], function(result) {
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
      displayWordCategories(result.wordCategories);
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
  
  // 开启阅读器模式
  readerModeBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleReaderMode'}, function(response) {
        console.log(response);
      });
    });
  });
  
  // 提取分类词汇
  extractWordsBtn.addEventListener('click', function() {
    chrome.storage.local.get(['openRouterApiKey'], function(result) {
      if (!result.openRouterApiKey) {
        statusMessage.textContent = '请先设置API密钥';
        statusMessage.style.color = 'red';
        setTimeout(() => { statusMessage.textContent = ''; }, 2000);
        return;
      }
      
      statusMessage.textContent = '正在提取词汇...';
      statusMessage.style.color = 'blue';
      
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'extractWords', apiKey: result.openRouterApiKey}, function(response) {
          if (response) {
            // 显示提取的词汇
            displayWordCategories(response);
            statusMessage.textContent = '词汇提取成功';
            statusMessage.style.color = 'green';
            setTimeout(() => { statusMessage.textContent = ''; }, 2000);
          } else {
            statusMessage.textContent = '词汇提取失败';
            statusMessage.style.color = 'red';
            setTimeout(() => { statusMessage.textContent = ''; }, 2000);
          }
        });
      });
    });
  });
  
  // 切换高亮显示
  toggleHighlightBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleHighlight'}, function(response) {
        console.log(response);
      });
    });
  });
  
  // 显示词汇分类
  function displayWordCategories(categories) {
    wordCategoriesContainer.innerHTML = '';
    
    if (!categories || Object.keys(categories).length === 0) {
      const noWordsMsg = document.createElement('p');
      noWordsMsg.textContent = '未找到分类词汇';
      wordCategoriesContainer.appendChild(noWordsMsg);
      return;
    }
    
    // 添加标题，显示这是最近一次的提取结果
    const resultTitle = document.createElement('h3');
    resultTitle.textContent = '最近一次提取结果';
    resultTitle.style.borderBottom = '1px solid #ddd';
    resultTitle.style.paddingBottom = '5px';
    resultTitle.style.marginTop = '0';
    wordCategoriesContainer.appendChild(resultTitle);
    
    for (const category in categories) {
      if (categories[category].length > 0) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';
        
        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = getCategoryDisplayName(category);
        categoryTitle.className = `category-title ${category}`;
        categoryDiv.appendChild(categoryTitle);
        
        const wordsList = document.createElement('div');
        wordsList.className = 'words-list';
        
        categories[category].forEach(item => {
          // 检查是否是新格式（带计数的对象）或旧格式（纯字符串）
          const wordText = typeof item === 'object' ? item.word : item;
          const wordCount = typeof item === 'object' && item.count ? item.count : null;
          
          const wordSpan = document.createElement('span');
          wordSpan.className = `word ${category}`;
          
          // 如果有计数，显示为"词汇(次数)"
          wordSpan.textContent = wordCount ? `${wordText}(${wordCount})` : wordText;
          
          // 添加点击事件，点击后复制到剪贴板（只复制词汇本身，不包括计数）
          wordSpan.addEventListener('click', function() {
            navigator.clipboard.writeText(wordText).then(() => {
              // 创建临时提示元素
              const tooltip = document.createElement('div');
              tooltip.className = 'copy-tooltip';
              tooltip.textContent = '已复制';
              document.body.appendChild(tooltip);
              
              // 2秒后移除提示
              setTimeout(() => {
                document.body.removeChild(tooltip);
              }, 2000);
            }).catch(err => {
              console.error('复制失败:', err);
            });
          });
          wordsList.appendChild(wordSpan);
        });
        
        categoryDiv.appendChild(wordsList);
        wordCategoriesContainer.appendChild(categoryDiv);
      }
    }
  }
  
  // 获取分类的显示名称
  function getCategoryDisplayName(category) {
    const displayNames = {
      'person': '人名',
      'location': '地名',
      'time': '时间',
      'organization': '组织名'
    };
    return displayNames[category] || category;
  }
});

// 这些函数已移动到content.js中，通过消息传递机制调用