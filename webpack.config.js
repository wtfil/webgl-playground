const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    entry: {
        index: './src/index.ts'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    plugins: [
        new HtmlWebpackPlugin()
    ],
    devServer: {
        contentBase: path.join(__dirname, 'src'),
        port: 8090
    }
};
