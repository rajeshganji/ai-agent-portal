#!/bin/bash

# Quick Restore to Phase 1 Stable
# Run this script to restore your project to Phase 1 stable state

echo "🔄 AI Agent Portal - Phase 1 Restore Script"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "agent-login-app" ]; then
    echo "❌ Error: Run this script from the ai-agent-portal root directory"
    exit 1
fi

echo "📍 Current location: $(pwd)"
echo ""

# Show current state
echo "📊 Current Git State:"
git log --oneline -3
echo ""

# Ask for confirmation
echo "⚠️  This will restore your project to Phase 1 stable state."
echo "   Any uncommitted changes will be lost!"
echo ""
read -p "Continue? (y/N): " -r confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

echo ""
echo "🔄 Restoring to Phase 1 stable..."

# Method 1: Checkout backup branch (preserves history)
echo "📥 Fetching latest from remote..."
git fetch origin

echo "🔄 Switching to Phase 1 backup branch..."
git checkout backup/phase1-stable

if [ $? -eq 0 ]; then
    echo "✅ Successfully restored to Phase 1 stable branch"
    echo ""
    echo "📋 Phase 1 Features Available:"
    echo "   ✅ OpenAI Whisper STT"
    echo "   ✅ ElevenLabs TTS (75ms latency)"
    echo "   ✅ Echo mode testing"
    echo "   ✅ Audio quality fixes"
    echo "   ✅ WebSocket streaming"
    echo "   ✅ XML request/response logging"
    echo "   ✅ Railway deployment ready"
    echo ""
    echo "🚀 To start development from Phase 1:"
    echo "   git checkout -b feature/your-new-feature"
    echo ""
    echo "🔙 To go back to latest main:"
    echo "   git checkout main"
    echo ""
else
    echo "❌ Error switching to backup branch"
    echo "🔄 Trying alternative method..."
    
    # Method 2: Reset to tag
    echo "🏷️  Resetting to Phase 1 tag..."
    git checkout v1.0.0-phase1
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully restored to Phase 1 tag"
        echo "⚠️  You are now in detached HEAD state"
        echo ""
        echo "🔧 To create a working branch:"
        echo "   git checkout -b restore-phase1"
    else
        echo "❌ Error: Could not restore to Phase 1"
        echo "🆘 Manual restore instructions:"
        echo "   1. git checkout backup/phase1-stable"
        echo "   2. Or git checkout v1.0.0-phase1"
        echo "   3. Or git reset --hard e27bc38"
        exit 1
    fi
fi

echo ""
echo "✅ Phase 1 restore complete!"