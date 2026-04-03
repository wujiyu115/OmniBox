import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [
    daisyui({
      themes: "all", // 启用全部主题（DaisyUI v5 需要通过函数调用传入 options）
    }),
  ],
}

