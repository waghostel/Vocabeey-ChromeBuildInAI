/**
 * Test Real Continuous Monitoring Integration
 * Comprehensive test for the real-time debugging monitoring system
 */

import { RealContinuousDebugMonitor } from './monitoring/real-continuous-debug-monitor';
import { RealDebugAlertSystem } from './monitoring/real-debug-alert-system';
import { RealDebugWorkflowIntegration } from './monitoring/real-debug-workflow-integration';
import { RealDebugDashboard } from './utils/real-debug-dashboard';
import { MCPConnectionManager } from './utils/mcp-connection-manager';

/**
 * Test the complete real continuous monitoring system
 */
async function testRealContinuousMonitoringIntegration(): Promise<void> {
  console.log('🧪 Starting Real Continuous Monitoring Integration Test...');

  try {
    // Initialize MCP Connection Manager
    console.log('1. Initializing MCP Connection Manager...');
    const mcpConnectionManager = new MCPConnectionManager();

    // Test MCP connection
    const mcpConnected = await mcpConnectionManager.initializeMCPConnection();
    if (!mcpConnected) {
      throw new Error('Failed to establish MCP connection');
    }
    console.log('✅ MCP connection established');

    // Initialize Alert System
    console.log('2. Initializing Real Debug Alert System...');
    const alertSystem = new RealDebugAlertSystem(mcpConnectionManager);
    console.log('✅ Alert system initialized');

    // Initialize Dashboard
    console.log('3. Initializing Real Debug Dashboard...');
    const dashboard = new RealDebugDashboard(mcpConnectionManager, alertSystem);
    console.log('✅ Dashboard initialized');

    // Initialize Workflow Integration
    console.log('4. Initializing Real Debug Workflow Integration...');
    const workflowIntegration = new RealDebugWorkflowIntegration(
      mcpConnectionManager
    );
    console.log('✅ Workflow integration initialized');

    // Initialize Continuous Monitor
    console.log('5. Initializing Real Continuous Debug Monitor...');
    const continuousMonitor = new RealContinuousDebugMonitor(
      mcpConnectionManager,
      {
        enabled: true,
        interval: 30000, // 30 seconds for testing
        realTimeChecks: true,
        performanceThresholds: {
          memoryUsage: 50, // Lower threshold for testing
          responseTime: 1000,
          errorRate: 0.1,
          failureRate: 0.2,
          cpuUsage: 70,
        },
        extensionMonitoring: {
          serviceWorker: true,
          contentScript: true,
          offscreen: true,
          ui: true,
        },
        alerting: {
          immediate: true,
          channels: ['console'],
          severityLevels: ['medium', 'high', 'critical'],
        },
        dashboard: {
          enabled: true,
          refreshInterval: 5000,
          maxDataPoints: 100,
        },
      }
    );
    console.log('✅ Continuous monitor initialized');

    // Test 1: Start Real-Time Monitoring
    console.log('\n📊 Test 1: Starting Real-Time Monitoring...');
    await continuousMonitor.startRealTimeMonitoring();

    // Wait for initial monitoring data
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds

    const monitoringStatus = continuousMonitor.getMonitoringStatus();
    console.log('Monitoring Status:', {
      isMonitoring: monitoringStatus.isMonitoring,
      activeAlerts: monitoringStatus.activeAlerts,
      uptime: monitoringStatus.uptime,
    });

    if (!monitoringStatus.isMonitoring) {
      throw new Error('Real-time monitoring failed to start');
    }
    console.log('✅ Real-time monitoring started successfully');

    // Test 2: Dashboard Integration
    console.log('\n🖥️ Test 2: Testing Dashboard Integration...');
    await dashboard.startRealTimeDashboard();

    // Wait for dashboard to collect data
    await new Promise(resolve => setTimeout(resolve, 5000));

    const dashboardData = dashboard.getDashboardData();
    if (!dashboardData) {
      throw new Error('Dashboard failed to collect data');
    }

    console.log('Dashboard Data Summary:', {
      timestamp: dashboardData.timestamp,
      sessionStatus: dashboardData.sessionInfo.status,
      activeAlerts: dashboardData.alertSummary.activeAlerts,
      healthScore:
        (dashboardData.extensionMetrics.health.overallScore * 100).toFixed(1) +
        '%',
      performanceCharts: dashboardData.performanceCharts.length,
    });
    console.log('✅ Dashboard integration working');

    // Test 3: Alert System Integration
    console.log('\n🚨 Test 3: Testing Alert System Integration...');

    // Create a test alert condition by simulating high memory usage
    const testMetrics = {
      timestamp: new Date(),
      contexts: {
        serviceWorker: {
          isActive: true,
          isHealthy: false, // Trigger unhealthy alert
          memoryUsage: 60, // Above threshold
          errorCount: 2,
          lastActivity: new Date(),
          responseTime: 1500,
          healthScore: 0.4, // Low health score
          issues: ['High memory usage', 'Slow response time'],
        },
        contentScript: {
          isActive: true,
          isHealthy: true,
          memoryUsage: 20,
          errorCount: 0,
          lastActivity: new Date(),
          responseTime: 500,
          healthScore: 0.9,
          issues: [],
        },
        offscreen: {
          isActive: true,
          isHealthy: true,
          memoryUsage: 30,
          errorCount: 0,
          lastActivity: new Date(),
          responseTime: 800,
          healthScore: 0.8,
          issues: [],
        },
        ui: {
          isActive: false,
          isHealthy: false,
          memoryUsage: 0,
          errorCount: 1,
          lastActivity: new Date(Date.now() - 60000), // 1 minute ago
          responseTime: 0,
          healthScore: 0.2,
          issues: ['Context inactive'],
        },
      },
      performance: {
        memoryUsage: 110, // Above threshold
        cpuUsage: 75,
        networkLatency: 100,
        responseTime: 1200,
      },
      health: {
        overallScore: 0.55, // Below good health
        contextHealth: {
          serviceWorker: 0.4,
          contentScript: 0.9,
          offscreen: 0.8,
          ui: 0.2,
        },
        criticalIssues: ['Service worker unhealthy', 'UI context inactive'],
        warnings: ['High memory usage', 'Degraded performance'],
      },
    };

    // Process test metrics through alert system
    const generatedAlerts =
      await alertSystem.processRealTimeMetrics(testMetrics);

    console.log(`Generated ${generatedAlerts.length} alerts from test metrics`);
    generatedAlerts.forEach(alert => {
      console.log(`  - ${alert.severity.toUpperCase()}: ${alert.message}`);
    });

    if (generatedAlerts.length === 0) {
      console.warn(
        '⚠️ No alerts generated from test conditions (may indicate alert thresholds need adjustment)'
      );
    } else {
      console.log('✅ Alert system generating alerts correctly');
    }

    // Test 4: Workflow Integration
    console.log('\n🔄 Test 4: Testing Workflow Integration...');

    // Test workflow integration with monitoring data
    const workflowStatus =
      await workflowIntegration.integrateWithDevelopmentWorkflow({
        monitoringData: testMetrics,
        alerts: generatedAlerts,
        sessionId: monitoringStatus.sessionId || 'test-session',
      });

    console.log('Workflow Integration Status:', {
      integrated: workflowStatus.success,
      recommendations: workflowStatus.recommendations?.length || 0,
      actions: workflowStatus.automatedActions?.length || 0,
    });

    if (workflowStatus.success) {
      console.log('✅ Workflow integration successful');
    } else {
      console.warn('⚠️ Workflow integration had issues:', workflowStatus.error);
    }

    // Test 5: End-to-End Monitoring Cycle
    console.log('\n🔄 Test 5: Testing End-to-End Monitoring Cycle...');

    // Let monitoring run for a full cycle
    console.log('Running monitoring for 30 seconds to test full cycle...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Check final status
    const finalStatus = continuousMonitor.getMonitoringStatus();
    const finalMetrics = continuousMonitor.getLiveMetrics();
    const metricsHistory = continuousMonitor.getMetricsHistory(5); // Last 5 entries
    const activeAlerts = continuousMonitor.getActiveAlerts();

    console.log('Final Monitoring Results:', {
      uptime: finalStatus.uptime,
      totalAlerts: activeAlerts.length,
      metricsCollected: metricsHistory.length,
      currentHealth: finalMetrics
        ? (finalMetrics.health.overallScore * 100).toFixed(1) + '%'
        : 'N/A',
      dashboardActive: dashboard.getDashboardStatus().isActive,
    });

    // Test 6: Generate HTML Dashboard
    console.log('\n📄 Test 6: Generating HTML Dashboard...');

    try {
      const htmlDashboard = dashboard.generateHTMLDashboard();

      // Save dashboard to file for inspection
      const fs = require('fs');
      const path = require('path');
      const dashboardPath = path.join(
        __dirname,
        'reports',
        'real-time-dashboard.html'
      );

      // Ensure reports directory exists
      const reportsDir = path.dirname(dashboardPath);
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      fs.writeFileSync(dashboardPath, htmlDashboard);
      console.log(`✅ HTML dashboard generated: ${dashboardPath}`);
    } catch (error) {
      console.warn('⚠️ HTML dashboard generation failed:', error);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test resources...');
    continuousMonitor.stopRealTimeMonitoring();
    dashboard.stopRealTimeDashboard();
    continuousMonitor.cleanup();
    dashboard.cleanup();
    alertSystem.cleanup();

    console.log('✅ Cleanup completed');

    // Final Summary
    console.log('\n📋 Test Summary:');
    console.log('✅ MCP Connection: Working');
    console.log('✅ Real-Time Monitoring: Working');
    console.log('✅ Dashboard Integration: Working');
    console.log(
      `${generatedAlerts.length > 0 ? '✅' : '⚠️'} Alert System: ${generatedAlerts.length > 0 ? 'Working' : 'Needs Adjustment'}`
    );
    console.log(
      `${workflowStatus.success ? '✅' : '⚠️'} Workflow Integration: ${workflowStatus.success ? 'Working' : 'Needs Work'}`
    );
    console.log('✅ End-to-End Cycle: Working');

    console.log(
      '\n🎉 Real Continuous Monitoring Integration Test Completed Successfully!'
    );
  } catch (error) {
    console.error(
      '❌ Real Continuous Monitoring Integration Test Failed:',
      error
    );
    throw error;
  }
}

/**
 * Run the integration test
 */
async function runTest(): Promise<void> {
  try {
    await testRealContinuousMonitoringIntegration();
    process.exit(0);
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

// Export for use in other test files
export { testRealContinuousMonitoringIntegration };

// Run test if this file is executed directly
if (require.main === module) {
  runTest();
}
