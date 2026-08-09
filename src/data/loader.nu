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
        | insert id {|cmd| $cmd.name | str replace -ra '\s+' '_' }
        | insert sig_str {|cmd|
            let pos = $cmd.signatures
                | values | first
                | each {|p| match $p.parameter_type {
                    'positional' => { format pattern '({parameter_name})' }
                    'rest' => '...rest'
                }}
                | str join ' '
            [$cmd.name, '{flags}', $pos] | compact --empty | str join ' '
        }
        | insert plugin_file {|cmd|
            if $cmd.type == 'plugin' {
                try {
                    plugin list | where commands.name has $cmd.name
                    | first | format pattern 'nu_plugin_{name}'
                }
            }
        }
        | insert in_out_types {|cmd|
            $cmd.signatures
            | values
            | each {
                where parameter_type in [input, output]
                | select parameter_type syntax_shape
                | transpose -rd
            }
        }
        | insert flags {|cmd|
            $cmd.signatures | values | first | where parameter_type in [named, switch]
        }
        | to json
    '#
    ^$nu.current-exe --no-config-file ...$plugin_flags --commands $command
}
