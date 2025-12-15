# ff-cars-payment


## ff-cars-payment 汽车服务行业支付插件
> **组件名：ff-cars-payment**
> 代码块： `ff-cars-payment`


ff-cars-payment 支付一般在汽车服务领域内使用该插件下载订单，构建订单核心信息

### 安装方式

本组件符合[easycom](https://uniapp.dcloud.io/collocation/pages?id=easycom)规范，`HBuilderX 2.5.5`起，只需将本组件导入项目，在页面`template`中即可直接使用，无需在页面中`import`和注册`components`。



### 基本用法

在 ``template`` 中使用组件


```html
<ff-car-payment :store="store" :product="product" @success="paySuccess"></ff-car-payment>
```

## propertis

### prop 类型 Object

|属性名称		|说明		|类型		|参数		|
|:-:			|:-:		|:-:		|:-:		|
|contentStyle	|内联样式	|	String	| -			|
|store			|店铺对象	|	Object	| 店铺信息	|
|product		|产品信息	|	Object	| 店铺信息	|


### store 类型 Object

|属性名称	|说明		|类型		|参数				|
|:-:		|:-:		|:-:		|:-:				|
|name		|店铺名称	|	String	| 上海黄浦大江总店	|

### product 类型 Object

|属性名称	|说明		|类型		|参数	|
|:-:		|:-:		|:-:		|:-:	|
|name		|产量名称	|	String	|		|
|name		|产量名称	|	String	|		|

### category 类型 Object

|属性名称	|说明		|类型				|参数	|
|:-:		|:-:		|:-:				|:-:	|
|name		|车辆类型	|	String			|		|
|price		|车辆类型价	|	String			|		|
|category	|车辆类型价	|	可选suv,mpv,car	|		|





## API
### Events

|事件名		|事件说明								|返回参数			|
|:-:		|:-:									|:-:				|
|@success	|支付成功后回调方法					| 返回所选车辆对象	|





## 组件示例

示例项目
点击查看：[https://ext.dcloud.net.cn/plugin?id=17934](https://ext.dcloud.net.cn/plugin?id=17934)




