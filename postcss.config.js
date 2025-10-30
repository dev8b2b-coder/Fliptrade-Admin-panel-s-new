function resolvePlugin(moduleName) {
  try {
    // Prefer resolving relative to this project
    require.resolve(moduleName, { paths: [__dirname] })
    return moduleName
  } catch (_) {
    return null
  }
}

const tailwindPlugin =
  // Prefer the v4 PostCSS package when available (e.g., on Vercel)
  resolvePlugin("@tailwindcss/postcss") ||
  // Fallback for environments expecting classic plugin name
  resolvePlugin("tailwindcss")

module.exports = {
  plugins: tailwindPlugin
    ? [require(tailwindPlugin), require("autoprefixer")]
    : [require("autoprefixer")],
}
