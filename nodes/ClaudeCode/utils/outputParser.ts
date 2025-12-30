/**
 * Claude Code Node - Output Parser
 * Parses JSON output from Claude CLI
 */

import type { ParsedOutput } from '../types';

/**
 * Parse CLI output to structured data
 * Falls back to raw output if JSON parsing fails
 */
export function parseOutput(stdout: string): ParsedOutput {
	const trimmed = stdout.trim();

	if (!trimmed) {
		return {
			result: '',
			raw: null,
			parseError: 'Empty output',
		};
	}

	try {
		const parsed = JSON.parse(trimmed);

		// Extract main result - handle various output formats
		let result = '';
		if (typeof parsed.result === 'string') {
			result = parsed.result;
		} else if (typeof parsed.response === 'string') {
			result = parsed.response;
		} else if (typeof parsed.content === 'string') {
			result = parsed.content;
		} else if (typeof parsed === 'string') {
			result = parsed;
		} else {
			// Try to find result in nested structure
			result = extractResultFromMessages(parsed) || JSON.stringify(parsed);
		}

		return {
			result,
			sessionId: parsed.session_id || parsed.sessionId,
			messages: parsed.messages,
			usage: extractUsage(parsed),
			raw: parsed,
		};
	} catch (error) {
		// Fallback: return raw output
		return {
			result: trimmed,
			raw: trimmed,
			parseError: error instanceof Error ? error.message : 'Unknown parse error',
		};
	}
}

/**
 * Extract result text from messages array
 */
function extractResultFromMessages(parsed: unknown): string | undefined {
	if (!parsed || typeof parsed !== 'object') return undefined;

	const obj = parsed as Record<string, unknown>;

	if (Array.isArray(obj.messages) && obj.messages.length > 0) {
		// Find the last assistant message
		for (let i = obj.messages.length - 1; i >= 0; i--) {
			const msg = obj.messages[i] as Record<string, unknown>;
			if (msg.role === 'assistant') {
				if (typeof msg.content === 'string') {
					return msg.content;
				}
				if (Array.isArray(msg.content)) {
					// Handle content array format
					const textParts = msg.content
						.filter((c): c is Record<string, unknown> =>
							typeof c === 'object' && c !== null && (c as Record<string, unknown>).type === 'text'
						)
						.map((c) => c.text as string);
					if (textParts.length > 0) {
						return textParts.join('\n');
					}
				}
			}
		}
	}

	return undefined;
}

/**
 * Extract usage statistics from parsed output
 */
function extractUsage(
	parsed: Record<string, unknown>,
): { inputTokens?: number; outputTokens?: number } | undefined {
	const usage = parsed.usage as Record<string, unknown> | undefined;

	if (!usage) return undefined;

	return {
		inputTokens:
			typeof usage.input_tokens === 'number'
				? usage.input_tokens
				: typeof usage.inputTokens === 'number'
					? usage.inputTokens
					: undefined,
		outputTokens:
			typeof usage.output_tokens === 'number'
				? usage.output_tokens
				: typeof usage.outputTokens === 'number'
					? usage.outputTokens
					: undefined,
	};
}
