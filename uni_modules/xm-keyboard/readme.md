# xm-keyboard 介绍

xm-keyboard是一款虚拟键盘, 支持自定义拓展键盘内容。



插件已按照easycom处理, 支持直接使用

## 如何使用(v1.1.0使用说明)



## xm-keyboard-v2



> xm-keyboard-v2, 是对多个组件的聚合处理，也可以自行结合实现

```vue
<template>
	<view>
    	<xm-cell special label="【v2】车牌号" :value="value" @show="showKeyboard('xmKeyboard')"></xm-cell>
        // 虚拟键盘载体
        <xm-keyboard-v2 ref="xmKeyboard" @confirm="(v) => value = v"></xm-keyboard-v2>
    </view>
</template>

<script>
	export default {
        data(){
            return {
                value: '京A11223'
            }
        },
        methods: {
            showKeyboard(ref){
				this.$refs[ref].toShow(this.value)
			},
        }
    }
</script>
```

## 属性说明

| 名称        | 类型    | 是否必填 | 默认值  | 可选值      | 说明                      |
| ----------- | ------- | -------- | ------- | ----------- | ------------------------- |
| title       | string  | 否       | ''      |             | 显示键盘标题              |
| cursor      | boolean | 否       | false   | true、false | 是否显示光标              |
| vibration   | boolean | 否       | false   | true、false | 是否开启震动              |
| type        | string  | 否       | 'plate' |             | plate: 做了车牌号特殊处理 |
| max         | number  | 否       | 8       |             | 输入内容的最大长度        |
| showContent | boolean | 否       | false   | true、false | 是否直接显示键盘          |
|             |         |          |         |             |                           |

## 事件说明

| 名称     | 参数           | 说明                               |
| -------- | -------------- | ---------------------------------- |
| @confirm | function(data) | 键盘数据变化回调, data：输入的内容 |
| @cancel  | function()     | 键盘关闭回调                       |



## xm-keyboard-box



> 键盘界面

```vue
<template>
	<view>
        <xm-keyboard-box></xm-keyboard-v2>
    </view>
</template>

<script>
	export default {
        
    }
</script>
```

## 属性说明

| 名称          | 类型    | 是否必填 | 默认值 | 可选值      | 说明             |
| ------------- | ------- | -------- | ------ | ----------- | ---------------- |
| vibration     | boolean | 否       | false  | true、false | 是否开启震动     |
| showChangeBtn | boolean | 否       | false  | true、false | 是否显示切换按钮 |
| showCancelBtn | boolean | 否       | false  | true、false | 是否显示取消按钮 |

## 事件说明

| 名称     | 参数           | 说明                               |
| -------- | -------------- | ---------------------------------- |
| @add     | function(data) | 键盘数据变化回调, data：输入的内容 |
| @del     | function()     | 删除按钮点击回调                   |
| @confirm | function()     | 确认按钮点击回调                   |
| @cancel  | function()     | 取消按钮点击回调                   |
| @clear   | function()     | 清空按钮点击回调                   |



## xm-keyboard-input



> 键盘输入框界面

```vue
<template>
	<view>
        <xm-keyboard-input></xm-keyboard-input>
    </view>
</template>

<script>
	export default {
        
    }
</script>
```

## 属性说明

| 名称        | 类型    | 是否必填 | 默认值 | 可选值      | 说明                            |
| ----------- | ------- | -------- | ------ | ----------- | ------------------------------- |
| initValue   | string  | 否       | ''     |             | 默认输入值                      |
| cursor      | boolean | 否       | false  | true、false | 是否显示光标                    |
| max         | number  | 否       | 8      |             | 键盘输入框数量                  |
| showPointer | boolean | 否       | true   | true、false | 默认第二位 和 第三位之间 有个点 |

## 事件说明

| 名称     | 参数           | 说明                               |
| -------- | -------------- | ---------------------------------- |
| @add     | function(data) | 键盘数据变化回调, data：输入的内容 |
| @del     | function()     | 删除按钮点击回调                   |
| @confirm | function()     | 确认按钮点击回调                   |
| @cancel  | function()     | 取消按钮点击回调                   |
| @clear   | function()     | 清空按钮点击回调                   |






## 如何使用(v1.0.2使用说明)




```vue
<xm-keyboard :show="show"></xm-keyboard>
```


## 属性说明

| 名称         | 类型    | 是否必填 | 默认值 | 可选值      | 说明                                 |
| ------------ | ------- | -------- | ------ | ----------- | ------------------------------------ |
| show         | boolean | 是       | false  | true、false | 是否展示键盘                         |
| mask         | boolean | 否       | true   | true、false | 是否显示遮罩                         |
| anim         | boolean | 否       | true   | true、false | 是否显示弹起动画                     |
| defaultValue | string  | 否       | ''     |             | 默认值                               |
| exchange     | boolean | 否       | true   | true、false | 是否显示切换键盘按钮                 |
| mode         | number  | 否       | 1      | 0、1        | 0：地区键盘，1：字母数字键盘，可拓展 |
| maxLength    | number  | 否       | -1     |             | 限制输入长度                         |
| disable      | string  | 否       | IO     |             | 禁用哪些按键                         |
| maxAutoClose | boolean | 否       | false  | true、false | 达到最大长度后是否自动关闭键盘       |
| safeSize	   | number  | 否       | 10  | 		 | 距离底部的安全距离, 自动匹配失效时可手动配置       |



## 事件说明

| 名称    | 参数           | 说明                                                         |
| ------- | -------------- | ------------------------------------------------------------ |
| @change | function(data) | 键盘数据变化回调, data({ text: '', v: '', add: true }) text:输入的值, v:本次变化的值, add:添加还是删除 |
| @close  | function(show) | 键盘关闭回调, show: 是否显示                                 |



## 快速体验

![](http://cdn.faysunshine.com/tc/202212211030790.png)