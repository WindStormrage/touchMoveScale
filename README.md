## touch-move-scale 移动端画布移动缩放库

touch-move-scale 是原生写的移动端画布移动缩放库, 你可以给元素添加单指移动和双指缩放的功能
### Demo
[看看呗](http://htmlpreview.github.io/?https://github.com/WindStormrage/touchMoveScale/blob/master/index.html) 请在移动端打开
[试试呗](https://codepen.io/WindStormrage/pen/ZEpBvOZ)

![jpgesV8iv2KYNu9](https://i.loli.net/2021/01/05/jpgesV8iv2KYNu9.gif)
### Install
```
npm i touch-move-scale -S
```
### Quick Start
``` JavaScript
<div id="touchBox">
  <img id="transformDom" />
</div>

import TouchMoveScale from './index.js'
const touchMoveScale = new TouchMoveScale({
  touchDom: document.getElementById('touchBox'),
  transformDom: document.getElementById('transformDom')
})
```
### Options

参数 | 默认值 | 含义
---|---|---
touchDom | - |[必填]手指操作的区域元素
transformDom | - | [必填]缩放应用的元素
transformData | - | 位移缩放初始值
transformData.x | 0 | 初始x轴偏移
transformData.y | 0 | 初始y轴偏移
transformData.scale | 1 | 初始缩放
maxScale | Infinity | 最大缩放值
minScale | 0 | 最小缩放值
damping | false | 感觉像是有阻尼感,可以开启试试
perspective | false | 是否有透视效果

### Function

方法名 | 参数 | 含义
---|---|---
enlargeScale | size: 放大倍数 | 进行放大操作
narrowScale | size: 缩小倍数 | 进行缩小操作
getTransformData | - | 获得当前的位移和缩放, 其中的位移没有被缩放, 是先缩放然后再位移
setPerspective | value: Boolean | 设置perspective
setDamping | value: Boolean | 设置damping
distory | - | 销毁监听

