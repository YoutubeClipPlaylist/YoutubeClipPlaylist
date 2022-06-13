const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");
const JsonMinimizerPlugin = require("json-minimizer-webpack-plugin");

module.exports = {
   mode: "production",
   entry: {
      background: path.resolve(__dirname, "..", "src", "background.ts"),
      contentScript: path.resolve(__dirname, "..", "src", "contentScript.ts"),
      popup: path.resolve(__dirname, "..", "src", "popup.ts"),
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
         {
            test: /\.html$/i,
            type: "asset/resource",
         },
         {
            test: /\.json$/i,
            type: "asset/resource",
         },
      ],
   },
   plugins: [
      new CopyPlugin({
         patterns: [
            { from: "src/*.html", to: "[name][ext]" },
            { from: "manifest.json", to: "." },
            { from: "icon", to: ".", context: "pic", filter: (file) => file.endsWith(".png") },
            { from: "node_modules/assjs/dist/ass.js", to: "ass.min.js" },
            { from: "node_modules/bootstrap/dist/css/bootstrap.min.css", to: "bootstrap.min.css" },
            { from: "NOTICE", to: "." },
            { from: "LICENSE", to: "." },
            { from: "README.md", to: "." }
         ]
      }),
   ],
   optimization: {
      minimize: true,
      minimizer: [
         // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
         `...`,
         new HtmlMinimizerPlugin(),
         new JsonMinimizerPlugin(),
      ],
   },
};