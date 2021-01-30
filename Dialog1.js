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
    //7. 此时我们的参数已经校验好了 然后把参数挂在到我们的实例上
    function ModalPlugin(options){
        this.options = options
        //8.1 需要用的东西都初始化一下
        this.$drag_modal = null
        this.$drag_content = null
        //7.1 初始化结构  也就是创建 html结构
        this.init()
    }
    //2. 原型重定向
    ModalPlugin.prototype = {
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
        },
        // 10.打开弹框的方法
        open(){
            this.$drag_modal ? this.$drag_modal.style.display = 'block' : null
            this.$drag_content ? this.$drag_content.style.display = 'block' : null
        },
        // 11.关闭弹框(隐藏)
        close(){
            this.$drag_modal ? this.$drag_modal.style.display = 'none' : null
            this.$drag_content ? this.$drag_content.style.display = 'none' : null
        },
        // 12. 销毁
        destroy(){
            this.$drag_modal ? document.body.removeChild( this.$drag_modal ):null
            this.$drag_content ? document.body.removeChild( this.$drag_content ):null
        },
        //7.1 入口 命令模式 主要初始化我们的结构
        init:function(){
            this.createDOM()
            //9. 默认就打开弹框和遮罩层
            this.options.opened ? this.open() : null
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
        }
    }
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
        opened:{
            type:'boolean',
            default:true
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