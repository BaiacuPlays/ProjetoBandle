"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_document";
exports.ids = ["pages/_document"];
exports.modules = {

/***/ "./pages/_document.js":
/*!****************************!*\
  !*** ./pages/_document.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_document__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/document */ \"./node_modules/next/document.js\");\n/* harmony import */ var next_document__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_document__WEBPACK_IMPORTED_MODULE_1__);\n\n\nclass MyDocument extends (next_document__WEBPACK_IMPORTED_MODULE_1___default()) {\n    static async getInitialProps(ctx) {\n        const initialProps = await next_document__WEBPACK_IMPORTED_MODULE_1___default().getInitialProps(ctx);\n        return {\n            ...initialProps\n        };\n    }\n    render() {\n        return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.Html, {\n            lang: \"pt-BR\",\n            children: [\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.Head, {\n                    children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"script\", {\n                        dangerouslySetInnerHTML: {\n                            __html: `\n              try {\n                // Verificar primeiro o localStorage\n                const savedSettings = localStorage.getItem('bandle_settings');\n                let language = null;\n\n                if (savedSettings) {\n                  const parsedSettings = JSON.parse(savedSettings);\n                  if (parsedSettings.language) {\n                    language = parsedSettings.language;\n                  }\n                }\n\n                // Verificar cookie como fallback\n                if (!language) {\n                  const cookies = document.cookie.split(';');\n                  for (let i = 0; i < cookies.length; i++) {\n                    const cookie = cookies[i].trim();\n                    if (cookie.startsWith('bandle_language=')) {\n                      language = cookie.substring('bandle_language='.length);\n                      break;\n                    }\n                  }\n                }\n\n                // Aplicar o idioma\n                if (language) {\n                  document.documentElement.lang = language;\n                  console.log('Idioma aplicado pelo _document.js:', language);\n\n                  // Se o idioma veio do cookie, mas não está no localStorage, salvá-lo\n                  if (!savedSettings || !JSON.parse(savedSettings).language) {\n                    const defaultSettings = {\n                      daltonicMode: false,\n                      sound: true,\n                      animations: true,\n                      language: language\n                    };\n                    localStorage.setItem('bandle_settings', JSON.stringify(defaultSettings));\n                    console.log('Configurações salvas do cookie para localStorage:', defaultSettings);\n                  } else if (savedSettings) {\n                    // Se já existe configurações no localStorage, atualizar o idioma\n                    try {\n                      const settings = JSON.parse(savedSettings);\n                      if (settings.language !== language) {\n                        settings.language = language;\n                        localStorage.setItem('bandle_settings', JSON.stringify(settings));\n                        console.log('Idioma atualizado no localStorage:', settings);\n                      }\n                    } catch (e) {\n                      console.error('Erro ao atualizar idioma no localStorage:', e);\n                    }\n                  }\n                }\n              } catch (e) {\n                console.error('Erro ao aplicar idioma em _document.js:', e);\n              }\n            `\n                        }\n                    }, void 0, false, {\n                        fileName: \"E:\\\\Bandle\\\\pages\\\\_document.js\",\n                        lineNumber: 14,\n                        columnNumber: 11\n                    }, this)\n                }, void 0, false, {\n                    fileName: \"E:\\\\Bandle\\\\pages\\\\_document.js\",\n                    lineNumber: 12,\n                    columnNumber: 9\n                }, this),\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"body\", {\n                    children: [\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.Main, {}, void 0, false, {\n                            fileName: \"E:\\\\Bandle\\\\pages\\\\_document.js\",\n                            lineNumber: 76,\n                            columnNumber: 11\n                        }, this),\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_document__WEBPACK_IMPORTED_MODULE_1__.NextScript, {}, void 0, false, {\n                            fileName: \"E:\\\\Bandle\\\\pages\\\\_document.js\",\n                            lineNumber: 77,\n                            columnNumber: 11\n                        }, this)\n                    ]\n                }, void 0, true, {\n                    fileName: \"E:\\\\Bandle\\\\pages\\\\_document.js\",\n                    lineNumber: 75,\n                    columnNumber: 9\n                }, this)\n            ]\n        }, void 0, true, {\n            fileName: \"E:\\\\Bandle\\\\pages\\\\_document.js\",\n            lineNumber: 11,\n            columnNumber: 7\n        }, this);\n    }\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MyDocument);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fZG9jdW1lbnQuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQXVFO0FBRXZFLE1BQU1LLG1CQUFtQkwsc0RBQVFBO0lBQy9CLGFBQWFNLGdCQUFnQkMsR0FBRyxFQUFFO1FBQ2hDLE1BQU1DLGVBQWUsTUFBTVIsb0VBQXdCLENBQUNPO1FBQ3BELE9BQU87WUFBRSxHQUFHQyxZQUFZO1FBQUM7SUFDM0I7SUFFQUMsU0FBUztRQUNQLHFCQUNFLDhEQUFDUiwrQ0FBSUE7WUFBQ1MsTUFBSzs7OEJBQ1QsOERBQUNSLCtDQUFJQTs4QkFFSCw0RUFBQ1M7d0JBQU9DLHlCQUF5Qjs0QkFDL0JDLFFBQVEsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1lBeURULENBQUM7d0JBQ0g7Ozs7Ozs7Ozs7OzhCQUVGLDhEQUFDQzs7c0NBQ0MsOERBQUNYLCtDQUFJQTs7Ozs7c0NBQ0wsOERBQUNDLHFEQUFVQTs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFJbkI7QUFDRjtBQUVBLGlFQUFlQyxVQUFVQSxFQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vam9nby1sb2JieS1vbmxpbmUvLi9wYWdlcy9fZG9jdW1lbnQuanM/NTM4YiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRG9jdW1lbnQsIHsgSHRtbCwgSGVhZCwgTWFpbiwgTmV4dFNjcmlwdCB9IGZyb20gJ25leHQvZG9jdW1lbnQnO1xuXG5jbGFzcyBNeURvY3VtZW50IGV4dGVuZHMgRG9jdW1lbnQge1xuICBzdGF0aWMgYXN5bmMgZ2V0SW5pdGlhbFByb3BzKGN0eCkge1xuICAgIGNvbnN0IGluaXRpYWxQcm9wcyA9IGF3YWl0IERvY3VtZW50LmdldEluaXRpYWxQcm9wcyhjdHgpO1xuICAgIHJldHVybiB7IC4uLmluaXRpYWxQcm9wcyB9O1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8SHRtbCBsYW5nPVwicHQtQlJcIj5cbiAgICAgICAgPEhlYWQ+XG4gICAgICAgICAgey8qIFNjcmlwdCBwYXJhIGNhcnJlZ2FyIG8gaWRpb21hIGRvIGxvY2FsU3RvcmFnZSBhbnRlcyBkZSByZW5kZXJpemFyIGEgcMOhZ2luYSAqL31cbiAgICAgICAgICA8c2NyaXB0IGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7XG4gICAgICAgICAgICBfX2h0bWw6IGBcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBWZXJpZmljYXIgcHJpbWVpcm8gbyBsb2NhbFN0b3JhZ2VcbiAgICAgICAgICAgICAgICBjb25zdCBzYXZlZFNldHRpbmdzID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2JhbmRsZV9zZXR0aW5ncycpO1xuICAgICAgICAgICAgICAgIGxldCBsYW5ndWFnZSA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICBpZiAoc2F2ZWRTZXR0aW5ncykge1xuICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkU2V0dGluZ3MgPSBKU09OLnBhcnNlKHNhdmVkU2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlZFNldHRpbmdzLmxhbmd1YWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlID0gcGFyc2VkU2V0dGluZ3MubGFuZ3VhZ2U7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVmVyaWZpY2FyIGNvb2tpZSBjb21vIGZhbGxiYWNrXG4gICAgICAgICAgICAgICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgY29va2llcyA9IGRvY3VtZW50LmNvb2tpZS5zcGxpdCgnOycpO1xuICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb29raWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvb2tpZSA9IGNvb2tpZXNbaV0udHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29va2llLnN0YXJ0c1dpdGgoJ2JhbmRsZV9sYW5ndWFnZT0nKSkge1xuICAgICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlID0gY29va2llLnN1YnN0cmluZygnYmFuZGxlX2xhbmd1YWdlPScubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEFwbGljYXIgbyBpZGlvbWFcbiAgICAgICAgICAgICAgICBpZiAobGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5sYW5nID0gbGFuZ3VhZ2U7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnSWRpb21hIGFwbGljYWRvIHBlbG8gX2RvY3VtZW50LmpzOicsIGxhbmd1YWdlKTtcblxuICAgICAgICAgICAgICAgICAgLy8gU2UgbyBpZGlvbWEgdmVpbyBkbyBjb29raWUsIG1hcyBuw6NvIGVzdMOhIG5vIGxvY2FsU3RvcmFnZSwgc2FsdsOhLWxvXG4gICAgICAgICAgICAgICAgICBpZiAoIXNhdmVkU2V0dGluZ3MgfHwgIUpTT04ucGFyc2Uoc2F2ZWRTZXR0aW5ncykubGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVmYXVsdFNldHRpbmdzID0ge1xuICAgICAgICAgICAgICAgICAgICAgIGRhbHRvbmljTW9kZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgc291bmQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICBsYW5ndWFnZTogbGFuZ3VhZ2VcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2JhbmRsZV9zZXR0aW5ncycsIEpTT04uc3RyaW5naWZ5KGRlZmF1bHRTZXR0aW5ncykpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQ29uZmlndXJhw6fDtWVzIHNhbHZhcyBkbyBjb29raWUgcGFyYSBsb2NhbFN0b3JhZ2U6JywgZGVmYXVsdFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2F2ZWRTZXR0aW5ncykge1xuICAgICAgICAgICAgICAgICAgICAvLyBTZSBqw6EgZXhpc3RlIGNvbmZpZ3VyYcOnw7VlcyBubyBsb2NhbFN0b3JhZ2UsIGF0dWFsaXphciBvIGlkaW9tYVxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzID0gSlNPTi5wYXJzZShzYXZlZFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3MubGFuZ3VhZ2UgIT09IGxhbmd1YWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncy5sYW5ndWFnZSA9IGxhbmd1YWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2JhbmRsZV9zZXR0aW5ncycsIEpTT04uc3RyaW5naWZ5KHNldHRpbmdzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnSWRpb21hIGF0dWFsaXphZG8gbm8gbG9jYWxTdG9yYWdlOicsIHNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvIGFvIGF0dWFsaXphciBpZGlvbWEgbm8gbG9jYWxTdG9yYWdlOicsIGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJybyBhbyBhcGxpY2FyIGlkaW9tYSBlbSBfZG9jdW1lbnQuanM6JywgZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGBcbiAgICAgICAgICB9fSAvPlxuICAgICAgICA8L0hlYWQ+XG4gICAgICAgIDxib2R5PlxuICAgICAgICAgIDxNYWluIC8+XG4gICAgICAgICAgPE5leHRTY3JpcHQgLz5cbiAgICAgICAgPC9ib2R5PlxuICAgICAgPC9IdG1sPlxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTXlEb2N1bWVudDtcbiJdLCJuYW1lcyI6WyJEb2N1bWVudCIsIkh0bWwiLCJIZWFkIiwiTWFpbiIsIk5leHRTY3JpcHQiLCJNeURvY3VtZW50IiwiZ2V0SW5pdGlhbFByb3BzIiwiY3R4IiwiaW5pdGlhbFByb3BzIiwicmVuZGVyIiwibGFuZyIsInNjcmlwdCIsImRhbmdlcm91c2x5U2V0SW5uZXJIVE1MIiwiX19odG1sIiwiYm9keSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./pages/_document.js\n");

/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

module.exports = require("react");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react/jsx-runtime":
/*!************************************!*\
  !*** external "react/jsx-runtime" ***!
  \************************************/
/***/ ((module) => {

module.exports = require("react/jsx-runtime");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc"], () => (__webpack_exec__("./pages/_document.js")));
module.exports = __webpack_exports__;

})();