#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import time
from pathlib import Path

class BatchBundleSetter:
    def __init__(self):
        self.subpackages_path = Path(__file__).parent / "assets" / "subpackages"
        self.success_count = 0
        self.error_count = 0
        self.errors = []

    def execute(self):
        print("🚀 开始批量设置Bundle配置...")
        print(f"📁 分包路径: {self.subpackages_path}")
        
        try:
            subpackages = self.get_subpackages()
            print(f"📦 找到 {len(subpackages)} 个分包")
            
            for i, subpackage in enumerate(subpackages):
                print(f"\n[{i + 1}/{len(subpackages)}] 处理分包: {subpackage}")
                
                try:
                    self.set_bundle_for_subpackage(subpackage)
                    self.success_count += 1
                    print(f"✅ {subpackage} 设置成功")
                except Exception as error:
                    self.error_count += 1
                    self.errors.append({"subpackage": subpackage, "error": str(error)})
                    print(f"❌ {subpackage} 设置失败: {error}")
                
                # 添加延迟避免过快操作
                time.sleep(0.05)
            
            self.print_summary()
            
        except Exception as error:
            print(f"❌ 批量设置失败: {error}")

    def get_subpackages(self):
        """获取所有分包目录"""
        if not self.subpackages_path.exists():
            raise Exception(f"分包目录不存在: {self.subpackages_path}")
        
        directories = []
        for item in self.subpackages_path.iterdir():
            if item.is_dir():
                directories.append(item.name)
        
        return sorted(directories)

    def set_bundle_for_subpackage(self, subpackage_name):
        """为单个分包设置Bundle配置"""
        subpackage_path = self.subpackages_path / subpackage_name
        meta_path = self.subpackages_path / f"{subpackage_name}.meta"
        
        if not subpackage_path.exists():
            raise Exception(f"分包目录不存在: {subpackage_path}")
        
        if not meta_path.exists():
            raise Exception(f"未找到.meta文件: {meta_path}")
        
        try:
            # 读取.meta文件
            with open(meta_path, 'r', encoding='utf-8') as f:
                meta = json.load(f)
            
            # 只添加honor-minigame属性，保持其他配置不变
            if "compressionType" not in meta:
                meta["compressionType"] = {}
            if "honor-minigame" not in meta["compressionType"]:
                meta["compressionType"]["honor-minigame"] = "zip"
            
            if "optimizeHotUpdate" not in meta:
                meta["optimizeHotUpdate"] = {}
            if "honor-minigame" not in meta["optimizeHotUpdate"]:
                meta["optimizeHotUpdate"]["honor-minigame"] = False
            
            if "inlineSpriteFrames" not in meta:
                meta["inlineSpriteFrames"] = {}
            if "honor-minigame" not in meta["inlineSpriteFrames"]:
                meta["inlineSpriteFrames"]["honor-minigame"] = False
            
            if "isRemoteBundle" not in meta:
                meta["isRemoteBundle"] = {}
            if "honor-minigame" not in meta["isRemoteBundle"]:
                meta["isRemoteBundle"]["honor-minigame"] = True
            
            # 保存.meta文件
            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump(meta, f, indent=2, ensure_ascii=False)
            
        except Exception as error:
            raise Exception(f"处理.meta文件失败: {error}")

    def print_summary(self):
        """打印结果统计"""
        print("\n" + "=" * 50)
        print("📊 批量设置Bundle配置完成")
        print("=" * 50)
        print(f"✅ 成功: {self.success_count} 个分包")
        print(f"❌ 失败: {self.error_count} 个分包")
        
        if self.errors:
            print("\n❌ 失败详情:")
            for error_info in self.errors:
                print(f"  - {error_info['subpackage']}: {error_info['error']}")
        
        print("\n🎉 批量设置完成！")

if __name__ == "__main__":
    batch_setter = BatchBundleSetter()
    batch_setter.execute()
