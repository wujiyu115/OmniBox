export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  icon?: string;
  pluginId: string;
  score: number;
}

export interface PluginCmd {
  label: string;
  type: string;
  keyword: string;
}

export interface PluginFeature {
  code: string;
  explain: string;
  cmds: PluginCmd[];
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  icon?: string;
  plugin_type: string;
  features: PluginFeature[];
}

export interface SearchRequest {
  query: string;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Timestamp types
export interface TimestampConversion {
  seconds: string;
  milliseconds: string;
  nanoseconds: string;
}

export interface FormatEntry {
  format: string;
  value: string;
}

export interface TimestampResponse {
  input: string;
  detectedType: string;
  conversions: TimestampConversion;
  formats: FormatEntry[];
  timezone: string;
}

export interface Timezone {
  value: string;
  label: string;
}