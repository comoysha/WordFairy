// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 向当前标签页的content script发送消息
  chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' })
    .then(response => {
      if (!response || !response.success) {
        console.error('Failed to toggle sidebar:', response);
      }
    })
    .catch(error => {
      console.error('Error sending message to content script:', error);
      // 尝试重新注入content script
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }).then(() => {
        // 重新尝试发送消息
        chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' })
          .catch(error => {
            console.error('Error after reinjection:', error);
          });
      }).catch(error => {
        console.error('Error injecting content script:', error);
      });
    });
});