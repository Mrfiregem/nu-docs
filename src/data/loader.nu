#!/usr/bin/env nu

const nu_dir = $nu.current-exe | path dirname
const plugins = [
    nu_plugin_inc, nu_plugin_gstat, nu_plugin_polars,
    nu_plugin_formats, nu_plugin_query
]

def main [] {}

# Return Json of all base commands and official plugin commands
def 'main commands' [plugin_dir: directory = $nu_dir]: nothing -> string {
    let plugin_flags = $plugins | each --flatten {|p| [$plugin_dir, $p] | path join | prepend '--plugins' }
    let command = r#'
        scope commands
        | insert id {|rc| $rc.name | str replace -ra '\s+' '_' }
        | insert sig_str {|rc|
            let pos = $rc.signatures
                | values | first
                | each {|p| match $p.parameter_type {
                    'positional' => { format pattern '({parameter_name})' }
                    'rest' => '...rest'
                }}
                | str join ' '
            [$rc.name, '{flags}', $pos] | compact --empty | str join ' '
        }
        | to json
    '#
    ^$nu.current-exe --no-config-file ...$plugin_flags --commands $command
}
