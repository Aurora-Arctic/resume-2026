import type { GatsbyNode } from 'gatsby';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

// Opt-in only (`npm run analyze`) — must never run on ordinary builds, since
// the plugin adds real overhead (an extra pass over the webpack stats to
// build the report) that doesn't belong in CI or a normal local build.
export const onCreateWebpackConfig: GatsbyNode['onCreateWebpackConfig'] = ({ actions, stage }) => {
  if (process.env.ANALYZE_BUNDLE !== 'true' || stage !== 'build-javascript') {
    return;
  }

  actions.setWebpackConfig({
    // 'static' writes a self-contained interactive HTML report to disk
    // rather than the default 'server' mode, which starts a long-running
    // HTTP server that never exits on its own — a poor fit for a one-off
    // `npm run analyze` command.
    plugins: [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        reportFilename: 'bundle-report.html',
      }),
    ],
  });
};
