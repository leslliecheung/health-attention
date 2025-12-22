# Tauri Windows 构建环境配置指南

## 问题描述

在 Windows 上执行 `pnpm tauri:build` 时遇到以下错误：

```
error: linker `link.exe` not found
note: the msvc targets depend on the msvc linker but `link.exe` was not found
note: please ensure that Visual Studio 2017 or later, or Build Tools for Visual Studio were installed with the Visual C++ option.
```

## 原因分析

Rust 在 Windows 上默认使用 MSVC（Microsoft Visual C++）工具链进行编译。该工具链依赖 Visual Studio 提供的 `link.exe` 链接器。如果系统未安装 Visual Studio Build Tools 或未正确配置 C++ 构建工具，就会出现此错误。

**注意**：VS Code 是代码编辑器，不包含编译工具，无法满足此需求。

## 解决方案

### 方案一：安装 Visual Studio Build Tools（推荐）

这是 Tauri 官方推荐的 Windows 开发环境配置方式。

#### 步骤 1：下载安装程序

访问 Visual Studio 官方下载页面：
- https://visualstudio.microsoft.com/zh-hans/visual-cpp-build-tools/

点击下载 "Build Tools for Visual Studio 2022"。

#### 步骤 2：运行安装程序

1. 运行下载的 `vs_BuildTools.exe`
2. 等待 Visual Studio Installer 初始化完成

#### 步骤 3：选择工作负载

在安装界面中，勾选以下工作负载：

- ✅ **使用 C++ 的桌面开发**（Desktop development with C++）

#### 步骤 4：确认单个组件

在右侧的"安装详细信息"中，确保以下组件被选中：

- ✅ MSVC v143 - VS 2022 C++ x64/x86 生成工具（最新版本）
- ✅ Windows 11 SDK（或 Windows 10 SDK）
- ✅ C++ CMake 工具（可选，但建议安装）

#### 步骤 5：开始安装

- 点击右下角的"安装"按钮
- 安装大小约 5-8 GB，请确保磁盘空间充足
- 等待安装完成（耗时取决于网络速度）

#### 步骤 6：重启系统

**安装完成后必须重启电脑**，以确保环境变量正确加载。

#### 步骤 7：验证安装

重启后，打开新的终端窗口，执行以下命令验证：

```bash
# 检查 link.exe 是否可用
where link.exe

# 检查 Rust 工具链状态
rustup show
```

如果 `where link.exe` 能够输出路径（类似以下格式），说明安装成功：

```
C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.xx.xxxxx\bin\Hostx64\x64\link.exe
```

### 方案二：使用 GNU 工具链（备选）

如果不想安装 Visual Studio Build Tools，可以切换到 GNU 工具链。

```bash
# 安装 GNU 目标
rustup target add x86_64-pc-windows-gnu

# 安装 GNU 工具链
rustup toolchain install stable-x86_64-pc-windows-gnu

# 设置为默认工具链
rustup default stable-x86_64-pc-windows-gnu
```

**⚠️ 注意**：
- Tauri 官方推荐使用 MSVC 工具链
- GNU 工具链可能存在兼容性问题
- 某些依赖库可能无法在 GNU 工具链下正确编译

## 重新构建

环境配置完成后，重新执行构建命令：

```bash
pnpm tauri:build
```

## 常见问题排查

### 问题 1：安装后仍然找不到 link.exe

**原因**：环境变量未正确加载

**解决**：
1. 确保已重启电脑
2. 使用"Developer Command Prompt for VS 2022"或"x64 Native Tools Command Prompt"
3. 或手动将 MSVC 路径添加到系统 PATH 环境变量

### 问题 2：安装程序无法下载组件

**原因**：网络问题

**解决**：
1. 检查网络连接
2. 尝试使用 VPN
3. 下载离线安装包

### 问题 3：磁盘空间不足

**解决**：
1. 清理磁盘空间
2. 更改 Visual Studio 安装位置到其他分区

### 问题 4：Rust 工具链版本问题

**解决**：

```bash
# 更新 Rust
rustup update

# 确保使用 stable 版本
rustup default stable
```

## 相关资源

- [Tauri 官方文档 - Windows 环境配置](https://tauri.app/v1/guides/getting-started/prerequisites/#windows)
- [Visual Studio Build Tools 下载](https://visualstudio.microsoft.com/zh-hans/visual-cpp-build-tools/)
- [Rust 官方安装指南](https://www.rust-lang.org/tools/install)

## 环境要求总结

| 组件 | 最低版本 | 推荐版本 |
|------|---------|---------|
| Visual Studio Build Tools | 2017 | 2022 |
| Windows SDK | 10.0.17763.0 | 最新版本 |
| Rust | 1.70 | 最新 stable |
| Node.js | 16.x | 20.x LTS |

---

*文档更新日期：2025-12-22*
