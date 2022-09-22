const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlMinimizerPlugin = require('html-minimizer-webpack-plugin');
const JsonMinimizerPlugin = require('json-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
    mode: 'production',
    // devtool: "source-map",  // source-map cannot work with content-script
    devtool: 'inline-source-map',
    // experiments: { topLevelAwait: true },
    entry: {
        background: path.resolve(__dirname, 'src', 'background.ts'),
        contentScript: path.resolve(__dirname, 'src', 'contentScript.scss'),
        contentScript: path.resolve(__dirname, 'src', 'contentScript.ts'),
        popup: path.resolve(__dirname, 'src', 'popup.ts'),
    },
    output: {
        path: path.join(__dirname, 'dist'),
        clean: true,
        filename: '[name].js',
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.html$/i,
                type: 'asset/resource',
            },
            {
                test: /\.json$/i,
                type: 'asset/resource',
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test: /\.s[ac]ss$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'node_modules/assjs/dist/ass.js', to: 'assets/assjs/ass.min.js' },
                { from: 'node_modules/assjs/LICENSE', to: 'assets/assjs/' },
                {
                    from: 'node_modules/bootstrap/dist/js/bootstrap.min.js',
                    to: 'assets/bootstrap/',
                },
                {
                    from: 'node_modules/bootstrap/dist/js/bootstrap.min.js.map',
                    to: 'assets/bootstrap/',
                },
                {
                    from: 'node_modules/bootstrap/dist/css/bootstrap.min.css',
                    to: 'assets/bootstrap/',
                },
                {
                    from: 'node_modules/bootstrap/dist/css/bootstrap.min.css.map',
                    to: 'assets/bootstrap/',
                },
                { from: 'node_modules/bootstrap/LICENSE', to: 'assets/bootstrap/' },
                {
                    from: 'node_modules/bootstrap-icons/font/bootstrap-icons.css',
                    to: 'assets/bootstrap/',
                },
                { from: 'node_modules/bootstrap-icons/font/fonts', to: 'assets/bootstrap/fonts' },
                { from: 'node_modules/bootstrap-icons/LICENSE.md', to: 'assets/bootstrap/' },

                { from: 'manifest.json', to: '.' },
                {
                    from: 'icon',
                    to: 'assets/icon',
                    context: 'pic',
                    filter: (file) => file.endsWith('.png'),
                },
                {
                    from: '_locales',
                    to: '_locales',
                },
                { from: 'NOTICE', to: '.' },
                { from: 'LICENSE', to: '.' },
                { from: 'README.md', to: '.' },
                { from: 'src/*.html', to: '[name][ext]' },
                { from: 'src/*.css', to: '[name][ext]' },
            ],
        }),
        new MiniCssExtractPlugin(),
    ],
    optimization: {
        minimize: true,
        minimizer: [
            // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
            `...`,
            new HtmlMinimizerPlugin(),
            new JsonMinimizerPlugin(),
            new CssMinimizerPlugin(),
        ],
    },
};
