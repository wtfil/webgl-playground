const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    entry: {
        index: './src/index.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
            },
            {
                test: /\.glsl$/,
                loader: 'raw-loader',
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js', '.glsl']
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'public', 'index.html')
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false
        })
    ],
    devServer: {
        contentBase: path.join(__dirname, 'public'),
        stats: {
            modules: false,
            assets: false,
            children: false,
            builtAt: false,
            entrypoints: false
        },
        disableHostCheck: true,
        host: '0.0.0.0',
        port: 8090
    }
};
