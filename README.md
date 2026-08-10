# Unofficial Nushell Documentation

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

This is a for-fun project made in order to learn Astro. It features a list of base commands and commands from official plugins generated at build time into static pages, and also supports writing guides and documentation using Markdown.

## 🚀 Project Structure

Below is a description of the site's code layout:

```
.
├── public/
├── src/
│   ├── assets/
│   ├── content/
│   │   └── docs/
│   ├── data/
│   │   └── loader.nu
│   ├── pages/
│   │   └── <Astro Pages>
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Starlight looks for `.md` or `.mdx` files in the `src/content/docs/` directory. Each file is exposed as a route based on its file name.

Images can be added to `src/assets/` and embedded in Markdown with a relative link.

Static assets, like favicons, can be placed in the `public/` directory.

Data sources required by a collection loader can be stored in `src/data/`. The `loader.nu` file is run to generate pages for each Nushell command, for example.

If you want to add a page outside of the typical Starlight documentation environment, Astro pages can be placed in `src/pages/` like in normal projects.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## ℹ️ More Information

Check out [Starlight’s docs](https://starlight.astro.build/), or read [the Astro documentation](https://docs.astro.build) for help creating pages.

Go to the [official Nushell docs](https://www.nushell.sh/) to see this project's inspiration.
