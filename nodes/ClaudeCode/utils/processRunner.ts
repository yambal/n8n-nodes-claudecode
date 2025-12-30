/**
 * Claude Code Node - Process Runner
 * Executes Claude CLI as a child process
 *
 * NOTE: This node is designed for local/self-hosted n8n only.
 * It uses child_process to execute the Claude CLI, which is not
 * available in n8n Cloud environments.
 */

/* eslint-disable @n8n/community-nodes/no-restricted-imports */
/* eslint-disable @n8n/community-nodes/no-restricted-globals */

import { spawn } from 'child_process';
import type { INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { ProcessOptions, ProcessResult, ClaudeCodeErrorContext } from '../types';

const CLAUDE_COMMAND = 'claude';

/**
 * Run the Claude CLI process with given arguments
 * @throws NodeOperationError on CLI not found, timeout, or execution error
 */
export async function runProcess(
	node: INode,
	args: string[],
	options: ProcessOptions = {},
): Promise<ProcessResult> {
	const { cwd, timeout = 300000, env } = options;

	return new Promise((resolve, reject) => {
		let stdout = '';
		let stderr = '';
		let timedOut = false;
		let timeoutId: ReturnType<typeof setTimeout> | undefined;

		const processEnv = {
			...process.env,
			...env,
		};

		const childProcess = spawn(CLAUDE_COMMAND, args, {
			cwd: cwd || process.cwd(),
			env: processEnv,
			shell: true,
		});

		// Handle stdout
		childProcess.stdout?.on('data', (data: Buffer) => {
			stdout += data.toString();
		});

		// Handle stderr
		childProcess.stderr?.on('data', (data: Buffer) => {
			stderr += data.toString();
		});

		// Handle spawn error (e.g., command not found)
		childProcess.on('error', (error: NodeJS.ErrnoException) => {
			if (timeoutId) clearTimeout(timeoutId);

			if (error.code === 'ENOENT') {
				const context: ClaudeCodeErrorContext = {
					type: 'CLI_NOT_FOUND',
				};
				reject(
					new NodeOperationError(
						node,
						'Claude Code CLI not found. Please ensure Claude Code is installed and available in PATH.',
						{ description: JSON.stringify(context) },
					),
				);
			} else {
				const context: ClaudeCodeErrorContext = {
					type: 'EXECUTION_ERROR',
					stderr: error.message,
				};
				reject(
					new NodeOperationError(node, `Failed to start Claude CLI: ${error.message}`, {
						description: JSON.stringify(context),
					}),
				);
			}
		});

		// Handle process exit
		childProcess.on('close', (code: number | null) => {
			if (timeoutId) clearTimeout(timeoutId);

			const exitCode = code ?? 1;

			if (timedOut) {
				const context: ClaudeCodeErrorContext = {
					type: 'TIMEOUT',
					partialOutput: stdout,
					exitCode,
				};
				reject(
					new NodeOperationError(
						node,
						`Execution timed out after ${timeout / 1000} seconds`,
						{ description: JSON.stringify(context) },
					),
				);
				return;
			}

			if (exitCode !== 0) {
				const context: ClaudeCodeErrorContext = {
					type: 'EXECUTION_ERROR',
					exitCode,
					stderr,
					partialOutput: stdout,
				};
				reject(
					new NodeOperationError(node, `Claude CLI exited with code ${exitCode}: ${stderr}`, {
						description: JSON.stringify(context),
					}),
				);
				return;
			}

			resolve({
				stdout,
				stderr,
				exitCode,
				timedOut: false,
			});
		});

		// Set timeout
		if (timeout > 0) {
			timeoutId = setTimeout(() => {
				timedOut = true;
				childProcess.kill('SIGTERM');
				// Force kill after 5 seconds if SIGTERM doesn't work
				setTimeout(() => {
					if (!childProcess.killed) {
						childProcess.kill('SIGKILL');
					}
				}, 5000);
			}, timeout);
		}
	});
}
