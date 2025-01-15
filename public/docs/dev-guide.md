## Setup
- Clone repo & switch to latest node version using node version manager
- run "npm install" in base directory to download all dependencies
- run "npm run dev" to start dev server, local CORS proxy

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
- If changes are made to doc tests, relevant docs also need to be updated & re-generated
- New build should be checked in to release folder for github page