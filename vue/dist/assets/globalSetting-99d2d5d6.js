import{c,af as at,an as Re,ao as Ke,h as y,d as le,Z as B,ap as qe,aq as rt,$ as q,a as _,ar as lt,as as De,b as ut,ah as L,at as it,l as X,_ as He,au as Y,av as ot,j as Ge,u as We,D as st,aw as je,a2 as ct,P as k,X as dt,Y as vt,ax as ft,w as Me,ay as mt,az as gt,aA as pt,g as $e,aB as ht,k as bt,o as fe,y as Be,H as Ve,n as F,r as N,S as ye,aC as yt,G as St,x as ne,p as me,m as Fe,v as ge,ag as Ae,q as Te,z as Nt,A as Ct,U as wt,T as kt,W as It}from"./index-ecf8fdc1.js";import{_ as _t,F as xt}from"./index-4aa40188.js";import{v as Et}from"./hook-cb0e2678.js";/* empty css              *//* empty css              */import"./db-ccfac067.js";var Dt={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M890.5 755.3L537.9 269.2c-12.8-17.6-39-17.6-51.7 0L133.5 755.3A8 8 0 00140 768h75c5.1 0 9.9-2.5 12.9-6.6L512 369.8l284.1 391.6c3 4.1 7.8 6.6 12.9 6.6h75c6.5 0 10.3-7.4 6.5-12.7z"}}]},name:"up",theme:"outlined"};const Mt=Dt;function Oe(n){for(var e=1;e<arguments.length;e++){var t=arguments[e]!=null?Object(arguments[e]):{},o=Object.keys(t);typeof Object.getOwnPropertySymbols=="function"&&(o=o.concat(Object.getOwnPropertySymbols(t).filter(function(m){return Object.getOwnPropertyDescriptor(t,m).enumerable}))),o.forEach(function(m){$t(n,m,t[m])})}return n}function $t(n,e,t){return e in n?Object.defineProperty(n,e,{value:t,enumerable:!0,configurable:!0,writable:!0}):n[e]=t,n}var ke=function(e,t){var o=Oe({},e,t.attrs);return c(at,Oe({},o,{icon:Mt}),null)};ke.displayName="UpOutlined";ke.inheritAttrs=!1;const Bt=ke;function Ce(){return typeof BigInt=="function"}function ae(n){var e=n.trim(),t=e.startsWith("-");t&&(e=e.slice(1)),e=e.replace(/(\.\d*[^0])0*$/,"$1").replace(/\.0*$/,"").replace(/^0+/,""),e.startsWith(".")&&(e="0".concat(e));var o=e||"0",m=o.split("."),p=m[0]||"0",i=m[1]||"0";p==="0"&&i==="0"&&(t=!1);var l=t?"-":"";return{negative:t,negativeStr:l,trimStr:o,integerStr:p,decimalStr:i,fullStr:"".concat(l).concat(o)}}function Ie(n){var e=String(n);return!Number.isNaN(Number(e))&&e.includes("e")}function re(n){var e=String(n);if(Ie(n)){var t=Number(e.slice(e.indexOf("e-")+2)),o=e.match(/\.(\d+)/);return o!=null&&o[1]&&(t+=o[1].length),t}return e.includes(".")&&xe(e)?e.length-e.indexOf(".")-1:0}function _e(n){var e=String(n);if(Ie(n)){if(n>Number.MAX_SAFE_INTEGER)return String(Ce()?BigInt(n).toString():Number.MAX_SAFE_INTEGER);if(n<Number.MIN_SAFE_INTEGER)return String(Ce()?BigInt(n).toString():Number.MIN_SAFE_INTEGER);e=n.toFixed(re(e))}return ae(e).fullStr}function xe(n){return typeof n=="number"?!Number.isNaN(n):n?/^\s*-?\d+(\.\d+)?\s*$/.test(n)||/^\s*-?\d+\.\s*$/.test(n)||/^\s*-?\.\d+\s*$/.test(n):!1}function Le(n){return!n&&n!==0&&!Number.isNaN(n)||!String(n).trim()}var Vt=function(){function n(e){if(Ke(this,n),y(this,"origin",""),Le(e)){this.empty=!0;return}this.origin=String(e),this.number=Number(e)}return Re(n,[{key:"negate",value:function(){return new n(-this.toNumber())}},{key:"add",value:function(t){if(this.isInvalidate())return new n(t);var o=Number(t);if(Number.isNaN(o))return this;var m=this.number+o;if(m>Number.MAX_SAFE_INTEGER)return new n(Number.MAX_SAFE_INTEGER);if(m<Number.MIN_SAFE_INTEGER)return new n(Number.MIN_SAFE_INTEGER);var p=Math.max(re(this.number),re(o));return new n(m.toFixed(p))}},{key:"isEmpty",value:function(){return this.empty}},{key:"isNaN",value:function(){return Number.isNaN(this.number)}},{key:"isInvalidate",value:function(){return this.isEmpty()||this.isNaN()}},{key:"equals",value:function(t){return this.toNumber()===(t==null?void 0:t.toNumber())}},{key:"lessEquals",value:function(t){return this.add(t.negate().toString()).toNumber()<=0}},{key:"toNumber",value:function(){return this.number}},{key:"toString",value:function(){var t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:!0;return t?this.isInvalidate()?"":_e(this.number):this.origin}}]),n}(),Ft=function(){function n(e){if(Ke(this,n),y(this,"origin",""),Le(e)){this.empty=!0;return}if(this.origin=String(e),e==="-"||Number.isNaN(e)){this.nan=!0;return}var t=e;if(Ie(t)&&(t=Number(t)),t=typeof t=="string"?t:_e(t),xe(t)){var o=ae(t);this.negative=o.negative;var m=o.trimStr.split(".");this.integer=BigInt(m[0]);var p=m[1]||"0";this.decimal=BigInt(p),this.decimalLen=p.length}else this.nan=!0}return Re(n,[{key:"getMark",value:function(){return this.negative?"-":""}},{key:"getIntegerStr",value:function(){return this.integer.toString()}},{key:"getDecimalStr",value:function(){return this.decimal.toString().padStart(this.decimalLen,"0")}},{key:"alignDecimal",value:function(t){var o="".concat(this.getMark()).concat(this.getIntegerStr()).concat(this.getDecimalStr().padEnd(t,"0"));return BigInt(o)}},{key:"negate",value:function(){var t=new n(this.toString());return t.negative=!t.negative,t}},{key:"add",value:function(t){if(this.isInvalidate())return new n(t);var o=new n(t);if(o.isInvalidate())return this;var m=Math.max(this.getDecimalStr().length,o.getDecimalStr().length),p=this.alignDecimal(m),i=o.alignDecimal(m),l=(p+i).toString(),f=ae(l),v=f.negativeStr,b=f.trimStr,r="".concat(v).concat(b.padStart(m+1,"0"));return new n("".concat(r.slice(0,-m),".").concat(r.slice(-m)))}},{key:"isEmpty",value:function(){return this.empty}},{key:"isNaN",value:function(){return this.nan}},{key:"isInvalidate",value:function(){return this.isEmpty()||this.isNaN()}},{key:"equals",value:function(t){return this.toString()===(t==null?void 0:t.toString())}},{key:"lessEquals",value:function(t){return this.add(t.negate().toString()).toNumber()<=0}},{key:"toNumber",value:function(){return this.isNaN()?NaN:Number(this.toString())}},{key:"toString",value:function(){var t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:!0;return t?this.isInvalidate()?"":ae("".concat(this.getMark()).concat(this.getIntegerStr(),".").concat(this.getDecimalStr())).fullStr:this.origin}}]),n}();function P(n){return Ce()?new Ft(n):new Vt(n)}function we(n,e,t){var o=arguments.length>3&&arguments[3]!==void 0?arguments[3]:!1;if(n==="")return"";var m=ae(n),p=m.negativeStr,i=m.integerStr,l=m.decimalStr,f="".concat(e).concat(l),v="".concat(p).concat(i);if(t>=0){var b=Number(l[t]);if(b>=5&&!o){var r=P(n).add("".concat(p,"0.").concat("0".repeat(t)).concat(10-b));return we(r.toString(),e,t,o)}return t===0?v:"".concat(v).concat(e).concat(l.padEnd(t,"0").slice(0,t))}return f===".0"?v:"".concat(v).concat(f)}var At=200,Tt=600;const Ot=le({compatConfig:{MODE:3},name:"StepHandler",inheritAttrs:!1,props:{prefixCls:String,upDisabled:Boolean,downDisabled:Boolean,onStep:{type:Function}},slots:["upNode","downNode"],setup:function(e,t){var o=t.slots,m=t.emit,p=B(),i=function(v,b){v.preventDefault(),m("step",b);function r(){m("step",b),p.value=setTimeout(r,At)}p.value=setTimeout(r,Tt)},l=function(){clearTimeout(p.value)};return qe(function(){l()}),function(){if(rt())return null;var f=e.prefixCls,v=e.upDisabled,b=e.downDisabled,r="".concat(f,"-handler"),M=q(r,"".concat(r,"-up"),y({},"".concat(r,"-up-disabled"),v)),V=q(r,"".concat(r,"-down"),y({},"".concat(r,"-down-disabled"),b)),I={unselectable:"on",role:"button",onMouseup:l,onMouseleave:l},s=o.upNode,A=o.downNode;return c("div",{class:"".concat(r,"-wrap")},[c("span",_(_({},I),{},{onMousedown:function(T){i(T,!0)},"aria-label":"Increase Value","aria-disabled":v,class:M}),[(s==null?void 0:s())||c("span",{unselectable:"on",class:"".concat(f,"-handler-up-inner")},null)]),c("span",_(_({},I),{},{onMousedown:function(T){i(T,!1)},"aria-label":"Decrease Value","aria-disabled":b,class:V}),[(A==null?void 0:A())||c("span",{unselectable:"on",class:"".concat(f,"-handler-down-inner")},null)])])}}});function Pt(n,e){var t=B(null);function o(){try{var p=n.value,i=p.selectionStart,l=p.selectionEnd,f=p.value,v=f.substring(0,i),b=f.substring(l);t.value={start:i,end:l,value:f,beforeTxt:v,afterTxt:b}}catch{}}function m(){if(n.value&&t.value&&e.value)try{var p=n.value.value,i=t.value,l=i.beforeTxt,f=i.afterTxt,v=i.start,b=p.length;if(p.endsWith(f))b=p.length-t.value.afterTxt.length;else if(p.startsWith(l))b=l.length;else{var r=l[v-1],M=p.indexOf(r,v-1);M!==-1&&(b=M+1)}n.value.setSelectionRange(b,b)}catch(V){lt(!1,"Something warning of cursor restore. Please fire issue about this: ".concat(V.message))}}return[o,m]}const Ut=function(){var n=B(0),e=function(){De.cancel(n.value)};return qe(function(){e()}),function(t){e(),n.value=De(function(){t()})}};var zt=["prefixCls","min","max","step","defaultValue","value","disabled","readonly","keyboard","controls","autofocus","stringMode","parser","formatter","precision","decimalSeparator","onChange","onInput","onPressEnter","onStep","lazy","class","style"],Pe=function(e,t){return e||t.isEmpty()?t.toString():t.toNumber()},Ue=function(e){var t=P(e);return t.isInvalidate()?null:t},Xe=function(){return{stringMode:{type:Boolean},defaultValue:{type:[String,Number]},value:{type:[String,Number]},prefixCls:{type:String},min:{type:[String,Number]},max:{type:[String,Number]},step:{type:[String,Number],default:1},tabindex:{type:Number},controls:{type:Boolean,default:!0},readonly:{type:Boolean},disabled:{type:Boolean},autofocus:{type:Boolean},keyboard:{type:Boolean,default:!0},parser:{type:Function},formatter:{type:Function},precision:{type:Number},decimalSeparator:{type:String},onInput:{type:Function},onChange:{type:Function},onPressEnter:{type:Function},onStep:{type:Function},onBlur:{type:Function},onFocus:{type:Function}}};const Rt=le({compatConfig:{MODE:3},name:"InnerInputNumber",inheritAttrs:!1,props:_(_({},Xe()),{},{lazy:Boolean}),slots:["upHandler","downHandler"],setup:function(e,t){var o=t.attrs,m=t.slots,p=t.emit,i=t.expose,l=B(),f=B(!1),v=B(!1),b=B(!1),r=B(P(e.value));function M(d){e.value===void 0&&(r.value=d)}var V=function(a,h){if(!h)return e.precision>=0?e.precision:Math.max(re(a),re(e.step))},I=function(a){var h=String(a);if(e.parser)return e.parser(h);var u=h;return e.decimalSeparator&&(u=u.replace(e.decimalSeparator,".")),u.replace(/[^\w.-]+/g,"")},s=B(""),A=function(a,h){if(e.formatter)return e.formatter(a,{userTyping:h,input:String(s.value)});var u=typeof a=="number"?_e(a):a;if(!h){var D=V(u,h);if(xe(u)&&(e.decimalSeparator||D>=0)){var x=e.decimalSeparator||".";u=we(u,x,D)}}return u},U=function(){var d=e.value;return r.value.isInvalidate()&&["string","number"].includes(ut(d))?Number.isNaN(d)?"":d:A(r.value.toString(),!1)}();s.value=U;function T(d,a){s.value=A(d.isInvalidate()?d.toString(!1):d.toString(!a),a)}var z=L(function(){return Ue(e.max)}),E=L(function(){return Ue(e.min)}),C=L(function(){return!z.value||!r.value||r.value.isInvalidate()?!1:z.value.lessEquals(r.value)}),R=L(function(){return!E.value||!r.value||r.value.isInvalidate()?!1:r.value.lessEquals(E.value)}),S=Pt(l,f),g=it(S,2),$=g[0],ue=g[1],H=function(a){return z.value&&!a.lessEquals(z.value)?z.value:E.value&&!E.value.lessEquals(a)?E.value:null},G=function(a){return!H(a)},W=function(a,h){var u=a,D=G(u)||u.isEmpty();if(!u.isEmpty()&&!h&&(u=H(u)||u,D=!0),!e.readonly&&!e.disabled&&D){var x=u.toString(),O=V(x,h);if(O>=0&&(u=P(we(x,".",O))),!u.equals(r.value)){var K;M(u),(K=e.onChange)===null||K===void 0||K.call(e,u.isEmpty()?null:Pe(e.stringMode,u)),e.value===void 0&&T(u,h)}return u}return r.value},Z=Ut(),J=function d(a){var h;if($(),s.value=a,!b.value){var u=I(a),D=P(u);D.isNaN()||W(D,!0)}(h=e.onInput)===null||h===void 0||h.call(e,a),Z(function(){var x=a;e.parser||(x=a.replace(/。/g,".")),x!==a&&d(x)})},Q=function(){b.value=!0},ie=function(){b.value=!1,J(l.value.value)},ee=function(a){J(a.target.value)},te=function(a){var h,u;if(!(a&&C.value||!a&&R.value)){v.value=!1;var D=P(e.step);a||(D=D.negate());var x=(r.value||P(0)).add(D.toString()),O=W(x,!1);(h=e.onStep)===null||h===void 0||h.call(e,Pe(e.stringMode,O),{offset:e.step,type:a?"up":"down"}),(u=l.value)===null||u===void 0||u.focus()}},oe=function(a){var h=P(I(s.value)),u=h;h.isNaN()?u=r.value:u=W(h,a),e.value!==void 0?T(r.value,!1):u.isNaN()||T(u,!1)},pe=function(a){var h=a.which;if(v.value=!0,h===Y.ENTER){var u;b.value||(v.value=!1),oe(!1),(u=e.onPressEnter)===null||u===void 0||u.call(e,a)}e.keyboard!==!1&&!b.value&&[Y.UP,Y.DOWN].includes(h)&&(te(Y.UP===h),a.preventDefault())},w=function(){v.value=!1},j=function(a){oe(!1),f.value=!1,v.value=!1,p("blur",a)};return X(function(){return e.precision},function(){r.value.isInvalidate()||T(r.value,!1)},{flush:"post"}),X(function(){return e.value},function(){var d=P(e.value);r.value=d;var a=P(I(s.value));(!d.equals(a)||!v.value||e.formatter)&&T(d,v.value)},{flush:"post"}),X(s,function(){e.formatter&&ue()},{flush:"post"}),X(function(){return e.disabled},function(d){d&&(f.value=!1)}),i({focus:function(){var a;(a=l.value)===null||a===void 0||a.focus()},blur:function(){var a;(a=l.value)===null||a===void 0||a.blur()}}),function(){var d,a=_(_({},o),e),h=a.prefixCls,u=h===void 0?"rc-input-number":h,D=a.min,x=a.max,O=a.step,K=O===void 0?1:O;a.defaultValue,a.value;var se=a.disabled,ce=a.readonly;a.keyboard;var de=a.controls,he=de===void 0?!0:de,ve=a.autofocus;a.stringMode,a.parser,a.formatter,a.precision,a.decimalSeparator,a.onChange,a.onInput,a.onPressEnter,a.onStep;var Ye=a.lazy,Ze=a.class,Je=a.style,Qe=He(a,zt),et=m.upHandler,tt=m.downHandler,Ee="".concat(u,"-input"),be={};return Ye?be.onChange=ee:be.onInput=ee,c("div",{class:q(u,Ze,(d={},y(d,"".concat(u,"-focused"),f.value),y(d,"".concat(u,"-disabled"),se),y(d,"".concat(u,"-readonly"),ce),y(d,"".concat(u,"-not-a-number"),r.value.isNaN()),y(d,"".concat(u,"-out-of-range"),!r.value.isInvalidate()&&!G(r.value)),d)),style:Je,onKeydown:pe,onKeyup:w},[he&&c(Ot,{prefixCls:u,upDisabled:C.value,downDisabled:R.value,onStep:te},{upNode:et,downNode:tt}),c("div",{class:"".concat(Ee,"-wrap")},[c("input",_(_(_({autofocus:ve,autocomplete:"off",role:"spinbutton","aria-valuemin":D,"aria-valuemax":x,"aria-valuenow":r.value.isInvalidate()?null:r.value.toString(),step:K},Qe),{},{ref:l,class:Ee,value:s.value,disabled:se,readonly:ce,onFocus:function(nt){f.value=!0,p("focus",nt)}},be),{},{onBlur:j,onCompositionstart:Q,onCompositionend:ie}),null)])])}}});function Se(n){return n!=null}var Kt=["class","bordered","readonly","style","addonBefore","addonAfter","prefix","valueModifiers"],ze=Xe(),qt=function(){return _(_({},ze),{},{size:{type:String},bordered:{type:Boolean,default:!0},placeholder:String,name:String,id:String,type:String,addonBefore:k.any,addonAfter:k.any,prefix:k.any,"onUpdate:value":ze.onChange,valueModifiers:Object})},Ne=le({compatConfig:{MODE:3},name:"AInputNumber",inheritAttrs:!1,props:qt(),slots:["addonBefore","addonAfter","prefix"],setup:function(e,t){var o=t.emit,m=t.expose,p=t.attrs,i=t.slots,l=Ge(),f=We("input-number",e),v=f.prefixCls,b=f.size,r=f.direction,M=B(e.value===void 0?e.defaultValue:e.value),V=B(!1);X(function(){return e.value},function(){M.value=e.value});var I=B(null),s=function(){var C;(C=I.value)===null||C===void 0||C.focus()},A=function(){var C;(C=I.value)===null||C===void 0||C.blur()};m({focus:s,blur:A});var U=function(C){e.value===void 0&&(M.value=C),o("update:value",C),o("change",C),l.onFieldChange()},T=function(C){V.value=!1,o("blur",C),l.onFieldBlur()},z=function(C){V.value=!0,o("focus",C)};return function(){var E,C,R,S,g=_(_({},p),e),$=g.class,ue=g.bordered,H=g.readonly,G=g.style,W=g.addonBefore,Z=W===void 0?(E=i.addonBefore)===null||E===void 0?void 0:E.call(i):W,J=g.addonAfter,Q=J===void 0?(C=i.addonAfter)===null||C===void 0?void 0:C.call(i):J,ie=g.prefix,ee=ie===void 0?(R=i.prefix)===null||R===void 0?void 0:R.call(i):ie,te=g.valueModifiers,oe=te===void 0?{}:te,pe=He(g,Kt),w=v.value,j=b.value,d=q((S={},y(S,"".concat(w,"-lg"),j==="large"),y(S,"".concat(w,"-sm"),j==="small"),y(S,"".concat(w,"-rtl"),r.value==="rtl"),y(S,"".concat(w,"-readonly"),H),y(S,"".concat(w,"-borderless"),!ue),S),$),a=c(Rt,_(_({},je(pe,["size","defaultValue"])),{},{ref:I,lazy:!!oe.lazy,value:M.value,class:d,prefixCls:w,readonly:H,onChange:U,onBlur:T,onFocus:z}),{upHandler:function(){return c(Bt,{class:"".concat(w,"-handler-up-inner")},null)},downHandler:function(){return c(st,{class:"".concat(w,"-handler-down-inner")},null)}}),h=Se(Z)||Se(Q);if(Se(ee)){var u,D=q("".concat(w,"-affix-wrapper"),(u={},y(u,"".concat(w,"-affix-wrapper-focused"),V.value),y(u,"".concat(w,"-affix-wrapper-disabled"),e.disabled),y(u,"".concat(w,"-affix-wrapper-rtl"),r.value==="rtl"),y(u,"".concat(w,"-affix-wrapper-readonly"),H),y(u,"".concat(w,"-affix-wrapper-borderless"),!ue),y(u,"".concat($),!h&&$),u));a=c("div",{class:D,style:G,onMouseup:function(){return I.value.focus()}},[c("span",{class:"".concat(w,"-prefix")},[ee]),a])}if(h){var x,O="".concat(w,"-group"),K="".concat(O,"-addon"),se=Z?c("div",{class:K},[Z]):null,ce=Q?c("div",{class:K},[Q]):null,de=q("".concat(w,"-wrapper"),O,y({},"".concat(O,"-rtl"),r.value==="rtl")),he=q("".concat(w,"-group-wrapper"),(x={},y(x,"".concat(w,"-group-wrapper-sm"),j==="small"),y(x,"".concat(w,"-group-wrapper-lg"),j==="large"),y(x,"".concat(w,"-group-wrapper-rtl"),r.value==="rtl"),x),$);a=c("div",{class:he,style:G},[c("div",{class:de},[se,a,ce])])}return ct(a,{style:G})}}});const Ht=ot(Ne,{install:function(e){return e.component(Ne.name,Ne),e}});var Gt=vt("small","default"),Wt=function(){return{id:String,prefixCls:String,size:k.oneOf(Gt),disabled:{type:Boolean,default:void 0},checkedChildren:k.any,unCheckedChildren:k.any,tabindex:k.oneOfType([k.string,k.number]),autofocus:{type:Boolean,default:void 0},loading:{type:Boolean,default:void 0},checked:k.oneOfType([k.string,k.number,k.looseBool]),checkedValue:k.oneOfType([k.string,k.number,k.looseBool]).def(!0),unCheckedValue:k.oneOfType([k.string,k.number,k.looseBool]).def(!1),onChange:{type:Function},onClick:{type:Function},onKeydown:{type:Function},onMouseup:{type:Function},"onUpdate:checked":{type:Function},onBlur:Function,onFocus:Function}},jt=le({compatConfig:{MODE:3},name:"ASwitch",__ANT_SWITCH:!0,inheritAttrs:!1,props:Wt(),slots:["checkedChildren","unCheckedChildren"],setup:function(e,t){var o=t.attrs,m=t.slots,p=t.expose,i=t.emit,l=Ge();ft(function(){Me(!("defaultChecked"in o),"Switch","'defaultChecked' is deprecated, please use 'v-model:checked'"),Me(!("value"in o),"Switch","`value` is not validate prop, do you mean `checked`?")});var f=B(e.checked!==void 0?e.checked:o.defaultChecked),v=L(function(){return f.value===e.checkedValue});X(function(){return e.checked},function(){f.value=e.checked});var b=We("switch",e),r=b.prefixCls,M=b.direction,V=b.size,I=B(),s=function(){var g;(g=I.value)===null||g===void 0||g.focus()},A=function(){var g;(g=I.value)===null||g===void 0||g.blur()};p({focus:s,blur:A}),mt(function(){gt(function(){e.autofocus&&!e.disabled&&I.value.focus()})});var U=function(g,$){e.disabled||(i("update:checked",g),i("change",g,$),l.onFieldChange())},T=function(g){i("blur",g)},z=function(g){s();var $=v.value?e.unCheckedValue:e.checkedValue;U($,g),i("click",$,g)},E=function(g){g.keyCode===Y.LEFT?U(e.unCheckedValue,g):g.keyCode===Y.RIGHT&&U(e.checkedValue,g),i("keydown",g)},C=function(g){var $;($=I.value)===null||$===void 0||$.blur(),i("mouseup",g)},R=L(function(){var S;return S={},y(S,"".concat(r.value,"-small"),V.value==="small"),y(S,"".concat(r.value,"-loading"),e.loading),y(S,"".concat(r.value,"-checked"),v.value),y(S,"".concat(r.value,"-disabled"),e.disabled),y(S,r.value,!0),y(S,"".concat(r.value,"-rtl"),M.value==="rtl"),S});return function(){var S;return c(ht,{insertExtraNode:!0},{default:function(){return[c("button",_(_(_({},je(e,["prefixCls","checkedChildren","unCheckedChildren","checked","autofocus","checkedValue","unCheckedValue","id","onChange","onUpdate:checked"])),o),{},{id:(S=e.id)!==null&&S!==void 0?S:l.id.value,onKeydown:E,onClick:z,onBlur:T,onMouseup:C,type:"button",role:"switch","aria-checked":f.value,disabled:e.disabled||e.loading,class:[o.class,R.value],ref:I}),[c("div",{class:"".concat(r.value,"-handle")},[e.loading?c(pt,{class:"".concat(r.value,"-loading-icon")},null):null]),c("span",{class:"".concat(r.value,"-inner")},[v.value?$e(m,e,"checkedChildren"):$e(m,e,"unCheckedChildren")])])]}})}}});const Lt=dt(jt);const Xt={class:"panel"},Yt={class:"lang-select-wrap"},Zt={class:"col"},Jt={class:"col"},Qt=le({__name:"globalSetting",setup(n){const e=bt(),t=B(!1),o=async()=>{window.location.reload()},m=[{value:"en",text:"English"},{value:"zh",text:"中文"},{value:"de",text:"Deutsch"}],p=(i,l)=>{const f=[];i.shiftKey&&f.push("Shift"),i.ctrlKey&&f.push("Ctrl"),(i.code.startsWith("Key")||i.code.startsWith("Digit"))&&(f.push(i.code),e.shortcut[l]=f.join(" + "))};return(i,l)=>{const f=Lt,v=_t,b=Ht,r=wt,M=kt,V=xt;return fe(),Be("div",Xt,[Ve("",!0),c(V,null,{default:F(()=>{var I;return[c(v,{label:i.$t("useThumbnailPreview")},{default:F(()=>[c(f,{checked:N(e).enableThumbnail,"onUpdate:checked":l[0]||(l[0]=s=>N(e).enableThumbnail=s)},null,8,["checked"])]),_:1},8,["label"]),c(v,{label:i.$t("defaultSortingMethod")},{default:F(()=>[c(N(ye),{value:N(e).defaultSortingMethod,"onUpdate:value":l[1]||(l[1]=s=>N(e).defaultSortingMethod=s),conv:N(yt),options:N(St)},null,8,["value","conv","options"])]),_:1},8,["label"]),c(v,{label:i.$t("defaultViewMode")},{default:F(()=>[c(N(ye),{value:N(e).defaultViewMode,"onUpdate:value":l[2]||(l[2]=s=>N(e).defaultViewMode=s),conv:{value:s=>s,text:s=>i.$t(s)},options:N(Et)},null,8,["value","conv","options"])]),_:1},8,["label"]),c(v,{label:i.$t("gridThumbnailWidth")},{default:F(()=>[c(b,{value:N(e).gridThumbnailSize,"onUpdate:value":l[3]||(l[3]=s=>N(e).gridThumbnailSize=s),min:256,max:1024},null,8,["value"]),ne(" (px) ")]),_:1},8,["label"]),c(v,{label:i.$t("largeGridThumbnailWidth")},{default:F(()=>[c(b,{value:N(e).largeGridThumbnailSize,"onUpdate:value":l[4]||(l[4]=s=>N(e).largeGridThumbnailSize=s),min:256,max:1024},null,8,["value"]),ne(" (px) ")]),_:1},8,["label"]),c(v,{label:i.$t("longPressOpenContextMenu")},{default:F(()=>[c(f,{checked:N(e).longPressOpenContextMenu,"onUpdate:checked":l[5]||(l[5]=s=>N(e).longPressOpenContextMenu=s)},null,8,["checked"])]),_:1},8,["label"]),c(v,{label:i.$t("onlyFoldersAndImages")},{default:F(()=>[c(f,{checked:N(e).onlyFoldersAndImages,"onUpdate:checked":l[6]||(l[6]=s=>N(e).onlyFoldersAndImages=s)},null,8,["checked"])]),_:1},8,["label"]),c(v,{label:i.$t("lang")},{default:F(()=>[me("div",Yt,[c(N(ye),{options:m,value:N(e).lang,"onUpdate:value":l[7]||(l[7]=s=>N(e).lang=s),onChange:l[8]||(l[8]=s=>t.value=!0)},null,8,["value"])]),t.value?(fe(),Fe(r,{key:0,type:"primary",onClick:o,ghost:""},{default:F(()=>[ne(ge(N(Ae)("langChangeReload")),1)]),_:1})):Ve("",!0)]),_:1},8,["label"]),me("h2",null,ge(N(Ae)("shortcutKey")),1),c(v,{label:i.$t("deleteSelected")},{default:F(()=>[me("div",Zt,[c(M,{value:N(e).shortcut.delete,onKeydown:l[9]||(l[9]=Te(s=>p(s,"delete"),["stop","prevent"])),placeholder:i.$t("shortcutKeyDescription")},null,8,["value","placeholder"]),c(r,{onClick:l[10]||(l[10]=s=>N(e).shortcut.delete=""),class:"clear-btn"},{default:F(()=>[ne(ge(i.$t("clear")),1)]),_:1})])]),_:1},8,["label"]),(fe(!0),Be(Nt,null,Ct(((I=N(e).conf)==null?void 0:I.all_custom_tags)??[],s=>(fe(),Fe(v,{label:i.$t("toggleTagSelection",{tag:s.name}),key:s.id},{default:F(()=>[me("div",Jt,[c(M,{value:N(e).shortcut[`toggle_tag_${s.name}`],onKeydown:Te(A=>p(A,`toggle_tag_${s.name}`),["stop","prevent"]),placeholder:i.$t("shortcutKeyDescription")},null,8,["value","onKeydown","placeholder"]),c(r,{onClick:A=>N(e).shortcut[`toggle_tag_${s.name}`]="",class:"clear-btn"},{default:F(()=>[ne(ge(i.$t("clear")),1)]),_:2},1032,["onClick"])])]),_:2},1032,["label"]))),128))]}),_:1})])}}});const on=It(Qt,[["__scopeId","data-v-e085f84b"]]);export{on as default};
