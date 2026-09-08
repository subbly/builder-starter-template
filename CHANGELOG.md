# subbly-builder-default

## 0.0.20

### Patch Changes

- Site version 1.2.0. Align react-dom with react at ^19.2.8, fix the @types/react overrides, bump next-intl@^4.14.2, add `agentRules: false` to next.config, trim the oxlint ignore list to paths that exist in a site, and sync the Subbly components with the registry (SubblyScript config props, apiUrl in api.ts, currencyCode in useFormatAmount, quantity fallback in the product form)

## 0.0.19

### Patch Changes

- Bump next@16.3.4

## 0.0.18

### Patch Changes

- Pin netlify-cli to 27.5.0 and install agent-browser in the prod image too. Add Python (python3 and uv with a managed CPython 3.13), tsx, and unzip, zip, file and poppler-utils to the sandbox image so the agent can run Python and TypeScript scripts

## 0.0.17

### Patch Changes

- Drop `.subbly/memory/DESIGN.md`; memory now lives on the project volume

## 0.0.16

### Patch Changes

- Add generate-design-inspiration-image and image-to-code skills
- Update project onboarding skill. Added a request_info intake form and brand color role rotation across the four design-system variants
- Skip deps-watcher installs when package.json and the lockfile are unchanged
- Bump next@16.3.0, react@19.2.8, typescript@7

## 0.0.15

### Patch Changes

- Add archives extensions to gitignore

## 0.0.14

### Patch Changes

- Correcting next.config.ts option for logs to console from browser

## 0.0.13

### Patch Changes

- Add project onboarding skill

## 0.0.12

### Patch Changes

- Add memory subbly-dev watchdog script

## 0.0.11

### Patch Changes

- Bump @subbly/api-client@0.6.25, @subbly/sdk@0.6.25, @subbly/kit@0.0.35, @subbly/react@0.0.35

## 0.0.10

### Patch Changes

- Update visual-content skills with actual editable fields

## 0.0.9

### Patch Changes

- Add visual-edits skill

## 0.0.8

### Patch Changes

- Bump @subbly/kit@0.0.31, @subbly/react@0.0.31

## 0.0.7

### Patch Changes

- Bump @subbly/kit@0.0.30, @subbly/react@0.0.30

## 0.0.6

### Patch Changes

- Remove llms.md

## 0.0.5

### Patch Changes

- Replace eslint with oxlint with custom rules.

## 0.0.4

### Patch Changes

- Add noUncheckedSideEffectImports=false for tsconfig.json. Note: prepare for tsgo.

## 0.0.3

### Patch Changes

- Bump @subbly/kit@0.0.29, @subbly/react@0.0.29

## 0.0.2

### Patch Changes

- Bump @subbly/kit@0.0.28, @subbly/react@0.0.28
- Handle out of stock in the product form
- Render product plan description as HTML
- Preselect groups with a single item in the single product bundle layout, disable add to cart if one of bundle groups has all items out of stock

## 0.0.1

### Patch Changes

- Integrate semantic versioning with changeset
