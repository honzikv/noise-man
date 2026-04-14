/**
 * Sandbox Extension
 *
 * Restricts all agents (including subagents) to the project directory.
 * Blocks dangerous bash commands, writes outside project root, and reads of sensitive files.
 *
 * Since pi auto-discovers .pi/extensions/ based on cwd, subagent processes
 * spawned by the subagent extension also load this sandbox.
 */

import * as path from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { isToolCallEventType } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	// ── Configuration ──────────────────────────────────────────────

	// Dangerous bash patterns — blocked unconditionally
	const BLOCKED_BASH_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
		{ pattern: /\brm\s+(-[a-zA-Z]*[rR][a-zA-Z]*\s+|--recursive\s+)[\/~]/, reason: "Recursive delete at root/home" },
		{ pattern: /\brm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+)?\/(?!Users\/\w+\/develop\/noise-man)/, reason: "Delete outside project" },
		{ pattern: /\bsudo\b/, reason: "sudo is not allowed" },
		{ pattern: /\bmkfs\b/, reason: "Filesystem formatting not allowed" },
		{ pattern: /\bdd\s+.*\bof=\/dev\//, reason: "Direct device writes not allowed" },
		{ pattern: /\bchmod\s+777\b/, reason: "World-writable permissions not allowed" },
		{ pattern: /\bchown\b/, reason: "Ownership changes not allowed" },
		{ pattern: />\s*\/etc\//, reason: "Writing to /etc not allowed" },
		{ pattern: />\s*\/usr\//, reason: "Writing to /usr not allowed" },
		{ pattern: />\s*\/System\//, reason: "Writing to /System not allowed" },
		{ pattern: />\s*\/Library\//, reason: "Writing to /Library not allowed" },
		{ pattern: /\bcurl\b.*\|\s*(ba)?sh/, reason: "Pipe-to-shell not allowed" },
		{ pattern: /\bwget\b.*\|\s*(ba)?sh/, reason: "Pipe-to-shell not allowed" },
		{ pattern: /\beval\b.*\$\(curl/, reason: "Remote code execution not allowed" },
		{ pattern: /\bnc\s+-[a-zA-Z]*l/, reason: "Listening sockets not allowed" },
		{ pattern: /\bshutdown\b/, reason: "System shutdown not allowed" },
		{ pattern: /\breboot\b/, reason: "System reboot not allowed" },
		{ pattern: /\blaunchctl\b/, reason: "Service management not allowed" },
		{ pattern: /\bsystemctl\b/, reason: "Service management not allowed" },
		{ pattern: /\/etc\/passwd/, reason: "Access to /etc/passwd not allowed" },
		{ pattern: /\/etc\/shadow/, reason: "Access to /etc/shadow not allowed" },
		{ pattern: /~\/\.ssh\//, reason: "SSH key access not allowed" },
		{ pattern: /~\/\.gnupg\//, reason: "GPG key access not allowed" },
		{ pattern: /~\/\.aws\//, reason: "AWS credentials access not allowed" },
		{ pattern: /~\/\.kube\//, reason: "Kubernetes config access not allowed" },
		{ pattern: /\bkill\s+-9\s+[01]\b/, reason: "Killing init process not allowed" },
		{ pattern: /\bkillall\b/, reason: "killall not allowed" },
		{ pattern: /\bpkill\b/, reason: "pkill not allowed" },
	];

	// Paths that are never writable (write/edit/bash redirect)
	const PROTECTED_WRITE_PATHS = [
		".env",
		".git/",
		"node_modules/",
		".pi/extensions/",
		".pi/agents/",
		".pi/prompts/",
		".pi/settings.json",
	];

	// Sensitive files that cannot be read
	const BLOCKED_READ_PATHS = [
		"/etc/passwd",
		"/etc/shadow",
		"/etc/master.passwd",
	];

	const BLOCKED_READ_PREFIXES = [
		"/etc/",
		"/System/",
		"/Library/",
		"/usr/",
		"/private/",
		"/var/",
	];

	const HOME_SENSITIVE_DIRS = [
		".ssh",
		".gnupg",
		".aws",
		".kube",
		".docker",
		".config/gcloud",
		".azure",
	];

	// ── Helpers ─────────────────────────────────────────────────────

	function getProjectRoot(cwd: string): string {
		return cwd;
	}

	function isInsideProject(filePath: string, cwd: string): boolean {
		const projectRoot = getProjectRoot(cwd);
		const resolved = path.resolve(cwd, filePath.replace(/^@/, ""));
		return resolved.startsWith(projectRoot);
	}

	function isSensitiveReadPath(filePath: string): boolean {
		const normalized = filePath.replace(/^@/, "");
		const resolved = path.resolve(normalized);
		const home = process.env.HOME || process.env.USERPROFILE || "";

		if (BLOCKED_READ_PATHS.some((p) => resolved === p)) return true;
		if (BLOCKED_READ_PREFIXES.some((p) => resolved.startsWith(p))) return true;
		if (home && HOME_SENSITIVE_DIRS.some((d) => resolved.startsWith(path.join(home, d)))) return true;

		return false;
	}

	// ── Bash command gating ──────────────────────────────────────────

	pi.on("tool_call", async (event, ctx) => {
		if (isToolCallEventType("bash", event)) {
			const command = event.input.command || "";

			for (const { pattern, reason } of BLOCKED_BASH_PATTERNS) {
				if (pattern.test(command)) {
					if (ctx.hasUI) {
						ctx.ui.notify(`🛡️ Sandbox blocked: ${reason}`, "warning");
					}
					return { block: true, reason: `Sandbox: ${reason}` };
				}
			}
		}

		return undefined;
	});

	// ── Write/Edit path gating ───────────────────────────────────────

	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "write" && event.toolName !== "edit") {
			return undefined;
		}

		const filePath = (event.input.path as string) || "";

		// Block writes to protected project paths
		if (PROTECTED_WRITE_PATHS.some((p) => filePath.includes(p))) {
			if (ctx.hasUI) {
				ctx.ui.notify(`🛡️ Sandbox blocked write to protected path: ${filePath}`, "warning");
			}
			return { block: true, reason: `Sandbox: "${filePath}" is a protected path` };
		}

		// Block writes outside project directory
		if (!isInsideProject(filePath, ctx.cwd)) {
			if (ctx.hasUI) {
				ctx.ui.notify(`🛡️ Sandbox blocked write outside project: ${filePath}`, "warning");
			}
			return { block: true, reason: `Sandbox: writes must be within the project directory (${ctx.cwd})` };
		}

		return undefined;
	});

	// ── Read path gating ─────────────────────────────────────────────

	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "read") {
			return undefined;
		}

		const filePath = (event.input.path as string) || "";

		if (isSensitiveReadPath(filePath)) {
			if (ctx.hasUI) {
				ctx.ui.notify(`🛡️ Sandbox blocked read of sensitive path: ${filePath}`, "warning");
			}
			return { block: true, reason: `Sandbox: "${filePath}" is a sensitive system path` };
		}

		return undefined;
	});
}
