"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("middleware",{

/***/ "(middleware)/./middleware.ts":
/*!***********************!*\
  !*** ./middleware.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   config: () => (/* binding */ config),\n/* harmony export */   middleware: () => (/* binding */ middleware)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(middleware)/./node_modules/next/dist/esm/api/server.js\");\n\nfunction middleware(req) {\n    const { pathname } = req.nextUrl;\n    if (pathname.startsWith('/admin')) {\n        // 允许未登录访问登录页，避免自我重定向\n        if (pathname === '/admin/login') {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.next();\n        }\n        const token = req.cookies.get('admin_session')?.value;\n        if (!token) {\n            const url = req.nextUrl.clone();\n            url.pathname = '/admin/login';\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.redirect(url);\n        }\n    }\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.next();\n}\nconst config = {\n    matcher: [\n        '/admin/:path*'\n    ]\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vbWlkZGxld2FyZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBdUQ7QUFFaEQsU0FBU0MsV0FBV0MsR0FBZ0I7SUFDekMsTUFBTSxFQUFFQyxRQUFRLEVBQUUsR0FBR0QsSUFBSUUsT0FBTztJQUNoQyxJQUFJRCxTQUFTRSxVQUFVLENBQUMsV0FBVztRQUNqQyxxQkFBcUI7UUFDckIsSUFBSUYsYUFBYSxnQkFBZ0I7WUFDL0IsT0FBT0gscURBQVlBLENBQUNNLElBQUk7UUFDMUI7UUFDQSxNQUFNQyxRQUFRTCxJQUFJTSxPQUFPLENBQUNDLEdBQUcsQ0FBQyxrQkFBa0JDO1FBQ2hELElBQUksQ0FBQ0gsT0FBTztZQUNWLE1BQU1JLE1BQU1ULElBQUlFLE9BQU8sQ0FBQ1EsS0FBSztZQUM3QkQsSUFBSVIsUUFBUSxHQUFHO1lBQ2YsT0FBT0gscURBQVlBLENBQUNhLFFBQVEsQ0FBQ0Y7UUFDL0I7SUFDRjtJQUNBLE9BQU9YLHFEQUFZQSxDQUFDTSxJQUFJO0FBQzFCO0FBRU8sTUFBTVEsU0FBUztJQUFFQyxTQUFTO1FBQUM7S0FBZ0I7QUFBQyxFQUFDIiwic291cmNlcyI6WyJEOlxceHVlXFx0ZXN0LXNwZWMtcHJvXFx4dWVyYW4tanViZW4tcHJvamVjdFxcbWlkZGxld2FyZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVzcG9uc2UsIE5leHRSZXF1ZXN0IH0gZnJvbSAnbmV4dC9zZXJ2ZXInXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWlkZGxld2FyZShyZXE6IE5leHRSZXF1ZXN0KSB7XHJcbiAgY29uc3QgeyBwYXRobmFtZSB9ID0gcmVxLm5leHRVcmxcclxuICBpZiAocGF0aG5hbWUuc3RhcnRzV2l0aCgnL2FkbWluJykpIHtcclxuICAgIC8vIOWFgeiuuOacqueZu+W9leiuv+mXrueZu+W9lemhte+8jOmBv+WFjeiHquaIkemHjeWumuWQkVxyXG4gICAgaWYgKHBhdGhuYW1lID09PSAnL2FkbWluL2xvZ2luJykge1xyXG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLm5leHQoKVxyXG4gICAgfVxyXG4gICAgY29uc3QgdG9rZW4gPSByZXEuY29va2llcy5nZXQoJ2FkbWluX3Nlc3Npb24nKT8udmFsdWVcclxuICAgIGlmICghdG9rZW4pIHtcclxuICAgICAgY29uc3QgdXJsID0gcmVxLm5leHRVcmwuY2xvbmUoKVxyXG4gICAgICB1cmwucGF0aG5hbWUgPSAnL2FkbWluL2xvZ2luJ1xyXG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLnJlZGlyZWN0KHVybClcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIE5leHRSZXNwb25zZS5uZXh0KClcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGNvbmZpZyA9IHsgbWF0Y2hlcjogWycvYWRtaW4vOnBhdGgqJ10gfVxyXG4iXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwibWlkZGxld2FyZSIsInJlcSIsInBhdGhuYW1lIiwibmV4dFVybCIsInN0YXJ0c1dpdGgiLCJuZXh0IiwidG9rZW4iLCJjb29raWVzIiwiZ2V0IiwidmFsdWUiLCJ1cmwiLCJjbG9uZSIsInJlZGlyZWN0IiwiY29uZmlnIiwibWF0Y2hlciJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(middleware)/./middleware.ts\n");

/***/ })

});