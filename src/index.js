import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import template from 'art-web-template';
import frameRender from './frame.art';

// 私有属性
const _frameHtml = Symbol('frameHtml');
const _window = Symbol('window');
const _tplHtml = Symbol('tplHtml');
const _data = Symbol('data');
const _iframe = Symbol('iframe');
const _document = Symbol('document');
const _setPrintFlag = Symbol('setPrintFlag');



function _addBtnEvents() {
  let printBtn = this[_document].getElementById('btnprint');
  let canelBtn = this[_document].getElementById('btncanel');
  printBtn.addEventListener('click', () => {
    this.print();
  }, false);

  canelBtn.addEventListener('click', () => {
    this.cancel();
  }, false);
}

function _addStyles() {
  let styles = this.options.styles;
  let document = this[_document];
  styles.forEach((style) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('href', style);
    document.getElementsByTagName('head')[0].appendChild(link);
  });
}

function _createWindow() {
  this[_window] = window.open('', '_blank', 'fullscreen=yes,titlebar=yes,scrollbars=yes,locationbar=no');
  this[_document] = this[_window].document;
  this[_window].onload = () => {
    this[_setPrintFlag] = false;
  };
  this[_setPrintFlag] = true;
  let str = `<div id="content" class="content">${this[_tplHtml]}</div>`;
  this[_frameHtml] = this[_frameHtml].replace('<div id="content" class="content"></div>', str);
  this[_document].write(this[_frameHtml]);
  this[_document].close();
  this.call('_dealCode', this[_document]);
}

function _createIframe() {
  let { iframeParent, mode } = this.options;
  let parentEl = iframeParent && (iframeParent instanceof Element || iframeParent instanceof HTMLDocument)
    ? iframeParent : document.body;
  let style = iframeParent
    ? 'position:absolute;top:0px;bottom:0;left:0;right:0;height:100%;width:100%;background-color:white;z-index:9999;'
    : 'position:fixed;top:0px;bottom:0;left:0;right:0;height:100%;width:100%;background-color:white;z-index:9999;';
  this[_iframe] = document.createElement('iframe');
  this[_iframe].frameBorder = 0;
  this[_iframe].allowFullscreen = true;
  this[_iframe].style = style;
  this[_iframe].name = "frame3";
  this[_iframe].setAttribute('data-arttplprintframeid', '');
  if (mode === 'nopreview') {
    style = 'z-index:-1;'
    this[_iframe].style = style;
    this[_iframe].onload = () => {
      let contentDocument = this[_iframe].contentDocument;
      if (contentDocument && contentDocument.getElementById('content')) {
        this.call('_addPrintEvent');
        this[_iframe].contentWindow.focus();
        this[_iframe].contentWindow.print();
        this.call('_addPrintEvent');
      }
    };
  }
  else {
    this[_iframe].onload = () => {
      this[_document] && (this[_setPrintFlag] = false);
      let contentDocument = this[_iframe].contentDocument;
    };
  }
  this[_setPrintFlag] = true;
  parentEl.appendChild(this[_iframe]);
  this[_document] = this[_iframe].contentDocument;
  let str = `<div id="content" class="content">${this[_tplHtml]}</div>`;
  this[_frameHtml] = this[_frameHtml].replace('<div id="content" class="content"></div>', str);
  this[_document].write(this[_frameHtml]);
  this[_document].close();
  this.call('_dealCode', this[_document]);
}

// 不预览时要添加在系统预览点击打印或者取消时清除iframe的事件
function _addPrintEvent() {
  let contentWindow = this[_iframe].contentWindow;
  if (contentWindow.matchMedia) {
    let mediaQueryList = contentWindow.matchMedia('print');
    mediaQueryList.addListener((mql) => {
      if (!mql.matches) {
        this[_iframe].remove();
      }
    });
  }
  else {
    setTimeout(() => {
      this[_iframe].remove();
    }, 1000);
  }
}

// 清除打印的iframe
function _clearIframe() {
  let iframeParent = this.options.iframeParent;
  let parentEl = iframeParent && (iframeParent instanceof Element || iframeParent instanceof HTMLDocument)
    ? iframeParent : document.body;
  let iframe = parentEl.querySelector('iframe[data-arttplprintframeid]');
  if (iframe) {
    iframe.remove();
  }
}

// 处理页面中的二维码和条形码
function _dealCode(contentDocument) {
  let qrCanvas = contentDocument.querySelectorAll('canvas[data-qrcodevalue]');
  qrCanvas.forEach((item) => {
    let qrcodevalue = item.dataset.qrcodevalue;
    let size = parseInt(item.dataset.size) !== NaN ? parseInt(item.dataset.size) : 120;
    QRCode.toCanvas(item, qrcodevalue, {
      width: size,
      height: size,
      margin: 0
    });
  });
  
  let barCanvas = contentDocument.querySelectorAll('canvas[data-barcodevalue]');
  barCanvas.forEach((item) => {
    let { barcodevalue, format, displayValue, height, margin, width } = item.dataset;
    let widthNum = !isNaN(parseInt(width)) ? parseInt(width) : 1;
    let heightNum = !isNaN(parseInt(height)) ? parseInt(height) : 30;
    let marginNum = !isNaN(parseInt(margin)) ? parseInt(margin) : 0;
    let displayValueFlag = displayValue || displayValue === '' ? true : false;
    JsBarcode(item, barcodevalue, {
      format: format || 'CODE128',
      displayValue: displayValueFlag,
      width:  widthNum,
      height:  heightNum,
      margin:  marginNum
    });
  });
}

// 打印模板字符串
function _printTplSource(tplSource) {
  let tplRender = template.compile(tplSource)
  this[_tplHtml] = tplRender(this[_data]);
  this[_frameHtml] = frameRender({ title: this.options.title });
}

// 打印html节点
function _printElement(element) {
  this[_window] = window.open('', '_blank', 'fullscreen=yes,titlebar=yes,scrollbars=yes');
  this[_window].document.write(`<html><head><title>${document.title}</title></head><body>${element.innerHTML}</body></html>`);
}

function _printHandler() {
  if (!this[_window] && !this[_iframe]) {
    return;
  }

  let printWin = this[_window] || this[_iframe].contentWindow;
  printWin.focus();
  printWin.print();
}

function _cancelHandler() {
  if (!this[_window] && !this[_iframe]) {
    return;
  }
  if (this[_window]) {
    this[_window].close();
    this[_window] = null;
  }
  else {
    this[_iframe].remove();
    this[_iframe] = null;
  }
}

// 私有方法
const privateFuns = {
  _createWindow: _createWindow,
  _createIframe: _createIframe,
  _clearIframe: _clearIframe,
  _printElement: _printElement,
  _printTplSource: _printTplSource,
  _addBtnEvents: _addBtnEvents,
  _dealCode: _dealCode,
  _addStyles: _addStyles,
  _setPrintFlag: _setPrintFlag,
  _printHandler: _printHandler,
  _cancelHandler: _cancelHandler,
  _addPrintEvent: _addPrintEvent
}

class ArtTplPrint {
  constructor(options = {}) {
    const defaultOptions = {
      title: '打印',
      element: '',
      tplSource: '',
      showPrintBtn: true,
      styles: [],
      mode: 'window',
      iframeParent: '',
      filters: []
    }

    // 合并传入配置
    this.options = { ...defaultOptions, ...options };
  }

  static addFilters(filters) {
    let keys = Object.keys(filters);
    keys.forEach((key) => {
      template.defaults.imports[key] = filters[key];
    });
  }

  render(data = {}) {
    this[_data] = data;
    let { element, tplSource, mode, showPrintBtn } = this.options;

    if (element && (element instanceof Element || element instanceof HTMLDocument)) {
      this.call('_printElement', element);
    }
    else if (tplSource) {
      this.call('_clearIframe');
      this.call('_printTplSource', tplSource);
    }
    else {
      throw new Error('请配置要打印的模板！');
    }

    if (mode === 'window') {
      this.call('_createWindow');
    }
    else {
      this.call('_createIframe');
    }
    this.call('_addStyles');
    if (showPrintBtn) {
      this.call('_addBtnEvents');
      this[_document].getElementById('content').classList.add('content-margin');
    }
    else {
      this[_document].getElementById('btn-container').style = 'display:none';
    }
  }

  print() {
    let { onprint } = this.options;
    if (onprint && onprint instanceof Function) {
      this[_setPrintFlag] = true;
      let res = onprint();
      if (res instanceof Promise) {
        res.then(succeed => {
          this[_setPrintFlag] = false;
          succeed && this.call('_printHandler');
        }, () => { this[_setPrintFlag] = false;});
      }
      else {
        res ? this.call('_printHandler') : (this[_setPrintFlag] = false);
      }
    }
    else {
      this.call('_printHandler');
    }
  }

  cancel() {
    let { oncancel } = this.options;
    if (oncancel && oncancel instanceof Function) {
      oncancel();
    }
    this.call('_cancelHandler');
  }

  call(fun, ...args) {
    if(!privateFuns[fun]) return
    return privateFuns[fun].apply(this, args)
  }
}

export default ArtTplPrint;
