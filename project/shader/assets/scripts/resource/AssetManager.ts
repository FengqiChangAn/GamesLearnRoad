/**
 * 资源管理器
 * 负责资源的缓存、引用计数管理、资源查找等功能
 */

/**
 * 资源信息
 */
interface AssetInfo {
    /** 资源对象 */
    asset: cc.Asset;
    /** 引用计数 */
    refCount: number;
    /** 资源路径 */
    path: string;
    /** 最后使用时间 */
    lastUsedTime: number;
}

/**
 * 资源管理器
 */
export class AssetManager {
    private static instance: AssetManager;
    
    /** 资源缓存池 */
    private assetCache: Map<string, AssetInfo> = new Map();
    
    /** 资源依赖关系 */
    private assetDependencies: Map<string, Set<string>> = new Map();

    /**
     * 获取单例实例
     */
    public static getInstance(): AssetManager {
        if (!AssetManager.instance) {
            AssetManager.instance = new AssetManager();
        }
        return AssetManager.instance;
    }

    /**
     * 注册资源
     * @param path 资源路径
     * @param asset 资源对象
     */
    public registerAsset(path: string, asset: cc.Asset): void {
        if (!this.assetCache.has(path)) {
            this.assetCache.set(path, {
                asset,
                refCount: 0,
                path,
                lastUsedTime: Date.now()
            });
        }

        // 记录资源依赖关系
        this.recordDependencies(path, asset);
    }

    /**
     * 记录资源依赖关系
     */
    private recordDependencies(path: string, asset: cc.Asset): void {
        if (!asset || !asset['_uuid']) {
            return;
        }

        // 获取资源的依赖资源
        const deps = cc.assetManager.dependUtil.getDeps(asset['_uuid']);
        
        if (deps && deps.length > 0) {
            if (!this.assetDependencies.has(path)) {
                this.assetDependencies.set(path, new Set());
            }

            const depSet = this.assetDependencies.get(path)!;
            for (const dep of deps) {
                depSet.add(dep);
            }
        }
    }

    /**
     * 获取资源（自动增加引用计数）
     * @param path 资源路径
     * @returns Promise<cc.Asset>
     */
    public async getAsset(path: string): Promise<cc.Asset> {
        // 先从缓存查找
        const assetInfo = this.assetCache.get(path);
        if (assetInfo) {
            // 增加引用计数
            assetInfo.refCount++;
            assetInfo.lastUsedTime = Date.now();
            return assetInfo.asset;
        }

        // 如果缓存中没有，尝试加载
        const { AssetLoader } = await import('./AssetLoader');
        const loader = AssetLoader.getInstance();
        const asset = await loader.loadAsset(path);

        // 注册资源
        this.registerAsset(path, asset);

        // 增加引用计数
        const info = this.assetCache.get(path)!;
        info.refCount++;
        info.lastUsedTime = Date.now();

        return asset;
    }

    /**
     * 查找资源（不增加引用计数）
     * @param path 资源路径
     * @returns cc.Asset | null
     */
    public findAsset(path: string): cc.Asset | null {
        const assetInfo = this.assetCache.get(path);
        return assetInfo ? assetInfo.asset : null;
    }

    /**
     * 释放资源引用（减少引用计数）
     * @param path 资源路径
     * @param force 是否强制释放（忽略引用计数）
     */
    public releaseAsset(path: string, force: boolean = false): void {
        const assetInfo = this.assetCache.get(path);
        if (!assetInfo) {
            return;
        }

        if (force) {
            // 强制释放
            assetInfo.refCount = 0;
        } else {
            // 减少引用计数
            assetInfo.refCount = Math.max(0, assetInfo.refCount - 1);
        }

        // 如果引用计数为0，触发自动释放
        if (assetInfo.refCount === 0) {
            // 使用动态导入避免循环依赖
            import('./AssetRelease').then(({ AssetRelease }) => {
                AssetRelease.getInstance().autoRelease(path);
            });
        }
    }

    /**
     * 获取引用计数
     * @param path 资源路径
     * @returns number
     */
    public getRefCount(path: string): number {
        const assetInfo = this.assetCache.get(path);
        return assetInfo ? assetInfo.refCount : 0;
    }

    /**
     * 增加引用计数
     * @param path 资源路径
     */
    public addRef(path: string): void {
        const assetInfo = this.assetCache.get(path);
        if (assetInfo) {
            assetInfo.refCount++;
            assetInfo.lastUsedTime = Date.now();
        }
    }

    /**
     * 减少引用计数
     * @param path 资源路径
     */
    public removeRef(path: string): void {
        this.releaseAsset(path, false);
    }

    /**
     * 获取资源信息
     * @param path 资源路径
     * @returns AssetInfo | null
     */
    public getAssetInfo(path: string): AssetInfo | null {
        return this.assetCache.get(path) || null;
    }

    /**
     * 获取所有资源路径
     * @returns string[]
     */
    public getAllAssetPaths(): string[] {
        return Array.from(this.assetCache.keys());
    }

    /**
     * 获取资源缓存大小
     * @returns number
     */
    public getCacheSize(): number {
        return this.assetCache.size;
    }

    /**
     * 获取资源依赖
     * @param path 资源路径
     * @returns string[]
     */
    public getDependencies(path: string): string[] {
        const deps = this.assetDependencies.get(path);
        return deps ? Array.from(deps) : [];
    }

    /**
     * 清除资源缓存（谨慎使用）
     * @param force 是否强制清除所有资源
     */
    public clearCache(force: boolean = false): void {
        if (force) {
            // 强制清除所有资源
            this.assetCache.clear();
            this.assetDependencies.clear();
        } else {
            // 只清除引用计数为0的资源
            const pathsToRemove: string[] = [];
            
            for (const [path, info] of Array.from(this.assetCache.entries())) {
                if (info.refCount === 0) {
                    pathsToRemove.push(path);
                }
            }

            for (const path of pathsToRemove) {
                this.assetCache.delete(path);
                this.assetDependencies.delete(path);
            }
        }
    }

    /**
     * 获取未使用的资源列表（引用计数为0）
     * @returns string[]
     */
    public getUnusedAssets(): string[] {
        const unused: string[] = [];
        
        for (const [path, info] of Array.from(this.assetCache.entries())) {
            if (info.refCount === 0) {
                unused.push(path);
            }
        }

        return unused;
    }

    /**
     * 获取资源使用统计信息
     */
    public getStatistics(): {
        totalAssets: number;
        usedAssets: number;
        unusedAssets: number;
        totalRefCount: number;
    } {
        let usedAssets = 0;
        let totalRefCount = 0;

        for (const info of Array.from(this.assetCache.values())) {
            if (info.refCount > 0) {
                usedAssets++;
            }
            totalRefCount += info.refCount;
        }

        return {
            totalAssets: this.assetCache.size,
            usedAssets,
            unusedAssets: this.assetCache.size - usedAssets,
            totalRefCount
        };
    }
}
