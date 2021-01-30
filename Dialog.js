//1. 创建的两种方式 我们可以直接new ModalPlugin()
// (function() {
//     function ModalPlugin(){

//     }

//     window.ModalPlugin = ModalPlugin
// })()
//第二种 既可以当作一个普通函数执行 也可以返回这个类的实例
// (function () {
//     function ModalPlugin(options){
//         return new Factory(options)
//     }
//     function Factory(options){
        
//     }
//     //2. 原型重定向
//     ModalPlugin.prototype = {
//         //2-1.重写构造函数 和版本
//         constructor:ModalPlugin,
//         version:'1.0.0'
//     }
//     init.prototype = ModalPlugin.prototype
//     //3. 支持commonjs 和 ES6 moudel 规范
//     if(typeof window !== 'undefined'){
//         window.M = window.ModalPlugin  = ModalPlugin
//     }
//     if(typeof module === 'object' && typeof module.exports === 'object'){
//         module.exports = ModalPlugin
//     }
// })()

// //以后在用的的时候 直接当作函数调用
// M()
(function () {
    function Sub() {
        this.pond = {};
    }
    Sub.prototype = {
        constructor: Sub,
        on(type, func) {
            let pond = this.pond;
            !pond.hasOwnProperty(type) ? pond[type] = [] : null;
            let arr = pond[type];
            for (let i = 0; i < arr.length; i++) {
                if (arr[i] === func) {
                    return;
                }
            }
            arr.push(func);
        },
        off(type, func) {
            let arr = this.pond[type] || [];
            for (let i = 0; i < arr.length; i++) {
                if (arr[i] === func) {
                    arr[i] = null;
                    break;
                }
            }
        },
        fire(type, ...params) {
            let arr = this.pond[type] || [];
            for (let i = 0; i < arr.length; i++) {
                let item = arr[i];
                if (typeof item === "function") {
                    item.call(this, ...params);
                    continue;
                }
                arr.splice(i, 1);
                i--;
            }
        }
    };
    window.Sub = Sub;
})();

(function () {
    //7. 此时我们的参数已经校验好了 然后把参数挂在到我们的实例上
    function ModalPlugin(options){
        //19.开始我们的继承组合继承 首先继承我们的线程池 当作一个实例
        Sub.call(this)
        this.options = options
        //8.1 需要用的东西都初始化一下
        this.$drag_modal = null
        this.$drag_content = null
        //15.把鼠标的开始位置 和我们的盒子的位置 记录一下
        this.startX = 0
        this.startY = 0
        this.contentL = 0
        this.contentT = 0
        //正平的宽度
        this.HTML = document.documentElement
        //7.1 初始化结构  也就是创建 html结构
        this.init()
    }
    //20. 然后继承我们的发布订阅的原型 创建一个空对象 让控对象的原型链__proto__ 指向我们的 Sub.prototype
    ModalPlugin.prototype = Object.create(Sub.prototype)
    //21. 原型重定向
    ModalPlugin.prototype = Object.assign(ModalPlugin.prototype,
        {
        //2-1.重写构造函数 和版本
        constructor:ModalPlugin,
        version:'1.0.0',
        //8.创建DOM结构
        createDOM:function(){
            // 把我们的参数结构出来 用来 判断 你的哪些结构需要根据参数显示和隐藏
            let {modal,title,template,buttons} = this.options
            // 这里我们注意 因为我们创建了两次元素 并且往body里插入了两次 就会产生两次回流 所以我们使用文档碎片
            // 先都插入到文档碎片里  然后 在想body里插入文档碎片
            let frag = document.createDocumentFragment()
            // 判断用户传进来的 是否需要遮罩层
            if(modal){
                // 创建好遮罩层 因为可能这个遮罩层 需要显示和隐藏 所以我们要挂在到我们的实例上
                this.$drag_modal = document.createElement('div')
                this.$drag_modal.className = 'drag_modal'
                // 把创建好的遮罩层 插入到我们的body中
                frag.appendChild(this.$drag_modal)
            }

            // 创建内容结构
            this.$drag_content = document.createElement('div')
            this.$drag_content.className = 'drag_content'
            this.$drag_content.innerHTML = `
            <div class="drag_head">
                ${title}
                <a href="javascript:;" class="drag_close"></a>
            </div>
            <div class="drag_main">
                ${template}
            </div>
            ${buttons.length > 0? `<div class="drag_foot">
                ${buttons.map((item,index) => {
                    return `<a href="javascript:;" index="${index}" class="drag_button">
                                ${item.text}
                            </a>`
                }).join('')}
            </div>`:''}
            `
            //使用文档碎片 减少回流
            frag.appendChild(this.$drag_content)
            document.body.appendChild(frag)
            // 18. DOM 创建的时候 我们就调用这个open的函数 
            this.options.onopen.call(this,this)
        },
        // 11.关闭弹框(隐藏)
        close(){
            if(this.$drag_modal ){
                this.$drag_modal.style.opacity = 0
                //这里需要加入动画结束事件 如果不加的话 你动画还没结束的时候 
                //你就移除了元素 动画会导致没效果
                this.$drag_modal.ontransitionend = () => {
                    document.body.removeChild( this.$drag_modal )
                    this.$drag_modal.ontransitionend = null
                }
            }
            if(this.$drag_content){
                this.$drag_content.style.opacity = 0
                this.$drag_content.ontransitionend = () => {
                    document.body.removeChild( this.$drag_content )
                    this.$drag_content.ontransitionend = null
                }
            }
             // 18. DOM 销毁的时候 我们就调用这个close的函数 
            this.options.onclose.call(this,this)
        },
        //15. 头部按下的事件
        down(ev){
            // 鼠标按下的时候 要记录 鼠标的位置 和你 content的位置 我们把他挂在到实例上
            this.startX = ev.clientX
            this.startY = ev.clientY
            // 拿到我们的content的离上面 和 左边的距离
            let{top,left} = this.$drag_content.getBoundingClientRect()
            this.contentL = left
            this.contentT = top
            // 然后开始移动
            window.onmousemove = this.move.bind(this)
            window.onmouseup = this.up.bind(this)

            //22. 直接通知我们拖拽开始执行了
            this.fire('ondragstart', this);
        },
        //16. 鼠标移动的事件
        move(ev){
            // 边界处理 向左的时候 如果小于我们的最小边界了 就等于 0 
            // 最大边界 是向右移动 最大边界 等于 我们整屏的宽度 减去 我么content的宽度
            let minL = 0
                minT = 0
                maxL = this.HTML.clientWidth - this.$drag_content.offsetWidth
                maxT = this.HTML.clientHeight - this.$drag_content.offsetHeight
            // 计算移动的距离 鼠标移动的位置 - 鼠标开始的位置 + 我们盒子的距离边界的距离
            let curL = ev.clientX - this.startX + this.contentL
                curT = ev.clientY - this.startY + this.contentT
            // 移动中 看看边界距离 如果向左边移动的时候 看看小于我们的安全距离不 如果小于了就等我我们的最小安全距离
            // 向右移动 看看 大于我们的最大安全距离不 如果大于 就等于我们的最大安全距离
            curL = curL < minL ? minL : curL > maxL ? maxL : curL
            curT = curT < minT ? minT : curT > maxT ? maxT : curT
            // 这里由于 我们盒子居中 用的是transform 设置的 起初就偏移了了所以我们要设置一下
            this.$drag_content.style.transform = 'translate(0, 0)'
            this.$drag_content.style.left = curL + 'px'
            this.$drag_content.style.top = curT + 'px'
            
            // 22. 通知 我们拖拽中 可以执行的函数
            this.fire('ondraging', this);
        },
        //17. 鼠标抬起的事件
        up(){
            // 由于这里我们采用的DOM 0级别 绑定 所以直接把事件给null 就可以了
            window.onmousemove = null
            window.onmouseup = null

            // 22. 拖拽结束的时候通知执行的函数
            this.fire('ondragend', this);
        },
        //7.1 入口 命令模式 主要初始化我们的结构
        init:function(){
            this.createDOM()
            // 如果不获取一下样式 我们初始的时候样式 透明度 是0 然后插入到DOM后直接就改成1了
            // 这种在修改 是一瞬间的时候 因为 获取从你的渲染队列里去拿修改的样式 所以这里 我们要获取一下 让渲染队列刷新
            this.$drag_modal.offsetLeft
            this.$drag_modal.style.opacity = 1
            this.$drag_content.style.opacity = 1
            // 13. 基于事件委托 去实现不同的点击事件
            if(this.$drag_content){
                let  _this = this
                this.$drag_content.addEventListener('click',function(ev){
                    // 看看 你点击的是哪个 是X 还是取消 还是 确定
                    let target = ev.target
                        targetTag = target.tagName
                        targetClass = target.className
                    // 如果点击的是x 说明就应该关闭弹框 函数不在向下执行
                    if(targetTag === 'A' && targetClass === 'drag_close'){
                        //由于这里我们this的指向 已经改变成我们的 drag_content 所以需要 缓存一下this
                        _this.close()
                        return
                    }

                    // 如果点击是我们的按钮 也就是我们的自定义按钮 这里如果确定 点击的是哪个按钮
                    // 我们在创建元素的时候 就给每个按钮设定自定义属性(这里我们设置的是索引) 然后 我们点击的时候 获取他的自定义属性
                    // 然后 根据索引 我们去buttons里找到这个按钮就可以确定是哪个按钮了
                    if(targetTag === 'A' && targetClass === 'drag_button'){
                        // 获取我们创建的时候 设置的自定义索引
                        let index = target.getAttribute('index')
                        // 根据取到的索引 我们去查找我们的自定义按钮
                            obj = _this.options.buttons[index]
                        // 做判断 如果你不存在 我就什么也不干
                        if(!obj || (typeof obj.click !== 'function')) return
                        // 这里 我们需要把函数调用 并且把this传进去
                        // 这里为了防止你在传 buttons 参数的时候 里面click 写的箭头函数 所以 我们把this也传进去
                        obj.click.call(_this,_this)
                        return
                    }
                })
            }
            // 14. 开启拖拽
            if(this.options.drag){
                // 我们需要他的头部有移动 所以要设置移动的样式 然后按下点击事件
                this.$drag_head = this.$drag_content? this.$drag_content.querySelector('.drag_head') : null
                if(this.$drag_head){
                    this.$drag_head.style.cursor = 'move'
                    // 因为我们要在鼠标按下的事件处理函数里 拿到我们的this.$drat_content 所以为了保证this指向正确我们用bind
                    this.$drag_head.onmousedown = this.down.bind(this)
                }
            }
        }
    })
    const isObject = function (value){
        let class2type = {}
            type = class2type.toString.call(value)
        return /Object/.test(type)
    }
    //6. 校验参数类型 参数是传了 但是不是我们的要的类型 我们就要校验一下
    const toType = function (value){
        let class2type = {}
        //这里就是验证了你传进来的是什么类型 比如是 10 那么type 就是 [object Number]
            type = class2type.toString.call(value)
        // 使用正则捕获到  把我们 [object Number] 中的 Number 截取出来 在转换成小写 
        // 这里是为了 跟我们的参数映射表 做匹配
        return  /^\[object ([a-z-A-Z]+)\]$/.exec(type)[1].toLowerCase()
    }
    // 把一些内部用的方法 扩展到ModalPlugin对象上 这样插件本身还能当作一个类库去使用
    ModalPlugin.isObject = isObject
    ModalPlugin.toType = toType
    //5.为了更严格的参数校验 我们就要建立参数映射表 为每一个参数严格校验
    const props = {
        title:{
            type:'string',
            default:'系统温馨提示'
        },
        template:{
            type:'string',
            required:true
        },
        buttons:{
            type:'array',
            default:[]
        },
        modal:{
            type:'boolean',
            default:true
        },
        drag:{
            type:'boolean',
            default:true
        },
        onopen:{
            type:'function',
            // 如果没传我们就给个默认匿名函数
            default: Function.prototype
        },
        onclose:{
            type:'function',
            // 如果没传我们就给个默认匿名函数
            default: function(){}
        }
    }
    //4.为了既可以像函数一样调用  也可以创造实例
    function proxy( options = {} ){
        //5. 参数 我们现在基于对象传递 我们需要的参数有 title template buttons modal drag opened 这些字段
        if(Object.prototype.toString.call(options) !== '[object Object]') throw new TypeError('类型不对,需要一个对象',)
        //6. 根据我们的参数映射规则表 校验参数
        let params = {}
        Object.keys(props).forEach( key => {
            //6.1 拿到每项的验证规则
            let {
                type,default:defaultVal,required = false
            } = props[key]
            //拿到 你传过来的参数 看看 你有没有传
            let val =  options[key]
            // 规则校验 这个是必须传的 但是 你没传 就报错
            if(required && val == undefined) throw new TypeError(`${key} 必须传递`)
            // 如果传了  但是不是我们要的类型 我们就需要类型校验
            if(val !== undefined){
                if(toType(val) !== type) throw new TypeError(`${key} 不是 ${type}`)
                //如果参数类型也正确 那么我们就赋值
                params[key] = val
                return
            }
            // 如果没传 也不需要 类型校验 就用我们的默认值
            params[key] = defaultVal
        })

        return new ModalPlugin(params)
    }
    //3. 支持commonjs 和 ES6 moudel 规范
    if(typeof window !== 'undefined'){
        window.M = window.ModalPlugin  = proxy
    }
    if(typeof module === 'object' && typeof module.exports === 'object'){
        module.exports = proxy
    }
})()

//以后在用的的时候 直接当作函数调用
// let m1 = M({
//     title:'true'
// })