/**
 * There is no matching rule for imports that do not begin with "product".
 *
 * The autofix warning should not appear.
 */

import {} from 'product';

import {} from './relative';
