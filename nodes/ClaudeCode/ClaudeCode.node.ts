import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { buildCommand } from './utils/commandBuilder';
import { runProcess } from './utils/processRunner';
import { parseOutput } from './utils/outputParser';
import type { CommandBuilderParams, AdditionalOptions } from './types';

export class ClaudeCode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Claude Code',
		name: 'claudeCode',
		icon: 'file:claude.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["model"] || "default"}}',
		description: 'Execute Claude Code CLI for AI-powered coding tasks',
		defaults: {
			name: 'Claude Code',
		},
		inputs: ['main'],
		outputs: ['main'],
		usableAsTool: true,
		properties: [
			// === Basic Settings ===
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				description: 'The prompt to send to Claude Code',
				placeholder: 'e.g., Analyze this code and suggest improvements',
			},
			{
				displayName: 'Working Directory',
				name: 'workingDirectory',
				type: 'string',
				default: '',
				description: 'Working directory for Claude Code (leave empty to use n8n working directory)',
				placeholder: '/path/to/project',
			},

			// === Model Settings ===
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: [
					{ name: 'Custom', value: 'custom' },
					{ name: 'Default', value: '' },
					{ name: 'Haiku', value: 'haiku' },
					{ name: 'Opus', value: 'opus' },
					{ name: 'Sonnet', value: 'sonnet' },
				],
				default: '',
				description: 'Claude model to use',
			},
			{
				displayName: 'Custom Model',
				name: 'customModel',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						model: ['custom'],
					},
				},
				description: 'Custom model name (e.g., claude-sonnet-4-20250514)',
				placeholder: 'claude-sonnet-4-20250514',
			},

			// === System Prompt ===
			{
				displayName: 'System Prompt Mode',
				name: 'systemPromptMode',
				type: 'options',
				options: [
					{ name: 'None', value: 'none' },
					{ name: 'Append', value: 'append' },
					{ name: 'Replace', value: 'replace' },
				],
				default: 'none',
				description: 'How to handle system prompt',
			},
			{
				displayName: 'System Prompt',
				name: 'systemPrompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				displayOptions: {
					show: {
						systemPromptMode: ['append', 'replace'],
					},
				},
				description: 'System prompt content',
			},

			// === Session Settings ===
			{
				displayName: 'Session Mode',
				name: 'sessionMode',
				type: 'options',
				options: [
					{ name: 'New Session', value: 'new' },
					{ name: 'Continue Last', value: 'continue' },
					{ name: 'Resume Specific', value: 'resume' },
				],
				default: 'new',
				description: 'Session management mode',
			},
			{
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						sessionMode: ['resume'],
					},
				},
				description: 'Session ID to resume',
			},
			{
				displayName: 'Fork Session',
				name: 'forkSession',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						sessionMode: ['resume'],
					},
				},
				description: 'Whether to fork the session instead of resuming it',
			},

			// === Tool Settings ===
			{
				displayName: 'Tool Control',
				name: 'toolControl',
				type: 'options',
				options: [
					{ name: 'Allow List', value: 'allow' },
					{ name: 'Custom', value: 'custom' },
					{ name: 'Default', value: 'default' },
					{ name: 'Deny List', value: 'deny' },
					{ name: 'None', value: 'none' },
					{ name: 'Preset', value: 'preset' },
				],
				default: 'default',
				description: 'How to control tool usage',
			},
			{
				displayName: 'Tool Preset',
				name: 'toolPreset',
				type: 'options',
				options: [
					{ name: 'All Tools', value: 'default' },
					{ name: 'Code Edit', value: 'Read,Edit,Write,Glob,Grep' },
					{ name: 'Code Review', value: 'Read,Glob,Grep,WebSearch,WebFetch' },
					{ name: 'Full Development', value: 'Read,Edit,Write,Bash,Glob,Grep' },
					{ name: 'Read Only', value: 'Read,Glob,Grep' },
				],
				default: 'Read,Glob,Grep',
				displayOptions: {
					show: {
						toolControl: ['preset'],
					},
				},
				description: 'Predefined tool combinations',
			},
			{
				displayName: 'Tools',
				name: 'tools',
				type: 'string',
				default: 'Read,Edit,Bash',
				displayOptions: {
					show: {
						toolControl: ['custom'],
					},
				},
				description: 'Comma-separated list of tools to enable',
			},
			{
				displayName: 'Allowed Tools',
				name: 'allowedTools',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						toolControl: ['allow'],
					},
				},
				description: 'Comma-separated patterns for allowed tools',
			},
			{
				displayName: 'Disallowed Tools',
				name: 'disallowedTools',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						toolControl: ['deny'],
					},
				},
				description: 'Comma-separated patterns for disallowed tools',
			},

			// === Agent Control ===
			{
				displayName: 'Max Turns',
				name: 'maxTurns',
				type: 'number',
				default: 0,
				description: 'Maximum agent turns (0 = unlimited)',
			},
			{
				displayName: 'Custom Agents',
				name: 'customAgents',
				type: 'json',
				default: '',
				description: 'Custom sub-agent definitions (JSON)',
			},

			// === MCP Settings ===
			{
				displayName: 'MCP Config Path',
				name: 'mcpConfigPath',
				type: 'string',
				default: '',
				description: 'Path to MCP configuration file',
			},
			{
				displayName: 'Permission Mode',
				name: 'permissionMode',
				type: 'options',
				options: [
					{ name: 'Default', value: '' },
					{ name: 'Plan', value: 'plan' },
				],
				default: '',
				description: 'Permission mode for Claude Code',
			},

			// === Additional Options ===
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Additional Directories',
						name: 'additionalDirs',
						type: 'string',
						default: '',
						description: 'Comma-separated additional working directories',
					},
					{
						displayName: 'Betas',
						name: 'betas',
						type: 'string',
						default: '',
						description: 'Comma-separated beta features to enable',
					},
					{
						displayName: 'Debug',
						name: 'debug',
						type: 'string',
						default: '',
						description: 'Debug filter (e.g., api,mcp)',
					},
					{
						displayName: 'Extra CLI Flags',
						name: 'extraFlags',
						type: 'string',
						default: '',
						description: 'Additional CLI flags (advanced)',
					},
					{
						displayName: 'Fallback Model',
						name: 'fallbackModel',
						type: 'string',
						default: '',
						description: 'Fallback model to use if primary fails',
					},
					{
						displayName: 'JSON Schema',
						name: 'jsonSchema',
						type: 'json',
						default: '',
						description: 'Output JSON schema for structured responses',
					},
					{
						displayName: 'Skip Permissions',
						name: 'skipPermissions',
						type: 'boolean',
						default: false,
						description: 'Whether to skip permission checks (DANGEROUS)',
					},
					{
						displayName: 'Timeout (Seconds)',
						name: 'timeout',
						type: 'number',
						default: 300,
						description: 'Execution timeout in seconds',
					},
					{
						displayName: 'Verbose',
						name: 'verbose',
						type: 'boolean',
						default: false,
						description: 'Whether to enable verbose logging',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// Get parameters
				const prompt = this.getNodeParameter('prompt', itemIndex, '') as string;
				const workingDirectory = this.getNodeParameter('workingDirectory', itemIndex, '') as string;
				const model = this.getNodeParameter('model', itemIndex, '') as string;
				const customModel = this.getNodeParameter('customModel', itemIndex, '') as string;
				const systemPromptMode = this.getNodeParameter('systemPromptMode', itemIndex, 'none') as 'none' | 'append' | 'replace';
				const systemPrompt = this.getNodeParameter('systemPrompt', itemIndex, '') as string;
				const sessionMode = this.getNodeParameter('sessionMode', itemIndex, 'new') as 'new' | 'continue' | 'resume';
				const sessionId = this.getNodeParameter('sessionId', itemIndex, '') as string;
				const forkSession = this.getNodeParameter('forkSession', itemIndex, false) as boolean;
				const toolControl = this.getNodeParameter('toolControl', itemIndex, 'default') as 'default' | 'preset' | 'custom' | 'allow' | 'deny' | 'none';
				const toolPreset = this.getNodeParameter('toolPreset', itemIndex, '') as string;
				const tools = this.getNodeParameter('tools', itemIndex, '') as string;
				const allowedTools = this.getNodeParameter('allowedTools', itemIndex, '') as string;
				const disallowedTools = this.getNodeParameter('disallowedTools', itemIndex, '') as string;
				const maxTurns = this.getNodeParameter('maxTurns', itemIndex, 0) as number;
				const customAgents = this.getNodeParameter('customAgents', itemIndex, '') as string;
				const mcpConfigPath = this.getNodeParameter('mcpConfigPath', itemIndex, '') as string;
				const permissionMode = this.getNodeParameter('permissionMode', itemIndex, '') as string;
				const additionalOptions = this.getNodeParameter('additionalOptions', itemIndex, {}) as AdditionalOptions;

				// Build command parameters
				const commandParams: CommandBuilderParams = {
					prompt,
					model,
					customModel,
					systemPromptMode,
					systemPrompt,
					sessionMode,
					sessionId,
					forkSession,
					toolControl,
					toolPreset,
					tools,
					allowedTools,
					disallowedTools,
					maxTurns,
					customAgents,
					mcpConfigPath,
					permissionMode,
					additionalOptions,
				};

				// Build command
				const { args, errors } = buildCommand(commandParams);

				if (errors.length > 0) {
					throw new NodeOperationError(this.getNode(), `Parameter validation failed: ${errors.join(', ')}`);
				}

				// Calculate timeout in milliseconds
				const timeoutMs = (additionalOptions.timeout || 300) * 1000;

				// Run process
				const processResult = await runProcess(
					this.getNode(),
					args,
					{
						cwd: workingDirectory || undefined,
						timeout: timeoutMs,
					},
				);

				// Parse output
				const parsedOutput = parseOutput(processResult.stdout);

				// Build result
				returnData.push({
					json: {
						result: parsedOutput.result,
						sessionId: parsedOutput.sessionId,
						usage: parsedOutput.usage,
						exitCode: processResult.exitCode,
						raw: parsedOutput.raw as object,
						...(parsedOutput.parseError && { parseError: parsedOutput.parseError }),
					},
					pairedItem: itemIndex,
				});

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : 'Unknown error',
						},
						pairedItem: itemIndex,
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
