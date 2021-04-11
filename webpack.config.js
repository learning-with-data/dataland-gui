const path = require("path");

const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const nodeExternals = require("webpack-node-externals");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const opts = {
  DEBUG: process.env.NODE_ENV === "development",
};

const commonModule = {
  rules: [
    {
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      use: [
        { loader: "babel-loader" },
        { loader: "ifdef-loader", options: opts },
      ],
    },
    {
      test: /\.(jpg|png|gif|woff|eot|ttf|svg)/,
      use: {
        loader: "url-loader",
        options: {
          limit: 50000,
        },
      },
    },
    {
      test: /\.css$/,
      use: [MiniCssExtractPlugin.loader, "css-loader"],
    },
    {
      test: /\.html$/,
      use: [
        {
          loader: "html-loader",
        },
      ],
    },
  ],
};

module.exports = [
  {
    mode: process.env.NODE_ENV || "development",
    name: "component",
    entry: "./src/index.js",
    module: commonModule,
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin({ parallel: 1 })],
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
      library: "DataLandGui",
      libraryTarget: "umd",
    },
    externals: [nodeExternals()],
    plugins: [
      new CleanWebpackPlugin(),
      new CopyPlugin({
        patterns: [
          {
            from: "./node_modules/blockly/media",
            to: "./blocks-media/",
          },
        ],
      }),
      new MiniCssExtractPlugin({
        filename: "[name].css",
      }),
      new NodePolyfillPlugin()
    ],
  },
  {
    mode: process.env.NODE_ENV || "development",
    name: "demo",
    entry: "./example/example.js",
    module: commonModule,
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
    },
    devtool: "source-map",
    devServer: {
      port: 3000,
      publicPath: "http://localhost:3000/",
    },
    plugins: [
      new CleanWebpackPlugin(),
      new CopyPlugin({
        patterns: [
          {
            from: "./node_modules/blockly/media",
            to: "./blocks-media/",
          },
        ],
      }),
      new HtmlWebPackPlugin({
        template: "./example/example.html",
        filename: "./index.html",
      }),
      new MiniCssExtractPlugin({
        filename: "[name].css",
      }),
      new NodePolyfillPlugin()
    ],
  },
];
