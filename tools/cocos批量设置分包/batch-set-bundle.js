#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

/**
 * 批量设置Bundle配置脚本
 * 使用方法: node batch-set-bundle.js
 */
class BatchBundleSetter {
    constructor() {
        this.subpackagesPath = path.join(__dirname, 'assets/subpackages');
        this.successCount = 0;
        this.errorCount = 0;
        this.errors = [];
    }

    async execute() {
        console.log('🚀 开始批量设置Bundle配置...');
        console.log(`📁 分包路径: ${this.subpackagesPath}`);
        
        try {
            const subpackages = await this.getSubpackages();
            console.log(`📦 找到 ${subpackages.length} 个分包`);
            
            for (let i = 0; i < subpackages.length; i++) {
                const subpackage = subpackages[i];
                console.log(`\n[${i + 1}/${subpackages.length}] 处理分包: ${subpackage}`);
                
                try {
                    await this.setBundleForSubpackage(subpackage);
                    this.successCount++;
                    console.log(`✅ ${subpackage} 设置成功`);
                } catch (error) {
                    this.errorCount++;
                    this.errors.push({ subpackage, error: error.message });
                    console.log(`❌ ${subpackage} 设置失败: ${error.message}`);
                }
                
                // 添加延迟避免过快操作
                await this.sleep(50);
            }
            
            this.printSummary();
            
        } catch (error) {
            console.error('❌ 批量设置失败:', error.message);
        }
    }

    async getSubpackages() {
        return new Promise((resolve, reject) => {
            fs.readdir(this.subpackagesPath, (err, files) => {
                if (err) {
                    reject(new Error(`读取分包目录失败: ${err.message}`));
                    return;
                }
                
                const directories = files.filter(file => {
                    const fullPath = path.join(this.subpackagesPath, file);
                    try {
                        return fs.statSync(fullPath).isDirectory();
                    } catch {
                        return false;
                    }
                });
                
                resolve(directories);
            });
        });
    }

    async setBundleForSubpackage(subpackageName) {
        const subpackagePath = path.join(this.subpackagesPath, subpackageName);
        const metaPath = path.join(this.subpackagesPath, `${subpackageName}.meta`);
        
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(subpackagePath)) {
                reject(new Error(`分包目录不存在: ${subpackagePath}`));
                return;
            }

            if (!fs.existsSync(metaPath)) {
                reject(new Error(`未找到.meta文件: ${metaPath}`));
                return;
            }

            try {
                const metaContent = fs.readFileSync(metaPath, 'utf8');
                const meta = JSON.parse(metaContent);

                // 只添加honor-minigame属性，保持其他配置不变
                if (!meta.compressionType) {
                    meta.compressionType = {};
                }
                if (!meta.compressionType['honor-minigame']) {
                    meta.compressionType['honor-minigame'] = 'zip';
                }
                
                if (!meta.optimizeHotUpdate) {
                    meta.optimizeHotUpdate = {};
                }
                if (!meta.optimizeHotUpdate['honor-minigame']) {
                    meta.optimizeHotUpdate['honor-minigame'] = false;
                }
                
                if (!meta.inlineSpriteFrames) {
                    meta.inlineSpriteFrames = {};
                }
                if (!meta.inlineSpriteFrames['honor-minigame']) {
                    meta.inlineSpriteFrames['honor-minigame'] = false;
                }
                
                if (!meta.isRemoteBundle) {
                    meta.isRemoteBundle = {};
                }
                if (!meta.isRemoteBundle['honor-minigame']) {
                    meta.isRemoteBundle['honor-minigame'] = true;
                }

                const updatedMetaContent = JSON.stringify(meta, null, 2);
                fs.writeFileSync(metaPath, updatedMetaContent, 'utf8');

                resolve();
            } catch (error) {
                reject(new Error(`处理.meta文件失败: ${error.message}`));
            }
        });
    }

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 批量设置Bundle配置完成');
        console.log('='.repeat(50));
        console.log(`✅ 成功: ${this.successCount} 个分包`);
        console.log(`❌ 失败: ${this.errorCount} 个分包`);
        
        if (this.errors.length > 0) {
            console.log('\n❌ 失败详情:');
            this.errors.forEach(({ subpackage, error }) => {
                console.log(`  - ${subpackage}: ${error}`);
            });
        }
        
        console.log('\n🎉 批量设置完成！');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 执行脚本
const batchSetter = new BatchBundleSetter();
batchSetter.execute().catch(console.error);
