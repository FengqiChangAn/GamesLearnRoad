/**
 * 资源释放器
 * 负责资源的释放策略、依赖关系管理等功能
 */

import { AssetManager } from "./AssetManager";

/**
 * 释放策略
 */
export enum ReleaseStrategy {
    /** 立即释放 */
    IMMEDIATE = 0,
    /** 延迟释放 */
    DELAYED = 1,
    /** 手动释放 */
    MANUAL = 2
}

/**
 * 释放配置
 */
interface ReleaseConfig {
    /** 释放策略 */
    strategy: ReleaseStrategy;
    /** 延迟时间（毫秒，仅DELAYED策略有效） */
    delayTime?: number;
}

/**
 * 延迟释放任务
 */
interface DelayedReleaseTask {
    path: string;
    releaseTime: number;
}

/**
 * 资源释放器
 */
export class AssetRelease {
    private static instance: AssetRelease;
    
    /** 释放配置 */
    private releaseConfig: ReleaseConfig = {
        strategy: ReleaseStrategy.IMMEDIATE,
        delayTime: 5000 // 默认延迟5秒
    };
    
    /** 延迟释放任务列表 */
    private delayedTasks: DelayedReleaseTask[] = [];
    
    /** 是否正在处理延迟任务 */
    private isProcessingDelayedTasks: boolean = false;

    /**
     * 获取单例实例
     */
    public static getInstance(): AssetRelease {
        if (!AssetRelease.instance) {
            AssetRelease.instance = new AssetRelease();
        }
        return AssetRelease.instance;
    }

    /**
     * 设置释放策略
     * @param strategy 释放策略
     * @param delayTime 延迟时间（仅DELAYED策略有效）
     */
    public setReleaseStrategy(strategy: ReleaseStrategy, delayTime?: number): void {
        this.releaseConfig.strategy = strategy;
        if (delayTime !== undefined) {
            this.releaseConfig.delayTime = delayTime;
        }

        // 如果切换到非延迟策略，立即处理所有延迟任务
        if (strategy !== ReleaseStrategy.DELAYED) {
            this.processAllDelayedTasks();
        }
    }

    /**
     * 自动释放资源（引用计数为0时调用）
     * @param path 资源路径
     */
    public autoRelease(path: string): void {
        if (this.releaseConfig.strategy === ReleaseStrategy.MANUAL) {
            // 手动释放策略，不自动释放
            return;
        }

        if (this.releaseConfig.strategy === ReleaseStrategy.IMMEDIATE) {
            // 立即释放
            this.doRelease(path);
        } else if (this.releaseConfig.strategy === ReleaseStrategy.DELAYED) {
            // 延迟释放
            this.scheduleDelayedRelease(path);
        }
    }

    /**
     * 执行释放
     */
    private doRelease(path: string): void {
        const manager = AssetManager.getInstance();
        const assetInfo = manager.getAssetInfo(path);

        if (!assetInfo) {
            return;
        }

        // 检查引用计数
        if (assetInfo.refCount > 0) {
            console.warn(`资源 ${path} 的引用计数不为0，无法释放`);
            return;
        }

        // 释放依赖资源, cocos会自动对依赖资源进行减引用计数
        // this.releaseDependencies(path);

        // 释放资源本身
        const asset = assetInfo.asset;
        
        // 从缓存中移除
        manager.clearCache(false);

        // 调用Cocos的资源释放
        if (asset && asset['_uuid']) {
            asset.decRef();
        }

        console.log(`资源已释放: ${path}`);
    }

    /**
     * 释放依赖资源
     */
    // private releaseDependencies(path: string): void {
    //     const manager = AssetManager.getInstance();
    //     const dependencies = manager.getDependencies(path);

    //     for (const depPath of dependencies) {
    //         const depInfo = manager.getAssetInfo(depPath);
    //         if (depInfo && depInfo.refCount === 0) {
    //             // 递归释放依赖资源
    //             this.doRelease(depPath);
    //         }
    //     }
    // }

    /**
     * 安排延迟释放
     */
    private scheduleDelayedRelease(path: string): void {
        // 检查是否已经在延迟列表中
        const existingTask = this.delayedTasks.find(task => task.path === path);
        if (existingTask) {
            // 更新释放时间
            existingTask.releaseTime = Date.now() + (this.releaseConfig.delayTime || 5000);
            return;
        }

        // 添加新的延迟任务
        this.delayedTasks.push({
            path,
            releaseTime: Date.now() + (this.releaseConfig.delayTime || 5000)
        });

        // 开始处理延迟任务
        this.processDelayedTasks();
    }

    /**
     * 处理延迟释放任务
     */
    private processDelayedTasks(): void {
        if (this.isProcessingDelayedTasks) {
            return;
        }

        this.isProcessingDelayedTasks = true;

        const checkInterval = 100; // 每100ms检查一次
        const checkTimer = setInterval(() => {
            const now = Date.now();
            const tasksToRelease: string[] = [];

            // 找出需要释放的任务
            for (let i = this.delayedTasks.length - 1; i >= 0; i--) {
                const task = this.delayedTasks[i];
                
                // 检查是否到了释放时间
                if (now >= task.releaseTime) {
                    // 再次检查引用计数
                    const manager = AssetManager.getInstance();
                    const refCount = manager.getRefCount(task.path);
                    
                    if (refCount === 0) {
                        tasksToRelease.push(task.path);
                        this.delayedTasks.splice(i, 1);
                    } else {
                        // 引用计数不为0，移除任务
                        this.delayedTasks.splice(i, 1);
                    }
                }
            }

            // 执行释放
            for (const path of tasksToRelease) {
                this.doRelease(path);
            }

            // 如果没有延迟任务了，停止检查
            if (this.delayedTasks.length === 0) {
                clearInterval(checkTimer);
                this.isProcessingDelayedTasks = false;
            }
        }, checkInterval);
    }

    /**
     * 处理所有延迟任务（立即释放）
     */
    private processAllDelayedTasks(): void {
        const tasksToRelease = this.delayedTasks.map(task => task.path);
        this.delayedTasks = [];

        for (const path of tasksToRelease) {
            const manager = AssetManager.getInstance();
            const refCount = manager.getRefCount(path);
            
            if (refCount === 0) {
                this.doRelease(path);
            }
        }
    }

    /**
     * 强制释放资源（忽略引用计数和策略）
     * @param path 资源路径
     */
    public forceRelease(path: string): void {
        const manager = AssetManager.getInstance();
        const assetInfo = manager.getAssetInfo(path);

        if (!assetInfo) {
            return;
        }

        // 从延迟任务中移除
        this.delayedTasks = this.delayedTasks.filter(task => task.path !== path);

        // 强制释放
        this.doRelease(path);
    }

    /**
     * 释放所有资源
     * @param force 是否强制释放（忽略引用计数）
     */
    public releaseAll(force: boolean = false): void {
        const manager = AssetManager.getInstance();
        const allPaths = manager.getAllAssetPaths();

        if (force) {
            // 强制释放所有资源
            for (const path of allPaths) {
                this.forceRelease(path);
            }
        } else {
            // 只释放引用计数为0的资源
            const unusedAssets = manager.getUnusedAssets();
            for (const path of unusedAssets) {
                this.autoRelease(path);
            }
        }
    }

    /**
     * 取消延迟释放（如果资源被重新使用）
     * @param path 资源路径
     */
    public cancelDelayedRelease(path: string): void {
        this.delayedTasks = this.delayedTasks.filter(task => task.path !== path);
    }

    /**
     * 获取延迟释放任务数量
     * @returns number
     */
    public getDelayedTaskCount(): number {
        return this.delayedTasks.length;
    }

    /**
     * 清理所有延迟任务
     */
    public clearDelayedTasks(): void {
        this.delayedTasks = [];
        this.isProcessingDelayedTasks = false;
    }
}
