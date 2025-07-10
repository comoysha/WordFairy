// WordFairy Chrome Extension Content Script
// 引入模块化文件
// 注意：这些文件需要在manifest.json中按正确顺序加载

// 注意：createSidebar 函数已在 js/sidebar.js 中定义

// 注意：cleanupPreviousState 函数已在 js/sidebar.js 中定义
// 在页面加载时清理之前的状态
cleanupPreviousState();

// 注意：sidebar 变量、initializeSidebar 函数已在 js/sidebar.js 中定义
// 注意：initializeEventListeners 函数已在 js/eventListeners.js 中定义
// 注意：displayWordCategories 函数已在 js/sidebar.js 中定义

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
    return true; // 表示将异步发送响应
  }
  // 对于其他消息类型，不发送响应
  return false;
});

// 默认分类配置已移至 categoryManager.js