/**
 * MCP Connection Manager
 * Manages connection to chrome-devtools MCP server with error handling and retry logic
 */

export interface MCPConfiguration {
  serverName: string;
  command: string;
  args: string[];
  connectionTimeout: number;
  retryAttempts: number;
  requiredFunctions: string[];
}

export interface MCPConnectionStatus {
  isConnected: boolean;
  serverVersion?: string;
  availableFunctions: string[];
  lastConnectionTime: Date;
  connectionErrors: string[];
  connectionLatency: number;
  retryCount: number;
}

export interface MCPFunctionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

export class MCPConnectionManager {
  private connectionStatus: MCPConnectionStatus;
  private config: MCPConfiguration;
  private retryTimeouts: number[] = [1000, 2000, 5000, 10000]; // Exponential backoff
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config?: Partial<MCPConfiguration>) {
    this.config = {
      serverName: 'chrome-devtools',
      command: 'uvx',
      args: ['mcp-chrome-devtools@latest'],
      connectionTimeout: 10000,
      retryAttempts: 3,
      requiredFunctions: [
        'mcp_chrome_devtools_list_pages',
        'mcp_chrome_devtools_select_page',
        'mcp_chrome_devtools_navigate_page',
        'mcp_chrome_devtools_evaluate_script',
        'mcp_chrome_devtools_list_console_messages',
        'mcp_chrome_devtools_list_network_requests',
        'mcp_chrome_devtools_take_snapshot',
        'mcp_chrome_devtools_click',
      ],
      ...config,
    };

    this.connectionStatus = {
      isConnected: false,
      availableFunctions: [],
      lastConnectionTime: new Date(),
      connectionErrors: [],
      connectionLatency: 0,
      retryCount: 0,
    };
  }

  /**
   * Initialize MCP connection with retry logic
   */
  async initializeMCPConnection(): Promise<boolean> {
    console.log('Initializing chrome-devtools MCP connection...');

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const startTime = Date.now();

        // Test basic connection
        const connectionResult = await this.testMCPConnection();
        if (!connectionResult) {
          throw new Error('Basic connection test failed');
        }

        // Verify required functions
        const functionsVerified = await this.verifyMCPFunctions();
        if (!functionsVerified) {
          throw new Error('Required MCP functions not available');
        }

        // Update connection status
        this.connectionStatus = {
          isConnected: true,
          availableFunctions: [...this.config.requiredFunctions],
          lastConnectionTime: new Date(),
          connectionErrors: [],
          connectionLatency: Date.now() - startTime,
          retryCount: attempt,
        };

        console.log(
          `MCP connection established successfully (attempt ${attempt + 1}/${
            this.config.retryAttempts
          })`
        );

        // Start health check monitoring
        this.startHealthCheckMonitoring();

        return true;
      } catch (error) {
        const errorMessage = `Connection attempt ${attempt + 1} failed: ${error}`;
        console.error(errorMessage);

        this.connectionStatus.connectionErrors.push(errorMessage);
        this.connectionStatus.retryCount = attempt + 1;

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retryAttempts - 1) {
          const delay = this.retryTimeouts[attempt] || 10000;
          console.log(`Retrying in ${delay}ms...`);
          await this.delay(delay);
        }
      }
    }

    // All attempts failed
    this.connectionStatus.isConnected = false;
    console.error(
      `Failed to establish MCP connection after ${this.config.retryAttempts} attempts`
    );

    return false;
  }

  /**
   * Test basic MCP connection
   */
  private async testMCPConnection(): Promise<boolean> {
    try {
      console.log('Testing basic MCP connection...');

      // In a real implementation, this would test the actual MCP server
      // For now, we'll simulate the connection test
      const testResult = await this.simulateMCPCall('list_pages', {});

      if (!testResult.success) {
        throw new Error(testResult.error || 'Connection test failed');
      }

      console.log('Basic MCP connection test passed');
      return true;
    } catch (error) {
      console.error('Basic MCP connection test failed:', error);
      return false;
    }
  }

  /**
   * Verify all required MCP functions are available
   */
  async verifyMCPFunctions(): Promise<boolean> {
    console.log('Verifying required MCP functions...');

    const availableFunctions: string[] = [];
    const failedFunctions: string[] = [];

    for (const functionName of this.config.requiredFunctions) {
      try {
        const isAvailable = await this.testMCPFunction(functionName);
        if (isAvailable) {
          availableFunctions.push(functionName);
          console.log(`✓ ${functionName} is available`);
        } else {
          failedFunctions.push(functionName);
          console.warn(`✗ ${functionName} is not available`);
        }
      } catch (error) {
        failedFunctions.push(functionName);
        console.error(`✗ ${functionName} test failed:`, error);
      }
    }

    this.connectionStatus.availableFunctions = availableFunctions;

    if (failedFunctions.length > 0) {
      const errorMessage = `Required functions not available: ${failedFunctions.join(
        ', '
      )}`;
      this.connectionStatus.connectionErrors.push(errorMessage);
      return false;
    }

    console.log(
      `All ${availableFunctions.length} required MCP functions verified`
    );
    return true;
  }

  /**
   * Test individual MCP function availability
   */
  private async testMCPFunction(functionName: string): Promise<boolean> {
    try {
      // In a real implementation, this would test the actual MCP function
      // For now, we'll simulate function availability testing
      const testResult = await this.simulateMCPCall(functionName, {});
      return testResult.success;
    } catch (error) {
      console.error(`Function ${functionName} test failed:`, error);
      return false;
    }
  }

  /**
   * Simulate MCP function call (placeholder for real implementation)
   */
  private async simulateMCPCall(
    functionName: string,
    params: any
  ): Promise<MCPFunctionResult> {
    const startTime = Date.now();

    try {
      // Simulate network delay
      await this.delay(Math.random() * 100 + 50);

      // Simulate function-specific behavior
      switch (functionName) {
        case 'mcp_chrome_devtools_list_pages':
          return {
            success: true,
            data: [
              {
                pageIdx: 0,
                title: 'Service Worker',
                url: 'chrome-extension://test/background.js',
                type: 'service_worker',
              },
              {
                pageIdx: 1,
                title: 'Content Script',
                url: 'https://example.com',
                type: 'page',
              },
            ],
            executionTime: Date.now() - startTime,
          };

        case 'mcp_chrome_devtools_select_page':
          return {
            success: true,
            data: { selected: true },
            executionTime: Date.now() - startTime,
          };

        case 'mcp_chrome_devtools_evaluate_script':
          return {
            success: true,
            data: { result: 'Script executed successfully' },
            executionTime: Date.now() - startTime,
          };

        default:
          return {
            success: true,
            data: { message: `Function ${functionName} executed` },
            executionTime: Date.now() - startTime,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Function ${functionName} failed: ${error}`,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute MCP function with error handling
   */
  async executeMCPFunction(
    functionName: string,
    params: any = {}
  ): Promise<MCPFunctionResult> {
    if (!this.connectionStatus.isConnected) {
      return {
        success: false,
        error: 'MCP connection not established',
        executionTime: 0,
      };
    }

    if (!this.connectionStatus.availableFunctions.includes(functionName)) {
      return {
        success: false,
        error: `Function ${functionName} is not available`,
        executionTime: 0,
      };
    }

    try {
      console.log(`Executing MCP function: ${functionName}`);
      const result = await this.simulateMCPCall(functionName, params);

      if (!result.success) {
        console.error(`MCP function ${functionName} failed:`, result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = `MCP function execution failed: ${error}`;
      console.error(errorMessage);

      return {
        success: false,
        error: errorMessage,
        executionTime: 0,
      };
    }
  }

  /**
   * Handle MCP connection errors with recovery strategies
   */
  async handleMCPError(error: string, context?: string): Promise<boolean> {
    console.error(`MCP error in ${context || 'unknown context'}:`, error);

    this.connectionStatus.connectionErrors.push(
      `${context || 'Error'}: ${error}`
    );

    // Determine recovery strategy based on error type
    if (error.includes('connection') || error.includes('timeout')) {
      console.log('Attempting to reconnect MCP server...');
      return await this.reconnectMCP();
    }

    if (error.includes('function') || error.includes('unavailable')) {
      console.log('Re-verifying MCP functions...');
      return await this.verifyMCPFunctions();
    }

    // Generic error handling
    console.log('Performing health check after error...');
    return await this.performHealthCheck();
  }

  /**
   * Reconnect to MCP server
   */
  async reconnectMCP(): Promise<boolean> {
    console.log('Reconnecting to chrome-devtools MCP server...');

    // Stop current health check
    this.stopHealthCheckMonitoring();

    // Reset connection status
    this.connectionStatus.isConnected = false;
    this.connectionStatus.availableFunctions = [];

    // Attempt to reconnect
    return await this.initializeMCPConnection();
  }

  /**
   * Perform health check on MCP connection
   */
  async performHealthCheck(): Promise<boolean> {
    if (!this.connectionStatus.isConnected) {
      return false;
    }

    try {
      console.log('Performing MCP health check...');

      // Test basic functionality
      const testResult = await this.executeMCPFunction(
        'mcp_chrome_devtools_list_pages'
      );

      if (!testResult.success) {
        console.warn('Health check failed, attempting recovery...');
        return await this.handleMCPError(
          testResult.error || 'Health check failed',
          'health_check'
        );
      }

      console.log('MCP health check passed');
      return true;
    } catch (error) {
      console.error('Health check error:', error);
      return await this.handleMCPError(String(error), 'health_check');
    }
  }

  /**
   * Start periodic health check monitoring
   */
  private startHealthCheckMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Check every 30 seconds

    console.log('Started MCP health check monitoring');
  }

  /**
   * Stop health check monitoring
   */
  private stopHealthCheckMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      console.log('Stopped MCP health check monitoring');
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): MCPConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Get connection configuration
   */
  getConfiguration(): MCPConfiguration {
    return { ...this.config };
  }

  /**
   * Check if connection is healthy
   */
  isConnectionHealthy(): boolean {
    return (
      this.connectionStatus.isConnected &&
      this.connectionStatus.availableFunctions.length ===
        this.config.requiredFunctions.length &&
      this.connectionStatus.connectionErrors.length === 0
    );
  }

  /**
   * Get connection summary for reporting
   */
  getConnectionSummary(): string {
    const status = this.connectionStatus;

    if (!status.isConnected) {
      return `MCP connection failed after ${status.retryCount} attempts. Errors: ${status.connectionErrors.join(
        '; '
      )}`;
    }

    return `MCP connection established with ${
      status.availableFunctions.length
    }/${
      this.config.requiredFunctions.length
    } functions available (${status.connectionLatency}ms latency, ${
      status.retryCount
    } retries)`;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopHealthCheckMonitoring();
    this.connectionStatus.isConnected = false;
    console.log('MCP connection manager cleaned up');
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
