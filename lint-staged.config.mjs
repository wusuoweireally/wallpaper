import path from 'node:path';

// 仅对暂存文件跑对应子包的 eslint --fix（两套规则不合并，进入子包目录自动读取其 flat config）
// lint-staged 传入的是绝对路径，需转成子包内相对路径
const lint = (pkg) => (files) =>
  files.map((f) => {
    const rel = path.relative(process.cwd(), f).replace(new RegExp(`^${pkg}/`), '');
    return `pnpm -C ${pkg} exec eslint --fix '${rel}'`;
  });

export default {
  'server/**/*.{ts,js,mjs}': lint('server'),
  'web/**/*.{ts,vue,js,mjs}': lint('web'),
};
