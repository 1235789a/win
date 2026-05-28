#!/bin/bash

# ResumePro 一键启动脚本

echo "🚀 ResumePro 简历优化服务 - 一键启动"
echo "======================================"
echo ""

# 检查Node.js版本
echo "📦 检查Node.js版本..."
node_version=$(node -v 2>/dev/null | sed 's/v//')
if [ -z "$node_version" ]; then
  echo "❌ Node.js未安装，请先安装Node.js 18+"
  exit 1
fi

echo "✅ Node.js v$node_version 已安装"

# 检查pnpm
if ! command -v pnpm &> /dev/null; then
  echo "📦 安装pnpm..."
  npm install -g pnpm
fi
echo "✅ pnpm 已安装"

# 创建项目目录
PROJECT_DIR="resume-pro"
if [ -d "$PROJECT_DIR" ]; then
  echo "⚠️ 项目目录已存在，跳过克隆"
else
  echo "📥 克隆核心开源模块..."
  mkdir -p "$PROJECT_DIR"
  cd "$PROJECT_DIR"
  
  git clone https://github.com/amruthpillai/reactive-resume.git ./frontend
  git clone https://github.com/srbhr/Resume-Matcher.git ./ats-analyzer
  
  echo "✅ 开源模块克隆完成"
fi

cd "$PROJECT_DIR/frontend"

# 安装依赖
echo "📦 安装前端依赖..."
pnpm install

# 复制环境变量模板
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo "⚠️ 请编辑 .env.local 文件，填入API密钥"
  echo ""
  echo "需要配置的关键变量："
  echo "  - OPENAI_API_KEY"
  echo "  - ANTHROPIC_API_KEY"
  echo "  - STRIPE_SECRET_KEY"
  echo ""
  read -p "按Enter键继续..."
fi

# 设置Python虚拟环境（ATS分析用）
cd "../ats-analyzer"
echo "🐍 设置Python虚拟环境..."

if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

source venv/bin/activate
pip install -q sentence-transformers scikit-learn numpy pandas
echo "✅ Python依赖安装完成"

# 返回前端目录
cd "../frontend"

# 启动开发服务器
echo ""
echo "======================================"
echo "🎉 启动开发服务器..."
echo "======================================"
echo ""
echo "📍 访问地址: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

pnpm dev
