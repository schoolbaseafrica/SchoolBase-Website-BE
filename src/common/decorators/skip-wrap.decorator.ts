import { SetMetadata } from '@nestjs/common';

export const SKIP_WRAP = 'skip_wrap';

export const SkipWrap = () => SetMetadata(SKIP_WRAP, true);
