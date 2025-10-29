/**
 * Debug Configuration Manager
 * Manages debugging settings, profiles, and tool customization
 */

import {
  DebugSessionConfig,
  MonitoringConfig,
  TestScenarioConfig,
  ValidationCriteria,
  DebugWorkflow,
} from '../types/debug-types.js';

export interface DebugProfile {
  id: string;
  name: string;
  description: string;
  sessionConfig: DebugSessionConfig;
  monitoringConfig: MonitoringConfig;
  testConfig: TestScenarioConfig;
  validationCriteria: ValidationCriteria;
  workflows: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DebugSettings {
  defaultProfile: string;
  autoSaveResults: boolean;
  maxStoredSessions: number;
  enableNotifications: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  exportFormat: 'json' | 'html' | 'csv';
  theme: 'light' | 'dark' | 'auto';
  dashboardRefreshRate: number;
}

export interface ToolCustomization {
  toolId: string;
  enabled: boolean;
  config: Record<string, any>;
  shortcuts?: Record<string, string>;
  displayOptions?: {
    position: 'top' | 'bottom' | 'left' | 'right';
    size: 'small' | 'medium' | 'large';
    collapsed: boolean;
  };
}

export class DebugConfigManager {
  private profiles: Map<string, DebugProfile> = new Map();
  private settings: DebugSettings;
  private toolCustomizations: Map<string, ToolCustomization> = new Map();
  private workflows: Map<string, DebugWorkflow> = new Map();
  private configStorage: Storage | null = null;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.initializeDefaultProfiles();
    this.loadConfiguration();
  }

  /**
   * Get current debug settings
   */
  getSettings(): DebugSettings {
    return { ...this.settings };
  }

  /**
   * Update debug settings
   */
  async updateSettings(newSettings: Partial<DebugSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveConfiguration();
    console.log('Debug settings updated');
  }

  /**
   * Create a new debug profile
   */
  async createProfile(
    profileData: Omit<DebugProfile, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const profileId = this.generateProfileId();
    const profile: DebugProfile = {
      ...profileData,
      id: profileId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.profiles.set(profileId, profile);
    await this.saveConfiguration();

    console.log(
      `Debug profile '${profile.name}' created with ID: ${profileId}`
    );
    return profileId;
  }

  /**
   * Get debug profile by ID
   */
  getProfile(profileId: string): DebugProfile | null {
    return this.profiles.get(profileId) || null;
  }

  /**
   * Get all debug profiles
   */
  getAllProfiles(): DebugProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Update existing debug profile
   */
  async updateProfile(
    profileId: string,
    updates: Partial<DebugProfile>
  ): Promise<boolean> {
    const profile = this.profiles.get(profileId);
    if (!profile) return false;

    const updatedProfile = {
      ...profile,
      ...updates,
      id: profileId, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    this.profiles.set(profileId, updatedProfile);
    await this.saveConfiguration();

    console.log(`Debug profile '${profile.name}' updated`);
    return true;
  }

  /**
   * Delete debug profile
   */
  async deleteProfile(profileId: string): Promise<boolean> {
    const profile = this.profiles.get(profileId);
    if (!profile) return false;

    // Don't allow deletion of default profile
    if (profile.isDefault) {
      throw new Error('Cannot delete default profile');
    }

    this.profiles.delete(profileId);

    // Update default profile if this was the default
    if (this.settings.defaultProfile === profileId) {
      const defaultProfile = Array.from(this.profiles.values()).find(
        p => p.isDefault
      );
      this.settings.defaultProfile = defaultProfile?.id || '';
    }

    await this.saveConfiguration();
    console.log(`Debug profile '${profile.name}' deleted`);
    return true;
  }

  /**
   * Set default debug profile
   */
  async setDefaultProfile(profileId: string): Promise<boolean> {
    const profile = this.profiles.get(profileId);
    if (!profile) return false;

    // Update previous default
    const previousDefault = Array.from(this.profiles.values()).find(
      p => p.isDefault
    );
    if (previousDefault) {
      previousDefault.isDefault = false;
    }

    // Set new default
    profile.isDefault = true;
    this.settings.defaultProfile = profileId;

    await this.saveConfiguration();
    console.log(`Default profile set to '${profile.name}'`);
    return true;
  }

  /**
   * Get current default profile
   */
  getDefaultProfile(): DebugProfile | null {
    return (
      this.profiles.get(this.settings.defaultProfile) ||
      Array.from(this.profiles.values()).find(p => p.isDefault) ||
      null
    );
  }

  /**
   * Customize debugging tool
   */
  async customizeTool(
    toolId: string,
    customization: Partial<ToolCustomization>
  ): Promise<void> {
    const existing = this.toolCustomizations.get(toolId) || {
      toolId,
      enabled: true,
      config: {},
    };

    const updated: ToolCustomization = {
      ...existing,
      ...customization,
      toolId, // Ensure toolId doesn't change
    };

    this.toolCustomizations.set(toolId, updated);
    await this.saveConfiguration();

    console.log(`Tool '${toolId}' customization updated`);
  }

  /**
   * Get tool customization
   */
  getToolCustomization(toolId: string): ToolCustomization | null {
    return this.toolCustomizations.get(toolId) || null;
  }

  /**
   * Get all tool customizations
   */
  getAllToolCustomizations(): ToolCustomization[] {
    return Array.from(this.toolCustomizations.values());
  }

  /**
   * Reset tool customization to defaults
   */
  async resetToolCustomization(toolId: string): Promise<void> {
    this.toolCustomizations.delete(toolId);
    await this.saveConfiguration();
    console.log(`Tool '${toolId}' customization reset to defaults`);
  }

  /**
   * Create debug workflow
   */
  async createWorkflow(workflow: Omit<DebugWorkflow, 'id'>): Promise<string> {
    const workflowId = this.generateWorkflowId();
    const fullWorkflow: DebugWorkflow = {
      ...workflow,
      id: workflowId,
    };

    this.workflows.set(workflowId, fullWorkflow);
    await this.saveConfiguration();

    console.log(
      `Debug workflow '${workflow.name}' created with ID: ${workflowId}`
    );
    return workflowId;
  }

  /**
   * Get debug workflow
   */
  getWorkflow(workflowId: string): DebugWorkflow | null {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * Get all debug workflows
   */
  getAllWorkflows(): DebugWorkflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Update debug workflow
   */
  async updateWorkflow(
    workflowId: string,
    updates: Partial<DebugWorkflow>
  ): Promise<boolean> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    const updatedWorkflow = {
      ...workflow,
      ...updates,
      id: workflowId, // Ensure ID doesn't change
    };

    this.workflows.set(workflowId, updatedWorkflow);
    await this.saveConfiguration();

    console.log(`Debug workflow '${workflow.name}' updated`);
    return true;
  }

  /**
   * Delete debug workflow
   */
  async deleteWorkflow(workflowId: string): Promise<boolean> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    this.workflows.delete(workflowId);

    // Remove workflow from profiles
    for (const profile of this.profiles.values()) {
      const index = profile.workflows.indexOf(workflowId);
      if (index > -1) {
        profile.workflows.splice(index, 1);
      }
    }

    await this.saveConfiguration();
    console.log(`Debug workflow '${workflow.name}' deleted`);
    return true;
  }

  /**
   * Export configuration
   */
  exportConfiguration(): string {
    const config = {
      settings: this.settings,
      profiles: Array.from(this.profiles.values()),
      toolCustomizations: Array.from(this.toolCustomizations.values()),
      workflows: Array.from(this.workflows.values()),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration
   */
  async importConfiguration(configJson: string): Promise<void> {
    try {
      const config = JSON.parse(configJson);

      // Validate configuration structure
      if (!this.validateConfigurationStructure(config)) {
        throw new Error('Invalid configuration structure');
      }

      // Import settings
      if (config.settings) {
        this.settings = { ...this.getDefaultSettings(), ...config.settings };
      }

      // Import profiles
      if (config.profiles) {
        this.profiles.clear();
        config.profiles.forEach((profile: DebugProfile) => {
          this.profiles.set(profile.id, profile);
        });
      }

      // Import tool customizations
      if (config.toolCustomizations) {
        this.toolCustomizations.clear();
        config.toolCustomizations.forEach(
          (customization: ToolCustomization) => {
            this.toolCustomizations.set(customization.toolId, customization);
          }
        );
      }

      // Import workflows
      if (config.workflows) {
        this.workflows.clear();
        config.workflows.forEach((workflow: DebugWorkflow) => {
          this.workflows.set(workflow.id, workflow);
        });
      }

      await this.saveConfiguration();
      console.log('Configuration imported successfully');
    } catch (error) {
      console.error('Failed to import configuration:', error);
      throw error;
    }
  }

  /**
   * Reset configuration to defaults
   */
  async resetToDefaults(): Promise<void> {
    this.settings = this.getDefaultSettings();
    this.profiles.clear();
    this.toolCustomizations.clear();
    this.workflows.clear();

    this.initializeDefaultProfiles();
    await this.saveConfiguration();

    console.log('Configuration reset to defaults');
  }

  /**
   * Validate current configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate settings
    if (!this.settings.defaultProfile) {
      errors.push('No default profile set');
    }

    // Validate profiles
    const defaultProfiles = Array.from(this.profiles.values()).filter(
      p => p.isDefault
    );
    if (defaultProfiles.length === 0) {
      errors.push('No default profile found');
    } else if (defaultProfiles.length > 1) {
      errors.push('Multiple default profiles found');
    }

    // Validate profile references
    if (
      this.settings.defaultProfile &&
      !this.profiles.has(this.settings.defaultProfile)
    ) {
      errors.push('Default profile ID does not exist');
    }

    // Validate workflow references in profiles
    for (const profile of this.profiles.values()) {
      for (const workflowId of profile.workflows) {
        if (!this.workflows.has(workflowId)) {
          errors.push(
            `Profile '${profile.name}' references non-existent workflow: ${workflowId}`
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Private helper methods

  private getDefaultSettings(): DebugSettings {
    return {
      defaultProfile: '',
      autoSaveResults: true,
      maxStoredSessions: 50,
      enableNotifications: true,
      logLevel: 'info',
      exportFormat: 'json',
      theme: 'light',
      dashboardRefreshRate: 5000,
    };
  }

  private initializeDefaultProfiles(): void {
    // Basic debugging profile
    const basicProfile: DebugProfile = {
      id: 'basic-debug',
      name: 'Basic Debugging',
      description: 'Basic debugging configuration for general use',
      sessionConfig: {
        timeout: 300000,
        maxRetries: 3,
        captureConsole: true,
        captureNetwork: true,
        capturePerformance: true,
        captureStorage: false,
        captureMemory: false,
        contexts: ['service-worker', 'content-script'],
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
        stopOnFailure: false,
      },
      validationCriteria: {
        maxExecutionTime: 30000,
        requiredMetrics: ['executionTime'],
      },
      workflows: [],
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Comprehensive debugging profile
    const comprehensiveProfile: DebugProfile = {
      id: 'comprehensive-debug',
      name: 'Comprehensive Debugging',
      description: 'Full debugging configuration with all features enabled',
      sessionConfig: {
        timeout: 600000,
        maxRetries: 5,
        captureConsole: true,
        captureNetwork: true,
        capturePerformance: true,
        captureStorage: true,
        captureMemory: true,
        contexts: ['service-worker', 'content-script', 'offscreen', 'ui'],
      },
      monitoringConfig: {
        enabled: true,
        interval: 10000,
        scenarios: [],
        alertThresholds: {
          failureRate: 0.05,
          executionTime: 10000,
          memoryUsage: 200 * 1024 * 1024,
        },
        notifications: {
          console: true,
        },
      },
      testConfig: {
        parallel: 3,
        timeout: 60000,
        retries: 2,
        stopOnFailure: false,
      },
      validationCriteria: {
        maxExecutionTime: 60000,
        requiredMetrics: ['executionTime', 'memoryUsage'],
        metricThresholds: {
          executionTime: { max: 30000 },
          memoryUsage: { max: 100 * 1024 * 1024 },
        },
      },
      workflows: [],
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.profiles.set(basicProfile.id, basicProfile);
    this.profiles.set(comprehensiveProfile.id, comprehensiveProfile);
    this.settings.defaultProfile = basicProfile.id;
  }

  private generateProfileId(): string {
    return `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateWorkflowId(): string {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadConfiguration(): Promise<void> {
    try {
      // In a real implementation, this would load from chrome.storage or file system
      // For now, we'll use the default configuration
      console.log('Configuration loaded (using defaults)');
    } catch (error) {
      console.warn('Failed to load configuration, using defaults:', error);
    }
  }

  private async saveConfiguration(): Promise<void> {
    try {
      // In a real implementation, this would save to chrome.storage or file system
      const config = {
        settings: this.settings,
        profiles: Array.from(this.profiles.entries()),
        toolCustomizations: Array.from(this.toolCustomizations.entries()),
        workflows: Array.from(this.workflows.entries()),
      };

      console.log('Configuration saved');
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  private validateConfigurationStructure(config: any): boolean {
    // Basic structure validation
    if (typeof config !== 'object' || config === null) return false;

    // Check for required top-level properties
    const requiredProps = ['settings', 'profiles'];
    for (const prop of requiredProps) {
      if (!(prop in config)) return false;
    }

    // Validate settings structure
    if (typeof config.settings !== 'object') return false;

    // Validate profiles structure
    if (!Array.isArray(config.profiles)) return false;

    return true;
  }
}

// Export singleton instance
export const debugConfigManager = new DebugConfigManager();
