// 事件监听器模块

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
      const modelNameInput = document.getElementById('model-name');
      if (modelNameInput) {
        modelNameInput.value = result.modelName;
      }
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

  // 自定义分类按钮事件
  const customCategoriesBtn = sidebar.querySelector('#custom-categories-btn');
  const customCategoriesModal = sidebar.querySelector('#custom-categories-modal');
  const closeModalBtn = sidebar.querySelector('#close-modal');
  const addCategoryBtn = sidebar.querySelector('#add-category-btn');
  const saveCategoriesBtn = sidebar.querySelector('#save-categories');
  const cancelCategoriesBtn = sidebar.querySelector('#cancel-categories');
  
  // 检查元素是否存在
  if (!customCategoriesBtn || !customCategoriesModal) {
    console.error('自定义分类相关元素未找到');
    return;
  }

  // 打开自定义分类弹框
  customCategoriesBtn.addEventListener('click', function() {
    console.log('自定义分类按钮被点击');
    loadCustomCategories();
    customCategoriesModal.classList.remove('hidden');
    updatePromptPreview();
  });

  // 关闭弹框
  closeModalBtn.addEventListener('click', function() {
    customCategoriesModal.classList.add('hidden');
  });

  cancelCategoriesBtn.addEventListener('click', function() {
    customCategoriesModal.classList.add('hidden');
  });

  // 添加新分类
  addCategoryBtn.addEventListener('click', function() {
    addCategoryRow();
    updatePromptPreview();
  });

  // 保存分类
  saveCategoriesBtn.addEventListener('click', function() {
    saveCustomCategories();
    customCategoriesModal.classList.add('hidden');
  });

  // 模式切换事件
  const categoryModeRadios = sidebar.querySelectorAll('input[name="categoryMode"]');
  categoryModeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      const isCustomMode = this.value === 'custom';
      const addCategoryBtn = sidebar.querySelector('#add-category-btn');
      const categoriesList = sidebar.querySelector('#categories-list');
      
      // 启用/禁用添加按钮和分类列表
      addCategoryBtn.disabled = !isCustomMode;
      
      if (isCustomMode) {
        categoriesList.style.opacity = '1';
        categoriesList.style.pointerEvents = 'auto';
        loadCustomCategories();
      } else {
        categoriesList.style.opacity = '0.5';
        categoriesList.style.pointerEvents = 'none';
        // 显示默认分类（只读）
        renderCategoriesList(defaultCategories, true);
      }
      updatePromptPreview();
    });
  });
}