#!/usr/bin/env node
// 按需放出 /workbench、/about 的开关。
//
//   npm run gate                  查看当前状态
//   npm run gate about on         打开「关于」
//   npm run gate about off        关闭「关于」
//   npm run gate on               两个都打开
//   npm run gate off              两个都关闭
//   npm run gate about on --deploy   改完直接构建 + 提交 + 推送
//
// 关着的页面只输出「暂无权限」，正文不写进 HTML —— 所以每次开关都必须
// 重新构建并推送才会生效。不加 --deploy 就只改配置，下一步自己执行。

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONSTS = join(ROOT, 'src', 'consts.ts');

const PAGES = ['workbench', 'about'];
const LABELS = { workbench: '工作台', about: '关于' };

const args = process.argv.slice(2);
const deploy = args.includes('--deploy');
const positional = args.filter((arg) => !arg.startsWith('--'));

const source = readFileSync(CONSTS, 'utf8');
const blockStart = source.indexOf('export const PAGE_ACCESS = {');
const blockEnd = source.indexOf('} as const;', blockStart);

if (blockStart === -1 || blockEnd === -1) {
	console.error('在 src/consts.ts 里找不到 PAGE_ACCESS 配置块。');
	process.exit(1);
}

const block = source.slice(blockStart, blockEnd);

function readState(src = block) {
	const state = {};
	for (const page of PAGES) {
		const match = src.match(new RegExp(`${page}:\\s*(true|false)`));
		state[page] = match ? match[1] === 'true' : false;
	}
	return state;
}

function printState(state) {
	console.log('当前状态：');
	for (const page of PAGES) {
		console.log(`  /${page}  ${LABELS[page]}  ${state[page] ? '开放（访客可见）' : '关闭（显示暂无权限）'}`);
	}
}

// 无参数：只看状态
if (positional.length === 0) {
	printState(readState());
	console.log('\n用法：npm run gate <workbench|about|all> <on|off> [--deploy]');
	process.exit(0);
}

let targets = [];
let want = null;

if (positional[0] === 'on' || positional[0] === 'off') {
	targets = PAGES;
	want = positional[0] === 'on';
} else {
	const page = positional[0];
	if (!PAGES.includes(page)) {
		console.error(`不认识的页面：${page}（可选 ${PAGES.join(' / ')}）`);
		process.exit(1);
	}
	targets = [page];
	if (positional[1] !== 'on' && positional[1] !== 'off') {
		console.error('第二个参数必须是 on 或 off。');
		process.exit(1);
	}
	want = positional[1] === 'on';
}

const nextBlock = block.replace(/(workbench|about):\s*(true|false)/g, (full, key, value) =>
	targets.includes(key) ? `${key}: ${want}` : full,
);

if (nextBlock === block) {
	printState(readState());
	console.log('\n状态没有变化，无需改动。');
	process.exit(0);
}

writeFileSync(CONSTS, source.slice(0, blockStart) + nextBlock + source.slice(blockEnd), 'utf8');
printState(readState(nextBlock));

const flag = want ? 'on' : 'off';
const summary = `${targets.join(', ')} → ${flag}`;

if (!deploy) {
	console.log(`
已改好配置。要让它在线上生效，接着执行：
  npm run build
  git add -A && git commit -m "chore(access): ${summary}" && git push
`);
	process.exit(0);
}

console.log('\n开始构建并推送…');
try {
	execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
	execSync('git add -A', { cwd: ROOT, stdio: 'inherit' });

	const dirty = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' }).trim();
	if (dirty) {
		execSync(`git commit -m "chore(access): ${summary}"`, { cwd: ROOT, stdio: 'inherit' });
	} else {
		console.log('没有需要提交的改动。');
	}

	execSync('git push', { cwd: ROOT, stdio: 'inherit' });
	console.log('\n已推送。GitHub Actions 大约一分钟后完成部署。');
} catch (error) {
	console.error(`\n失败了：${error.message}`);
	console.error('配置已经改好，但可能没有全部推送成功，请检查 git status。');
	process.exit(1);
}
