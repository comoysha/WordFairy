// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 向当前标签页的content script发送消息
  chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' })
    .catch(error => {
      console.error('Error sending message to content script:', error);
    });
});