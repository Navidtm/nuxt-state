# Bundle-size benchmark

This benchmark compares the production client JavaScript added by `nuxt-state`
and `@pinia/nuxt` for the same small counter.

It builds three Nuxt applications:

- `baseline`: the same UI backed by Nuxt's built-in `useState`
- `nuxt-state`: the UI backed by this repository's production package build
- `pinia`: the UI backed by `@pinia/nuxt` and Pinia

The report includes the total client JavaScript and the incremental cost over
the baseline in raw, gzip, and Brotli bytes. Compression is calculated per
generated JavaScript asset to approximate normal HTTP delivery.

Run it from the repository root:

```sh
pnpm bench:bundle-size
```

Results are written to `benchmarks/bundle-size/results/latest.json` and are not
committed because filenames and compression output can vary with the toolchain.
