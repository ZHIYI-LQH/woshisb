var handlers =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/plugin/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/cocoascript-class/lib/index.js":
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SuperCall = undefined;
exports.default = ObjCClass;

var _runtime = __webpack_require__("./node_modules/cocoascript-class/lib/runtime.js");

exports.SuperCall = _runtime.SuperCall;

// super when returnType is id and args are void
// id objc_msgSendSuper(struct objc_super *super, SEL op, void)

const SuperInit = (0, _runtime.SuperCall)(NSStringFromSelector("init"), [], { type: "@" });

// Returns a real ObjC class. No need to use new.
function ObjCClass(defn) {
  const superclass = defn.superclass || NSObject;
  const className = (defn.className || defn.classname || "ObjCClass") + NSUUID.UUID().UUIDString();
  const reserved = new Set(['className', 'classname', 'superclass']);
  var cls = MOClassDescription.allocateDescriptionForClassWithName_superclass_(className, superclass);
  // Add each handler to the class description
  const ivars = [];
  for (var key in defn) {
    const v = defn[key];
    if (typeof v == 'function' && key !== 'init') {
      var selector = NSSelectorFromString(key);
      cls.addInstanceMethodWithSelector_function_(selector, v);
    } else if (!reserved.has(key)) {
      ivars.push(key);
      cls.addInstanceVariableWithName_typeEncoding(key, "@");
    }
  }

  cls.addInstanceMethodWithSelector_function_(NSSelectorFromString('init'), function () {
    const self = SuperInit.call(this);
    ivars.map(name => {
      Object.defineProperty(self, name, {
        get() {
          return getIvar(self, name);
        },
        set(v) {
          (0, _runtime.object_setInstanceVariable)(self, name, v);
        }
      });
      self[name] = defn[name];
    });
    // If there is a passsed-in init funciton, call it now.
    if (typeof defn.init == 'function') defn.init.call(this);
    return self;
  });

  return cls.registerClass();
};

function getIvar(obj, name) {
  const retPtr = MOPointer.new();
  (0, _runtime.object_getInstanceVariable)(obj, name, retPtr);
  return retPtr.value().retain().autorelease();
}

/***/ }),

/***/ "./node_modules/cocoascript-class/lib/runtime.js":
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SuperCall = SuperCall;
exports.CFunc = CFunc;
const objc_super_typeEncoding = '{objc_super="receiver"@"super_class"#}';

// You can store this to call your function. this must be bound to the current instance.
function SuperCall(selector, argTypes, returnType) {
  const func = CFunc("objc_msgSendSuper", [{ type: '^' + objc_super_typeEncoding }, { type: ":" }, ...argTypes], returnType);
  return function (...args) {
    const struct = make_objc_super(this, this.superclass());
    const structPtr = MOPointer.alloc().initWithValue_(struct);
    return func(structPtr, selector, ...args);
  };
}

// Recursively create a MOStruct
function makeStruct(def) {
  if (typeof def !== 'object' || Object.keys(def).length == 0) {
    return def;
  }
  const name = Object.keys(def)[0];
  const values = def[name];

  const structure = MOStruct.structureWithName_memberNames_runtime(name, Object.keys(values), Mocha.sharedRuntime());

  Object.keys(values).map(member => {
    structure[member] = makeStruct(values[member]);
  });

  return structure;
}

function make_objc_super(self, cls) {
  return makeStruct({
    objc_super: {
      receiver: self,
      super_class: cls
    }
  });
}

// Due to particularities of the JS bridge, we can't call into MOBridgeSupport objects directly
// But, we can ask key value coding to do the dirty work for us ;)
function setKeys(o, d) {
  const funcDict = NSMutableDictionary.dictionary();
  funcDict.o = o;
  Object.keys(d).map(k => funcDict.setValue_forKeyPath(d[k], "o." + k));
}

// Use any C function, not just ones with BridgeSupport
function CFunc(name, args, retVal) {
  function makeArgument(a) {
    if (!a) return null;
    const arg = MOBridgeSupportArgument.alloc().init();
    setKeys(arg, {
      type64: a.type
    });
    return arg;
  }
  const func = MOBridgeSupportFunction.alloc().init();
  setKeys(func, {
    name: name,
    arguments: args.map(makeArgument),
    returnValue: makeArgument(retVal)
  });
  return func;
}

/*
@encode(char*) = "*"
@encode(id) = "@"
@encode(Class) = "#"
@encode(void*) = "^v"
@encode(CGRect) = "{CGRect={CGPoint=dd}{CGSize=dd}}"
@encode(SEL) = ":"
*/

function addStructToBridgeSupport(key, structDef) {
  // OK, so this is probably the nastiest hack in this file.
  // We go modify MOBridgeSupportController behind its back and use kvc to add our own definition
  // There isn't another API for this though. So the only other way would be to make a real bridgesupport file.
  const symbols = MOBridgeSupportController.sharedController().valueForKey('symbols');
  if (!symbols) throw Error("Something has changed within bridge support so we can't add our definitions");
  // If someone already added this definition, don't re-register it.
  if (symbols[key] !== null) return;
  const def = MOBridgeSupportStruct.alloc().init();
  setKeys(def, {
    name: key,
    type: structDef.type
  });
  symbols[key] = def;
};

// This assumes the ivar is an object type. Return value is pretty useless.
const object_getInstanceVariable = exports.object_getInstanceVariable = CFunc("object_getInstanceVariable", [{ type: "@" }, { type: '*' }, { type: "^@" }], { type: "^{objc_ivar=}" });
// Again, ivar is of object type
const object_setInstanceVariable = exports.object_setInstanceVariable = CFunc("object_setInstanceVariable", [{ type: "@" }, { type: '*' }, { type: "@" }], { type: "^{objc_ivar=}" });

// We need Mocha to understand what an objc_super is so we can use it as a function argument
addStructToBridgeSupport('objc_super', { type: objc_super_typeEncoding });

/***/ }),

/***/ "./package.json":
/***/ (function(module, exports) {

module.exports = {"name":"MockingBot","description":"Basic development boilerplate for Sketch plugins","author":"Julian Burr","version":"3.0.2","repository":{"type":"git","url":"https://github.com/mockingbot/MockingBot.sketchplugin"},"devDependencies":{"autoprefixer":"^7.1.2","babel-cli":"^6.24.1","babel-core":"^6.25.0","babel-eslint":"^7.1.1","babel-helpers":"^6.16.0","babel-loader":"^7.1.1","babel-plugin-external-helpers":"^6.22.0","babel-plugin-module-resolver":"^2.4.0","babel-plugin-transform-decorators-legacy":"^1.3.4","babel-plugin-transform-object-rest-spread":"^6.20.2","babel-preset-es2015":"^6.18.0","babel-preset-es2015-rollup":"^3.0.0","babel-preset-react-app":"^2.0.1","case-sensitive-paths-webpack-plugin":"^1.1.4","chalk":"^1.1.3","child_process":"^1.0.2","clear":"^0.0.1","connect-history-api-fallback":"^1.3.0","css-loader":"^0.26.1","detect-port":"^1.1.0","dotenv":"^4.0.0","eslint":"^3.14.0","eslint-config-semistandard":"^7.0.0","eslint-config-standard":"^6.2.1","eslint-loader":"^1.6.1","eslint-plugin-no-unused-vars-rest":"^1.0.4","eslint-plugin-promise":"^3.4.0","eslint-plugin-react":"^6.9.0","eslint-plugin-standard":"^2.0.1","extract-text-webpack-plugin":"^3.0.0","file-loader":"^0.9.0","fs-extra":"^1.0.0","hard-source-webpack-plugin":"^0.13.1","html-webpack-plugin":"^2.29.0","http-proxy-middleware":"^0.17.3","jest":"^20.0.4","json-loader":"^0.5.4","log-update":"^2.0.0","node-sass":"^4.3.0","object-assign":"^4.1.1","path":"^0.12.7","path-exists":"^3.0.0","postcss-flexbugs-fixes":"^3.0.0","postcss-loader":"^1.2.2","react-dev-utils":"^3.0.2","react-error-overlay":"^1.0.9","readline":"^1.3.0","recursive-readdir":"^2.1.0","sass-loader":"^6.0.6","style-loader":"^0.18.2","url":"^0.11.0","url-loader":"^0.5.8","watch":"^1.0.1","webpack":"^3.1.0","webpack-dev-server":"^2.5.1","webpack-manifest-plugin":"^1.1.2"},"scripts":{"start":"DEV=true node scripts/start.js","start:webview":"HTTPS=true node scripts/start-webview.js","start:realwebview":"[Deprecated]npm run clear && node scripts/start-realwebview.js","clear":"rimraf node_modules/.cache","build":"node scripts/build.js","bundle":"BUILD_LOCALE=zh node scripts/build.js && BUILD_LOCALE=zh node scripts/bundle.js && BUILD_LOCALE=en node scripts/build.js && BUILD_LOCALE=en node scripts/bundle.js","lint":"yarn lint:plugin && yarn lint:webview","lint:plugin":"eslint ./src/plugin/ -c ./config/plugin/eslint.js || true","lint:webview":"eslint ./src/webview/ -c ./config/webview/eslint.js || true","lint-fix":"yarn lint-fix:plugin && yarn lint-fix:webview","lint-fix:plugin":"eslint ./src/plugin/ --fix -c ./config/plugin/eslint.js || true","lint-fix:webview":"eslint ./src/webview/ --fix -c ./config/webview/eslint.js || true","lint-fox":"node scripts/utils/fox.js && yarn lint-fix","todos":"node scripts/utils/todos.js","test":"jest ./__tests__"},"dependencies":{"@ibot/ibot":"0.6.0-dev.0","@mockingbot/timeago":"^0.2.0","@sentry/browser":"4.3.0","classnames":"^2.2.5","cocoascript-class":"^0.1.2","core-decorators":"^0.15.0","css-hot-loader":"^1.4.4","font-awesome":"^4.7.0","lodash":"^4.17.2","lodash-move":"^1.1.1","moment":"^2.17.1","promise":"7.1.1","prop-types":"^15.6.0","query-string":"^4.2.3","rc-progress":"^2.0.3","react":"^16.5.0","react-addons-css-transition-group":"^15.4.1","react-document-events":"^1.3.2","react-dom":"^16.5.0","react-loading":"^2.0.3","react-redux":"^5.0.2","react-router":"^3.0.2","react-router-dom":"^4.3.1","react-router-redux":"^4.0.7","react-spinkit":"^3.0.0","redux":"^3.6.0","redux-thunk":"^2.1.0","whatwg-fetch":"1.0.0"}}

/***/ }),

/***/ "./src/plugin/index.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["openWindow"] = openWindow;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils_core__ = __webpack_require__("./src/plugin/utils/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils_webview__ = __webpack_require__("./src/plugin/utils/webview/index.js");



function openWindow(context) {
  // It's good practice to have an init function, that can be called
  // at the beginning of all entry points and will prepare the enviroment
  // using the provided `context`
  Object(__WEBPACK_IMPORTED_MODULE_0__utils_core__["e" /* initWithContext */])(context) && __WEBPACK_IMPORTED_MODULE_1__utils_webview__["b" /* openWindow */](__WEBPACK_IMPORTED_MODULE_1__utils_webview__["e" /* windowIdentifier */]);
}

/***/ }),

/***/ "./src/plugin/utils/core.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export getPluginFolderPath */
/* harmony export (immutable) */ __webpack_exports__["e"] = initWithContext;
/* unused harmony export loadFramework */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return context; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return document; });
/* unused harmony export selection */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return sketch; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Settings; });
/* unused harmony export UI */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return pluginFolderPath; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return exportPath; });
var context = null;
var document = null;
var selection = null;

var sketch = __webpack_require__("sketch/dom");
var Settings = __webpack_require__("sketch/settings");
var UI = __webpack_require__("sketch/ui");

var pluginFolderPath = null;
var frameworkFolderPath = '/Contents/Resources/frameworks/';

// exportPath <=> bucket (qiniu)
var exportPath = null;

function getPluginFolderPath() {
  // Get absolute folder path of plugin
  var split = context.scriptPath.split('/');
  split.splice(-3, 3);
  return split.join('/');
}

function initWithContext(ctx) {
  // This function needs to be called in the beginning of every entry point!
  // Set all env variables according to current context
  context = ctx;
  document = ctx.document || ctx.actionContext.document || MSDocument.currentDocument();
  selection = document ? document.selectedLayers() : null;
  pluginFolderPath = getPluginFolderPath();
  exportPath = pluginFolderPath + '/Contents/Resources/exports';

  // Here you could load custom cocoa frameworks if you need to
  // loadFramework('FrameworkName', 'ClassName');
  // => would be loaded into ClassName in global namespace!
  var r1 = loadFramework('SSZipArchive');
  var r2 = loadFramework('AFNetworking');
  var r3 = loadFramework('HappyDNS');

  var r4 = loadFramework('Qiniu');
  var r5 = loadFramework('Sentry');
  var r6 = loadFramework('MBQiniu');

  if (r1 && r2 && r3 && r4 && r5 && r6) {
    log("load framework success");
    return true;
  } else {
    log("load framework fail");
    return false;
  }
}

function loadFramework(frameworkName) {
  // Only load framework if class not already available
  if (Mocha) {
    var frameworkDir = '' + pluginFolderPath + frameworkFolderPath;
    var mocha = Mocha.sharedRuntime();
    return mocha.loadFrameworkWithName_inDirectory(frameworkName, frameworkDir);
  }
  return false;
}

// export function loadFramework (frameworkName, frameworkClass) {
//   // Only load framework if class not already available
//   if (Mocha && NSClassFromString(frameworkClass) == null) {
//     const frameworkDir = `${pluginFolderPath}${frameworkFolderPath}`;
//     const mocha = Mocha.sharedRuntime();
//     return mocha.loadFrameworkWithName_inDirectory(frameworkName, frameworkDir);
//   }
//   return false;
// }



/***/ }),

/***/ "./src/plugin/utils/webview/index.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__webview__ = __webpack_require__("./src/plugin/utils/webview/webview.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__window__ = __webpack_require__("./src/plugin/utils/webview/window.js");
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return __WEBPACK_IMPORTED_MODULE_0__webview__["d"]; });
/* unused harmony reexport getFilePath */
/* unused harmony reexport createWebView */
/* unused harmony reexport sendActionToWebView */
/* unused harmony reexport sendActionChanToWebView */
/* unused harmony reexport receiveAction */
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return __WEBPACK_IMPORTED_MODULE_1__window__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return __WEBPACK_IMPORTED_MODULE_1__window__["d"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return __WEBPACK_IMPORTED_MODULE_1__window__["e"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return __WEBPACK_IMPORTED_MODULE_1__window__["b"]; });






/***/ }),

/***/ "./src/plugin/utils/webview/webview.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export BridgeMessageHandler */
/* unused harmony export initBridgedWebView */
/* unused harmony export getFilePath */
/* harmony export (immutable) */ __webpack_exports__["a"] = createWebView;
/* harmony export (immutable) */ __webpack_exports__["b"] = sendAction;
/* harmony export (immutable) */ __webpack_exports__["c"] = sendActionChan;
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return windowIdentifier; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__core__ = __webpack_require__("./src/plugin/utils/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_cocoascript_class__ = __webpack_require__("./node_modules/cocoascript-class/lib/index.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_cocoascript_class___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_cocoascript_class__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__work_work__ = __webpack_require__("./src/plugin/utils/work/work.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__core_js__ = __webpack_require__("./src/plugin/utils/core.js");





// These are just used to identify the window(s)
// Change them to whatever you need e.g. if you need to support multiple
// windows at the same time...
var windowIdentifier = 'MockingBot--window';

// Since we now create the delegate in js, we need the enviroment
// to stick around for as long as we need a reference to that delegate
coscript.setShouldKeepAround(true);

// This is a helper delegate, that handles incoming bridge messages
var BridgeMessageHandler = new __WEBPACK_IMPORTED_MODULE_1_cocoascript_class___default.a({
  'userContentController:didReceiveScriptMessage:': function userContentControllerDidReceiveScriptMessage(controller, message) {
    try {
      var data = JSON.parse(decodeURIComponent(message.body()));
      receiveAction(data);
    } catch (e) {
      log('Could not parse bridge message');
      log(e.message);
    }
  }
});

var receiveAction = function receiveAction(data) {
  switch (data.path + '') {
    case '/firstSetDomain':
      log('received /firstSetDomain');
      Object(__WEBPACK_IMPORTED_MODULE_2__work_work__["e" /* firstSetDomain */])(data.domain);
      return;
    case '/setDomain':
      log('received /setDomain');
      log({ data: data });
      Object(__WEBPACK_IMPORTED_MODULE_2__work_work__["k" /* setDomain */])(data.domain);
      return;
    case '/getDomain':
      log('received /getDomain');
      Object(__WEBPACK_IMPORTED_MODULE_2__work_work__["f" /* getDomain */])();
      return;
    case '/initRoute':
      log('received /initRoute');
      Object(__WEBPACK_IMPORTED_MODULE_2__work_work__["g" /* initRoute */])();
      return;
    case '/setSelectedArtboardsNumberChan':
      log('received /setSelectedArtboardsNumberChan');
      Object(__WEBPACK_IMPORTED_MODULE_2__work_work__["m" /* setSelectedArtboardsNumberChan */])();
      return;
    case '/login':
      log('received /login');
      Object(__WEBPACK_IMPORTED_MODULE_2__work_work__["n" /* start */])();
      return;
    case '/sessions':
      log('received /sessions');
      Object(__WEBPACK_IMPORTED_MODULE_2__work_work__["h" /* loginUser_withPassword_inHost */])(data.params.email, data.params.password);
      return;
    case '/projects.json':
      log('received /projects.json');
      Object(__WEBPACK_IMPORTED_MODULE_2__work_work__["d" /* fetchTheData */])();
      return;
    case '/setSelected':
      log('received /setSelected');
      Object(__WEBPACK_IMPORTED_MODULE_2__work_work__["l" /* setSelected */])(data.params.group, data.params.subGroup, data.params.projectCid);
      return;
    case '/logout':
      log('received /logout');
      Object(__WEBPACK_IMPORTED_MODULE_2__work_work__["i" /* logoutUser */])();
      return;
    case '/browser':
      log('received /browser');
      Object(__WEBPACK_IMPORTED_MODULE_2__work_work__["j" /* openInBrowser */])(data.url);
      return;
    case '/export':
      log('received /export');
      Object(__WEBPACK_IMPORTED_MODULE_2__work_work__["o" /* upload */])(data.params.project_cid);
      return;
    case '/createProject':
      log('received /createProject');
      Object(__WEBPACK_IMPORTED_MODULE_2__work_work__["b" /* createProject */])(data.params);
      return;
    case '/fetchCreateProjectMetaData':
      log('received /fetchCreateProjectMetaData');
      Object(__WEBPACK_IMPORTED_MODULE_2__work_work__["c" /* fetchCreateProjectMetaData */])(data.lang);
      return;
    case '/checkForUpdates':
      log('received /checkForUpdates');
      Object(__WEBPACK_IMPORTED_MODULE_2__work_work__["a" /* checkForUpdates */])();
      return;
    // todo: bad api naming
    default:
      return;
  }
};

log('BridgeMessageHandler');
log(BridgeMessageHandler);
log(BridgeMessageHandler.userContentController_didReceiveScriptMessage);

function initBridgedWebView(frame) {
  var bridgeName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'SketchBridge';

  var config = WKWebViewConfiguration.alloc().init();
  var messageHandler = BridgeMessageHandler.alloc().init();
  config.userContentController().addScriptMessageHandler_name(messageHandler, bridgeName);
  return WKWebView.alloc().initWithFrame_configuration(frame, config);
}

function getFilePath(file) {
  return __WEBPACK_IMPORTED_MODULE_0__core__["f" /* pluginFolderPath */] + '/Contents/Resources/webview/' + file;
}

function createWebView(path, frame) {
  var webView = initBridgedWebView(frame, 'Sketch');
  webView.setAutoresizingMask(2 | 16);
  webView.configuration().preferences().setValue_forKey(true, "developerExtrasEnabled");

  if (undefined) {
    webView.loadRequest(NSURLRequest.requestWithURL(NSURL.URLWithString("https://localhost:3000")));
  } else {
    var url = NSURL.fileURLWithPath(getFilePath(path));
    log('File URL');
    log(url);
    webView.loadFileURL_allowingReadAccessToURL(url, NSURL.URLWithString('file:///'));
  }

  return webView;
}

function sendAction(webView, name, payload) {
  if (!webView || !webView.evaluateJavaScript_completionHandler) {
    return;
  }
  // `sketchBridge` is the JS function exposed on window in the webview!

  var action = {
    type: name,
    payload: JSON.parse(payload)
  };

  var script = 'sketchBridge(' + JSON.stringify(action) + ');';

  webView.evaluateJavaScript_completionHandler(script, null);
}

function sendActionChan(webView, msg) {
  if (!webView || !webView.evaluateJavaScript_completionHandler) {
    return;
  }

  // 2.
  var script = 'nativeCallBack(' + JSON.stringify(msg) + ');';
  webView.evaluateJavaScript_completionHandler(script, null);
}



/***/ }),

/***/ "./src/plugin/utils/webview/window.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["c"] = open;
/* harmony export (immutable) */ __webpack_exports__["a"] = findWindow;
/* unused harmony export findWebView */
/* harmony export (immutable) */ __webpack_exports__["d"] = sendAction;
/* harmony export (immutable) */ __webpack_exports__["e"] = sendActionChan;
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return mbQiniu; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__webview__ = __webpack_require__("./src/plugin/utils/webview/webview.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__core__ = __webpack_require__("./src/plugin/utils/core.js");




var mbQiniu = null;

function open(identifier) {
  var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'index.html';
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};


  var oldWindow = findWindow(identifier);
  if (oldWindow) {
    oldWindow.makeKeyAndOrderFront(null);
    oldWindow.setLevel(NSStatusWindowLevel);
    return;
  }

  // Sensible defaults for options
  var _options$width = options.width,
      width = _options$width === undefined ? 640 : _options$width,
      _options$height = options.height,
      height = _options$height === undefined ? 480 - 22 : _options$height;


  var frame = NSMakeRect(0, 0, width, height);
  var masks = 1 | 2;
  var window = NSPanel.alloc().initWithContentRect_styleMask_backing_defer(frame, masks, 2, false);
  window.center();

  // We use this dictionary to have a persistant storage of our NSWindow/NSPanel instance
  // Otherwise the instance is stored nowhere and gets release => Window closes
  var threadDictionary = NSThread.mainThread().threadDictionary();
  threadDictionary[identifier] = window;

  var webView = Object(__WEBPACK_IMPORTED_MODULE_0__webview__["a" /* createWebView */])(path, frame);

  mbQiniu = MBQiniu.alloc().initWithWebview(webView);
  mbQiniu.initSentryClient();

  window.contentView().addSubview(webView);

  window.makeKeyAndOrderFront(null);
  window.setLevel(NSStatusWindowLevel);

  var closeButton = window.standardWindowButton(NSWindowCloseButton);
  closeButton.setCOSJSTargetFunction(function (sender) {
    try {
      removeExportsPath(); // 这个可能抛异常, 重复removeItem的时候，所以使用try
    } finally {
      var oldWebView = findWebView(identifier);
      oldWebView.reload(); // 这里需要reload，刷下<App />的componentDidMount方法
      window.close();
    }
  });

  // NSApp.runModalForWindow(window); // this will make sketch non-responsible;; refer: https://sketchplugins.com/d/339-how-to-auto-close-window
}

function removeExportsPath() {
  var error = MOPointer.alloc().init();
  NSFileManager.defaultManager().removeItemAtPath_error(__WEBPACK_IMPORTED_MODULE_1__core__["d" /* exportPath */], error);
  if (error.value()) {
    log({ error_value: error.value() });
    log('remove exportsPath failed'); // 可能是已经移除了，没关系
  } else {
    log('remove exportsPath succeed');
  }
}

function findWindow(identifier) {
  var threadDictionary = NSThread.mainThread().threadDictionary();
  var window = threadDictionary[identifier];
  return window;
}

function findWebView(identifier) {
  var threadDictionary = NSThread.mainThread().threadDictionary();
  var window = threadDictionary[identifier];
  return window.contentView().subviews()[0];
}

function sendAction(identifier, name, payload) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__webview__["b" /* sendAction */])(findWebView(identifier), name, payload);
}

function sendActionChan(identifier, msg) {
  return Object(__WEBPACK_IMPORTED_MODULE_0__webview__["c" /* sendActionChan */])(findWebView(identifier), msg);
}



/***/ }),

/***/ "./src/plugin/utils/work/parseArtboard.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = parseArtboard;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__tool_js__ = __webpack_require__("./src/plugin/utils/work/tool.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__core_js__ = __webpack_require__("./src/plugin/utils/core.js");
var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }




// flattend z_ed data_structure_adjustment
function parseArtboard(dupObj, artboardId, indexPosition) {
  // artboardId is not the dup's, it's origin artboard's
  var twistedResult = [];
  var zIndex = 0; // z大的在DOM中放后面(默认点选)
  var flattenAndZ = function flattenAndZ(layers) {
    // 深度优先递归
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      var _loop = function _loop() {
        var layer = _step.value;
        // 注意，默认生成的json是: sketch下面的排在数组的前面(z小),上面的排在数组的后面(z大)
        if (layer._class == "group") {
          var sonLayers = layer.layers,
              others = _objectWithoutProperties(layer, ['layers']);

          sonLayers.forEach(function (l) {
            return l.parent = layer.do_objectID;
          });
          others.z = 0;
          twistedResult.push(others);
          flattenAndZ(sonLayers);
        } else if (layer._class == "shapeGroup") {
          var _sonLayers = layer.layers,
              _others = _objectWithoutProperties(layer, ['layers']);

          zIndex += 1;
          _others.z = zIndex;
          twistedResult.push(_others); // discard sonLayers (rectangle,path,point,...vector editing element)
        } else {
          zIndex += 1;
          layer.z = zIndex;
          twistedResult.push(layer);
        }
      };

      for (var _iterator = layers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        _loop();
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  };
  flattenAndZ(dupObj.layers);
  dupObj.layers = twistedResult;

  // debugFile(JSON.stringify(dupObj.layers), artboardId, "flattenAndZ")
  // log("write file after-flattenZ done!")

  var absoluteXY = function absoluteXY(id) {
    // aligin ??
    var _dupObj$layers$find = dupObj.layers.find(function (_ref) {
      var do_objectID = _ref.do_objectID;
      return do_objectID == id;
    }),
        parent = _dupObj$layers$find.parent,
        _dupObj$layers$find$f = _dupObj$layers$find.frame,
        x = _dupObj$layers$find$f.x,
        y = _dupObj$layers$find$f.y;

    if (parent) {
      var _absoluteXY = absoluteXY(parent),
          _absoluteXY2 = _slicedToArray(_absoluteXY, 2),
          px = _absoluteXY2[0],
          py = _absoluteXY2[1];

      return [x + px, y + py];
    } else {
      return [x, y];
    }
  };

  // null, [], "", {} => in server side are the same!
  // NOTICE: add default {} or [] in destructures! Otherwise perhaps throw exception (`undefined is not an object (evaluating ...)`)
  var genArtboardObj = function genArtboardObj(_ref2) {
    var name = _ref2.name,
        _ref2$frame = _ref2.frame;
    _ref2$frame = _ref2$frame === undefined ? {} : _ref2$frame;
    var width = _ref2$frame.width,
        height = _ref2$frame.height,
        _ref2$backgroundColor = _ref2.backgroundColor;
    _ref2$backgroundColor = _ref2$backgroundColor === undefined ? {} : _ref2$backgroundColor;
    var red = _ref2$backgroundColor.red,
        green = _ref2$backgroundColor.green,
        blue = _ref2$backgroundColor.blue,
        alpha = _ref2$backgroundColor.alpha,
        hasBackgroundColor = _ref2.hasBackgroundColor;
    return {
      objectID: artboardId,
      name: name,
      raw_data: base64(artboardId),
      width: width,
      height: height,
      bg_color: hasBackgroundColor ? formatIntColor(red, green, blue, alpha) : null,
      position: indexPosition,
      layers: dupObj.layers.map(function (_ref3) {
        var do_objectID = _ref3.do_objectID,
            name = _ref3.name,
            _class = _ref3._class,
            _ref3$frame = _ref3.frame;
        _ref3$frame = _ref3$frame === undefined ? {} : _ref3$frame;
        var width = _ref3$frame.width,
            height = _ref3$frame.height,
            x = _ref3$frame.x,
            y = _ref3$frame.y,
            _ref3$exportOptions = _ref3.exportOptions;
        _ref3$exportOptions = _ref3$exportOptions === undefined ? {} : _ref3$exportOptions;
        var _ref3$exportOptions$e = _ref3$exportOptions.exportFormats,
            exportFormats = _ref3$exportOptions$e === undefined ? [] : _ref3$exportOptions$e,
            _ref3$rotation = _ref3.rotation,
            rotation = _ref3$rotation === undefined ? null : _ref3$rotation,
            _ref3$parent = _ref3.parent,
            parent = _ref3$parent === undefined ? null : _ref3$parent,
            _ref3$fixedRadius = _ref3.fixedRadius,
            fixedRadius = _ref3$fixedRadius === undefined ? null : _ref3$fixedRadius,
            _ref3$z = _ref3.z,
            z = _ref3$z === undefined ? null : _ref3$z,
            _ref3$style = _ref3.style;
        _ref3$style = _ref3$style === undefined ? {} : _ref3$style;
        var _ref3$style$shadows = _ref3$style.shadows,
            shadows = _ref3$style$shadows === undefined ? [] : _ref3$style$shadows,
            _ref3$style$innerShad = _ref3$style.innerShadows,
            innerShadows = _ref3$style$innerShad === undefined ? [] : _ref3$style$innerShad,
            _ref3$style$borders = _ref3$style.borders,
            borders = _ref3$style$borders === undefined ? [] : _ref3$style$borders,
            _ref3$style$contextSe = _ref3$style.contextSettings;
        _ref3$style$contextSe = _ref3$style$contextSe === undefined ? {} : _ref3$style$contextSe;
        var _ref3$style$contextSe2 = _ref3$style$contextSe.opacity,
            opacity = _ref3$style$contextSe2 === undefined ? 1 : _ref3$style$contextSe2,
            _ref3$style$fills = _ref3$style.fills,
            fills = _ref3$style$fills === undefined ? [] : _ref3$style$fills,
            _ref3$style$textStyle = _ref3$style.textStyle;
        _ref3$style$textStyle = _ref3$style$textStyle === undefined ? {} : _ref3$style$textStyle;
        var _ref3$style$textStyle2 = _ref3$style$textStyle.encodedAttributes;
        _ref3$style$textStyle2 = _ref3$style$textStyle2 === undefined ? {} : _ref3$style$textStyle2;
        var _ref3$style$textStyle3 = _ref3$style$textStyle2.kerning,
            kerning = _ref3$style$textStyle3 === undefined ? null : _ref3$style$textStyle3,
            _ref3$style$textStyle4 = _ref3$style$textStyle2.paragraphStyle;
        _ref3$style$textStyle4 = _ref3$style$textStyle4 === undefined ? {} : _ref3$style$textStyle4;
        var _ref3$style$textStyle5 = _ref3$style$textStyle4.alignment,
            alignment = _ref3$style$textStyle5 === undefined ? null : _ref3$style$textStyle5,
            _ref3$style$textStyle6 = _ref3$style$textStyle4.paragraphSpacing,
            paragraphSpacing = _ref3$style$textStyle6 === undefined ? null : _ref3$style$textStyle6,
            _ref3$style$textStyle7 = _ref3$style$textStyle4.minimumLineHeight,
            minimumLineHeight = _ref3$style$textStyle7 === undefined ? null : _ref3$style$textStyle7,
            _ref3$style$textStyle8 = _ref3$style$textStyle.verticalAlignment,
            verticalAlignment = _ref3$style$textStyle8 === undefined ? null : _ref3$style$textStyle8,
            _ref3$attributedStrin = _ref3.attributedString;
        _ref3$attributedStrin = _ref3$attributedStrin === undefined ? {} : _ref3$attributedStrin;
        var _ref3$attributedStrin2 = _ref3$attributedStrin.string,
            string = _ref3$attributedStrin2 === undefined ? "" : _ref3$attributedStrin2,
            _ref3$attributedStrin3 = _ref3$attributedStrin.attributes,
            attributes = _ref3$attributedStrin3 === undefined ? [] : _ref3$attributedStrin3;

        var _absoluteXY3 = absoluteXY(do_objectID),
            _absoluteXY4 = _slicedToArray(_absoluteXY3, 2),
            ax = _absoluteXY4[0],
            ay = _absoluteXY4[1];

        return {
          objectID: do_objectID, // this is dup's layer objectId; not care?
          name: name,
          kind: _class == "group" ? "group" : "layer",
          parent: parent,

          // rec add parents's and (align?)(resize?)
          width: width,
          height: height,
          left: ax,
          top: ay,

          exportable: exportFormats.length > 0 ? "true" : "false", // string"true", not bool true; todo:
          rotation: -rotation, // sketch oc api -50; but sketch doc display 50!!
          bd_radius: fixedRadius,

          // style
          opacity: opacity,
          shadows: shadows.map(function (_ref4) {
            var isEnabled = _ref4.isEnabled,
                blurRadius = _ref4.blurRadius,
                _ref4$color = _ref4.color,
                red = _ref4$color.red,
                green = _ref4$color.green,
                blue = _ref4$color.blue,
                alpha = _ref4$color.alpha,
                _ref4$contextSettings = _ref4.contextSettings,
                blendMode = _ref4$contextSettings.blendMode,
                opacity = _ref4$contextSettings.opacity,
                offsetX = _ref4.offsetX,
                offsetY = _ref4.offsetY,
                spread = _ref4.spread;
            // no pattern match(only match isEnable=true case) in es6
            return isEnabled ? {
              color: Object(__WEBPACK_IMPORTED_MODULE_0__tool_js__["a" /* formatColor */])(red, green, blue, alpha),
              offset_x: offsetX,
              offset_y: offsetY,
              type: "outer",
              blur_radius: blurRadius,
              spread: spread
            } : null;
          }),
          inner_shadows: innerShadows.map(function (_ref5) {
            var isEnabled = _ref5.isEnabled,
                blurRadius = _ref5.blurRadius,
                _ref5$color = _ref5.color,
                red = _ref5$color.red,
                green = _ref5$color.green,
                blue = _ref5$color.blue,
                alpha = _ref5$color.alpha,
                _ref5$contextSettings = _ref5.contextSettings,
                blendMode = _ref5$contextSettings.blendMode,
                opacity = _ref5$contextSettings.opacity,
                offsetX = _ref5.offsetX,
                offsetY = _ref5.offsetY,
                spread = _ref5.spread;

            return isEnabled ? {
              color: Object(__WEBPACK_IMPORTED_MODULE_0__tool_js__["a" /* formatColor */])(red, green, blue, alpha),
              offset_x: offsetX,
              offset_y: offsetY,
              type: "inner",
              blur_radius: blurRadius,
              spread: spread
            } : null;
          }),
          borders: borders.map(function (_ref6) {
            var isEnabled = _ref6.isEnabled,
                _ref6$color = _ref6.color,
                red = _ref6$color.red,
                green = _ref6$color.green,
                blue = _ref6$color.blue,
                alpha = _ref6$color.alpha,
                fillType = _ref6.fillType,
                position = _ref6.position,
                thickness = _ref6.thickness;

            return isEnabled ? {
              color: Object(__WEBPACK_IMPORTED_MODULE_0__tool_js__["a" /* formatColor */])(red, green, blue, alpha),
              position: borderPositionCase(position),
              thickness: thickness
            } : null;
          }),
          bg_colors: fills.map(function (fill) {
            return fillToBgColor(fill);
          }),

          // text
          text: string,
          text_styles: attributes.map(function (_ref7) {
            var location = _ref7.location,
                length = _ref7.length,
                _ref7$attributes = _ref7.attributes;
            _ref7$attributes = _ref7$attributes === undefined ? {} : _ref7$attributes;
            var _ref7$attributes$MSAt = _ref7$attributes.MSAttributedStringFontAttribute;
            _ref7$attributes$MSAt = _ref7$attributes$MSAt === undefined ? {} : _ref7$attributes$MSAt;
            var _ref7$attributes$MSAt2 = _ref7$attributes$MSAt.attributes;
            _ref7$attributes$MSAt2 = _ref7$attributes$MSAt2 === undefined ? {} : _ref7$attributes$MSAt2;
            var name = _ref7$attributes$MSAt2.name,
                size = _ref7$attributes$MSAt2.size,
                ca = _ref7$attributes.MSAttributedStringColorAttribute;
            return {
              color: ca ? formatIntColor(ca.red, ca.green, ca.blue, ca.alpha) : 'rgba(255,255,255,1)', // default color white(web fn ok) or null(case web fn error!)?
              length: length, // no use?
              location: location, // no use?
              font_face: name,
              font_size: size
            };
          }),
          alignment: alignmentCase(alignment),
          vertical_alignment: verticalAlignmentCase(verticalAlignment),
          letter_spacing: kerning,
          line_height: minimumLineHeight,
          paragraph_spacing: paragraphSpacing,

          z: z
        };
      })
    };
  };

  var parsedObj = genArtboardObj(dupObj);
  return parsedObj;
}

var toN = function toN(e) {
  return Math.round(255 * e);
};
var formatIntColor = function formatIntColor(r, g, b, a) {
  return 'rgba(' + toN(r) + ',' + toN(g) + ',' + toN(b) + ',' + a + ')';
};

function fillTypeCase(n) {
  if (n == 0) return "color";else if (n == 1) return "gradient";
  // else if (n==2) return "Pattern"
  // else if (n==3) return "Noise"
  else return "";
}

function gradientTypeCase(n) {
  if (n == 0) return "linear";else if (n == 1) return "radial";else if (n == 2) return "angular";else return "";
}

function borderPositionCase(n) {
  if (n == 0) return "center";else if (n == 1) return "inside";else if (n == 2) return "outside";else return "";
}

function alignmentCase(n) {
  if (n == 0) return "left";else if (n == 1) return "right";else if (n == 2) return "center";else if (n == 3) return "justify";else return "";
}

function verticalAlignmentCase(n) {
  if (n == 0) return "top";else if (n == 1) return "center";else if (n == 2) return "bottom";else return "";
}

function base64(artboardId) {
  var path = __WEBPACK_IMPORTED_MODULE_1__core_js__["d" /* exportPath */] + '/' + artboardId + '/' + artboardId + '@2x.png';
  // log({base64path: path})
  var error = MOPointer.alloc().init();
  var fileProperties = NSFileManager.defaultManager().attributesOfItemAtPath_error(path, error);
  var fileSize = fileProperties[NSFileSize];
  // log({ base64fileSize: fileSize })
  var maxSize = 50 * 1024.0 * 1024.0; // 50M not allowed to upload this big data to Modao
  var rawData = fileSize.intValue() > maxSize ? "" : __WEBPACK_IMPORTED_MODULE_0__tool_js__["e" /* util */].toSafeString(NSData.dataWithContentsOfFile(path).base64EncodedStringWithOptions(32));
  return rawData;
}

// "{0.5, 0}" => {x: 0.5, y: 0}
function transGradientFromTo(str) {
  var _str$slice$split$map = str.slice(1, -1).split(',').map(function (e) {
    return Number.parseFloat(e);
  }),
      _str$slice$split$map2 = _slicedToArray(_str$slice$split$map, 2),
      x = _str$slice$split$map2[0],
      y = _str$slice$split$map2[1];

  return { x: x, y: y };
}

var compatibleGradient = function compatibleGradient(_ref8) {
  var elipseLength = _ref8.elipseLength,
      gradientType = _ref8.gradientType,
      from = _ref8.from,
      to = _ref8.to,
      stops = _ref8.stops;
  return {
    type: gradientTypeCase(gradientType),
    from: transGradientFromTo(from),
    to: transGradientFromTo(to),
    color_stops: stops.map(function (_ref9, position) {
      var _ref9$color = _ref9.color,
          red = _ref9$color.red,
          green = _ref9$color.green,
          blue = _ref9$color.blue,
          alpha = _ref9$color.alpha;
      return {
        color: Object(__WEBPACK_IMPORTED_MODULE_0__tool_js__["a" /* formatColor */])(red, green, blue, alpha),
        position: position
      };
    })
  };
};

function fillToBgColor(_ref10) {
  var isEnabled = _ref10.isEnabled,
      _ref10$color = _ref10.color;
  _ref10$color = _ref10$color === undefined ? {} : _ref10$color;
  var red = _ref10$color.red,
      green = _ref10$color.green,
      blue = _ref10$color.blue,
      alpha = _ref10$color.alpha,
      fillType = _ref10.fillType,
      gradient = _ref10.gradient,
      _ref10$contextSetting = _ref10.contextSettings;
  _ref10$contextSetting = _ref10$contextSetting === undefined ? {} : _ref10$contextSetting;
  var _ref10$contextSetting2 = _ref10$contextSetting.blendMode,
      blendMode = _ref10$contextSetting2 === undefined ? 0 : _ref10$contextSetting2,
      _ref10$contextSetting3 = _ref10$contextSetting.opacity,
      opacity = _ref10$contextSetting3 === undefined ? 1 : _ref10$contextSetting3;

  if (!isEnabled) return null;
  var type = fillTypeCase(fillType);
  if (type == "color") {
    return {
      type: type,
      blend_mode: blendMode,
      opacity: opacity,
      value: Object(__WEBPACK_IMPORTED_MODULE_0__tool_js__["a" /* formatColor */])(red, green, blue, alpha)
    };
  } else if (type == "gradient") {
    return {
      type: type,
      blend_mode: blendMode,
      opacity: opacity,
      gradient: compatibleGradient(gradient)
    };
  } else {
    // ignore
    return null;
  }
}

/***/ }),

/***/ "./src/plugin/utils/work/tool.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return util; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return formatColor; });
/* harmony export (immutable) */ __webpack_exports__["b"] = getDocumentColors;
/* harmony export (immutable) */ __webpack_exports__["d"] = getGloblalColors;
/* harmony export (immutable) */ __webpack_exports__["c"] = getDocumentTextStyles;
/* unused harmony export debugFile */
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__core_js__ = __webpack_require__("./src/plugin/utils/core.js");


var util = {
  // from framer plugin util code; please use sketch pm source code!
  toBool: function toBool(e) {
    return !!e;
  },
  toArray: function toArray(e) {
    // sketch js api has this utils.toArray
    var result = [];
    for (var i = 0; i < e.count(); i++) {
      result.push(e.objectAtIndex(i));
    }
    return result;
  },
  toObject: function toObject(e) {
    var result = {};
    for (var a in e) {
      result[a] = e[a];
    }
    return result;
  },
  toString: function toString(e) {
    return e + "";
  },
  toSafeString: function toSafeString(e) {
    return this.toString(e).replace(/[\n\r\u2028\u2029]/g, "\n");
  },
  map: function map(e, fn) {
    var result = [];
    var length = e.count ? e.count() : e.length;
    for (var i = 0; i < length; i++) {
      var a = e.objectAtIndex ? e.objectAtIndex(i) : e[i];
      result.push(fn(a, i));
    }
    return result;
  },
  filter: function filter(e, fn) {
    var result = [];
    var length = e.className && "__NSArrayM" == e.className() ? e.count() : e.length;
    for (var i = 0; i < length; i++) {
      var ok = fn(e[i], i);
      if (ok) {
        result.push(ok); // seems not filter
      }
    }
    return result;
  },
  mapSketchCollection: function mapSketchCollection(e, fn) {
    var result = [];
    for (var em = e.objectEnumerator(), n; n = em.nextObject();) {
      result.push(fn(n));
    }
    return result.reverse(); // why reverse
  },
  iterateSketchCollection: function iterateSketchCollection(e, fn) {
    for (var em = e.objectEnumerator(), n; n = em.nextObject();) {
      fn(n);
    }
  }
};

var formatColor = function formatColor(r, g, b, a) {
  return "rgba(" + r + "," + g + "," + b + "," + a + ")";
};

var version = parseFloat(NSBundle.mainBundle().objectForInfoDictionaryKey("CFBundleShortVersionString") + '');

function getDocumentColors(document) {
  // todo: 文档颜色标注没有，只有页面颜色, 自选颜色?
  return [];
  // if (version >= 53) {
  //   return []
  // }
  // const documentColors = document.valueForKeyPath('documentData.assets.colors') // error for sketch-beta53 // OFFCIAL-DOC: Color presets added to Document Colors are now included in Libraries
  // const result = util.map(documentColors, (color) => {
  //   const {r,g,b,a} = color.valueForKeyPath('RGBADictionary')
  //   return formatColor(r,g,b,a)
  // })
  // return result
}

function getGloblalColors() {
  return [];
  // if (version >= 53) {
  //   return []
  // }
  // const globalAssets = NSApp.delegate().performSelector(NSSelectorFromString('globalAssets'))
  // const globalColors = globalAssets.valueForKeyPath('colors')
  // const result = util.map(globalColors, (color) => {
  //   const {r,g,b,a} = color.valueForKeyPath('RGBADictionary')
  //   return formatColor(r,g,b,a)
  // })
  // return result
}

function getDocumentTextStyles(document) {
  return [];
  // if (version < 52) { // 51 版本没有这个js api
  //   return []
  // } else {
  //   const textStyles = document.sharedTextStyles // this has MOUndefined; cause Oc invalidJSON
  //   return textStyles
  // }
}

var debugFile = function debugFile(jsonStr, artboardId, filePathPrefix) {
  var version = NSBundle.mainBundle().objectForInfoDictionaryKey("CFBundleShortVersionString");
  var filePath = __WEBPACK_IMPORTED_MODULE_0__core_js__["d" /* exportPath */] + "/Debug/" + filePathPrefix + "_sketch" + version + "_" + artboardId + ".json"; // must first mkdir Debug
  NSString.stringWithString(jsonStr).writeToFile_atomically_encoding_error(filePath, false, 4, null);
};

// export const addLog = (jsonStr) => {
//   const version = NSBundle.mainBundle().objectForInfoDictionaryKey("CFBundleShortVersionString")
//   const filePath = `${pluginFolderPath}/Debug/sketch${version}.log`
//   NSString.stringWithString(jsonStr).writeToFile_atomically_encoding_error(filePath, false, NSUTF8StringEncoding, null)
// }

// source code from SKetchJsApi (jsType)
/*
export const Types = {
Group: 'Group',
Page: 'Page',
Artboard: 'Artboard',
Shape: 'Shape',
Style: 'Style',
Blur: 'Blur',
Border: 'Border',
BorderOptions: 'BorderOptions',
Fill: 'Fill',
Gradient: 'Gradient',
GradientStop: 'GradientStop',
Shadow: 'Shadow',
Image: 'Image',
Text: 'Text',
Document: 'Document',
Library: 'Library',
SymbolMaster: 'SymbolMaster',
SymbolInstance: 'SymbolInstance',
Override: 'Override',
ImageData: 'ImageData',
Flow: 'Flow',
HotSpot: 'HotSpot',
ImportableObject: 'ImportableObject',
SharedStyle: 'SharedStyle',
DataOverride: 'DataOverride',
ShapePath: 'ShapePath',
}
*/

/***/ }),

/***/ "./src/plugin/utils/work/work.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["e"] = firstSetDomain;
/* harmony export (immutable) */ __webpack_exports__["k"] = setDomain;
/* harmony export (immutable) */ __webpack_exports__["f"] = getDomain;
/* harmony export (immutable) */ __webpack_exports__["g"] = initRoute;
/* harmony export (immutable) */ __webpack_exports__["a"] = checkForUpdates;
/* harmony export (immutable) */ __webpack_exports__["m"] = setSelectedArtboardsNumberChan;
/* harmony export (immutable) */ __webpack_exports__["n"] = start;
/* harmony export (immutable) */ __webpack_exports__["h"] = loginUser_withPassword_inHost;
/* harmony export (immutable) */ __webpack_exports__["d"] = fetchTheData;
/* harmony export (immutable) */ __webpack_exports__["l"] = setSelected;
/* harmony export (immutable) */ __webpack_exports__["o"] = upload;
/* unused harmony export syncUpload */
/* harmony export (immutable) */ __webpack_exports__["b"] = createProject;
/* harmony export (immutable) */ __webpack_exports__["c"] = fetchCreateProjectMetaData;
/* harmony export (immutable) */ __webpack_exports__["i"] = logoutUser;
/* harmony export (immutable) */ __webpack_exports__["j"] = openInBrowser;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__core__ = __webpack_require__("./src/plugin/utils/core.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__webview__ = __webpack_require__("./src/plugin/utils/webview/index.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__tool_js__ = __webpack_require__("./src/plugin/utils/work/tool.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__parseArtboard_js__ = __webpack_require__("./src/plugin/utils/work/parseArtboard.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__webview_window__ = __webpack_require__("./src/plugin/utils/webview/window.js");
var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

__WEBPACK_IMPORTED_MODULE_1__webview__["c" /* sendWindowAction */]; // todo js source bundle (skpm??)
// NOTICE: js-string = util.toString(oc-string)
// OK:     oc-string = js-string
// use == instead of ===







// change this key when updating plugin, when data is incompatible (same logic data stored in different store)
var isAlreadyWelcomeKey = 'isAlreadyWelcome';
var isLoginKey = 'isLogin';
var domainKey = 'domain';
var groupKey = 'group' + 'org';
var subGroupKey = 'subGroup' + 'org';
var projectCidKey = 'projectCid' + 'org';

__WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(isAlreadyWelcomeKey, __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(isAlreadyWelcomeKey) || false); // first access the plugin set true
__WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(isLoginKey, __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(isLoginKey) || false);
__WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(domainKey, __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(domainKey) || '');
__WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(groupKey, __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(groupKey) || 'mine');
__WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(subGroupKey, __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(subGroupKey) || null);
__WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(projectCidKey, __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(projectCidKey) || null);

log({ isAlreadyWelcome: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(isAlreadyWelcomeKey) });
log({ isLogin: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(isLoginKey) });
log({ domain: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(domainKey) });
log({ group: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(groupKey) });
log({ subGroup: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(subGroupKey) });
log({ projectCid: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(projectCidKey) });

// The very first time open this plugin
function firstSetDomain(domain) {
  if (__WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(domainKey) == '') {
    log('firstSetDomain');
    setDomain(domain);
  }
}

// UI (init and switch domain) trigger
function setDomain(domain) {
  __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(domainKey, domain);
  log({ domain: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(domainKey) });
}

function getDomain() {
  sendTheAction('CHANGE_DOMAIN', JSON.stringify({ domain: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(domainKey) }));
}

// app UI didMount trigger
function initRoute() {
  var actualVersion = NSBundle.mainBundle().objectForInfoDictionaryKey("CFBundleShortVersionString");
  var requiredVersion = NSString.stringWithString("54");
  var incompatible = requiredVersion.compare_options(actualVersion, 64) == 1;
  var initRoute = incompatible ? "/incompatible" : !__WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(isAlreadyWelcomeKey) ? "/welcome" : !__WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(isLoginKey) ? "/login" : "/projects";

  sendTheAction('RENDER_PAGE', JSON.stringify({ route: initRoute }));
}

function checkForUpdates() {
  var r = NSApp.mainMenu().itemWithTitle("Sketch");

  /* 擦，这里， "Check For Updates…"这个字符的问题，，还是用itemAtIndex, 先查下是第几个index，必须try，否则崩溃
  let s = r.submenu().itemArray()
  log(s)
   try {
    [0,1,2,3,4,5,6,7,8].forEach(i => {
      log(r.submenu().itemAtIndex(i))
    })
  } catch(err) {
   }
  log("checkForUpdates end")
   let r2 = r.submenu().itemWithTitle("Check For Updates…")
  log(r2)
  let r2 = r.submenu().itemWithTitle("Show All")
  log(r2)
   */

  var r2 = r.submenu().itemAtIndex(4);
  NSApp.sendAction_to_from(r2.action(), null, null);
  setTimeout(function () {
    var window = Object(__WEBPACK_IMPORTED_MODULE_4__webview_window__["a" /* findWindow */])(__WEBPACK_IMPORTED_MODULE_1__webview__["e" /* windowIdentifier */]);
    window.close();
  }, 300);
}

function setSelectedArtboardsNumberChan() {
  var sortedArtboards = toSortedArtboards();
  var number = sortedArtboards.length;
  sendTheActionChan(JSON.stringify(number));
}

// welcome UI button trigger
function start() {
  var nextRoute = !__WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(isLoginKey) ? "/login" : "/projects";
  __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(isAlreadyWelcomeKey, true);
  sendTheAction('RENDER_PAGE', JSON.stringify({ route: nextRoute }));
}

// use our session to make network request (because sharedSession cookies may be cleared by other sketch-plugins, e.g: lanhu)
var mbSession = function () {
  var cookieStorage = NSHTTPCookieStorage.sharedCookieStorageForGroupContainerIdentifier('mockingbot-seCrET');

  var configuration = NSURLSessionConfiguration.defaultSessionConfiguration();
  configuration.setHTTPCookieStorage(cookieStorage);

  var session = NSURLSession.sessionWithConfiguration(configuration);
  return session;
}();

function mbFetch(request, completionHandler) {
  return new Promise(function (resolve, reject) {
    var task = mbSession.dataTaskWithRequest_completionHandler(request, __mocha__.createBlock_function('v32@?0@"NSData"8@"NSURLResponse"16@"NSError"24', function (data, response, error) {
      completionHandler(resolve, reject)(data, response, error);
    }));
    task.resume();
  });
}

// login UI button trigger
function loginUser_withPassword_inHost(email, password) {
  var domain = __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(domainKey);
  var request = NSMutableURLRequest.new();
  request.setHTTPMethod("POST");
  request.setURL(NSURL.URLWithString(domain + '/api/sketch/v3/signin')); // cann't access mockingbot.com and mockingbot.in although I set gc to these tree doamin in /etc/hosts
  request.setValue_forHTTPHeaderField("application/x-www-form-urlencoded", "Content-Type");
  var email2 = encodeURIComponent(email);
  var password2 = encodeURIComponent(password);
  var postStr = 'email=' + email2 + '&password=' + password2;
  var postStr2 = NSString.stringWithString(postStr); // must! // todo: use textField value
  var postData = postStr2.dataUsingEncoding(4);
  request.setHTTPBody(postData);

  mbFetch(request, function (resolve, reject) {
    return function (data, response, error) {
      if (error) {
        sendTheAction('FAIL_TO_LOGIN', JSON.stringify({ code: 4 }));
        return;
      }
      var responseJsonStr = NSString.alloc().initWithData_encoding(data, 4); // :NSString
      var responseJson = JSON.parse(responseJsonStr); // :[js]Object
      // 请求成功后，后端rails只有下面这两种情况
      if (responseJson.success == 0) {
        // not success
        sendTheAction('FAIL_TO_LOGIN', JSON.stringify({ code: 403 })); // 后端返回的是 { { success: 0 }, status: 403 }
      } else if (responseJson.success == 1) {
        // success
        __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(isLoginKey, true);
        sendTheAction('RENDER_PAGE', JSON.stringify({ route: '/projects' }));
      } else {
        log("impossible");
      }
    };
  });
}

async function fetchData(url) {
  var domain = __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(domainKey);
  var request = NSMutableURLRequest.new();
  request.setHTTPMethod("GET");
  request.setURL(NSURL.URLWithString(domain + '/' + url)); // must .json otherwise not 403 but jump to sign and get 200

  return mbFetch(request, function (resolve, reject) {
    return function (data, response, error) {
      if (error) {
        sendTheAction('FAIL_TO_FETCH_DATA', JSON.stringify({ code: 1 }));
        reject(Error('fetchData network error'));
        return;
      }
      var statusCode = response.statusCode();
      if (statusCode >= 400) {
        // e.g. 403
        sendTheAction('FAIL_TO_FETCH_DATA', JSON.stringify({ code: statusCode }));
        reject(Error('fetchData response statusCode: ' + statusCode));
        return;
      }
      if (!data) {
        // Notice: TRUE when change domain(modao.cc) ip  (e.g: change /etc/hosts of your machine)
        sendTheAction('FAIL_TO_FETCH_DATA', JSON.stringify({ code: 2 }));
        reject(Error('fetchData data is null'));
        return;
      }
      // from Mocha Doc: NSString instances will convert to String appropriately
      try {
        var responseJsonStr = NSString.alloc().initWithData_encoding(data, 4); // :NSString
        var responseJson = JSON.parse(responseJsonStr); // :jsObjec
        resolve(responseJson);
      } catch (err) {
        // an exception: {err: SyntaxError: JSON Parse error: Unrecognized token '<'}
        console.error({ err: err });
        sendTheAction('FAIL_TO_FETCH_DATA', JSON.stringify({ code: 3 }));
        reject(Error('fetchData data is broken'));
        return;
      }
    };
  });
}

// const byLatest = (a,b) => moment(b.updated_at) - moment(a.updated_at)
var byLatest = function byLatest(a, b) {
  return Number.parseInt(b.timestamp) - Number.parseInt(a.timestamp);
}; // todo: not timestamp(this is created_at)(use timestamp of updated_at)

// project UI didMount trigger && project UI refresh button trigger
// CAUTION: group, subGroup, projectCid is mutable (always directly use Settings.settingForKey('xx'), because it is the latest data)
async function fetchTheData() {
  // 网络请求原子化；避免数据不一致！
  try {
    log({
      beforeFetchTheData: {
        selected: {
          group: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(groupKey),
          subGroup: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(subGroupKey),
          projectCid: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(projectCidKey)
        }
      }
    });

    var _ref = await fetchData('api/sketch/v3/dashboard/initial'),
        user = _ref.user,
        orgs = _ref.orgs;

    var notLockedProject = function notLockedProject(project) {
      return !project.archived;
    }; // 2.加入项目组的已锁定项目,不应该可以上传 [屏蔽掉]
    var disposeProjects = function disposeProjects(projects) {
      return projects.filter(notLockedProject).sort(byLatest);
    };

    // group is orgCid, subGroup is teamCid

    var _ref2 = __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(groupKey) == 'mine' ? await fetchData('api/sketch/v3/dashboard/me/teams.json') : await fetchData('api/sketch/v3/dashboard/orgs/' + __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(groupKey) + '.json'),
        teamsOrigin = _ref2.teams;

    var accessibleTeam = function accessibleTeam(team) {
      var accessibleUserIds = Object.keys(team.accesses).map(function (id) {
        return Number.parseInt(id);
      });
      return accessibleUserIds.includes(user.id);
    };
    var notLockedTeam = function notLockedTeam(team) {
      return !team.archived;
    };
    var teamCompareFunction = function teamCompareFunction(team1, team2) {
      return -(new Date(team1.updated_at).valueOf() - new Date(team2.updated_at).valueOf());
    };

    var teams = __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(groupKey) == 'mine' ? teamsOrigin.filter(notLockedTeam) // 3.已锁定项目组,不应该创建项目及上传 [屏蔽掉]
    .sort(teamCompareFunction) : teamsOrigin.filter(accessibleTeam) // 1.企业中未加入的公开项目组,不应该有创建项目及上传权限 [屏蔽掉]
    .filter(notLockedTeam) // 3.已锁定项目组,不应该创建项目及上传 [屏蔽掉]
    .sort(teamCompareFunction);

    if (__WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(subGroupKey) == null) {
      if (teams.length > 0) {
        // 可能的话，选中第一个team
        __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(subGroupKey, teams[0].cid);

        var _ref3 = await fetchData('api/sketch/v3/dashboard/teams/' + __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(subGroupKey) + '.json'),
            projects = _ref3.projects;

        sendTheAction('RECEIVE_PROJECTS', JSON.stringify({
          projects: disposeProjects(projects),
          teams: teams,
          orgs: orgs,
          user: user,
          selected: {
            group: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(groupKey),
            subGroup: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(subGroupKey),
            projectCid: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(projectCidKey)
          }
        }));
      } else {
        sendTheAction('RECEIVE_PROJECTS', JSON.stringify({
          projects: [],
          teams: teams,
          orgs: orgs,
          user: user,
          selected: {
            group: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(groupKey),
            subGroup: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(subGroupKey),
            projectCid: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(projectCidKey)
          }
        }));
      }
    } else {
      var _ref4 = await fetchData('api/sketch/v3/dashboard/teams/' + __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(subGroupKey) + '.json'),
          _projects = _ref4.projects;

      sendTheAction('RECEIVE_PROJECTS', JSON.stringify({
        projects: disposeProjects(_projects),
        teams: teams,
        orgs: orgs,
        user: user,
        selected: {
          group: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(groupKey),
          subGroup: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(subGroupKey),
          projectCid: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(projectCidKey)
        }
      }));
    }
  } catch (err) {
    log({ fetchTheDataErr: err });
    // 数据异常，就重置selected
    __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(groupKey, 'mine');
    __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(subGroupKey, null);
    __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(projectCidKey, null);
  } finally {
    log({
      afterFetchTheData: {
        selected: {
          group: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(groupKey),
          subGroup: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(subGroupKey),
          projectCid: __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(projectCidKey)
        }
      }
    });
  }
}

// select !
function setSelected(group, subGroup, projectCid) {
  log({ setSelected: { group: group, subGroup: subGroup, projectCid: projectCid } });

  // Opt: 只是更改了projectCid(或什么都没有更改) [也就是group和subGroup没有改变], 那就只更新 { selected: projectCid } (不重新获取网络数据)
  if (group == __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(groupKey) && subGroup == __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(subGroupKey)) {
    __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(projectCidKey, projectCid);
    sendTheAction('SELECT', JSON.stringify({
      selected: { group: group, subGroup: subGroup, projectCid: projectCid }
    }));
    return;
  }

  __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(groupKey, group);
  __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(subGroupKey, subGroup);
  __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(projectCidKey, projectCid);

  fetchTheData();
}

function getArtboardFromLayer(layer) {
  if (layer.sketchObject.class() == MSSliceLayer) {
    return null;
  }

  if (layer.type == __WEBPACK_IMPORTED_MODULE_0__core__["g" /* sketch */].Types.Artboard) {
    return layer;
  } else if (layer.parent.type == __WEBPACK_IMPORTED_MODULE_0__core__["g" /* sketch */].Types.Artboard) {
    return layer.parent;
  } else if (layer.parent.type == __WEBPACK_IMPORTED_MODULE_0__core__["g" /* sketch */].Types.Page) {
    return null;
  } else if (layer.parent.type == __WEBPACK_IMPORTED_MODULE_0__core__["g" /* sketch */].Types.Group) {
    return getArtboardFromLayer(layer.parent);
  } else {
    // log('getArtboardFromLayer impossible case')
    return null;
  }
}

function removeDupWithProp(arr, prop) {
  var result = [];
  var set = new Set([]);
  arr.forEach(function (obj) {
    var val = obj['' + prop];
    if (!set.has(val)) {
      result.push(obj);
      set.add(val);
    }
  });
  return result;
}

function toSortedArtboards() {
  var r1 = __WEBPACK_IMPORTED_MODULE_2__tool_js__["e" /* util */].toArray(__WEBPACK_IMPORTED_MODULE_0__core__["b" /* context */].selection);

  // log({ context_selection: context.selection })

  var r2 = r1.map(function (layer) {
    return getArtboardFromLayer(__WEBPACK_IMPORTED_MODULE_0__core__["g" /* sketch */].fromNative(layer));
  });
  var r3 = r2.filter(function (artboard) {
    return artboard != null;
  });
  var r4 = removeDupWithProp(r3, 'id');
  // 默认的顺序就是对的；默认的顺序是: Sketch的artboards树下面的(表示先创建的artboard)排在前面, 先上传，排在墨刀的screen的上面。
  return r4;
}

function detachSymbolAndRemoveHidden(layer) {
  if (layer == null) {
    // some symbol is empty (has nothing in it); so it has no sketchObject!
    // log('detachSymbol:layer==null')
    return;
  }

  if (layer.sketchObject.class() == MSSliceLayer) {
    // 现在不清楚是啥.. 暂时屏蔽了
    // log('detachSymbol:layer-MSSliceLayer')
    return;
  }

  if (layer.hidden) {
    // log(`layer.hidden detachSymbol; layerId: ${layer.id}`)
    layer.remove(); // remove all hidden layers before
    return;
  }

  // log(`begin_detachSymbol: ${layer.name}, ${layer.type}`)
  // any more? test!
  // Notice, must ==; not == !!!  (sketch.Types.Artboard == 'Artboard') (sketch.Types.Artboard !== 'Artboard')
  // https://github.com/turbobabr/Sketch-Plugins-Cookbook

  if (layer.type == __WEBPACK_IMPORTED_MODULE_0__core__["g" /* sketch */].Types.Artboard || layer.type == __WEBPACK_IMPORTED_MODULE_0__core__["g" /* sketch */].Types.Group) {
    // or use if(layer.layers) ?
    // log(`detachSymbol Group: ${layer.name}`)
    layer.layers.forEach(function (l) {
      return detachSymbolAndRemoveHidden(l);
    });
  } else if (layer.type == __WEBPACK_IMPORTED_MODULE_0__core__["g" /* sketch */].Types.SymbolInstance) {
    // log(`detachSymbol SymbolInstance: ${layer.name}`)
    var group = layer.detach();
    detachSymbolAndRemoveHidden(group);
  }
}

var hackNoLayerId = '_noLayerId'; // Compatible for backend; (new no layerId in url cause detached symbole layerId not the same, it'll waste Qiniu disk)

function getPluginVersion() {
  var macOSVersion = NSProcessInfo.processInfo().operatingSystemVersionString();
  var sketchVersion = NSBundle.mainBundle().objectForInfoDictionaryKey("CFBundleShortVersionString");
  var packageJson = __webpack_require__("./package.json");
  var pluginVersion = 'macOS ' + macOSVersion + '/sketch ' + sketchVersion + '/plugin ' + packageJson.version;
  return pluginVersion;
}

// project UI export button trigger
async function upload(projectCid) {
  var token = void 0;
  try {
    // prepare all async data, make syncUpload simple
    token = await getToken();
    syncUpload(token)(projectCid);
  } catch (err) {
    console.log({ err: err });
  }
}

var syncUpload = function syncUpload(token) {
  return function (projectCid) {
    var sortedArtboards = toSortedArtboards();

    // 初始化ui的progress数据
    sendTheAction("EXPORT", JSON.stringify({
      artboards: sortedArtboards.map(function (artboard) {
        return {
          id: __WEBPACK_IMPORTED_MODULE_2__tool_js__["e" /* util */].toString(artboard.id),
          name: __WEBPACK_IMPORTED_MODULE_2__tool_js__["e" /* util */].toString(artboard.name),
          status: "notCompleted"
        };
      })
    }));

    sortedArtboards.forEach(function (artboard) {
      setTimeout(function () {

        var page = artboard.parent.sketchObject;
        var indexPosition = page.layers().indexOfObject(artboard.sketchObject) + 1;
        var artboardName = __WEBPACK_IMPORTED_MODULE_2__tool_js__["e" /* util */].toString(artboard.name); // must util.toString; otherwise data wrong
        var artboardId = __WEBPACK_IMPORTED_MODULE_2__tool_js__["e" /* util */].toString(artboard.id);

        var exportOption = {
          formats: 'png',
          output: __WEBPACK_IMPORTED_MODULE_0__core__["d" /* exportPath */] + '/' + artboardId,
          overwriting: true,
          'use-id-for-name': true, //todo: name or id?
          'save-for-web': false //todo
        };

        var artboardExportOption = _extends({}, exportOption, { scales: '2' });
        __WEBPACK_IMPORTED_MODULE_0__core__["g" /* sketch */].export(artboard, artboardExportOption);

        var object = __WEBPACK_IMPORTED_MODULE_0__core__["g" /* sketch */].fromNative(artboard)._object;
        var dup = object.copy();

        try {
          object.parentGroup().insertLayers_afterLayer([dup], object);

          detachSymbolAndRemoveHidden(__WEBPACK_IMPORTED_MODULE_0__core__["g" /* sketch */].fromNative(dup)); // Notice! Here use js type identifier! SketchJSAPI 优先

          __WEBPACK_IMPORTED_MODULE_1__webview__["a" /* mbQiniu */].archiveStr_withCallback(dup.immutableModelObject(), function (dupObjStr) {
            var dupObj = JSON.parse(dupObjStr);

            // debugFile(dupObjStr, artboardId, "dupObj") // Notice! 这里应该已经移除了hidden的，但是还是有layer的isVisibility是false;; 不明白！[但是后面export不应该再过滤hidden的了]
            var artboardObj = Object(__WEBPACK_IMPORTED_MODULE_3__parseArtboard_js__["a" /* parseArtboard */])(dupObj, artboardId, indexPosition); // only json data transformation

            // Notice: "true", not true
            var exportableLayers = artboardObj.layers.filter(function (l) {
              return l.exportable == "true";
            });

            // *2 because each exportable layer has twice mbQiniu.upload(one png, one zip)
            var exportableSum = exportableLayers.length * 2;
            sendTheAction('QINIU_EXPECT_SUM', JSON.stringify({ sum: exportableSum }));

            // slices: *1 default; exportable to zip
            var slices_md5s = [];

            var exportExportableImpl = function exportExportableImpl(layer) {
              var lId = __WEBPACK_IMPORTED_MODULE_2__tool_js__["e" /* util */].toString(layer.objectID());
              var lName = __WEBPACK_IMPORTED_MODULE_2__tool_js__["e" /* util */].toString(layer.name()).replace(/[\/\\#,+()$~%.:*?<>{}]/g, "_");

              if (!exportableLayers.find(function (l) {
                return l.objectID == lId;
              })) {
                return;
              }

              // because js api can't specify export file name exactly(otherwise you have to manally rename file @15x !!), here use oc api
              var formatArr = [[1, '@1x'], [1.5, '@15x'], [2, '@2x'], [3, '@3x']]; // js bug? use [...].forEach  need ; before
              formatArr.forEach(function (_ref5) {
                var _ref6 = _slicedToArray(_ref5, 2),
                    scale = _ref6[0],
                    suffix = _ref6[1];

                var slice = MSExportRequest.exportRequestsFromExportableLayer(layer).firstObject();
                slice.format = "png";
                slice.scale = scale;
                var fileName = __WEBPACK_IMPORTED_MODULE_0__core__["d" /* exportPath */] + '/' + artboardId + '/' + lId + '/zip/' + lName + suffix + '.png';
                __WEBPACK_IMPORTED_MODULE_0__core__["b" /* context */].document.saveArtboardOrSlice_toFile(slice, fileName);
              });

              var filePath = __WEBPACK_IMPORTED_MODULE_0__core__["d" /* exportPath */] + '/' + artboardId + '/' + lId + '/zip/' + lName + '@1x.png';
              var pngmd5 = __WEBPACK_IMPORTED_MODULE_2__tool_js__["e" /* util */].toString(__WEBPACK_IMPORTED_MODULE_1__webview__["a" /* mbQiniu */].md5EncodeFromData(NSData.dataWithContentsOfFile(filePath)));
              var key = projectCid + '/' + artboardId + '/layer-' + pngmd5 + '.png'; // todo: only {png.md5}.png; no layer.png
              __WEBPACK_IMPORTED_MODULE_1__webview__["a" /* mbQiniu */].upload_withToken_andKey(filePath, token, key); // this is async executed by QiniuSDK

              var dirPath = __WEBPACK_IMPORTED_MODULE_0__core__["d" /* exportPath */] + '/' + artboardId + '/' + lId + '/zip/';
              var zipPath = __WEBPACK_IMPORTED_MODULE_0__core__["d" /* exportPath */] + '/' + artboardId + '/' + lId + '/layer.zip';
              SSZipArchive.createZipFileAtPath_withContentsOfDirectory(zipPath, dirPath);
              var zipmd5 = __WEBPACK_IMPORTED_MODULE_2__tool_js__["e" /* util */].toString(__WEBPACK_IMPORTED_MODULE_1__webview__["a" /* mbQiniu */].md5EncodeFromData(NSData.dataWithContentsOfFile(zipPath)));
              var zipKey = projectCid + '/' + artboardId + '/layer-' + zipmd5 + '.zip';
              __WEBPACK_IMPORTED_MODULE_1__webview__["a" /* mbQiniu */].upload_withToken_andKey(zipPath, token, zipKey);

              slices_md5s.push({
                md5: {
                  png: pngmd5 + hackNoLayerId,
                  zip: zipmd5 + hackNoLayerId
                },
                objectID: lId
              });
            };

            var exportExportable = function exportExportable(layer) {
              if (layer.layers) {
                if (layer.type != __WEBPACK_IMPORTED_MODULE_0__core__["g" /* sketch */].Types.Artboard) {
                  // artboard本身不上传七牛；
                  exportExportableImpl(layer.sketchObject);
                }
                layer.layers.forEach(function (l) {
                  exportExportable(l);
                });
              } else {
                exportExportableImpl(layer.sketchObject);
              }
            };

            if (exportableSum > 0) {
              exportExportable(__WEBPACK_IMPORTED_MODULE_0__core__["g" /* sketch */].fromNative(dup));
            }

            var info = {
              plugin_version: getPluginVersion(),
              project_cid: projectCid,
              timestamp: NSDate.date().timeIntervalSince1970() + '',
              document_colors: Object(__WEBPACK_IMPORTED_MODULE_2__tool_js__["b" /* getDocumentColors */])(__WEBPACK_IMPORTED_MODULE_0__core__["b" /* context */].document),
              global_colors: Object(__WEBPACK_IMPORTED_MODULE_2__tool_js__["d" /* getGloblalColors */])(),
              text_styles: Object(__WEBPACK_IMPORTED_MODULE_2__tool_js__["c" /* getDocumentTextStyles */])(__WEBPACK_IMPORTED_MODULE_0__core__["g" /* sketch */].fromNative(__WEBPACK_IMPORTED_MODULE_0__core__["c" /* document */])), // new
              slices_md5s: slices_md5s,
              artboard: artboardObj
            };

            var artboardPngPath = __WEBPACK_IMPORTED_MODULE_0__core__["d" /* exportPath */] + '/' + artboardId + '/' + artboardId + '@2x.png';
            __WEBPACK_IMPORTED_MODULE_1__webview__["a" /* mbQiniu */].createArtboard_withPngPath_withDomain_withId_withName_withSession(info, artboardPngPath, __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(domainKey), artboardId, artboardName, mbSession);

            // for debug
            sendTheAction("SYNC_DONE_POST_REQUEST_COMMITED", JSON.stringify({
              name: artboardName
            }));
          });
        } catch (error) {
          var errorInfo = {
            pluginVersion: getPluginVersion(),
            stack: error.stack, // 放前面 网页上好直接查看
            error: error
          };
          __WEBPACK_IMPORTED_MODULE_1__webview__["a" /* mbQiniu */].sendSentryEvent(JSON.stringify(errorInfo));
          sendTheAction("CREATE_ARTBOARD_RESULT", JSON.stringify({
            id: artboardId,
            name: artboardName,
            status: "failed",
            code: 3
          }));
        } finally {
          object.parentGroup().removeLayer(dup);
        }
      }, 1);
    });
  };
};

// only this file, add date to debug log timeline
// function log(obj) {
//   var date = NSDate.date()
//
//   var dateFormat = NSDateFormatter.alloc().init()
//   dateFormat.setDateFormat("yyyy-MM-dd HH:mm:ss:SSS")
//
//   var newdate = dateFormat.stringFromDate(date)
//
//   console.log(JSON.stringify({
//     [newdate]: JSON.stringify(obj)
//   }))
// }

// create a new project and export button trigger (then client export...)
function createProject(params) {
  var domain = __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(domainKey);
  var request = NSMutableURLRequest.new();
  request.setHTTPMethod("POST");
  request.setURL(NSURL.URLWithString(domain + '/api/sketch/v3/project_upper/project_basics/' + params.cid));
  request.setValue_forHTTPHeaderField("application/json", "Content-Type");
  var jsonData = NSJSONSerialization.dataWithJSONObject_options_error(params, null, null);
  request.setHTTPBody(jsonData);

  mbFetch(request, function (resolve, reject) {
    return function (data, response, error) {
      if (error) {
        sendTheAction('CREATE_PROJECT_FAIL', JSON.stringify({ code: 1 }));
        return;
      }
      var statusCode = response.statusCode();
      if (statusCode >= 400) {
        // e.g. 403 | 422
        sendTheAction('CREATE_PROJECT_FAIL', JSON.stringify({ code: statusCode }));
        return;
      }
      var responseJsonStr = NSString.alloc().initWithData_encoding(data, 4); // :NSString
      var responseJson = JSON.parse(responseJsonStr); // :jsObject
      var result = responseJson.result;

      if (result == 'success') {
        sendTheAction('CREATE_PROJECT_SUCCESS', JSON.stringify({ projectCid: params.cid }));
      } else {
        sendTheAction('CREATE_PROJECT_FAIL', JSON.stringify({ code: 2 })); // impossible!?
      }
    };
  });
}

async function fetchCreateProjectMetaData(lang) {
  // en | zh-CN
  // For directly test data & UI
  // const metaData = { testJson }

  var metaData = await fetchData('api/sketch/v3/project_data/devices.json');
  sendTheAction('FETCH_CREATE_PROJECT_META_DATA_SUCCEED', JSON.stringify(metaData));
}

// project UI logout button trigger
function logoutUser() {
  // clear cache
  // Settings.setSettingForKey(isAlreadyWelcomeKey, false)
  __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(isLoginKey, false);
  // Settings.setSettingForKey(domainKey, '')
  __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(groupKey, 'mine');
  __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(subGroupKey, null);
  __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].setSettingForKey(projectCidKey, null);

  sendTheAction('RENDER_PAGE', JSON.stringify({ route: '/login' }));
}

function openInBrowser(urlString) {
  var domain = __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(domainKey);
  var url = NSURL.URLWithString(domain + urlString);
  NSWorkspace.sharedWorkspace().openURL(url);
}

function sendTheAction(name) {
  var payload = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "{}";

  Object(__WEBPACK_IMPORTED_MODULE_1__webview__["c" /* sendWindowAction */])(__WEBPACK_IMPORTED_MODULE_1__webview__["e" /* windowIdentifier */], name, payload);
}

function sendTheActionChan(msg) {
  Object(__WEBPACK_IMPORTED_MODULE_1__webview__["d" /* sendWindowActionChan */])(__WEBPACK_IMPORTED_MODULE_1__webview__["e" /* windowIdentifier */], msg);
}

function getToken() {
  var domain = __WEBPACK_IMPORTED_MODULE_0__core__["a" /* Settings */].settingForKey(domainKey);
  var request = NSMutableURLRequest.new();
  request.setHTTPMethod("POST");
  request.setURL(NSURL.URLWithString(domain + '/api/sketch/v3/qiniu/uptoken'));

  return mbFetch(request, function (resolve, reject) {
    return function (data, response, error) {
      if (error) {
        sendTheAction('FAIL_TO_EXPORT_NETWORK_ERROR', JSON.stringify({ code: 4 }));
        reject(Error('FAIL_TO_EXPORT_NETWORK_ERROR'));
        return;
      }
      var responseJsonStr = NSString.alloc().initWithData_encoding(data, 4); // :NSString
      var responseJson = JSON.parse(responseJsonStr); // :jsObject
      resolve(responseJson.token);
    };
  });
}

/***/ }),

/***/ "sketch/dom":
/***/ (function(module, exports) {

module.exports = require("sketch/dom");

/***/ }),

/***/ "sketch/settings":
/***/ (function(module, exports) {

module.exports = require("sketch/settings");

/***/ }),

/***/ "sketch/ui":
/***/ (function(module, exports) {

module.exports = require("sketch/ui");

/***/ })

/******/ });

var openWindow = handlers.openWindow;