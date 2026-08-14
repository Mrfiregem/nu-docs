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
        | insert plugin_file {|cmd|
            if $cmd.type == 'plugin' {
                try {
                    plugin list | where commands.name has $cmd.name
                    | first | format pattern 'nu_plugin_{name}'
                }
            }
        }
        | par-each {
            insert deprecated {|cmd| # TODO: replace after 0.115
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
            [$name, 'mod.nu'] => {module: $name, path: $path, library: ($path | path split).0}
        } }
    }
    | where $it.library != $it.module
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
            | update name { str replace '__docgen__' $mod.module }
            | insert plugin_file null
            | insert deprecated false # TODO: replace after 0.115
        }
        | insert variables {
            nu --no-config-file --commands $'
                overlay use -p ($mod.path) as __docgen__
                scope variables
                | where name == "$__docgen__"
                | to json
            '
            | from json
            | update name { str replace '__docgen__' $mod.module }
        }
    }
    | flatten fill-in
    | to json
}
