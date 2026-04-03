/**
 * 构建脚本：生成包含 DaisyUI 全部主题的独立 CSS 文件，用于注入到插件 iframe 中。
 *
 * 使用方式：node scripts/build-plugin-css.js
 *
 * 原理：创建一个临时的 Tailwind 输入文件和配置，通过 Tailwind CLI 编译出包含
 * DaisyUI 所有主题和常用工具类的 CSS 文件，输出到 src/assets/plugin-daisy.css。
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, unlinkSync, existsSync, readFileSync, appendFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// 临时文件路径
const tmpInputCss = resolve(rootDir, 'scripts/.tmp-plugin-input.css');
const tmpConfig = resolve(rootDir, 'scripts/.tmp-plugin-tailwind.config.js');
const outputCss = resolve(rootDir, 'src/assets/plugin-daisy.css');

// 1. 创建临时 Tailwind 输入 CSS
const inputCss = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

// 2. 创建临时 Tailwind 配置（仅包含 DaisyUI，扫描内置插件 HTML）
const tailwindConfig = `
import daisyui from 'daisyui';

export default {
  content: [
    "./src-tauri/builtin-plugins/**/*.html",
  ],
  plugins: [
    daisyui({
      themes: "all",
    }),
  ],
};
`;

try {
  // 确保输出目录存在
  const outputDir = dirname(outputCss);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // 写入临时文件
  writeFileSync(tmpInputCss, inputCss);
  writeFileSync(tmpConfig, tailwindConfig);

  console.log('Building plugin DaisyUI CSS...');

  // 运行 Tailwind CLI
  execSync(
    `npx tailwindcss -c "${tmpConfig}" -i "${tmpInputCss}" -o "${outputCss}" --minify`,
    { cwd: rootDir, stdio: 'inherit' }
  );

  // 追加 DaisyUI themes.css（包含所有主题的 CSS 变量定义）到输出文件
  const themesPath = resolve(rootDir, 'node_modules/daisyui/themes.css');
  if (existsSync(themesPath)) {
    const themesCss = readFileSync(themesPath, 'utf-8');
    appendFileSync(outputCss, '\n/* DaisyUI All Themes */\n' + themesCss);
    console.log('Appended DaisyUI themes.css to output.');
  } else {
    console.warn('Warning: daisyui/themes.css not found, themes may not work correctly.');
  }

  console.log(`Plugin CSS generated: ${outputCss}`);
} catch (error) {
  console.error('Failed to build plugin CSS:', error);
  process.exit(1);
} finally {
  // 清理临时文件
  try { unlinkSync(tmpInputCss); } catch {}
  try { unlinkSync(tmpConfig); } catch {}
}
