/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig} */
export default {
  compilerOptions: {
    warningFilter: (warning) => {
      // Ignore a11y warnings for custom elements like FluentUI elements
      return !warning.code.startsWith('a11y_');
    }
  }
}
