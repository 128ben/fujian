export function throttle(fn: Function, limit: number) {
    let lastFn: NodeJS.Timeout | null = null;
    let lastRan: number | null = null;
    return function (...args: any[]) {
        const context = this;
        if (!lastRan) {
            fn.apply(context, args);
            lastRan = Date.now();
        } else {
            if (lastFn) clearTimeout(lastFn);
            lastFn = setTimeout(() => {
                if (Date.now() - lastRan! >= limit) {
                    fn.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}