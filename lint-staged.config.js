export default {
  "*.{js,ts}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"],
  "*.ts": ["npm run type-check"]
};
