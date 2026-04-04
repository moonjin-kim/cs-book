#!/usr/bin/env node
/**
 * PreToolUse Hook — deny 가드
 *
 * 단일 책임: 절대 허용하면 안 되는 명령을 deny.
 * settings.allow보다 선행하므로, 어떤 allow 규칙이 있어도 우회 불가.
 *
 * deny 대상:
 * - 보호 브랜치(main/master/develop)에서의 직접 commit/merge
 * - GitHub 수정 작업 (pr merge/close/comment, issue close/comment, api POST)
 * - 서브셸/인터프리터 내부에서의 금지 명령 (DENY_ANYWHERE)
 */

import {
  readStdin, resolveExecDir, gitExec, matchesAny,
  PROTECTED_BRANCHES, DENY_PATTERNS, DENY_ANYWHERE, deny, passThrough,
  stripEnvPrefix,
} from './config.mjs';

async function main() {
  const input = await readStdin();

  let data;
  try { data = JSON.parse(input); } catch { passThrough(); return; }

  const command = data?.tool_input?.command;
  if (typeof command !== 'string' || !command.trim()) { passThrough(); return; }

  const cwd = data.cwd || process.cwd();
  const effective = stripEnvPrefix(command.trim());
  const execDir = resolveExecDir(command.trim(), cwd);

  // 단순 명령: DENY_PATTERNS (^ 앵커)
  if (matchesAny(command.trim(), DENY_PATTERNS)) {
    deny('이 작업은 허용되지 않습니다. PR 머지는 직접 수행하세요.');
  }

  // 전체 문자열 검사: 서브셸, 인터프리터 내부 포함 (앵커 없음)
  if (DENY_ANYWHERE.some(p => p.test(command))) {
    deny('이 작업은 허용되지 않습니다. PR 머지는 직접 수행하세요.');
  }

  // 보호 브랜치 직접 commit
  if (/\bgit\b\s+(-C\s+\S+\s+)?commit\b/.test(effective)) {
    if (gitExec(execDir, 'remote')) {
      const branch = gitExec(execDir, 'symbolic-ref --short HEAD');
      if (PROTECTED_BRANCHES.test(branch)) {
        deny(`${branch} 브랜치에서는 커밋할 수 없습니다. 작업 브랜치를 먼저 생성하세요.`);
      }
    }
  }

  // 보호 브랜치 직접 merge
  if (/\bgit\b\s+(-C\s+\S+\s+)?merge\b/.test(effective)) {
    if (gitExec(execDir, 'remote')) {
      const branch = gitExec(execDir, 'symbolic-ref --short HEAD');
      if (PROTECTED_BRANCHES.test(branch)) {
        deny(`${branch} 브랜치에서 merge할 수 없습니다. PR을 생성하세요.`);
      }
    }
  }

  passThrough();
}

main().catch(() => process.exit(0));
