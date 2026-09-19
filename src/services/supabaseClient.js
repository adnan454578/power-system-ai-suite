import { createClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'gridmind_supabase_url';
const STORAGE_ANON_KEY = 'gridmind_supabase_anon_key';

class SupabaseManager {
  constructor() {
    this.client = null;
    this.initClient();
  }

  /**
   * Resolve active Supabase credentials.
   * Priority: localStorage (runtime UI override) -> import.meta.env (build/env defaults)
   */
  getConfig() {
    let localUrl = '';
    let localKey = '';

    if (typeof localStorage !== 'undefined') {
      localUrl = (localStorage.getItem(STORAGE_URL_KEY) || '').trim();
      localKey = (localStorage.getItem(STORAGE_ANON_KEY) || '').trim();
    }

    const envUrl = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL || '' : '').trim();
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY || '' : '').trim();

    const activeUrl = localUrl || envUrl;
    const activeKey = localKey || envKey;
    const source = localUrl && localKey ? 'localStorage' : (envUrl && envKey ? 'env' : 'none');

    return {
      url: activeUrl,
      anonKey: activeKey,
      isConfigured: Boolean(activeUrl && activeKey && this.isValidUrl(activeUrl)),
      source
    };
  }

  isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  initClient() {
    const config = this.getConfig();
    if (config.isConfigured) {
      try {
        this.client = createClient(config.url, config.anonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });
      } catch (err) {
        console.warn('GridMind: Failed to initialize Supabase client:', err.message);
        this.client = null;
      }
    } else {
      this.client = null;
    }
    return this.client;
  }

  getClient() {
    if (!this.client) {
      this.initClient();
    }
    return this.client;
  }

  isConfigured() {
    return this.getConfig().isConfigured && this.getClient() !== null;
  }

  /**
   * Save Supabase credentials from UI settings (persisted in localStorage)
   */
  saveConfig(url, anonKey) {
    const cleanUrl = (url || '').trim();
    const cleanKey = (anonKey || '').trim();

    if (typeof localStorage !== 'undefined') {
      if (cleanUrl) localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
      else localStorage.removeItem(STORAGE_URL_KEY);

      if (cleanKey) localStorage.setItem(STORAGE_ANON_KEY, cleanKey);
      else localStorage.removeItem(STORAGE_ANON_KEY);
    }

    this.client = null;
    return this.initClient();
  }

  /**
   * Reset / clear credentials stored in localStorage
   */
  clearConfig() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_URL_KEY);
      localStorage.removeItem(STORAGE_ANON_KEY);
    }
    this.client = null;
    return this.initClient();
  }

  /**
   * Diagnostic test connection
   * Can test either currently configured client or temporary test credentials
   */
  async testConnection(customUrl = null, customKey = null) {
    let testClient = this.client;

    if (customUrl !== null || customKey !== null) {
      const targetUrl = (customUrl ?? this.getConfig().url).trim();
      const targetKey = (customKey ?? this.getConfig().anonKey).trim();

      if (!targetUrl || !targetKey) {
        return {
          success: false,
          message: 'Both Supabase URL and Anon Key are required for connection test.'
        };
      }

      if (!this.isValidUrl(targetUrl)) {
        return {
          success: false,
          message: 'Invalid Supabase URL format. It should start with https://'
        };
      }

      try {
        testClient = createClient(targetUrl, targetKey, {
          auth: { persistSession: false }
        });
      } catch (err) {
        return {
          success: false,
          message: `Failed to construct Supabase client: ${err.message}`
        };
      }
    }

    if (!testClient) {
      return {
        success: false,
        message: 'Supabase is not configured. Please supply a valid Project URL and Anon Key.'
      };
    }

    try {
      // Perform a lightweight head query on the trained_topics table
      const { data, count, error } = await testClient
        .from('trained_topics')
        .select('id', { count: 'exact', head: false })
        .limit(1);

      if (error) {
        // Check if table missing
        if (error.code === '42P01' || error.message?.includes('relation "public.trained_topics" does not exist')) {
          return {
            success: false,
            code: 'TABLE_MISSING',
            message: 'Connected to Supabase project, but "trained_topics" table was not found. Click "Copy SQL Schema" and run it in Supabase SQL Editor!'
          };
        }
        return {
          success: false,
          code: error.code,
          message: `Supabase API Error: ${error.message}`
        };
      }

      return {
        success: true,
        message: `Successfully connected to Supabase! Table "trained_topics" is ready.`,
        recordCount: count ?? (Array.isArray(data) ? data.length : 0)
      };
    } catch (err) {
      return {
        success: false,
        message: `Network or connection failure: ${err.message}`
      };
    }
  }
}

export const supabaseManager = new SupabaseManager();
