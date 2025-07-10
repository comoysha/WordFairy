// 高亮功能模块

// 当前跳转索引
let currentHighlightIndex = 0;
let allHighlights = [];

// 高亮显示词汇
function highlightWords(categories) {
  // 移除现有高亮
  removeHighlights();
  
  if (!categories || Object.keys(categories).length === 0) {
    return;
  }
  
  // 应用高亮
  applyHighlight(categories);
  
  // 更新高亮元素列表
  updateHighlightsList();
}

// 应用高亮
function applyHighlight(categories) {
  // 使用固定的样式类名数组
  const styleClasses = ['person', 'location', 'time', 'organization'];
  
  let classIndex = 0;
  for (const category in categories) {
    if (categories[category] && Array.isArray(categories[category])) {
      const words = categories[category].map(item => 
        typeof item === 'object' ? item.word : item
      ).filter(word => word && word.trim());
      
      if (words.length > 0) {
        const className = styleClasses[classIndex % styleClasses.length];
        highlightAllWords(words, className);
        classIndex++;
      }
    }
  }
}

// 递归高亮所有匹配的词汇
function highlightAllWords(words, className) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // 跳过已经高亮的元素和侧边栏
        if (node.parentElement.classList.contains('wordFairy-highlight-' + className) || 
            node.parentElement.closest('.wordfairy-sidebar')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  textNodes.forEach(textNode => {
    let text = textNode.textContent;
    let hasMatch = false;
    
    words.forEach(word => {
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(text)) {
        hasMatch = true;
        text = text.replace(regex, `<span class="wordFairy-highlight-${className}">$&</span>`);
      }
    });
    
    if (hasMatch) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = text;
      
      // 替换原文本节点
      const parent = textNode.parentNode;
      while (wrapper.firstChild) {
        parent.insertBefore(wrapper.firstChild, textNode);
      }
      parent.removeChild(textNode);
    }
  });
}

// 更新高亮元素列表
function updateHighlightsList() {
  allHighlights = Array.from(document.querySelectorAll('[class*="wordFairy-highlight-"]'));
  currentHighlightIndex = 0;
}

// 跳转到下一个高亮词汇
function jumpToNextHighlight() {
  if (allHighlights.length === 0) {
    updateHighlightsList();
    if (allHighlights.length === 0) {
      console.log('没有找到高亮词汇');
      return;
    }
  }
  
  // 移除之前的重点高亮
  allHighlights.forEach(el => el.classList.remove('wordFairy-highlight-focus'));
  
  // 跳转到当前索引的高亮词汇
  const currentHighlight = allHighlights[currentHighlightIndex];
  currentHighlight.classList.add('wordFairy-highlight-focus');
  
  // 滚动到视图中
  currentHighlight.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
  
  // 更新索引，循环跳转
  currentHighlightIndex = (currentHighlightIndex + 1) % allHighlights.length;
  
  console.log(`跳转到第 ${currentHighlightIndex === 0 ? allHighlights.length : currentHighlightIndex} 个高亮词汇，共 ${allHighlights.length} 个`);
}

// 移除所有高亮
function removeHighlights() {
  const highlights = document.querySelectorAll('[class*="wordFairy-highlight-"]');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    parent.normalize();
  });
  
  // 清空高亮列表
  allHighlights = [];
  currentHighlightIndex = 0;
}

// 切换高亮显示
function toggleHighlight() {
  const highlights = document.querySelectorAll('[class*="wordFairy-highlight-"]');
  
  if (highlights.length > 0) {
    // 如果有高亮，则移除
    removeHighlights();
    
    // 更新按钮文本
    const toggleBtn = document.querySelector('#toggle-highlight');
    if (toggleBtn) {
      toggleBtn.textContent = '开启高亮';
    }
  } else {
    // 如果没有高亮，则从存储中获取词汇并高亮
    chrome.storage.local.get(['wordCategories'], function(result) {
      if (result.wordCategories) {
        highlightWords(result.wordCategories);
        
        // 更新按钮文本
        const toggleBtn = document.querySelector('#toggle-highlight');
        if (toggleBtn) {
          toggleBtn.textContent = '关闭高亮';
        }
      }
    });
  }
}