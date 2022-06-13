const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
module.exports = {
   mode: "production",
   entry: {
      background: path.resolve(__dirname, "..", "src", "background.ts"),
      contentScript: path.resolve(__dirname, "..", "src", "contentScript.ts"),
   },
   output: {
      path: path.join(__dirname, "../dist"),
      filename: "[name].js",
   },
   resolve: {
      extensions: [".ts", ".js"],
   },
   module: {
      rules: [
         {
            test: /\.tsx?$/,
            loader: "ts-loader",
            exclude: /node_modules/,
         },
      ],
   },
   plugins: [
      new CopyPlugin({
         patterns: [
            { from: ".", to: ".", context: "public" },
            { from: "icon", to: ".", context: "pic", filter: (file) => file.endsWith(".png") },
            { from: "node_modules/assjs/dist/ass.js", to: "ass.min.js" },
            { from: "NOTICE", to: "." },
            { from: "LICENSE", to: "." },
            { from: "README.md", to: "." }
         ]
      }),
   ],
};