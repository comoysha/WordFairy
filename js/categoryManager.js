// 自定义分类管理模块

// 默认分类配置
const defaultCategories = [
  { name: '人名', description: '人物姓名、称谓' },
  { name: '地名', description: '地理位置、地点名称' },
  { name: '时间', description: '时间表达、日期' },
  { name: '组织', description: '机构、公司、组织名称' }
];

// 从存储加载自定义分类
function loadCustomCategories() {
  chrome.storage.local.get(['customCategories', 'categoryMode'], function(result) {
    const categoryMode = result.categoryMode || 'default';
    const isCustomMode = categoryMode === 'custom';
    
    // 设置模式单选按钮
    const defaultModeRadio = document.querySelector('input[name="categoryMode"][value="default"]');
    const customModeRadio = document.querySelector('input[name="categoryMode"][value="custom"]');
    
    if (isCustomMode) {
      customModeRadio.checked = true;
    } else {
      defaultModeRadio.checked = true;
    }
    
    // 根据模式渲染分类列表
    if (isCustomMode) {
      const categories = result.customCategories || defaultCategories;
      renderCategoriesList(categories, false);
      
      // 启用添加按钮和分类列表
      const addCategoryBtn = document.querySelector('#add-category-btn');
      const categoriesList = document.querySelector('#categories-list');
      addCategoryBtn.disabled = false;
      categoriesList.style.opacity = '1';
      categoriesList.style.pointerEvents = 'auto';
    } else {
      renderCategoriesList(defaultCategories, true);
      
      // 禁用添加按钮和分类列表
      const addCategoryBtn = document.querySelector('#add-category-btn');
      const categoriesList = document.querySelector('#categories-list');
      addCategoryBtn.disabled = true;
      categoriesList.style.opacity = '0.5';
      categoriesList.style.pointerEvents = 'none';
    }
  });
}

// 渲染分类列表
function renderCategoriesList(categories, readonly = false) {
  const categoriesList = document.querySelector('#categories-list');
  categoriesList.innerHTML = '';
  
  categories.forEach((category, index) => {
    const row = createCategoryRow(category, index, readonly);
    categoriesList.appendChild(row);
  });
  
  // 更新添加按钮状态
  const addCategoryBtn = document.querySelector('#add-category-btn');
  if (addCategoryBtn && !readonly) {
    addCategoryBtn.disabled = categories.length >= 4;
  }
}

// 创建分类行
function createCategoryRow(category, index, readonly = false) {
  const row = document.createElement('div');
  row.className = 'category-row';
  row.dataset.index = index;
  
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'category-name';
  nameInput.value = category.name;
  nameInput.placeholder = '分类名称';
  nameInput.readOnly = readonly;
  
  const descInput = document.createElement('input');
  descInput.type = 'text';
  descInput.className = 'category-description';
  descInput.value = category.description;
  descInput.placeholder = '分类描述';
  descInput.readOnly = readonly;
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-category-btn';
  deleteBtn.textContent = '删除';
  deleteBtn.disabled = readonly;
  
  if (!readonly) {
    // 添加输入事件监听
    nameInput.addEventListener('input', updatePromptPreview);
    descInput.addEventListener('input', updatePromptPreview);
    
    // 添加删除事件监听
    deleteBtn.addEventListener('click', function() {
      deleteCategoryRow(row);
    });
  }
  
  row.appendChild(nameInput);
  row.appendChild(descInput);
  row.appendChild(deleteBtn);
  
  return row;
}

// 添加新分类行
function addCategoryRow() {
  const categoriesList = document.querySelector('#categories-list');
  const currentRows = categoriesList.querySelectorAll('.category-row');
  
  // 限制最多4个分类
  if (currentRows.length >= 4) {
    return;
  }
  
  const newCategory = { name: '', description: '' };
  const newRow = createCategoryRow(newCategory, currentRows.length, false);
  categoriesList.appendChild(newRow);
  
  // 更新行索引
  updateRowIndices();
  
  // 更新添加按钮状态
  const addCategoryBtn = document.querySelector('#add-category-btn');
  addCategoryBtn.disabled = categoriesList.querySelectorAll('.category-row').length >= 4;
  
  // 聚焦到新添加的名称输入框
  const nameInput = newRow.querySelector('.category-name');
  nameInput.focus();
}

// 删除分类行
function deleteCategoryRow(row) {
  const categoriesList = document.querySelector('#categories-list');
  const currentRows = categoriesList.querySelectorAll('.category-row');
  
  // 至少保留一个分类
  if (currentRows.length <= 1) {
    return;
  }
  
  row.remove();
  updateRowIndices();
  updatePromptPreview();
  
  // 更新添加按钮状态
  const addCategoryBtn = document.querySelector('#add-category-btn');
  addCategoryBtn.disabled = false;
}

// 更新行索引
function updateRowIndices() {
  const rows = document.querySelectorAll('.category-row');
  rows.forEach((row, index) => {
    row.dataset.index = index;
  });
}

// 获取当前分类配置
function getCurrentCategories() {
  const categoryMode = document.querySelector('input[name="categoryMode"]:checked').value;
  
  if (categoryMode === 'default') {
    return defaultCategories;
  }
  
  const rows = document.querySelectorAll('.category-row');
  const categories = [];
  
  rows.forEach(row => {
    const name = row.querySelector('.category-name').value.trim();
    const description = row.querySelector('.category-description').value.trim();
    
    if (name && description) {
      categories.push({ name, description });
    }
  });
  
  return categories.length > 0 ? categories : defaultCategories;
}

// 生成AI提示词
function generatePrompt(categories) {
  const categoriesDescription = categories.map(cat => 
    `- ${cat.name}: ${cat.description}`
  ).join('\n');
  
  return `请从以下文本中提取词汇并按指定类别进行分类。返回一个JSON格式的对象，键名由你根据分类内容自动生成（使用英文），值为对应类别的词汇数组。只返回JSON对象，不要有其他文字。\n\n分类要求：\n${categoriesDescription}\n\n文本内容：[页面文本内容]`;
}

// 更新提示词预览
function updatePromptPreview() {
  const categories = getCurrentCategories();
  const prompt = generatePrompt(categories);
  
  const promptPreview = document.querySelector('#prompt-preview');
  if (promptPreview) {
    promptPreview.textContent = prompt;
  }
}

// 保存自定义分类
function saveCustomCategories() {
  const categoryMode = document.querySelector('input[name="categoryMode"]:checked').value;
  const categories = getCurrentCategories();
  
  // 验证自定义分类数量
  if (categoryMode === 'custom' && categories.length > 4) {
    alert('自定义分类最多只能有4个');
    return;
  }
  
  // 验证分类内容
  if (categoryMode === 'custom') {
    for (const category of categories) {
      if (!category.name.trim() || !category.description.trim()) {
        alert('请填写完整的分类名称和描述');
        return;
      }
    }
  }
  
  // 保存到存储
  chrome.storage.local.set({
    customCategories: categories,
    categoryMode: categoryMode
  }, function() {
    const statusMessage = document.querySelector('#status-message');
    if (statusMessage) {
      statusMessage.textContent = '分类配置已保存';
      statusMessage.style.color = 'green';
      setTimeout(() => { statusMessage.textContent = ''; }, 2000);
    }
  });
}