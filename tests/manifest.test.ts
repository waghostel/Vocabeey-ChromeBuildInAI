/**
 * Unit tests for manifest.json validation
 */

import { describe, it, expect } from 'vitest';

import manifest from '../manifest.json';

describe('Manifest Validation', () => {
  it('should have manifest version 3', () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it('should have required extension metadata', () => {
    expect(manifest.name).toBe('Language Learning Assistant');
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.description).toBeTruthy();
    expect(manifest.description.length).toBeGreaterThan(0);
  });

  it('should have all required permissions', () => {
    const requiredPermissions = [
      'storage',
      'activeTab',
      'scripting',
      'offscreen',
      'tabs',
    ];

    requiredPermissions.forEach(permission => {
      expect(manifest.permissions).toContain(permission);
    });
  });

  it('should have host permissions for all URLs', () => {
    expect(manifest.host_permissions).toContain('<all_urls>');
  });

  it('should have valid background service worker configuration', () => {
    expect(manifest.background).toBeDefined();
    expect(manifest.background.service_worker).toBe(
      'dist/background/service-worker.js'
    );
    expect(manifest.background.type).toBe('module');
  });

  it('should have content scripts configured', () => {
    expect(manifest.content_scripts).toBeDefined();
    expect(manifest.content_scripts.length).toBeGreaterThan(0);

    const contentScript = manifest.content_scripts[0];
    expect(contentScript.matches).toContain('<all_urls>');
    expect(contentScript.js).toContain('dist/content/content-script.js');
    expect(contentScript.run_at).toBe('document_idle');
  });

  it('should have action with default icons', () => {
    expect(manifest.action).toBeDefined();
    expect(manifest.action.default_icon).toBeDefined();

    const iconSizes = ['16', '32', '48', '128'];
    iconSizes.forEach(size => {
      expect(manifest.action.default_icon[size]).toBeTruthy();
      expect(manifest.action.default_icon[size]).toMatch(/icons\/icon\d+\.png/);
    });
  });

  it('should have extension icons', () => {
    expect(manifest.icons).toBeDefined();

    const iconSizes = ['16', '32', '48', '128'];
    iconSizes.forEach(size => {
      expect(manifest.icons[size]).toBeTruthy();
      expect(manifest.icons[size]).toMatch(/icons\/icon\d+\.png/);
    });
  });

  it('should have web accessible resources', () => {
    expect(manifest.web_accessible_resources).toBeDefined();
    expect(manifest.web_accessible_resources.length).toBeGreaterThan(0);

    const resources = manifest.web_accessible_resources[0];
    expect(resources.resources).toContain('dist/ui/*');
    expect(resources.resources).toContain('dist/offscreen/*');
    expect(resources.matches).toContain('<all_urls>');
  });

  it('should have content security policy', () => {
    expect(manifest.content_security_policy).toBeDefined();
    expect(manifest.content_security_policy.extension_pages).toBeTruthy();
    expect(manifest.content_security_policy.extension_pages).toContain(
      "script-src 'self'"
    );
  });

  it('should not have any deprecated manifest v2 fields', () => {
    expect(manifest).not.toHaveProperty('browser_action');
    expect(manifest).not.toHaveProperty('page_action');
    expect(manifest).not.toHaveProperty('background.scripts');
    expect(manifest).not.toHaveProperty('background.page');
  });
});
