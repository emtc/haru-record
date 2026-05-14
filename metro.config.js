const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow .wasm files to be treated as assets (needed for expo-sqlite web)
config.resolver.assetExts.push('wasm');

module.exports = config;
