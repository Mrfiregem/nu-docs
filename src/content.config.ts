import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { z } from 'astro/zod';

import { execSync } from "node:child_process";
import { parse as parse_json } from 'hjson';
import slugify from '@sindresorhus/slugify';

const signatureSchema = z.array(z.object({
    parameter_name: z.string().nullish(),
    parameter_type: z.enum(['input', 'output', 'positional', 'rest', 'named', 'switch']),
    syntax_shape: z.string().nullable(),
    is_optional: z.boolean(),
    short_flag: z.string().length(1).nullable(),
    description: z.string().nullable(),
    parameter_default: z.any(),
}));

const commandSchema = z.object({
    name: z.string(),
    description: z.string(),
    extra_description: z.string(),
    search_terms: z.string(),
    category: z.string().default("default"),
    type: z.enum(['built-in', 'keyword', 'plugin', 'custom']),
    signatures: z.record(z.string(), signatureSchema),
    plugin_file: z.string().nullable(),
    deprecated: z.boolean(),
}).transform(data => ({
    ...data,
    /** Unique ID to identify command, used in links */
    get id(): string { return slugify(data.name) },
    /** List of `{input, output}` pairs the command supports */
    get input_output_pairs() {
        return Object.values(data.signatures).map(pgroup => Object
            .fromEntries(
                pgroup
                    .filter(param => ['input', 'output'].includes(param.parameter_type))
                    .map(({ parameter_type, syntax_shape }) => [parameter_type, syntax_shape ?? 'switch'])
            ) as { input: string, output: string })
    },
    /** The short signature overview, e.g. `ls {flags} ...rest` */
    get signature_string(): string {
        const positional = Object.values(data.signatures)[0].map(p => {
            switch (p.parameter_type) {
                case 'positional': return `(${p.parameter_name})`;
                case 'rest': return '...rest';
                default: return null;
            }
        }).filter(Boolean).join(' ');
        return [data.name, '{flags}', positional].filter(Boolean).join(' ');
    },
    /** The signature filtered to just boolean switches and flags taking values */
    get flags(): Signature {
        return Object.values(data.signatures)[0]
            .filter((param) => ['named', 'switch'].includes(param.parameter_type));
    },
    /** The signature filtered to just positional arguments and an optional rest argument */
    get positionals(): Signature {
        return Object.values(data.signatures)[0]
            .filter(param => ['positional', 'rest'].includes(param.parameter_type));
    }
}));

type Signature = z.infer<typeof signatureSchema>;
export type Command = z.infer<typeof commandSchema>;

const stdlibSchema = z.object({
    /** Module name, e.g. `iter` */
    module: z.string(),
    /** Library name: `std` or `std-rfc` */
    library: z.enum(['std', 'std-rfc']),
    /** Path to the module, e.g. `std/iter/mod.nu` */
    path: z.string(),
    /** List of commands provided by module */
    commands: z.array(commandSchema),
    /** List of variables provided by module */
    variables: z.array(z.object({
        name: z.string(),
        type: z.string(),
        value: z.any(),
        is_const: z.boolean(),
    })),
});

type Stdlib = z.infer<typeof stdlibSchema>;

export const collections = {
    docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
    commands: defineCollection({
        loader: () => {
            const output = execSync(`./loader.nu commands`, {
                encoding: 'utf-8', cwd: 'src/data', maxBuffer: 1024 * 1024 * 8
            });
            const data = parse_json(output);
            const result = data.map((cmd: Command) => ({
                ...cmd,
                id: slugify(cmd.name),
                signature: Object.values(cmd.signatures)[0].filter((param) => ['input', 'output'].includes(param.parameter_type)),
                input_output_pairs: Object.values(cmd.signatures).map(pgroup => Object.fromEntries(pgroup.filter(param => ['input', 'output'].includes(param.parameter_type)).map(({ parameter_type, syntax_shape }) => [parameter_type, syntax_shape]))),
                get signature_string(): string {
                    const positional = this.signature.map(p => {
                        switch (p.parameter_type) {
                            case 'positional': return `(${p.parameter_name})`;
                            case 'rest': return '...rest';
                            default: return null;
                        }
                    }).join(' ');
                    return [this.name, '{flags}', positional].filter(Boolean).join(' ');
                },
                get flags(): Signature {
                    return this.signature.filter((param) => ['named', 'switch'].includes(param.parameter_type));
                }
            }));
            console.log(result);
            return result;
        },
        schema: commandSchema,
    }),
    stdlib: defineCollection({
        loader: () => {
            const output = execSync(`./loader.nu stdlib`, {
                encoding: 'utf-8', cwd: 'src/data', maxBuffer: 1024 * 1024 * 8
            });
            const data = parse_json(output);
            return data.map((lib: Stdlib) => ({
                ...lib,
                id: slugify(lib.library + '-' + lib.module),
            }));
        },
        schema: stdlibSchema,
    }),
};
