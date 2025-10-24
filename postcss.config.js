// postcss.config.js (PROJECT root)
module.exports = {
    plugins: [
      require('postcss-nesting'),
      require('postcss-preset-env')({ stage: 1 }),
      require('autoprefixer'),
    ],
  };
  