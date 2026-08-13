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
        | par-each {
            insert deprecated {|cmd|
                ^$nu.current-exe --no-config-file ...(plugin list | each --flatten { [--plugins, $in.filename] }) --commands $'($cmd.name) --help'
                | complete
                | $in.stderr has 'nu::parser::deprecated'
            }
        }
        | to json
    '#
    ^$nu.current-exe --no-config-file ...$plugin_flags --commands $command
}

def 'main stdlib' [] {
    view files
    | where filename like 'std(?:-rfc)?/'
    | get filename
    | each -f {|path|
        path split
        | window 2
        | each { match $in {
            [$name, 'mod.nu'] => {name: $name, path: $path, library: ($path | path split).0}
        } }
    }
    | insert fill-in {|mod|
        {}
        | insert commands {
            nu --no-config-file --commands $'
                overlay use -p ($mod.path) as __docgen__
                scope commands
                | where name starts-with "__docgen__"
                | to json
            '
            | from json
            | update name { str replace '__docgen__' $mod.name }
        }
        | insert variables {
            nu --no-config-file --commands $'
                overlay use -p ($mod.path) as __docgen__
                scope variables
                | where name == "$__docgen__"
                | to json
            '
            | from json
            | update name { str replace '__docgen__' $mod.name }
        }
    }
    | flatten fill-in
    | to json
}
