import React, { type ReactElement } from 'react';
import { TOOLTIP_STORAGE_KEY, TOOLTIP_RESTORE_EVENT } from '../Tooltip';
import './index.scss';

const handleRestore = (): void => {
  try {
    window.localStorage.removeItem(TOOLTIP_STORAGE_KEY);
  } catch {
    // localStorage unavailable — nothing was persisted to clear; currently
    // mounted tooltips are still restored for this page view via the event below
  }
  window.dispatchEvent(new Event(TOOLTIP_RESTORE_EVENT));
};

const RestoreTooltips = (): ReactElement => (
  <button type="button" className="restore-tooltips" onClick={handleRestore}>
    I Need Tooltips
  </button>
);

export default RestoreTooltips;
