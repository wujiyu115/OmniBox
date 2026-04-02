pub mod manager;

pub use manager::{
    get_all_plugin_html, get_builtin_plugins, get_plugin_html, get_plugin_info, get_plugins_dir,
    Cmd, Command, Feature, Lifecycle, Plugin, PluginManifest, PluginManager,
};
