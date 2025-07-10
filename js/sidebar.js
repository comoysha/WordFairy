// 侧边栏UI创建和初始化模块

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
      <div class="custom-categories-section">
        <button id="custom-categories-btn">自定义提取分类</button>
      </div>
      <div class="word-categories" id="word-categories"></div>
    </div>
    
    <!-- 自定义分类弹框 -->
    <div id="custom-categories-modal" class="custom-categories-modal hidden">
      <div class="modal-content">
        <div class="modal-header">
          <h3>自定义提取分类</h3>
          <button id="close-modal" class="close-btn">×</button>
        </div>
        
        <!-- 模式选择 -->
        <div class="category-mode-selection">
          <label class="mode-option">
            <input type="radio" name="categoryMode" value="default" checked>
            <span>使用默认分类</span>
          </label>
          <label class="mode-option">
            <input type="radio" name="categoryMode" value="custom">
            <span>使用自定义分类</span>
          </label>
        </div>
        
        <div class="modal-body">
          <div id="categories-list"></div>
          <button id="add-category-btn" class="add-btn" disabled>添加分类</button>
          <div class="category-limit-note">最多支持4个自定义分类</div>
        </div>
        
        <div class="modal-footer">
          <button id="save-categories" class="save-btn">保存</button>
          <button id="cancel-categories" class="cancel-btn">取消</button>
        </div>
        
        <div class="prompt-section">
          <h4>AI提示词预览：</h4>
          <textarea id="prompt-preview" readonly></textarea>
        </div>
      </div>
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
  if (typeof removeHighlights === 'function') {
    removeHighlights(document.body);
  }
}

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
    if (typeof initializeEventListeners === 'function') {
      initializeEventListeners();
    }
  }
  return sidebar;
}

// 显示分类词汇列表 - 修改为支持自定义分类
function displayWordCategories(categories, container) {
  container.innerHTML = '';
  
  // 获取自定义分类配置来显示中文名称
  chrome.storage.local.get(['customCategories'], function(result) {
    const customCategories = result.customCategories || defaultCategories;
    
    // 创建分类名称映射
    const categoryNames = {};
    customCategories.forEach(cat => {
      // 尝试匹配AI返回的键名与自定义分类
      Object.keys(categories).forEach(key => {
        if (key.toLowerCase().includes(cat.name.toLowerCase()) || 
            cat.name.toLowerCase().includes(key.toLowerCase())) {
          categoryNames[key] = cat.name;
        }
      });
    });
    
    // 如果没有匹配到，使用键名本身
    Object.keys(categories).forEach(key => {
      if (!categoryNames[key]) {
        categoryNames[key] = key;
      }
    });

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
                if (document.body.contains(toast)) {
                  document.body.removeChild(toast);
                }
              }, 2000);
            });

            // 获取分类对应的CSS类名
            const styleClasses = ['person', 'location', 'time', 'organization'];
            const categoryIndex = Object.keys(categories).indexOf(category);
            const cssClassName = styleClasses[categoryIndex % styleClasses.length];
            
            // 获取所有匹配的高亮元素
            const highlights = document.querySelectorAll(`.wordFairy-highlight-${cssClassName}`);
            const matchedHighlights = Array.from(highlights).filter(el => el.textContent === item.word);

            if (matchedHighlights.length > 0) {
              // 获取当前索引
              let currentIndex = parseInt(wordSpan.dataset.currentIndex);
              // 更新索引，实现循环
              currentIndex = (currentIndex + 1) % matchedHighlights.length;
              wordSpan.dataset.currentIndex = currentIndex.toString();

              // 重置所有高亮元素的样式
              const allHighlights = document.querySelectorAll(
                '[class*="wordFairy-highlight-"]'
              );
              allHighlights.forEach(el => {
                el.classList.remove('wordFairy-highlight-focus');
              });

              // 设置当前点击词汇的高亮样式
              matchedHighlights[currentIndex].classList.add('wordFairy-highlight-focus');

              // 滚动到目标位置
              matchedHighlights[currentIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
              
              console.log(`跳转到"${item.word}"的第 ${currentIndex + 1} 个位置，共 ${matchedHighlights.length} 个`);
            } else {
              console.log(`未找到"${item.word}"的高亮元素`);
            }
          });

          wordsDiv.appendChild(wordSpan);
        });

        categoryDiv.appendChild(wordsDiv);
        container.appendChild(categoryDiv);
      }
    }
  });
}

// 注意：事件监听器已在 content.js 中定义
// 注意：cleanupPreviousState 调用已在 content.js 中处理