import nextConfig from "eslint-config-next";

// eslint-config-next ships a native ESLint flat-config array directly — no
// @eslint/eslintrc FlatCompat shim needed (that shim is for the older
// .eslintrc-style "extends" strings and chokes on this package's already-flat,
// function-containing plugin objects).
export default nextConfig;
