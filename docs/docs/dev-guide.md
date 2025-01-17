## Setup

### Local
- Clone repo & switch to latest node version using node version manager
- run ```npm install``` in base directory to download all dependencies
- run ```npm run dev``` to start dev server, local CORS proxy

### Docker
- run ```docker compose watch``` from base directory. It will build image, start dev server, local CORS proxy.  
It watches for file changes, it will reload dev server on code changes.
It will rebuild image for package.json changes
- To shutdown dev server, run ```shutdown.sh``` for executing ```docker compose down``` and ```docker image prune -f```. Image prune is useful as dangling images might be created due to package.json changes

## Technical Details

### Tech Stack
- Angular Material for UI
- Tailwind for styling instead of angular scss. Angular scss is still used when overriding styles is needed
- Luxon lib for handling dates
- immutable js for lists, maps

### Code guidelines
- All components must be standalone
- All components must be built in reactive style, And have Change detection as OnPush
- All state objects must be immutable
- Every code change must be covered in unit tests, doc tests along with doc changes

## PR Guidelines
- After changes, code should still have 100% coverage in all categories (line, branch, functions, statements)
- If changes are made to doc tests, relevant doc section also need to be updated. Docs will be re-generated during coverage check
- Updated build has to be checked in to docs folder. It can be done by running ```npm run build```