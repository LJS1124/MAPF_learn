/* util9.js — 把 “C_max”“Σw_jC_j” 这样的文字记号换成带下标的 HTML */
function subs(s) { return s.replace(/_(max|jk|j)/g, "<sub>$1</sub>"); }
