import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Arrow-key navigation for a container of button groups.
 *
 * Wrapper divs inside the container should carry `data-nav-group` to
 * form navigable rows.  Left/Right moves within a row, Up/Down jumps
 * between rows, and Enter activates the focused button.
 *
 * Skips interception when a range input (slider) is focused so that
 * native slider behavior is preserved.
 */
export function useArrowNav(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const NAV_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (!NAV_KEYS.includes(e.key)) return;

      const container = containerRef.current;
      if (!container) return;

      // Don't intercept when a slider (range input) is focused —
      // arrow keys are its native control.
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active.type === 'range') return;

      // Collect button groups in DOM order
      const groupEls = Array.from(
        container.querySelectorAll<HTMLElement>('[data-nav-group]'),
      );
      if (groupEls.length === 0) return;

      const groups = groupEls
        .map(g => Array.from(g.querySelectorAll<HTMLButtonElement>('button')))
        .filter(arr => arr.length > 0);

      if (groups.length === 0) return;

      // Locate currently focused button within the groups
      let gIdx = -1;
      let bIdx = -1;
      for (let gi = 0; gi < groups.length; gi++) {
        const idx = groups[gi].indexOf(active as HTMLButtonElement);
        if (idx !== -1) {
          gIdx = gi;
          bIdx = idx;
          break;
        }
      }

      // Nothing focused yet — first arrow press enters the grid
      if (gIdx === -1) {
        e.preventDefault();
        groups[0][0]?.focus();
        return;
      }

      e.preventDefault();

      let tg = gIdx;
      let tb = bIdx;

      switch (e.key) {
        case 'ArrowRight':
          tb = Math.min(bIdx + 1, groups[gIdx].length - 1);
          break;
        case 'ArrowLeft':
          tb = Math.max(bIdx - 1, 0);
          break;
        case 'ArrowDown':
          tg = Math.min(gIdx + 1, groups.length - 1);
          tb = Math.min(bIdx, groups[tg].length - 1);
          break;
        case 'ArrowUp':
          tg = Math.max(gIdx - 1, 0);
          tb = Math.min(bIdx, groups[tg].length - 1);
          break;
      }

      groups[tg][tb]?.focus();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [containerRef]);
}
