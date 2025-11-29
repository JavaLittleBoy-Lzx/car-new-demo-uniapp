<template>
	<view class="xm-keyboard-v2">
		<xm-popup :show="isShow" @close="toCancel" background="#d4d5d9" :showContent="showContent">
			<view style="background-color: #FFF;">
				<view class="xm-flex xm-title" v-if="title">
					{{ title }}
				</view>
				<view style="padding: 10px;">
					<xm-keyboard-input ref="keyboardInput" @change="inputChange" :cursor="cursor"
						:show-pointer="type == 'plate'" :max="max"
					></xm-keyboard-input>
				</view>
			</view>
			<xm-keyboard-box ref="keyboardBox" :show-change-btn="type == 'plate'" :show-cancel-btn="!showContent"
				@add="inputAdd" @del="inputDel" @clear="inputClear" @cancel="toCancel" @confirm="toConfirm"
			></xm-keyboard-box>
		</xm-popup>
	</view>
</template>

<script>
	export default {
		name: 'xm-keyboard-v2',
		emits: ['confirm', 'cancel'],
		props: {
			title: {
				type: String,
				default: ''
			},
			cursor: {
				type: Boolean,
				default: false
			},
			vibration: {
				type: Boolean,
				default: false
			},
			type: {
				type: String,
				default: 'plate'
			},
			max: {
				type: Number,
				default: 8,
			},
			showContent: {
				type: Boolean,
				default: false
			},
		},
		data() {
			return {
				isShow: false,
				value: '',
			}
		},
		methods: {
			toShow(value) {
				this.value = value || '';
				this.isShow = true;
				this.$refs.keyboardInput.changeValue(this.value);
			},
			toConfirm(){
				this.isShow = false;
				let value = this.$refs.keyboardInput.values.join('')
				this.$emit('confirm', value);
			},
			toCancel(){
				this.isShow = false;
				this.$emit('cancel');
			},
			inputChange(index){
				if(this.type == 'plate'){
					this.$refs.keyboardBox.changeMode(index == 0 ? 0 : 1);
				}else{
					this.$refs.keyboardBox.changeMode(1);
				}
			},
			inputAdd(v){
				this.$refs.keyboardInput.toAdd(v);
			},
			inputDel(){
				this.$refs.keyboardInput.toDel();
			},
			inputClear(){
				this.$refs.keyboardInput.toClear();
			}
		},
	}
</script>

<style lang="scss" scoped>
	.xm-keyboard-v2 {
		.xm-flex{
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.xm-title{
			padding: 20px 0 10px 0;
			font-weight: bold;
		}
	}
</style>