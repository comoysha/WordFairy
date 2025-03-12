/*!
 * Readability. An Article Parser for HTML documents
 *
 * @license Apache 2.0
 * @author Mozilla
 * @copyright 2010-2020 Mozilla
 */

(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Readability = factory());
}(this, function() {
  // 简化版的Readability.js实现
  function Readability(doc) {
    this._doc = doc;
  }

  Readability.prototype.parse = function() {
    // 克隆文档以避免修改原始文档
    let doc = this._doc.cloneNode(true);
    
    // 移除不需要的元素
    this._removeNodes(doc.querySelectorAll('script, style, noscript, iframe, form, object, embed'));
    
    // 查找主要内容
    let article = this._findMainContent(doc);
    
    if (!article) {
      return null;
    }
    
    // 提取标题
    let title = this._getArticleTitle(doc);
    
    // 清理内容
    this._cleanContent(article);
    
    return {
      title: title,
      content: article.innerHTML,
      textContent: article.textContent,
      length: article.textContent.length
    };
  };
  
  Readability.prototype._removeNodes = function(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];
      node.parentNode.removeChild(node);
    }
  };
  
  Readability.prototype._findMainContent = function(doc) {
    // 尝试查找主要内容区域
    // 首先尝试查找带有article标记的元素
    let article = doc.querySelector('article');
    if (article) {
      return article;
    }
    
    // 尝试查找常见的内容容器
    let contentSelectors = [
      '.post-content',
      '.article-content',
      '.entry-content',
      '.post',
      '.content',
      '#content',
      '#main',
      '.main'
    ];
    
    for (let i = 0; i < contentSelectors.length; i++) {
      let element = doc.querySelector(contentSelectors[i]);
      if (element) {
        return element;
      }
    }
    
    // 如果没有找到明确的内容容器，使用body作为后备
    return doc.body;
  };
  
  Readability.prototype._getArticleTitle = function(doc) {
    // 尝试获取文章标题
    // 首先尝试h1标签
    let h1 = doc.querySelector('h1');
    if (h1) {
      return h1.textContent.trim();
    }
    
    // 然后尝试标题标签
    let title = doc.querySelector('title');
    if (title) {
      return title.textContent.trim();
    }
    
    return '无标题';
  };
  
  Readability.prototype._cleanContent = function(article) {
    // 移除空段落
    let paragraphs = article.querySelectorAll('p');
    for (let i = 0; i < paragraphs.length; i++) {
      let p = paragraphs[i];
      if (p.textContent.trim() === '') {
        p.parentNode.removeChild(p);
      }
    }
    
    // 移除多余的换行
    article.innerHTML = article.innerHTML.replace(/\n\s*\n/g, '\n');
    
    // 确保图片正确显示
    let images = article.querySelectorAll('img');
    for (let i = 0; i < images.length; i++) {
      let img = images[i];
      // 确保图片有正确的src属性
      if (img.getAttribute('src')) {
        let imgSrc = img.getAttribute('src');
        // 如果是相对路径，转换为绝对路径
        if (imgSrc.indexOf('http') !== 0 && imgSrc.indexOf('data:') !== 0 && imgSrc.indexOf('/') === 0) {
          // 绝对路径（相对于域名根目录）
          try {
            const origin = window.location.origin;
            img.setAttribute('src', origin + imgSrc);
          } catch (e) {
            console.error('转换绝对路径图片失败:', e);
          }
        } else if (imgSrc.indexOf('http') !== 0 && imgSrc.indexOf('data:') !== 0) {
          // 相对路径
          try {
            const base = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
            img.setAttribute('src', base + imgSrc);
          } catch (e) {
            console.error('转换相对路径图片失败:', e);
          }
        }
        // 添加加载错误处理
        img.onerror = function() {
          console.warn('图片加载失败:', this.src);
          this.style.border = '1px dashed #ccc';
          this.style.padding = '10px';
          this.style.display = 'inline-block';
          this.style.width = 'auto';
          this.style.height = 'auto';
          this.alt = this.alt || '图片加载失败';
        };
      }
      // 确保图片样式正确
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.margin = '1em auto';
    }
  };

  return Readability;
}));