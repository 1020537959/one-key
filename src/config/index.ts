import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
const active = {
  local: 'config.local.yml',
  dev: 'config.dev.yml',
  prod: 'config.prod.yml',
};

export default () => {
  return yaml.load(
    readFileSync(
      join(__dirname, active[process.env.NODE_ENV] as string) as string,
    ),
  );
};
