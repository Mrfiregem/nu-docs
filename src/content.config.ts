import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { z } from 'astro/zod';

import { execSync } from "node:child_process";
import { parse as parse_json } from 'hjson';
import slugify from '@sindresorhus/slugify';

export const collections = {
    docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
    commands: defineCollection({
        loader: () => {
            const output = execSync(`./loader.nu commands`, {
                encoding: 'utf-8', cwd: 'src/data', maxBuffer: 1024 * 1024 * 8
            });
            const data = parse_json(output);
            return data.map((cmd: { [key: string]: any }) => ({
                ...cmd,
                id: slugify(cmd.name),
            }));
        },
        schema: z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            extra_description: z.string(),
            search_terms: z.string(),
            category: z.string().default("default"),
            type: z.string(),
            sig_str: z.string(),
            plugin_file: z.string().nullable(),
            in_out_types: z.array(
                z.object({
                    input: z.string(),
                    output: z.string(),
                })
            ),
            flags: z.array(
                z.object({
                    parameter_name: z.string(),
                    parameter_type: z.enum(['named', 'switch']),
                    syntax_shape: z.string().nullish(),
                    is_optional: z.boolean(),
                    short_flag: z.string().length(1).nullish(),
                    description: z.string(),
                    parameter_default: z.string().nullish(),
                })
            ),
            deprecated: z.boolean(),
        }),
    }),
    stdlib: defineCollection({
        loader: () => {
            const output = execSync(`./loader.nu stdlib`, {
                encoding: 'utf-8', cwd: 'src/data', maxBuffer: 1024 * 1024 * 8
            });
            const data = parse_json(output);
            return data.map((lib: { [key: string]: any }) => ({
                ...lib,
                id: slugify(lib.library + '/' + lib.name),
            }));
        },
        schema: z.object({
            id: z.string(),
            library: z.string(),
            name: z.string(),
            commands: z.array(z.object({
                name: z.string(),
                description: z.string(),
                extra_description: z.string(),
            })),
        }),
    }),
};
