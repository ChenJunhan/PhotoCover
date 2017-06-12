"use strict";function _classCallCheck(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}var _slicedToArray=function(){function t(t,e){var i=[],s=!0,n=!1,a=void 0;try{for(var o,r=t[Symbol.iterator]();!(s=(o=r.next()).done)&&(i.push(o.value),!e||i.length!==e);s=!0);}catch(t){n=!0,a=t}finally{try{!s&&r.return&&r.return()}finally{if(n)throw a}}return i}return function(e,i){if(Array.isArray(e))return e;if(Symbol.iterator in Object(e))return t(e,i);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),_createClass=function(){function t(t,e){for(var i=0;i<e.length;i++){var s=e[i];s.enumerable=s.enumerable||!1,s.configurable=!0,"value"in s&&(s.writable=!0),Object.defineProperty(t,s.key,s)}}return function(e,i,s){return i&&t(e.prototype,i),s&&t(e,s),e}}(),DEFAULT_OPTIONS={RADIUS:20,MAX_WIDTH:800,COLOR:"black",MOUSE:"pen",PEN_BORDER_COLOR:"red",ERASER_BORDER_COLOR:"#666",PEN:"pen",ERASER:"eraser"},PhotoCover=function(){function t(e){_classCallCheck(this,t),this.radius=DEFAULT_OPTIONS.RADIUS,this.maxWidth=DEFAULT_OPTIONS.MAX_WIDTH,this.color=DEFAULT_OPTIONS.COLOR,this.mouseType=DEFAULT_OPTIONS.MOUSE,this.operateHistories=[],this.img=document.querySelector(e),this.win=window,this.doc=document,this.body=this.doc.body,this.mouse,this.width,this.height,this.left,this.top,this.canvas,this.ctx,this._init()}return _createClass(t,[{key:"_init",value:function(){var t=this;if(!this.img)throw Error("No Image Selected");var e=[this.body,this.win,this.img],i=e[0],s=e[1],n=e[2];s.addEventListener("load",function(e){t.width=n.width,t.height=n.height,t.canvas=document.createElement("canvas"),t.ctx=t.canvas.getContext("2d"),t._async(),t.canvas.width=n.width,t.canvas.height=n.height,i.appendChild(t.canvas),t._initMouse()}.bind(this),!1),s.addEventListener("resize",function(e){t._async()}.bind(this),!1);var a=[],o=function(e){e.preventDefault(),a.push(t.drawByEvent(e))}.bind(this);s.addEventListener("mousedown",function(e){e.preventDefault(),a=[],a.push(t.drawByEvent(e)),s.addEventListener("mousemove",o,!1)}.bind(this),!1),s.addEventListener("mouseup",function(e){s.removeEventListener("mousemove",o,!1);var i=(t.getCoordinateByEvent(e),[e.pageX,e.pageY]),n=i[0],r=i[1];t.isOnCanvas(n,r)&&(t.operateHistories.push(a),a=[])}.bind(this),!1)}},{key:"_async",value:function(){var t=this.img.getBoundingClientRect();this.top=t.top,this.left=t.left,this.canvas.style.cssText="\n      position: absolute;\n      left: "+(this.left+this.body.scrollLeft)+"px;\n      top: "+(this.top+this.body.scrollTop)+"px;\n      use-select: none;\n    "}},{key:"_initMouse",value:function(t){var e=this,i=[this.body,this.win],s=i[0],n=i[1],a=document.createElement("div");a.style.cssText="\n      display: none;\n      position: absolute;\n      left: 0;\n      top: 0;\n      width: "+2*this.radius+"px;\n      height: "+2*this.radius+"px;\n      border: 1px solid red;\n      border-radius: 100%;\n    ",this.mouse=a,s.appendChild(a),n.addEventListener("mousemove",function(t){var i=[t.pageX,t.pageY],n=i[0],o=i[1],r=e.isOnCanvas(n,o);a.style.transform="translate("+(n-e.radius)+"px, "+(o-e.radius)+"px)",r?(a.style.display="block",s.style.cursor="none"):(a.style.display="none",s.style.cursor="default")}.bind(this),!1)}},{key:"setRadius",value:function(t){if(!(t<2||t>100)){var e=this.mouse;this.radius=t,e.style.width=2*t+"px",e.style.height=2*t+"px"}}},{key:"zoomIn",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:2;this.setRadius(this.radius+t)}},{key:"zoomOut",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:2;this.setRadius(this.radius-t)}},{key:"drawCircle",value:function(t,e,i){var s=this.ctx;s.fillStyle=this.color,s.beginPath(),s.arc(t+1,e+1,i||this.radius,0,360),s.fill(),s.closePath()}},{key:"getCoordinateByEvent",value:function(t){var i=void 0,s=void 0,n=[this.doc,this.body],a=n[0],o=n[1],r=this.canvas;return t.pageX||t.pageY?(i=t.pageX,s=t.pageY):(i=e.clientX+o.scrollLeft+a.documentElement.scrollLeft,s=e.clientY+o.scrollTop+a.documentElement.scrollTop),i-=r.offsetLeft,s-=r.offsetTop,[i,s]}},{key:"drawByEvent",value:function(t){if(this.ctx){var e=this.ctx,i=this.getCoordinateByEvent(t),s=_slicedToArray(i,2),n=s[0],a=s[1];if(this.mouseType===DEFAULT_OPTIONS.PEN)return this.drawCircle(n,a),[DEFAULT_OPTIONS.PEN,this.color,n,a,this.radius];if(this.mouseType===DEFAULT_OPTIONS.ERASER){n-=this.radius,a-=this.radius;var o=2*this.radius,r=2*this.radius;return e.clearRect(n,a,o,r),[DEFAULT_OPTIONS.ERASER,n,a,o,r]}}}},{key:"isOnCanvas",value:function(t,e){return!(t<this.left||t>this.left+this.width||e<this.top||e>this.top+this.height)}},{key:"setMaxWidth",value:function(t){this.maxWidth=t}},{key:"setColor",value:function(t){this.color=t}},{key:"setTool",value:function(t){this.mouseType=t,t.toLowerCase()===DEFAULT_OPTIONS.PEN?this.setPen():t.toLowerCase()===DEFAULT_OPTIONS.ERASER&&this.setEraser()}},{key:"setPen",value:function(){var t=this.mouse;Object.assign(t.style,{borderRadius:"100%",border:"1px solid "+DEFAULT_OPTIONS.PEN_BORDER_COLOR}),this.mouseType=DEFAULT_OPTIONS.PEN}},{key:"setEraser",value:function(){var t=this.mouse;Object.assign(t.style,{borderRadius:0,border:"1px dashed "+DEFAULT_OPTIONS.ERASER_BORDER_COLOR}),this.mouseType=DEFAULT_OPTIONS.ERASER}},{key:"undo",value:function(){var t=this,e=this.ctx,i=this.color;e.clearRect(0,0,this.width,this.height),this.operateHistories.pop(),this.operateHistories.map(function(i){i.map(function(i){i[0]===DEFAULT_OPTIONS.PEN?(t.color=i[1],t.drawCircle.apply(t,i.slice(2))):i[0]===DEFAULT_OPTIONS.ERASER&&e.clearRect.apply(e,i.slice(1))})}),this.color=i}},{key:"getDataURL",value:function(){var t=document.createElement("canvas");t.width=this.width,t.height=this.height;var e=t.getContext("2d");return e.drawImage(this.img,0,0,this.width,this.height),e.drawImage(this.canvas,0,0,this.width,this.height),t.toDataURL()}}]),t}();