# ScottyCon Website
A React + Typescript port of the WiX-hosted ScottyCon website, for ease of maintenance and updates in the future.

## Development Setup
1. Ensure that you have [Node.js](https://nodejs.org/en/download) installed and working on your computer.
2. Clone this repository (use HTTPS as below or switch to SSH).
```bash
git clone https://github.com/ScottyCon-CMU/scottycon-website.git

cd scottycon-website
```
3. Install the packages for the repository, then run the development build.
```bash
npm install

npm run dev
```

## Contributing Conventions
### Repository Breakdown
The repository is split into the following sections. When adding new features, pay most attention to the `assets/` folder, which holds static files and images, `components/` folder, which includes shared UI components used in multiple pages, and `pages/` folder, which has one file for each page.
```
scottycon-website/
├── public/                  # Static files served as-is at the site root
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/              # Images and other assets imported by components
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── components/          # Shared UI used across pages
│   │   ├── Footer.tsx
│   │   ├── Layout.tsx
│   │   └── Navbar.tsx
│   ├── pages/               # One component per site page/route
│   │   ├── Activities.tsx
│   │   ├── Home.tsx
│   │   ├── Info.tsx
│   │   ├── Maps.tsx
│   │   ├── Registration.tsx
│   │   ├── Sponsors.tsx
│   │   └── Vendors.tsx
│   ├── App.css
│   ├── App.tsx              # Top-level app component and routes
│   ├── index.css            # Global styles
│   └── main.tsx             # Entry point; mounts the app
├── eslint.config.js
├── index.html               # HTML shell loaded by Vite
├── package.json
├── tsconfig.json            # TypeScript config (references app/node configs)
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

### Developing Pages
When developing a page, refer to the [Website Spec](https://docs.google.com/document/d/1b16ZsI2Nslg1vouL_OrdlnCVCXEja8ohr4JFGcbXRmk/edit?tab=t.0), which includes the overarching design philosophy and individual page components ad information that will go on each page.

### Commits and PRs
When working on a new feature, open up a branch in the repository (typically based on `main`) for your feature. When making commits to that branch, name your commits as follows:
```
<commit type>: <commit message>

feat: major feature and associated work
chore: adding data, updating documentation
fix: fix a bug or a very quick edit
```

When you think you have made good progress or want some feedback, open up a pull request (PR) on GitHub (with some comments on what you have made and how it works). A tech lead will review your PR and provide feedback.