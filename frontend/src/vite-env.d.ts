/// <reference types="vite/client" />

/** SVG imports return a URL string in the Vite bundle. */
declare module "*.svg" {
  const src: string;
  export default src;
}
