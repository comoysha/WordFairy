/*!
 * mark.js v8.11.1
 * https://markjs.io/
 * Copyright (c) 2014–2018, Julian Kühnel
 * Released under the MIT license https://git.io/vwTVl
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Mark = factory());
}(this, function () { 'use strict';

  // 简化版的mark.js实现
  function Mark(ctx) {
    this.ctx = ctx;
  }

  Mark.prototype.mark = function(keywords, options) {
    const defaults = {
      element: 'mark',
      className: '',
      exclude: [],
      accuracy: 'partially',
      separateWordSearch: true
    };

    this.opt = Object.assign({}, defaults, options);
    this.keywords = Array.isArray(keywords) ? keywords : [keywords];

    this.unmark();
    this.performMark();
  };

  Mark.prototype.unmark = function() {
    const marks = this.ctx.querySelectorAll('mark');
    for (let i = 0; i < marks.length; i++) {
      const mark = marks[i];
      const parent = mark.parentNode;
      parent.replaceChild(mark.firstChild, mark);
      parent.normalize();
    }
  };

  Mark.prototype.performMark = function() {
    if (this.keywords.length === 0) {
      return;
    }

    const nodes = this.getTextNodes();
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      for (let j = 0; j < this.keywords.length; j++) {
        const keyword = this.keywords[j];
        if (keyword && keyword.length > 0) {
          this.markTextNode(node, keyword);
        }
      }
    }
  };

  Mark.prototype.getTextNodes = function() {
    const textNodes = [];
    const walk = document.createTreeWalker(
      this.ctx,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // 跳过空文本节点和已经在mark标签内的节点
          if (node.nodeValue.trim() === '' || node.parentNode.nodeName === 'MARK') {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      },
      false
    );

    let node;
    while ((node = walk.nextNode())) {
      textNodes.push(node);
    }

    return textNodes;
  };

  Mark.prototype.markTextNode = function(textNode, keyword) {
    const text = textNode.nodeValue;
    const parent = textNode.parentNode;
    
    // 简单的字符串匹配
    const index = this.opt.accuracy === 'exactly' ? 
      this.exactWordMatch(text, keyword) : 
      text.toLowerCase().indexOf(keyword.toLowerCase());
    
    if (index === -1) {
      return;
    }
    
    const matchLength = keyword.length;
    const startNode = textNode.splitText(index);
    startNode.splitText(matchLength);
    
    const mark = document.createElement(this.opt.element);
    mark.appendChild(startNode.cloneNode(true));
    if (this.opt.className) {
      mark.className = this.opt.className;
    }
    
    parent.replaceChild(mark, startNode);
  };

  Mark.prototype.exactWordMatch = function(text, keyword) {
    const textLower = text.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    
    let index = textLower.indexOf(keywordLower);
    while (index !== -1) {
      // 检查前后是否是单词边界
      const prevChar = text.charAt(index - 1);
      const nextChar = text.charAt(index + keywordLower.length);
      
      const isPrevBoundary = index === 0 || /\W/.test(prevChar);
      const isNextBoundary = index + keywordLower.length === text.length || /\W/.test(nextChar);
      
      if (isPrevBoundary && isNextBoundary) {
        return index;
      }
      
      index = textLower.indexOf(keywordLower, index + 1);
    }
    
    return -1;
  };

  return Mark;
}));