import { useEffect, useState } from 'react';

export function useSlowHint(active, delay = 3000) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [active, delay]);

  return show;
}
