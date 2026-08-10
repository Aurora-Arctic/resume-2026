import React, { type ReactElement } from 'react';

interface BulletsEllipsisProps {
  className: string;
}

const BulletsEllipsis = ({ className }: BulletsEllipsisProps): ReactElement => (
  <span className={className} aria-hidden="true">
    &hellip;
  </span>
);

export default BulletsEllipsis;
