export class CommonUtil {

    /**
     * 限定范围
     * @param l 最小值
     * @param r 最大值
     * @param cur 当前值
     * @returns 限定后的值
     */
    static limit(l: number, r: number, cur: number): number {
        const max = Math.max(l, r);
        const min = Math.min(l, r);
        cur = Math.min(Math.max(cur, min), max);
        return cur;
    }
}