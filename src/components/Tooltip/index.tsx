import React, { type ReactElement, type ReactNode, cloneElement } from 'react';
import './index.scss';

interface TooltipProps {
  id: string;
  content: ReactNode;
  // Placement is the caller's responsibility, not this component's — the
  // trigger and tooltip render as plain siblings (a Fragment adds no
  // wrapper element), so absolute positioning falls back to whatever
  // positioned ancestor they already share. This class hooks that
  // per-instance placement CSS onto the tooltip bubble.
  className?: string;
  children: ReactElement<React.HTMLAttributes<HTMLElement>>;
}

const Tooltip = ({ id, content, className, children }: TooltipProps): ReactElement => {
  const trigger = cloneElement(children, {
    className: [children.props.className, 'tooltip-trigger'].filter(Boolean).join(' '),
    'aria-describedby': id,
  });

  return (
    <>
      {trigger}
      <span role="tooltip" id={id} className={['tooltip', className].filter(Boolean).join(' ')}>
        {content}
      </span>
    </>
  );
};

export default Tooltip;
