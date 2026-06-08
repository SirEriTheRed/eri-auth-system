export default {
  "*.{js,ts}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"],
  "*.ts": ["bash -c 'npm run type-check'"]
};
