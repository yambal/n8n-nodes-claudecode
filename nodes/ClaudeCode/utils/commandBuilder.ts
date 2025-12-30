/**
 * Claude Code Node - Command Builder
 * Builds CLI arguments from node parameters
 */

import type { CommandBuilderParams, CommandBuilderResult } from '../types';

/**
 * Build CLI arguments from node parameters
 */
export function buildCommand(params: CommandBuilderParams): CommandBuilderResult {
	const args: string[] = [];
	const errors: string[] = [];

	// Always use print mode and JSON output
	args.push('-p');
	args.push('--output-format', 'json');

	// === Prompt (required) ===
	if (!params.prompt || params.prompt.trim() === '') {
		errors.push('Prompt is required');
	} else {
		args.push(params.prompt);
	}

	// === Model ===
	if (params.model && params.model !== '') {
		if (params.model === 'custom' && params.customModel) {
			args.push('--model', params.customModel);
		} else if (params.model !== 'custom') {
			args.push('--model', params.model);
		}
	}

	// === System Prompt ===
	if (params.systemPromptMode !== 'none' && params.systemPrompt) {
		if (params.systemPromptMode === 'append') {
			args.push('--append-system-prompt', params.systemPrompt);
		} else if (params.systemPromptMode === 'replace') {
			args.push('--system-prompt', params.systemPrompt);
		}
	}

	// === Session Management ===
	if (params.sessionMode === 'continue') {
		args.push('-c');
	} else if (params.sessionMode === 'resume' && params.sessionId) {
		if (params.forkSession) {
			args.push('--fork-session', params.sessionId);
		} else {
			args.push('--resume', params.sessionId);
		}
	}

	// === Tool Control ===
	switch (params.toolControl) {
		case 'preset':
			if (params.toolPreset && params.toolPreset !== 'default') {
				args.push('--tools', params.toolPreset);
			}
			break;
		case 'custom':
			if (params.tools) {
				args.push('--tools', params.tools);
			}
			break;
		case 'allow':
			if (params.allowedTools) {
				const tools = params.allowedTools.split(',').map((t) => t.trim());
				for (const tool of tools) {
					args.push('--allowedTools', tool);
				}
			}
			break;
		case 'deny':
			if (params.disallowedTools) {
				const tools = params.disallowedTools.split(',').map((t) => t.trim());
				for (const tool of tools) {
					args.push('--disallowedTools', tool);
				}
			}
			break;
		case 'none':
			args.push('--tools', 'none');
			break;
		// 'default' - no flags needed
	}

	// === Agent Control ===
	if (params.maxTurns && params.maxTurns > 0) {
		args.push('--max-turns', String(params.maxTurns));
	}

	if (params.customAgents) {
		try {
			// Validate JSON
			JSON.parse(params.customAgents);
			args.push('--agents', params.customAgents);
		} catch {
			errors.push('Custom Agents must be valid JSON');
		}
	}

	// === MCP Settings ===
	if (params.mcpConfigPath) {
		args.push('--mcp-config', params.mcpConfigPath);
	}

	if (params.permissionMode && params.permissionMode !== '') {
		args.push('--permission-mode', params.permissionMode);
	}

	// === Additional Options ===
	const additionalOptions = params.additionalOptions || {};

	if (additionalOptions.verbose) {
		args.push('--verbose');
	}

	if (additionalOptions.debug) {
		args.push('--debug', additionalOptions.debug);
	}

	if (additionalOptions.fallbackModel) {
		args.push('--fallback-model', additionalOptions.fallbackModel);
	}

	if (additionalOptions.jsonSchema) {
		try {
			// Validate JSON
			JSON.parse(additionalOptions.jsonSchema);
			args.push('--json-schema', additionalOptions.jsonSchema);
		} catch {
			errors.push('JSON Schema must be valid JSON');
		}
	}

	if (additionalOptions.betas) {
		const betas = additionalOptions.betas.split(',').map((b) => b.trim());
		for (const beta of betas) {
			args.push('--betas', beta);
		}
	}

	if (additionalOptions.additionalDirs) {
		const dirs = additionalOptions.additionalDirs.split(',').map((d) => d.trim());
		for (const dir of dirs) {
			args.push('--add-dir', dir);
		}
	}

	if (additionalOptions.skipPermissions) {
		args.push('--dangerously-skip-permissions');
	}

	// Extra flags (parse and add)
	if (additionalOptions.extraFlags) {
		const extraArgs = parseExtraFlags(additionalOptions.extraFlags);
		args.push(...extraArgs);
	}

	return { args, errors };
}

/**
 * Parse extra flags string into arguments array
 */
function parseExtraFlags(extraFlags: string): string[] {
	const args: string[] = [];
	const regex = /(?:[^\s"]+|"[^"]*")+/g;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(extraFlags)) !== null) {
		let arg = match[0];
		// Remove surrounding quotes if present
		if (arg.startsWith('"') && arg.endsWith('"')) {
			arg = arg.slice(1, -1);
		}
		args.push(arg);
	}

	return args;
}
