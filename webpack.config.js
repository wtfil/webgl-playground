const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
        })
    ],
    devServer: {
        contentBase: path.join(__dirname, 'public'),
        port: 8090
    }
};
