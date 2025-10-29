/**
 * Test Debugging Utilities
 * Tests for debugging session management, data visualization, and configuration management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { debugSessionManager } from './utils/debug-session-manager.js';
import { debugDashboard } from './utils/debug-dashboard.js';
import { debugConfigManager } from './utils/debug-config-manager.js';
import type { DebugSessionState } from './types/debug-types.js';

describe('Debugging Utilities', () => {
  describe('Session Management', () => {
    let sessionId: string;

    afterEach(async () => {
      if (sessionId) {
        await debugSessionManager.cleanupSession(sessionId);
      }
    });

    it('should initialize a debug session', async () => {
      sessionId = await debugSessionManager.initializeDebugSession({
        timeout: 60000,
        captureConsole: true,
        captureNetwork: true,
        contexts: ['service-worker', 'content-script'],
      });

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId).toMatch(/^debug-session-/);
    });

    it('should get current session', async () => {
      sessionId = await debugSessionManager.initializeDebugSession();
      const session = debugSessionManager.getCurrentSession();

      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
      expect(session?.status).toBe('active');
    });

    it('should switch context', async () => {
      sessionId = await debugSessionManager.initializeDebugSession();
      const result = await debugSessionManager.switchContext('service-worker');

      expect(result).toBe(true);
    });

    it('should capture debug data', async () => {
      sessionId = await debugSessionManager.initializeDebugSession();
      await debugSessionManager.switchContext('service-worker');
      await debugSessionManager.captureDebugData();

      const session = debugSessionManager.getSessionState();
      expect(session).toBeDefined();
      expect(session?.capturedData).toBeDefined();
    });

    it('should list sessions', async () => {
      sessionId = await debugSessionManager.initializeDebugSession();
      const sessions = debugSessionManager.listSessions();

      expect(sessions).toBeDefined();
      expect(sessions.active).toContain(sessionId);
    });
  });

  describe('Data Visualization', () => {
    let mockSessionState: DebugSessionState;

    beforeEach(() => {
      mockSessionState = {
        sessionId: 'test-session-123',
        startTime: new Date(Date.now() - 300000),
        status: 'active',
        activeContexts: [
          {
            type: 'service-worker',
            pageIndex: 0,
            isActive: true,
            lastActivity: new Date(),
          },
        ],
        capturedData: {
          consoleMessages: [
            {
              id: 1,
              timestamp: new Date(),
              level: 'info',
              message: 'Test message',
              source: 'service-worker',
              context: 'service-worker',
            },
          ],
          networkRequests: [
            {
              id: 1,
              timestamp: new Date(),
              method: 'GET',
              url: 'https://api.example.com/data',
              status: 200,
              responseTime: 150,
              requestSize: 0,
              responseSize: 1024,
              context: 'service-worker',
            },
          ],
          performanceMetrics: [
            {
              timestamp: new Date(),
              name: 'response_time',
              value: 150,
              unit: 'ms',
              context: 'service-worker',
            },
          ],
          errorLogs: [],
          storageOperations: [],
          memorySnapshots: [
            {
              timestamp: new Date(),
              totalJSHeapSize: 50 * 1024 * 1024,
              usedJSHeapSize: 30 * 1024 * 1024,
              jsHeapSizeLimit: 100 * 1024 * 1024,
              context: 'service-worker',
            },
          ],
        },
        testResults: [
          {
            passed: true,
            scenarioName: 'Test Scenario',
            executionTime: 2500,
            timestamp: new Date(),
            metrics: { contentLength: 1500 },
          },
        ],
        configuration: {
          timeout: 300000,
          maxRetries: 3,
          captureConsole: true,
          captureNetwork: true,
          capturePerformance: true,
          captureStorage: false,
          captureMemory: true,
          contexts: ['service-worker', 'content-script'],
        },
      };
    });

    afterEach(() => {
      debugDashboard.stopRealTimeUpdates();
    });

    it('should initialize dashboard', async () => {
      const dashboardData =
        await debugDashboard.initializeDashboard(mockSessionState);

      expect(dashboardData).toBeDefined();
      expect(dashboardData.sessionOverview.sessionId).toBe('test-session-123');
      expect(dashboardData.performanceCharts).toBeDefined();
      expect(dashboardData.timeline).toBeDefined();
    });

    it('should generate performance charts', () => {
      const charts = debugDashboard.generatePerformanceCharts(mockSessionState);

      expect(charts).toBeDefined();
      expect(Array.isArray(charts)).toBe(true);
      expect(charts.length).toBeGreaterThan(0);
    });

    it('should generate timeline', () => {
      const timeline = debugDashboard.generateTimeline(mockSessionState);

      expect(timeline).toBeDefined();
      expect(Array.isArray(timeline)).toBe(true);
    });

    it('should generate HTML dashboard', () => {
      const html = debugDashboard.generateHTMLDashboard(mockSessionState);

      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('test-session-123');
    });

    it('should export dashboard data', async () => {
      await debugDashboard.initializeDashboard(mockSessionState);
      const exported = debugDashboard.exportDashboardData('json');

      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
      expect(() => JSON.parse(exported)).not.toThrow();
    });
  });

  describe('Configuration Management', () => {
    let testProfileId: string;
    let testWorkflowId: string;

    afterEach(async () => {
      if (testProfileId) {
        try {
          await debugConfigManager.deleteProfile(testProfileId);
        } catch (error) {
          // Profile might not exist or already deleted
        }
      }
      if (testWorkflowId) {
        try {
          await debugConfigManager.deleteWorkflow(testWorkflowId);
        } catch (error) {
          // Workflow might not exist or already deleted
        }
      }
    });

    it('should get and update settings', async () => {
      const settings = debugConfigManager.getSettings();
      expect(settings).toBeDefined();
      expect(settings.logLevel).toBeDefined();

      await debugConfigManager.updateSettings({
        logLevel: 'debug',
        autoSaveResults: false,
      });

      const updatedSettings = debugConfigManager.getSettings();
      expect(updatedSettings.logLevel).toBe('debug');
      expect(updatedSettings.autoSaveResults).toBe(false);
    });

    it('should manage profiles', async () => {
      const profiles = debugConfigManager.getAllProfiles();
      expect(profiles).toBeDefined();
      expect(Array.isArray(profiles)).toBe(true);

      testProfileId = await debugConfigManager.createProfile({
        name: 'Test Profile',
        description: 'A test profile',
        sessionConfig: {
          timeout: 120000,
          maxRetries: 2,
          captureConsole: true,
          captureNetwork: false,
          capturePerformance: true,
          captureStorage: false,
          captureMemory: false,
          contexts: ['service-worker'],
        },
        monitoringConfig: {
          enabled: false,
          interval: 30000,
          scenarios: [],
          alertThresholds: {
            failureRate: 0.1,
            executionTime: 5000,
            memoryUsage: 100 * 1024 * 1024,
          },
          notifications: {
            console: true,
          },
        },
        testConfig: {
          parallel: 1,
          timeout: 30000,
          retries: 1,
          stopOnFailure: true,
        },
        validationCriteria: {
          maxExecutionTime: 30000,
        },
        workflows: [],
        isDefault: false,
      });

      expect(testProfileId).toBeDefined();
      expect(typeof testProfileId).toBe('string');

      const profile = debugConfigManager.getProfile(testProfileId);
      expect(profile).toBeDefined();
      expect(profile?.name).toBe('Test Profile');
    });

    it('should get default profile', () => {
      const defaultProfile = debugConfigManager.getDefaultProfile();
      expect(defaultProfile).toBeDefined();
      expect(defaultProfile?.isDefault).toBe(true);
    });

    it('should manage tool customizations', async () => {
      await debugConfigManager.customizeTool('test-tool', {
        enabled: true,
        config: { option1: 'value1' },
      });

      const customization =
        debugConfigManager.getToolCustomization('test-tool');
      expect(customization).toBeDefined();
      expect(customization?.enabled).toBe(true);
      expect(customization?.config.option1).toBe('value1');
    });

    it('should manage workflows', async () => {
      testWorkflowId = await debugConfigManager.createWorkflow({
        name: 'Test Workflow',
        description: 'A test workflow',
        steps: [
          {
            id: 'step1',
            name: 'Test Step',
            type: 'custom',
            config: { action: 'test' },
          },
        ],
        triggers: [
          {
            type: 'manual',
            config: {},
          },
        ],
        enabled: true,
      });

      expect(testWorkflowId).toBeDefined();

      const workflow = debugConfigManager.getWorkflow(testWorkflowId);
      expect(workflow).toBeDefined();
      expect(workflow?.name).toBe('Test Workflow');
    });

    it('should validate configuration', () => {
      const validation = debugConfigManager.validateConfiguration();
      expect(validation).toBeDefined();
      expect(typeof validation.isValid).toBe('boolean');
      expect(Array.isArray(validation.errors)).toBe(true);
    });

    it('should export and import configuration', async () => {
      const exported = debugConfigManager.exportConfiguration();
      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
      expect(() => JSON.parse(exported)).not.toThrow();

      // Test import would require more setup to avoid affecting current config
      // For now, just verify the export format is valid JSON
      const parsed = JSON.parse(exported);
      expect(parsed.settings).toBeDefined();
      expect(parsed.profiles).toBeDefined();
    });
  });

  describe('Integration', () => {
    let sessionId: string;

    afterEach(async () => {
      if (sessionId) {
        await debugSessionManager.cleanupSession(sessionId);
      }
      debugDashboard.stopRealTimeUpdates();
    });

    it('should integrate session management with dashboard', async () => {
      const defaultProfile = debugConfigManager.getDefaultProfile();
      expect(defaultProfile).toBeDefined();

      sessionId = await debugSessionManager.initializeDebugSession(
        defaultProfile?.sessionConfig
      );

      await debugSessionManager.captureDebugData();
      const sessionState = debugSessionManager.getSessionState();
      expect(sessionState).toBeDefined();

      const dashboardData = await debugDashboard.initializeDashboard(
        sessionState!
      );
      expect(dashboardData).toBeDefined();
      expect(dashboardData.sessionOverview.sessionId).toBe(sessionId);
    });
  });
});
