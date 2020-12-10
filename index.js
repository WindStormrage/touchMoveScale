export default class TouchMoveScale {
  constructor (option) {
    this.touchDom = option.touchDom
    this.transformDom = option.transformDom
    this.transformData = {
      x: option?.transformData?.x || 0,
      y: option?.transformData?.y || 0,
      scale: option?.transformData?.scale || 1
    },
    this.maxScale = option.maxScale || Infinity
    this.minScale = option.minScale || 0
    // 奇奇怪怪的效果
    this.damping = option.damping || false
    // 透视效果
    this.perspective = option.perspective || false
    // 用来储存上一次的触摸的数据的
    this.store = {
      x: 0,
      y: 0,
      scale: 1
    }
    // 触摸的类型
    this.touchType = ''
    // 用来储存当前缩放中心带来的位置偏移的比例
    this.scaleTranslateProportion = []
    this.init()
  }
  init() {
    // 得绑定this不然方法里面的this是this.touchDom
    this.touchDom.addEventListener('touchstart', this.touchstart.bind(this))
    this.touchDom.addEventListener('touchmove', this.touchmove.bind(this))
    this.touchDom.addEventListener('touchend', this.touchend.bind(this))
    // 强制设置默认缩放中心为左上角
    this.transformDom.style.transformOrigin = "top left"
    // 设置默认的位置
    this.setTransform()
  }
  touchstart (e) {
    e.preventDefault();
    if (e.targetTouches.length === 1) {
      // 当前屏幕上只有一个触摸点的时候就是移动
      this.moveStart(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
      this.touchType = "move";
    } else if (e.targetTouches.length === 2) {
      // 如果两个触摸点是缩放
      this.scaleStart(e.targetTouches);
      this.touchType = "scale";
    }
  }
  touchmove (e) {
    e.preventDefault();
    if (e.targetTouches.length === 1 && this.touchType === "move") {
      // 如果屏幕上只有一个触摸点而且类型是移动的时候才是移动
      this.move(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
    } else if (e.targetTouches.length === 2) {
      // 只要有两个触摸点就是缩放,可以从移动转换成缩放
      this.scale(e.targetTouches);
    }
  }
  // 开始移动的方法: 记录首次的数据
  moveStart (x, y) {
    this.store.x = x;
    this.store.y = y;
  }
  // 移动的方法: 上一次减去当前为偏移量
  move (x, y) {
    this.transformData.x += x - this.store.x;
    this.transformData.y += y - this.store.y;
    this.store.x = x;
    this.store.y = y;
    this.setTransform();
  }
  // 开始移动: 记录首次的触摸数据,和中心缩放比例
  scaleStart(touchList) {
    // 算出当前两指之间的距离
    const x = touchList[0].clientX - touchList[1].clientX;
    const y = touchList[0].clientY - touchList[1].clientY;
    this.store.scale = Math.sqrt(x ** 2 + y ** 2);
    // 缩放中心为双指点的中心,此时的双指中心只是touchBox上的,得转换成transformDom上的,
    // 因为缩放中心的位置带来translate的变化,是根据当前触摸中心在transformDom上的比例算出来的
    const scaleCenter = [
      (touchList[0].clientX + x / 2 - this.transformData.x) / this.transformData.scale,
      (touchList[0].clientY + y / 2 - this.transformData.y) / this.transformData.scale,
    ];
    // 缩放导致偏移的比例
    this.scaleTranslateProportion = [
      scaleCenter[0] / this.transformDom.offsetWidth,
      scaleCenter[1] / this.transformDom.offsetHeight,
    ];
  }
  // 进行缩放操作
  scale(touchList) {
    // 开始时move后面scale的情况下会没有上一次的scale数据,所以把这次当做start
    if (this.touchType !== 'scale') {
      this.touchType = "scale";
      this.scaleStart(touchList);
      return
    }
    // 算出当前两指的距离
    const scale = Math.sqrt(
      (touchList[0].clientX - touchList[1].clientX) ** 2 +
        (touchList[0].clientY - touchList[1].clientY) ** 2
    );
    // 缩放大小为现在的两指距离除去上次的两指距离
    this.doscale(scale / this.store.scale, false)
    // 记录这一次两指距离
    this.store.scale = scale;
  }
  // 进行指定大小的缩放
  doscale (size, useCenter = true) {
    // 为0或者为1就不进行缩放
    if (size === 0 && size === 1) return
    // 缩放前的transformDom大小
    const oldSize = [
      this.transformDom.offsetWidth * this.transformData.scale,
      this.transformDom.offsetHeight * this.transformData.scale,
    ];
    let scaleTranslateProportion = this.scaleTranslateProportion
    // 如果直接操作,不是双指进行缩放就设置touchDom中心是缩放中心
    if (useCenter) {
      // touchDom的中心,
      const scaleCenter = [
        (this.touchDom.offsetWidth / 2 - this.transformData.x) / this.transformData.scale,
        (this.touchDom.offsetHeight / 2 - this.transformData.y) / this.transformData.scale,
      ];
      // 缩放导致偏移的比例
      scaleTranslateProportion = [
        scaleCenter[0] / this.transformDom.offsetWidth,
        scaleCenter[1] / this.transformDom.offsetHeight,
      ];
    }
    // 设置缩放的偏移,之前纠结在使用两指的偏移位置来计算,实际上缩放后大小的变化不是两指间移动的距离
    // 变化大小其实就是缩放的大小乘原来的大小
    this.transformData.x +=
      oldSize[0] *
      (1 - size) *
      scaleTranslateProportion[0] || 0;
    this.transformData.y +=
      oldSize[1] *
      (1 - size) *
      scaleTranslateProportion[1] || 0;
    // 设置缩放
    this.transformData.scale *= size
    this.setTransform();
  }
  // 更改移动缩放的效果
  setTransform() {
    // console.log(this.transformData);
    // 奇奇怪怪的效果
    if (this.damping) {
      this.transformDom.style.transition = "transform .3s"
    } else {
      this.transformDom.style.transition = "none"
    }
    // 先平移再缩放
    this.transformDom.style.transform = `
      ${this.perspective ? 'perspective(500px) rotateX(50deg) skewX(-10deg)' : ''}
      translate(${this.transformData.x || 0}px, ${this.transformData.y || 0}px)
      scale(${this.transformData.scale || 0}, ${this.transformData.scale || 0})`;
  }
  // 放大操作
  enlargeScale(size = 1.2) {
    // 如果没有超过限制就正常缩放,超过了就缩放到限制大小
    if (this.transformData.scale * size <= this.maxScale) {
      this.doscale(size)
    } else {
      this.doscale(this.maxScale / this.transformData.scale)
    }
  }
  // 缩小操作
  narrowScale(size = 0.8) {
    if (this.transformData.scale * size >= this.minScale) {
      this.doscale(size)
    } else {
      this.doscale(this.minScale / this.transformData.scale)
    }
  }
  touchend () {
    this.store = {
      x: 0,
      y: 0,
      scale: 0,
    }
    this.touchType = ''
    if (this.transformData.scale > this.maxScale) {
      this.doscale(this.maxScale / this.transformData.scale, false)
    } 
    if (this.transformData.scale < this.minScale) {
      this.doscale(this.minScale / this.transformData.scale, false)
    }
  }
  getTransformData () {
    return this.transformData
  }
  setPerspective (value) {
    this.perspective = value
    this.setTransform()
  }
  setDamping (value) {
    this.damping = value
    this.setTransform()
  }
  distory() {
    this.touchDom.removeEventListener('touchstart', this.touchstart.bind(this))
    this.touchDom.removeEventListener('touchmove', this.touchmove.bind(this))
    this.touchDom.removeEventListener('touchend', this.touchend.bind(this))
  }
}