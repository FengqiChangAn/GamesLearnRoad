/**
 * 资源加载器
 * 负责资源的加载、预加载、版本管理等功能
 */

import { AssetManager } from "./AssetManager";

/**
 * 加载选项
 */
export interface LoadOptions {
    /** 资源类型 */
    type?: typeof cc.Asset;
    /** 是否缓存 */
    cache?: boolean;
    /** 优先级 */
    priority?: LoadPriority;
}

/**
 * 加载优先级
 */
export enum LoadPriority {
    LOW = 0,      // 低优先级
    NORMAL = 1,   // 普通优先级
    HIGH = 2,     // 高优先级
    CRITICAL = 3  // 关键优先级
}

/**
 * 版本信息
 */
export interface VersionInfo {
    /** 版本号 */
    version: string;
    /** 资源大小 */
    size: number;
    /** 资源MD5值 */
    md5: string;
    /** 更新时间戳 */
    updateTime: number;
    /** 是否需要更新 */
    needUpdate?: boolean;
    /** 最新版本号 */
    latestVersion?: string;
}

/**
 * 预加载任务
 */
interface PreloadTask {
    path: string;
    priority: LoadPriority;
    resolve: (value: void | PromiseLike<void>) => void;
    reject: (reason?: any) => void;
}

/**
 * 资源加载器基类
 */
export class AssetLoader {
    private static instance: AssetLoader;
    
    /** 预加载队列 */
    private preloadQueue: PreloadTask[] = [];
    
    /** 是否正在处理预加载队列 */
    private isProcessingQueue: boolean = false;
    
    /** 最大并发加载数 */
    private maxConcurrentLoads: number = 5;
    
    /** 当前正在加载的数量 */
    private currentLoads: number = 0;
    
    /** 版本信息缓存 */
    private versionCache: Map<string, VersionInfo> = new Map();
    
    /** 远程资源版本服务器地址 */
    private versionServerUrl: string = '';

    /**
     * 获取单例实例
     */
    public static getInstance(): AssetLoader {
        if (!AssetLoader.instance) {
            AssetLoader.instance = new AssetLoader();
        }
        return AssetLoader.instance;
    }

    /**
     * 设置版本服务器地址
     */
    public setVersionServerUrl(url: string): void {
        this.versionServerUrl = url;
    }

    /**
     * 设置最大并发加载数
     */
    public setMaxConcurrentLoads(count: number): void {
        this.maxConcurrentLoads = Math.max(1, count);
    }

    /**
     * 判断是否为远程资源
     */
    private isRemotePath(path: string): boolean {
        return path.startsWith('http://') || path.startsWith('https://');
    }

    /**
     * 加载单个资源
     * @param path 资源路径
     * @param options 加载选项
     * @returns Promise<cc.Asset>
     */
    public async loadAsset(path: string, options?: LoadOptions): Promise<cc.Asset> {
        try {
            // 检查资源版本
            if (this.versionServerUrl) {
                const versionInfo = await this.checkVersion(path);
                if (versionInfo.needUpdate) {
                    await this.updateAsset(path, versionInfo.latestVersion!);
                }
            }

            let asset: cc.Asset;

            if (this.isRemotePath(path)) {
                // 远程资源加载
                asset = await this.loadRemoteAsset(path, options);
            } else {
                // 本地资源加载
                asset = await this.loadLocalAsset(path, options);
            }

            // 注册到资源管理器
            if (asset && options?.cache !== false) {
                AssetManager.getInstance().registerAsset(path, asset);
            }

            return asset;
        } catch (error) {
            console.error(`加载资源失败: ${path}`, error);
            throw error;
        }
    }

    /**
     * 加载本地资源
     */
    private async loadLocalAsset(path: string, options?: LoadOptions): Promise<cc.Asset> {
        return new Promise((resolve, reject) => {
            // 先尝试从缓存获取
            const cachedAsset = AssetManager.getInstance().findAsset(path);
            if (cachedAsset) {
                resolve(cachedAsset);
                return;
            }

            // 获取bundle
            const bundleName = this.getBundleName(path);
            const bundle = cc.assetManager.getBundle(bundleName) || cc.resources;

            // 加载资源
            bundle.load(path, options?.type || cc.Asset, (err: Error, asset: cc.Asset) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(asset);
                }
            });
        });
    }

    /**
     * 加载远程资源
     */
    private async loadRemoteAsset(path: string, options?: LoadOptions): Promise<cc.Asset> {
        return new Promise((resolve, reject) => {
            // 先尝试从缓存获取
            const cachedAsset = AssetManager.getInstance().findAsset(path);
            if (cachedAsset) {
                resolve(cachedAsset);
                return;
            }

            // 加载远程资源
            cc.assetManager.loadRemote(path, options?.type || cc.Asset, (err: Error, asset: cc.Asset) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(asset);
                }
            });
        });
    }

    /**
     * 从路径获取bundle名称
     */
    private getBundleName(path: string): string {
        // 简单实现：可以根据项目需求扩展
        // 例如：'bundle1/textures/hero.png' -> 'bundle1'
        const parts = path.split('/');
        if (parts.length > 1 && parts[0].endsWith('bundle')) {
            return parts[0];
        }
        return 'resources';
    }

    /**
     * 预加载资源列表
     * @param paths 资源路径列表
     * @param priority 优先级
     * @returns Promise<void>
     */
    public async preloadAssets(paths: string[], priority: LoadPriority = LoadPriority.NORMAL): Promise<void> {
        const promises: Promise<void>[] = [];

        for (const path of paths) {
            promises.push(
                new Promise<void>((resolve, reject) => {
                    // 检查是否已加载
                    const cachedAsset = AssetManager.getInstance().findAsset(path);
                    if (cachedAsset) {
                        resolve();
                        return;
                    }

                    // 添加到预加载队列
                    this.preloadQueue.push({
                        path,
                        priority,
                        resolve,
                        reject
                    });

                    // 按优先级排序
                    this.preloadQueue.sort((a, b) => b.priority - a.priority);
                })
            );
        }

        // 开始处理队列
        this.processPreloadQueue();

        // 等待所有资源加载完成
        await Promise.all(promises);
    }

    /**
     * 处理预加载队列
     */
    private async processPreloadQueue(): Promise<void> {
        if (this.isProcessingQueue || this.preloadQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.preloadQueue.length > 0 && this.currentLoads < this.maxConcurrentLoads) {
            const task = this.preloadQueue.shift();
            if (!task) break;

            this.currentLoads++;
            
            this.loadAsset(task.path, { priority: task.priority })
                .then(() => {
                    task.resolve();
                })
                .catch((error) => {
                    task.reject(error);
                })
                .then(() => {
                    this.currentLoads--;
                    // 继续处理队列
                    if (this.preloadQueue.length > 0) {
                        this.processPreloadQueue();
                    } else {
                        this.isProcessingQueue = false;
                    }
                });
        }

        this.isProcessingQueue = false;
    }

    /**
     * 检查资源版本
     * @param path 资源路径
     * @returns Promise<VersionInfo>
     */
    public async checkVersion(path: string): Promise<VersionInfo> {
        // 如果已缓存，直接返回
        if (this.versionCache.has(path)) {
            return this.versionCache.get(path)!;
        }

        try {
            // 获取本地版本信息
            const localVersion = this.getLocalVersion(path);

            // 获取远程版本信息
            const remoteVersion = await this.getRemoteVersion(path);

            const versionInfo: VersionInfo = {
                version: localVersion.version,
                size: remoteVersion.size,
                md5: remoteVersion.md5,
                updateTime: remoteVersion.updateTime,
                needUpdate: localVersion.version !== remoteVersion.version,
                latestVersion: remoteVersion.version
            };

            // 缓存版本信息
            this.versionCache.set(path, versionInfo);

            return versionInfo;
        } catch (error) {
            console.error(`检查版本失败: ${path}`, error);
            // 返回默认版本信息
            return {
                version: '1.0.0',
                size: 0,
                md5: '',
                updateTime: Date.now(),
                needUpdate: false
            };
        }
    }

    /**
     * 获取本地版本信息
     */
    private getLocalVersion(path: string): VersionInfo {
        // 从本地存储读取版本信息
        const key = `version_${path}`;
        const versionStr = cc.sys.localStorage.getItem(key);
        
        if (versionStr) {
            return JSON.parse(versionStr);
        }

        // 默认版本
        return {
            version: '1.0.0',
            size: 0,
            md5: '',
            updateTime: 0
        };
    }

    /**
     * 获取远程版本信息
     */
    private async getRemoteVersion(path: string): Promise<VersionInfo> {
        if (!this.versionServerUrl) {
            throw new Error('版本服务器地址未设置');
        }

        return new Promise((resolve, reject) => {
            const url = `${this.versionServerUrl}/version?path=${encodeURIComponent(path)}`;
            
            // 使用XMLHttpRequest获取版本信息
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            const versionInfo = JSON.parse(xhr.responseText);
                            resolve(versionInfo);
                        } catch (error) {
                            reject(new Error('解析版本信息失败'));
                        }
                    } else {
                        reject(new Error(`获取版本信息失败: ${xhr.status}`));
                    }
                }
            };
            xhr.onerror = () => {
                reject(new Error('网络错误'));
            };
            xhr.send();
        });
    }

    /**
     * 更新资源
     * @param path 资源路径
     * @param version 目标版本
     * @returns Promise<void>
     */
    public async updateAsset(path: string, version: string): Promise<void> {
        try {
            // 下载新版本资源
            const asset = await this.loadRemoteAsset(path);
            
            // 更新本地版本信息
            const versionInfo: VersionInfo = {
                version,
                size: 0, // 实际应该从服务器获取
                md5: '', // 实际应该从服务器获取
                updateTime: Date.now()
            };

            const key = `version_${path}`;
            cc.sys.localStorage.setItem(key, JSON.stringify(versionInfo));

            // 更新缓存
            this.versionCache.set(path, versionInfo);

            console.log(`资源更新成功: ${path} -> ${version}`);
        } catch (error) {
            console.error(`资源更新失败: ${path}`, error);
            throw error;
        }
    }

    /**
     * 清除版本缓存
     */
    public clearVersionCache(): void {
        this.versionCache.clear();
    }
}
