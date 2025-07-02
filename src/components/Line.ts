//画线函数
export const fnLineChart = function (eleDots: any) {
    eleDots.forEach((ele: any, index: number) => {
        const eleNext: any = eleDots[index - 1]
        if (!eleNext) {
            return
        }
        let eleLine = ele.querySelector('i')

        if (!eleLine) {
            eleLine = document.createElement('i')
            eleLine.className = 'line'
            ele.appendChild(eleLine)
        }
        // 记录坐标
        const boundThis = ele.getBoundingClientRect()
        // 下一个点的坐标
        const boundNext = eleNext.getBoundingClientRect()
        // 计算长度和旋转角度
        const x1 = boundThis.left,
            y1 = boundThis.top
        const x2 = boundNext.left,
            y2 = boundNext.top
        // 长度
        const distance = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1))
        // 弧度
        const radius = Math.atan2(y2 - y1, x2 - x1)
        // 设置线条样式
        eleLine.style.width = distance + 'px'
        eleLine.style.transform = `rotate(${radius}rad)`
        eleLine.style.position = 'absolute'
        eleLine.style.left = '50%'
        eleLine.style.top = '50%'
        eleLine.style.height = '1px'
        eleLine.style.boxSizing = 'border-box'
        eleLine.style.background = '#00EBFF'
        eleLine.style.transformOrigin = 'left center'
        eleLine.style.marginTop = '-1px'
        eleLine.style.pointerEvents = 'none'
        eleLine.style.zindex = '-1'
    })
}