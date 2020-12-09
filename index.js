class TouchMoveScale {
  constructor (option) {
    this.touchDom = option.touchDom
    this.transformDom = option.transformDom
    this.transformData = {
      x: option?.transformData?.x || 0,
      y: option?.transformData?.y || 0,
      scale: option?.transformData?.scale || 1
    }
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
    // 开始时move后面scale的情况下会没有上一次的scale数据
    // if (this.touchType !== 'scale') {
    //   this.scaleStart(touchList);
    //   this.touchType = "scale";
    //   return
    // }
    // 算出当前两指的距离
    const scale = Math.sqrt(
      (touchList[0].clientX - touchList[1].clientX) ** 2 +
        (touchList[0].clientY - touchList[1].clientY) ** 2
    );
    // 原来的transformDom大小
    const oldSize = [
      this.transformDom.offsetWidth * this.transformData.scale,
      this.transformDom.offsetHeight * this.transformData.scale,
    ];
    // 缩放大小为现在的两指距离除去上次的两指距离
    this.transformData.scale *= scale / this.store.scale;
    // 设置缩放的偏移,之前纠结在使用两指的偏移位置来计算,实际上缩放后大小的变化不是两指间移动的距离
    // 变化大小其实就是缩放的大小乘原来的大小
    this.transformData.x +=
      oldSize[0] *
      (1 - scale / this.store.scale) *
      this.scaleTranslateProportion[0] || 0;
    this.transformData.y +=
      oldSize[1] *
      (1 - scale / this.store.scale) *
      this.scaleTranslateProportion[1] || 0;
    // 记录这一次两指距离
    this.store.scale = scale;
    this.setTransform();
  }
  // 进行指定大小的缩放
  doscale (size, useCenter = true) {
    if (size === 0) return
    // 原来的画布大小
    const oldSize = [
      this.transformDom.offsetWidth * this.transformData.scale,
      this.transformDom.offsetHeight * this.transformData.scale,
    ];
    const scaleCenter = [
      (this.canvasSize[0] / 2 - this.transformData.x) / this.transformData.scale,
      (this.canvasSize[1] / 2 - this.transformData.y) / this.transformData.scale,
    ];
    let scaleTranslateProportion = this.scaleTranslateProportion
    // 点加减号缩放的是中心,不是加减号缩放的是上次的中心
    if (useCenter) {
      // 缩放导致偏移的比例
      scaleTranslateProportion = [
        scaleCenter[0] / this.transformDom.offsetWidth,
        scaleCenter[1] / this.transformDom.offsetHeight,
      ];
    }
    this.transformData.x +=
      oldSize[0] *
      (1 - size) *
      scaleTranslateProportion[0] || 0;
    this.transformData.y +=
      oldSize[1] *
      (1 - size) *
      scaleTranslateProportion[1] || 0;
    this.transformData.scale *= size
    this.draw()
  }
  setTransform() {
    console.log(this.transformData);
    this.transformDom.style.transform = `
      translate(${this.transformData.x || 0}px, ${this.transformData.y || 0}px)
      scale(${this.transformData.scale || 0}, ${this.transformData.scale || 0})`;
  }
  enlargeScale(e) {
    e.stopPropagation();
    if (this.transformData.scale * 1.2 <= 1) {
      this.doscale(1.2)
    } else {
      console.log(1 / this.transformData.scale);
      this.doscale(1 / this.transformData.scale)
    }
  }
  narrowScale(e) {
    e.stopPropagation();
    if (this.transformData.scale * 0.8 >= 0.1) {
      this.doscale(0.8)
    } else {
      this.doscale(0.1 / this.transformData.scale)
    }
  }
  touchend () {
    this.store = {
      x: 0,
      y: 0,
      scale: 1,
    }
    this.touchType = ''
    // if (this.transformData.scale > 1) {
    //   this.doscale(1 / this.transformData.scale, false)
    // } 
    // if (this.transformData.scale < 0.1) {
    //   this.doscale(0.1 / this.transformData.scale, false)
    // }
  }
  getTransformData () {

  }
  distory() {

  }

}
export default TouchMoveScale