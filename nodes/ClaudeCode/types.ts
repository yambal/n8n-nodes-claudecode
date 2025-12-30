/**
 * Claude Code Node - Type Definitions
 */

// ============================================================================
// Command Builder Types
// ============================================================================

export type SystemPromptMode = 'none' | 'append' | 'replace';
export type SessionMode = 'new' | 'continue' | 'resume';
export type ToolControl = 'default' | 'preset' | 'custom' | 'allow' | 'deny' | 'none';

export interface AdditionalOptions {
	timeout?: number;
	verbose?: boolean;
	debug?: string;
	fallbackModel?: string;
	jsonSchema?: string;
	betas?: string;
	additionalDirs?: string;
	skipPermissions?: boolean;
	extraFlags?: string;
}

export interface CommandBuilderParams {
	prompt: string;
	model?: string;
	customModel?: string;
	systemPromptMode: SystemPromptMode;
	systemPrompt?: string;
	sessionMode: SessionMode;
	sessionId?: string;
	forkSession?: boolean;
	toolControl: ToolControl;
	toolPreset?: string;
	tools?: string;
	allowedTools?: string;
	disallowedTools?: string;
	maxTurns?: number;
	customAgents?: string;
	mcpConfigPath?: string;
	permissionMode?: string;
	additionalOptions?: AdditionalOptions;
}

export interface CommandBuilderResult {
	args: string[];
	errors: string[];
}

// ============================================================================
// Process Runner Types
// ============================================================================

export interface ProcessOptions {
	cwd?: string;
	timeout?: number; // milliseconds
	env?: Record<string, string>;
}

export interface ProcessResult {
	stdout: string;
	stderr: string;
	exitCode: number;
	timedOut: boolean;
}

// ============================================================================
// Output Parser Types
// ============================================================================

export interface ParsedUsage {
	inputTokens?: number;
	outputTokens?: number;
}

export interface ParsedOutput {
	result: string;
	sessionId?: string;
	messages?: unknown[];
	usage?: ParsedUsage;
	raw: unknown;
	parseError?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export type ClaudeCodeErrorType =
	| 'CLI_NOT_FOUND'
	| 'TIMEOUT'
	| 'EXECUTION_ERROR'
	| 'VALIDATION_ERROR'
	| 'PARSE_ERROR';

export interface ClaudeCodeErrorContext {
	type: ClaudeCodeErrorType;
	partialOutput?: string;
	exitCode?: number;
	stderr?: string;
}
